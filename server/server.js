import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import {inngest, functions} from './inngest/index.js'
import {serve} from 'inngest/express'
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import reelRouter from './routes/reelRoutes.js';
import messageRouter from './routes/messageRoutes.js';

const app = express();

try {
	await connectDB();
} catch (err) {
	console.error('Failed to connect to database during startup:', err);
	process.exit(1);
}

// global error handlers to help surface runtime startup issues
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
	process.exit(1);
});
process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Rejection:', reason);
});

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res)=> res.send('Server is running'))
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/reel', reelRouter)
app.use('/api/message', messageRouter)

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`))