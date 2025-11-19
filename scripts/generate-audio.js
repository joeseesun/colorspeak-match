
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

// 模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = [
  { id: 'red', name: 'Red' },
  { id: 'orange', name: 'Orange' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'green', name: 'Green' },
  { id: 'cyan', name: 'Cyan' },
  { id: 'blue', name: 'Blue' },
  { id: 'purple', name: 'Purple' },
  { id: 'pink', name: 'Pink' },
  { id: 'brown', name: 'Brown' },
  { id: 'black', name: 'Black' },
  { id: 'white', name: 'White' },
  { id: 'gray', name: 'Gray' },
];

// 简单的 .env 读取器
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          if (!process.env[match[1].trim()]) {
             process.env[match[1].trim()] = match[2].trim();
          }
        }
      });
    }
  } catch (e) {
    console.log('Could not load .env.local, assuming variables are in environment');
  }
}

loadEnv();

let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found.');
  process.exit(1);
}

apiKey = apiKey.trim();
const client = new GoogleGenAI({ apiKey });

// WAV Header Generator
function writeWavHeader(sampleRate, numChannels, bitsPerSample, dataLength) {
  const buffer = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

async function generateAudio() {
  console.log('🎙️  Starting audio generation (WAV format) using official API...');
  console.log('🐢 Rate Limit Protection: Sleeping 15 seconds between requests to respect 5 RPM limit.');

  const audioDir = path.resolve(__dirname, '../public/audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  for (const color of COLORS) {
    const outputPath = path.resolve(__dirname, `../public/audio/${color.id}.wav`);
    
    // Skip regeneration if file exists and is valid (>1KB)
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      if (stats.size > 1024) {
        console.log(`✅ ${color.name} already exists and seems valid, skipping...`);
        continue;
      }
    }

    console.log(`⏳ Generating audio for: ${color.name}...`);

    try {
      const prompt = `It's ${color.name}!`;
      
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
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
        const pcmBuffer = Buffer.from(base64Audio, 'base64');
        
        // Add WAV header
        // Assuming Gemini returns 24kHz, 1 channel, 16-bit PCM
        const wavHeader = writeWavHeader(24000, 1, 16, pcmBuffer.length);
        const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

        fs.writeFileSync(outputPath, wavBuffer);
        console.log(`✅ Saved: ${color.id}.wav (${wavBuffer.length} bytes)`);
      } else {
        console.error(`❌ Failed to generate audio for ${color.name}: No audio data received`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${color.name}:`, error.message || error);
    }
    
    // Rate limit protection: 5 requests per minute = 1 request every 12 seconds.
    // Using 15 seconds to be safe.
    console.log('Sleeping for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  
  console.log('🎉 All done! WAV files are in public/audio/');
}

generateAudio();
