import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

// Add User Story
export const addUserStory = async (req, res) =>{
    try {
        const { userId } = req.auth();
        const {content, media_type, background_color} = req.body;
        const media = req.file
        let media_url = ''

        if ((media_type === 'image' || media_type === 'video') && !media) {
            return res.status(400).json({ success: false, message: 'Media file is required for image or video stories.' });
        }

        // upload media to imagekit
        if(media_type === 'image' || media_type === 'video'){
            const fileBuffer = fs.readFileSync(media.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url
        }
        // create story
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        })

        // schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: { storyId: story._id }
        })

        res.json({success: true})

    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Get User Stories with Pagination (Fixed N+1 Query Problem)
export const getStories = async (req, res) =>{
    try {
        const { userId } = req.auth();
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 20, 50); // Max 50 stories per page
        const skip = (page - 1) * limit;

        const user = await User.findById(userId)

        // User connections and followings 
        const userIds = [userId, ...user.connections, ...user.following]

        // Use aggregation pipeline for better performance
        const stories = await Story.aggregate([
            { $match: { user: { $in: userIds } } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: '$user._id',
                        full_name: '$user.full_name',
                        username: '$user.username',
                        profile_picture: '$user.profile_picture'
                    },
                    content: 1,
                    media_url: 1,
                    media_type: 1,
                    views_count: 1,
                    background_color: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        // Get total count for pagination
        const total = await Story.countDocuments({ user: { $in: userIds } });
        const hasMore = skip + stories.length < total;

        res.json({ success: true, stories, page, total, hasMore }); 
    } catch (error) {
       console.log(error);
       res.json({ success: false, message: error.message }); 
    }
}

// Delete a story
export const deleteStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.params;

        const story = await Story.findById(id);
        if (!story) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (story.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Story.findByIdAndDelete(id);
        res.json({ success: true, message: 'Story deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}