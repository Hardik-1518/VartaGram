import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: {type: String, ref: 'User', required: true },
    content: {type: String },
    image_urls: [{type: String }],
    post_type: {type: String, enum: ['text', 'image', 'text_with_image'], required: true },
    likes_count: [{type: String, ref: 'User'}],
    comments: [
        {
            user: { type: String, ref: 'User' },
            text: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    share_count: [{type: String, ref: 'User'}],
}, {timestamps: true, minimize: false})

// Add indexes for frequently queried fields
postSchema.index({ user: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'comments.user': 1 });
postSchema.index({ user: 1, createdAt: -1 }); // Compound index for feed queries

const Post = mongoose.model('Post', postSchema)

export default Post;