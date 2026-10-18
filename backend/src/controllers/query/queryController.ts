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

        const queryData = QuerySchema.parse(req.body)

        if(!queryData.query){
            return res.status(400).json({
                success:false,
                message: "Please provide a valid query"
            })
        }

        // orchstrator 
        // const orchResponse = await orchService(userId, queryData);
        

        
    } catch (error) {
        
    }
}