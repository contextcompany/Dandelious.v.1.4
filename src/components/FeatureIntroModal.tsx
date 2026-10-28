import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Pencil,
  Image as ImageIcon,
  FolderKanban,
  Search,
  Share2,
  Sliders,
  User,
  Shield,
  Video,
  Camera,
  Music,
  TrendingUp,
  BarChart2,
  Calendar,
  Award,
  Monitor,
  Terminal,
  Database,
  Code2,
  Dices,
  CheckCircle2,
  X,
  FileText,
  SlidersHorizontal,
  Clock,
  Key,
  Layers,
  Smile,
  Zap,
  Volume2
} from 'lucide-react';
import { playSound } from '../utils/sound';

export type IntroFeatureKey =
  | 'image'
  | 'mediathek'
  | 'settings'
  | 'video'
  | 'music'
  | 'projects'
  | 'crypto'
  | 'stocks'
  | 'releases'
  | 'remote'
  | 'knowledge'
  | 'dice'
  | 'code';

interface FeaturePoint {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface FeatureIntroConfig {
  key: IntroFeatureKey;
  title: string;
  subtitle: string;
  buttonText: string;
  cards: [string, string, string]; // 3 SVG or image cards
  points: [FeaturePoint, FeaturePoint, FeaturePoint];
}

const makeSvgDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;

// High-fidelity SVG card visual assets for each feature (Zero network delay, instant rendering)
const CARD_SVGS = {
  // Image Studio cards matching screenshot IMG_1233_ac1d5731.png
  imageLeft: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fdba74"/>
          <stop offset="40%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g1)"/>
      <circle cx="200" cy="180" r="90" fill="#fed7aa" opacity="0.9"/>
      <path d="M120 220 Q200 130 280 220 C270 320 130 320 120 220 Z" fill="#78350f" opacity="0.8"/>
      <path d="M70 420 C100 320 300 320 330 420 L400 500 L0 500 Z" fill="#1e293b"/>
      <circle cx="340" cy="80" r="50" fill="#fef08a" opacity="0.7"/>
    </svg>
  `),
  imageCenter: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#14532d"/>
          <stop offset="60%" stop-color="#166534"/>
          <stop offset="100%" stop-color="#052e16"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g2)"/>
      <!-- Portrait in foliage matching screenshot -->
      <circle cx="200" cy="190" r="85" fill="#fecdd3"/>
      <path d="M140 160 Q200 90 260 160 C260 250 140 250 140 160 Z" fill="#0f172a"/>
      <!-- Tropical green leaves framing the face -->
      <path d="M40 80 Q140 120 160 220 Q60 240 40 80 Z" fill="#4ade80" opacity="0.9"/>
      <path d="M360 90 Q250 130 240 230 Q340 240 360 90 Z" fill="#22c55e" opacity="0.9"/>
      <path d="M110 400 C130 300 270 300 290 400 L350 500 L50 500 Z" fill="#f8fafc"/>
      <path d="M0 350 Q120 300 160 420 Q60 480 0 350 Z" fill="#15803d" opacity="0.85"/>
      <path d="M400 340 Q280 310 240 430 Q350 490 400 340 Z" fill="#16a34a" opacity="0.85"/>
    </svg>
  `),
  imageRight: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="60%" stop-color="#64748b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g3)"/>
      <rect x="260" y="240" width="120" height="80" rx="16" fill="#facc15"/>
      <circle cx="290" cy="320" r="14" fill="#1e293b"/>
      <circle cx="350" cy="320" r="14" fill="#1e293b"/>
      <circle cx="170" cy="170" r="65" fill="#fde047" opacity="0.3"/>
      <circle cx="180" cy="190" r="60" fill="#fed7aa"/>
      <path d="M120 400 C140 290 230 290 250 400 L280 500 L90 500 Z" fill="#e2e8f0"/>
      <path d="M125 180 Q180 120 235 180 Z" fill="#1e293b"/>
    </svg>
  `),

  // Mediathek cards
  mediaLeft: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#0f172a"/>
      <circle cx="200" cy="220" r="110" fill="#1e3a8a" opacity="0.6"/>
      <polygon points="170,170 260,220 170,270" fill="#60a5fa"/>
      <rect x="50" y="380" width="300" height="20" rx="10" fill="#334155"/>
      <rect x="50" y="380" width="180" height="20" rx="10" fill="#3b82f6"/>
    </svg>
  `),
  mediaCenter: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="gm1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5"/>
          <stop offset="50%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#gm1)"/>
      <rect x="60" y="80" width="280" height="220" rx="28" fill="#ffffff" opacity="0.18"/>
      <circle cx="150" cy="160" r="35" fill="#fde047" opacity="0.9"/>
      <path d="M80 270 Q160 190 220 250 Q280 210 320 280 L320 280 L80 280 Z" fill="#ffffff" opacity="0.7"/>
      <rect x="60" y="340" width="200" height="24" rx="12" fill="#ffffff" opacity="0.9"/>
      <rect x="60" y="380" width="130" height="16" rx="8" fill="#ffffff" opacity="0.5"/>
    </svg>
  `),
  mediaRight: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#18181b"/>
      <circle cx="200" cy="200" r="100" fill="#27272a"/>
      <circle cx="200" cy="200" r="40" fill="#3f3f46"/>
      <circle cx="200" cy="200" r="14" fill="#a1a1aa"/>
      <path d="M100 370 Q150 330 200 370 T300 370" stroke="#a855f7" stroke-width="12" fill="none" stroke-linecap="round"/>
    </svg>
  `),

  // Settings cards
  settingsLeft: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#111827"/>
      <circle cx="200" cy="200" r="90" stroke="#374151" stroke-width="24" fill="none"/>
      <path d="M136 264 A90 90 0 1 1 264 264" stroke="#3b82f6" stroke-width="24" fill="none" stroke-linecap="round"/>
      <text x="200" y="215" font-family="sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">85%</text>
      <rect x="80" y="350" width="240" height="30" rx="15" fill="#1f2937"/>
    </svg>
  `),
  settingsCenter: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="gs1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#gs1)"/>
      <rect x="50" y="90" width="300" height="90" rx="24" fill="#1e293b"/>
      <circle cx="105" cy="135" r="26" fill="#3b82f6"/>
      <rect x="150" y="125" width="140" height="20" rx="10" fill="#e2e8f0"/>
      <rect x="50" y="210" width="300" height="90" rx="24" fill="#1e293b"/>
      <rect x="80" y="245" width="120" height="20" rx="10" fill="#94a3b8"/>
      <rect x="230" y="235" width="80" height="40" rx="20" fill="#2563eb"/>
      <circle cx="285" cy="255" r="15" fill="#ffffff"/>
      <rect x="50" y="330" width="300" height="90" rx="24" fill="#1e293b"/>
      <rect x="80" y="365" width="150" height="20" rx="10" fill="#94a3b8"/>
    </svg>
  `),
  settingsRight: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#18181b"/>
      <polygon points="200,80 320,180 200,420 80,180" fill="#0284c7" opacity="0.7"/>
      <polygon points="200,80 320,180 200,240" fill="#38bdf8"/>
      <polygon points="200,80 80,180 200,240" fill="#7dd3fc"/>
      <polygon points="200,240 320,180 200,420" fill="#0369a1"/>
      <polygon points="200,240 80,180 200,420" fill="#0284c7"/>
    </svg>
  `),

  // Video Studio cards
  videoLeft: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#1e1b4b"/>
      <circle cx="200" cy="180" r="80" fill="#6366f1" opacity="0.5"/>
      <path d="M50 420 Q200 240 350 420 L400 500 L0 500 Z" fill="#312e81"/>
      <circle cx="100" cy="100" r="3" fill="#ffffff"/>
      <circle cx="280" cy="70" r="4" fill="#ffffff"/>
    </svg>
  `),
  videoCenter: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="gv1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#gv1)"/>
      <rect x="50" y="100" width="300" height="220" rx="20" fill="#0f172a" opacity="0.6"/>
      <polygon points="175,170 255,210 175,250" fill="#ffffff"/>
      <rect x="70" y="350" width="260" height="18" rx="9" fill="#ffffff" opacity="0.8"/>
      <rect x="70" y="385" width="140" height="14" rx="7" fill="#ffffff" opacity="0.4"/>
    </svg>
  `),
  videoRight: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#09090b"/>
      <path d="M0 120 L400 160 L400 340 L0 300 Z" fill="#e11d48" opacity="0.8"/>
      <circle cx="200" cy="230" r="70" fill="#09090b"/>
      <circle cx="200" cy="230" r="50" fill="#f43f5e"/>
    </svg>
  `),

  // Generic cards fallback
  genericLeft: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#18181b"/>
      <circle cx="200" cy="220" r="90" fill="#2563eb" opacity="0.5"/>
    </svg>
  `),
  genericCenter: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <defs>
        <linearGradient id="gg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#4f46e5"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#gg1)"/>
      <circle cx="200" cy="200" r="70" fill="#ffffff" opacity="0.3"/>
    </svg>
  `),
  genericRight: makeSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#18181b"/>
      <circle cx="200" cy="220" r="90" fill="#7c3aed" opacity="0.5"/>
    </svg>
  `)
};

const FEATURE_CONFIGS: Record<IntroFeatureKey, FeatureIntroConfig> = {
  image: {
    key: 'image',
    title: 'Bilder erstellen',
    subtitle: 'mit Nano Banana 2 & Dandelious Vision',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.imageLeft, CARD_SVGS.imageCenter, CARD_SVGS.imageRight],
    points: [
      {
        icon: Layers,
        title: 'Vorlage verwenden',
        description: 'Einfach ein Bild hinzufügen, um loszulegen'
      },
      {
        icon: Smile,
        title: 'Alles visualisieren',
        description: 'Idee im Chat oder Prompt beschreiben'
      },
      {
        icon: Pencil,
        title: 'Mit Dandelious optimieren',
        description: 'Dandelious auffordern, Änderungen vorzunehmen'
      }
    ]
  },
  mediathek: {
    key: 'mediathek',
    title: 'Mediathek',
    subtitle: 'Deine persönliche Medienzentrale',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.mediaLeft, CARD_SVGS.mediaCenter, CARD_SVGS.mediaRight],
    points: [
      {
        icon: FolderKanban,
        title: 'Alle Medien an einem Ort',
        description: 'Bilder, Audios und Dokumente übersichtlich verwalten'
      },
      {
        icon: Search,
        title: 'Intelligente Filtersuche',
        description: 'Finde deine Schöpfungen blitzschnell nach Typ und Datum'
      },
      {
        icon: Share2,
        title: 'Direkt in Chats nutzen',
        description: 'Verwende gespeicherte Medien sofort als Kontext'
      }
    ]
  },
  settings: {
    key: 'settings',
    title: 'Einstellungen',
    subtitle: 'Passe Dandelious an deine Wünsche an',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.settingsLeft, CARD_SVGS.settingsCenter, CARD_SVGS.settingsRight],
    points: [
      {
        icon: Clock,
        title: 'Nutzungslimits im Blick',
        description: 'Verfolge dein Token-Kontingent und Zyklus-Resets in Echtzeit'
      },
      {
        icon: User,
        title: 'Personalisierung & Anweisungen',
        description: 'Bestimme, was sich die KI merkt und wie sie antwortet'
      },
      {
        icon: Shield,
        title: 'Konto, Abos & Shards',
        description: 'Verwalte Pläne, Shards-Belohnungen oder eigene API-Keys'
      }
    ]
  },
  video: {
    key: 'video',
    title: 'Video Studio',
    subtitle: 'KI-gestützte Animation & Filmkreation',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.videoLeft, CARD_SVGS.videoCenter, CARD_SVGS.videoRight],
    points: [
      {
        icon: Video,
        title: 'Text & Bild zu Video',
        description: 'Erwecke Bildideen und Storyboards in Bewegung zum Leben'
      },
      {
        icon: Camera,
        title: 'Kinematische Kamerawinkel',
        description: 'Bestimme Kamerafahrten, Zoom und Beleuchtung'
      },
      {
        icon: Sparkles,
        title: 'Szenen verfeinern',
        description: 'Optimiere Bewegungsabläufe mit präzisen Prompt-Hinweisen'
      }
    ]
  },
  music: {
    key: 'music',
    title: 'Musik Studio',
    subtitle: 'Melodien, Soundscapes & Beats generieren',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.mediaRight, CARD_SVGS.mediaCenter, CARD_SVGS.mediaLeft],
    points: [
      {
        icon: Music,
        title: 'Genres & Stimmungen',
        description: 'Von Lo-Fi bis Orchesterklängen nach einfachen Beschreibungen'
      },
      {
        icon: Volume2,
        title: 'Echtzeit-Audio & Synthese',
        description: 'Generiere Sounds und Stems für deine Projekte'
      },
      {
        icon: Sparkles,
        title: 'Direkt exportieren',
        description: 'Verwende deine Tracks frei in Videos und Präsentationen'
      }
    ]
  },
  projects: {
    key: 'projects',
    title: 'Projekte',
    subtitle: 'Strukturiertes Arbeiten mit getrennten Kontexten',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.settingsLeft, CARD_SVGS.settingsCenter, CARD_SVGS.mediaLeft],
    points: [
      {
        icon: FolderKanban,
        title: 'Eigene Wissensräume',
        description: 'Jedes Projekt besitzt seine eigenen Chats und Referenzdateien'
      },
      {
        icon: FileText,
        title: 'Projekt-Anweisungen',
        description: 'Definiere feste Rollen und Ziele für das gesamte Projekt'
      },
      {
        icon: CheckCircle2,
        title: 'Übersichtliche Meilensteine',
        description: 'Behalte Fortschritte und To-Dos stets im Blick'
      }
    ]
  },
  crypto: {
    key: 'crypto',
    title: 'Krypto Studio',
    subtitle: 'Echtzeit-Kurse, Charts & Marktanalysen',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.settingsRight, CARD_SVGS.settingsCenter, CARD_SVGS.settingsLeft],
    points: [
      {
        icon: TrendingUp,
        title: 'Live-Marktpreise',
        description: 'Verfolge Kurse und Candlesticks der beliebtesten Krypto-Assets'
      },
      {
        icon: Zap,
        title: 'KI-Trading-Einblicke',
        description: 'Lass dir technische Indikatoren und Nachrichten erklären'
      },
      {
        icon: Shield,
        title: 'Watchlist & Trends',
        description: 'Speichere wichtige Coins und bleibe über Volatilität informiert'
      }
    ]
  },
  stocks: {
    key: 'stocks',
    title: 'Aktien & Finanzen',
    subtitle: 'Globale Börsenkurse & Unternehmensberichte',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.settingsRight, CARD_SVGS.settingsCenter, CARD_SVGS.mediaCenter],
    points: [
      {
        icon: BarChart2,
        title: 'Globale Märkte',
        description: 'DAX, S&P 500, Tech-Werte und ETFs auf einen Blick'
      },
      {
        icon: FileText,
        title: 'Bilanzen zusammenfassen',
        description: 'Erhalte prägnante Zusammenfassungen von Quartalszahlen'
      },
      {
        icon: Sparkles,
        title: 'Sektor-Trends erkennen',
        description: 'Analysiere Marktbewegungen mit Unterstützung von Gemini'
      }
    ]
  },
  releases: {
    key: 'releases',
    title: 'Premieren & Releases',
    subtitle: 'Neuerscheinungen & Dandelious Features',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.imageRight, CARD_SVGS.mediaCenter, CARD_SVGS.imageLeft],
    points: [
      {
        icon: Sparkles,
        title: 'Neueste Funktionen',
        description: 'Erfahre zuerst von neuen KI-Modellen und Studio-Updates'
      },
      {
        icon: Calendar,
        title: 'Release-Kalender',
        description: 'Verfolge geplante Premieren und Roadmap-Highlights'
      },
      {
        icon: Award,
        title: 'Exklusive Belohnungen',
        description: 'Schalte bei Premieren zusätzliche Shards und Badges frei'
      }
    ]
  },
  remote: {
    key: 'remote',
    title: 'Remote Workspace',
    subtitle: 'Verbinde dich mit deiner Arbeitsumgebung',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.genericLeft, CARD_SVGS.genericCenter, CARD_SVGS.genericRight],
    points: [
      {
        icon: Monitor,
        title: 'Nahtloser Zugriff',
        description: 'Steuere Desktops und Remote-Sitzungen direkt im Browser'
      },
      {
        icon: Terminal,
        title: 'Befehle & Automatisierung',
        description: 'Führe Routineaufgaben mit KI-Unterstützung aus'
      },
      {
        icon: Shield,
        title: 'Sicher & verschlüsselt',
        description: 'Volle Kontrolle über Sitzungen und Datenübertragung'
      }
    ]
  },
  knowledge: {
    key: 'knowledge',
    title: 'Wissensbasis',
    subtitle: 'Zentraler Speicher für Dokumente & Notizen',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.settingsCenter, CARD_SVGS.mediaCenter, CARD_SVGS.settingsLeft],
    points: [
      {
        icon: Database,
        title: 'Permanenter Wissensspeicher',
        description: 'Hinterlege PDFs und Notizen, die die KI dauerhaft kennt'
      },
      {
        icon: Search,
        title: 'Semantische Suche',
        description: 'Präzises Auffinden relevanter Fakten aus tausenden Zeilen'
      },
      {
        icon: CheckCircle2,
        title: 'Belegte Antworten',
        description: 'Antworten mit direkten Quellennachweisen aus deinen Daten'
      }
    ]
  },
  dice: {
    key: 'dice',
    title: 'Dice & Code Studio',
    subtitle: 'Interaktive Sandboxes & Rollenspiel-Tools',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.genericLeft, CARD_SVGS.genericCenter, CARD_SVGS.genericRight],
    points: [
      {
        icon: Code2,
        title: 'Live-Code-Editor',
        description: 'HTML, Tailwind und JavaScript direkt im Browser ausführen'
      },
      {
        icon: Dices,
        title: 'Interaktive Würfel',
        description: 'Würfelsimulationen für Rollenspiele und Zufallstests'
      },
      {
        icon: Sparkles,
        title: 'Echtzeit-Vorschau',
        description: 'Betrachte Ergebnisse sofort ohne zusätzliche Einrichtung'
      }
    ]
  },
  code: {
    key: 'code',
    title: 'Dice & Code Studio',
    subtitle: 'Interaktive Sandboxes & Rollenspiel-Tools',
    buttonText: 'Jetzt ausprobieren',
    cards: [CARD_SVGS.genericLeft, CARD_SVGS.genericCenter, CARD_SVGS.genericRight],
    points: [
      {
        icon: Code2,
        title: 'Live-Code-Editor',
        description: 'HTML, Tailwind und JavaScript direkt im Browser ausführen'
      },
      {
        icon: Dices,
        title: 'Interaktive Würfel',
        description: 'Würfelsimulationen für Rollenspiele und Zufallstests'
      },
      {
        icon: Sparkles,
        title: 'Echtzeit-Vorschau',
        description: 'Betrachte Ergebnisse sofort ohne zusätzliche Einrichtung'
      }
    ]
  }
};

interface FeatureIntroModalProps {
  featureKey: IntroFeatureKey | null;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const FeatureIntroModal: React.FC<FeatureIntroModalProps> = ({
  featureKey,
  isOpen,
  onClose,
  soundEnabled = true
}) => {
  const config = featureKey ? (FEATURE_CONFIGS[featureKey] || FEATURE_CONFIGS.image) : null;

  const handleDismiss = () => {
    playSound('click', soundEnabled);
    if (featureKey) {
      try {
        localStorage.setItem(`dandelious_intro_seen_${featureKey}`, 'true');
      } catch {}
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && featureKey && config && (
        <div key={`feature-intro-container-${featureKey}`} className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 select-none font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
          {/* Dimmed Blurred Backdrop */}
          <motion.div
            key="intro-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-10"
          />

          {/* Floating Modal Sheet matching screenshot IMG_1233_ac1d5731.png 1:1 */}
          <motion.div
            key={`intro-sheet-${featureKey}`}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.7 }}
          className="relative z-20 w-full max-w-[440px] sm:max-w-[460px] rounded-[34px] sm:rounded-[38px] bg-[#1e1f23]/90 border border-white/10 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.92)] p-6 sm:p-7 text-white flex flex-col items-center overflow-hidden"
        >
          {/* Top Grab Handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mb-5 shrink-0" />

          {/* Close button in corner */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>

          {/* 3 Staggered / Overlapping Curved Cards (Exact Fan Layout from Screenshot) */}
          <div className="relative w-full h-[135px] sm:h-[145px] flex items-center justify-center my-1">
            {/* Card 1: Left Card */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -12 }}
              animate={{ opacity: 1, x: 0, rotate: -6 }}
              transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-[16%] sm:left-[18%] -translate-x-1/2 w-[98px] sm:w-[108px] h-[115px] sm:h-[125px] rounded-[22px] overflow-hidden border border-white/15 shadow-xl origin-bottom select-none pointer-events-none"
            >
              <img
                src={config.cards[0]}
                alt="Feature preview left"
                className="w-full h-full object-cover filter brightness-95"
              />
            </motion.div>

            {/* Card 3: Right Card */}
            <motion.div
              initial={{ opacity: 0, x: 20, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 6 }}
              transition={{ delay: 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-[16%] sm:right-[18%] translate-x-1/2 w-[98px] sm:w-[108px] h-[115px] sm:h-[125px] rounded-[22px] overflow-hidden border border-white/15 shadow-xl origin-bottom select-none pointer-events-none"
            >
              <img
                src={config.cards[2]}
                alt="Feature preview right"
                className="w-full h-full object-cover filter brightness-95"
              />
            </motion.div>

            {/* Card 2: Center Front Card */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.04, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[114px] sm:w-[124px] h-[130px] sm:h-[140px] rounded-[24px] overflow-hidden border-2 border-white/25 shadow-2xl select-none pointer-events-none"
            >
              <img
                src={config.cards[1]}
                alt="Feature preview center"
                className="w-full h-full object-cover filter brightness-105"
              />
            </motion.div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mt-4 mb-4">
            <h2 className="text-[22px] sm:text-[25px] font-semibold text-white tracking-tight leading-tight">
              {config.title}
            </h2>
            <p className="text-xs sm:text-[13px] text-neutral-400 font-normal mt-1">
              {config.subtitle}
            </p>
          </div>

          {/* 3 Feature Points */}
          <div className="w-full space-y-3.5 my-2 px-1">
            {config.points.map((pt, idx) => {
              const IconComp = pt.icon;
              return (
                <div key={`feat-point-${featureKey}-${idx}`} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 text-neutral-300">
                    <IconComp className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-medium text-white leading-snug">
                      {pt.title}
                    </h3>
                    <p className="text-[12.5px] text-neutral-400 font-normal leading-relaxed mt-0.5">
                      {pt.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button: Pill Button matching screenshot */}
          <div className="w-full mt-6 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3.5 px-6 rounded-full bg-[#2a2b30] hover:bg-[#34363c] active:bg-[#222326] text-white text-[14.5px] font-medium transition-all text-center cursor-pointer border border-white/10 shadow-lg active:scale-[0.98]"
            >
              {config.buttonText}
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Helper to check whether an intro has been seen before for a feature
 */
export function hasSeenFeatureIntro(featureKey: IntroFeatureKey): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(`dandelious_intro_seen_${featureKey}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Helper to mark feature intro as seen
 */
export function markFeatureIntroSeen(featureKey: IntroFeatureKey): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`dandelious_intro_seen_${featureKey}`, 'true');
  } catch {}
}
