import Reel from '../models/Reel.js';
import User from '../models/User.js';

/**
 * Upload reel metadata (video already uploaded to Cloudinary)
 * Lightweight endpoint that only saves metadata to database
 * No file handling, no backend processing
 */
export const uploadReelMetadata = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { video_url, caption = '', duration, file_size, cloudinary_public_id } = req.body;

    // Validate required fields
    if (!video_url) {
      return res.status(400).json({ success: false, message: 'Video URL is required' });
    }

    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Caption is required' });
    }

    // Validate video URL is from Cloudinary (security measure)
    if (!video_url.includes('cloudinary') && !video_url.includes('res.cloudinary')) {
      return res.status(400).json({ success: false, message: 'Invalid video URL' });
    }

    // Create reel with metadata
    const reel = await Reel.create({
      user: userId,
      caption: caption.trim(),
      video_url,
      // Optional metadata for analytics
      ...(duration && { duration }),
      ...(file_size && { file_size }),
      ...(cloudinary_public_id && { cloudinary_public_id })
    });

    res.status(201).json({ 
      success: true, 
      reel,
      message: 'Reel uploaded successfully' 
    });
  } catch (error) {
    console.error('Reel metadata save error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to save reel' 
    });
  }
};

/**
 * Legacy upload endpoint - DEPRECATED
 * Kept for backward compatibility, but not recommended
 * Frontend should use Cloudinary direct upload instead
 */
export const uploadReel = async (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Backend video upload is deprecated. Please use Cloudinary direct upload.',
    learnMore: 'https://vartagram.docs/reel-upload-migration'
  });
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
    const limit = Math.min(Number(req.query.limit) || 6, 12); // Max 12 reels per page
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    const feedUsers = [userId, ...(user?.following || []), ...(user?.connections || [])];

    // Use aggregation pipeline to avoid N+1 query problem
    const reels = await Reel.aggregate([
      { $match: { user: { $in: feedUsers } } },
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

    const total = await Reel.countDocuments({ user: { $in: feedUsers } });
    const hasMore = skip + reels.length < total;

    res.json({ success: true, reels, page, total, hasMore });
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
