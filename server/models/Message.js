import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    from_user_id: {type: String, ref: 'User', required: true},
    to_user_id: {type: String, ref: 'User', required: true},
    text: {type: String, trim: true},
    message_type: {type: String, enum: ['text', 'image'] },
    media_url: {type: String},
    seen: {type: Boolean, default: false }
}, { timestamps: true, minimize: false })

// Add indexes for frequently queried fields
messageSchema.index({ from_user_id: 1 });
messageSchema.index({ to_user_id: 1 });
messageSchema.index({ createdAt: -1 });
// Compound index for message queries - critical for chat performance
messageSchema.index({ from_user_id: 1, to_user_id: 1, createdAt: -1 });
messageSchema.index({ to_user_id: 1, seen: 1 }); // For fetching unseen messages

const Message = mongoose.model('Message', messageSchema);

export default Message;