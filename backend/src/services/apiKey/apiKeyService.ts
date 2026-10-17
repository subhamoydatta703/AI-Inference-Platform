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

export const updateApiKeyCount = async (userId: string) => {
  try {

  } catch (error) {

  }

}


// create api key
export const createApiKeyService = async (userId: string) => {

  try {
    // check the count of existing user's api key and update apikey count
    const updateCount = await prisma.user.updateMany({
      where: {
        id: userId,
        count: {
          lt: 5
        }
      },
      data: {
        count: {
          increment: 1
        }
      }
    })

    if (updateCount.count < 1) {
      return {
        success: false,
        data: null
      }
    }


    const generatedApiKey = generateApiKey();
    const hashedApiKey = hashApiKey(generatedApiKey);

    // create an api key for that user
    const createdKey = await prisma.apiKey.create({
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




  } catch (error) {
    console.error("Error in apiKeyService", error);
    return {
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
}

// get apikey

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
     if (deletedApiKey.count === 0) {
        return {
          success: false,
          code: "NOT_FOUND",
          message: "API key not found",
        };
      }

    // update api key count
    await prisma.user.updateMany({
      where: {
        id: userId,
        count:{
          gt:0
        }
      },
      data: {
        count: {
          decrement: 1
        }
      }
    })
       return {
        success: true,
        message: "API key deleted successfully",
      };
  } catch (error) {
    console.error("Error in apiKeyService", error);
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
    const apiKeyRecord = await prisma.apiKey.findFirst({
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

  }


}

