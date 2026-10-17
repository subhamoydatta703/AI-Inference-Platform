import { type Response } from "express"
import type { AuthenticatedRequest } from "../../middlewares/auth/authMiddleware"
import { createApiKeyService, deleteApiKeyService } from "../../services/apiKey/apiKeyService";
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
        if(!generatedApiKey.success){
            if(generatedApiKey.message === "MAX_LIMIT_EXCEEDED"){
            const errorResponse: ApiErrorResponse = {
                success: false,
                status: 'error',
                code: 'MAX_LIMIT_EXCEEDED',
                message: `You have reached the maximum limit of 5 API keys.`,
                details: 'Delete an existing API key to create more keys.'
            }
            
            return res.status(403).json(errorResponse)
        }
        }
        
        return res.status(201).json({
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


export const deleteApiKeyController = async(req: AuthenticatedRequest, res: Response)=>{
    try {
        
        const userId = req.userId
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
            });
        }

        const apiKeyId = req.params.id as string
        if (!apiKeyId) {
      return res.status(400).json({ success: false, message: "API Key ID is required" });
    }

    const deletedApiKey = await deleteApiKeyService(userId, apiKeyId)
    if (!deletedApiKey.success) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        status: 'error',
        code: 'NOT_FOUND',
        message: `API key not found`,
        details: 'The API key you are trying to delete does not exist.'
      }

      return res.status(404).json(errorResponse)
    }
    
    return res.status(200).json({
      success: true,
      message: "API key deleted successfully",
    });



    } catch (error) {
        console.error("Error in deleteApiKeyController:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
        
    }
}