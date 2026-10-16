import express from 'express';
import userRoutes from './routes/user/userRoutes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export default app;