const { GoogleGenAI } = require('@google/genai');
async function test() {
  console.log("Checking environment...");
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY in environment");
    return;
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say hi'
    });
    console.log("Success:", response.text);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
test();
