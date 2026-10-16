import { createUserByIdAndEmail, getUserById } from "../../services/user/userService";
import { type Response } from "express";
import { type AuthenticatedRequest } from "../../middlewares/auth/authMiddleware";
import { clerkClient } from "@clerk/express";


// get user by id
export const getUserByIdController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
                data: null,
            });
        }
        
        const { success, message, data } = await getUserById(userId);

        if (!success) {
            return res.status(400).json({
                success: false,
                message: message,
                data: null,
            });
        }
        
        return res.status(200).json({
            success: true,
            message: message,
            data: data,
        });
        
    } catch (error) {
        console.error("Error in getUserByIdController", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null,
        });
    }

}



// create user by id and email(not required because it is already created by authMiddleware by clerk)
export const createUserByIdAndEmailController = async (req: AuthenticatedRequest, res: Response) => {

try {
const userId = req.userId;

if (!userId) {
    return res.status(401).json({
        success: false,
        message: "Unauthorized",
        data: null,
    });
}

const { success, message, data } = await getUserById(userId);

if(success && data){
    return res.status(200).json({
        success: true,
        message: "User already exists",
        
    });
}

        //  Fetch user data from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "No email associated with this Clerk account",
            });
        }
        const created = await createUserByIdAndEmail(userId, email);

        if (!created.success) {
            return res.status(400).json({
                success: false,
                message: created.message,
                data: null,
            });
        }

        return res.status(201).json({
            success: true,
            message: created.message,
            data: created.data,
        });
    } catch (error) {
        console.error("Error in createUserByIdAndEmailController", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            data: null,
        });
    }
}