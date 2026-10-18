import type Groq from "groq-sdk";
import groq from "../../../config/llm/llmConfig";
import { type QueryFormat } from "../../../utils/types/query/queryFormat";
import { SYSTEM_PROMPT } from "../instructions/llmInstruction";


export class GroqService {
    private readonly client;

    constructor() {
        this.client = groq
    }


    async generateResponse(userQuery: QueryFormat, conversationId: string) {


        const query: QueryFormat = {
            conversationId: conversationId,
            query: userQuery.query,
            url: userQuery.url || "",
            language: userQuery.language || "",
            code: userQuery.code || "",
        }


        const response = await groq.chat.completions.create({

            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: JSON.stringify(query),
                },
            ],
            model: "openai/gpt-oss-20b",
            max_completion_tokens:10000,
            max_tokens:10000,
            

        })

        return response.choices[0]?.message?.content || ""
    }
}