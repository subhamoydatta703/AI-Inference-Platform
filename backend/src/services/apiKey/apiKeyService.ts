import crypto from "node:crypto"
import { prisma } from "../../config/db/db";
import { success } from "zod";
import { getUserById } from "../user/userService";



// generate api key

function generateApiKey() {
    return crypto.randomBytes(32).toString("hex")
}


// hash api key
const hashApiKey = (apiKey: string) => {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
};

export const updateApiKeyCount= async(userId: string)=>{
  try {
    
  } catch (error) {
    
  }

}


// create api key
export const createApiKeyService = async (userId: string) => {

    try {
      // get user data
        const {success, data} = await getUserById(userId);
         if(success && data){
           // check the count of existing user's api key
           const apiKeyCount =  data.count
           if(apiKeyCount === 5){
               return {
                   success: false,
                   message: "You already reached your limited api key quota"
   
               }
           }

         }

        

        const generatedApiKey = generateApiKey();
        const hashedApiKey = hashApiKey(generatedApiKey);

            // create an api key for that user
            await prisma.apiKey.create({
              data:{
                userId: userId,
                hashedKey: hashedApiKey,

              }
            })

            // update apikey count
            await prisma.user.update({
              where: {
                id: userId
              },
              data:{
                count:{
                  increment: 1
                }
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



// delete api key

export const deleteApiKeyService = async(userId: string)=>{
  try {
    const existingApiKey = await prisma.apiKey.findFirst({where: {userId: userId}})

    
    // delete api key from db
    await prisma.apiKey.delete({
      where:{
        id: existingApiKey?.id,
        userId: userId
      }
    })

    // update api key count
    await prisma.user.update({
      where: {
        id: userId
      },
      data:{
        count:{
          decrement: 1
        }
      }
    })
  } catch (error) {
    
  }
}


// api key verification

export const verifyApiKeyService = async (apiKey:string) => {

  try {
    const hashedApiKey = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where:{
        hashedKey:hashedApiKey
      }
    })

    if(!apiKeyRecord){
      return{
        success: false,
        data: null
      }
    }

    return {
      success: true,
      data: apiKeyRecord
    }
  } catch (error) {
    
  }
  
}