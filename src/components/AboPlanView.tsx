import React, { useState } from 'react';
import { ChevronLeft, Check, Sparkles, Key, AlertCircle } from 'lucide-react';

interface AboPlanViewProps {
  currentTier: string;
  onBack: () => void;
  onOpenLimits?: () => void;
  onSwitchPlan: (planId: string) => void;
  onRedeemAccessCard: (code: string) => { success: boolean; message: string; tier?: string };
}

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'Free' | 'Plus' | 'Pro' | 'Ultra';

interface PlanConfig {
  id: PlanId;
  name: string;
  tag: string;
  tagHighlight?: boolean;
  lead: string;
  priceMonthly: string;
  priceYearly: string;
  periodMonthly: string;
  periodYearly: string;
  dots: number; // 1 to 4
  features: { title: string; desc: string }[];
  isFree?: boolean;
}

const PLANS: Record<PlanId, PlanConfig> = {
  Free: {
    id: 'Free',
    name: 'Kostenlos',
    tag: 'Basis',
    tagHighlight: false,
    lead: 'Ideal zum Kennenlernen und für gelegentliche Anfragen.',
    priceMonthly: '0,00 €',
    priceYearly: '0,00 €',
    periodMonthly: 'dauerhaft kostenlos',
    periodYearly: 'dauerhaft kostenlos',
    dots: 1,
    isFree: true,
    features: [
      { title: 'Standard-Kontingent', desc: 'Basiskapazität für tägliche Recherchen' },
      { title: 'Solide Geschwindigkeit', desc: 'Schnelle Verarbeitung im Standard-Verbund' },
      { title: '32k Kontextfenster', desc: 'Ausreichend für Standard-Dokumente und Dialoge' },
      { title: 'Werbefrei & Privat', desc: 'Keine Werbung, kein Verkauf deiner Daten' }
    ]
  },
  Plus: {
    id: 'Plus',
    name: 'Plus',
    tag: 'Beliebt',
    tagHighlight: true,
    lead: 'Für Neugierige, die mehr Anfragen und höhere Geschwindigkeit wollen.',
    priceMonthly: '1× Access Card',
    priceYearly: '1× Access Card',
    periodMonthly: '365 Tage',
    periodYearly: '365 Tage',
    dots: 2,
    features: [
      { title: '2× Standard-Kontingent', desc: 'Doppelte Kapazität für tägliche Recherchen' },
      { title: 'Schnellere Antwortzeiten', desc: 'Höhere Priorität bei Spitzenlastzeiten' },
      { title: 'Flaggschiff-Reasoning', desc: 'Erweiterte Denkketten für knifflige Fragen' },
      { title: '128k Kontextfenster', desc: 'Längere Dokumente, Quelltexte & Analysen' }
    ]
  },
  Pro: {
    id: 'Pro',
    name: 'Pro',
    tag: 'Empfohlen',
    tagHighlight: true,
    lead: 'Das volle Werkzeug für tägliches Arbeiten, Coding und tiefes Denken.',
    priceMonthly: '1× Access Card',
    priceYearly: '1× Access Card',
    periodMonthly: '365 Tage',
    periodYearly: '365 Tage',
    dots: 3,
    features: [
      { title: '4× Standard-Kontingent', desc: 'Großzügiges Limit für intensive Workflows' },
      { title: 'Priorisierte Verarbeitung', desc: 'Direkter Durchstich ohne Warteschlange' },
      { title: 'Tiefe Denkketten & Coding', desc: 'Voller Zugriff auf komplexe Problemlöser' },
      { title: '256k Kontextfenster', desc: 'Bücher, Datensätze und umfangreiche Codes' }
    ]
  },
  Ultra: {
    id: 'Ultra',
    name: 'Ultra',
    tag: 'Maximum',
    tagHighlight: true,
    lead: 'Keine Kompromisse. Höchste Limits, VIP-Knoten und neueste Forschungsmodelle.',
    priceMonthly: '1× Access Card',
    priceYearly: '1× Access Card',
    periodMonthly: '365 Tage',
    periodYearly: '365 Tage',
    dots: 4,
    features: [
      { title: 'Nahezu unbegrenzte Nutzung', desc: 'Höchste verfügbare Anfragerate' },
      { title: 'VIP-Knoten', desc: 'Kürzeste Latenz weltweit auf exklusiven Servern' },
      { title: '1M Kontextfenster', desc: 'Ganze Codebases oder Archive auf einen Schlag' },
      { title: 'Forschungsmodelle zuerst', desc: 'Vorabzugriff auf unveröffentlichte Prototypen' }
    ]
  }
};

