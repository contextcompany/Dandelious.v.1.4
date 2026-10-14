import React, { useEffect, useRef } from 'react';

interface DotMatrixWaveCanvasProps {
  className?: string;
  dotCount?: number;
}

export const DotMatrixWaveCanvas: React.FC<DotMatrixWaveCanvasProps> = ({
  className = '',
  dotCount = 20
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();
    let isVisible = !document.hidden;

    // Buffer bins for alpha layers [low, medium, high, max]
    const bins: number[][] = [[], [], [], []];

    let currentWidth = 0;
    let currentHeight = 0;
    let currentDpr = 1;

    const updateSize = () => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      currentWidth = rect.width;
      currentHeight = rect.height;

      const targetW = Math.round(rect.width * currentDpr);
      const targetH = Math.round(rect.height * currentDpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(parent);

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        startTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = (now: number) => {
      if (!isVisible) return;
      animId = requestAnimationFrame(render);

      if (currentWidth <= 0 || currentHeight <= 0) {
        updateSize();
        if (currentWidth <= 0 || currentHeight <= 0) return;
      }

      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      const elapsed = (now - startTime) / 1000;
      const width = currentWidth;
      const height = currentHeight;

      const centerX = width / 2;
      const centerY = height / 2;

      // Matrix Grid settings matching the video
      const cols = dotCount;
      const rows = dotCount;
      const spacing = Math.min(width, height) / (dotCount + 2);
      const maxRadius = (cols / 2) * spacing * 0.95;

      const startX = centerX - ((cols - 1) * spacing) / 2;
      const startY = centerY - ((rows - 1) * spacing) / 2;

      bins[0].length = 0;
      bins[1].length = 0;
      bins[2].length = 0;
      bins[3].length = 0;

      const alphas = [0.06, 0.22, 0.55, 0.95];

      for (let r = 0; r < rows; r++) {
        const y = startY + r * spacing;
        const dy = y - centerY;

        for (let c = 0; c < cols; c++) {
          const x = startX + c * spacing;
          const dx = x - centerX;
          const distSq = dx * dx + dy * dy;

          if (distSq > maxRadius * maxRadius) continue;

          const dist = Math.sqrt(distSq);
          // Radial circular mask fade
          const mask = Math.max(0, 1 - Math.pow(dist / maxRadius, 2.0));

          // Organic multi-harmonic ungleichmäßige undulation wave
          const diag1 = (c * 0.38 + r * 0.24) - elapsed * 1.9;
          const diag2 = (c * 0.19 - r * 0.42) + elapsed * 1.4;
          const radial = dist * 0.11 - elapsed * 2.1;
          const organicNoise = Math.sin(c * 0.42 + elapsed * 0.8) * Math.cos(r * 0.38 - elapsed * 1.2);
          const ripple = Math.sin(Math.atan2(dy, dx) * 2.0 + elapsed * 1.6);

          const wave = Math.sin(diag1) * 0.42 + Math.sin(diag2) * 0.32 + Math.sin(radial) * 0.28 + organicNoise * 0.22 + ripple * 0.14;
          const normalized = Math.max(0, (wave + 1.2) / 2.4);
          const intensity = Math.pow(normalized, 2.5) * mask;

          const baseRadius = 0.9;
          const radius = Math.max(0.35, baseRadius + intensity * 2.0);

          let binIndex = 0;
          if (intensity > 0.55) binIndex = 3;
          else if (intensity > 0.30) binIndex = 2;
          else if (intensity > 0.12) binIndex = 1;

          bins[binIndex].push(x, y, radius);
        }
      }

      // Draw all grouped dots in 4 batched paths for peak rendering performance
      for (let i = 0; i < 4; i++) {
        const arr = bins[i];
        const len = arr.length;
        if (len === 0) continue;
        ctx.fillStyle = `rgba(255, 255, 255, ${alphas[i]})`;
        ctx.beginPath();
        for (let j = 0; j < len; j += 3) {
          const px = arr[j];
          const py = arr[j + 1];
          const pr = arr[j + 2];
          ctx.moveTo(px + pr, py);
          ctx.arc(px, py, pr, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [dotCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full pointer-events-none ${className}`} 
    />
  );
};
