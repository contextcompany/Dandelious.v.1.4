import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  X, 
  Settings2, 
  ArrowUpRight, 
  TrendingUp, 
  FolderKanban, 
  MessageSquare,
  Zap,
  Volume2
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface GeminiPromptBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
  onOpenActionGuide?: () => void;
  enableSound?: boolean;
}

export const GeminiPromptBar: React.FC<GeminiPromptBarProps> = ({
  isOpen,
  onClose,
  onSubmitPrompt,
  onOpenActionGuide,
  enableSound = true,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'de-DE';

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setPromptText(currentTranscript);
          }
        };

        rec.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Voice volume simulation animation when listening
  useEffect(() => {
    let interval: any = null;
    if (isListening) {
      interval = setInterval(() => {
        setVoiceVolume(Math.random() * 0.8 + 0.2);
      }, 150);
    } else {
      setVoiceVolume(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Focus input field on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      setPromptText('');
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  }, [isOpen]);

  const toggleListening = () => {
    playSound('click', enableSound);
    if (!speechSupported) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Failed to start speech recognition:', e);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;

    playSound('pop', enableSound);
    const textToSend = promptText.trim();
    setPromptText('');
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    onSubmitPrompt(textToSend);
    onClose();
  };

  const handleChipClick = (chipPrompt: string) => {
    playSound('click', enableSound);
    onSubmitPrompt(chipPrompt);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSound('click', enableSound);
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Gemini Style Bottom Sheet / Prompt Bar Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[101] p-3 sm:p-5 pb-6 sm:pb-8 flex flex-col items-center justify-end pointer-events-none"
          >
            <div className="w-full max-w-3xl pointer-events-auto relative rounded-3xl bg-[#242426] border border-white/10 shadow-[0_-15px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(197,220,87,0.1)] overflow-hidden backdrop-blur-2xl">
              
              {/* Luminous Animated Aurora Glow Line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-400 animate-pulse" />
              {isListening && (
                <div 
                  className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-400 via-lime-300 to-emerald-400 transition-all duration-150"
                  style={{ opacity: 0.7 + voiceVolume * 0.3, filter: `blur(${voiceVolume * 2}px)` }}
                />
              )}

              {/* Header Bar */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2c2c2e] border border-white/10 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5DC57] animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-lime-300 flex items-center gap-1.5">
                      Gemini Sprach- & Promptleiste
                      <span className="inline-block w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                    </span>
                    <p className="text-[10px] text-neutral-400 hidden xs:block">
                      Via Ein-Ausschaltknopf, Actionbutton oder Kurzbefehl
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenActionGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', enableSound);
                        onOpenActionGuide();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#2c2c2e] hover:bg-[#343438] text-neutral-200 border border-white/10 transition-colors cursor-pointer"
                      title="Ein-Ausschaltknopf & Actionbutton konfigurieren"
                    >
                      <Settings2 className="w-3 h-3 text-[#C5DC57]" />
                      <span className="hidden sm:inline">Button-Setup</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', enableSound);
                      onClose();
                    }}
                    className="w-8 h-8 rounded-full bg-[#2c2c2e] hover:bg-[#343438] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/5"
                    aria-label="Schließen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Prompt Input Area */}
              <div className="p-4 sm:p-5">
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                  <div className="relative flex-1 flex items-center rounded-2xl bg-[#2c2c2e] border border-white/10 focus-within:border-white/20 focus-within:ring-2 focus-within:ring-white/10 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder={
                        isListening
                          ? 'Spreche jetzt... Ich höre zu...'
                          : 'Frage Dandelious oder tippe eine Anweisung...'
                      }
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder-neutral-400 focus:outline-none"
                    />

                    {/* Microphone Toggle Button */}
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`mr-2 p-2 rounded-xl transition-all ${
                          isListening
                            ? 'bg-[#C5DC57] text-black shadow-lg shadow-lime-500/30 scale-105 animate-pulse'
                            : 'text-neutral-300 hover:text-white hover:bg-white/10'
                        }`}
                        title={isListening ? 'Mikrofon ausschalten' : 'Sprechen (Spracherkennung)'}
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!promptText.trim()}
                    className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${
                      promptText.trim()
                        ? 'bg-[#C5DC57] hover:bg-[#b8d049] text-black font-semibold shadow-lg shadow-[#C5DC57]/20 hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-[#2c2c2e] text-neutral-500 cursor-not-allowed border border-white/5'
                    }`}
                    title="Prompt senden"
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </form>

                {/* Voice Visualizer Indicator when recording */}
                {isListening && (
                  <div className="mt-3 py-2 px-3 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-lime-400 animate-pulse" />
                      <span className="text-xs font-medium text-lime-300">
                        Spracheingabe aktiv...
                      </span>
                    </div>
                    {/* Simulated Voice Waveform Bars */}
                    <div className="flex items-center gap-1">
                      {[0.4, 0.8, 0.3, 0.9, 0.5, 0.7, 0.2].map((factor, i) => (
                        <div
                          key={i}
                          className="w-1 bg-lime-400 rounded-full transition-all duration-100"
                          style={{
                            height: `${Math.max(4, voiceVolume * 24 * factor)}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Suggestion Chips */}
                <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
                    <Zap className="w-3 h-3 text-[#C5DC57]" />
                    Schnellaktionen:
                  </span>

                  <button
                    type="button"
                    onClick={() => handleChipClick('Wie entwickelt sich der Finanzmarkt heute? Gib mir ein kurzes Update.')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2c2c2e] hover:bg-[#343438] border border-white/5 text-xs font-medium text-neutral-200 hover:text-white transition-all whitespace-nowrap group cursor-pointer shadow-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Markt-Update</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChipClick('Starte ein neues Brainstorming für ein Projekt.')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2c2c2e] hover:bg-[#343438] border border-white/5 text-xs font-medium text-neutral-200 hover:text-white transition-all whitespace-nowrap group cursor-pointer shadow-sm"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>Projekt-Idee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChipClick('Hallo Dandelious! Was kannst du heute für mich tun?')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2c2c2e] hover:bg-[#343438] border border-white/5 text-xs font-medium text-neutral-200 hover:text-white transition-all whitespace-nowrap group cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#C5DC57] group-hover:scale-110 transition-transform" />
                    <span>Neuer Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChipClick('Fasse mir die wichtigsten aktuellen Tech-News zusammen.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-all whitespace-nowrap group cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>News-Briefing</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