export const AboPlanView: React.FC<AboPlanViewProps> = ({
  currentTier,
  onBack,
  onOpenLimits,
  onSwitchPlan,
  onRedeemAccessCard
}) => {
  // Normalize currentTier
  const normalizedTier = (['Plus', 'Pro', 'Ultra'].includes(currentTier) ? currentTier : 'Free') as PlanId;
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
    normalizedTier === 'Free' ? 'Pro' : normalizedTier
  );
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  // Access Card modal / state
  const [isAccessCardOpen, setIsAccessCardOpen] = useState(false);
  const [accessCardInput, setAccessCardInput] = useState('');
  const [accessCardFeedback, setAccessCardFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Switch confirmation
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [switchSuccessToast, setSwitchSuccessToast] = useState<string | null>(null);

  const selectedPlan = PLANS[selectedPlanId];
  const isCurrentActive = normalizedTier === selectedPlanId;

  const handleRedeem = (codeToUse?: string) => {
    const code = (codeToUse || accessCardInput).trim();
    if (!code) {
      setAccessCardFeedback({ type: 'error', message: 'Bitte gib einen Code ein.' });
      return;
    }
    const res = onRedeemAccessCard(code);
    if (res.success) {
      setAccessCardFeedback({ type: 'success', message: res.message });
      if (res.tier && (res.tier in PLANS)) {
        setSelectedPlanId(res.tier as PlanId);
      }
      setTimeout(() => {
        setIsAccessCardOpen(false);
        setAccessCardFeedback(null);
        setAccessCardInput('');
      }, 1400);
    } else {
      setAccessCardFeedback({ type: 'error', message: res.message });
    }
  };

  const confirmSwitch = () => {
    if (selectedPlanId === 'Free') {
      onSwitchPlan('Free');
      setShowSwitchConfirm(false);
      setSwitchSuccessToast('Auf Basis-Plan (Kostenlos) zurückgesetzt.');
      setTimeout(() => {
        setSwitchSuccessToast(null);
      }, 3000);
    } else {
      setShowSwitchConfirm(false);
      setIsAccessCardOpen(true);
    }
  };

  return (
    <div
      className="min-h-full text-[#f1f5f9] bg-[#030712] pb-28 selection:bg-blue-600/30 selection:text-blue-200"
      style={{
        fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif'
      }}
    >
      <div className="max-w-[480px] mx-auto px-4 pt-2">
        {/* Header */}
        <header className="flex items-center justify-between py-3 mb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Zurück"
              className="w-11 h-11 rounded-full bg-[#0c1529] border border-[#1e3568] flex items-center justify-center text-[#f1f5f9] hover:border-[#3b82f6]/50 hover:bg-[#111e3b] transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1
              className="text-[22px] font-bold text-[#f1f5f9] tracking-tight"
              style={{ fontFamily: '"Bricolage Grotesque", "DM Sans", sans-serif' }}
            >
              Dein Plan
            </h1>
          </div>

          {onOpenLimits && (
            <button
              type="button"
              onClick={onOpenLimits}
              className="px-3 py-1.5 rounded-full bg-[#0c1529] border border-[#1e3568] hover:border-[#3b82f6]/50 text-xs text-[#94a3b8] hover:text-[#3b82f6] font-medium transition-all cursor-pointer"
            >
              Nutzung & Limits
            </button>
          )}
        </header>

        {/* Aktueller Plan Banner (Rich Deep Navy Blue Card with Dandelion SVG silhouette) */}
        <div className="relative rounded-[26px] bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] text-white p-5 overflow-hidden border border-[#3b82f6]/40 shadow-xl shadow-[#1e3a8a]/20">
          <small className="text-sm font-semibold opacity-85 block tracking-wide text-blue-200">
            Aktuell aktiv
          </small>
          <h2
            className="text-[30px] font-bold my-1 tracking-tight leading-none text-white"
            style={{ fontFamily: '"Bricolage Grotesque", "DM Sans", sans-serif' }}
          >
            Dandelious {PLANS[normalizedTier]?.name || currentTier}
          </h2>
          <p className="m-0 text-[15px] max-w-[26ch] text-blue-100/90 leading-snug">
            {normalizedTier === 'Free'
              ? 'Kostenlose Standard-Kapazität für deine täglichen Recherchen.'
              : `${PLANS[normalizedTier]?.tag} Tarif mit erweiterten Denk- und Antwortkapazitäten.`}
          </p>

          <div className="absolute right-4 top-4 bg-[#0a1124] text-[#60a5fa] border border-[#3b82f6]/30 rounded-full px-3 py-1 font-semibold text-xs tracking-wide shadow-sm">
            {normalizedTier === 'Free' ? '0,00 €' : '1× Access Card'}
          </div>

          {/* Dandelion seed art silhouette in background */}
          <svg
            className="absolute -right-4 -bottom-6 w-44 pointer-events-none opacity-25 text-blue-300"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="14" fill="currentColor" opacity="0.3" />
            <path d="M100 100 L40 40 M100 100 L160 40 M100 100 L40 160 M100 100 L160 160" />
            <path d="M100 100 L20 100 M100 100 L180 100 M100 100 L100 20 M100 100 L100 180" />
            <circle cx="40" cy="40" r="4" fill="currentColor" />
            <circle cx="160" cy="40" r="4" fill="currentColor" />
            <circle cx="40" cy="160" r="4" fill="currentColor" />
            <circle cx="160" cy="160" r="4" fill="currentColor" />
            <circle cx="20" cy="100" r="4" fill="currentColor" />
            <circle cx="180" cy="100" r="4" fill="currentColor" />
            <circle cx="100" cy="20" r="4" fill="currentColor" />
            <circle cx="100" cy="180" r="4" fill="currentColor" />
          </svg>
        </div>

        {/* Section: Pläne erkunden */}
        <h2
          className="text-[19px] font-bold mt-7 mb-1 text-[#f1f5f9]"
          style={{ fontFamily: '"Bricolage Grotesque", "DM Sans", sans-serif' }}
        >
          Pläne erkunden
        </h2>
        <p className="m-0 mb-3 text-[#94a3b8] text-[15px]">
          Wähle den Umfang, der am besten zu deinem Alltag passt.
        </p>

        {/* Segmented Control / Tab Switcher */}
        <div className="grid grid-cols-4 bg-[#132244] border border-[#1e3568] rounded-full p-1 gap-1">
          {(['Free', 'Plus', 'Pro', 'Ultra'] as PlanId[]).map((pid) => {
            const plan = PLANS[pid];
            const isSelected = selectedPlanId === pid;
            const isCurrent = normalizedTier === pid;

            return (
              <button
                key={pid}
                type="button"
                onClick={() => setSelectedPlanId(pid)}
                className={`min-h-[46px] rounded-full font-semibold text-xs flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#0c1529] text-[#f1f5f9] shadow-md border border-[#1e3568]'
                    : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{plan.name}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    isSelected ? 'text-[#60a5fa]' : 'text-[#94a3b8]/70'
                  }`}
                >
                  {plan.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Plan Detail Card */}
        <div className="mt-3.5 bg-[#0c1529] border border-[#1e3568] rounded-[26px] p-5 shadow-sm">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3
                className="text-[26px] font-bold text-[#f1f5f9] leading-tight"
                style={{ fontFamily: '"Bricolage Grotesque", "DM Sans", sans-serif' }}
              >
                Dandelious {selectedPlan.name}
              </h3>
              <span
                className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedPlan.tagHighlight
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-[#132244] text-[#60a5fa] border border-[#1e3568]'
                }`}
              >
                {selectedPlan.tag}
              </span>
            </div>

            <div className="text-right">
              <div
                className="text-xl font-bold text-[#3b82f6] font-mono leading-none"
                style={{ fontFamily: '"Bricolage Grotesque", monospace' }}
              >
                {selectedPlan.isFree ? '0,00 €' : '1× Access Card'}
              </div>
              <div className="text-[11px] text-[#94a3b8] mt-1">
                {selectedPlan.isFree
                  ? 'dauerhaft kostenlos'
                  : '365 Tage Laufzeit pro Karte'}
              </div>
            </div>
          </div>

          <p className="my-3.5 text-[#94a3b8] text-[15px] leading-relaxed">
            {selectedPlan.lead}
          </p>

          {/* Level Indicator (Dots) */}
          <div className="flex items-center gap-1.5 mb-4 text-xs text-[#94a3b8]">
            <b className="text-[#f1f5f9] font-semibold mr-1">Kapazität:</b>
            {[1, 2, 3, 4].map((dot, dIdx) => (
              <span
                key={`plan-dot-${dot}-${dIdx}`}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  dot <= selectedPlan.dots
                    ? 'bg-[#3b82f6] border-[#3b82f6]'
                    : 'bg-[#132244] border-[#1e3568]'
                }`}
              />
            ))}
            <span className="ml-1 text-[11px] text-[#60a5fa]">
              Stufe {selectedPlan.dots} von 4
            </span>
          </div>

          {/* Feature List */}
          <ul className="list-none m-0 p-0 border-t border-[#1e3568]">
            {selectedPlan.features.map((feat, idx) => (
              <li
                key={`feat-${selectedPlan.name}-${feat.title || idx}-${idx}`}
                className="flex items-start gap-3 py-3 border-b border-[#1e3568] last:border-b-0 last:pb-0"
              >
                <div className="w-5 h-5 rounded-full bg-[#2563eb]/20 text-[#60a5fa] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <strong className="block text-[15px] font-semibold text-[#f1f5f9] leading-snug">
                    {feat.title}
                  </strong>
                  <span className="text-xs text-[#94a3b8] leading-relaxed">
                    {feat.desc}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature-Vergleich Tabelle (Tablewrap) */}
        <h2
          className="text-[19px] font-bold mt-7 mb-2 text-[#f1f5f9]"
          style={{ fontFamily: '"Bricolage Grotesque", "DM Sans", sans-serif' }}
        >
          Im Vergleich
        </h2>

        <div className="overflow-x-auto bg-[#0c1529] border border-[#1e3568] rounded-[26px] p-3 shadow-sm">
          <table className="w-full text-xs text-left border-collapse min-w-[340px]">
            <thead>
              <tr className="border-b border-[#1e3568] text-[#94a3b8]">
                <th className="py-2.5 px-2 font-medium">Funktion</th>
                <th className="py-2.5 px-2 text-center font-medium">Free</th>
                <th className="py-2.5 px-2 text-center font-medium">Plus</th>
                <th className="py-2.5 px-2 text-center font-medium text-[#60a5fa]">Pro</th>
                <th className="py-2.5 px-2 text-center font-medium">Ultra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3568] text-[#94a3b8]">
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Preis</td>
                <td className="py-2.5 px-2 text-center">0 €</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">1× Access Card</td>
                <td className="py-2.5 px-2 text-center font-semibold text-[#60a5fa]">1× Access Card</td>
                <td className="py-2.5 px-2 text-center font-semibold text-[#60a5fa]">1× Access Card</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Kontingent</td>
                <td className="py-2.5 px-2 text-center">Basis</td>
                <td className="py-2.5 px-2 text-center">2×</td>
                <td className="py-2.5 px-2 text-center font-semibold text-[#60a5fa]">4×</td>
                <td className="py-2.5 px-2 text-center">Max</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Priorität</td>
                <td className="py-2.5 px-2 text-center">Normal</td>
                <td className="py-2.5 px-2 text-center">Schnell</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">Priorität</td>
                <td className="py-2.5 px-2 text-center">VIP</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Kontextfenster</td>
                <td className="py-2.5 px-2 text-center">32k</td>
                <td className="py-2.5 px-2 text-center">128k</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">256k</td>
                <td className="py-2.5 px-2 text-center font-bold text-[#60a5fa]">1M</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Flaggschiff-Denken</td>
                <td className="py-2.5 px-2 text-center text-[#1e3568]">—</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Forschungsmodelle</td>
                <td className="py-2.5 px-2 text-center text-[#1e3568]">—</td>
                <td className="py-2.5 px-2 text-center text-[#1e3568]">—</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-2 font-medium text-[#f1f5f9]">Werbefrei & Privat</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
                <td className="py-2.5 px-2 text-center text-[#60a5fa]">✓</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Access Card Section */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setIsAccessCardOpen(true)}
            className="w-full min-h-[50px] rounded-full bg-[#0c1529] hover:bg-[#132244] border border-[#1e3568] hover:border-[#3b82f6]/50 text-[#f1f5f9] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <Key className="w-4 h-4 text-[#3b82f6]" />
            <span>Access Card einlösen oder Code eingeben</span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Dock (CTA) */}
      <div className="fixed left-0 right-0 bottom-0 z-20 bg-[#050814]/90 backdrop-blur-md border-t border-[#1e3568] px-4 py-3">
        <div className="max-w-[480px] mx-auto">
          {isCurrentActive ? (
            <div className="w-full min-h-[52px] rounded-full bg-[#132244] border border-[#3b82f6]/40 text-[#60a5fa] font-semibold text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-[#3b82f6]" />
              <span>Dein aktueller Plan ({selectedPlan.name})</span>
            </div>
          ) : selectedPlan.isFree ? (
            <button
              type="button"
              onClick={() => setShowSwitchConfirm(true)}
              className="w-full min-h-[52px] rounded-full bg-[#132244] hover:bg-[#1e3568] border border-[#1e3568] text-[#f1f5f9] font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Auf Basis-Plan (Kostenlos) zurücksetzen</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAccessCardOpen(true)}
              className="w-full min-h-[52px] rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-[#2563eb]/30"
            >
              <Key className="w-4 h-4 text-white" />
              <span>Access Card einlösen ({selectedPlan.name} freischalten)</span>
            </button>
          )}
          <small className="block text-center text-[#94a3b8] text-xs mt-2">
            Abos sind nicht kostenlos · Jedes Abo kostet eine Access Card (365 Tage Laufzeit)
          </small>
        </div>
      </div>

      {/* Modal / Sheet: Access Card einlösen */}
      {isAccessCardOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[480px] bg-[#0c1529] border-t sm:border border-[#1e3568] rounded-t-[26px] sm:rounded-[26px] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-[#f1f5f9] text-base font-bold">
                <Key className="w-5 h-5 text-[#3b82f6]" />
                <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>Access Card einlösen</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAccessCardOpen(false);
                  setAccessCardFeedback(null);
                }}
                className="text-xs text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer px-2 py-1 rounded-md"
              >
                Schließen
              </button>
            </div>

            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Gib deinen offiziellen Access Card Code ein, um deinen Tarif dauerhaft freizuschalten.
            </p>

            {/* Quick-Test Codes */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#94a3b8] mr-1">Test-Codes:</span>
              {[
                { code: 'PLUS84921049', label: 'Plus' },
                { code: 'PRO74910283', label: 'Pro' },
                { code: 'ULTRA98124501', label: 'Ultra' }
              ].map((chip) => (
                <button
                  key={chip.code}
                  type="button"
                  onClick={() => {
                    setAccessCardInput(chip.code);
                    handleRedeem(chip.code);
                  }}
                  className="px-2.5 py-1 rounded-full bg-[#132244] hover:bg-[#1e3568] text-[#60a5fa] border border-[#3b82f6]/30 text-[11px] font-mono transition-colors cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={accessCardInput}
                onChange={(e) => setAccessCardInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRedeem();
                  }
                }}
                placeholder="z. B. PRO74910283"
                className="flex-1 bg-[#132244] border border-[#1e3568] rounded-xl px-3.5 py-3 text-xs text-[#f1f5f9] placeholder-[#94a3b8]/60 focus:outline-none focus:border-[#3b82f6] uppercase font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => handleRedeem()}
                className="px-4 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0 shadow-md shadow-[#2563eb]/20"
              >
                Einlösen
              </button>
            </div>

            {accessCardFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  accessCardFeedback.type === 'success'
                    ? 'bg-[#2563eb]/20 text-[#60a5fa] border border-[#3b82f6]/40 font-medium'
                    : 'bg-[#f27a5e]/15 text-[#f27a5e] border border-[#f27a5e]/40 font-medium'
                }`}
              >
                {accessCardFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-[#3b82f6]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#f27a5e]" />
                )}
                <span>{accessCardFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Switch Confirmation Modal */}
      {showSwitchConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[420px] bg-[#0c1529] border border-[#1e3568] rounded-t-[26px] sm:rounded-[26px] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#2563eb]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#60a5fa] mx-auto">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <h3
                className="text-lg font-bold text-[#f1f5f9] tracking-tight"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
              >
                Auf Basis-Plan zurücksetzen
              </h3>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-[280px] mx-auto">
                Möchtest du zum kostenlosen <strong className="text-[#60a5fa]">Dandelious Basis-Plan</strong> zurückwechseln?
              </p>
            </div>

            <div className="bg-[#132244] p-3.5 rounded-2xl border border-[#1e3568] space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94a3b8]">Aktueller Plan:</span>
                <span className="text-[#f1f5f9] font-medium">Dandelious {normalizedTier}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#94a3b8]">Neuer Plan:</span>
                <span className="text-[#60a5fa] font-bold">Dandelious Basis (Kostenlos)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#1e3568]">
                <span className="text-[#94a3b8]">Kosten:</span>
                <span className="text-[#60a5fa] font-bold font-mono">0,00 € (kostenlos)</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowSwitchConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#132244] hover:bg-[#1e3568] text-[#94a3b8] hover:text-[#f1f5f9] font-semibold text-xs transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmSwitch}
                className="flex-1 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-[#2563eb]/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Bestätigen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {switchSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0c1529] border border-[#3b82f6] text-[#60a5fa] px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{switchSuccessToast}</span>
        </div>
      )}
    </div>
  );
};
