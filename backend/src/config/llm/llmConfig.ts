import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

if(!groq){
    throw new Error("Groq API key is not defined");
}

export default groq;