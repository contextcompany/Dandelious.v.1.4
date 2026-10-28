import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, UserPlus, Sparkles, X, Globe, ChevronRight } from 'lucide-react';
import { playSound } from '../utils/sound';

interface BrowserPromoBannerProps {
  onOpenPWAInstall: () => void;
  onOpenAuth: () => void;
  onOpenAbo: () => void;
  isStandalone?: boolean;
  enableSound?: boolean;
}

export const BrowserPromoBanner: React.FC<BrowserPromoBannerProps> = ({
  onOpenPWAInstall,
  onOpenAuth,
  onOpenAbo,
  isStandalone = false,
  enableSound = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // If already running as an installed PWA / standalone app, do not show browser banner!
  if (isStandalone || isDismissed) {
    return null;
  }

  const promoCards = [
    {
      id: 'webapp',
      icon: Smartphone,
      tag: 'Web-App',
      text: 'Dandelious als Web-App installieren – Vollbild & ohne Browserleiste',
      actionText: 'Web-App holen',
      onClick: () => {
        playSound('click', enableSound);
        onOpenPWAInstall();
      }
    },
    {
      id: 'auth',
      icon: UserPlus,
      tag: 'Konto',
      text: 'Jetzt anmelden & Chats nahtlos zwischen Handy & PC synchronisieren',
      actionText: 'Anmelden',
      onClick: () => {
        playSound('click', enableSound);
        onOpenAuth();
      }
    },
    {
      id: 'abo',
      icon: Sparkles,
      tag: 'Pro & Abo',
      text: 'Dandelious Pro & Unlimited: Unbegrenzte Rechenpower & modernste KI-Engines',
      actionText: 'Abo ansehen',
      onClick: () => {
        playSound('click', enableSound);
        onOpenAbo();
      }
    }
  ];

  return (
    <div className="w-full bg-gradient-to-r from-[#111113] via-[#16161a] to-[#111113] border-b border-white/[0.08] text-white py-2 px-3 sm:px-6 relative z-30 select-none shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Left: Browser Indicator & Rotating Promo */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-neutral-300 shrink-0 font-medium">
            <Globe className="w-3 h-3 text-[#3b82f6]" />
            <span>Browser-Ansicht</span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#3b82f6] font-semibold hidden md:inline">Tipp:</span>
            <span className="text-neutral-300 truncate text-[12px] sm:text-[13px]">
              {promoCards[activePromoIndex].text}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Action 1: Web-App holen */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              onOpenPWAInstall();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 font-semibold text-[11.5px] transition-all cursor-pointer shadow-sm active:scale-95"
            title="Dandelious zum Home-Bildschirm hinzufügen"
          >
            <Smartphone className="w-3.5 h-3.5 text-black" />
            <span>Web-App</span>
          </button>

          {/* Action 2: Anmelden */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              onOpenAuth();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-[11.5px] transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-neutral-300" />
            <span>Anmelden</span>
          </button>

          {/* Action 3: Abo */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              onOpenAbo();
            }}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-[11.5px] transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Abo</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              setIsDismissed(true);
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Hinweis schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
