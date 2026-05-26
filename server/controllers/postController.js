import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
    try {

        const { userId } = req.auth()
        const { content, post_type } = req.body

        const images = req.files || []   // ✅ important fix

        let image_urls = []

        if (images.length > 0) {
            image_urls = await Promise.all(
                images.map(async (image) => {

                    const fileBuffer = fs.readFileSync(image.path)

                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder: "posts"
                    })

                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: "auto" },
                            { format: "webp" },
                            { width: "1280" }
                        ]
                    })

                    return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })

        res.json({ success: true, message: "Post created successfully" })

    } catch (error) {

        console.log(error)
        res.json({ success: false, message: error.message })

    }
}
// Get Posts
export const getFeedPosts = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)

        // User connections and followings 
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({user: {$in: userIds}})
            .populate('user')
            .populate({ path: 'comments.user', select: 'full_name username profile_picture' })
            .sort({createdAt: -1});

        res.json({ success: true, posts})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Add comment
export const addComment = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { postId, text } = req.body

        if (!text || !text.trim()) {
            return res.json({ success: false, message: 'Comment cannot be empty' })
        }

        const post = await Post.findById(postId)
        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        post.comments.push({ user: userId, text: text.trim() })
        await post.save()
        await post.populate({ path: 'comments.user', select: 'full_name username profile_picture' })

        const newComment = post.comments[post.comments.length - 1]

        res.json({ success: true, message: 'Comment added', comment: newComment })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Share Post
export const sharePost = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { postId } = req.body

        const post = await Post.findById(postId)
        if (!post) {
            return res.json({ success: false, message: 'Post not found' })
        }

        if (post.share_count.includes(userId)) {
            return res.json({ success: true, message: 'Already shared', share_count: post.share_count.length })
        }

        post.share_count.push(userId)
        await post.save()

        res.json({ success: true, message: 'Post shared', share_count: post.share_count.length })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Like Post
export const likePost = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const { postId } = req.body;

        const post = await Post.findById(postId)

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user !== userId)
            await post.save()
            res.json({ success: true, message: 'Post unliked' });
        }else{
            post.likes_count.push(userId)
            await post.save()
            res.json({ success: true, message: 'Post liked' });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.params;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.user !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Post.findByIdAndDelete(id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}