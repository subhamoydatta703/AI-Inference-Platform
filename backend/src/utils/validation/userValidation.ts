import { z } from "zod";
export const CreatedUserSchema = z.object({
    id: z.string().min(1, "ID is required"),
    email: z.string().email("Invalid email format"),
    count: z.number().min(1, "Count is required"),
});

