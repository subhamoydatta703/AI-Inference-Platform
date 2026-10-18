import z from "zod";

export const QuerySchema = z.object({
    query: z.string().trim().min(1, "Query is required"),
    language: z.string().trim().optional(),
    code: z.string().optional(),
    url: z.string().url().optional(),
});