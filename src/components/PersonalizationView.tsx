import React, { useState } from 'react';
import { 
  ChevronLeft, Check, Sparkles, Camera, RotateCcw, 
  User, Briefcase, Sliders, MessageSquare, BookOpen, 
  ExternalLink, ArrowRight, Zap, CheckCircle2 
} from 'lucide-react';
import { playSound } from '../utils/sound';

export interface PersonalizationViewProps {
  onBack: () => void;
  soundEnabled?: boolean;

  // Tone & Style
  toneStyle: 'Standard' | 'Professionell' | 'Locker' | 'Akademisch' | 'Kreativ';
  onSelectTone: (tone: 'Standard' | 'Professionell' | 'Locker' | 'Akademisch' | 'Kreativ') => void;

  warmth: 'Standard' | 'Mehr' | 'Weniger';
  onSelectWarmth: (warmth: 'Standard' | 'Mehr' | 'Weniger') => void;

  enthusiasm: 'Weniger' | 'Standard' | 'Mehr';
  onSelectEnthusiasm: (enthusiasm: 'Weniger' | 'Standard' | 'Mehr') => void;

  headingsLists: 'Mehr' | 'Standard' | 'Weniger';
  onSelectHeadingsLists: (level: 'Mehr' | 'Standard' | 'Weniger') => void;

  emojiLevel: 'Weniger' | 'Standard' | 'Mehr';
  onSelectEmojiLevel: (emoji: 'Weniger' | 'Standard' | 'Mehr') => void;

  // Toggles
  fastAnswers: boolean;
  onToggleFastAnswers: (val: boolean) => void;

  enhancedAnswers: boolean;
  onToggleEnhancedAnswers: (val: boolean) => void;

  librarySearch: boolean;
  onToggleLibrarySearch: (val: boolean) => void;

  // Custom Instructions & Profile
  customInstructions: string;
  onChangeCustomInstructions: (val: string) => void;

  userNickname: string;
  onChangeUserNickname: (val: string) => void;

  userOccupation: string;
  onChangeUserOccupation: (val: string) => void;

  userAbout: string;
  onChangeUserAbout: (val: string) => void;

  // Subpages & Reset
  onOpenReferencePhotos?: () => void;
  onResetToDefaults?: () => void;
}

const TONE_OPTIONS: Array<'Standard' | 'Professionell' | 'Locker' | 'Akademisch' | 'Kreativ'> = [
  'Standard',
  'Professionell',
  'Locker',
  'Akademisch',
  'Kreativ'
];

const QUICK_INSTRUCTION_TAGS = [
  'Prägnant & ohne Floskeln',
  'Immer auf Deutsch',
  'Bevorzuge TypeScript',
  'Schritt-für-Schritt erklären',
  'Faktenbasiert mit Quellen',
  'Keine langen Einleitungen'
];

