import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Monitor, Share, PlusSquare, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { DandeliousLogo } from './DandeliousLogo';
import { playSound } from '../utils/sound';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallAccepted?: () => void;
  onOpenDesktopGuide?: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallAccepted,
  onOpenDesktopGuide
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Detect if already installed / standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInstallClick = async () => {
    playSound('click', true);
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          playSound('chime', true);
          onInstallAccepted?.();
          onClose();
        }
      } catch (err) {
        console.warn('Install prompt failed:', err);
      } finally {
        setIsInstalling(false);
      }
    } else if (onOpenDesktopGuide) {
      onClose();
      onOpenDesktopGuide();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pwa-install-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl"
          onClick={onClose}
        >
          <motion.div
            key="pwa-install-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 380 }}
            className="w-full max-w-md bg-[#121316]/95 border border-white/15 rounded-[32px] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden relative flex flex-col items-center text-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                playSound('click', true);
                onClose();
              }}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Schließen"
            >
              <X className="w-5 h-5 stroke-[1.8]" />
            </button>

            {/* App Icon (Exact same emblem as above "Womit fangen wir an?") */}
            <div className="relative mt-2 mb-4 group">
              <div className="absolute inset-0 rounded-3xl bg-blue-600/30 blur-2xl group-hover:bg-blue-500/45 transition-all pointer-events-none" />
              <DandeliousLogo className="w-24 h-24 shadow-2xl relative z-10" variant="badge" />
            </div>

            <h2 className="text-[22px] font-semibold text-white tracking-tight">
              Dandelious herunterladen
            </h2>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs leading-relaxed">
              Installiere Dandelious als native App auf deinem Smartphone, Tablet oder PC.
            </p>

            {/* Feature Highlights */}
            <div className="w-full my-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Check className="w-4 h-4 text-[#3b82f6] shrink-0" />
                <span>Originales Dandelious Icon auf deinem Home-Bildschirm</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Check className="w-4 h-4 text-[#3b82f6] shrink-0" />
                <span>Voller Offline-Cache & sofortiger Start ohne Adressleiste</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-neutral-200">
                <Check className="w-4 h-4 text-[#3b82f6] shrink-0" />
                <span>Sichere lokale Speicherung & Echtzeit-KI-Sprachsteuerung</span>
              </div>
            </div>

            {/* iOS Specific Instructions */}
            {isIOS ? (
              <div className="w-full p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-left space-y-2 mb-4">
                <p className="text-xs font-semibold text-[#eaf79d] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#3b82f6]" />
                  Installation auf iPhone / iPad:
                </p>
                <ol className="text-xs text-neutral-300 space-y-1.5 list-decimal list-inside">
                  <li>Tippe unten im Safari-Browser auf den <strong>Teilen-Button</strong> (<Share className="w-3.5 h-3.5 inline mx-0.5 text-white" />).</li>
                  <li>Scrolle nach unten und wähle <strong>"Zum Home-Bildschirm"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-white" />).</li>
                  <li>Tippe oben rechts auf <strong>"Hinzufügen"</strong>.</li>
                </ol>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="w-full space-y-2.5">
              {deferredPrompt ? (
                <button
                  type="button"
                  disabled={isInstalling}
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
                >
                  <Download className="w-4.5 h-4.5 stroke-[2.2]" />
                  <span>{isInstalling ? 'Wird vorbereitet...' : 'Jetzt als App installieren'}</span>
                </button>
              ) : !isIOS ? (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', true);
                    if (onOpenDesktopGuide) {
                      onClose();
                      onOpenDesktopGuide();
                    }
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all cursor-pointer"
                >
                  <Monitor className="w-4.5 h-4.5 stroke-[2.2]" />
                  <span>Desktop App (.exe) & Installations-Guide</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  playSound('click', true);
                  onClose();
                }}
                className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Vielleicht später
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallModal;
