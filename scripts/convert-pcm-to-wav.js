
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.resolve(__dirname, '../public/audio');

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

function convert() {
  console.log('🔄 Converting existing PCM data (misnamed as .mp3) to WAV...');

  if (!fs.existsSync(audioDir)) {
    console.error('❌ Audio directory not found.');
    return;
  }

  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

  if (files.length === 0) {
    console.log('⚠️ No .mp3 files found to convert.');
    return;
  }

  files.forEach(file => {
    const filePath = path.join(audioDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.size < 100) {
        console.log(`⏭️ Skipping ${file} (too small, likely empty or error)`);
        return;
    }

    // Read the raw PCM data (which was saved as .mp3)
    const pcmData = fs.readFileSync(filePath);
    
    // Gemini TTS defaults: 24kHz, 1 channel, 16-bit
    const wavHeader = writeWavHeader(24000, 1, 16, pcmData.length);
    const wavBuffer = Buffer.concat([wavHeader, pcmData]);
    
    const newFilename = file.replace('.mp3', '.wav');
    const newFilePath = path.join(audioDir, newFilename);
    
    fs.writeFileSync(newFilePath, wavBuffer);
    console.log(`✅ Converted ${file} -> ${newFilename}`);
  });
  
  console.log('🎉 Conversion complete! You can now try playing the .wav files.');
}

convert();

