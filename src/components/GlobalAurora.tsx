import React from 'react';

interface GlobalAuroraProps {
  isStreaming: boolean;
  hasMessages?: boolean;
  hasInputText?: boolean;
}

export const GlobalAurora: React.FC<GlobalAuroraProps> = React.memo(({ isStreaming, hasMessages = false, hasInputText = false }) => {
  const speed = isStreaming ? '4s' : '10s';
  const op = isStreaming ? '0.18' : '0.10';
  const c1 = isStreaming ? 'rgba(59, 130, 246, ' : 'rgba(16, 185, 129, ';
  const c2 = isStreaming ? 'rgba(14, 165, 233, ' : 'rgba(6, 182, 212, ';
  const c3 = isStreaming ? 'rgba(99, 102, 241, ' : 'rgba(79, 70, 229, ';
  
  const currentOpacity = hasMessages ? 0 : hasInputText ? 0.35 : 1;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: currentOpacity,
        visibility: hasMessages ? 'hidden' : 'visible',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s',
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes global-aurora-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, 10%) scale(1.08); }
        }
        @keyframes global-aurora-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, -10%) scale(1.08); }
        }
        @keyframes global-aurora-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8%, -5%) scale(1.08); }
        }
      `}</style>
      
      <div 
        className="absolute top-[5%] left-[15%] w-[48%] h-[42%] rounded-full blur-[160px]" 
        style={{ 
          background: `${c1}${op})`,
          animation: `global-aurora-1 ${speed} ease-in-out infinite`,
          transition: 'background 1.5s ease-in-out'
        }} 
      />
      <div 
        className="absolute top-[22%] right-[5%] w-[50%] h-[50%] rounded-full blur-[170px]" 
        style={{ 
          background: `${c2}${op})`,
          animation: `global-aurora-2 ${speed} ease-in-out infinite 1s`,
          transition: 'background 1.5s ease-in-out'
        }} 
      />
      <div 
        className="absolute bottom-[5%] left-[20%] w-[60%] h-[45%] rounded-full blur-[160px]" 
        style={{ 
          background: `${c3}${op})`,
          animation: `global-aurora-3 ${speed} ease-in-out infinite 2s`,
          transition: 'background 1.5s ease-in-out'
        }} 
      />
    </div>
  );
});

GlobalAurora.displayName = 'GlobalAurora';
