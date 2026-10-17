import { response, type Response } from "express"
import type { AuthenticatedRequest } from "../../middlewares/auth/authMiddleware"
import { createApiKeyService } from "../../services/apiKey/apiKeyService";
import type { ApiErrorResponse } from "../../utils/types/apiKeyError";
import { success } from "zod";




// create api key controller

export const createApiKeyController = async (req: AuthenticatedRequest, res: Response) => {

    try {
        
        const userId = req.userId
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
            });
        }

        const generatedApiKey = await createApiKeyService(userId)
        if(!generatedApiKey.success && generatedApiKey.data===null){
            const errorResponse: ApiErrorResponse = {
                success: false,
                status: 'error',
                code: 'MAX_LIMIT_EXCEEDED',
                message: `You have reached the maximum limit of 5 API keys.`,
                details: 'Delete an existing API key to create more keys.'
            }
            
            return res.status(403).json(errorResponse)
        }
        
        return response.status(201).json({
            success: true,
            data: generatedApiKey.data
            
        })





    } catch (error) {
        console.error("Error in createApiKeyController", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null,
        });
    }
    
}