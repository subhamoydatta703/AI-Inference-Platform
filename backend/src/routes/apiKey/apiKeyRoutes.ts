import { Router } from "express";
import { createApiKeyController, deleteApiKeyController, listApiKeysController } from "../../controllers/apiKey/apiKeyController";
import { authMiddleware } from "../../middlewares/auth/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.use((_req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  next();
});
router.get("/", listApiKeysController);
router.post("/", createApiKeyController);
router.delete("/:id", deleteApiKeyController);

export default router;
