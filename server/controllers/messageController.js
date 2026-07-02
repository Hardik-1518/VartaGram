import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import groq from "../configs/groq.js";

// Create an object to store SSE connections with timeout tracking
const connections = {};
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

// Cleanup function for dead connections
const cleanupConnection = (userId) => {
    if (connections[userId]) {
        try {
            connections[userId].res.end();
        } catch (e) {
            // Connection already closed
        }
        delete connections[userId];
    }
};

// Controller function for the SSE endpoint
export const sseController = async (req, res)=>{
    const { userId: authUserId } = await req.auth();
    const { userId } = req.params;

    if (authUserId !== userId) {
        return res.status(403).json({ success: false, message: 'SSE subscription user mismatch' });
    }

    console.log('New client connected : ', userId)

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Clean up old connection if exists
    if (connections[userId]) {
        cleanupConnection(userId);
    }

    // Add the client's response object to the connections object
    connections[userId] = { 
        res,
        timeout: setTimeout(() => {
            console.log('Connection timeout for user:', userId);
            cleanupConnection(userId);
        }, CONNECTION_TIMEOUT)
    };

    // Send an initial event to the client
    res.write('log: Connected to SSE stream\n\n');

    // Handle client disconnection
    req.on('close', ()=>{
        // Remove the client's response object from the connections array
        if (connections[userId]) {
            clearTimeout(connections[userId].timeout);
        }
        delete connections[userId];
        console.log('Client disconnected:', userId);
    });

    // Handle errors
    req.on('error', (err) => {
        console.error('SSE error for user', userId, err);
        cleanupConnection(userId);
    });

    res.on('error', (err) => {
        console.error('SSE response error for user', userId, err);
        cleanupConnection(userId);
    });
}

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if(message_type === 'image'){
            const fileBuffer =  fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {format: 'webp'},
                    {width: '1280'}
                ]
            })
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url
        })

        res.json({ success: true, message });

        // Send message to to_user_id using SSE

        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');

        if(connections[to_user_id]){
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }
        
        if (to_user_id === "ai_user" && text) {

  let reply;

  try {

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Varta AI inside a social media platform. Help users with captions, questions and conversations."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "llama-3.1-8b-instant"
    });

    reply = chatCompletion.choices[0].message.content;

  } catch (error) {

    console.log("Groq error:", error.message);
    reply = "Hi! I am Varta AI 🤖. AI service is temporarily unavailable.";

  }

  const aiMessage = await Message.create({
    from_user_id: "ai_user",
    to_user_id: userId,
    text: reply,
    message_type: "text"
  });

  const messageWithUserData = await Message
    .findById(aiMessage._id)
    .populate("from_user_id");

  if (connections[userId]) {
    connections[userId].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
  }

}
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get Chat Messages with Pagination
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 50, 100); // Max 100 messages per page
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId},
            ]
        };

        // Get total message count
        const total = await Message.countDocuments(query);

        // Fetch paginated messages with user population for efficiency
        const messages = await Message.find(query)
            .populate('from_user_id', 'full_name username profile_picture')
            .sort({createdAt: -1})
            .limit(limit)
            .skip(skip);

        // Mark messages as seen only for the current user
        await Message.updateMany(
            {from_user_id: to_user_id, to_user_id: userId}, 
            {seen: true}
        );

        const hasMore = skip + messages.length < total;

        res.json({ success: true, messages: messages.reverse(), page, total, hasMore });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const messages = await Message.find({to_user_id: userId}).populate('from_user_id to_user_id').sort({ createdAt: -1 });

        res.json({ success: true, messages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}