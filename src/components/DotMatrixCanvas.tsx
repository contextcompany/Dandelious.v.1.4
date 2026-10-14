import React, { useEffect, useRef } from 'react';

interface DotMatrixCanvasProps {
  className?: string;
  density?: number;
  interactive?: boolean;
  glow?: boolean;
}

export const DotMatrixCanvas: React.FC<DotMatrixCanvasProps> = ({
  className = "w-full h-full opacity-60",
  density = 32,
  interactive = false,
  glow = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();
    let lastRenderTime = 0;
    let isVisible = !document.hidden;

    // Instance-isolated typed buffer arrays to eliminate Garbage Collection churn without cross-canvas race conditions
    const bin0: number[] = [];
    const bin1: number[] = [];
    const bin2: number[] = [];
    const bin3: number[] = [];
    const bins = [bin0, bin1, bin2, bin3];

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

      const targetCanvasWidth = Math.round(rect.width * currentDpr);
      const targetCanvasHeight = Math.round(rect.height * currentDpr);

      if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
        canvas.width = targetCanvasWidth;
        canvas.height = targetCanvasHeight;
      }
    };

    updateSize();

    // High performance ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(parent);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        startTime = performance.now();
        lastRenderTime = 0;
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (interactive) {
      parent.addEventListener('mousemove', handleMouseMove, { passive: true });
      parent.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    let lastFrameTime = 0;
    let isMouseActive = false;
    let idleCounter = 0;

    // Ultra-optimized rendering loop with smart idle detection
    const render = (now: number) => {
      if (!isVisible) return;

      // When interactive and idle for > 3 seconds, throttle heavily to save GPU/CPU
      const mouse = mouseRef.current;
      if (interactive && !mouse.active) {
        idleCounter++;
      } else {
        idleCounter = 0;
      }

      // If interactive canvas has been idle, throttle to 15fps or pause to prevent UI stutter
      const frameInterval = idleCounter > 60 ? 66 : 16;
      if (now - lastFrameTime < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = now;
      animId = requestAnimationFrame(render);

      if (currentWidth <= 0 || currentHeight <= 0) {
        updateSize();
        if (currentWidth <= 0 || currentHeight <= 0) return;
      }

      // Always reset transform cleanly per frame
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      ctx.clearRect(0, 0, currentWidth, currentHeight);

      // Adaptive spacing based on canvas dimensions and density
      const safeDensity = Math.max(16, Math.min(density || 32, 60));
      // Base spacing in CSS pixels (ensures round, crisp dots on any aspect ratio)
      const baseSpacing = Math.max(22, Math.min(currentWidth, currentHeight) / (safeDensity * 0.7));
      const cols = Math.ceil(currentWidth / baseSpacing) + 1;
      const rows = Math.ceil(currentHeight / baseSpacing) + 1;

      // Center the grid
      const totalGridW = (cols - 1) * baseSpacing;
      const totalGridH = (rows - 1) * baseSpacing;
      const startX = (currentWidth - totalGridW) / 2;
      const startY = (currentHeight - totalGridH) / 2;

      const mouseRadius = 140;
      const elapsed = (now - startTime) / 1000;

      // Reset bins
      bin0.length = 0;
      bin1.length = 0;
      bin2.length = 0;
      bin3.length = 0;

      for (let r = 0; r < rows; r++) {
        const y = startY + r * baseSpacing;
        if (y < -10 || y > currentHeight + 10) continue;

        for (let c = 0; c < cols; c++) {
          const x = startX + c * baseSpacing;
          if (x < -10 || x > currentWidth + 10) continue;

          // Harmonic wave animation
          const diagPos = (c * 0.24 + r * 0.18) - elapsed * 1.4;
          const wavePhase = Math.sin(diagPos);
          const secondaryWave = Math.cos(c * 0.14 - elapsed * 0.8) * Math.sin(r * 0.14 + elapsed * 0.6);

          let intensity = Math.pow((wavePhase + 1) / 2, 2.2) * 0.55 + (secondaryWave + 1) * 0.22;

          if (interactive && mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < mouseRadius * mouseRadius) {
              const dist = Math.sqrt(distSq);
              const mousePower = Math.pow(1 - dist / mouseRadius, 2);
              intensity = Math.min(1, intensity + mousePower * 0.85);
            }
          }

          // Exact circular dot radius (0.75px to 1.9px)
          const radius = 0.75 + intensity * 1.15;

          let binIndex = 0;
          if (intensity > 0.68) binIndex = 3;
          else if (intensity > 0.42) binIndex = 2;
          else if (intensity > 0.2) binIndex = 1;

          bins[binIndex].push(x, y, radius);
        }
      }

      // Draw all bins with single batch path per alpha level
      const alphas = [0.08, 0.22, 0.48, 0.88];
      for (let b = 0; b < 4; b++) {
        const arr = bins[b];
        const len = arr.length;
        if (len === 0) continue;

        ctx.fillStyle = glow && b >= 2 
          ? `rgba(220, 240, 255, ${alphas[b]})` 
          : `rgba(255, 255, 255, ${alphas[b]})`;

        ctx.beginPath();
        for (let i = 0; i < len; i += 3) {
          const px = arr[i];
          const py = arr[i + 1];
          const pr = arr[i + 2];
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (interactive) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [density, interactive, glow]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${className}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};
