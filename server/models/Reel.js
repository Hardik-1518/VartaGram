import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
  user: { type: String, ref: 'User', required: true },
  caption: { type: String, trim: true, default: '' },
  video_url: { type: String, required: true },
  watch_count: { type: Number, default: 0 },
  likes: [{ type: String, ref: 'User' }],
  saved_by: [{ type: String, ref: 'User' }],
  share_count: [{ type: String, ref: 'User' }],
  comments: [
    {
      user: { type: String, ref: 'User' },
      text: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true, minimize: false });

const Reel = mongoose.model('Reel', reelSchema);
export default Reel;
