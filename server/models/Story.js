import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    user: {type: String, ref: 'User', required: true },
    content: {type: String },
    media_url: {type: String },
    media_type: {type: String, enum: ['text', 'image', 'video']},
    views_count: [{type: String, ref: 'User'}],
    background_color: { type: String  },
}, {timestamps: true, minimize: false})

// Add indexes for frequently queried fields
storySchema.index({ user: 1 });
storySchema.index({ createdAt: -1 });
storySchema.index({ user: 1, createdAt: -1 }); // Compound index for feed queries
// TTL index: automatically delete stories after 24 hours (86400 seconds)
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Story = mongoose.model('Story', storySchema)

export default Story;