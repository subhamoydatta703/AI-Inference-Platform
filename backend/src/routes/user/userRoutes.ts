import { Router } from "express";
import { getUserByIdController } from "../../controllers/user/userController";
import { authMiddleware } from "../../middlewares/auth/authMiddleware";

const router = Router();

router.get("/me", authMiddleware, getUserByIdController);

export default router;