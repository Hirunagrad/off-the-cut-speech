'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeSpeech(text: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  
  if (!text || text.trim() === "") {
    return {
      confidenceScore: 0,
      fillerWordsCount: 0,
      improvementTips: ["No speech detected. Please try again."],
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const prompt = `Analyze the following transcribed speech. Count the filler words (um, ah, like, you know), generate a confidence score from 1-100, and provide exactly two short tips for improvement. You MUST return the response as a strict JSON object with these keys: confidenceScore (number), fillerWordsCount (number), improvementTips (array of strings). Do not include any markdown formatting or code blocks in the response.

Speech:
"${text}"`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean potential markdown blocks if Gemini decides to ignore instructions
    const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing speech:", error);
    throw new Error("Failed to analyze speech.");
  }
}
