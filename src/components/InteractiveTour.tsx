import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  Settings, 
  ArrowRight, 
  ArrowLeft,
  Check, 
  Key, 
  PenSquare, 
  Bot,
  User,
  BookOpen,
  Globe,
  Sliders,
  CreditCard
} from 'lucide-react';
import { DotMatrixCanvas } from './DotMatrixCanvas';

export type TourStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface InteractiveTourProps {
  isActive: boolean;
  step: TourStep;
  setStep: (step: TourStep) => void;
  onComplete: () => void;
  onSkip: () => void;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  onNewChat: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isActive,
  step,
  setStep,
  onComplete,
  onSkip,
  onOpenSettings,
  isSettingsOpen,
  onCloseSettings,
  onNewChat
}) => {
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!isActive) return null;

  // Step Meta Configuration
  const getStepData = () => {
    const monoBadge = 'text-lime-300 bg-lime-950/60 border-lime-800/40';
    switch (step) {
      case 1:
        return {
          badge: 'Schritt 1 von 9',
          badgeColor: monoBadge,
          icon: <Bot className="w-6 h-6 text-lime-300" />,
          title: 'Willkommen bei Saphir!',
          text: 'Hier tippst du deine Fragen, Code oder Texte ein. Klicke auf die Vorlage oder sende eine Nachricht, um zu starten.',
        };
      case 2:
        return {
          badge: 'Schritt 2 von 9',
          badgeColor: monoBadge,
          icon: <Settings className="w-6 h-6 text-lime-300 animate-spin" />,
          title: 'Saphir-Zentrale',
          text: 'Das Zahnrad öffnet deine Saphir-Zentrale. Klicke darauf, um die Einstellungen zu öffnen.',
        };
      case 3:
        return {
          badge: 'Schritt 3 von 9',
          badgeColor: monoBadge,
          icon: <User className="w-6 h-6 text-lime-300" />,
          title: 'Personalisierung & Tonfall',
          text: 'Bestimme, wie Saphir antwortet. Über die Einstellungen stellst du ein, ob die Antworten kurz & sachlich oder warm & ausführlich sein sollen.',
        };
      case 4:
        return {
          badge: 'Schritt 4 von 9',
          badgeColor: monoBadge,
          icon: <BookOpen className="w-6 h-6 text-lime-300" />,
          title: 'Erinnerung & System-Prompt',
          text: 'Das Dauer-Gedächtnis deiner KI. Hier kannst du feste Regeln hinterlegen (z. B. "Verwende immer Du" oder "Erkläre technische Begriffe einfach"), die Saphir nie vergisst.',
        };
      case 5:
        return {
          badge: 'Schritt 5 von 9',
          badgeColor: monoBadge,
          icon: <Globe className="w-6 h-6 text-lime-300" />,
          title: 'Allgemein & Websuche',
          text: 'Aktiviere die Echtzeit-Websuche, wenn Saphir tagesaktuelle Informationen direkt live aus dem Internet abrufen soll.',
        };
      case 6:
        return {
          badge: 'Schritt 6 von 9',
          badgeColor: monoBadge,
          icon: <Key className="w-6 h-6 text-lime-300" />,
          title: 'API & Keys',
          text: 'Verbinde deinen eigenen API-Key, um erweiterte Limits freizuschalten. Dein Schlüssel wird ausschließlich lokal auf deinem Gerät gespeichert.',
        };
      case 7:
        return {
          badge: 'Schritt 7 von 9',
          badgeColor: monoBadge,
          icon: <Sliders className="w-6 h-6 text-lime-300" />,
          title: 'Model & Engine',
          text: 'Steuere die Kreativität: Niedrige Temperatur-Werte liefern präzise, logische Antworten. Hohe Werte machen die Antworten einfallsreich.',
        };
      case 8:
        return {
          badge: 'Schritt 8 von 9',
          badgeColor: monoBadge,
          icon: <CreditCard className="w-6 h-6 text-lime-300" />,
          title: 'Abonnement & Cards',
          text: 'Sieh deine aktuellen Nachrichtengrenzen ein oder löse hier Access-Cards ein, um Kontingente freizuschalten.',
        };
      case 9:
        return {
          badge: 'Schritt 9 von 9',
          badgeColor: monoBadge,
          icon: <PenSquare className="w-6 h-6 text-lime-300" />,
          title: 'Die Seitenleiste & Verlauf',
          text: 'Alles bereit! Links findest du deine Chat-Historie. Du kannst dieses Tutorial jederzeit unter "Einstellungen" erneut aufrufen.',
        };
    }
  };

  const stepData = getStepData();

  // Trigger Anti-Spam Animation Lock (300ms)
  const triggerTransitionLock = () => {
    setIsTransitioning(true);
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleNextStep = () => {
    if (isTransitioning) return;
    triggerTransitionLock();

    if (step < 9) {
      setStep((step + 1) as TourStep);
    } else {
      onComplete();
    }
  };

  const handlePrevStep = () => {
    if (isTransitioning) return;
    triggerTransitionLock();

    if (step > 1) {
      setStep((step - 1) as TourStep);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`tour-full-screen-step-${step}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[10000] bg-[#08080a] text-white flex flex-col justify-between p-6 sm:p-12 w-full h-full min-h-screen overflow-hidden select-none font-['Plus_Jakarta_Sans']"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800/80 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-900/30 border border-lime-500/30 flex items-center justify-center text-lime-300 font-bold">
              S
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">Saphir Interaktives Tutorial</h2>
              <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-semibold mt-0.5 ${stepData.badgeColor}`}>
                {stepData.badge}
              </span>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 border border-neutral-800 cursor-pointer"
          >
            <span>Überspringen</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center Main Card */}
        <div className="max-w-2xl mx-auto w-full my-auto py-8 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-lime-900/25 border border-lime-500/30 flex items-center justify-center text-lime-300 shadow-[0_0_30px_rgba(126,34,206,0.2)]">
            {stepData.icon}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {stepData.title}
            </h1>
            <p className="text-base text-neutral-300 leading-relaxed font-normal">
              {stepData.text}
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 pt-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  step === i + 1 ? 'w-8 bg-lime-700' : 'w-2 bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Footer Navigation */}
        <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between max-w-4xl mx-auto w-full">
          <div>
            {step > 1 ? (
              <button
                disabled={isTransitioning}
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <motion.button
            disabled={isTransitioning}
            whileTap={{ scale: 0.97 }}
            onClick={handleNextStep}
            className="bg-lime-700 hover:bg-lime-600 text-white px-7 py-3 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(126,34,206,0.4)] transition-all flex items-center gap-2 cursor-pointer border border-lime-500/40"
          >
            <span>{step === 9 ? 'Saphir starten' : 'Weiter'}</span>
            {step < 9 ? <ArrowRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

