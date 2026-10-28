import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Laptop, Monitor, Check, ArrowRight, RefreshCw, Send, Sparkles, MessageSquare, KeyRound } from 'lucide-react';
import { playSound } from '../utils/sound';
import { pairDeviceWithCode, loadRemoteState } from '../utils/remoteConnection';

interface RemoteSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onConnected?: () => void;
  enableSoundEffects?: boolean;
}

export const RemoteSetupModal: React.FC<RemoteSetupModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onConnected,
  enableSoundEffects = true,
}) => {
  const [step, setStep] = useState<'intro' | 'enter_code' | 'connecting' | 'success'>('intro');
  const [downloadSent, setDownloadSent] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const customDeviceName = userEmail ? `${userEmail.split('@')[0]}'s PC` : 'Desktop PC';

  if (!isOpen) return null;

  const handleStartPairing = () => {
    playSound('click', enableSoundEffects);
    setStep('enter_code');
  };

  const handleConfirmCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = enteredPin.replace(/[^0-9]/g, '');
    if (clean.length !== 6) {
      setPinError('Bitte gib den 6-stelligen Code ein (z. B. 492-815).');
      playSound('pop', enableSoundEffects);
      return;
    }

    playSound('click', enableSoundEffects);
    setStep('connecting');

    setTimeout(() => {
      const res = pairDeviceWithCode(clean, customDeviceName);
      if (res.success) {
        setStep('success');
        playSound('chime', enableSoundEffects);
        setTimeout(() => {
          if (onConnected) onConnected();
          onClose();
        }, 900);
      } else {
        setStep('enter_code');
        setPinError(res.error || 'Ungültiger Code');
        playSound('pop', enableSoundEffects);
      }
    }, 1000);
  };

  const handleSendDownloadLink = () => {
    playSound('click', enableSoundEffects);
    setDownloadSent(true);
    setTimeout(() => {
      setDownloadSent(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[460px] bg-[#121214] border border-white/10 rounded-[32px] p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white select-none z-10 overflow-hidden"
        >
          {/* Top Left Circular Close Button */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSoundEffects);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>

          {step === 'intro' && (
            <div className="flex flex-col items-center mt-2">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shadow-inner">
                  <Laptop className="w-8 h-8 stroke-[1.8] text-white" />
                </div>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                </div>
              </div>

              <h2 className="text-[22px] sm:text-[24px] font-semibold text-white tracking-tight mt-5 text-center">
                Remote einrichten
              </h2>
              <p className="text-[13.5px] text-neutral-400 text-center mt-1.5 px-3 leading-snug">
                Verbinde Handy und PC für nahtlose Chat-Synchronisation.
              </p>

              <div className="w-full mt-7 space-y-4 px-1">
                <div className="flex items-start gap-3.5 text-left">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-neutral-300">
                    <MessageSquare className="w-4 h-4 stroke-[1.8] text-[#3b82f6]" />
                  </div>
                  <p className="text-[13px] text-neutral-300 leading-relaxed font-normal">
                    <span className="font-medium text-white">Live-Chats spiegeln:</span> Führe Unterhaltungen nahtlos zwischen Handy und PC fort.
                  </p>
                </div>

                <div className="flex items-start gap-3.5 text-left">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-neutral-300">
                    <KeyRound className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <p className="text-[13px] text-neutral-300 leading-relaxed font-normal">
                    <span className="font-medium text-white">Sichere Kopplung:</span> Keine automatische Verbindung – du benötigst einen 6-stelligen Code vom PC oder iPad.
                  </p>
                </div>

                {userEmail && (
                  <div className="flex items-start gap-3.5 text-left">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-neutral-300">
                      <Sparkles className="w-4 h-4 stroke-[1.8] text-white" />
                    </div>
                    <p className="text-[13px] text-neutral-300 leading-relaxed font-normal">
                      Angemeldet als <span className="text-white font-medium">{userEmail}</span>.
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleStartPairing}
                  className="w-full bg-white hover:bg-neutral-200 active:scale-[0.99] text-black font-semibold text-[14.5px] py-3.5 px-5 rounded-full transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>Kopplungscode eingeben</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendDownloadLink}
                  className="w-full bg-neutral-900/90 hover:bg-neutral-800 active:scale-[0.99] border border-white/10 text-white font-medium text-[14px] py-3.5 px-5 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {downloadSent ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                      <span className="text-emerald-300">
                        {userEmail ? `Link an ${userEmail} gesendet!` : 'Download-Link bereitgestellt!'}
                      </span>
                    </>
                  ) : (
                    <span>Download-Link per E-Mail senden</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'enter_code' && (
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-4 shadow-inner">
                <KeyRound className="w-7 h-7 text-[#3b82f6] stroke-[1.8]" />
              </div>

              <h2 className="text-[22px] font-semibold text-white tracking-tight">
                Code vom PC oder iPad
              </h2>
              <p className="text-[13px] text-neutral-400 mt-1 max-w-xs">
                Öffne Dandelious Remote auf deinem Zielgerät und gib den angezeigten Code hier ein.
              </p>

              <form onSubmit={handleConfirmCode} className="w-full mt-6 space-y-4 max-w-xs">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={enteredPin}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      if (raw.length <= 3) {
                        setEnteredPin(raw);
                      } else {
                        setEnteredPin(`${raw.slice(0, 3)}-${raw.slice(3, 6)}`);
                      }
                      setPinError(null);
                    }}
                    placeholder="492-815"
                    autoFocus
                    className="w-full text-center text-2xl font-mono tracking-widest bg-neutral-900 border border-white/15 focus:border-blue-500 rounded-2xl py-3 px-4 text-white placeholder-neutral-600 outline-none transition-all shadow-inner"
                  />
                  {pinError && (
                    <p className="text-xs text-red-400 mt-2">{pinError}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-white hover:bg-neutral-200 active:scale-[0.99] text-black font-semibold text-[14.5px] py-3.5 px-5 rounded-full transition-all cursor-pointer shadow-md"
                  >
                    Verbinden
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('intro')}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Zurück
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'connecting' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin flex items-center justify-center mb-6">
                <Laptop className="w-7 h-7 text-white stroke-[1.8] animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Verbindung wird hergestellt...
              </h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-xs leading-relaxed">
                Prüfe Kopplungscode und synchronisiere Sitzungen...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Erfolgreich gekoppelt
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Chats & Desktop-Workspace sind nun synchron.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
