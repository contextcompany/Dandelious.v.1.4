import React, { useEffect, useRef, useState } from 'react';

interface GeneratingWaveGridProps {
  isGenerating?: boolean;
  code?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export const GeneratingWaveGrid: React.FC<GeneratingWaveGridProps> = ({
  isGenerating = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(isGenerating);
  const [progressPercent, setProgressPercent] = useState(isGenerating ? 0 : 100);

  const progressPercentRef = useRef(0);
  progressPercentRef.current = progressPercent;

  useEffect(() => {
    if (isGenerating) {
      setIsFadingOut(false);
      setShouldRender(true);
      setProgressPercent(0);

      const interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 95) return 95;
          const increment = Math.max(0.6, (100 - prev) * 0.05);
          return Math.min(95, prev + increment);
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgressPercent(100);
      const timer1 = setTimeout(() => {
        setIsFadingOut(true);
      }, 300);

      const timer2 = setTimeout(() => {
        setShouldRender(false);
      }, 1100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isGenerating]);

  // Smooth Canvas Animation Loop with zero GC churn
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldRender) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let accumulatedTime = 0;
    let isVisible = !document.hidden;

    // Pre-allocated flat buffers for zero GC overhead
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

      currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      currentWidth = rect.width;
      currentHeight = rect.height;

      const targetW = Math.floor(rect.width * currentDpr);
      const targetH = Math.floor(rect.height * currentDpr);
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
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = (now: number) => {
      if (!isVisible) return;

      const delta = (now - lastTime) / 1000;
      lastTime = now;
      accumulatedTime += Math.min(delta, 0.1);

      if (currentWidth <= 0 || currentHeight <= 0) {
        updateSize();
        if (currentWidth <= 0 || currentHeight <= 0) {
          animId = requestAnimationFrame(render);
          return;
        }
      }

      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

      // Pure black canvas background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, currentWidth, currentHeight);

      // --- 1. Center Matrix Dot Wave Grid ---
      const centerX = currentWidth / 2;
      const centerY = currentHeight * 0.45;

      const cols = 26;
      const rows = 26;
      const spacing = Math.min(currentWidth, currentHeight) / 28;
      const maxRadius = (cols / 2) * spacing * 0.98;

      const startX = centerX - ((cols - 1) * spacing) / 2;
      const startY = centerY - ((rows - 1) * spacing) / 2;

      bin0.length = 0;
      bin1.length = 0;
      bin2.length = 0;
      bin3.length = 0;

      const alphas = [0.08, 0.25, 0.55, 0.9];

      for (let r = 0; r < rows; r++) {
        const y = startY + r * spacing;
        const dy = y - centerY;

        for (let c = 0; c < cols; c++) {
          const x = startX + c * spacing;
          const dx = x - centerX;
          const distSq = dx * dx + dy * dy;

          if (distSq > maxRadius * maxRadius) continue;

          const distFromCenter = Math.sqrt(distSq);
          const mask = Math.max(0, 1 - Math.pow(distFromCenter / maxRadius, 1.8));

          const diagPos = (c + r) * 0.3 - accumulatedTime * 2.5;
          const radialPos = distFromCenter * 0.08 - accumulatedTime * 3.0;
          const phaseHarmonic = Math.sin(c * 0.2 + accumulatedTime) * Math.cos(r * 0.2 - accumulatedTime);

          const wavePhase = Math.sin(diagPos) * 0.6 + Math.sin(radialPos) * 0.4 + phaseHarmonic * 0.2;
          const waveIntensity = Math.pow(Math.max(0, (wavePhase + 1) / 2), 2.5);

          const baseRadius = 1.2;
          const activeRadius = baseRadius + waveIntensity * 2.2;
          const radius = Math.max(0.4, activeRadius * (0.35 + 0.65 * mask));

          const totalIntensity = waveIntensity * mask;
          let binIndex = 0;
          if (totalIntensity > 0.6) binIndex = 3;
          else if (totalIntensity > 0.35) binIndex = 2;
          else if (totalIntensity > 0.15) binIndex = 1;

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

      // --- 2. Bottom Dot-Matrix Progress Bar ---
      const currentProgress = progressPercentRef.current;
      const progressRatio = Math.min(1, Math.max(0, currentProgress / 100));
      const barY = currentHeight * 0.82;
      const barTotalDots = 36;
      const dotSpacing = Math.min(currentWidth * 0.8, 380) / barTotalDots;
      const barStartX = (currentWidth - barTotalDots * dotSpacing) / 2 + dotSpacing / 2;

      const activeDots = Math.floor(progressRatio * barTotalDots);
      const activeFraction = (progressRatio * barTotalDots) % 1;

      barInactive.length = 0;
      barActive.length = 0;
      barEdge.length = 0;

      for (let i = 0; i < barTotalDots; i++) {
        const px = barStartX + i * dotSpacing;
        const py = barY;

        if (i < activeDots) {
          barActive.push(px, py, 2.2);
        } else if (i === activeDots) {
          const edgeRadius = 1.8 + activeFraction * 0.8;
          barEdge.push(px, py, edgeRadius);
        } else {
          barInactive.push(px, py, 1.6);
        }
      }

      if (barInactive.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        for (let j = 0; j < barInactive.length; j += 3) {
          ctx.moveTo(barInactive[j] + barInactive[j + 2], barInactive[j + 1]);
          ctx.arc(barInactive[j], barInactive[j + 1], barInactive[j + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (barActive.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        for (let j = 0; j < barActive.length; j += 3) {
          ctx.moveTo(barActive[j] + barActive[j + 2], barActive[j + 1]);
          ctx.arc(barActive[j], barActive[j + 1], barActive[j + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (barEdge.length > 0 && activeDots < barTotalDots) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + activeFraction * 0.7})`;
        ctx.beginPath();
        for (let j = 0; j < barEdge.length; j += 3) {
          ctx.moveTo(barEdge[j] + barEdge[j + 2], barEdge[j + 1]);
          ctx.arc(barEdge[j], barEdge[j + 1], barEdge[j + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black transition-opacity duration-700 ease-out select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 pt-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md mb-4 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-[11px] font-mono font-medium tracking-wider text-neutral-200 uppercase">
            Dandelious Kernel Build
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Artefakt & Web-App wird generiert
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs">
          Code-Kompilierung, Live-Sandbox und Interface-Synthese in Echtzeit
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 pb-16 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Synthese aktiv
          </span>
          <span className="font-semibold text-white">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>
    </div>
  );
};
