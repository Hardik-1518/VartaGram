import express from 'express';
import { upload } from '../configs/multer.js';
import { protect } from '../middlewares/auth.js';
import { addPost, getFeedPosts, likePost, addComment, sharePost, deletePost } from '../controllers/postController.js';

const postRouter = express.Router()

postRouter.post('/add', protect, upload.array('images', 4), addPost)
postRouter.get('/feed', protect, getFeedPosts)
postRouter.post('/like', protect, likePost)
postRouter.post('/comment', protect, addComment)
postRouter.post('/share', protect, sharePost)
postRouter.delete('/:id', protect, deletePost)
export default postRouter