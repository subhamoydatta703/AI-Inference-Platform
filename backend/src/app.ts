import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
import { clerkMiddleware } from '@clerk/express';

const app = express();

const allowedOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:3002'
).split(',').map(origin => origin.trim()).filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
}), userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
