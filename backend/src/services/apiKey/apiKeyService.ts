import crypto from "node:crypto"
import { prisma } from "../../config/db/db";
import { success } from "zod";



// generate api key

function generateApiKey() {
    return crypto.randomBytes(32).toString("hex")
}


// hash api key


const hashApiKey = (apiKey: string) => {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
};


// create api key

const createApiKey = async (userId: string) => {

    try {
      // checking for existing apikey 
        const existingApiKey = await prisma.apiKey.findFirst({where: {userId: userId}})

        // check the count of existing api key
        const apiKeyCount = existingApiKey?.count

        if(apiKeyCount === 5){
            return {
                success: false,
                message: "You already reached your limited api key quota"

            }
        }
        const generatedApiKey = generateApiKey();
        const hashedApiKey = hashApiKey(generatedApiKey);

            // If an API key exists, update its count; otherwise, create a new key with count 1.
            await prisma.apiKey.upsert({
              where:{
                id: existingApiKey?.id,
              },
              update:{
                hashedKey: hashedApiKey,
                count:{
                    increment:1
                }
              },
              create:{
                userId: userId,
                hashedKey:hashedApiKey,
                count:1
              }

            })
        
            return {
                success: true,
                generateApiKey
            }
        
    
    
        
    } catch (error) {
      console.error("Error in apiKeyService", error);
      return {
          success: false,
          message: "Internal server error",
          data: null,
      };
    }
}
