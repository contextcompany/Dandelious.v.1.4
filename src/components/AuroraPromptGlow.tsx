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
  className = "",
  zIndex = 10,
  hasMessages = false,
  hasInputText = false,
  isVoiceRecording = false,
  voiceVolume = 0,
}) => {
  // Luminous signature chartreuse & lime-green palette (#c5dc57 / #cfe45a)
  // Perfectly smooth radial gradients that naturally dissolve to transparent: ZERO hard edges, ZERO pills!
  const baseOpacity = isVoiceRecording
    ? Math.min(1, 0.75 + voiceVolume * 0.5)
    : isStreaming
    ? 0.75
    : hasMessages
    ? 0.45
    : hasInputText
    ? 0.65
    : 0.55;

  const dynamicScale = isVoiceRecording
    ? 1 + voiceVolume * 0.25
    : isStreaming
    ? 1.05
    : 1;

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 h-48 sm:h-64 pointer-events-none select-none overflow-hidden flex items-end justify-center ${className}`}
      style={{
        zIndex,
        opacity: baseOpacity,
        transform: `scaleY(${dynamicScale})`,
        transition: isVoiceRecording 
          ? 'opacity 0.15s ease-out, transform 0.15s ease-out' 
          : 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes aurora-wave-primary {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.85;
          }
          50% {
            transform: translate3d(0, -10px, 0) scale(1.04);
            opacity: 1;
          }
        }
        @keyframes aurora-wave-secondary {
          0%, 100% {
            transform: translate3d(12px, 4px, 0) scale(1.02);
            opacity: 0.7;
          }
          50% {
            transform: translate3d(-12px, -6px, 0) scale(0.98);
            opacity: 0.95;
          }
        }
      `}</style>

      {/* Layer 1: Broad Diffuse Ambient Blue Atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 100%, rgba(76, 141, 255, 0.08) 0%, rgba(37, 99, 235, 0.04) 35%, transparent 80%)',
          animation: 'aurora-wave-primary 7s ease-in-out infinite',
        }}
      />

      {/* Layer 2: Center-Stage Luminous Core directly beneath the prompt bar */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[850px] h-40 sm:h-52 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 85% at 50% 100%, rgba(76, 141, 255, 0.10) 0%, rgba(59, 130, 246, 0.05) 30%, transparent 80%)',
          animation: 'aurora-wave-secondary 5.5s ease-in-out infinite',
        }}
      />

      {/* Layer 3: Subtle Focused Prompt Bar Underglow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-[620px] h-28 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 65% 70% at 50% 100%, rgba(76, 141, 255, 0.12) 0%, transparent 75%)',
        }}
      />
    </div>
  );
});

AuroraPromptGlow.displayName = 'AuroraPromptGlow';
