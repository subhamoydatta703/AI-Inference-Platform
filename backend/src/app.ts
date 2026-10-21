import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
import apiKeyRoutes from './routes/apiKey/apiKeyRoutes';
import queryRoutes from './routes/query/queryRoutes';
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
    exposedHeaders: ['Retry-After'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1/users", clerkMiddleware(), userRoutes);
app.use("/api/v1/api-keys", clerkMiddleware(), apiKeyRoutes);
app.use("/api/v1/queries", queryRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
