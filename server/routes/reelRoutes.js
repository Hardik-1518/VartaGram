import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import {
  uploadReel,
  deleteReel,
  getReels,
  likeReel,
  commentReel,
  shareReel,
  saveReel
} from '../controllers/reelController.js';

const reelRouter = express.Router();

reelRouter.post('/upload', protect, upload.single('video'), uploadReel);
reelRouter.delete('/:id', protect, deleteReel);
reelRouter.get('/all', protect, getReels);
reelRouter.post('/like', protect, likeReel);
reelRouter.post('/comment', protect, commentReel);
reelRouter.post('/share', protect, shareReel);
reelRouter.post('/save', protect, saveReel);

export default reelRouter;
