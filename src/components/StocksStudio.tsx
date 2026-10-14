import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  TrendingUp,
  Search,
  Star,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  HelpCircle,
  ExternalLink,
  DollarSign,
  BarChart3,
  Globe,
  Check,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Layers,
  Filter,
  Activity,
  Trash2,
  ThumbsUp,
  ShieldCheck,
  Info,
  Building2,
  Gift,
  Coins,
  Newspaper,
  Compass,
  Zap,
  TrendingDown,
  Bell,
  BellRing,
  Clock
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';

export type StocksTab = 'maerkte' | 'watchlist' | 'nachrichten';
export type ChartRange = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y';

export interface ChartPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface DetailedStock {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  high52?: number | null;
  low52?: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  marketCap: string;
  volume?: number;
  exchange: string;
  googleFinanceUrl: string;
  range: string;
  points: ChartPoint[];
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  link: string;
  pubDate: string;
  timeAgo: string;
}

export interface StockAlert {
  id: string;
  symbol: string;
  name: string;
  targetPercent: number; // e.g. 3 for +3% or -5 for -5%
  direction: 'up' | 'down';
  baselinePrice: number;
  baselineTime: number;
  baselineDateStr: string;
  isTriggered?: boolean;
  triggeredAt?: number;
  triggeredPrice?: number;
}

interface StocksStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  onAnalyzeInChat?: (target: { symbol?: string; name?: string; prompt?: string }) => void;
  isStandaloneMode?: boolean;
}

const STORAGE_WATCHLIST_KEY = 'dandelious_stocks_watchlist_v3';
const STORAGE_ALERTS_KEY = 'dandelious_stocks_alerts_v2';

// Known company domain mappings for high-resolution logo resolution via Google Favicon API
const KNOWN_STOCK_DOMAINS: Record<string, string> = {
  NVDA: 'nvidia.com',
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  TSLA: 'tesla.com',
  PLTR: 'palantir.com',
  'SAP.DE': 'sap.com',
  SAP: 'sap.com',
  'RHM.DE': 'rheinmetall.com',
  RHM: 'rheinmetall.com',
  'ALV.DE': 'allianz.com',
  ALV: 'allianz.com',
  ASML: 'asml.com',
  AMZN: 'amazon.com',
  GOOG: 'google.com',
  GOOGL: 'google.com',
  META: 'meta.com',
  NFLX: 'netflix.com',
  AMD: 'amd.com',
  INTC: 'intel.com',
  CRM: 'salesforce.com',
  ORCL: 'oracle.com',
  ADBE: 'adobe.com',
  IBM: 'ibm.com',
  CSCO: 'cisco.com',
  QCOM: 'qualcomm.com',
  TXN: 'ti.com',
  NOW: 'servicenow.com',
  SONY: 'sony.com',
  BABA: 'alibaba.com',
  TCEHY: 'tencent.com',
  'BMW.DE': 'bmw.com',
  BMW: 'bmw.com',
  'MBG.DE': 'mercedes-benz.com',
  MBG: 'mercedes-benz.com',
  'VOW3.DE': 'volkswagen.com',
  VOW3: 'volkswagen.com',
  'SIE.DE': 'siemens.com',
  SIE: 'siemens.com',
  'DTE.DE': 'telekom.com',
  DTE: 'telekom.com',
  'BAYN.DE': 'bayer.com',
  BAYN: 'bayer.com',
  'BAS.DE': 'basf.com',
  BAS: 'basf.com',
  'AIR.DE': 'airbus.com',
  AIR: 'airbus.com',
  'DBK.DE': 'db.com',
  DBK: 'db.com',
  'LHA.DE': 'lufthansagroup.com',
  LHA: 'lufthansagroup.com',
  'P911.DE': 'porsche.com',
  P911: 'porsche.com',
  'ADS.DE': 'adidas.com',
  ADS: 'adidas.com',
  COIN: 'coinbase.com',
  DIS: 'disney.com',
  NKE: 'nike.com',
  MCD: 'mcdonalds.com',
  KO: 'coca-cola.com',
  PEP: 'pepsico.com',
  SBUX: 'starbucks.com',
  SPOT: 'spotify.com',
  UBER: 'uber.com',
  ABNB: 'airbnb.com',
  PYPL: 'paypal.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  JPM: 'jpmorganchase.com',
  GS: 'goldmansachs.com',
  SPY: 'spglobal.com',
  QQQ: 'invesco.com',
  DAX: 'boerse-frankfurt.de'
};

