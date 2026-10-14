import React, { useEffect, useRef } from 'react';

interface RealtimeAudioWaveformProps {
  analyser?: AnalyserNode | null;
  isRecording: boolean;
  className?: string;
  barCount?: number;
  height?: number;
  theme?: 'sapphire' | 'cyan' | 'white';
  showMirror?: boolean;
}

export const RealtimeAudioWaveform: React.FC<RealtimeAudioWaveformProps> = ({
  analyser,
  isRecording,
  className = '',
  barCount = 28,
  height = 36,
  theme = 'sapphire',
  showMirror = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const smoothedHeights = useRef<number[]>(new Array(barCount).fill(4));
  const phaseRef = useRef<number>(0);
  const voiceIntensityRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const lerpColor = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, t: number) => {
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 200;
      const h = height;

      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      // Get frequency data if available
      let audioActive = false;
      let averageVolume = 0;
      if (analyser && dataArray && isRecording) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        averageVolume = sum / dataArray.length;
        audioActive = averageVolume > 3;
      }

      // Smoothly transition voiceIntensity (0 = quiet / idle, 1 = speaking)
      const targetIntensity = audioActive ? Math.min(1, Math.max(0.2, averageVolume / 35)) : 0;
      voiceIntensityRef.current += (targetIntensity - voiceIntensityRef.current) * (audioActive ? 0.25 : 0.1);
      const intensity = voiceIntensityRef.current;

      phaseRef.current += audioActive ? 0.14 : 0.04;
      const phase = phaseRef.current;

      const barWidth = Math.max(2.5, Math.min(4.5, (width - (barCount - 1) * 2.5) / barCount));
      const spacing = (width - barCount * barWidth) / (barCount - 1 || 1);
      const centerY = h / 2;

      // Dynamic color interpolation to Dandelious Chartreuse / Warm Lime-Green when speaking:
      const gradStart = lerpColor(60, 75, 45, 95, 125, 25, intensity);
      const gradMid = lerpColor(120, 145, 60, 197, 220, 87, intensity);
      const gradEnd = lerpColor(160, 185, 90, 225, 245, 120, intensity);
      const glowBlur = 2 + intensity * 12;
      const glowColor = `rgba(197, 220, 87, ${0.1 + intensity * 0.75})`;

      for (let i = 0; i < barCount; i++) {
        // Calculate target height for this bar
        let targetH = 3;

        if (isRecording && analyser && dataArray) {
          // Map bar index to frequency bins, emphasizing human voice frequencies (80Hz - 2500Hz)
          const binIndex = Math.floor(Math.pow(i / barCount, 1.4) * (dataArray.length * 0.75));
          const rawVal = dataArray[Math.min(binIndex, dataArray.length - 1)] || 0;

          // Add a subtle wave multiplier for visual aesthetics
          const waveFactor = 0.8 + 0.2 * Math.sin(phase + i * 0.35);
          const amplified = (rawVal / 255) * (h * 0.9) * waveFactor;
          // Idle breathing baseline
          const idleWave = Math.sin(phase * 1.5 + i * 0.4) * 3 + 4;
          targetH = Math.max(idleWave, amplified);
        } else if (isRecording) {
          // Synthetic breathing wave if analyser hasn't initialized yet
          targetH = Math.sin(phase * 2 + i * 0.35) * 8 + 12;
        } else {
          targetH = 3;
        }

        // Smooth interpolation (LERP)
        if (!smoothedHeights.current[i]) smoothedHeights.current[i] = 3;
        const speed = targetH > smoothedHeights.current[i] ? 0.32 : 0.18;
        smoothedHeights.current[i] += (targetH - smoothedHeights.current[i]) * speed;

        const curH = Math.min(h - 2, Math.max(3, smoothedHeights.current[i]));
        const x = i * (barWidth + spacing);
        const y = centerY - curH / 2;

        // Draw bar with dynamic dark purple / violet gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + curH);
        grad.addColorStop(0, gradEnd);
        grad.addColorStop(0.5, gradMid);
        grad.addColorStop(1, gradStart);

        ctx.fillStyle = grad;

        // Apply dynamic dark purple glow when voice is active
        if (intensity > 0.05) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowBlur;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, curH, radius);
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyser, isRecording, barCount, height, theme, showMirror]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
