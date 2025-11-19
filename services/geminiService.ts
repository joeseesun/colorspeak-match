
// Singleton to manage AudioContext
let audioContext: AudioContext | null = null;
const audioCache: Map<string, AudioBuffer> = new Map();

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Fetch audio from static files
async function fetchAndCacheAudio(colorName: string): Promise<AudioBuffer | null> {
  const ctx = getAudioContext();

  // Check cache first
  if (audioCache.has(colorName)) {
    return audioCache.get(colorName)!;
  }

  try {
    // Map "Red" -> "red.wav"
    const filename = colorName.toLowerCase();
    
    // Try wav first (new format)
    let response = await fetch(`/audio/${filename}.wav`);
    
    if (!response.ok) {
      console.warn(`Audio file for ${colorName} not found at /audio/${filename}.wav, trying mp3...`);
      // Fallback to mp3 if wav not found (legacy)
      response = await fetch(`/audio/${filename}.mp3`);
    }
    
    if (!response.ok) {
      console.warn(`Audio file for ${colorName} failed to load`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Decode standard audio files (wav/mp3)
    // decodeAudioData can handle WAV with headers perfectly fine
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
    // Cache the buffer
    audioCache.set(colorName, audioBuffer);
    return audioBuffer;
    
  } catch (error) {
    console.error("Error loading audio for:", colorName, error);
  }
  return null;
}

// Public function to trigger background loading for a list of colors
export const preloadColorsAudio = (colorNames: string[]) => {
  colorNames.forEach(async (name) => {
    if (!audioCache.has(name)) {
      await fetchAndCacheAudio(name);
    }
  });
};

// Play audio immediately from cache, or fetch if missing
export const playColorName = async (text: string): Promise<void> => {
  const ctx = getAudioContext();

  if (audioCache.has(text)) {
    playBuffer(ctx, audioCache.get(text)!);
    return;
  }

  // Fallback: if not preloaded yet, fetch now and play
  const buffer = await fetchAndCacheAudio(text);
  if (buffer) {
    playBuffer(ctx, buffer);
  }
};

function playBuffer(ctx: AudioContext, buffer: AudioBuffer) {
  const source = ctx.createBufferSource();
  const outputNode = ctx.createGain();
  source.buffer = buffer;
  source.connect(outputNode);
  outputNode.connect(ctx.destination);
  source.start();
}

// --- Sound Effects Synthesizer (The Cute Version 2.0) ---

type SoundType = 'click' | 'match' | 'mismatch' | 'win';

export const playSFX = (type: SoundType) => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Helper for volume envelope
  const playOsc = (
    freqStart: number, 
    freqEnd: number, 
    waveType: OscillatorType, 
    duration: number, 
    startTime: number,
    vol: number = 0.1
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = waveType;
    
    // Frequency Slide
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqStart !== freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }
    
    // Volume Envelope
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + (duration * 0.1)); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);   // Decay
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  switch (type) {
    case 'click':
      // "Pop/Woodblock" - High pitched, very short, percussive
      // Feels like clicking a plastic toy
      playOsc(800, 800, 'sine', 0.05, now, 0.15);
      break;

    case 'match':
      // "Magic Sparkle" - Soft high chimes
      playOsc(880, 880, 'sine', 0.1, now, 0.05);       // A5
      playOsc(1108.73, 1108.73, 'sine', 0.1, now + 0.08, 0.05); // C#6
      playOsc(1318.51, 1318.51, 'sine', 0.4, now + 0.16, 0.08); // E6
      break;

    case 'mismatch':
      // "Uh-oh" - Two soft low tones. No harsh buzzer.
      // Tone 1 (Higher)
      playOsc(392.00, 370, 'sine', 0.15, now, 0.1); // G4 -> slightly down
      // Tone 2 (Lower)
      playOsc(293.66, 261.63, 'sine', 0.3, now + 0.2, 0.1); // D4 -> C4
      break;

    case 'win':
      // "Victory Fanfare" - Happy Major Scale Run
      const speed = 0.1;
      const melody = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      
      melody.forEach((freq, i) => {
         const duration = i === melody.length - 1 ? 0.6 : speed;
         playOsc(freq, freq, 'triangle', duration, now + (i * speed), 0.1);
      });
      // Add a little harmony on the last note
      playOsc(523.25, 523.25, 'sine', 0.6, now + (3 * speed), 0.1);
      break;
  }
};
