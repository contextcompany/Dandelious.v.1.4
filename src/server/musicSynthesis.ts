// High-Fidelity Multi-Genre Audio Synthesizer for Dandelious Music Studio (Gemini Lyria Engine)
// Generates uncompressed 44.1kHz 16-bit Stereo PCM WAV audio buffers with rich harmonic synthesis across all genres.

export interface MusicSynthesisOptions {
  prompt: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  soundType?: string;
  chords?: number[][];
  melodyNotes?: number[];
  durationSeconds?: number;
  model?: string;
}

export interface MusicSynthesisResult {
  audioBase64: string;
  mimeType: string;
  lyrics?: string;
  title: string;
  genre: string;
  mood: string;
  duration: number;
}

function writeWavHeader(samplesCount: number, sampleRate: number, numChannels: number, bitsPerSample: number): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = (samplesCount * numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt sub-chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

// Generate rich, style-accurate stereo music for Rock, Metal, Pop, EDM, Hip-Hop, Acoustic, Ambient, Techno, Jazz, etc.
export function synthesizeFallbackMusic(options: MusicSynthesisOptions): MusicSynthesisResult {
  const sampleRate = 44100;
  const duration = Math.min(30, Math.max(10, options.durationSeconds || (options.model === 'lyria-3-pro-preview' ? 25 : 15)));
  const totalSamples = Math.floor(sampleRate * duration);
  const numChannels = 2;
  const pcmBuffer = Buffer.alloc(totalSamples * numChannels * 2); // 16-bit stereo

  const promptLower = (options.prompt + " " + (options.genre || "") + " " + (options.mood || "")).toLowerCase();

  // Determine genre archetype
  type GenreArchetype = 
    | 'rock_metal'
    | 'synthwave'
    | 'hiphop_trap'
    | 'edm_techno'
    | 'pop_dance'
    | 'cinematic'
    | 'acoustic_folk'
    | 'jazz_blues'
    | 'reggae_dub'
    | 'retro_8bit'
    | 'ambient_chill';

  let genreType: GenreArchetype = 'pop_dance';
  let bpm = options.bpm || 115;

  if (promptLower.includes('metal') || promptLower.includes('rock') || promptLower.includes('hardrock') || promptLower.includes('punk') || promptLower.includes('gitarre') || promptLower.includes('guitar')) {
    genreType = 'rock_metal';
    bpm = options.bpm || 135;
  } else if (promptLower.includes('synth') || promptLower.includes('80s') || promptLower.includes('cyber') || promptLower.includes('retrowave') || promptLower.includes('neon')) {
    genreType = 'synthwave';
    bpm = options.bpm || 120;
  } else if (promptLower.includes('trap') || promptLower.includes('hiphop') || promptLower.includes('hip hop') || promptLower.includes('rap') || promptLower.includes('808') || promptLower.includes('drill')) {
    genreType = 'hiphop_trap';
    bpm = options.bpm || 92;
  } else if (promptLower.includes('techno') || promptLower.includes('house') || promptLower.includes('edm') || promptLower.includes('rave') || promptLower.includes('club') || promptLower.includes('electro')) {
    genreType = 'edm_techno';
    bpm = options.bpm || 128;
  } else if (promptLower.includes('cinematic') || promptLower.includes('orchest') || promptLower.includes('epic') || promptLower.includes('soundtrack') || promptLower.includes('film') || promptLower.includes('hans zimmer')) {
    genreType = 'cinematic';
    bpm = options.bpm || 78;
  } else if (promptLower.includes('akustik') || promptLower.includes('acoustic') || promptLower.includes('folk') || promptLower.includes('country') || promptLower.includes('lagerfeuer') || promptLower.includes('indie')) {
    genreType = 'acoustic_folk';
    bpm = options.bpm || 95;
  } else if (promptLower.includes('jazz') || promptLower.includes('blues') || promptLower.includes('lounge') || promptLower.includes('sax') || promptLower.includes('swing')) {
    genreType = 'jazz_blues';
    bpm = options.bpm || 86;
  } else if (promptLower.includes('reggae') || promptLower.includes('dub') || promptLower.includes('jamaica') || promptLower.includes('ska') || promptLower.includes('dancehall')) {
    genreType = 'reggae_dub';
    bpm = options.bpm || 80;
  } else if (promptLower.includes('8bit') || promptLower.includes('8-bit') || promptLower.includes('chiptune') || promptLower.includes('arcade') || promptLower.includes('gameboy') || promptLower.includes('nintendo')) {
    genreType = 'retro_8bit';
    bpm = options.bpm || 140;
  } else if (promptLower.includes('ambient') || promptLower.includes('meditation') || promptLower.includes('calm') || promptLower.includes('relax') || promptLower.includes('space') || promptLower.includes('zen') || promptLower.includes('sleep')) {
    genreType = 'ambient_chill';
    bpm = options.bpm || 60;
  } else if (promptLower.includes('lofi') || promptLower.includes('lo-fi') || promptLower.includes('study')) {
    genreType = 'ambient_chill';
    bpm = options.bpm || 82;
  }

  // Harmonic chord progressions (frequencies in Hz)
  let chords: number[][] = options.chords || [
    [261.63, 329.63, 392.00, 523.25], // C Major
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [174.61, 220.00, 261.63, 349.23], // F Major
    [196.00, 246.94, 293.66, 392.00], // G Major
  ];

  if (genreType === 'rock_metal') {
    // E Minor Power Chords / Drops
    chords = [
      [82.41, 123.47, 164.81, 329.63], // E5 Power
      [110.00, 164.81, 220.00, 440.00], // A5 Power
      [98.00, 146.83, 196.00, 392.00], // G5 Power
      [73.42, 110.00, 146.83, 293.66], // D5 Power
    ];
  } else if (genreType === 'synthwave') {
    chords = [
      [146.83, 174.61, 220.00, 293.66], // Dm
      [116.54, 146.83, 174.61, 233.08], // Bb
      [130.81, 164.81, 196.00, 261.63], // C
      [110.00, 138.59, 164.81, 220.00], // A
    ];
  } else if (genreType === 'hiphop_trap') {
    chords = [
      [130.81, 155.56, 196.00, 261.63], // C Minor
      [116.54, 138.59, 174.61, 233.08], // Bb Minor
      [103.83, 130.81, 155.56, 207.65], // Ab Major
      [98.00, 123.47, 146.83, 196.00], // G Minor
    ];
  } else if (genreType === 'edm_techno') {
    chords = [
      [110.00, 130.81, 164.81, 220.00], // Am
      [146.83, 174.61, 220.00, 293.66], // Dm
      [174.61, 220.00, 261.63, 349.23], // F
      [130.81, 164.81, 196.00, 261.63], // C
    ];
  } else if (genreType === 'cinematic') {
    chords = [
      [110.00, 164.81, 220.00, 277.18], // A minor / wide
      [146.83, 220.00, 293.66, 369.99], // D
      [130.81, 196.00, 261.63, 329.63], // C
      [164.81, 246.94, 329.63, 415.30], // E
    ];
  } else if (genreType === 'jazz_blues') {
    chords = [
      [220.00, 261.63, 311.13, 392.00], // Am7b5
      [146.83, 185.00, 220.00, 261.63], // D7#9
      [196.00, 246.94, 293.66, 370.00], // Gmaj7
      [164.81, 207.65, 246.94, 311.13], // E7#9
    ];
  } else if (genreType === 'reggae_dub') {
    chords = [
      [174.61, 220.00, 261.63, 349.23], // F
      [196.00, 246.94, 293.66, 392.00], // G
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 220.00, 261.63, 349.23], // F
    ];
  } else if (genreType === 'retro_8bit') {
    chords = [
      [261.63, 329.63, 392.00, 523.25], // C
      [196.00, 246.94, 293.66, 392.00], // G
      [220.00, 261.63, 329.63, 440.00], // Am
      [174.61, 220.00, 261.63, 349.23], // F
    ];
  }

  const secondsPerBeat = 60 / bpm;
  const chordDuration = secondsPerBeat * 4; // 4 beats per chord

  // Audio synthesis loop
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t / chordDuration) % chords.length);
    const currentChord = chords[chordIndex];
    const beatPosition = (t % secondsPerBeat) / secondsPerBeat;
    const beatIdx = Math.floor((t / secondsPerBeat) % 4);
    const beatTime = t % secondsPerBeat;

    let left = 0;
    let right = 0;

    // --- 1. HARMONY / CHORD / GUITAR / SYNTH LAYER ---
    if (genreType === 'rock_metal') {
      // Overdriven Electric Guitar Powerchords with heavy distortion & palm mute
      for (let c = 0; c < currentChord.length; c++) {
        const freq = currentChord[c];
        const rawWave = Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(4 * Math.PI * freq * t) + 0.2 * Math.sin(6 * Math.PI * freq * t);
        // Distort with overdrive saturation
        const distorted = Math.tanh(rawWave * 3.2) * 0.18;
        left += distorted * 0.9;
        right += distorted * 0.9;
      }
    } else if (genreType === 'synthwave') {
      // Supersaw Analog Synth
      for (let c = 0; c < currentChord.length; c++) {
        const freq = currentChord[c];
        const osc1 = (2 * ((freq * t) % 1) - 1);
        const osc2 = (2 * (((freq * 1.005) * t) % 1) - 1);
        const osc3 = (2 * (((freq * 0.995) * t) % 1) - 1);
        const sawSum = (osc1 + osc2 + osc3) * 0.05;
        left += sawSum * 1.1;
        right += sawSum * 0.9;
      }
    } else if (genreType === 'retro_8bit') {
      // Pure Square / Pulse Wave 50% duty cycle
      for (let c = 0; c < currentChord.length; c++) {
        const freq = currentChord[c];
        const pulse = (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) * 0.06;
        left += pulse;
        right += pulse;
      }
    } else if (genreType === 'reggae_dub') {
      // Offbeat skank chords on the "and" of each beat
      const isOffbeat = beatPosition > 0.45 && beatPosition < 0.85;
      if (isOffbeat) {
        const skankEnv = Math.exp(-(beatPosition - 0.45) * 12);
        for (let c = 0; c < currentChord.length; c++) {
          const freq = currentChord[c] * 2;
          const organ = (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(4 * Math.PI * freq * t)) * skankEnv * 0.12;
          left += organ;
          right += organ;
        }
      }
    } else {
      // Warm Melodic Rhodes / Piano / Pad
      for (let c = 0; c < currentChord.length; c++) {
        const freq = currentChord[c];
        const detune = (c % 2 === 0 ? 1.002 : 0.998);
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(2 * Math.PI * (freq * detune) * t + 0.3);
        const amp = (osc1 * 0.6 + osc2 * 0.4) * 0.12;
        left += amp * (0.8 + 0.2 * (c % 2 === 0 ? 1 : 0));
        right += amp * (0.8 + 0.2 * (c % 2 !== 0 ? 1 : 0));
      }
    }

    // --- 2. LEAD MELODY / SOLO / ARPEGGIO ---
    const stepDuration = secondsPerBeat / (genreType === 'retro_8bit' || genreType === 'synthwave' ? 4 : 2);
    const stepIdx = Math.floor((t / stepDuration) % 8);
    const noteSteps = [0, 2, 1, 3, 2, 3, 1, 0];
    const melodyFreq = currentChord[noteSteps[stepIdx % noteSteps.length] % currentChord.length] * (genreType === 'rock_metal' ? 2 : (genreType === 'ambient_chill' ? 1.5 : 2));

    const noteTime = t % stepDuration;
    const noteEnv = Math.exp(-noteTime * (genreType === 'retro_8bit' ? 9 : 4.5));

    let leadSample = 0;
    if (genreType === 'retro_8bit') {
      leadSample = (Math.sin(2 * Math.PI * melodyFreq * t) > 0 ? 0.08 : -0.08) * noteEnv;
    } else if (genreType === 'rock_metal') {
      // Guitar solo bend / vibrato
      const vibrato = 1.0 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t);
      const leadRaw = Math.sin(2 * Math.PI * melodyFreq * vibrato * t) + 0.3 * Math.sin(4 * Math.PI * melodyFreq * vibrato * t);
      leadSample = Math.tanh(leadRaw * 2.5) * noteEnv * 0.14;
    } else {
      leadSample = (Math.sin(2 * Math.PI * melodyFreq * t) + 0.25 * Math.sin(4 * Math.PI * melodyFreq * t)) * noteEnv * 0.14;
    }

    const pan = Math.sin(t * 1.5) * 0.25;
    left += leadSample * (0.5 - pan);
    right += leadSample * (0.5 + pan);

    // --- 3. BASSLINE LAYER ---
    const rootBassFreq = currentChord[0] * 0.5;
    if (genreType === 'hiphop_trap') {
      // Deep 808 sub-bass with smooth glide
      const sub808 = Math.sin(2 * Math.PI * rootBassFreq * t) * 0.32;
      left += sub808;
      right += sub808;
    } else if (genreType === 'edm_techno' || genreType === 'synthwave') {
      // Rolling 16th-note analog bassline
      const bass16Time = t % (secondsPerBeat / 4);
      const bassEnv = Math.exp(-bass16Time * 14);
      const bassOsc = Math.sin(2 * Math.PI * rootBassFreq * t) * bassEnv * 0.22;
      left += bassOsc;
      right += bassOsc;
    } else if (genreType === 'reggae_dub') {
      // Deep bouncy reggae dub bass
      const reggaeBassTime = t % (secondsPerBeat);
      if (reggaeBassTime < 0.6) {
        const dubBass = Math.sin(2 * Math.PI * rootBassFreq * t) * Math.exp(-reggaeBassTime * 4) * 0.3;
        left += dubBass;
        right += dubBass;
      }
    }

    // --- 4. DRUMS & PERCUSSION ---
    if (genreType === 'rock_metal') {
      // Heavy Acoustic/Metal Drum Kit: Punchy double-kick on 0, 1.5, 2; Heavy snare on 1 & 3; Crash/Ride
      if (beatIdx === 0 || (beatTime < 0.12 && (beatIdx === 2 || (beatPosition > 0.45 && beatPosition < 0.55)))) {
        if (beatTime < 0.15) {
          const kickFreq = 140 * Math.exp(-beatTime * 40) + 45;
          const kick = Math.sin(2 * Math.PI * kickFreq * beatTime) * Math.exp(-beatTime * 20) * 0.42;
          left += kick;
          right += kick;
        }
      }
      if (beatIdx === 1 || beatIdx === 3) {
        if (beatTime < 0.22) {
          const snareNoise = (Math.random() * 2 - 1) * Math.exp(-beatTime * 18) * 0.28;
          const snareSnap = Math.sin(2 * Math.PI * 220 * beatTime) * Math.exp(-beatTime * 28) * 0.22;
          left += (snareNoise + snareSnap);
          right += (snareNoise + snareSnap);
        }
      }
      // Ride/Hi-Hat
      const cymbalTime = t % (secondsPerBeat / 2);
      if (cymbalTime < 0.08) {
        const cymbal = (Math.random() * 2 - 1) * Math.exp(-cymbalTime * 45) * 0.08;
        left += cymbal * 0.7;
        right += cymbal * 0.9;
      }
    } else if (genreType === 'edm_techno') {
      // Four on the Floor Kick (every beat)
      if (beatTime < 0.16) {
        const edmKickFreq = 150 * Math.exp(-beatTime * 35) + 40;
        const edmKick = Math.sin(2 * Math.PI * edmKickFreq * beatTime) * Math.exp(-beatTime * 16) * 0.45;
        left += edmKick;
        right += edmKick;
      }
      // Offbeat Hi-Hat (on beat + 0.5)
      const offbeatHatTime = (beatPosition > 0.4 && beatPosition < 0.7) ? (beatPosition - 0.5) * secondsPerBeat : 1;
      if (offbeatHatTime >= 0 && offbeatHatTime < 0.1) {
        const edmHat = (Math.random() * 2 - 1) * Math.exp(-offbeatHatTime * 40) * 0.12;
        left += edmHat * 0.8;
        right += edmHat;
      }
      // Clap on 2 & 4
      if (beatIdx === 1 || beatIdx === 3) {
        if (beatTime < 0.18) {
          const clap = (Math.random() * 2 - 1) * Math.exp(-beatTime * 25) * 0.24;
          left += clap;
          right += clap;
        }
      }
    } else if (genreType === 'hiphop_trap') {
      // Trap Kick on 0 and 2.5
      if (beatIdx === 0 || (beatIdx === 2 && beatPosition > 0.45)) {
        if (beatTime < 0.16) {
          const trapKick = Math.sin(2 * Math.PI * (130 * Math.exp(-beatTime * 35) + 40) * beatTime) * Math.exp(-beatTime * 18) * 0.4;
          left += trapKick;
          right += trapKick;
        }
      }
      // Trap Snare / Rimshot on beat 2 (third beat)
      if (beatIdx === 2) {
        if (beatTime < 0.15) {
          const snare = (Math.random() * 2 - 1) * Math.exp(-beatTime * 30) * 0.3 + Math.sin(2 * Math.PI * 250 * beatTime) * Math.exp(-beatTime * 40) * 0.2;
          left += snare;
          right += snare;
        }
      }
      // Fast Trap Hi-Hat rolls (16th / 32nd notes)
      const trap16Time = t % (secondsPerBeat / 4);
      if (trap16Time < 0.035) {
        const hat = (Math.random() * 2 - 1) * Math.exp(-trap16Time * 120) * 0.08;
        left += hat * 0.9;
        right += hat * 0.7;
      }
    } else if (genreType !== 'ambient_chill') {
      // General Rhythm (Kick on 0, 2; Snare on 1, 3; Soft Hats)
      if (beatIdx === 0 || beatIdx === 2) {
        if (beatTime < 0.14) {
          const kick = Math.sin(2 * Math.PI * (120 * Math.exp(-beatTime * 35) + 45) * beatTime) * Math.exp(-beatTime * 18) * 0.35;
          left += kick;
          right += kick;
        }
      }
      if (beatIdx === 1 || beatIdx === 3) {
        if (beatTime < 0.18) {
          const snare = (Math.random() * 2 - 1) * Math.exp(-beatTime * 22) * 0.18 + Math.sin(2 * Math.PI * 180 * beatTime) * Math.exp(-beatTime * 30) * 0.15;
          left += snare;
          right += snare;
        }
      }
      const hatTime = t % (secondsPerBeat / 2);
      if (hatTime < 0.05) {
        const hat = (Math.random() * 2 - 1) * Math.exp(-hatTime * 80) * 0.06;
        left += hat * 0.7;
        right += hat * 0.9;
      }
    }

    // --- 5. MASTER FADE & LIMITING ---
    let masterFade = 1.0;
    if (t < 0.4) masterFade = t / 0.4;
    if (t > duration - 0.8) masterFade = (duration - t) / 0.8;

    left *= masterFade;
    right *= masterFade;

    // Smooth soft clipping limiter
    left = Math.max(-0.95, Math.min(0.95, left));
    right = Math.max(-0.95, Math.min(0.95, right));

    const leftInt16 = Math.floor(left * 32767);
    const rightInt16 = Math.floor(right * 32767);

    const byteOffset = i * 4;
    pcmBuffer.writeInt16LE(leftInt16, byteOffset);
    pcmBuffer.writeInt16LE(rightInt16, byteOffset + 2);
  }

  const wavHeader = writeWavHeader(totalSamples, sampleRate, numChannels, 16);
  const fullWavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  const audioBase64 = fullWavBuffer.toString("base64");

  const genreLabels: Record<GenreArchetype, string> = {
    rock_metal: 'Rock & Metal',
    synthwave: '80s Synthwave',
    hiphop_trap: 'Hip-Hop & Trap',
    edm_techno: 'EDM & Techno',
    pop_dance: 'Pop & Dance',
    cinematic: 'Cinematic Orchestral',
    acoustic_folk: 'Acoustic & Folk',
    jazz_blues: 'Jazz & Blues',
    reggae_dub: 'Reggae & Dub',
    retro_8bit: '8-Bit Chiptune Arcade',
    ambient_chill: 'Ambient & Chillout'
  };

  return {
    audioBase64,
    mimeType: "audio/wav",
    lyrics: `[Gemini Lyria Komposition]\nGenre: ${genreLabels[genreType]}\nTempo: ${bpm} BPM\nPrompt: ${options.prompt}`,
    title: options.prompt.slice(0, 35) || `${genreLabels[genreType]} Track`,
    genre: genreLabels[genreType],
    mood: options.mood || 'Dynamisch & Harmonisch',
    duration
  };
}
