import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env['GEMINI_API_KEY']; // Get API key from environment
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "Explain how AI works";

async function generateContent() {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
}

generateContent();
