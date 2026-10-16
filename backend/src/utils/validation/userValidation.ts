import { z } from "zod";
export const CreatedUserSchema = z.object({
    id: z.string().min(1, "ID is required"),
    email: z.string().email("Invalid email format"),
});

