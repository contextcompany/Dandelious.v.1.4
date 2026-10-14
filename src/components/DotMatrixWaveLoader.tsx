import React, { useEffect, useRef, useState } from 'react';

interface DotMatrixWaveLoaderProps {
  label?: string;
  sublabel?: string;
  variant?: 'inline' | 'compact' | 'mini' | 'card' | 'fullscreen';
  progress?: number;
  className?: string;
  hideText?: boolean;
}

export const DotMatrixWaveLoader: React.FC<DotMatrixWaveLoaderProps> = ({
  label = 'Dandelious KI analysiert & generiert...',
  sublabel = 'Harmonische Matrix-Verarbeitung',
  variant = 'inline',
  progress,
  className = '',
  hideText = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalProgress, setInternalProgress] = useState(progress !== undefined ? progress : 15);
  const progressRef = useRef(internalProgress);
  progressRef.current = progress !== undefined ? progress : internalProgress;

  // Auto-progress simulation if no static progress provided
  useEffect(() => {
    if (progress !== undefined) {
      setInternalProgress(progress);
      return;
    }

    const interval = setInterval(() => {
      setInternalProgress(prev => {
        if (prev >= 98.5) return 99;
        const remaining = 99 - prev;
        const inc = Math.max(0.1, remaining * 0.05);
        return Math.min(99, prev + inc);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [progress]);

  // Throttled 25fps Canvas render loop with isolated buffers
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

    // Instance-isolated typed buffer arrays
    const bin0: number[] = [];
    const bin1: number[] = [];
    const bin2: number[] = [];
    const bin3: number[] = [];
    const bins = [bin0, bin1, bin2, bin3];

    const barInactive: number[] = [];
    const barActive: number[] = [];
    const barEdge: number[] = [];

    let currentWidth = 0;
    let currentHeight = 0;
    let currentDpr = 1;

    const updateSize = () => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
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

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(parent);

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        startTime = performance.now();
        lastRenderTime = 0;
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Silky smooth 60 FPS canvas loop
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

      // Grid Configuration
      const isMini = variant === 'mini';
      const isCompact = variant === 'compact';
      const isInline = variant === 'inline' || isCompact || isMini;
      const spacing = isMini ? 10 : (isCompact ? 12 : (isInline ? 16 : 20));
      const cols = Math.min(40, Math.ceil(width / spacing) + 1);
      const rows = Math.min(24, Math.ceil(height / spacing) + 1);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.max(width, height) * 0.75;

      const startX = (width - (cols - 1) * spacing) / 2;
      const startY = (height - (rows - 1) * spacing) / 2;

      bin0.length = 0;
      bin1.length = 0;
      bin2.length = 0;
      bin3.length = 0;

      const alphas = isMini ? [0.1, 0.3, 0.6, 0.95] : (isInline ? [0.06, 0.2, 0.45, 0.85] : [0.08, 0.25, 0.55, 0.95]);

      for (let r = 0; r < rows; r++) {
        const y = startY + r * spacing;
        const dy = y - centerY;

        for (let c = 0; c < cols; c++) {
          const x = startX + c * spacing;
          const dx = x - centerX;
          const distSq = dx * dx + dy * dy;

          if (distSq > maxRadius * maxRadius) continue;

          const dist = Math.sqrt(distSq);
          const mask = Math.max(0, 1 - Math.pow(dist / maxRadius, 1.8));

          // Multi-harmonic wave function
          const diag = (c * 0.35 + r * 0.25) - elapsed * 2.2;
          const radial = dist * 0.08 - elapsed * 2.8;
          const harmonic = Math.sin(c * 0.25 + elapsed) * Math.cos(r * 0.25 - elapsed);

          const wave = Math.sin(diag) * 0.55 + Math.sin(radial) * 0.35 + harmonic * 0.2;
          const intensity = Math.pow(Math.max(0, (wave + 1) / 2), 2.2) * mask;

          const baseRadius = isMini ? 0.8 : (isCompact ? 0.9 : (isInline ? 1.0 : 1.3));
          const radius = Math.max(0.3, baseRadius + intensity * (isMini ? 1.0 : (isInline ? 1.6 : 2.2)));

          let binIndex = 0;
          if (intensity > 0.6) binIndex = 3;
          else if (intensity > 0.35) binIndex = 2;
          else if (intensity > 0.15) binIndex = 1;

          bins[binIndex].push(x, y, radius);
        }
      }

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

      if (isMini) return;

      // --- Bottom Dot-Matrix Progress Bar ---
      const prog = Math.max(0, Math.min(100, progressRef.current)) / 100;
      const barY = height - (isCompact ? 6 : (isInline ? 10 : 18));
      const dotSpacing = isCompact ? 6 : (isInline ? 8 : 10);
      const barTotalDots = Math.min(32, Math.max(8, Math.floor((width - (isCompact ? 24 : (isInline ? 40 : 60))) / dotSpacing)));
      const barWidth = (barTotalDots - 1) * dotSpacing;
      const barStartX = (width - barWidth) / 2;

      const activeDots = Math.floor(prog * barTotalDots);
      const activeFraction = (prog * barTotalDots) % 1;

      barInactive.length = 0;
      barActive.length = 0;
      barEdge.length = 0;

      for (let i = 0; i < barTotalDots; i++) {
        const px = barStartX + i * dotSpacing;
        const py = barY;
        const dotR = isCompact ? 1.0 : (isInline ? 1.2 : 1.6);

        if (i < activeDots) {
          barActive.push(px, py, dotR + 0.4);
        } else if (i === activeDots) {
          const edgeR = dotR + activeFraction * 0.6;
          barEdge.push(px, py, edgeR);
        } else {
          barInactive.push(px, py, dotR);
        }
      }

      if (barInactive.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        for (let i = 0; i < barInactive.length; i += 3) {
          ctx.moveTo(barInactive[i] + barInactive[i + 2], barInactive[i + 1]);
          ctx.arc(barInactive[i], barInactive[i + 1], barInactive[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (barActive.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        for (let i = 0; i < barActive.length; i += 3) {
          ctx.moveTo(barActive[i] + barActive[i + 2], barActive[i + 1]);
          ctx.arc(barActive[i], barActive[i + 1], barActive[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (barEdge.length > 0 && activeDots < barTotalDots) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + activeFraction * 0.7})`;
        ctx.beginPath();
        for (let i = 0; i < barEdge.length; i += 3) {
          ctx.moveTo(barEdge[i] + barEdge[i + 2], barEdge[i + 1]);
          ctx.arc(barEdge[i], barEdge[i + 1], barEdge[i + 2], 0, Math.PI * 2);
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
  }, [variant]);

  if (hideText) {
    return (
      <div className={`relative w-full max-w-sm h-16 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden shadow-lg backdrop-blur-md pointer-events-none ${className}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      </div>
    );
  }

  if (variant === 'mini') {
    return (
      <div className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden backdrop-blur-md pointer-events-none ${className}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="relative z-10 text-xs font-medium text-neutral-200">{label}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative w-full max-w-sm h-16 rounded-xl bg-white/[0.03] border border-white/10 p-3 flex items-center justify-between overflow-hidden backdrop-blur-md pointer-events-none ${className}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <div>
            <p className="text-xs font-medium text-neutral-200">{label}</p>
            {sublabel && <p className="text-[9px] font-mono text-neutral-500 uppercase">{sublabel}</p>}
          </div>
        </div>
        <span className="relative z-10 text-[11px] font-mono text-neutral-400 font-semibold">
          {Math.round(internalProgress)}%
        </span>
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 select-none ${className}`}>
        <div className="relative w-full max-w-lg h-72 rounded-3xl bg-[#0e0e11] border border-white/10 p-6 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-2xl">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              {label}
            </h3>
            <span className="text-xs font-mono text-neutral-400 font-medium">
              {Math.round(internalProgress)}%
            </span>
          </div>
          <div className="relative z-10 flex justify-center pb-1">
            <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">{sublabel}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`relative w-full h-56 rounded-3xl bg-[#0e0e11]/80 border border-white/10 p-5 flex flex-col justify-between overflow-hidden shadow-xl backdrop-blur-xl ${className}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <h4 className="text-xs font-medium text-neutral-200 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {label}
          </h4>
          <span className="text-[11px] font-mono text-neutral-400">
            {Math.round(internalProgress)}%
          </span>
        </div>
        <div className="relative z-10 flex justify-center pb-0.5">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{sublabel}</p>
        </div>
      </div>
    );
  }

  // Default 'inline' variant: for chat message bubbles
  return (
    <div className={`relative w-full max-w-md h-28 rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex flex-col justify-between overflow-hidden shadow-lg backdrop-blur-md ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          <span className="text-xs font-medium text-neutral-200 tracking-tight">{label}</span>
        </div>
        <span className="text-[11px] font-mono text-neutral-400 font-semibold">
          {Math.round(internalProgress)}%
        </span>
      </div>
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase tracking-wider pb-0.5">
        <span>Dandelious Kernel Engine</span>
        <span>{sublabel}</span>
      </div>
    </div>
  );
};
