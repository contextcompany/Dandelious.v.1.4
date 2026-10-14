import React from 'react';

interface AuroraPromptGlowProps {
  isStreaming?: boolean;
  isSidebarOpen?: boolean;
  className?: string;
  zIndex?: number;
  hasMessages?: boolean;
  hasInputText?: boolean;
  isVoiceRecording?: boolean;
  voiceVolume?: number;
}

export const AuroraPromptGlow: React.FC<AuroraPromptGlowProps> = React.memo(({ 
  isStreaming = false,
  isSidebarOpen = false,
  className = "",
  zIndex = 0,
  hasMessages = false,
  hasInputText = false,
  isVoiceRecording = false,
  voiceVolume = 0,
}) => {
  // Dandelious Chartreuse / Warm Lime-Green Aurora Palette
  const c1 = isVoiceRecording
    ? `rgba(${Math.round(197 + voiceVolume * 30)}, ${Math.round(220 + voiceVolume * 25)}, ${Math.round(87 + voiceVolume * 50)}`
    : isStreaming ? 'rgba(197, 220, 87' : 'rgba(163, 190, 52';
  const c2 = isVoiceRecording
    ? `rgba(${Math.round(189 + voiceVolume * 35)}, ${Math.round(218 + voiceVolume * 25)}, ${Math.round(79 + voiceVolume * 40)}`
    : isStreaming ? 'rgba(210, 235, 95' : 'rgba(145, 175, 40';
  const c3 = isVoiceRecording
    ? `rgba(${Math.round(220 + voiceVolume * 25)}, ${Math.round(245 + voiceVolume * 10)}, ${Math.round(110 + voiceVolume * 30)}`
    : isStreaming ? 'rgba(226, 248, 120' : 'rgba(120, 150, 30';
  const c4 = isVoiceRecording
    ? 'rgba(197, 220, 87'
    : isStreaming ? 'rgba(163, 190, 52' : 'rgba(189, 218, 79';
  const c5 = isVoiceRecording
    ? 'rgba(210, 235, 95'
    : isStreaming ? 'rgba(210, 235, 95' : 'rgba(132, 160, 35';

  // Faster base speed for permanent movement or voice activity
  const streamSpeed = isVoiceRecording ? '2.2s' : isStreaming ? '3.5s' : '8s';
  const fastSpeed = isVoiceRecording ? '1.8s' : isStreaming ? '2.8s' : '7s';

  // Opacity & transform based on user input state:
  // In voice recording mode: always fully luminous (opacity 1) and dynamically reactive to voice volume!
  // In idle state: fully luminous sapphire aura
  // When typing: elegant focused glow around the input container
  // In active chat: subtle ambient background glow
  const currentOpacity = isVoiceRecording ? 1 : hasMessages ? 0.12 : hasInputText ? 0.65 : 1;
  const currentTransform = isVoiceRecording
    ? `translate3d(0, ${-voiceVolume * 22}px, 0) scale(${1.02 + voiceVolume * 0.16})`
    : hasMessages 
    ? 'translate3d(0, 24px, 0) scale(0.98)' 
    : hasInputText 
    ? 'translate3d(0, 8px, 0) scale(0.99)' 
    : 'translate3d(0, 0, 0) scale(1)';

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 h-[38vh] sm:h-[45vh] max-h-[380px] pointer-events-none select-none flex items-end justify-center ${className}`}
      style={{
        zIndex,
        opacity: currentOpacity,
        transform: currentTransform,
        transition: isVoiceRecording 
          ? 'opacity 0.3s ease-out, transform 0.15s ease-out'
          : 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0) 100%)',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes aurora-ambient-pulse {
          0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); opacity: 0.38; }
          50% { transform: translate3d(0, -8px, 0) scaleY(1.06); opacity: 0.60; }
        }
        @keyframes aurora-left-drift {
          0%, 100% { transform: translate3d(-8px, 3px, 0) scale(1); opacity: 0.32; }
          50% { transform: translate3d(10px, -6px, 0) scale(1.05); opacity: 0.52; }
        }
        @keyframes aurora-center-left-drift {
          0%, 100% { transform: translate3d(6px, -3px, 0) scale(1); opacity: 0.30; }
          50% { transform: translate3d(-8px, 6px, 0) scale(1.04); opacity: 0.50; }
        }
        @keyframes aurora-center-stage-drift {
          0%, 100% { transform: translate3d(-4px, 2px, 0) scale(1); opacity: 0.42; }
          50% { transform: translate3d(8px, -6px, 0) scale(1.06); opacity: 0.68; }
        }
        @keyframes aurora-right-drift {
          0%, 100% { transform: translate3d(6px, -3px, 0) scale(1); opacity: 0.32; }
          50% { transform: translate3d(-8px, 5px, 0) scale(1.05); opacity: 0.50; }
        }
      `}</style>
      
      <div 
        className="relative w-full h-full flex items-end justify-center pointer-events-none transition-colors duration-1000"
        style={{ transform: 'translate3d(0, 0, 0)', backfaceVisibility: 'hidden' }}
      >
        {/* Deep Horizon Ambient Base Atmosphere */}
        <div
          style={{
            transform: isVoiceRecording ? `scaleY(${1.05 + voiceVolume * 0.4})` : 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: `aurora-ambient-pulse ${streamSpeed} ease-in-out infinite`,
            background: `radial-gradient(ellipse 110% 100% at 50% 100%, ${c1}, 0.78) 0%, ${c2}, 0.52) 40%, ${c3}, 0.28) 72%, transparent 100%)`,
            transition: isVoiceRecording ? 'transform 0.15s ease-out, background 0.3s ease-out' : 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-4 inset-x-0 h-44 sm:h-64 blur-[85px] sm:blur-[105px] pointer-events-none"
        />

        {/* CURTAIN 1: Left Wing Flow */}
        <div
          style={{
            transform: isVoiceRecording ? `scale(${1 + voiceVolume * 0.25})` : 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: `aurora-left-drift ${streamSpeed} ease-in-out infinite`,
            background: `radial-gradient(ellipse 85% 75% at 35% 85%, ${c1}, 0.65) 0%, ${c4}, 0.45) 45%, ${c3}, 0.22) 75%, transparent 100%)`,
            transition: isVoiceRecording ? 'transform 0.15s ease-out, background 0.3s ease-out' : 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-6 left-[4%] sm:left-[8%] w-[280px] sm:w-[420px] h-36 sm:h-48 rounded-full blur-[80px] pointer-events-none"
        />

        {/* CURTAIN 2: Center-Left Flow */}
        <div
          style={{
            transform: isVoiceRecording ? `scale(${1 + voiceVolume * 0.2})` : 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: `aurora-center-left-drift ${streamSpeed} ease-in-out infinite 0.4s`,
            background: `radial-gradient(ellipse 80% 70% at 50% 80%, ${c2}, 0.62) 0%, ${c1}, 0.42) 50%, transparent 100%)`,
            transition: isVoiceRecording ? 'transform 0.15s ease-out, background 0.3s ease-out' : 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-6 left-[20%] sm:left-[26%] w-[260px] sm:w-[380px] h-36 sm:h-48 rounded-full blur-[80px] pointer-events-none"
        />

        {/* CURTAIN 3: Center Stage (Radiating directly behind the Prompt Bar - Reacts to Voice) */}
        <div
          style={{
            transform: isVoiceRecording 
              ? `scaleY(${1.08 + voiceVolume * 0.5}) scaleX(${1 + voiceVolume * 0.12})` 
              : 'translate3d(0, 0, 0)',
            filter: isVoiceRecording ? `brightness(${1 + voiceVolume * 0.7})` : undefined,
            willChange: 'transform, opacity, background, filter',
            animation: `aurora-center-stage-drift ${fastSpeed} ease-in-out infinite`,
            background: `radial-gradient(ellipse 90% 85% at 50% 90%, ${c1}, ${isVoiceRecording ? 0.95 : 0.80}) 0%, ${c4}, ${isVoiceRecording ? 0.72 : 0.55}) 38%, ${c3}, ${isVoiceRecording ? 0.45 : 0.30}) 75%, transparent 100%)`,
            transition: isVoiceRecording ? 'transform 0.15s ease-out, filter 0.15s ease-out, background 0.25s ease-out' : 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-6 w-[88%] max-w-[760px] h-44 sm:h-56 rounded-full blur-[85px] sm:blur-[100px] pointer-events-none"
        />

        {/* CURTAIN 4: Right Wing (Arctic Sapphire & Indigo Drift) */}
        <div
          style={{
            transform: isVoiceRecording ? `scale(${1 + voiceVolume * 0.25})` : 'translate3d(0, 0, 0)',
            willChange: 'transform, opacity, background',
            animation: `aurora-right-drift ${streamSpeed} ease-in-out infinite 0.7s`,
            background: `radial-gradient(ellipse 85% 75% at 65% 85%, ${c5}, 0.58) 0%, ${c3}, 0.45) 45%, ${c1}, 0.25) 75%, transparent 100%)`,
            transition: isVoiceRecording ? 'transform 0.15s ease-out, background 0.3s ease-out' : 'background 1.5s ease-in-out'
          }}
          className="absolute -bottom-6 right-[4%] sm:right-[8%] w-[280px] sm:w-[420px] h-36 sm:h-48 rounded-full blur-[80px] pointer-events-none"
        />
      </div>
    </div>
  );
});

AuroraPromptGlow.displayName = 'AuroraPromptGlow';