export const PersonalizationView: React.FC<PersonalizationViewProps> = ({
  onBack,
  soundEnabled = true,
  toneStyle,
  onSelectTone,
  warmth,
  onSelectWarmth,
  enthusiasm,
  onSelectEnthusiasm,
  headingsLists,
  onSelectHeadingsLists,
  emojiLevel,
  onSelectEmojiLevel,
  fastAnswers,
  onToggleFastAnswers,
  enhancedAnswers,
  onToggleEnhancedAnswers,
  librarySearch,
  onToggleLibrarySearch,
  customInstructions,
  onChangeCustomInstructions,
  userNickname,
  onChangeUserNickname,
  userOccupation,
  onChangeUserOccupation,
  userAbout,
  onChangeUserAbout,
  onOpenReferencePhotos,
  onResetToDefaults
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    playSound('pop', soundEnabled);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleAddInstructionTag = (tag: string) => {
    const trimmed = customInstructions.trim();
    if (trimmed.includes(tag)) return;
    const separator = trimmed.length > 0 ? (trimmed.endsWith('.') || trimmed.endsWith(';') ? ' ' : '; ') : '';
    const updated = `${trimmed}${separator}${tag}`;
    onChangeCustomInstructions(updated);
    showToast(`"${tag}" hinzugefügt`);
  };

  const warmthLabels: Record<'Weniger' | 'Standard' | 'Mehr', string> = {
    Weniger: 'Professionell & sachlich',
    Standard: 'Natürlich & ausgewogen',
    Mehr: 'Freundlicher und persönlicher'
  };

  const enthusiasmLabels: Record<'Weniger' | 'Standard' | 'Mehr', string> = {
    Weniger: 'Ruhig & faktenorientiert',
    Standard: 'Ausgewogen',
    Mehr: 'Lebendig & motivierend'
  };

  const headingsLabels: Record<'Weniger' | 'Standard' | 'Mehr', string> = {
    Weniger: 'Kompakter Fließtext',
    Standard: 'Gemischtes Format',
    Mehr: 'Strukturiert mit Listen & Titeln'
  };

  const emojiLabels: Record<'Weniger' | 'Standard' | 'Mehr', string> = {
    Weniger: 'Keine oder minimale Emojis',
    Standard: 'Gezielt & dezent',
    Mehr: 'Ausdrucksstark & bunt'
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#eef2e4] font-['DM_Sans',system-ui,sans-serif] pb-36">
      <div className="max-w-[480px] mx-auto px-4.5 pt-4">
        {/* Kopfbereich */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Zurück"
              className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#eef2e4] hover:border-[#cfe45a]/50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-[22px] font-bold tracking-tight text-[#eef2e4]"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
              Personalisierung
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              showToast('Änderungen gespeichert');
              onBack();
            }}
            className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] hover:border-[#cfe45a] transition-colors cursor-pointer"
            title="Fertig & Schließen"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>
        </header>

        {/* 1. STIL & TONFALL */}
        <h2 
          className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-7 mb-2.5 px-1"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Stil & Tonfall
        </h2>

        <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 space-y-5">
          {/* Basisstil */}
          <div>
            <div className="flex justify-between items-baseline gap-2 mb-2.5">
              <span className="font-semibold text-sm text-[#eef2e4]">Basisstil und -tonfall</span>
              <span className="text-xs text-[#9aa58f]">{toneStyle}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((t) => {
                const isSelected = toneStyle === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onSelectTone(t);
                      playSound('pop', soundEnabled);
                    }}
                    className={`min-h-[40px] px-4 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#cfe45a] text-[#1a2307] border-[#cfe45a] font-semibold shadow-sm'
                        : 'bg-[#1e271b] text-[#9aa58f] border-[#2b3627] hover:text-[#eef2e4] hover:border-[#cfe45a]/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Herzlichkeit */}
          <div className="pt-4 border-t border-[#2b3627]">
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="font-semibold text-sm text-[#eef2e4]">Herzlichkeit</span>
              <span className="text-xs text-[#9aa58f]">{warmthLabels[warmth]}</span>
            </div>
            <div className="grid grid-cols-3 bg-[#1e271b] rounded-full p-1 border border-[#2b3627]/60">
              {(['Weniger', 'Standard', 'Mehr'] as const).map((w) => {
                const active = warmth === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      onSelectWarmth(w);
                      playSound('pop', soundEnabled);
                    }}
                    className={`min-h-[38px] rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-[#cfe45a] text-[#1a2307] font-semibold shadow-sm'
                        : 'text-[#9aa58f] hover:text-[#eef2e4]'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Begeisterung */}
          <div className="pt-4 border-t border-[#2b3627]">
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="font-semibold text-sm text-[#eef2e4]">Begeisterung</span>
              <span className="text-xs text-[#9aa58f]">{enthusiasmLabels[enthusiasm]}</span>
            </div>
            <div className="grid grid-cols-3 bg-[#1e271b] rounded-full p-1 border border-[#2b3627]/60">
              {(['Weniger', 'Standard', 'Mehr'] as const).map((e) => {
                const active = enthusiasm === e;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onSelectEnthusiasm(e);
                      playSound('pop', soundEnabled);
                    }}
                    className={`min-h-[38px] rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-[#cfe45a] text-[#1a2307] font-semibold shadow-sm'
                        : 'text-[#9aa58f] hover:text-[#eef2e4]'
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Überschriften & Listen */}
          <div className="pt-4 border-t border-[#2b3627]">
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="font-semibold text-sm text-[#eef2e4]">Überschriften und Listen</span>
              <span className="text-xs text-[#9aa58f]">{headingsLabels[headingsLists]}</span>
            </div>
            <div className="grid grid-cols-3 bg-[#1e271b] rounded-full p-1 border border-[#2b3627]/60">
              {(['Weniger', 'Standard', 'Mehr'] as const).map((l) => {
                const active = headingsLists === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      onSelectHeadingsLists(l);
                      playSound('pop', soundEnabled);
                    }}
                    className={`min-h-[38px] rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-[#cfe45a] text-[#1a2307] font-semibold shadow-sm'
                        : 'text-[#9aa58f] hover:text-[#eef2e4]'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emojis */}
          <div className="pt-4 border-t border-[#2b3627]">
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="font-semibold text-sm text-[#eef2e4]">Emojis</span>
              <span className="text-xs text-[#9aa58f]">{emojiLabels[emojiLevel]}</span>
            </div>
            <div className="grid grid-cols-3 bg-[#1e271b] rounded-full p-1 border border-[#2b3627]/60">
              {(['Weniger', 'Standard', 'Mehr'] as const).map((em) => {
                const active = emojiLevel === em;
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      onSelectEmojiLevel(em);
                      playSound('pop', soundEnabled);
                    }}
                    className={`min-h-[38px] rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-[#cfe45a] text-[#1a2307] font-semibold shadow-sm'
                        : 'text-[#9aa58f] hover:text-[#eef2e4]'
                    }`}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. REFERENZFOTOS CARD */}
        <h2 
          className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-7 mb-2.5 px-1"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Visuelle Identität
        </h2>

        <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 
                className="text-base font-bold text-[#eef2e4]"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
              >
                Referenzfotos
              </h3>
              <p className="text-xs text-[#9aa58f] leading-relaxed">
                Diese Fotos helfen Dandelious, Bilder zu erstellen, die dir und deinem Stil ähnlicher sehen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenReferencePhotos) onOpenReferencePhotos();
              }}
              className="px-4 py-2 rounded-full bg-[#cfe45a]/15 hover:bg-[#cfe45a]/25 text-[#cfe45a] border border-[#cfe45a]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Verwalten</span>
            </button>
          </div>
        </div>

        {/* 3. ANTWORTMODUS & RECHERCHE */}
        <h2 
          className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-7 mb-2.5 px-1"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Antwortmodus & Suche
        </h2>

        <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 space-y-4 divide-y divide-[#2b3627]">
          {/* Schnelle Antworten */}
          <div className="flex items-start justify-between gap-4 pt-1">
            <div className="space-y-1">
              <span className="font-semibold text-sm text-[#eef2e4] block">Schnelle Antworten</span>
              <p className="text-xs text-[#9aa58f] leading-relaxed">
                Dandelious greift auf Allgemeinwissen zurück, um blitzschnell zu antworten. Schnelle Antworten sind nicht personalisiert und nutzen deine Erinnerungen nicht.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fastAnswers}
              onClick={() => {
                onToggleFastAnswers(!fastAnswers);
                playSound('click', soundEnabled);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                fastAnswers ? 'bg-[#cfe45a]' : 'bg-[#1e271b] border border-[#2b3627]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                  fastAnswers ? 'translate-x-5 bg-[#1a2307]' : 'translate-x-0 bg-white/70'
                }`}
              />
            </button>
          </div>

          {/* Erweiterte Antworten */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-1">
              <span className="font-semibold text-sm text-[#eef2e4] block">Erweiterte Antworten</span>
              <p className="text-xs text-[#9aa58f] leading-relaxed">
                Benutzerdefinierte Layouts, interaktive Komponenten und Tabellen in Antworten aktivieren.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enhancedAnswers}
              onClick={() => {
                onToggleEnhancedAnswers(!enhancedAnswers);
                playSound('click', soundEnabled);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enhancedAnswers ? 'bg-[#cfe45a]' : 'bg-[#1e271b] border border-[#2b3627]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                  enhancedAnswers ? 'translate-x-5 bg-[#1a2307]' : 'translate-x-0 bg-white/70'
                }`}
              />
            </button>
          </div>

          {/* Bibliothekssuche */}
          <div className="flex items-start justify-between gap-4 pt-4">
            <div className="space-y-1">
              <span className="font-semibold text-sm text-[#eef2e4] block">Bibliothekssuche</span>
              <p className="text-xs text-[#9aa58f] leading-relaxed">
                Zulassen, dass Dandelious automatisch Dokumente in deiner Mediathek und Bibliothek durchsucht.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={librarySearch}
              onClick={() => {
                onToggleLibrarySearch(!librarySearch);
                playSound('click', soundEnabled);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                librarySearch ? 'bg-[#cfe45a]' : 'bg-[#1e271b] border border-[#2b3627]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                  librarySearch ? 'translate-x-5 bg-[#1a2307]' : 'translate-x-0 bg-white/70'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 4. BENUTZERDEFINIERTE ANWEISUNGEN */}
        <h2 
          className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-7 mb-2.5 px-1"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Benutzerdefinierte Anweisungen
        </h2>

        <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 space-y-3">
          <div>
            <h3 
              className="text-base font-bold text-[#eef2e4]"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
              Was soll Dandelious berücksichtigen?
            </h3>
            <p className="text-xs text-[#9aa58f] mt-1 leading-relaxed">
              Formuliere Regeln oder Verhaltensweisen, die bei jeder generierten Antwort beachtet werden sollen.
            </p>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={customInstructions}
              onChange={(e) => onChangeCustomInstructions(e.target.value)}
              placeholder="z. B. Bevorzuge TypeScript, antworte stets prägnant auf Deutsch, fasse Quellen strukturiert zusammen..."
              className="w-full bg-[#1e271b] border border-[#2b3627] rounded-2xl p-3.5 text-sm text-[#eef2e4] placeholder-[#9aa58f]/60 focus:outline-none focus:border-[#cfe45a] transition-colors resize-none leading-relaxed"
            />
            <div className="flex justify-between items-center text-[11px] text-[#9aa58f] mt-1 px-1">
              <span>Wird nahtlos in den Systemprompt eingebettet</span>
              <span>{customInstructions.length} Zeichen</span>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="pt-2">
            <span className="text-[11px] font-medium text-[#9aa58f] uppercase tracking-wider block mb-2">
              Schnellbausteine
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INSTRUCTION_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddInstructionTag(tag)}
                  className="px-2.5 py-1 rounded-full bg-[#1e271b] hover:bg-[#2b3627] text-[#9aa58f] hover:text-[#cfe45a] border border-[#2b3627] text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>+</span>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. DEIN PROFIL */}
        <h2 
          className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-7 mb-2.5 px-1"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          Dein Profil & Kontext
        </h2>

        <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 space-y-4">
          {/* Rufname */}
          <div>
            <label className="block text-xs font-medium text-[#9aa58f] mb-1.5">
              Wie soll Dandelious dich ansprechen?
            </label>
            <div className="relative">
              <input
                type="text"
                value={userNickname}
                onChange={(e) => onChangeUserNickname(e.target.value)}
                placeholder="z. B. Vincent, Alex"
                className="w-full bg-[#1e271b] border border-[#2b3627] rounded-xl px-3.5 py-2.5 text-sm text-[#eef2e4] placeholder-[#9aa58f]/50 focus:outline-none focus:border-[#cfe45a] transition-colors"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa58f]" />
            </div>
          </div>

          {/* Beruf */}
          <div className="pt-3 border-t border-[#2b3627]">
            <label className="block text-xs font-medium text-[#9aa58f] mb-1.5">
              Was machst du? (Beruf oder Rolle)
            </label>
            <div className="relative">
              <input
                type="text"
                value={userOccupation}
                onChange={(e) => onChangeUserOccupation(e.target.value)}
                placeholder="z. B. Software Engineer, Designer, Student"
                className="w-full bg-[#1e271b] border border-[#2b3627] rounded-xl px-3.5 py-2.5 text-sm text-[#eef2e4] placeholder-[#9aa58f]/50 focus:outline-none focus:border-[#cfe45a] transition-colors"
              />
              <Briefcase className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa58f]" />
            </div>
          </div>

          {/* Über dich */}
          <div className="pt-3 border-t border-[#2b3627]">
            <label className="block text-xs font-medium text-[#9aa58f] mb-1.5">
              Über dich (Interessen & Lieblingsthemen)
            </label>
            <textarea
              rows={2}
              value={userAbout}
              onChange={(e) => onChangeUserAbout(e.target.value)}
              placeholder="z. B. Begeistert von KI-Agenten, Musiktheorie und Astronomie..."
              className="w-full bg-[#1e271b] border border-[#2b3627] rounded-xl p-3 text-sm text-[#eef2e4] placeholder-[#9aa58f]/50 focus:outline-none focus:border-[#cfe45a] transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Floating Bottom Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[444px] bg-[#161d14]/90 backdrop-blur-xl border border-[#2b3627] rounded-full p-2 pl-4 flex items-center justify-between gap-3 shadow-2xl z-40">
        <div className="flex items-center gap-2 text-xs text-[#9aa58f]">
          <Sparkles className="w-4 h-4 text-[#cfe45a]" />
          <span>Änderungen aktiv</span>
        </div>

        <div className="flex items-center gap-2">
          {onResetToDefaults && (
            <button
              type="button"
              onClick={() => {
                onResetToDefaults();
                showToast('Auf Standardwerte zurückgesetzt');
              }}
              className="px-3.5 py-2 rounded-full bg-[#1e271b] hover:bg-[#2b3627] text-[#9aa58f] hover:text-[#eef2e4] border border-[#2b3627] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standard</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              showToast('Personalisierung gesichert');
              onBack();
            }}
            className="px-5 py-2 rounded-full bg-[#cfe45a] hover:bg-[#b4cb4b] text-[#1a2307] text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-[#cfe45a]/20 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Fertig</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#161d14] border border-[#cfe45a] text-[#cfe45a] px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#cfe45a]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
