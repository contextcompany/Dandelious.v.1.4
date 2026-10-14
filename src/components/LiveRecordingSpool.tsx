import React, { useEffect, useRef } from 'react';

interface LiveRecordingSpoolProps {
  status: 'connecting' | 'connected' | 'error' | 'closed';
  statusText?: string;
  userVolume: number;
  modelVolume: number;
  barCount?: number;
}

export const LiveRecordingSpool: React.FC<LiveRecordingSpoolProps> = ({
  status,
  userVolume,
  modelVolume,
  barCount = 18,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Smooth interpolated volume targets
  const smoothedModelVol = useRef(0);
  const smoothedUserVol = useRef(0);
  const phaseRef = useRef(0);

  // Latest volume refs for requestAnimationFrame
  const userVolRef = useRef(userVolume);
  const modelVolRef = useRef(modelVolume);
  const statusRef = useRef(status);

  userVolRef.current = userVolume;
  modelVolRef.current = modelVolume;
  statusRef.current = status;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth exponential decay/interpolation (LERP)
      const targetModel = modelVolRef.current;
      const targetUser = userVolRef.current;
      smoothedModelVol.current += (targetModel - smoothedModelVol.current) * 0.16;
      smoothedUserVol.current += (targetUser - smoothedUserVol.current) * 0.16;

      const isConnected = statusRef.current === 'connected';
      const isSpeaking = smoothedModelVol.current > 0.02;
      const isListening = smoothedUserVol.current > 0.02;

      // Increment wave phase smoothly
      const speed = isSpeaking ? 0.12 : isListening ? 0.09 : 0.045;
      phaseRef.current += speed;
      const phase = phaseRef.current;

      const barWidth = 3.2;
      const spacing = 3.2;
      const totalWidth = barCount * barWidth + (barCount - 1) * spacing;
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + spacing);
        const normalizedIndex = i / (barCount - 1);
        // Window function (bell curve) so center bars peak higher
        const windowFactor = Math.sin(normalizedIndex * Math.PI);

        let barHeight = 5;

        if (isConnected) {
          if (isSpeaking) {
            // Fluid speech wave with harmonics
            const wave1 = Math.sin(phase * 2.2 + i * 0.55);
            const wave2 = Math.cos(phase * 1.4 + i * 0.35) * 0.5;
            const amp = (wave1 + wave2 + 1.2) * (smoothedModelVol.current * 32);
            barHeight = 6 + amp * (0.4 + 0.6 * windowFactor);
          } else if (isListening) {
            // Fluid user microphone wave
            const wave = Math.sin(phase * 1.8 + i * 0.45);
            const amp = (wave + 1) * (smoothedUserVol.current * 28);
            barHeight = 5 + amp * (0.35 + 0.65 * windowFactor);
          } else {
            // Idle breathing organic ripple
            const breath = Math.sin(phase * 1.2 + i * 0.4) * 2.2;
            const microHarmonic = Math.cos(phase * 0.8 + i * 0.6) * 1.1;
            barHeight = 6 + (breath + microHarmonic) * (0.6 + 0.4 * windowFactor);
          }
        } else {
          // Connecting or error pulse
          const pulse = Math.sin(phase * 1.5) * 2;
          barHeight = 5 + pulse;
        }

        // Clamp height within bounds
        const finalHeight = Math.max(4.5, Math.min(height - 6, barHeight));
        const y = centerY - finalHeight / 2;
        const radius = barWidth / 2;

        ctx.fillStyle = isConnected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)';

        // Draw rounded pill bar
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, finalHeight, radius);
        } else {
          ctx.moveTo(x + radius, y);
          ctx.arcTo(x + barWidth, y, x + barWidth, y + finalHeight, radius);
          ctx.arcTo(x + barWidth, y + finalHeight, x, y + finalHeight, radius);
          ctx.arcTo(x, y + finalHeight, x, y, radius);
          ctx.arcTo(x, y, x + barWidth, y, radius);
          ctx.closePath();
        }
        ctx.fill();
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [barCount]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block select-none pointer-events-none"
      />
    </div>
  );
};
