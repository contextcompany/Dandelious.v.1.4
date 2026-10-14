// Multi-Genre Studio Audio Synthesizer (Gemini Lyria Engine)
export function generateClientAudioDataUrl(promptOrGenre = 'synthwave', durationSec = 16): string {
  const sampleRate = 22050;
  const numChannels = 1;
  const duration = Math.min(25, Math.max(8, durationSec));
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  const pLower = promptOrGenre.toLowerCase();
  const isMetal = pLower.includes('metal') || pLower.includes('heavy') || pLower.includes('hard rock') || pLower.includes('punk');
  const isRock = !isMetal && (pLower.includes('rock') || pLower.includes('guitar') || pLower.includes('gitarre') || pLower.includes('band'));
  const isTechno = pLower.includes('techno') || pLower.includes('rave') || pLower.includes('hardstyle') || pLower.includes('trance');
  const isEDM = !isTechno && (pLower.includes('edm') || pLower.includes('dance') || pLower.includes('house') || pLower.includes('electro') || pLower.includes('club'));
  const is8Bit = pLower.includes('8bit') || pLower.includes('8-bit') || pLower.includes('arcade') || pLower.includes('chiptune') || pLower.includes('retro');
  const isTrap = pLower.includes('trap') || pLower.includes('hiphop') || pLower.includes('hip-hop') || pLower.includes('rap') || pLower.includes('drill') || pLower.includes('phonk');
  const isOrchestral = pLower.includes('orchestr') || pLower.includes('epic') || pLower.includes('cinematic') || pLower.includes('soundtrack') || pLower.includes('film');
  const isAcoustic = pLower.includes('acoustic') || pLower.includes('akustik') || pLower.includes('folk') || pLower.includes('piano') || pLower.includes('klavier');
  const isReggae = pLower.includes('reggae') || pLower.includes('dub') || pLower.includes('ska') || pLower.includes('jamaica');

  let bpm = 120;
  if (isMetal) bpm = 145;
  else if (isRock) bpm = 132;
  else if (isTechno) bpm = 134;
  else if (isEDM) bpm = 128;
  else if (is8Bit) bpm = 148;
  else if (isTrap) bpm = 92;
  else if (isOrchestral) bpm = 110;
  else if (isAcoustic) bpm = 88;
  else if (isReggae) bpm = 78;

  let chords = [
    [261.63, 329.63, 392.00], // C
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
    [196.00, 246.94, 293.66], // G
  ];

  if (isMetal || isRock) {
    chords = [
      [82.41, 123.47, 164.81], // E5
      [73.42, 110.00, 146.83], // D5
      [65.41, 98.00, 130.81],  // C5
      [98.00, 146.83, 196.00], // G5
    ];
  } else if (isTechno || isEDM) {
    chords = [
      [110.00, 130.81, 164.81], // Am
      [146.83, 174.61, 220.00], // Dm
      [174.61, 220.00, 261.63], // F
      [130.81, 164.81, 196.00], // C
    ];
  } else if (isTrap) {
    chords = [
      [116.54, 138.59, 174.61], // Bbm
      [103.83, 130.81, 155.56], // Ab
      [92.50, 116.54, 138.59],  // Gb
      [82.41, 123.47, 164.81],  // F
    ];
  } else if (isOrchestral) {
    chords = [
      [146.83, 174.61, 220.00, 293.66], // Dm
      [116.54, 146.83, 174.61, 233.08], // Bb
      [130.81, 164.81, 196.00, 261.63], // C
      [110.00, 138.59, 164.81, 220.00], // A
    ];
  }

  const secondsPerBeat = 60 / bpm;
  const chordDuration = secondsPerBeat * 4;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t / chordDuration) % chords.length);
    const chord = chords[chordIndex];
    const beatTime = t % secondsPerBeat;
    const beatIdx = Math.floor((t / secondsPerBeat) % 4);

    let sample = 0;

    // Harmonic instruments
    for (let c = 0; c < chord.length; c++) {
      const f = chord[c];
      if (isMetal || isRock) {
        const raw = Math.sin(2 * Math.PI * f * t) + 
                    0.5 * Math.sin(4 * Math.PI * f * t) + 
                    0.25 * Math.sin(6 * Math.PI * f * t);
        sample += Math.tanh(raw * (isMetal ? 4.5 : 2.6)) * 0.16;
      } else if (is8Bit) {
        sample += (Math.sin(2 * Math.PI * f * t) > 0 ? 0.05 : -0.05);
      } else if (isAcoustic) {
        const env = Math.exp(-((t + c * 0.04) % (secondsPerBeat * 2)) * 3.5);
        sample += Math.sin(2 * Math.PI * f * t) * env * 0.16;
      } else if (isOrchestral) {
        const o1 = Math.sin(2 * Math.PI * f * t);
        const o2 = Math.sin(2 * Math.PI * (f * 1.004) * t);
        sample += (o1 + o2) * 0.08;
      } else if (isReggae) {
        const offbeat = (beatIdx === 1 || beatIdx === 3);
        const env = offbeat ? Math.exp(-beatTime * 12) : 0.01;
        sample += Math.sin(2 * Math.PI * f * 2 * t) * env * 0.18;
      } else {
        const saw = (2 * ((f * t) % 1) - 1);
        sample += saw * 0.08;
      }
    }

    // Bassline
    const bassRoot = chord[0] * 0.5;
    if (isTrap) {
      const sub = Math.sin(2 * Math.PI * (bassRoot * 0.7) * t);
      sample += Math.tanh(sub * 2.2) * 0.35;
    } else if (isTechno || isEDM) {
      const bEnv = Math.exp(-(t % (secondsPerBeat / 2)) * 6.0);
      sample += Math.sin(2 * Math.PI * bassRoot * t) * bEnv * 0.24;
    } else {
      sample += Math.sin(2 * Math.PI * bassRoot * t) * 0.16;
    }

    // Lead Melody
    const stepDuration = secondsPerBeat / (is8Bit ? 4 : (isTechno ? 2 : 2));
    const noteTime = t % stepDuration;
    const noteEnv = Math.exp(-noteTime * (is8Bit ? 8 : 4.5));
    const stepIdx = Math.floor((t / stepDuration) % 8);
    const leadFreq = chord[stepIdx % chord.length] * (isMetal || isRock ? 2 : 2);
    
    if (is8Bit) {
      sample += (Math.sin(2 * Math.PI * leadFreq * t) > 0 ? 0.08 : -0.08) * noteEnv;
    } else if (isMetal || isRock) {
      const solo = Math.sin(2 * Math.PI * leadFreq * t) + 0.3 * Math.sin(4 * Math.PI * leadFreq * t);
      sample += Math.tanh(solo * 2.5) * noteEnv * 0.18;
    } else {
      sample += Math.sin(2 * Math.PI * leadFreq * t) * noteEnv * 0.16;
    }

    // Drums & Percussion
    if (isMetal || isRock || isTechno || isEDM || isTrap || isReggae) {
      const isKick = isTechno || (isMetal && (beatIdx % 2 === 0)) || (beatIdx === 0) || (isTrap && beatIdx === 2 && beatTime < 0.08);
      if (isKick && beatTime < 0.15) {
        const pitch = (isTrap ? 170 : 140) * Math.exp(-beatTime * 35) + 40;
        sample += Math.sin(2 * Math.PI * pitch * beatTime) * Math.exp(-beatTime * 15) * 0.42;
      }
      if (beatIdx === 1 || beatIdx === 3 || (isTrap && beatIdx === 2)) {
        if (beatTime < 0.18) {
          sample += (Math.random() * 2 - 1) * Math.exp(-beatTime * 18) * 0.26;
        }
      }
      const hatDiv = isTrap ? (secondsPerBeat / 8) : (secondsPerBeat / 2);
      const hatTime = t % hatDiv;
      if (hatTime < 0.04) {
        sample += (Math.random() * 2 - 1) * Math.exp(-hatTime * 85) * 0.12;
      }
    }

    // Master Fade
    let fade = 1.0;
    if (t < 0.25) fade = t / 0.25;
    if (t > duration - 0.5) fade = (duration - t) / 0.5;
    sample *= fade;

    sample = Math.max(-0.95, Math.min(0.95, sample));
    const int16 = Math.floor(sample * 32767);
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}
