import { Router } from "express";
import { getUserByIdController } from "../../controllers/user/userController";
import { authMiddleware } from "../../middlewares/auth/authMiddleware";
import { minuteLimiter, dailyLimiter } from "../../middlewares/rateLimit/rateLimitMiddleware";

const router = Router();

router.get("/me", authMiddleware, minuteLimiter, dailyLimiter, getUserByIdController);

export default router;
