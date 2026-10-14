const fs = require('fs');

const content = fs.readFileSync('src/components/AuroraPromptGlow.tsx', 'utf8');

// Replace the static styles with a conditional block based on `isStreaming`.
const newContent = `
import React, { useMemo } from 'react';

interface AuroraPromptGlowProps {
  isStreaming?: boolean;
  isSidebarOpen?: boolean;
  className?: string;
  zIndex?: number;
}

export const AuroraPromptGlow: React.FC<AuroraPromptGlowProps> = React.memo(({ 
  isStreaming = false,
  isSidebarOpen = false,
  className = "",
  zIndex = 0
}) => {
  // Faster base speed for permanent movement
  const streamSpeed = isStreaming ? '3s' : '8s';
  const fastSpeed = isStreaming ? '2.5s' : '7s';

  // Colors
  // Normal: Emerald, Teal, Cyan, Indigo
  // Streaming: Blue, Sky, Indigo, Cyan
  
  const c1 = isStreaming ? 'rgba(59, 130, 246' : 'rgba(16, 185, 129'; // Blue / Emerald
  const c2 = isStreaming ? 'rgba(14, 165, 233' : 'rgba(13, 148, 136'; // Sky / Teal
  const c3 = isStreaming ? 'rgba(99, 102, 241' : 'rgba(6, 182, 212'; // Indigo / Cyan
  const c4 = isStreaming ? 'rgba(37, 99, 235' : 'rgba(20, 184, 166'; // Blue-600 / Teal-500
  const c5 = isStreaming ? 'rgba(139, 92, 246' : 'rgba(79, 70, 229'; // Violet / Indigo

  return (
    <div
      className={\`fixed \${isSidebarOpen ? 'md:left-[280px] lg:left-[300px]' : 'left-0'} right-0 bottom-0 h-[460px] sm:h-[560px] pointer-events-none overflow-hidden select-none flex items-end justify-center transition-all duration-700 \${className}\`}
      style={{
        zIndex,
        contain: 'strict',
      }}
      aria-hidden="true"
    >
      <style>{\`
        @keyframes aurora-ambient-pulse {
          0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); opacity: 0.42; }
          50% { transform: translate3d(0, -15px, 0) scaleY(1.1); opacity: 0.72; }
        }
        @keyframes aurora-left-drift {
          0%, 100% { transform: translate3d(-10px, 5px, 0) scale(1); opacity: 0.38; }
          50% { transform: translate3d(15px, -10px, 0) scale(1.08); opacity: 0.64; }
        }
        @keyframes aurora-center-left-drift {
          0%, 100% { transform: translate3d(10px, -5px, 0) scale(1); opacity: 0.35; }
          50% { transform: translate3d(-12px, 10px, 0) scale(1.06); opacity: 0.58; }
        }
        @keyframes aurora-center-stage-drift {
          0%, 100% { transform: translate3d(-8px, 4px, 0) scale(1); opacity: 0.44; }
          50% { transform: translate3d(12px, -10px, 0) scale(1.1); opacity: 0.72; }
        }
        @keyframes aurora-right-drift {
          0%, 100% { transform: translate3d(10px, -5px, 0) scale(1); opacity: 0.36; }
          50% { transform: translate3d(-10px, 8px, 0) scale(1.06); opacity: 0.58; }
        }
      \`}</style>
      
      <div 
        className="relative w-full h-full flex items-end justify-center pointer-events-none transition-colors duration-1000"
        style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
      >
        {/* Deep Horizon Ambient Base Atmosphere */}
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: \`aurora-ambient-pulse \${streamSpeed} ease-in-out infinite\`,
            background: \`radial-gradient(ellipse 90% 70% at 50% 100%, \${c1}, 0.85) 0%, \${c2}, 0.65) 45%, \${c3}, 0.4) 70%, transparent 95%)\`,
            transition: 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-6 inset-x-2 sm:inset-x-8 h-72 sm:h-[400px] blur-[120px] pointer-events-none"
        />

        {/* CURTAIN 1: Left Wing Flow */}
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: \`aurora-left-drift \${streamSpeed} ease-in-out infinite\`,
            background: \`radial-gradient(ellipse 75% 65% at 40% 70%, \${c1}, 0.88) 0%, \${c4}, 0.65) 45%, \${c3}, 0.45) 70%, transparent 90%)\`,
            transition: 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-8 left-[5%] sm:left-[10%] w-[380px] sm:w-[500px] h-72 sm:h-[380px] rounded-full blur-[120px] pointer-events-none"
        />

        {/* CURTAIN 2: Center-Left Flow */}
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: \`aurora-center-left-drift \${streamSpeed} ease-in-out infinite 0.4s\`,
            background: \`radial-gradient(ellipse 70% 60% at 50% 60%, \${c2}, 0.85) 0%, \${c1}, 0.65) 50%, transparent 85%)\`,
            transition: 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-10 left-[20%] sm:left-[26%] w-[360px] sm:w-[480px] h-72 sm:h-[360px] rounded-full blur-[120px] pointer-events-none"
        />

        {/* CURTAIN 3: Center Stage (Radiating directly behind the Prompt Bar) */}
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: \`aurora-center-stage-drift \${fastSpeed} ease-in-out infinite\`,
            background: \`radial-gradient(ellipse 85% 70% at 50% 80%, \${c1}, 0.95) 0%, \${c4}, 0.75) 40%, \${c3}, 0.55) 70%, transparent 95%)\`,
            transition: 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-8 w-[84%] max-w-[760px] h-72 sm:h-[400px] rounded-full blur-[120px] pointer-events-none"
        />

        {/* CURTAIN 4: Right Wing (Arctic Cyan & Polar Indigo Drift) */}
        <div
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: \`aurora-right-drift \${streamSpeed} ease-in-out infinite 0.7s\`,
            background: \`radial-gradient(ellipse 80% 65% at 60% 70%, \${c5}, 0.75) 0%, \${c3}, 0.65) 45%, \${c1}, 0.5) 75%, transparent 90%)\`,
            transition: 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-10 right-[2%] sm:right-[5%] w-[400px] sm:w-[520px] h-72 sm:h-[380px] rounded-full blur-[120px] pointer-events-none"
        />
      </div>
    </div>
  );
});

AuroraPromptGlow.displayName = 'AuroraPromptGlow';
`;

fs.writeFileSync('src/components/AuroraPromptGlow.tsx', newContent, 'utf8');