// Helper: Resolve high-resolution logo URL via Google Favicon API
export const getStockLogoUrl = (symbol: string, name?: string): string => {
  const sym = symbol.toUpperCase().trim();
  const cleanSym = sym.replace('.DE', '').replace('.F', '');

  if (KNOWN_STOCK_DOMAINS[sym]) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${KNOWN_STOCK_DOMAINS[sym]}&size=128`;
  }
  if (KNOWN_STOCK_DOMAINS[cleanSym]) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${KNOWN_STOCK_DOMAINS[cleanSym]}&size=128`;
  }

  if (name) {
    const firstWord = name.toLowerCase().split(/[\s,.-]+/)[0].replace(/[^a-z0-9]/g, '');
    if (firstWord.length >= 3) {
      return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${firstWord}.com&size=128`;
    }
  }

  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanSym.toLowerCase()}.com&size=128`;
};

// StockLogo Component: displays real company logo or falls back to ticker text (e.g. NVDA, NVDE, AAPL)
interface StockLogoProps {
  symbol: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StockLogo: React.FC<StockLogoProps> = ({ symbol, name, size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = useMemo(() => getStockLogoUrl(symbol, name), [symbol, name]);

  const fallbackText = useMemo(() => {
    const clean = symbol.replace('.DE', '').replace('.F', '').trim();
    return clean.slice(0, 4);
  }, [symbol]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm'
  }[size];

  if (hasError) {
    return (
      <div className={`${sizeClasses} rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-mono font-bold text-white shrink-0 shadow-sm ${className}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-white/10 border border-white/15 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-sm bg-neutral-900/90 ${className}`}>
      <img
        src={logoUrl}
        alt={name || symbol}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain rounded-full"
        loading="lazy"
      />
    </div>
  );
};

// Preloaded featured stocks
const FEATURED_TICKERS = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Tech' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Tech & KI' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Cloud & AI' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'E-Mobilität' },
  { symbol: 'PLTR', name: 'Palantir Tech', sector: 'Enterprise AI' },
  { symbol: 'SAP.DE', name: 'SAP SE', sector: 'DAX Software' },
  { symbol: 'RHM.DE', name: 'Rheinmetall AG', sector: 'DAX Verteidigung' },
  { symbol: 'ALV.DE', name: 'Allianz SE', sector: 'DAX Finanzen' },
  { symbol: 'ASML', name: 'ASML Holding', sector: 'Halbleiter' },
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'US Index' },
  { symbol: 'DAX', name: 'DAX 40 Index', sector: 'DE Index' }
];

// Helper: Plain German, easy-to-understand explanation for any stock
const getSimpleExplanation = (symbol: string, name: string): string => {
  const sym = symbol.toUpperCase();
  if (sym.includes('AAPL')) {
    return 'Hersteller von iPhone, Mac und Apple Watch. Weltweit nutzen über 2 Milliarden Menschen täglich Produkte und Dienste von Apple.';
  }
  if (sym.includes('NVDA')) {
    return 'Baut die weltweit führenden Computerchips für Künstliche Intelligenz. Fast alle modernen KI-Modelle laufen auf Hardware von Nvidia.';
  }
  if (sym.includes('MSFT')) {
    return 'Entwickelt Windows, Office und die Cloud-Plattform Azure. Zusammen mit OpenAI bringt Microsoft KI in Millionen Büros weltweit.';
  }
  if (sym.includes('TSLA')) {
    return 'Führender Hersteller von Elektrofahrzeugen, der außerdem in autonomes Fahren (Robotaxis), Batteriespeicher und Roboter investiert.';
  }
  if (sym.includes('PLTR')) {
    return 'Entwickelt Spezial-Software für Datenanalyse und Künstliche Intelligenz für Regierungen, Sicherheitsbehörden und Großkonzerne.';
  }
  if (sym.includes('SAP')) {
    return 'Deutschlands wertvollster Softwarekonzern. Fast jedes große Unternehmen der Welt steuert Finanzen und Logistik mit Programmen von SAP.';
  }
  if (sym.includes('RHM')) {
    return 'Deutscher Hersteller von moderner Verteidigungstechnik, Fahrzeugen und Munition mit hohen langfristigen Auftragsbeständen.';
  }
  if (sym.includes('ALV')) {
    return 'Einer der weltweit größten und sichersten Versicherungs- und Finanzkonzerne mit verlässlichen Gewinnen und jährlicher Prämie.';
  }
  if (sym.includes('ASML')) {
    return 'Baut die hochkomplexen Belichtungsmaschinen, ohne die weltweit keine modernen Computerchips gefertigt werden können.';
  }
  if (sym.includes('SPY')) {
    return 'Der bekannteste ETF der Welt. Enthält Anteile der 500 größten und erfolgreichsten Unternehmen der USA für maximale Sicherheit.';
  }
  if (sym.includes('DAX')) {
    return 'Der deutsche Leitindex. Bildet die Entwicklung der 40 wertvollsten und stärksten Börsenunternehmen Deutschlands ab.';
  }
  return `${name} ist ein börsennotiertes Unternehmen. Die Aktie spiegelt den wirtschaftlichen Erfolg und die Ertragskraft der Firma wider.`;
};

// Helper: Simple Dividend / Gewinnausschüttung Explanation
const getSimpleDividendInfo = (symbol: string): string => {
  const sym = symbol.toUpperCase();
  if (sym.includes('AAPL')) return 'Zahlt jedes Quartal eine kleine Erfolgsprämie (Dividende) direkt an alle Aktionäre aus.';
  if (sym.includes('ALV')) return 'Zahlt eine besonders hohe jährliche Dividende (Gewinnbeteiligung) an Anleger aus.';
  if (sym.includes('MSFT')) return 'Zahlt eine regelmäßige, stetig steigende Quartalsdividende an Aktionäre.';
  if (sym.includes('SAP')) return 'Schüttet jährlich einen verlässlichen Teil der Jahresgewinne an Anleger aus.';
  if (sym.includes('NVDA')) return 'Zahlt eine kleine symbolische Dividende und investiert fast alle Gewinne direkt in Forschung & neue KI-Chips.';
  if (sym.includes('TSLA')) return 'Zahlt keine Dividende, sondern reinvestiert 100% aller Gewinne in neue Fabriken und KI-Technologien.';
  return 'Erwirtschaftet Gewinne für Anleger durch Kurssteigerungen und mögliche Gewinnausschüttungen.';
};

// Helper: Simple Analyst Consensus (KAUFEN / HALTEN OHNE EMOJI!)
const getSimpleRating = (symbol: string, changePercent: number) => {
  const sym = symbol.toUpperCase();
  if (sym.includes('AAPL')) return { signal: 'Kaufen', percent: 78, text: '78% der Finanzanalysten auf Google Finanzen raten aktuell zum Kauf der Aktie.' };
  if (sym.includes('NVDA')) return { signal: 'Kaufen', percent: 88, text: '88% der Experten raten zum Kauf wegen des ungebrochenen KI-Booms.' };
  if (sym.includes('MSFT')) return { signal: 'Kaufen', percent: 91, text: '91% der Experten empfehlen den Einstieg dank hoher Cloud- und KI-Gewinne.' };
  if (sym.includes('SAP')) return { signal: 'Kaufen', percent: 84, text: 'Analysten loben das verlässliche Abo-Wachstum im Firmenkundengeschäft.' };
  if (sym.includes('RHM')) return { signal: 'Kaufen', percent: 86, text: 'Sehr hohe Auftragsbestände sichern Auslastung und Umsatz auf Jahre ab.' };
  if (sym.includes('ALV')) return { signal: 'Kaufen', percent: 79, text: 'Gilt als solider Fels in der Brandung mit starker Bilanz und Dividende.' };
  if (sym.includes('TSLA')) return { signal: 'Halten', percent: 54, text: 'Experten empfehlen Abwarten: Hohe KI-Chancen stehen Preisdruck im Automarkt gegenüber.' };
  if (sym.includes('SPY') || sym.includes('DAX')) return { signal: 'Kaufen', percent: 85, text: 'Breite Streuung über viele Unternehmen gilt langfristig als sehr solide Geldanlage.' };

  if (changePercent >= 1.5) {
    return { signal: 'Kaufen', percent: 75, text: 'Die Aktie zeigt einen stabilen Aufwärtstrend und positive Marktresonanz.' };
  } else if (changePercent >= -1.0) {
    return { signal: 'Halten', percent: 60, text: 'Der Kurs bewegt sich stabil. Experten raten zum gelassenen Beobachten.' };
  } else {
    return { signal: 'Halten', percent: 52, text: 'Leichter Kursrückgang. Langfristige Chancen sollten vor dem Einstieg geprüft werden.' };
  }
};

// Helper: Zukunft & Kommende Meilensteine (Katalysatoren, Wahrscheinlichkeit & Börsen-Dämpfung)
interface FutureOutlook {
  upcomingEvents: string;
  growthDrivers: string;
  probability: string;
  marketForecast: string;
}

const getFutureOutlook = (symbol: string, name: string): FutureOutlook => {
  const sym = symbol.toUpperCase();

  if (sym.includes('AAPL')) {
    return {
      upcomingEvents: 'Neues iPhone mit tief integrierter KI („Apple Intelligence“), M5-Chip-Generation für Macs, Vision Pro Nachfolger und mögliche Einführung smarter Home-Roboter.',
      growthDrivers: 'Ein weltweiter Hardware-Superzyklus bei über 1,4 Milliarden aktiven iPhones sowie stark anziehende monatliche Service- und Cloud-Abonnements.',
      probability: 'Sehr hoch (ca. 85%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Ein Teil der KI-Fantasie ist bereits im Kurs enthalten. Sollte das neue iPhone keine bahnbrechenden Verkaufsrekorde brechen, wird die Börse übertriebene Kurssprünge kurzfristig abdämpfen. Bei starken Lieferzahlen droht jedoch ein neuer nachhaltiger Aufwärtsschub.'
    };
  }

  if (sym.includes('NVDA')) {
    return {
      upcomingEvents: 'Vollständiger Verkaufsstart der neuen Blackwell-Ultra-Architektur, erste Enthüllungen zur Next-Gen-Plattform „Rubin“ und Ausbau von Robotik-KI.',
      growthDrivers: 'Milliardenschwere Infrastruktur-Investitionen von Microsoft, Meta, Google und Amazon in generative KI-Rechenzentren.',
      probability: 'Hoch (ca. 80%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Die Bewertung ist anspruchsvoll. Die Börse dämpft die Euphorie ab, sobald das Wachstum von dreistelligen auf zweistellige Raten normalisiert. Volle Auftragsbücher verhindern aber größere Kurseinbrüche.'
    };
  }

  if (sym.includes('MSFT')) {
    return {
      upcomingEvents: 'Breite Einführung autonomer KI-Agenten in Windows und Office (Copilot Studio) sowie neue maßgeschneiderte Azure-Quantenchips.',
      growthDrivers: 'Millionen Unternehmenskunden upgraden ihre bestehenden Verträge auf teurere KI-Pakete, was die Margen weiter nach oben treibt.',
      probability: 'Sehr hoch (ca. 90%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Äußerst verlässliche Erträge. Die Börse dämpft hier kaum ab, da die Cloud-Einnahmen extrem planbar und krisenfest sind.'
    };
  }

  if (sym.includes('TSLA')) {
    return {
      upcomingEvents: 'Kommerzieller Start der fahrerlosen Robotaxi-Flotte („Cybercab“), Produktionsbeginn des günstigen Modells unter 30.000 € und Fabrik-Einsatz von Optimus-Robotern.',
      growthDrivers: 'Erfolgreiche behördliche Zulassung von autonomem Fahren ohne Sicherheitsfahrer und drastische Senkung der Akkukosten.',
      probability: 'Mittel bis Hoch (ca. 60–65%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Bei Verzögerungen bei der Robotaxi-Zulassung wird die Börse den Kurs sofort spürbar abdämpfen. Gelingt der Durchbruch jedoch früher als gedacht, droht eine massive Neubewertung nach oben.'
    };
  }

  if (sym.includes('PLTR')) {
    return {
      upcomingEvents: 'Ausbau der Artificial Intelligence Platform (AIP) für Verteidigungsbündnisse (NATO) sowie Großaufträge in Industrie und Logistik.',
      growthDrivers: 'Steigender Bedarf westlicher Staaten und Fortune-500-Konzerne an sicherer, autonomer Datenanalyse.',
      probability: 'Hoch (ca. 75%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Nach starken Kursanstiegen dämpft die Börse kurzfristig ab, falls Quartalszahlen die extremen Wachstumsfantasien nicht voll erfüllen.'
    };
  }

  if (sym.includes('SAP')) {
    return {
      upcomingEvents: 'Frist für Altsystem-Wartung zwingt tausende Konzerne weltweit zur Umstellung auf die moderne Cloud S/4HANA, plus neuer KI-Assistent „Joule“.',
      growthDrivers: 'Wiederkehrende, hochprofitable Cloud-Abonnements mit langfristiger Kundenbindung.',
      probability: 'Sehr hoch (ca. 90%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Sehr geringes Dämpfungsrisiko. Großkonzerne können ihre Kernbuchhaltung nicht kündigen, was für extrem stabile Kurse sorgt.'
    };
  }

  if (sym.includes('RHM')) {
    return {
      upcomingEvents: 'Eröffnung neuer europäischer Werke für Artilleriemunition, gepanzerte Fahrzeuge (Panther & Lynx) und satellitengestützte Aufklärung.',
      growthDrivers: 'Milliardenschwere Verteidigungshaushalte europäischer Staaten bis weit in die 2030er Jahre.',
      probability: 'Sehr hoch (ca. 90%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Politische Friedensgespräche können vorübergehend für Dämpfer sorgen, die realen mehrjährigen Lieferverträge stützen das Geschäft jedoch fundamental ab.'
    };
  }

  if (sym.includes('ALV')) {
    return {
      upcomingEvents: 'Milliardenschwere Aktienrückkäufe, Dividendenerhöhungen und höhere Zinserträge bei festverzinslichen Kapitalanlagen.',
      growthDrivers: 'Steigende Prämieneinnahmen bei Sach- und Industrieversicherungen.',
      probability: 'Sehr hoch (ca. 95%)',
      marketForecast: 'Börsen-Einschätzung & Dämpfung: Keine Überhitzung. Kursdämpfer treten nur im Falle unerwarteter globaler Großschadensereignisse auf.'
    };
  }

  return {
    upcomingEvents: `Neue Produktgenerationen, operative Quartalsberichte und mögliche strategische Partnerschaften von ${name}.`,
    growthDrivers: 'Effizienzsteigerungen, internationale Marktexpansion und steigende operative Gewinne.',
    probability: 'Solide (ca. 70%)',
    marketForecast: 'Börsen-Einschätzung & Dämpfung: Die Börse wird die Entwicklung genau an den nächsten Zahlen messen und übermäßige Fantasie bei Verfehlungen zeitnah abdämpfen.'
  };
};

// Mini Sparkline Graph Renderer for overview list
const renderMiniGraph = (points: ChartPoint[] | undefined, isPositive: boolean, width = 68, height = 24) => {
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  if (!points || points.length < 2) {
    const sample = isPositive ? [10, 12, 11, 14, 13, 16, 18] : [18, 16, 17, 14, 15, 12, 10];
    const pts = sample.map((v, i) => `${(i / (sample.length - 1)) * width},${height - 2 - (v / 20) * (height - 4)}`).join(' ');
    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  }

  const min = Math.min(...points.map(p => p.price));
  const max = Math.max(...points.map(p => p.price));
  const range = Math.max(max - min, 0.01);

  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - 2 - ((p.price - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
};

export const StocksStudio: React.FC<StocksStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar,
  isMobile = false,
  onAnalyzeInChat,
  isStandaloneMode = false
}) => {
  const [activeTab, setActiveTab] = useState<StocksTab>('maerkte');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // News State from Google News RSS
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsFilter, setNewsFilter] = useState<'all' | 'watchlist'>('all');

  // Selected Stock for Detail Modal & Real Line Graph
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<ChartRange>('1mo');
  const [stockDetail, setStockDetail] = useState<DetailedStock | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Hover Scrubber state for Line Graph
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Watchlist persisted in localStorage
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WATCHLIST_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['AAPL', 'NVDA', 'SAP.DE', 'RHM.DE', 'MSFT'];
  });

  // Cached quotes for market list and watchlist cards
  const [marketQuotes, setMarketQuotes] = useState<Record<string, DetailedStock>>({});
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);

  // Quick Add Watchlist modal/sheet
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState('');
  const [quickAddResults, setQuickAddResults] = useState<any[]>([]);
  const [isQuickAddSearching, setIsQuickAddSearching] = useState(false);

  // Dandelious AI Analysis with Google Grounding
  const [aiAnalysis, setAiAnalysis] = useState<{ analysis: string; citations: any[] } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kursalarm State
  const [alerts, setAlerts] = useState<StockAlert[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_ALERTS_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ALERTS_KEY, JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  const [alertModalStock, setAlertModalStock] = useState<{ symbol: string; name: string; currentPrice: number } | null>(null);
  const [alertPercentInput, setAlertPercentInput] = useState<string>('3');
  const [alertDirection, setAlertDirection] = useState<'up' | 'down'>('up');

  // Monitor stock prices against Kursalarme
  useEffect(() => {
    alerts.forEach(alert => {
      if (alert.isTriggered) return;
      const quote = marketQuotes[alert.symbol];
      if (!quote || !quote.price || !alert.baselinePrice || alert.baselinePrice <= 0) return;

      const currentPrice = quote.price;
      const pctChange = ((currentPrice - alert.baselinePrice) / alert.baselinePrice) * 100;

      let triggered = false;
      if (alert.direction === 'up' && pctChange >= alert.targetPercent) {
        triggered = true;
      } else if (alert.direction === 'down' && pctChange <= -Math.abs(alert.targetPercent)) {
        triggered = true;
      }

      if (triggered) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? {
          ...a,
          isTriggered: true,
          triggeredAt: Date.now(),
          triggeredPrice: currentPrice
        } : a));

        playSound('pop', settings.enableSoundEffects ?? true);
        const sign = pctChange >= 0 ? '+' : '';
        showToast(`🔔 Kursalarm: ${alert.name} ist seit ${alert.baselineDateStr} um ${sign}${pctChange.toFixed(1)}% auf ${currentPrice.toFixed(2)} € ${alert.direction === 'up' ? 'gestiegen' : 'gefallen'}!`);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🔔 Kursalarm: ${alert.name}`, {
              body: `Ziel erreicht: ${sign}${pctChange.toFixed(1)}% seit ${alert.baselineDateStr} (Jetzt: ${currentPrice.toFixed(2)} €)`,
              icon: '/icon-192.png'
            });
          } catch (e) {}
        }
      }
    });
  }, [marketQuotes, alerts, settings.enableSoundEffects]);

  const handleOpenAlertModal = (symbol: string, name: string, price: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click', settings.enableSoundEffects ?? true);
    const existing = alerts.find(a => a.symbol === symbol);
    if (existing) {
      setAlertPercentInput(String(Math.abs(existing.targetPercent)));
      setAlertDirection(existing.direction);
    } else {
      setAlertPercentInput('3');
      setAlertDirection('up');
    }
    setAlertModalStock({
      symbol,
      name,
      currentPrice: price || marketQuotes[symbol]?.price || 100
    });
  };

  const handleSaveAlert = () => {
    if (!alertModalStock) return;
    const val = parseFloat(alertPercentInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      showToast('Bitte einen gültigen Prozentsatz eingeben (z. B. 3%)');
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (e) {}
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ', ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';

    const newAlert: StockAlert = {
      id: `alert-${alertModalStock.symbol}-${Date.now()}`,
      symbol: alertModalStock.symbol,
      name: alertModalStock.name,
      targetPercent: Math.abs(val),
      direction: alertDirection,
      baselinePrice: alertModalStock.currentPrice,
      baselineTime: Date.now(),
      baselineDateStr: dateStr,
      isTriggered: false
    };

    setAlerts(prev => [...prev.filter(a => a.symbol !== alertModalStock.symbol), newAlert]);
    playSound('pop', settings.enableSoundEffects ?? true);
    showToast(`🔔 Kursalarm für ${alertModalStock.name} (${alertDirection === 'up' ? '+' : '-'}${val}%) aktiviert!`);
    setAlertModalStock(null);
  };

  const handleDeleteAlert = (symbol: string) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setAlerts(prev => prev.filter(a => a.symbol !== symbol));
    showToast('Kursalarm entfernt');
    setAlertModalStock(null);
  };

  // Sync watchlist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_WATCHLIST_KEY, JSON.stringify(watchlistSymbols));
    } catch (e) {}
  }, [watchlistSymbols]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleWatchlist = (symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click', settings.enableSoundEffects ?? true);
    setWatchlistSymbols(prev => {
      const exists = prev.includes(symbol);
      const next = exists ? prev.filter(s => s !== symbol) : [...prev, symbol];
      showToast(exists ? 'Von Watchlist entfernt' : 'Zu Watchlist hinzugefügt');
      return next;
    });
  };

  // 1. Initial & Periodic Load of Quotes
  useEffect(() => {
    const symbolsToLoad = Array.from(new Set([...FEATURED_TICKERS.map(f => f.symbol), ...watchlistSymbols]));
    setIsLoadingMarket(true);

    Promise.all(
      symbolsToLoad.slice(0, 16).map(sym =>
        fetch(`/api/stocks/quote/${encodeURIComponent(sym)}?range=1mo`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      const map: Record<string, DetailedStock> = {};
      results.forEach(res => {
        if (res && res.symbol) {
          map[res.symbol] = res;
        }
      });
      setMarketQuotes(prev => ({ ...prev, ...map }));
      setIsLoadingMarket(false);
    });
  }, [watchlistSymbols]);

  // 2. Fetch Google News RSS for Börse / Aktien (unterstützt 'all' & 'watchlist')
  const loadGoogleNews = async (filter = newsFilter) => {
    setIsLoadingNews(true);
    try {
      let url = '/api/stocks/news';
      const params = new URLSearchParams();
      if (filter === 'watchlist') {
        if (watchlistSymbols.length > 0) {
          params.append('watchlist', watchlistSymbols.join(','));
        } else {
          setNewsList([]);
          setIsLoadingNews(false);
          return;
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNewsList(data.news || []);
      }
    } catch (err) {
      console.warn('Failed to load Google News:', err);
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'nachrichten') {
      loadGoogleNews(newsFilter);
    }
  }, [activeTab, newsFilter]);

  // 3. Global Search for ANY stock in the world
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn('Stock search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Quick Add Watchlist Search
  useEffect(() => {
    if (!quickAddQuery.trim()) {
      setQuickAddResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsQuickAddSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(quickAddQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setQuickAddResults(data.results || []);
        }
      } catch (err) {
        console.warn('Quick add search failed', err);
      } finally {
        setIsQuickAddSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [quickAddQuery]);

  // 4. Load Detailed Real-Time Quote & Chart Candles for Selected Stock
  const loadStockDetail = async (symbol: string, range: ChartRange = activeRange) => {
    setIsLoadingDetail(true);
    setHoveredPoint(null);
    setAiAnalysis(null);

    try {
      const res = await fetch(`/api/stocks/quote/${encodeURIComponent(symbol)}?range=${range}`);
      if (res.ok) {
        const data: DetailedStock = await res.json();
        setStockDetail(data);
        setMarketQuotes(prev => ({ ...prev, [data.symbol]: data }));
      } else {
        showToast('Kursdaten konnten nicht geladen werden');
      }
    } catch (err) {
      showToast('Verbindungsfehler zu den Börsendaten');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      loadStockDetail(selectedSymbol, activeRange);
    }
  }, [selectedSymbol, activeRange]);

  // 5. Trigger Dandelious AI Analysis with Google Grounding
  const handleTriggerAiAnalysis = async () => {
    if (!stockDetail || isLoadingAi) return;
    playSound('click', settings.enableSoundEffects ?? true);
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/stocks/google-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stockDetail.symbol,
          name: stockDetail.name,
          price: stockDetail.price,
          currency: stockDetail.currency
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      } else {
        showToast('Dandelious Analyse derzeit nicht verfügbar');
      }
    } catch (err) {
      showToast('Fehler bei der Dandelious Aktienanalyse');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Main stock list for the overview screen
  const mainStockList = useMemo(() => {
    if (activeTab === 'watchlist') {
      return watchlistSymbols.map(sym => marketQuotes[sym] || {
        symbol: sym,
        name: sym,
        price: 0,
        currency: '€',
        change: 0,
        changePercent: 0,
        exchange: 'Börse',
        points: []
      });
    }

    return FEATURED_TICKERS.map(f => marketQuotes[f.symbol] || {
      symbol: f.symbol,
      name: f.name,
      price: 0,
      currency: '€',
      change: 0,
      changePercent: 0,
      exchange: 'Börse',
      points: []
    });
  }, [activeTab, watchlistSymbols, marketQuotes]);

  // Chart computations: Real Google Finance/Apple Stocks layout like IMG_1201.jpeg (Black theme)
  const chartPoints = stockDetail?.points || [];
  const minPrice = chartPoints.length > 0 ? Math.min(...chartPoints.map(p => p.price)) : 0;
  const maxPrice = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.price)) : 100;
  const priceRange = Math.max(maxPrice - minPrice, 0.01);
  const isPeriodPositive = chartPoints.length > 1 ? chartPoints[chartPoints.length - 1].price >= chartPoints[0].price : (stockDetail ? stockDetail.changePercent >= 0 : true);
  
  // Theme colors matching image (Google Finance emerald green or red)
  const chartStrokeColor = isPeriodPositive ? '#10b981' : '#ef4444';
  const chartGradientColor = isPeriodPositive ? '#10b981' : '#ef4444';

  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 4;
  const paddingRight = 62;
  const paddingTop = 20;
  const paddingBottom = 30;

  const getCoordinates = (p: ChartPoint, idx: number, total: number) => {
    const usableW = svgWidth - paddingLeft - paddingRight;
    const usableH = svgHeight - paddingTop - paddingBottom;
    const x = paddingLeft + (idx / Math.max(total - 1, 1)) * usableW;
    const y = paddingTop + usableH - ((p.price - minPrice) / priceRange) * usableH;
    return { x, y };
  };

  const linePathD = useMemo(() => {
    if (chartPoints.length < 2) return '';
    return chartPoints
      .map((p, i) => {
        const { x, y } = getCoordinates(p, i, chartPoints.length);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [chartPoints, minPrice, priceRange]);

  const areaPathD = useMemo(() => {
    if (chartPoints.length < 2) return '';
    const first = getCoordinates(chartPoints[0], 0, chartPoints.length);
    const last = getCoordinates(chartPoints[chartPoints.length - 1], chartPoints.length - 1, chartPoints.length);
    const bottomY = svgHeight - paddingBottom;
    return `${linePathD} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [linePathD, chartPoints]);

  // Y-axis tick prices (on the right, exactly like IMG_1201.jpeg)
  const yTicks = useMemo(() => {
    if (chartPoints.length < 2) return [];
    const count = 5;
    const step = (maxPrice - minPrice) / (count - 1);
    return Array.from({ length: count }, (_, i) => {
      const val = maxPrice - i * step;
      const usableH = svgHeight - paddingTop - paddingBottom;
      const y = paddingTop + (i / (count - 1)) * usableH;
      return { val, y };
    });
  }, [minPrice, maxPrice, chartPoints]);

  // X-axis tick timestamps (at the bottom, exactly like IMG_1201.jpeg)
  const xTicks = useMemo(() => {
    if (chartPoints.length < 2) return [];
    const count = Math.min(chartPoints.length, 5);
    const step = (chartPoints.length - 1) / Math.max(count - 1, 1);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(Math.round(i * step), chartPoints.length - 1);
      const pt = chartPoints[idx];
      const { x } = getCoordinates(pt, idx, chartPoints.length);
      const date = new Date(pt.timestamp);
      let label = '';
      if (activeRange === '1d') {
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (activeRange === '5d' || activeRange === '1mo') {
        label = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      } else if (activeRange === '6mo' || activeRange === '1y') {
        label = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      } else {
        label = date.getFullYear().toString();
      }
      return { label, x };
    });
  }, [chartPoints, activeRange]);

  // Active point for right-hand pill badge & dot (scrubbed or current latest)
  const currentActivePoint = hoveredPoint || (chartPoints.length > 0 ? chartPoints[chartPoints.length - 1] : null);
  const currentActiveCoord = useMemo(() => {
    if (!currentActivePoint || chartPoints.length === 0) return null;
    const idx = chartPoints.findIndex(p => p.timestamp === currentActivePoint.timestamp);
    const safeIdx = idx >= 0 ? idx : chartPoints.length - 1;
    return getCoordinates(currentActivePoint, safeIdx, chartPoints.length);
  }, [currentActivePoint, chartPoints]);

  const currentRating = stockDetail ? getSimpleRating(stockDetail.symbol, stockDetail.changePercent) : null;
  const currentSimpleExplanation = stockDetail ? getSimpleExplanation(stockDetail.symbol, stockDetail.name) : '';
  const currentDividendInfo = stockDetail ? getSimpleDividendInfo(stockDetail.symbol) : '';
  const currentFutureOutlook = stockDetail ? getFutureOutlook(stockDetail.symbol, stockDetail.name) : null;

  // Today fluctuation difference in currency
  const dayDifference = stockDetail && stockDetail.dayHigh && stockDetail.dayLow
    ? (stockDetail.dayHigh - stockDetail.dayLow).toFixed(2)
    : null;

  return (
    <div
      className="relative flex flex-col w-full h-full h-[100dvh] bg-black text-white select-none overflow-hidden font-['Plus_Jakarta_Sans']"
      id="dandelious-stocks-view"
    >
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-emerald-950/20 rounded-full blur-[90px] pointer-events-none z-0 overflow-hidden" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* HEADER: Seitenleiste, 3 TABS (Märkte, Watchlist, Nachrichten), Hilfe */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
        {isStandaloneMode ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-950/40 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">Aktien</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSound('click', settings.enableSoundEffects ?? true);
              if (onToggleSidebar) onToggleSidebar();
            }}
            className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
            title="Menü"
          >
            <span className="w-4 h-[2px] bg-white rounded-full" />
            <span className="w-4 h-[2px] bg-white rounded-full" />
          </button>
        )}

        {/* Freistehende Tabs mit 3 Punkten: Märkte, Watchlist, Nachrichten */}
        <LayoutGroup id="stocks-header-tabs-group">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-neutral-950/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg pointer-events-auto">
            {(['maerkte', 'watchlist', 'nachrichten'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels = {
                maerkte: 'Märkte',
                watchlist: 'Watchlist',
                nachrichten: 'Nachrichten'
              };

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setActiveTab(tab);
                  }}
                  className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="stocksTabActivePill"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{tabLabels[tab]}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <button
          type="button"
          onClick={() => {
            playSound('click', settings.enableSoundEffects ?? true);
            setIsHelpOpen(true);
          }}
          className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
          title="Hilfe & Info"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>
      </header>

      {/* ========================================================================= */}
      {/* MAIN SCREEN: TAB 1 (Märkte) & TAB 2 (Watchlist) ODER TAB 3 (Nachrichten) */}
      {/* ========================================================================= */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-12 flex-1 flex flex-col items-center overflow-hidden">
        
        {activeTab !== 'nachrichten' ? (
          <>
            {/* Universelle Echtzeit-Suchleiste (NUR IM REITER MÄRKTE) */}
            {activeTab === 'maerkte' && (
              <div className="w-full mb-3 shrink-0 relative">
                <div className="relative flex items-center bg-black rounded-full border border-white/15 shadow-xl pl-4 pr-3 py-2.5">
                  <Search className="w-4.5 h-4.5 text-emerald-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Alle Aktien weltweit suchen (z.B. Apple, Nvidia, SAP)..."
                    className="flex-1 bg-transparent text-sm sm:text-[15px] text-white placeholder-neutral-500 focus:outline-none min-w-0"
                  />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                  )}
                  {searchQuery && !isSearching && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Live Search Autocomplete Dropdown */}
                <AnimatePresence>
                  {searchResults.length > 0 && searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      className="absolute top-14 left-0 right-0 z-40 bg-[#1c1c1e] border border-white/15 rounded-3xl p-2 shadow-2xl max-h-72 overflow-y-auto no-scrollbar"
                    >
                      <div className="px-3 py-1.5 text-[11px] font-mono uppercase text-neutral-400 border-b border-white/10 flex items-center justify-between">
                        <span>Suchergebnisse weltweit</span>
                        <span className="text-emerald-400">Google Finanzen</span>
                      </div>
                      {searchResults.map((res, rIdx) => (
                        <button
                          key={`search-res-${res.symbol}-${rIdx}`}
                          type="button"
                          onClick={() => {
                            playSound('click', settings.enableSoundEffects ?? true);
                            setSelectedSymbol(res.symbol);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <StockLogo symbol={res.symbol} name={res.name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white font-mono">{res.symbol}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/40 text-neutral-400 uppercase font-mono">
                                  {res.exchange}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-300 truncate mt-0.5">{res.name}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Aktien-Liste in abgerundeten Kacheln MIT ECHTEN FIRMENLOGOS & MINI-GRAPHEN */}
            <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1 pb-6">
              {mainStockList.length > 0 ? (
                mainStockList.map((item, idx) => {
                  const isPositive = (item.change ?? 0) >= 0;
                  const isWatched = watchlistSymbols.includes(item.symbol);

                  return (
                    <motion.div
                      key={`stock-card-${item.symbol}-${idx}`}
                      whileHover={{ scale: 1.015, x: 2, backgroundColor: '#2c2c2e' }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        playSound('click', settings.enableSoundEffects ?? true);
                        setSelectedSymbol(item.symbol);
                      }}
                      className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm w-full group select-none"
                    >
                      {/* Left: ECHTES FIRMENLOGO & Name */}
                      <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                        <StockLogo
                          symbol={item.symbol}
                          name={item.name}
                          size="md"
                          className="group-hover:border-emerald-400/50 transition-colors"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-white truncate">{item.name}</span>
                            <span className="text-[10px] font-mono text-neutral-400 uppercase hidden sm:inline">
                              {item.symbol}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">
                            {item.exchange || 'Börse'}
                          </span>
                        </div>
                      </div>

                      {/* Center: Mini ECHTER GRAPH */}
                      <div className="hidden sm:flex items-center justify-center px-2">
                        {renderMiniGraph(item.points, isPositive, 64, 22)}
                      </div>

                      {/* Right: Live Kurs, Rendite, Alarm & Watchlist Stern */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[15px] font-mono font-medium text-white">
                            {item.price ? `${item.price.toFixed(2)} ${item.currency}` : 'Laden...'}
                          </div>
                          {item.price > 0 && (
                            <div className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 ${
                              isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {isPositive ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                            </div>
                          )}
                        </div>

                        {/* Kursalarm Button */}
                        {(() => {
                          const activeAlert = alerts.find(a => a.symbol === item.symbol);
                          return (
                            <button
                              type="button"
                              onClick={(e) => handleOpenAlertModal(item.symbol, item.name, item.price, e)}
                              className={`p-2 rounded-full transition-all cursor-pointer ${
                                activeAlert
                                  ? activeAlert.isTriggered
                                    ? 'text-amber-300 bg-amber-400/25 ring-1 ring-amber-400/50 animate-pulse'
                                    : 'text-emerald-400 bg-emerald-400/15 ring-1 ring-emerald-400/30'
                                  : 'text-neutral-500 hover:text-white bg-white/5'
                              }`}
                              title={activeAlert ? `Kursalarm aktiv: ${activeAlert.direction === 'up' ? '+' : '-'}${activeAlert.targetPercent}% seit ${activeAlert.baselineDateStr}` : "Kursalarm setzen (z. B. +3%)"}
                            >
                              <Bell className={`w-4 h-4 ${activeAlert ? 'fill-current' : ''}`} />
                            </button>
                          );
                        })()}

                        {/* Watchlist Stern */}
                        <button
                          type="button"
                          onClick={(e) => toggleWatchlist(item.symbol, e)}
                          className={`p-2 rounded-full transition-all cursor-pointer ${
                            isWatched
                              ? 'text-emerald-400 bg-emerald-400/15 ring-1 ring-emerald-400/30'
                              : 'text-neutral-500 hover:text-white bg-white/5'
                          }`}
                          title={isWatched ? "Von Watchlist entfernen" : "Zu Watchlist hinzufügen"}
                        >
                          <Star className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <TrendingUp className="w-12 h-12 text-neutral-600 mb-3 stroke-[1.5]" />
                  <p className="text-base font-medium text-white">Keine Aktien auf der Watchlist</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                    Suche nach einem beliebigen Unternehmen und tippe auf das Sternchen, um es hier zu beobachten.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ========================================================================= */
          /* TAB 3: GOOGLE NEWS BÖRSEN-NACHRICHTEN (OHNE SUCHLEISTE, DIREKTER LINK) */
          /* ========================================================================= */
          <div className="w-full flex-1 flex flex-col overflow-hidden pt-1">
            {/* Filter-Umschalter: Alle Nachrichten vs Für meine Watchlist */}
            <div className="w-full flex items-center justify-between gap-2 mb-3 shrink-0">
              <div className="flex items-center p-1 bg-[#1a1a1c] rounded-full border border-white/10 shadow-md">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setNewsFilter('all');
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    newsFilter === 'all'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Alle Nachrichten
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setNewsFilter('watchlist');
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    newsFilter === 'watchlist'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Star className={`w-3 h-3 ${newsFilter === 'watchlist' ? 'text-black fill-current' : 'text-emerald-400'}`} />
                  <span>Für meine Watchlist</span>
                  {watchlistSymbols.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      newsFilter === 'watchlist' ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-neutral-300'
                    }`}>
                      {watchlistSymbols.length}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                {newsFilter === 'watchlist' ? 'Gefiltert nach Favoriten' : 'Google News Live'}
              </span>
            </div>

            {/* News Liste: Klick führt direkt zum Artikel */}
            <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2 pb-8">
              {isLoadingNews && newsList.length === 0 ? (
                <div className="py-28 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-400 mb-2.5" />
                  <p className="text-xs font-mono text-neutral-400">
                    {newsFilter === 'watchlist'
                      ? 'Lade Nachrichten zu deinen Watchlist-Aktien...'
                      : 'Lade aktuelle Google News Schlagzeilen...'}
                  </p>
                </div>
              ) : newsFilter === 'watchlist' && watchlistSymbols.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                  <Star className="w-10 h-10 text-neutral-600 mb-2.5 stroke-[1.5]" />
                  <p className="text-sm font-semibold text-white">Deine Watchlist ist noch leer</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                    Füge im Reiter „Märkte“ Aktien zu deinen Favoriten hinzu, um hier genau die Neuigkeiten zu sehen, die deine Wertpapiere betreffen.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setActiveTab('maerkte');
                    }}
                    className="mt-4 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Zu den Märkten
                  </button>
                </div>
              ) : newsList.length > 0 ? (
                newsList.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group py-3 px-3 rounded-2xl hover:bg-white/5 border-b border-white/10 hover:border-white/20 transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-between mb-1.5 text-xs text-neutral-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{item.source}</span>
                        <span>•</span>
                        <span>{item.timeAgo}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                    </div>

                    <h3 className="text-sm sm:text-[15px] font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                  </a>
                ))
              ) : (
                <div className="py-20 text-center text-neutral-400 text-xs">
                  {newsFilter === 'watchlist'
                    ? 'Keine aktuellen Nachrichten zu deinen Watchlist-Aktien gefunden.'
                    : 'Keine aktuellen Nachrichten gefunden.'}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DETAIL-POPUP: SEHR CLEAN, REINER WEISSER TEXT, GANZ OHNE KACHELN */}
      {/* - Oben nur Name & Logo */}
      {/* - Preis & Prozente */}
      {/* - Graph wie im Bild im schwarzen Theme */}
      {/* - Schwankungen heute */}
      {/* - Unternehmenswert */}
      {/* - Was macht die Firma? */}
      {/* - Was sagen Experten (OHNE GRÜNES EMOJI!) */}
      {/* - Gewinnausschüttung (Dividende) */}
      {/* - Zukunft & Was die Aktie treiben könnte (Prognose & Börsen-Dämpfung) */}
      {/* - „Mit Dandelious analysieren“ Button */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedSymbol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none">
            {/* Ambient Backdrop */}
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl cursor-pointer"
              onClick={() => setSelectedSymbol(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-[640px] max-h-[96%] h-[92vh] sm:h-[870px] rounded-[30px] sm:rounded-[36px] bg-[#000000] border border-white/10 shadow-[0_35px_120px_rgba(0,0,0,1)] text-white flex flex-col overflow-hidden"
            >
              {/* Floating Close Button oben links */}
              <button
                type="button"
                onClick={() => setSelectedSymbol(null)}
                className="absolute top-5 left-5 z-30 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Floating Actions oben rechts */}
              <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
                {stockDetail && (
                  <a
                    href={stockDetail.googleFinanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center"
                    title="Auf Google Finanzen ansehen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {stockDetail && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenAlertModal(stockDetail.symbol, stockDetail.name, stockDetail.price, e)}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      alerts.some(a => a.symbol === stockDetail.symbol)
                        ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                    title="Kursalarm setzen (z. B. +3%)"
                  >
                    <Bell className={`w-3.5 h-3.5 ${alerts.some(a => a.symbol === stockDetail.symbol) ? 'fill-current' : ''}`} />
                  </button>
                )}
                {stockDetail && (
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(stockDetail.symbol)}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      watchlistSymbols.includes(stockDetail.symbol)
                        ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                    title={watchlistSymbols.includes(stockDetail.symbol) ? "Von Watchlist entfernen" : "Zu Watchlist hinzufügen"}
                  >
                    <Star className={`w-3.5 h-3.5 ${watchlistSymbols.includes(stockDetail.symbol) ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>

              {/* Scrollable Container (Pures, elegantes Schwarz ohne Kacheln!) */}
              <div className="w-full h-full overflow-y-auto no-scrollbar px-3.5 sm:px-8 pt-12 sm:pt-14 pb-8 flex flex-col">
                
                {isLoadingDetail && !stockDetail ? (
                  <div className="py-44 flex flex-col items-center justify-center text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                    <p className="text-sm font-mono text-neutral-400">Lade aktuellen Börsengraphen...</p>
                  </div>
                ) : stockDetail ? (
                  <>
                    {/* 1. OBEN NUR DER NAME MIT ECHTEM FIRMENLOGO */}
                    <div className="flex items-center gap-3 pt-2">
                      <StockLogo
                        symbol={stockDetail.symbol}
                        name={stockDetail.name}
                        size="md"
                      />
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {stockDetail.name}
                      </h2>
                    </div>

                    {/* 2. PREIS DARUNTER */}
                    <div className="mt-2">
                      <div className="text-4xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
                        {currentActivePoint ? currentActivePoint.price.toFixed(2) : stockDetail.price.toFixed(2)} {stockDetail.currency}
                      </div>
                    </div>

                    {/* 3. MOMENTANE PROZENTE DARUNTER */}
                    <div className="mt-1.5 mb-4 flex items-center gap-2">
                      <span className={`text-sm sm:text-base font-mono font-bold flex items-center gap-1 ${
                        stockDetail.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {stockDetail.changePercent >= 0 ? '📈 +' : '📉 '}{stockDetail.changePercent.toFixed(2)}%
                        <span className="font-normal opacity-90">
                          ({stockDetail.change >= 0 ? '+' : ''}{stockDetail.change.toFixed(2)} {stockDetail.currency} heute)
                        </span>
                      </span>
                    </div>

                    {/* ========================================================================= */}
                    {/* 4. DER GRAPH (EXAKT WIE IM BILD, ABER IM SCHWARZEN THEME!) */}
                    {/* ========================================================================= */}
                    <div className="w-full relative touch-none select-none my-2">
                      {chartPoints.length > 1 ? (
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-[320px] sm:h-64 overflow-visible"
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                            const usableW = rect.width * ((svgWidth - paddingLeft - paddingRight) / svgWidth);
                            const ratio = Math.max(0, Math.min(relX / usableW, 1));
                            const idx = Math.round(ratio * (chartPoints.length - 1));
                            setHoveredPoint(chartPoints[idx] || null);
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const rect = e.currentTarget.getBoundingClientRect();
                            const relX = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                            const usableW = rect.width * ((svgWidth - paddingLeft - paddingRight) / svgWidth);
                            const ratio = Math.max(0, Math.min(relX / usableW, 1));
                            const idx = Math.round(ratio * (chartPoints.length - 1));
                            setHoveredPoint(chartPoints[idx] || null);
                          }}
                          onTouchEnd={() => setHoveredPoint(null)}
                        >
                          <defs>
                            <linearGradient id="blackThemeChartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartGradientColor} stopOpacity="0.32" />
                              <stop offset="60%" stopColor={chartGradientColor} stopOpacity="0.08" />
                              <stop offset="100%" stopColor={chartGradientColor} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Rechter Y-Achsen Preismarker */}
                          {yTicks.map((t, idx) => (
                            <g key={`ytick-${idx}`}>
                              <line
                                x1={paddingLeft}
                                y1={t.y}
                                x2={svgWidth - paddingRight}
                                y2={t.y}
                                stroke="rgba(255,255,255,0.04)"
                                strokeDasharray="2 3"
                              />
                              <text
                                x={svgWidth - 10}
                                y={t.y + 4}
                                textAnchor="end"
                                fill="#888888"
                                fontSize="12"
                                fontFamily="monospace"
                              >
                                {t.val.toFixed(2).replace('.', ',')}
                              </text>
                            </g>
                          ))}

                          {/* Unterer X-Achsen Zeitverlauf */}
                          {xTicks.map((xt, idx) => (
                            <text
                              key={`xtick-${idx}`}
                              x={xt.x}
                              y={svgHeight - 6}
                              textAnchor="middle"
                              fill="#999999"
                              fontSize="12"
                              fontFamily="system-ui, sans-serif"
                            >
                              {xt.label}
                            </text>
                          ))}

                          {/* Gradient Fill unter der Kurve */}
                          <path d={areaPathD} fill="url(#blackThemeChartGradient)" />

                          {/* Hauptlinie des Graphen */}
                          <path
                            d={linePathD}
                            fill="none"
                            stroke={chartStrokeColor}
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Vertikaler Zeigerstrich bei Berührung */}
                          {hoveredPoint && currentActiveCoord && (
                            <line
                              x1={currentActiveCoord.x}
                              y1={paddingTop}
                              x2={currentActiveCoord.x}
                              y2={svgHeight - paddingBottom}
                              stroke="rgba(255,255,255,0.4)"
                              strokeWidth="1.2"
                              strokeDasharray="3 3"
                            />
                          )}

                          {/* Punkt auf der Kurve & rechte Preiskapsel */}
                          {currentActiveCoord && currentActivePoint && (
                            <g>
                              <circle
                                cx={currentActiveCoord.x}
                                cy={currentActiveCoord.y}
                                r="4.5"
                                fill={chartStrokeColor}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />

                              <g transform={`translate(${svgWidth - 58}, ${Math.max(10, Math.min(currentActiveCoord.y - 10, svgHeight - paddingBottom - 18))})`}>
                                <rect
                                  x="0"
                                  y="0"
                                  width="56"
                                  height="20"
                                  rx="4"
                                  fill={chartStrokeColor}
                                />
                                <text
                                  x="28"
                                  y="14"
                                  textAnchor="middle"
                                  fill="#000000"
                                  fontWeight="bold"
                                  fontSize="11"
                                  fontFamily="monospace"
                                >
                                  {currentActivePoint.price.toFixed(2).replace('.', ',')}
                                </text>
                              </g>
                            </g>
                          )}
                        </svg>
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center text-xs font-mono text-neutral-400">
                          Graph wird geladen...
                        </div>
                      )}

                      {/* Minimalistische Zeitraum-Auswahl */}
                      <div className="flex items-center justify-between gap-1 pt-2 pb-1 border-b border-white/10">
                        {(['1d', '5d', '1mo', '6mo', '1y', '5y'] as const).map((r) => {
                          const labels: Record<string, string> = {
                            '1d': '1T',
                            '5d': '5T',
                            '1mo': '1M',
                            '6mo': '6M',
                            '1y': '1J',
                            '5y': '5J'
                          };
                          const isAct = activeRange === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                playSound('click', settings.enableSoundEffects ?? true);
                                setActiveRange(r);
                              }}
                              className={`py-1.5 px-3 rounded-full text-xs font-mono transition-all cursor-pointer ${
                                isAct
                                  ? 'bg-white text-black font-bold shadow-md'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              {labels[r]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* 5. BIS 7. KEINE KACHELN! REINER WEISSER TEXT, SEHR CLEAN & VERSTÄNDLICH */}
                    {/* ========================================================================= */}
                    <div className="space-y-6 pt-4 pb-2 text-white">

                      {/* 5. DIE SCHWANKUNGEN HEUTE */}
                      <div className="space-y-1.5">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                          Schwankungen heute
                        </div>
                        <div className="text-white text-base sm:text-lg font-medium flex items-center gap-3">
                          <span>Tief: <span className="font-mono font-bold">{stockDetail.dayLow ? `${stockDetail.dayLow.toFixed(2)} ${stockDetail.currency}` : '—'}</span></span>
                          <span className="text-neutral-600">•</span>
                          <span>Hoch: <span className="font-mono font-bold">{stockDetail.dayHigh ? `${stockDetail.dayHigh.toFixed(2)} ${stockDetail.currency}` : '—'}</span></span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
                          {dayDifference
                            ? `Die Aktie bewegte sich heute ruhig in einer Spanne von ${dayDifference} ${stockDetail.currency}. Völlig normale Tagesschwankung.`
                            : 'Der Kurs bewegt sich heute in einem sehr stabilen Rahmen.'}
                        </p>
                      </div>

                      <div className="w-full h-[1px] bg-white/10" />

                      {/* 6. DER UNTERNEHMENSWERT */}
                      <div className="space-y-1.5">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                          Unternehmenswert
                        </div>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-white">
                          {stockDetail.marketCap}
                        </div>
                        <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
                          Gesamtwert der gesamten Firma an der Börse. Berechnet aus allen Aktien weltweit mal dem aktuellen Börsenkurs.
                        </p>
                      </div>

                      <div className="w-full h-[1px] bg-white/10" />

                      {/* 7. ANDERE WICHTIGE INFORMATIONEN */}
                      
                      {/* Was macht das Unternehmen? */}
                      <div className="space-y-1.5">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                          Was macht dieses Unternehmen?
                        </div>
                        <p className="text-sm sm:text-base text-white leading-relaxed font-normal">
                          {currentSimpleExplanation}
                        </p>
                      </div>

                      <div className="w-full h-[1px] bg-white/10" />

                      {/* Was sagen Experten? (OHNE GRÜNES EMOJI!) */}
                      {currentRating && (
                        <div className="space-y-1.5">
                          <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                            Was sagen Experten?
                          </div>
                          <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span>{currentRating.signal}</span>
                            <span className="text-xs font-normal text-neutral-400 font-mono">({currentRating.percent}% Analysten-Zustimmung)</span>
                          </div>
                          <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
                            {currentRating.text}
                          </p>
                        </div>
                      )}

                      <div className="w-full h-[1px] bg-white/10" />

                      {/* Gewinnausschüttung (Dividende) */}
                      <div className="space-y-1.5">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                          Gewinnausschüttung (Dividende)
                        </div>
                        <p className="text-xs sm:text-[13px] text-neutral-200 leading-relaxed font-normal">
                          {currentDividendInfo}
                        </p>
                      </div>

                      <div className="w-full h-[1px] bg-white/10" />

                      {/* ZUKUNFT & WAS DIE AKTIE HOCHTREIBEN KÖNNTE (ERSETZT DIE WATCHLIST) */}
                      {currentFutureOutlook && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                              Zukunft & Kommende Meilensteine
                            </span>
                          </div>

                          {/* Kommende Produkte & Events */}
                          <div className="space-y-1">
                            <span className="text-xs text-neutral-400 font-medium block">
                              Was kommt als Nächstes?
                            </span>
                            <p className="text-sm text-white leading-relaxed font-medium">
                              {currentFutureOutlook.upcomingEvents}
                            </p>
                          </div>

                          {/* Mögliche Kurstreiber */}
                          <div className="space-y-1">
                            <span className="text-xs text-neutral-400 font-medium block">
                              Was könnte die Aktie hochtreiben?
                            </span>
                            <p className="text-xs sm:text-[13px] text-neutral-200 leading-relaxed">
                              {currentFutureOutlook.growthDrivers}
                            </p>
                          </div>

                          {/* Wahrscheinlichkeit & Börsen-Prognose */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">Erfolgswahrscheinlichkeit:</span>
                              <span className="text-emerald-400 font-bold font-mono">{currentFutureOutlook.probability}</span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed pt-0.5">
                              {currentFutureOutlook.marketForecast}
                            </p>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Dandelious Live-Analyse falls aufgerufen */}
                    <AnimatePresence>
                      {aiAnalysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="pt-4 border-t border-white/10 space-y-2 mb-4"
                        >
                          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Dandelious KI-Finanzanalyse</span>
                          </div>
                          <div className="text-xs sm:text-[13px] text-neutral-200 leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis.analysis}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ========================================================================= */}
                    {/* GANZ UNTEN: „MIT DANDELIOUS ANALYSIEREN“ ODER INLINE-ANALYSE IM STANDALONE */}
                    {/* ========================================================================= */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                      {isStandaloneMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click', settings.enableSoundEffects ?? true);
                            handleTriggerAiAnalysis();
                          }}
                          disabled={isLoadingAi}
                          className="w-full py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingAi ? (
                            <>
                              <RefreshCw className="w-4 h-4 text-black animate-spin" />
                              <span>Analysiere Marktdaten...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-black stroke-[2.2]" />
                              <span>{aiAnalysis ? 'Analyse aktualisieren' : 'Live-Finanzanalyse abrufen'}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click', settings.enableSoundEffects ?? true);
                            if (onAnalyzeInChat) {
                              onAnalyzeInChat({ symbol: stockDetail.symbol, name: stockDetail.name });
                            }
                          }}
                          className="w-full py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-black stroke-[2.2]" />
                          <span>Mit Dandelious analysieren</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : null}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* QUICK ADD TO WATCHLIST MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsQuickAddOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#181920] border border-white/10 rounded-[32px] p-5 shadow-2xl flex flex-col gap-3 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <span>Aktie zur Watchlist hinzufügen</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickAddQuery}
                  onChange={(e) => setQuickAddQuery(e.target.value)}
                  placeholder="Aktie suchen (z.B. Tesla, BMW, ASML)..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Quick Results */}
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                {isQuickAddSearching ? (
                  <div className="py-6 text-center text-xs text-neutral-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 mx-auto mb-1" />
                    Börsendaten werden geladen...
                  </div>
                ) : quickAddResults.length > 0 ? (
                  quickAddResults.map((r, rIdx) => {
                    const isAdded = watchlistSymbols.includes(r.symbol);
                    return (
                      <div
                        key={`quick-add-${r.symbol}-${rIdx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="min-w-0 mr-2">
                          <span className="font-mono font-bold text-xs text-white block">{r.symbol}</span>
                          <span className="text-xs text-neutral-400 truncate block">{r.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWatchlist(r.symbol)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-neutral-800 text-neutral-400'
                              : 'bg-white text-black hover:bg-neutral-200'
                          }`}
                        >
                          {isAdded ? 'Entfernen' : '+ Hinzufügen'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    {quickAddQuery ? 'Keine Aktien gefunden' : 'Tippe einen Namen oder Ticker ein'}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* KURSALARM / PROZENT-BENACHRICHTIGUNG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {alertModalStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              onClick={() => setAlertModalStock(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-md bg-[#161618] border border-white/15 rounded-[32px] p-6 shadow-2xl text-white space-y-5 font-['Plus_Jakarta_Sans']"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Kursalarm festlegen</h3>
                    <p className="text-xs text-neutral-400">
                      {alertModalStock.name} ({alertModalStock.symbol})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertModalStock(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Basis-Preis & Ausgangszeitpunkt */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Ausgangspreis jetzt</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {alertModalStock.currentPrice.toFixed(2)} €
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Startpunkt</span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    Jetzt
                  </span>
                </div>
              </div>

              {/* Richtung: Steigt um / Fällt um */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Benachrichtigen wenn Kurs...</label>
                <div className="flex rounded-2xl bg-black/40 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setAlertDirection('up');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      alertDirection === 'up'
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Steigt um (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setAlertDirection('down');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      alertDirection === 'down'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Fällt um (-)</span>
                  </button>
                </div>
              </div>

              {/* Prozentwert & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Schwellenwert (in %)</label>
                  <span className="text-xs font-mono text-neutral-400">
                    Zielkurs: ca. {(alertModalStock.currentPrice * (1 + (alertDirection === 'up' ? 1 : -1) * (parseFloat(alertPercentInput || '0') / 100))).toFixed(2)} €
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={alertPercentInput}
                    onChange={(e) => setAlertPercentInput(e.target.value)}
                    placeholder="z.B. 3"
                    className="w-full bg-black/50 border border-white/15 focus:border-emerald-400/60 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">
                    %
                  </span>
                </div>

                {/* Schnell-Presets */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  {['1', '2', '3', '5', '10', '15'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        playSound('click', settings.enableSoundEffects ?? true);
                        setAlertPercentInput(preset);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        alertPercentInput === preset
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                      }`}
                    >
                      {alertDirection === 'up' ? '+' : '-'}{preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Text */}
              <p className="text-[11px] text-neutral-400 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                💡 Du wirst benachrichtigt, sobald <strong className="text-white">{alertModalStock.name}</strong> seit jetzt um mindestens <strong className="text-emerald-400">{alertDirection === 'up' ? '+' : '-'}{alertPercentInput}%</strong> {alertDirection === 'up' ? 'gestiegen' : 'gefallen'} ist.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {alerts.some(a => a.symbol === alertModalStock.symbol) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAlert(alertModalStock.symbol)}
                    className="p-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                    title="Alarm entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAlert}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-lime-400 to-cyan-400 hover:opacity-90 text-black font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Bell className="w-4 h-4 fill-black" />
                  <span>Kursalarm aktivieren</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* HILFE & ANLEITUNG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsHelpOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative z-10 w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-[32px] p-6 shadow-2xl text-white space-y-4 font-['Plus_Jakarta_Sans']"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold">Aktien einfach verstehen</h3>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <p>
                  Im Modul <span className="font-semibold text-emerald-400">Aktien</span> kannst du Kurse und Wertpapiere ganz ohne Fachchinesisch sofort verstehen.
                </p>
                <p>
                  • <span className="font-semibold text-white">Klare Graphen:</span> Zeigt übersichtliche Linienkurven des tatsächlichen Kursverlaufs mit Preisskala rechts und Zeitverlauf unten.
                </p>
                <p>
                  • <span className="font-semibold text-white">Zukunft & Kurstreiber:</span> Zeigt dir genau, welche Produkte als Nächstes kommen, was die Aktie treiben könnte und wie die Börse darauf reagiert.
                </p>
                <p>
                  • <span className="font-semibold text-white">Nachrichten:</span> Aktuelle Börsen- und Finanznachrichten direkt von Google News.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
