import crypto from "node:crypto"
import { prisma } from "../../config/db/db";



// generate api key

function generateApiKey() {
  return crypto.randomBytes(32).toString("hex")
}


// hash api key
const hashApiKey = (apiKey: string) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

export const updateApiKeyCount = async (userId: string) => {
  try {

  } catch (error) {

  }

}


// create api key
export const createApiKeyService = async (userId: string) => {

  try {
    const generatedApiKey = generateApiKey();
    const hashedApiKey = hashApiKey(generatedApiKey);

    // using transaction for race condition
    return await prisma.$transaction(async(tx)=>{
    // check the count of existing user's api key and update apikey count
    const apiKeyCount = await tx.apiKey.count({
      where: {
        userId: userId
      }
    })
    if (apiKeyCount >= 5) {
      return {
        success: false,
        message:"MAX_LIMIT_EXCEEDED",
        data: null
      }
    }



    // create an api key for that user
    const createdKey = await tx.apiKey.create({
      data: {
        userId: userId,
        hashedKey: hashedApiKey

      }
    })


    return {
      success: true,
      data: {
        id: createdKey.id,
        key: generatedApiKey

      }
    }

  })




  } catch (error) {
    console.error("Error in createApiKeyService", error);
    return {
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
}



// delete api key

export const deleteApiKeyService = async (userId: string, apiKeyId: string) => {
  try {
    


    // delete api key from db
    const deletedApiKey = await prisma.apiKey.deleteMany({
      where: {
        id: apiKeyId,
        userId: userId
      }
    })
     if (deletedApiKey.count <= 0) {
        return {
          success: false,
          message: "API key not found",
        };
      }

    
       return {
        success: true,
        message: "API key deleted successfully",
      };
  } catch (error) {
    console.error("Error in deleteApiKeyService", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
}


// api key verification

export const verifyApiKeyService = async (apiKey: string) => {

  try {
    const hashedApiKey = hashApiKey(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: {
        hashedKey: hashedApiKey
      }
    })

    if (!apiKeyRecord) {
      return {
        success: false,
        data: null
      }
    }

    return {
      success: true,
      data: apiKeyRecord
    }
  } catch (error) {
    console.error("Error in verifyApiKeyService", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }


}

