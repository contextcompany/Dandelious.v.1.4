import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ImagePlus,
  Camera,
  Paperclip,
  HardDrive,
  Palette,
  FileText,
  Video,
  Music,
  SquareCode,
  Orbit,
  BookOpen,
  Mic,
  X
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface PlusActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: () => void;
  onSelectCamera: () => void;
  onSelectFile: () => void;
  onSelectDocument?: () => void;
  onSelectCanvas?: () => void;
  onSelectDeepResearch?: () => void;
  onSelectTutor?: () => void;
  onSelectTranscribe?: () => void;
  soundEnabled?: boolean;
}

export const PlusActionDrawer: React.FC<PlusActionDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectCamera,
  onSelectFile,
  onSelectDocument,
  onSelectCanvas,
  onSelectDeepResearch,
  onSelectTutor,
  onSelectTranscribe,
  soundEnabled = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="fixed inset-0 bg-black/75 z-40"
          />

          {/* Bottom Sheet Drawer - connected to sides and bottom, solid grey */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-50 w-full bg-[#1c1c1e] sm:bg-[#242426] border-0 rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none mb-0 pt-3 pb-8 sm:pb-10 px-4 sm:px-6 shadow-[0_-12px_40px_rgba(0,0,0,0.95)] text-white select-none max-h-[85vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-xl mx-auto w-full">
              {/* Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />

              {/* Top Quick Actions Row: Fotos, Kamera, Dateien */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } }
                }}
                className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 px-1"
              >
                {/* Fotos */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.94 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onSelectPhoto();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2c2c2e] group-hover:bg-[#343438] border-0 group-hover:border-white/15 text-neutral-200 group-hover:text-white flex items-center justify-center transition-all shadow-md">
                    <ImagePlus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-300 group-hover:text-white">Fotos</span>
                </motion.button>

                {/* Kamera */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.94 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onSelectCamera();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2c2c2e] group-hover:bg-[#343438] border-0 group-hover:border-white/15 text-neutral-200 group-hover:text-white flex items-center justify-center transition-all shadow-md">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-300 group-hover:text-white">Kamera</span>
                </motion.button>

                {/* Dateien */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.94 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onSelectFile();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#2c2c2e] group-hover:bg-[#343438] border-0 group-hover:border-white/15 text-neutral-200 group-hover:text-white flex items-center justify-center transition-all shadow-md">
                    <Paperclip className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
                  </div>
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-300 group-hover:text-white">Dateien</span>
                </motion.button>
              </motion.div>

              {/* List of Feature Options (Dokument, Canvas, Deep Research, Lernhilfe, Audio) */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } }
                }}
                className="space-y-2 pt-1"
              >
                {/* 1. Dokument */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.97 },
                    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
                  }}
                  whileHover={{ scale: 1.015, x: 4, backgroundColor: '#343438' }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    if (onSelectDocument) onSelectDocument();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full bg-[#2c2c2e] border-0 text-left transition-colors cursor-pointer group shadow-sm"
                >
                  <FileText className="w-5.5 h-5.5 text-neutral-300 group-hover:text-white shrink-0 stroke-[1.75]" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-neutral-200 group-hover:text-white">Dokument</span>
                    <span className="text-xs text-neutral-400">Strukturierte Konzepte, Berichte & Dossiers erstellen</span>
                  </div>
                </motion.button>

                {/* 2. Canvas */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.97 },
                    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
                  }}
                  whileHover={{ scale: 1.015, x: 4, backgroundColor: '#343438' }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    if (onSelectCanvas) onSelectCanvas();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full bg-[#2c2c2e] border-0 text-left transition-colors cursor-pointer group shadow-sm"
                >
                  <SquareCode className="w-5.5 h-5.5 text-neutral-300 group-hover:text-white shrink-0 stroke-[1.75]" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-neutral-200 group-hover:text-white">Canvas</span>
                    <span className="text-xs text-neutral-400">Programmieren, schreiben oder Präsentationen erstellen</span>
                  </div>
                </motion.button>

                {/* 3. Deep Research */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.97 },
                    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
                  }}
                  whileHover={{ scale: 1.015, x: 4, backgroundColor: '#343438' }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    if (onSelectDeepResearch) onSelectDeepResearch();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full bg-[#2c2c2e] border-0 text-left transition-colors cursor-pointer group shadow-sm"
                >
                  <Orbit className="w-5.5 h-5.5 text-neutral-300 group-hover:text-white shrink-0 stroke-[1.75]" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-neutral-200 group-hover:text-white">Deep Research</span>
                    <span className="text-xs text-neutral-400">Erstelle detaillierte Berichte mit Live-Quellen</span>
                  </div>
                </motion.button>

                {/* 4. Lernhilfe */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.97 },
                    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
                  }}
                  whileHover={{ scale: 1.015, x: 4, backgroundColor: '#343438' }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    if (onSelectTutor) onSelectTutor();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full bg-[#2c2c2e] border-0 text-left transition-colors cursor-pointer group shadow-sm"
                >
                  <BookOpen className="w-5.5 h-5.5 text-neutral-300 group-hover:text-white shrink-0 stroke-[1.75]" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-neutral-200 group-hover:text-white">Lernhilfe</span>
                    <span className="text-xs text-neutral-400">Detaillierte Anleitung und interaktive Erklärungen</span>
                  </div>
                </motion.button>

                {/* 5. Audio transkribieren */}
                <motion.button
                  variants={{
                    hidden: { opacity: 0, x: -12, scale: 0.97 },
                    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } }
                  }}
                  whileHover={{ scale: 1.015, x: 4, backgroundColor: '#343438' }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    if (onSelectTranscribe) onSelectTranscribe();
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full bg-[#2c2c2e] border border-white/5 text-left transition-colors cursor-pointer group shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-[#3a3a3d] border border-white/5 flex items-center justify-center text-white shrink-0">
                    <Mic className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-white">
                        Audio transkribieren
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">
                      Sprache mit dem Mikrofon aufnehmen & sofort in Text umwandeln
                    </span>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
