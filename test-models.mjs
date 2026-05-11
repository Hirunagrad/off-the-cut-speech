import * as fs from "fs";

let apiKey = fs.readFileSync(".env.local", "utf-8").split("=")[1].trim();
if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
  apiKey = apiKey.slice(1, -1);
}

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  const geminiModels = data.models.filter(m => m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent"));
  console.log(JSON.stringify(geminiModels.map(m => m.name), null, 2));
}

run();
