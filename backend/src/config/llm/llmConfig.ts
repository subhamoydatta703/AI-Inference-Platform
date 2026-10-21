import Groq from "groq-sdk";
import { OpenRouter } from '@openrouter/sdk';


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

if(!groq){
    throw new Error("Groq API key is not defined");
}



const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

if(!openRouter){
    throw new Error("OpenRouter API key is not defined");
}
export  {groq,openRouter};