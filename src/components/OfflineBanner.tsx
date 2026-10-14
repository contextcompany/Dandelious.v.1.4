import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  customMessage?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  customMessage = "Dandelious ist im Moment nicht verfügbar. Prüfe deine Internetverbindung und versuch es noch einmal."
}) => {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check to verify connection reachability
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined') {
        if (!navigator.onLine && !isOffline) {
          setIsOffline(true);
        } else if (navigator.onLine && isOffline) {
          setIsOffline(false);
        }
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-cache' }).catch(() => null);
      if (response && response.ok) {
        setIsOffline(false);
      }
    } catch {
      // Still offline
    } finally {
      setTimeout(() => setIsRetrying(false), 800);
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-3 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-[99999] pointer-events-auto select-none"
        >
          <div className="w-full bg-[#18181c]/95 border border-white/15 rounded-full py-3 px-4 sm:px-6 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3.5 min-w-0">
              <WifiOff className="w-5 h-5 text-neutral-300 shrink-0 stroke-[2]" />
              <span className="text-[13px] sm:text-[14.5px] font-normal text-neutral-200 tracking-tight truncate sm:whitespace-normal">
                {customMessage}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Verbindung erneut prüfen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Erneut prüfen</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
