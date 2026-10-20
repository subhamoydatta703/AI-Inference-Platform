import type { Request, Response, NextFunction } from "express";

import { verifyApiKeyService } from "../../services/apiKey/apiKeyService";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// verify api key
export const apiKeyMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        // checking header for token
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Api Key missing"
            })
        }
        // slicing the token from the header
        const apiKeyString = auth.slice("Bearer ".length).trim();
        if (!apiKeyString) {
            return res.status(401).json({ success: false, message: "Api Key missing" });
        }
        // verify the token
        const verifiedApiKey = await verifyApiKeyService(apiKeyString)
        if (!verifiedApiKey.success && verifiedApiKey.message === "Internal server error") {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!verifiedApiKey.success || !verifiedApiKey.data?.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid Api Key"
            });
        }
        // send response
        req.userId = verifiedApiKey.data.userId;
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
