import { prisma } from "../../config/db/db";





// get user by id
export const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
        });
        
        if (!user) {
            return {
                success: false,
                message: "User not found",
                data: null,
            };
        }
    
        return {
            success: true,
            message: "User found",
            data: {
                id: user.id,
                email: user.email,
            },
        };
        
    } catch (error) {
        console.error("Error in getUserById", error);
        return {
            success: false,
            message: "Internal server error",
            data: null,
        };
    }
        
    }




// create user by using id and email

export const createUserByIdAndEmail = async (id: string, email: string) => {
    try {
        const user = await prisma.user.create({
            data: {
                id: id,
                email: email,
            },
        });
        
        return {
            success: true,
            message: "User created",
            data: {
                id: user.id,
                email: user.email,
            },
        };
    } catch (error) {   
        console.error("Error in createUserByIdAndEmail", error);
        return {
            success: false,
            message: "Internal server error",
            data: null,
        };
    }
}