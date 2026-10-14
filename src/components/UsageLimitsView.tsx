import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronDown, Key, Sparkles, Check, Trash2, ArrowUpRight } from 'lucide-react';

interface UsageLimitsViewProps {
  userTier?: string;
  customApiKey?: string;
  onSaveApiKey: (key: string) => void;
  onRemoveApiKey: () => void;
  onBack: () => void;
  onGoToUpgrade?: () => void;
  soundEnabled?: boolean;
}

const TOTAL_TICKS = 36;
const CYCLE_MS = 12 * 3600 * 1000; // 12 Stunden Zyklus

export const UsageLimitsView: React.FC<UsageLimitsViewProps> = ({
  userTier = 'Kostenlos',
  customApiKey = '',
  onSaveApiKey,
  onRemoveApiKey,
  onBack,
  onGoToUpgrade,
}) => {
  const hasKey = Boolean(customApiKey && customApiKey.trim().length > 0);
  const [apiKeyInput, setApiKeyInput] = useState(customApiKey || '');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronisiere Eingabefeld mit aktuellem Key
  useEffect(() => {
    setApiKeyInput(customApiKey || '');
  }, [customApiKey]);

  // Zyklus-Berechnung (12-Stunden-Zyklus)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const cycleProgress = useMemo(() => {
    // 12-Stunden-Block seit Epoch
    const currentBlock = Math.floor(now / CYCLE_MS) * CYCLE_MS;
    const elapsed = now - currentBlock;
    const remaining = CYCLE_MS - elapsed;
    const nextReset = new Date(currentBlock + CYCLE_MS);

    const m = Math.max(0, Math.ceil(remaining / 60000));
    const hrs = Math.floor(m / 60);
    const mins = m % 60;
    const leftText = `${hrs} Std. ${String(mins).padStart(2, '0')} Min.`;
    const atText = `um ${nextReset.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
    const progressPercent = Math.min(100, Math.max(0, (elapsed / CYCLE_MS) * 100));

    return { leftText, atText, progressPercent };
  }, [now]);

  // Status & Gauge
  const pct = 100; // Standard 100% verfügbar
  const stateColor = '#cfe45a'; // Limettengrün
  const state = hasKey
    ? {
        chip: 'Eigener API-Key',
        pct: '100%',
        lbl: 'Key aktiv',
        status: 'Eigener API-Key aktiv. Anfragen unterliegen den Kontingenten und Limits deines API-Anbieters.',
      }
    : {
        chip: 'Verfügbar',
        pct: '100%',
        lbl: 'verfügbar',
        status: 'Du hast vollen Zugriff auf alle Modelle.',
      };

  // 36 Ticks berechnen
  const tickLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < TOTAL_TICKS; i++) {
      const a = (i / TOTAL_TICKS) * Math.PI * 2 - Math.PI / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      lines.push({
        x1: 100 + c * 80,
        y1: 100 + s * 80,
        x2: 100 + c * 94,
        y2: 100 + s * 94,
      });
    }
    return lines;
  }, []);

  const activeTicksCount = hasKey ? TOTAL_TICKS : Math.round((pct / 100) * TOTAL_TICKS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setInputError('Bitte gib einen gültigen API-Key ein.');
      return;
    }
    setInputError(null);
    onSaveApiKey(trimmed);
    setIsSheetOpen(false);
    showToast('API-Key erfolgreich gespeichert');
  };

  const handleRemove = () => {
    onRemoveApiKey();
    setApiKeyInput('');
    setIsSheetOpen(false);
    showToast('API-Key entfernt');
  };

  return (
    <div className="relative -mx-4 -my-4 p-4 md:p-6 bg-[#000000] text-[#eef2e4] min-h-[580px] font-sans select-none pb-32">
      <style>{`
        .dandelious-limits-wrap {
          --surface: #161d14;
          --surface-2: #1e271b;
          --line: #2b3627;
          --text: #eef2e4;
          --muted: #9aa58f;
          --accent: #cfe45a;
          --accent-ink: #1a2307;
          --amber: #f0b25a;
          --red: #f27a5e;
        }
      `}</style>

      <div className="max-w-[480px] mx-auto dandelious-limits-wrap space-y-4">
        {/* Header */}
        <header className="flex items-center gap-3.5 py-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück"
            className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#eef2e4] hover:bg-[#1e271b] transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold tracking-tight text-[#eef2e4] truncate">
              Nutzung und Grenzwerte
            </h1>
          </div>
          {onGoToUpgrade && (
            <button
              type="button"
              onClick={onGoToUpgrade}
              className="px-3 py-1.5 rounded-full bg-[#1e271b] hover:bg-[#2b3627] border border-[#2b3627] text-xs font-semibold text-[#cfe45a] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Pläne</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </header>

        {/* Messgerät / Circular Gauge */}
        <section
          aria-live="polite"
          className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 text-center relative shadow-lg"
        >
          {/* Who Bar */}
          <div className="flex justify-between items-center text-left mb-2">
            <div>
              <b className="text-[18px] font-bold block text-[#eef2e4]">
                Dandelious AI Engine
              </b>
              <span className="text-[14px] text-[#9aa58f]">
                Plan: {userTier}
              </span>
            </div>
            <span
              className="px-3 py-1 rounded-full text-[13px] font-semibold border border-[#cfe45a]/30"
              style={{
                backgroundColor: 'rgba(207, 228, 90, 0.16)',
                color: stateColor,
              }}
            >
              {state.chip}
            </span>
          </div>

          {/* SVG Gauge */}
          <div className="relative w-[230px] h-[230px] mx-auto my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
              {tickLines.map((tick, index) => {
                const isOn = index < activeTicksCount;
                return (
                  <line
                    key={index}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke={isOn ? stateColor : '#1e271b'}
                    strokeWidth="7"
                    strokeLinecap="round"
                    className="transition-colors duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[50px] font-bold leading-none tracking-tight text-[#eef2e4]">
                {state.pct}
              </span>
              <span className="text-[15px] text-[#9aa58f] mt-1 font-medium">
                {state.lbl}
              </span>
            </div>
          </div>

          <p className="mt-2 text-[14px] text-[#9aa58f] max-w-[34ch] mx-auto leading-relaxed">
            {hasKey ? (
              <strong className="text-[#cfe45a] font-semibold">
                {state.status}
              </strong>
            ) : (
              <span>{state.status}</span>
            )}
          </p>
        </section>

        {/* Nächste Zurücksetzung */}
        <h2 className="text-[19px] font-bold text-[#eef2e4] pt-2">
          Nächste Zurücksetzung
        </h2>
        <section className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 space-y-3.5 shadow-lg">
          <div className="flex justify-between items-baseline gap-2">
            <b className="text-[26px] font-bold text-[#eef2e4]">
              {cycleProgress.leftText}
            </b>
            <span className="text-[14px] text-[#9aa58f]">
              {cycleProgress.atText}
            </span>
          </div>

          <div
            className="h-2.5 rounded-full bg-[#1e271b] overflow-hidden"
            role="progressbar"
            aria-label="Fortschritt im 12-Stunden-Zyklus"
            aria-valuenow={Math.round(cycleProgress.progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#cfe45a] transition-all duration-500"
              style={{ width: `${cycleProgress.progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[13px] text-[#9aa58f]">
            <span>Zyklusstart</span>
            <span>nach 12 Std.</span>
          </div>

          <p className="text-[14px] text-[#9aa58f] pt-1 leading-relaxed">
            {hasKey
              ? 'Mit deinem eigenen API-Key werden Anfragen direkt über deinen Provider verarbeitet (es gelten die dortigen Raten- und Kontingentlimits).'
              : 'Alle 12 Stunden werden deine Anfragen automatisch zurückgesetzt.'}
          </p>
        </section>

        {/* Collapsible Info: So funktioniert die Zurücksetzung */}
        <div className="bg-[#161d14] border border-[#2b3627] rounded-[16px] overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="w-full px-4 py-3.5 min-h-[54px] flex items-center gap-3 text-left font-semibold text-[15px] text-[#eef2e4] hover:bg-[#1e271b]/60 transition-colors cursor-pointer"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-[#cfe45a] shrink-0"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <span className="flex-1">So funktioniert die Zurücksetzung</span>
            <ChevronDown
              className={`w-5 h-5 text-[#9aa58f] transition-transform duration-200 shrink-0 ${
                isDetailsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDetailsOpen && (
            <div className="px-4 pb-4 pt-1 text-[14px] text-[#9aa58f] leading-relaxed border-t border-[#2b3627]/60">
              <p>
                Dein Nutzungslimit gilt für einen Zyklus von 12 Stunden. Danach werden alle Anfragen automatisch zurückgesetzt, du musst nichts tun. Auch bei Verwendung eines eigenen API-Keys gelten weiterhin die Limits und Modellkontingente deines jeweiligen API-Providers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dock (Unten fixiert) */}
      <div className="fixed left-0 right-0 bottom-0 z-20 bg-[#000000]/90 backdrop-blur-md border-t border-[#2b3627] px-4 py-3.5">
        <div className="max-w-[480px] mx-auto space-y-1.5">
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className={`w-full min-h-[52px] rounded-full font-semibold text-[16px] flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              hasKey
                ? 'bg-[#1e271b] hover:bg-[#2b3627] text-[#eef2e4] border border-[#2b3627]'
                : 'bg-[#cfe45a] hover:bg-[#d8ec68] text-[#1a2307] shadow-lg shadow-[#cfe45a]/20'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{hasKey ? 'API-Key verwalten' : 'Eigenen API-Key hinterlegen'}</span>
          </button>
          <small className="block text-center text-[#9aa58f] text-[13px]">
            {hasKey
              ? 'Eigener API-Key aktiv – Provider-Kontingente beachten'
              : 'Mit eigenem Key direkte Provider-Anbindung nutzen'}
          </small>
        </div>
      </div>

      {/* Eingabe-Fenster / Sheet */}
      {isSheetOpen && (
        <>
          <div
            onClick={() => setIsSheetOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity"
          />
          <div className="fixed left-0 right-0 bottom-0 z-40 bg-[#161d14] border-t border-[#2b3627] rounded-t-[26px] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="max-w-[480px] mx-auto space-y-4">
              <div>
                <h3 className="text-[22px] font-bold text-[#eef2e4] mb-1">
                  {hasKey ? 'API-Key verwalten' : 'API-Key hinterlegen'}
                </h3>
                <p className="text-[14px] text-[#9aa58f] leading-relaxed">
                  {hasKey
                    ? 'Dein Key ist gespeichert und aktiv. Anfragen laufen über dein Provider-Konto (unter Beachtung der dortigen Kontingente).'
                    : 'Füge deinen Gemini- oder OpenAI-kompatiblen Key ein, um direkte Modellabfragen über deinen eigenen Provider zu nutzen.'}
                </p>
              </div>

              <div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="API-Key einfügen (z. B. AIzaSy...)"
                  autoComplete="off"
                  aria-label="API-Key"
                  className="w-full min-h-[52px] rounded-[10px] border border-[#2b3627] bg-[#000000] text-[#eef2e4] px-4 font-mono text-[14px] focus:outline-none focus:border-[#cfe45a] transition-colors"
                />
                <small className="block mt-2 text-[#9aa58f] text-[13px]">
                  Der Key wird sicher verschlüsselt gespeichert und nur für deine Anfragen verwendet.
                </small>
                {inputError && (
                  <div className="mt-2 text-[13px] text-[#f27a5e] font-medium" role="alert">
                    {inputError}
                  </div>
                )}
              </div>

              <div className="grid gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full min-h-[50px] rounded-full bg-[#cfe45a] hover:bg-[#d8ec68] text-[#1a2307] font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{hasKey ? 'Aktualisieren' : 'Key speichern'}</span>
                </button>

                {hasKey && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="w-full min-h-[46px] rounded-full text-[#f27a5e] hover:bg-[#f27a5e]/10 font-medium text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Key entfernen</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="w-full min-h-[46px] rounded-full text-[#9aa58f] hover:text-[#eef2e4] font-medium text-[15px] flex items-center justify-center cursor-pointer transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 bg-[#eef2e4] text-[#000000] px-5 py-2.5 rounded-full font-medium text-[14px] shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none whitespace-nowrap flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1a2307]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
