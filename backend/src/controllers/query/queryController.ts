import {type Response } from 'express';
import { type AuthenticatedRequest } from '../../middlewares/auth/authMiddleware';
import { type QueryFormat } from '../../utils/types/query/queryFormat';
import { QuerySchema } from '../../utils/validation/query/queryValidation';

export const queryController = async(req: AuthenticatedRequest, res: Response)=>{
    try {
        const userId = req.userId

        if(!userId){
            return res.status(401).json({
                success:false,
                message: "Unauthorized user"
            })
        }

        if(!req.body){
            return res.status(400).json({
                success:false,
                message: "Bad request - Invalid Request"
            })
        }

        const parsed = QuerySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid query",
                errors: parsed.error.issues,
            });
        }
        const queryData = parsed.data;
        const query: QueryFormat = {
            query: queryData?.query,
            url: queryData?.url,
            language: queryData?.language,
            code: queryData?.code,
        }


        // query concurrency limiter
        const { queryConcurrencyLimiter } = await import('../../config/concurrency/concurrencyConfig');
        // Load provider configuration only for a valid authenticated query.
        const { OrchestratorService } = await import('../../services/orchestrator/orchestratorService');
        const orchestratorService = new OrchestratorService()
        const orchResponse = await queryConcurrencyLimiter(() => orchestratorService.run(userId, query));
        if (!orchResponse) {
            return res.status(400).json({
                success: false,
                message: "No response from inference engine",
            });
        }


        return res.status(200).json({
            success: true,
            message: "Query processed successfully",
            data: orchResponse,
        })
    } catch (error) {
        console.error("Error in query controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
