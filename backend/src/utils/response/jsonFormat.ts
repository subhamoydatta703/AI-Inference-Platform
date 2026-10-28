// convert response to json format
export function toJson(response?: string){
    if(!response || typeof response !== "string"){
        return null;
    }

    try{
        // strip  
        const cleaned = response.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
    } catch{
        return null;
    }
}