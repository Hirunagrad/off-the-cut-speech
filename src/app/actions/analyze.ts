'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeSpeech(text: string, topic?: string) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  
  if (!text || text.trim() === "") {
    return {
      scores: {
        clarity: { score: 0, feedback: "No speech detected." },
        fillerRate: { score: 0, feedback: "No speech detected." },
        confidence: { score: 0, feedback: "No speech detected." }
      },
      biggestImprovement: "Please try recording again.",
      flaggedWords: []
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const topicContext = topic ? `The user was responding to the following topic/prompt: "${topic}". Evaluate how well and coherently they addressed this specific topic.` : '';

  const prompt = `You are a world-class executive speech coach. Analyze the following transcribed speech. ${topicContext}

Your task is to evaluate the speech across three dimensions (Clarity, Filler Rate, and Confidence) and identify specific words that either detracted from or enhanced the speech.
- **Clarity**: How structured, coherent, and on-topic was the speech?
- **Filler Rate**: How often did the user use filler words (um, ah, like, you know)?
- **Confidence**: Did the user speak with conviction, or did they use 'hedge' words (I think, maybe, sort of, kind of) that weaken their stance?
- **Flagged Words**: Extract an array of specific words from the transcript. Categorize them as "filler" (um, ah), "hedge" (maybe, sort of, I guess), or "strong" (forces, definitely, absolutely, critical).

You MUST return the response as a strict JSON object with exactly the following schema. Do NOT include markdown formatting or code blocks:
{
  "scores": {
    "clarity": { "score": 82, "feedback": "Strong opening..." },
    "fillerRate": { "score": 74, "feedback": "'um' and 'like' cluster around transitions." },
    "confidence": { "score": 68, "feedback": "Hedges soften the closer." }
  },
  "biggestImprovement": "Try opening with your main point instead of burying it.",
  "flaggedWords": [
    { "word": "um", "type": "filler" },
    { "word": "kind of", "type": "hedge" },
    { "word": "critical", "type": "strong" }
  ]
}

Speech to analyze:
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
