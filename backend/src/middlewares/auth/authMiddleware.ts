import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { prisma } from "../../config/db/db";
import { CreatedUserSchema } from "../../utils/validation/userValidation";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing authentication credentials",
      });
    }

    // 1. Fast path: User already exists in DB
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // 2. Slow path: New user needs to be synced
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
          return res.status(400).json({
            success: false,
            message: "No email address found for this account",
          });
        }

        // Use upsert so if a parallel request just created it, it won't crash
        user = await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email },
          update: { email }, // If it exists, just ensure email is up to date
        });
      } catch (syncErr: any) {
        // If a unique constraint or race happens, fetch the user that the other request just created!
        user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          console.error("Failed to sync user:", syncErr);
          return res.status(500).json({
            success: false,
            message: "Failed to initialize user profile",
          });
        }
      }
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error in authentication",
    });
  }
}
