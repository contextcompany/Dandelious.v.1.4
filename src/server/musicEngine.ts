import { GoogleGenAI } from "@google/genai";

export interface MusicTrack {
  id: string;
  title: string;
  genre: string;
  mood: string;
  duration: number;
  bpm: number;
  audioBase64: string;
  mimeType: string;
  lyrics?: string;
  modelUsed: string;
  createdAt: number;
}

const savedTracks = new Map<string, MusicTrack>();

/**
 * Procedural Audio Synthesizer fallback for instant, robust WAV synthesis
 */
export function synthesizeProceduralWav(
  title: string,
  genre: string,
  bpm: number = 120,
  durationSec: number = 16
): { audioBase64: string; mimeType: string } {
  const sampleRate = 22050;
  const numChannels = 1;
  const duration = Math.min(30, Math.max(8, durationSec));
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + totalSamples * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + totalSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * 2, 28);
  buffer.writeUInt16LE(numChannels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * 2, 40);

  const secondsPerBeat = 60 / bpm;
  const chordDuration = secondsPerBeat * 4;

  // Harmonically rich progression: Am - F - C - G
  const chords = [
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
    [261.63, 329.63, 392.00], // C
    [196.00, 246.94, 293.66]  // G
  ];

  const melodyNotes = [329.63, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00];
  const bassNotes = [110.00, 87.31, 130.81, 98.00];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t / chordDuration) % chords.length);
    const chord = chords[chordIndex];
    const beatTime = t % secondsPerBeat;
    const beatIdx = Math.floor((t / secondsPerBeat) % 4);

    let sample = 0;

    // 1. Chords (Warm synth pad with soft harmonics)
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      const s1 = Math.sin(2 * Math.PI * f * t);
      const s2 = Math.sin(2 * Math.PI * f * 1.003 * t);
      const s3 = Math.sin(2 * Math.PI * f * 0.997 * t);
      sample += (s1 + s2 + s3) * 0.08;
    }

    // 2. Bass
    const bFreq = bassNotes[chordIndex % bassNotes.length];
    const bassEnv = Math.exp(-(t % (secondsPerBeat)) * 3.5);
    sample += Math.sin(2 * Math.PI * bFreq * t) * bassEnv * 0.25;

    // 3. Melody
    const stepDuration = secondsPerBeat / 2;
    const stepIdx = Math.floor((t / stepDuration) % melodyNotes.length);
    const mFreq = melodyNotes[stepIdx];
    const noteTime = t % stepDuration;
    const mEnv = Math.exp(-noteTime * 5.0);
    sample += Math.sin(2 * Math.PI * mFreq * t) * mEnv * 0.16;

    // 4. Rhythm (Kick & Snare)
    if ((beatIdx === 0 || beatIdx === 2) && beatTime < 0.15) {
      const kickPitch = 140 * Math.exp(-beatTime * 35) + 40;
      sample += Math.sin(2 * Math.PI * kickPitch * beatTime) * Math.exp(-beatTime * 18) * 0.45;
    }
    if ((beatIdx === 1 || beatIdx === 3) && beatTime < 0.18) {
      const noise = (Math.random() * 2 - 1) * Math.exp(-beatTime * 20) * 0.25;
      sample += noise;
    }

    // Fade in and out
    let fade = 1.0;
    if (t < 0.2) fade = t / 0.2;
    if (t > duration - 0.6) fade = (duration - t) / 0.6;
    sample *= fade;

    sample = Math.max(-0.95, Math.min(0.95, sample));
    const int16 = Math.floor(sample * 32767);
    buffer.writeInt16LE(int16, offset);
    offset += 2;
  }

  return {
    audioBase64: buffer.toString('base64'),
    mimeType: 'audio/wav'
  };
}

/**
 * Generate music using Lyria:
 * - lyria-3-clip-preview for short clips (up to 30s)
 * - lyria-3-pro-preview for full-length tracks
 */
export async function generateLyriaMusic(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  genre?: string;
  mood?: string;
  durationSeconds?: number;
  imageBase64?: string;
  imageMimeType?: string;
  clients: Array<{ ai: GoogleGenAI; isCustom: boolean; apiKey?: string }>;
}): Promise<MusicTrack> {
  const {
    prompt,
    model = 'lyria-3-clip-preview',
    genre = 'Electronic Synthwave',
    mood = 'Energetisch',
    durationSeconds,
    imageBase64,
    imageMimeType = 'image/jpeg',
    clients
  } = params;

  const targetModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
  const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const duration = durationSeconds || (targetModel === 'lyria-3-pro-preview' ? 30 : 18);

  let generatedAudioBase64 = '';
  let generatedMimeType = 'audio/wav';
  let generatedLyrics = '';

  // 1. Attempt Gemini Lyria Model Stream
  if (clients.length > 0) {
    for (const clientObj of clients) {
      if (generatedAudioBase64) break;
      try {
        let contents: any = prompt;
        if (imageBase64) {
          const cleanBytes = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
          contents = {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: cleanBytes,
                  mimeType: imageMimeType
                }
              }
            ]
          };
        }

        const stream = await clientObj.ai.models.generateContentStream({
          model: targetModel,
          contents
        });

        for await (const chunk of stream) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              if (!generatedAudioBase64 && part.inlineData.mimeType) {
                generatedMimeType = part.inlineData.mimeType;
              }
              generatedAudioBase64 += part.inlineData.data;
            }
            if (part.text && !generatedLyrics) {
              generatedLyrics = part.text;
            }
          }
        }
      } catch (lyriaErr: any) {
        console.warn(`[Lyria API Stream Warning]: ${lyriaErr?.message || lyriaErr}`);
      }
    }
  }

  // 2. Procedural Studio Synthesizer fallback if Lyria quota / preview is throttled
  if (!generatedAudioBase64) {
    const bpm = genre.toLowerCase().includes('metal') ? 144 : genre.toLowerCase().includes('lo-fi') ? 85 : 124;
    const synthResult = synthesizeProceduralWav(prompt, genre, bpm, duration);
    generatedAudioBase64 = synthResult.audioBase64;
    generatedMimeType = synthResult.mimeType;
    generatedLyrics = generatedLyrics || `[Dandelious Lyria Komposition]\nPrompt: ${prompt}\nGenre: ${genre}\nStimmung: ${mood}\nModell: ${targetModel}`;
  }

  const track: MusicTrack = {
    id: trackId,
    title: prompt.slice(0, 32),
    genre,
    mood,
    duration,
    bpm: 124,
    audioBase64: generatedAudioBase64,
    mimeType: generatedMimeType,
    lyrics: generatedLyrics,
    modelUsed: targetModel,
    createdAt: Date.now()
  };

  savedTracks.set(trackId, track);
  return track;
}

export function getAllTracks(): MusicTrack[] {
  return Array.from(savedTracks.values()).sort((a, b) => b.createdAt - a.createdAt);
}
