import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

// Add Post
export const addPost = async (req, res) => {
    try {

        const { userId } = req.auth()
        const { content, post_type } = req.body

        const images = req.files || []
        let image_urls = []

        if (post_type !== 'text' && images.length === 0) {
            return res.status(400).json({ success: false, message: 'Images are required for image posts.' })
        }

        if (post_type === 'text' && !content?.trim()) {
            return res.status(400).json({ success: false, message: 'Text content is required for text posts.' })
        }

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
// Get Posts with Pagination (Fixed N+1 Query Problem)
export const getFeedPosts = async (req, res) =>{
    try {
        const { userId } = req.auth()
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 10, 50); // Max 50 posts per page
        const skip = (page - 1) * limit;

        const user = await User.findById(userId)

        // User connections and followings 
        const userIds = [userId, ...user.connections, ...user.following]
        
        // Use aggregation pipeline to avoid N+1 query problem
        // This is much more efficient than populate()
        const posts = await Post.aggregate([
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
                $lookup: {
                    from: 'users',
                    localField: 'comments.user',
                    foreignField: '_id',
                    as: 'commentUsers'
                }
            },
            {
                $addFields: {
                    comments: {
                        $map: {
                            input: '$comments',
                            as: 'comment',
                            in: {
                                user: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$commentUsers',
                                                as: 'cu',
                                                cond: { $eq: ['$$cu._id', '$$comment.user'] }
                                            }
                                        },
                                        0
                                    ]
                                },
                                text: '$$comment.text',
                                createdAt: '$$comment.createdAt'
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    commentUsers: 0 // Remove temporary field
                }
            }
        ]);

        // Get total count for pagination metadata
        const total = await Post.countDocuments({ user: { $in: userIds } });
        const hasMore = skip + posts.length < total;

        res.json({ success: true, posts, page, total, hasMore })
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

        if (post.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Post.findByIdAndDelete(id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}