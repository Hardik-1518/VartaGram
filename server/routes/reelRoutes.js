import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  uploadReelMetadata,
  uploadReel,
  deleteReel,
  getReels,
  likeReel,
  commentReel,
  shareReel,
  saveReel
} from '../controllers/reelController.js';

const reelRouter = express.Router();

// Direct Cloudinary upload - backend saves metadata only
reelRouter.post('/upload-metadata', protect, uploadReelMetadata);

// Legacy upload (deprecated)
reelRouter.post('/upload', protect, uploadReel);

// Other endpoints
reelRouter.delete('/:id', protect, deleteReel);
reelRouter.get('/all', protect, getReels);
reelRouter.post('/like', protect, likeReel);
reelRouter.post('/comment', protect, commentReel);
reelRouter.post('/share', protect, shareReel);
reelRouter.post('/save', protect, saveReel);

export default reelRouter;
