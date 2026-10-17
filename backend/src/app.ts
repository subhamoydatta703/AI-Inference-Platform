import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user/userRoutes';
import apiKeyRoutes from './routes/apiKey/apiKeyRoutes';
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
app.use(clerkMiddleware());


app.use("/api/v1/users", userRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;
