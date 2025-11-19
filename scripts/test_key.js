
import { GoogleGenAI } from '@google/genai';

const apiKey = "AIzaSyBIMG-SzZzxt0HBNVTEt-GXpqnKOaxtDLo";
const client = new GoogleGenAI({ apiKey });

async function test() {
  console.log("🧪 Testing API Key...");
  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: "Testing one two three" }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
        console.log("✅ Success! Audio data received.");
        console.log("📊 Data length:", base64Audio.length);
        const buffer = Buffer.from(base64Audio, 'base64');
        console.log("🔊 Decoded Buffer length:", buffer.length);
    } else {
        console.error("❌ No audio data in response.");
        console.log(JSON.stringify(response, null, 2));
    }

  } catch (error) {
    console.error("❌ API Test Failed:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.response) {
        console.error("Details:", JSON.stringify(error.response, null, 2));
    }
  }
}

test();

