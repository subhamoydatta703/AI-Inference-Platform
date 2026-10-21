import { Router } from "express";
import { queryController } from "../../controllers/query/queryController";
import { apiKeyMiddleware } from "../../middlewares/apiKey/apiKeyMiddleware";
import { minuteLimiter, dailyLimiter } from "../../middlewares/rateLimit/rateLimitMiddleware";

const router = Router();

router.post("/", apiKeyMiddleware, minuteLimiter, dailyLimiter, (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    return queryController(req, res).catch(next);
});

export default router;
