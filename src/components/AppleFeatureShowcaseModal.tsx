import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Lock,
  ExternalLink,
  Check,
  Code2,
  PenTool,
  Globe,
  MessageSquare,
  Sparkles,
  Layers
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { EngineSettings } from '../types';

interface AppleFeatureShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  enableSound?: boolean;
  settings?: EngineSettings;
  onUpdateSettings?: React.Dispatch<React.SetStateAction<EngineSettings>>;
}

export const AppleFeatureShowcaseModal: React.FC<AppleFeatureShowcaseModalProps> = ({
  isOpen,
  onClose,
  enableSound = true,
  settings,
  onUpdateSettings,
}) => {
  // 4 Essential Clean Steps:
  // 0: Welcome
  // 1: Google AI Key (Optional)
  // 2: Workspace Focus / Use Cases (Gated)
  // 3: Ready / Workspace Launch
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      settings?.customApiKey ||
      settings?.apiKey ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('vg_user_api_key') || '' : '')
    );
  });

  // Step 2: Use Cases (Strictly unselected by default)
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  // Reset state on open: Enforce clean unselected defaults
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('vg_user_api_key') : null;
      if (settings?.customApiKey || settings?.apiKey) {
        setApiKey(settings.customApiKey || settings.apiKey || '');
      } else if (storedKey) {
        setApiKey(storedKey);
      }
      setSelectedUseCases([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = 4;

  // Strict Interaction Gating: Step 2 requires at least 1 selection
  const isNextDisabled = currentStep === 2 && selectedUseCases.length === 0;

  const handleNext = () => {
    if (isNextDisabled) return;

    playSound('click', enableSound);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      playSound('click', enableSound);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    playSound('pop', enableSound);

    const trimmedKey = apiKey.trim();
    const effectiveUseCases = selectedUseCases.length > 0 ? selectedUseCases : ['dev', 'dialog'];

    if (typeof localStorage !== 'undefined') {
      try {
        if (trimmedKey) {
          localStorage.setItem('vg_user_api_key', trimmedKey);
        }
        localStorage.setItem('dandelious_apple_showcase_seen_v1', 'true');
        const stored = localStorage.getItem('vanguard_engine_settings_v1');
        const parsed = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          'vanguard_engine_settings_v1',
          JSON.stringify({
            ...parsed,
            customApiKey: trimmedKey,
            apiKey: trimmedKey,
            useCases: effectiveUseCases,
          })
        );
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }
    }

    if (onUpdateSettings) {
      onUpdateSettings((prev) => ({
        ...prev,
        customApiKey: trimmedKey,
        apiKey: trimmedKey,
        useCases: effectiveUseCases,
      }));
    }

    onClose();
  };

  const toggleUseCase = (id: string) => {
    playSound('click', enableSound);
    setSelectedUseCases((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getButtonText = () => {
    if (currentStep === 0) return 'Fortfahren';
    if (currentStep === totalSteps - 1) return 'Workspace öffnen';
    return 'Weiter';
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-black z-[9999] flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none"
      id="ios-native-onboarding-fullscreen"
    >
      {/* 1. TOP NAVIGATION HEADER */}
      <div className="w-full flex justify-between items-center z-50">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Zurück"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}

        <button
          type="button"
          onClick={handleComplete}
          className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer px-2 py-1"
        >
          Überspringen
        </button>
      </div>

      {/* 2. DYNAMIC CONTENT STAGE (HERO + CONTENT) WITH TEXT-SLIDE PHYSICS */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between py-4 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          {/* STEP 0: WELCOME */}
          {currentStep === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Upper Half: Hero Visual Stage (50% height) */}
              <div className="h-[45vh] flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                  <Sparkles className="w-14 h-14 text-white stroke-[1.2]" />
                </div>
              </div>

              {/* Lower Half: Text Stage (50% height) */}
              <div className="text-center pb-6">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-center">
                  Willkommen bei Dandelious.
                </h1>
                <p className="text-slate-400 text-base leading-relaxed text-center mb-8 max-w-sm mx-auto">
                  Dein autonomer, privater KI-Arbeitsplatz. Entwickelt für maximale Geschwindigkeit und Privatsphäre.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 1: GOOGLE AI STUDIO KEY */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="h-[40vh] flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                  <Lock className="w-12 h-12 text-white stroke-[1.2]" />
                </div>
              </div>

              <div className="text-center pb-4">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-center">
                  Google AI Studio Key.
                </h2>
                <p className="text-slate-400 text-base leading-relaxed text-center mb-6 max-w-sm mx-auto">
                  Optional: Verbinde deinen Gemini API-Schlüssel für unbegrenzte Rechenleistung.
                </p>

                <div className="space-y-3">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#121212] border border-white/10 rounded-2xl p-4 text-center font-mono text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/30 transition-all"
                  />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Kostenlosen Schlüssel bei Google abrufen</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: WORKSPACE FOCUS (STRICTLY GATED) */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="h-[32vh] flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.1)]">
                  <Layers className="w-10 h-10 text-white stroke-[1.2]" />
                </div>
              </div>

              <div className="text-center pb-2">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-center">
                  Wofür nutzt du Dandelious?
                </h2>
                <p className="text-slate-400 text-base leading-relaxed text-center mb-6 max-w-sm mx-auto">
                  Wähle mindestens einen Schwerpunkt für deinen Arbeitsplatz.
                </p>

                <div className="space-y-2.5">
                  {[
                    { id: 'dev', title: 'Programmierung & Code', icon: Code2 },
                    { id: 'content', title: 'Texte & Kreation', icon: PenTool },
                    { id: 'research', title: 'Analyse & Recherche', icon: Globe },
                    { id: 'dialog', title: 'Freier KI-Dialog', icon: MessageSquare },
                  ].map((item) => {
                    const isSelected = selectedUseCases.includes(item.id);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleUseCase(item.id)}
                        className={`w-full p-4 rounded-2xl border font-medium text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-white/30 text-white'
                            : 'bg-[#121212] border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-white bg-white text-black' : 'border-white/20'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: READY / WORKSPACE LAUNCH */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="h-[45vh] flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.25)]">
                  <Check className="w-14 h-14 stroke-[2.5]" />
                </div>
              </div>

              <div className="text-center pb-6">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 text-center">
                  Alles bereit.
                </h2>
                <p className="text-slate-400 text-base leading-relaxed text-center mb-8 max-w-sm mx-auto">
                  Deine Umgebung wurde erfolgreich eingerichtet. Starte direkt in deinen Workspace.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. BOTTOM ACTION PILL BUTTON (STRICTLY GATED) */}
      <div className="w-full max-w-sm mx-auto mb-4 z-50">
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={handleNext}
          className={`w-full py-4 rounded-full text-center text-base font-semibold transition-all duration-300 flex items-center justify-center ${
            isNextDisabled
              ? 'bg-white/15 text-white/30 cursor-not-allowed pointer-events-none'
              : 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:bg-slate-200 cursor-pointer pointer-events-auto'
          }`}
          id="ios-native-onboarding-continue-cta"
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};
