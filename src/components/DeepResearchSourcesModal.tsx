import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Search, Mail, HardDrive, MessageSquare } from 'lucide-react';
import { playSound } from '../utils/sound';

export interface DeepResearchSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSources: string[];
  onToggleSource: (sourceId: string) => void;
  onApply?: () => void;
  soundEnabled?: boolean;
}

export const GoogleGIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const GmailIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const GoogleDriveIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 22 22 22" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

export const DeepResearchSourcesModal: React.FC<DeepResearchSourcesModalProps> = ({
  isOpen,
  onClose,
  selectedSources,
  onToggleSource,
  onApply,
  soundEnabled = true,
}) => {
  const sources = [
    {
      id: 'google',
      name: 'Suche',
      icon: <GoogleGIcon className="w-5 h-5" />,
      description: 'Aktuelle Web-Suchergebnisse und Quellen'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <GmailIcon className="w-5 h-5 text-red-400" />,
      description: 'E-Mails und Konversationen'
    },
    {
      id: 'drive',
      name: 'Drive',
      icon: <GoogleDriveIcon className="w-5 h-5 text-amber-400" />,
      description: 'Google Drive Dokumente & Tabellen'
    },
    {
      id: 'chat',
      name: 'Chat',
      icon: <MessageSquare className="w-5 h-5 text-blue-400 stroke-[1.8]" />,
      description: 'Chat-Verläufe und gespeicherte Notizen'
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal / Bottom Sheet matching screenshot 1:1 */}
          <motion.div
            initial={{ y: '100%', opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-[#1c1c1e] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[28px] pt-3 pb-8 sm:pb-6 px-5 sm:px-6 shadow-2xl text-white select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle Bar (Mobile) */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Header matching screenshot 3 */}
            <div className="flex items-center justify-between pb-4 mb-2">
              {/* Close Button on Left */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>

              {/* Title */}
              <h3 className="text-[15px] sm:text-[16px] font-medium text-white tracking-tight text-center">
                Eine oder mehrere Quellen auswählen
              </h3>

              {/* Blue Checkmark Button on Right */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onApply();
                }}
                className="w-9 h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                title="Auswahl anwenden"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Source Items List matching screenshot 3 */}
            <div className="space-y-1 py-1">
              {sources.map((src, idx) => {
                const isSelected = selectedSources.includes(src.id);

                return (
                  <button
                    key={`deep-src-${src.id || idx}-${idx}`}
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onToggleSource(src.id);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-6 h-6 flex items-center justify-center shrink-0">
                        {src.icon}
                      </div>
                      <span className="text-[15px] sm:text-[16px] text-white font-normal">
                        {src.name}
                      </span>
                    </div>

                    {/* Checkbox box on right */}
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#2563eb] border-[#2563eb] text-white'
                          : 'bg-transparent border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
