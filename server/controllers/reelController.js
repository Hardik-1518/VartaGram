import fs from 'fs';
import path from 'path';
import Reel from '../models/Reel.js';
import User from '../models/User.js';
import cloudinary from '../configs/cloudinary.js';

const uploadVideoToCloudinary = async (videoPath, filename) => {
  const result = await cloudinary.uploader.upload(videoPath, {
    resource_type: 'video',
    folder: 'reels',
    public_id: path.parse(filename).name,
    chunk_size: 6000000,
    eager: [
      { width: 720, height: 1280, crop: 'limit', quality: 'auto' },
      { width: 480, height: 852, crop: 'limit', quality: 'auto' }
    ]
  });
  return result.secure_url;
};

export const uploadReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { caption = '' } = req.body;
    const video = req.file;

    if (!video) {
      return res.status(400).json({ success: false, message: 'Reel video is required' });
    }

    // Verify Cloudinary is configured
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      // cleanup temp file
      try { if (fs.existsSync(video.path)) fs.unlinkSync(video.path) } catch(e){}
      return res.status(500).json({ success: false, message: 'Cloudinary credentials are missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.' });
    }

    // Ensure uploaded file exists on disk
    if (!fs.existsSync(video.path)) {
      return res.status(500).json({ success: false, message: 'Uploaded video file not found on server.' });
    }

    let videoUrl;
    try {
      videoUrl = await uploadVideoToCloudinary(video.path, video.originalname);
    } catch (uploadErr) {
      console.error('Cloudinary upload error:', uploadErr);
      try { if (fs.existsSync(video.path)) fs.unlinkSync(video.path) } catch(e){}
      return res.status(500).json({ success: false, message: 'Cloudinary upload failed: ' + (uploadErr.message || String(uploadErr)) });
    }

    const reel = await Reel.create({
      user: userId,
      caption,
      video_url: videoUrl
    });

    try { if (fs.existsSync(video.path)) fs.unlinkSync(video.path) } catch(e){}

    res.json({ success: true, reel, message: 'Reel uploaded successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.params;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (reel.user !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Reel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReels = async (req, res) => {
  try {
    const { userId } = req.auth();
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 6, 12);
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    const feedUsers = [userId, ...(user?.following || []), ...(user?.connections || [])];

    const total = await Reel.countDocuments({ user: { $in: feedUsers } });
    const reels = await Reel.find({ user: { $in: feedUsers } })
      .populate('user', 'full_name username profile_picture')
      .populate({ path: 'comments.user', select: 'full_name username profile_picture' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, reels, page, total, hasMore: skip + reels.length < total });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likeReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { reelId } = req.body;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (reel.likes.includes(userId)) {
      reel.likes = reel.likes.filter((id) => id !== userId);
      await reel.save();
      return res.json({ success: true, liked: false, likes: reel.likes.length });
    }

    reel.likes.push(userId);
    await reel.save();
    res.json({ success: true, liked: true, likes: reel.likes.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const commentReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { reelId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    reel.comments.push({ user: userId, text: text.trim() });
    await reel.save();

    await reel.populate({ path: 'comments.user', select: 'full_name username profile_picture' });

    res.json({ success: true, comment: reel.comments.at(-1), comments: reel.comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const shareReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { reelId } = req.body;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (!reel.share_count.includes(userId)) {
      reel.share_count.push(userId);
      await reel.save();
    }

    res.json({ success: true, shareCount: reel.share_count.length });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveReel = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { reelId } = req.body;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (reel.saved_by.includes(userId)) {
      reel.saved_by = reel.saved_by.filter((id) => id !== userId);
      await reel.save();
      return res.json({ success: true, saved: false });
    }

    reel.saved_by.push(userId);
    await reel.save();
    res.json({ success: true, saved: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
