import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Search, 
  Star, 
  X, 
  ChevronRight, 
  Clock, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Sparkles, 
  Bell, 
  BellRing, 
  Trash2, 
  Coins, 
  Bot, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';

export type CryptoTab = 'maerkte' | 'watchlist' | 'ai';
export type CryptoRange = '1d' | '5d' | '1mo' | '6mo' | '1y' | 'max';

export interface CryptoCoin {
  symbol: string;
  name: string;
  category: 'Layer 1' | 'DeFi' | 'KI & Compute' | 'Meme' | 'Smart Contracts';
  price: number;
  changePercent: number;
  changeAmount: number;
  marketCap: string;
  volume24h: string;
  ath: number;
  circulatingSupply: string;
  consensus: string;
  color: string;
  sparkline: number[];
  chartPoints: Array<{ timestamp: number; price: number }>;
  simpleExplanation: string;
  futureOutlook: {
    status: 'bullish' | 'neutral' | 'vorsichtig';
    statusText: string;
    summary: string;
  };
}

export interface CryptoAlert {
  id: string;
  symbol: string;
  name: string;
  targetPercent: number;
  direction: 'up' | 'down';
  baselinePrice: number;
  baselineTime: number;
  baselineDateStr: string;
  isTriggered?: boolean;
}

const INITIAL_CRYPTO_LIST: CryptoCoin[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'Layer 1',
    price: 89650.00,
    changePercent: 3.48,
    changeAmount: 3015.00,
    marketCap: '1.76 Bio. €',
    volume24h: '38.4 Mrd. €',
    ath: 99800.00,
    circulatingSupply: '19.8 Mio. BTC',
    consensus: 'Proof-of-Work',
    color: '#F7931A',
    sparkline: [86200, 86800, 87400, 86900, 88200, 88900, 89300, 89650],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 84500 },
      { timestamp: Date.now() - 86400000 * 5, price: 85200 },
      { timestamp: Date.now() - 86400000 * 4, price: 86400 },
      { timestamp: Date.now() - 86400000 * 3, price: 85900 },
      { timestamp: Date.now() - 86400000 * 2, price: 87800 },
      { timestamp: Date.now() - 86400000 * 1, price: 88700 },
      { timestamp: Date.now(), price: 89650 }
    ],
    simpleExplanation: 'Bitcoin ist das führende dezentrale digitale Wertaufbewahrungsmittel der Welt („Digitales Gold“) mit einer begrenzten Maximalmenge von 21 Millionen Einheiten.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Starker Aufwärtstrend',
      summary: 'Hohe institutionelle Nachfrage über ETFs, Knappheit nach dem Halving und weltweites Treasury-Interesse stützen den Kurs.'
    }
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'Smart Contracts',
    price: 3360.20,
    changePercent: 2.35,
    changeAmount: 77.10,
    marketCap: '404 Mrd. €',
    volume24h: '19.8 Mrd. €',
    ath: 4360.00,
    circulatingSupply: '120.4 Mio. ETH',
    consensus: 'Proof-of-Stake',
    color: '#627EEA',
    sparkline: [3240, 3270, 3230, 3300, 3320, 3315, 3340, 3360.2],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 3120 },
      { timestamp: Date.now() - 86400000 * 5, price: 3180 },
      { timestamp: Date.now() - 86400000 * 4, price: 3250 },
      { timestamp: Date.now() - 86400000 * 3, price: 3210 },
      { timestamp: Date.now() - 86400000 * 2, price: 3290 },
      { timestamp: Date.now() - 86400000 * 1, price: 3330 },
      { timestamp: Date.now(), price: 3360.2 }
    ],
    simpleExplanation: 'Ethereum ist die größte Plattform für Smart Contracts, DeFi (dezentrale Finanzen) und Web3-Anwendungen weltweit.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Positiv mit Layer-2-Wachstum',
      summary: 'Dank Layer-2-Rollups und Staking-Renditen bleibt Ethereum das Herzstück institutioneller DeFi-Abwicklungen.'
    }
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    category: 'Layer 1',
    price: 198.50,
    changePercent: 6.72,
    changeAmount: 12.50,
    marketCap: '93.5 Mrd. €',
    volume24h: '8.4 Mrd. €',
    ath: 242.00,
    circulatingSupply: '470.8 Mio. SOL',
    consensus: 'Proof-of-History',
    color: '#14F195',
    sparkline: [182, 185, 188, 186, 191, 194, 196, 198.5],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 168 },
      { timestamp: Date.now() - 86400000 * 5, price: 174 },
      { timestamp: Date.now() - 86400000 * 4, price: 181 },
      { timestamp: Date.now() - 86400000 * 3, price: 179 },
      { timestamp: Date.now() - 86400000 * 2, price: 189 },
      { timestamp: Date.now() - 86400000 * 1, price: 194 },
      { timestamp: Date.now(), price: 198.5 }
    ],
    simpleExplanation: 'Solana ist eine High-Speed-Blockchain mit tausenden Transaktionen pro Sekunde bei Bruchteilen eines Cents an Gebühren.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Sehr starkes Momentum',
      summary: 'Extrem hohe On-Chain-Aktivität, führende DEX-Volumina und massives Entwicklerwachstum treiben die Adoption an.'
    }
  },
  {
    symbol: 'TAO',
    name: 'Bittensor',
    category: 'KI & Compute',
    price: 528.00,
    changePercent: 9.15,
    changeAmount: 44.20,
    marketCap: '3.86 Mrd. €',
    volume24h: '390 Mio. €',
    ath: 710.00,
    circulatingSupply: '7.3 Mio. TAO',
    consensus: 'Proof-of-Intelligence',
    color: '#2DD4BF',
    sparkline: [470, 482, 478, 495, 510, 515, 520, 528],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 430 },
      { timestamp: Date.now() - 86400000 * 5, price: 445 },
      { timestamp: Date.now() - 86400000 * 4, price: 470 },
      { timestamp: Date.now() - 86400000 * 3, price: 460 },
      { timestamp: Date.now() - 86400000 * 2, price: 495 },
      { timestamp: Date.now() - 86400000 * 1, price: 512 },
      { timestamp: Date.now(), price: 528 }
    ],
    simpleExplanation: 'Bittensor dezentralisiert künstliche Intelligenz und belohnt Machine-Learning-Modelle für akkurate Vorhersagen.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Führendes DePIN / KI-Projekt',
      summary: 'Das globale Interesse an Open-Source-KI und dezentralen Rechennetzwerken verschafft TAO eine Vorreiterrolle.'
    }
  },
  {
    symbol: 'RENDER',
    name: 'Render Network',
    category: 'KI & Compute',
    price: 8.52,
    changePercent: 5.45,
    changeAmount: 0.44,
    marketCap: '4.4 Mrd. €',
    volume24h: '420 Mio. €',
    ath: 12.80,
    circulatingSupply: '518 Mio. RENDER',
    consensus: 'Proof-of-Render',
    color: '#E11D48',
    sparkline: [7.9, 8.0, 7.95, 8.15, 8.3, 8.4, 8.45, 8.52],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 7.2 },
      { timestamp: Date.now() - 86400000 * 5, price: 7.5 },
      { timestamp: Date.now() - 86400000 * 4, price: 7.8 },
      { timestamp: Date.now() - 86400000 * 3, price: 7.6 },
      { timestamp: Date.now() - 86400000 * 2, price: 8.1 },
      { timestamp: Date.now() - 86400000 * 1, price: 8.35 },
      { timestamp: Date.now(), price: 8.52 }
    ],
    simpleExplanation: 'Render verbindet Nutzer mit ungenutzter GPU-Power, um 3D-Szenen und KI-Modelle dezentral zu rendern.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Hohe Auslastung',
      summary: 'Stetig steigender GPU-Bedarf der Film-, Gaming- und KI-Industrie sorgt für dauerhafte Netzwerknutzung.'
    }
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    category: 'DeFi',
    price: 18.85,
    changePercent: 3.25,
    changeAmount: 0.59,
    marketCap: '11.4 Mrd. €',
    volume24h: '890 Mio. €',
    ath: 48.00,
    circulatingSupply: '608 Mio. LINK',
    consensus: 'Oracle Protocol',
    color: '#375BD2',
    sparkline: [17.9, 18.1, 18.0, 18.3, 18.5, 18.6, 18.75, 18.85],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 16.5 },
      { timestamp: Date.now() - 86400000 * 5, price: 17.1 },
      { timestamp: Date.now() - 86400000 * 4, price: 17.6 },
      { timestamp: Date.now() - 86400000 * 3, price: 17.4 },
      { timestamp: Date.now() - 86400000 * 2, price: 18.2 },
      { timestamp: Date.now() - 86400000 * 1, price: 18.6 },
      { timestamp: Date.now(), price: 18.85 }
    ],
    simpleExplanation: 'Chainlink versorgt Blockchains und Banken sicher mit verifizierten Realwelt- und Finanzdaten.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'RWA & Banken-Standard',
      summary: 'Das Cross-Chain Interoperability Protocol (CCIP) wird von führenden Finanzinstituten für tokenisierte Assets integriert.'
    }
  },
  {
    symbol: 'SUI',
    name: 'Sui Network',
    category: 'Layer 1',
    price: 3.55,
    changePercent: 11.80,
    changeAmount: 0.38,
    marketCap: '9.9 Mrd. €',
    volume24h: '1.45 Mrd. €',
    ath: 3.90,
    circulatingSupply: '2.8 Mrd. SUI',
    consensus: 'Mysticeti / Move',
    color: '#4DA2FF',
    sparkline: [3.1, 3.15, 3.22, 3.3, 3.38, 3.45, 3.48, 3.55],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 2.8 },
      { timestamp: Date.now() - 86400000 * 5, price: 2.95 },
      { timestamp: Date.now() - 86400000 * 4, price: 3.1 },
      { timestamp: Date.now() - 86400000 * 3, price: 3.05 },
      { timestamp: Date.now() - 86400000 * 2, price: 3.3 },
      { timestamp: Date.now() - 86400000 * 1, price: 3.45 },
      { timestamp: Date.now(), price: 3.55 }
    ],
    simpleExplanation: 'Sui ist eine extrem performante Layer-1-Blockchain mit objektbasierter Programmiersprache für blitzschnelle Web3-Apps.',
    futureOutlook: {
      status: 'bullish',
      statusText: 'Hervorragender Zufluss',
      summary: 'Rasanter Anstieg des Total Value Locked (TVL) und wachsendes DeFi-Ökosystem.'
    }
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    category: 'Meme',
    price: 0.231,
    changePercent: 8.20,
    changeAmount: 0.017,
    marketCap: '33.8 Mrd. €',
    volume24h: '3.2 Mrd. €',
    ath: 0.68,
    circulatingSupply: '146 Mrd. DOGE',
    consensus: 'Proof-of-Work',
    color: '#C2A633',
    sparkline: [0.208, 0.212, 0.21, 0.218, 0.222, 0.225, 0.228, 0.231],
    chartPoints: [
      { timestamp: Date.now() - 86400000 * 6, price: 0.185 },
      { timestamp: Date.now() - 86400000 * 5, price: 0.192 },
      { timestamp: Date.now() - 86400000 * 4, price: 0.205 },
      { timestamp: Date.now() - 86400000 * 3, price: 0.198 },
      { timestamp: Date.now() - 86400000 * 2, price: 0.218 },
      { timestamp: Date.now() - 86400000 * 1, price: 0.226 },
      { timestamp: Date.now(), price: 0.231 }
    ],
    simpleExplanation: 'Dogecoin ist die bekannteste Krypto-Währung der Meme-Kategorie mit weltweiter Akzeptanz als Trinkgeld- und Bezahlmittel.',
    futureOutlook: {
      status: 'neutral',
      statusText: 'Community-getrieben',
      summary: 'Stark abhängig vom allgemeinen Marktsentiment und Social-Media-Hype.'
    }
  }
];

const STORAGE_CRYPTO_WATCHLIST_KEY = 'dandelious_crypto_watchlist_v3';
const STORAGE_CRYPTO_ALERTS_KEY = 'dandelious_crypto_alerts_v3';

interface CryptoStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  onAnalyzeInChat?: (target: { symbol?: string; name?: string; prompt?: string }) => void;
  isStandaloneMode?: boolean;
}

export const CryptoStudio: React.FC<CryptoStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar,
  isMobile = false,
  onAnalyzeInChat,
  isStandaloneMode = false
}) => {
  const [activeTab, setActiveTab] = useState<CryptoTab>('maerkte');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<CryptoRange>('1d');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Live coins
  const [coins, setCoins] = useState<CryptoCoin[]>(INITIAL_CRYPTO_LIST);

  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_CRYPTO_WATCHLIST_KEY);
      return s ? JSON.parse(s) : ['BTC', 'ETH', 'SOL', 'TAO'];
    } catch {
      return ['BTC', 'ETH', 'SOL', 'TAO'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CRYPTO_WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch (e) {}
  }, [watchlist]);

  // Kursalarm
  const [alerts, setAlerts] = useState<CryptoAlert[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_CRYPTO_ALERTS_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CRYPTO_ALERTS_KEY, JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  const [alertModalCoin, setAlertModalCoin] = useState<CryptoCoin | null>(null);
  const [alertPercentInput, setAlertPercentInput] = useState('5');
  const [alertDirection, setAlertDirection] = useState<'up' | 'down'>('up');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Micro tick live pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins(prev => prev.map(c => {
        const delta = (Math.random() - 0.48) * 0.2;
        const newPrice = Number((c.price * (1 + delta / 100)).toFixed(c.price < 1 ? 4 : 2));
        const newSpark = [...c.sparkline.slice(1), newPrice];
        return {
          ...c,
          price: newPrice,
          changePercent: Number((c.changePercent + delta * 0.1).toFixed(2)),
          sparkline: newSpark
        };
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Alert check
  useEffect(() => {
    alerts.forEach(alert => {
      if (alert.isTriggered) return;
      const coin = coins.find(c => c.symbol === alert.symbol);
      if (!coin || !alert.baselinePrice || alert.baselinePrice <= 0) return;

      const pctChange = ((coin.price - alert.baselinePrice) / alert.baselinePrice) * 100;
      let triggered = false;

      if (alert.direction === 'up' && pctChange >= alert.targetPercent) {
        triggered = true;
      } else if (alert.direction === 'down' && pctChange <= -Math.abs(alert.targetPercent)) {
        triggered = true;
      }

      if (triggered) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isTriggered: true } : a));
        playSound('pop', settings.enableSoundEffects ?? true);
        const sign = pctChange >= 0 ? '+' : '';
        showToast(`🔔 Krypto-Alarm: ${coin.name} (${coin.symbol}) ist um ${sign}${pctChange.toFixed(1)}% auf ${coin.price.toFixed(coin.price < 1 ? 4 : 2)} € gestiegen!`);
      }
    });
  }, [coins, alerts, settings.enableSoundEffects]);

  const toggleWatchlist = (sym: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('pop', settings.enableSoundEffects ?? true);
    setWatchlist(prev => {
      const exists = prev.includes(sym);
      if (exists) {
        showToast(`${sym} von der Watchlist entfernt`);
        return prev.filter(x => x !== sym);
      } else {
        showToast(`⭐ ${sym} zur Watchlist hinzugefügt`);
        return [...prev, sym];
      }
    });
  };

  const handleOpenAlertModal = (coin: CryptoCoin, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click', settings.enableSoundEffects ?? true);
    const existing = alerts.find(a => a.symbol === coin.symbol);
    if (existing) {
      setAlertPercentInput(String(Math.abs(existing.targetPercent)));
      setAlertDirection(existing.direction);
    } else {
      setAlertPercentInput('5');
      setAlertDirection('up');
    }
    setAlertModalCoin(coin);
  };

  const handleSaveAlert = () => {
    if (!alertModalCoin) return;
    const val = parseFloat(alertPercentInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      showToast('Bitte gültigen Prozentwert angeben');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ', ' + now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';

    const newAlert: CryptoAlert = {
      id: `crypto-alert-${alertModalCoin.symbol}-${Date.now()}`,
      symbol: alertModalCoin.symbol,
      name: alertModalCoin.name,
      targetPercent: Math.abs(val),
      direction: alertDirection,
      baselinePrice: alertModalCoin.price,
      baselineTime: Date.now(),
      baselineDateStr: dateStr,
      isTriggered: false
    };

    setAlerts(prev => [...prev.filter(a => a.symbol !== alertModalCoin.symbol), newAlert]);
    playSound('pop', settings.enableSoundEffects ?? true);
    showToast(`🔔 Krypto-Alarm für ${alertModalCoin.name} (${alertDirection === 'up' ? '+' : '-'}${val}%) aktiviert!`);
    setAlertModalCoin(null);
  };

  // Filtered List
  const displayedCoins = useMemo(() => {
    return coins.filter(c => {
      if (activeTab === 'watchlist' && !watchlist.includes(c.symbol)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [coins, activeTab, watchlist, searchQuery]);

  const selectedCoinDetail = useMemo(() => {
    if (!selectedSymbol) return null;
    return coins.find(c => c.symbol === selectedSymbol) || null;
  }, [selectedSymbol, coins]);

  // Mini Sparkline (Matching StocksStudio exact proportions)
  const renderMiniGraph = (points: number[], isPositive: boolean) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 64;
    const height = 22;

    const pathData = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((p - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      className="relative flex flex-col w-full h-full h-[100dvh] bg-black text-white select-none overflow-hidden font-['Plus_Jakarta_Sans']"
      id="dandelious-crypto-view"
    >
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-cyan-950/20 rounded-full blur-[90px] pointer-events-none z-0 overflow-hidden" />

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
      {/* HEADER (GENAU WIE AKTIEN) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
        {isStandaloneMode ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-950/40 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">Crypto</span>
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

        {/* Freistehende Tabs mit 3 Punkten: Märkte, Watchlist, KI-Tokens */}
        <LayoutGroup id="crypto-header-tabs-group">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-neutral-950/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg pointer-events-auto">
            {(['maerkte', 'watchlist', 'ai'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels = {
                maerkte: 'Märkte',
                watchlist: 'Watchlist',
                ai: 'KI-Coins'
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
                      layoutId="cryptoTabActivePill"
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
      {/* MAIN SCREEN (GENAU WIE AKTIEN) */}
      {/* ========================================================================= */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-12 flex-1 flex flex-col items-center overflow-hidden">
        
        {/* Universelle Echtzeit-Suchleiste */}
        <div className="w-full mb-3 shrink-0 relative">
          <div className="relative flex items-center bg-black rounded-full border border-white/15 shadow-xl pl-4 pr-3 py-2.5">
            <Search className="w-4.5 h-4.5 text-emerald-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Alle Kryptowährungen suchen (z.B. Bitcoin, Solana, TAO)..."
              className="flex-1 bg-transparent text-sm sm:text-[15px] text-white placeholder-neutral-500 focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Krypto-Liste in abgerundeten Kacheln (GENAU WIE AKTIEN) */}
        <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1 pb-6">
          {displayedCoins.length > 0 ? (
            displayedCoins.map((item, idx) => {
              const isPositive = (item.changePercent ?? 0) >= 0;
              const isWatched = watchlist.includes(item.symbol);
              const activeAlert = alerts.find(a => a.symbol === item.symbol);

              return (
                <motion.div
                  key={`crypto-card-${item.symbol}-${idx}`}
                  whileHover={{ scale: 1.015, x: 2, backgroundColor: '#2c2c2e' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setSelectedSymbol(item.symbol);
                  }}
                  className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm w-full group select-none"
                >
                  {/* Left: Coin Icon, Name & Symbol */}
                  <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/10 shadow-inner"
                      style={{ backgroundColor: `${item.color}25`, color: item.color }}
                    >
                      {item.symbol.slice(0, 3)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white truncate">{item.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase hidden sm:inline">
                          {item.symbol}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Center: Mini ECHTER GRAPH */}
                  <div className="hidden sm:block shrink-0 px-2 opacity-85 group-hover:opacity-100 transition-opacity">
                    {renderMiniGraph(item.sparkline, isPositive)}
                  </div>

                  {/* Right: Live Kurs, Rendite, Alarm & Watchlist Stern */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[15px] font-mono font-medium text-white">
                        {item.price.toLocaleString('de-DE', { minimumFractionDigits: item.price < 1 ? 4 : 2, maximumFractionDigits: item.price < 1 ? 4 : 2 })} €
                      </div>
                      <div className={`text-xs font-mono font-medium flex items-center justify-end gap-0.5 ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Kursalarm Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenAlertModal(item, e)}
                      className={`p-2 rounded-full transition-all cursor-pointer ${
                        activeAlert
                          ? activeAlert.isTriggered
                            ? 'text-amber-300 bg-amber-400/25 ring-1 ring-amber-400/50 animate-pulse'
                            : 'text-emerald-400 bg-emerald-400/15 ring-1 ring-emerald-400/30'
                          : 'text-neutral-500 hover:text-white bg-white/5'
                      }`}
                      title={activeAlert ? `Alarm aktiv (${activeAlert.direction === 'up' ? '+' : '-'}${activeAlert.targetPercent}%)` : "Kursalarm setzen"}
                    >
                      <Bell className={`w-4 h-4 ${activeAlert ? 'fill-current' : ''}`} />
                    </button>

                    {/* Watchlist Stern */}
                    <button
                      type="button"
                      onClick={(e) => toggleWatchlist(item.symbol, e)}
                      className={`p-2 rounded-full transition-all cursor-pointer ${
                        isWatched
                          ? 'text-amber-400 bg-amber-400/15 ring-1 ring-amber-400/30'
                          : 'text-neutral-500 hover:text-white bg-white/5'
                      }`}
                      title={isWatched ? "Von Watchlist entfernen" : "Zur Watchlist hinzufügen"}
                    >
                      <Star className={`w-4 h-4 ${isWatched ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                </motion.div>
              );
            })
          ) : (
            <div className="py-16 text-center text-neutral-400 flex flex-col items-center gap-2">
              <Coins className="w-8 h-8 text-neutral-600 mb-1" />
              <p className="text-sm font-medium">Keine Kryptowährungen gefunden</p>
            </div>
          )}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* COIN DETAIL POPUP (GENAU WIE AKTIEN) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedCoinDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              onClick={() => setSelectedSymbol(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-[#1c1c1e] border border-white/15 rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col font-['Plus_Jakarta_Sans']"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: `${selectedCoinDetail.color}30`, color: selectedCoinDetail.color }}
                  >
                    {selectedCoinDetail.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{selectedCoinDetail.name}</h2>
                    <span className="text-xs font-mono text-neutral-400">{selectedCoinDetail.symbol} • {selectedCoinDetail.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenAlertModal(selectedCoinDetail, e)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(selectedCoinDetail.symbol)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${watchlist.includes(selectedCoinDetail.symbol) ? 'text-amber-400 fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSymbol(null)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
                {/* Price Display */}
                <div>
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {selectedCoinDetail.price.toLocaleString('de-DE', { minimumFractionDigits: selectedCoinDetail.price < 1 ? 4 : 2 })} €
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-mono font-bold ${selectedCoinDetail.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedCoinDetail.changePercent >= 0 ? '+' : ''}{selectedCoinDetail.changePercent}% (24h)
                    </span>
                    <span className="text-xs text-neutral-400">• MCap: {selectedCoinDetail.marketCap}</span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-0.5">24h Handelsvolumen</span>
                    <span className="font-bold text-white">{selectedCoinDetail.volume24h}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-0.5">Allzeithoch (ATH)</span>
                    <span className="font-bold text-white">{selectedCoinDetail.ath.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-0.5">Umlaufversorgung</span>
                    <span className="font-bold text-white">{selectedCoinDetail.circulatingSupply}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-0.5">Konsens</span>
                    <span className="font-bold text-emerald-400">{selectedCoinDetail.consensus}</span>
                  </div>
                </div>

                {/* Simple Explanation */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1 text-xs">
                  <span className="font-bold text-white block">Über {selectedCoinDetail.name}</span>
                  <p className="text-neutral-300 leading-relaxed">{selectedCoinDetail.simpleExplanation}</p>
                </div>

                {/* Outlook */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <span className="font-bold text-emerald-400 block">Ausblick & Momentum</span>
                  <p className="text-neutral-200 leading-relaxed">{selectedCoinDetail.futureOutlook.summary}</p>
                </div>

                {/* KI Analysis Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onAnalyzeInChat) {
                      onAnalyzeInChat({
                        symbol: selectedCoinDetail.symbol,
                        name: selectedCoinDetail.name,
                        prompt: `Erstelle bitte eine detaillierte Krypto-Marktanalyse für ${selectedCoinDetail.name} (${selectedCoinDetail.symbol}): Kursentwicklung, On-Chain-Metriken, technologische Grundlagen, Chancen und Risiken.`
                      });
                    }
                    setSelectedSymbol(null);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-90 text-black font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <Bot className="w-4 h-4 text-black" />
                  <span>Dandelious KI-Krypto-Analyse starten</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* KURSALARM MODAL (GENAU WIE AKTIEN) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {alertModalCoin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              onClick={() => setAlertModalCoin(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative z-10 w-full max-w-md bg-[#161618] border border-white/15 rounded-[32px] p-6 shadow-2xl text-white space-y-5 font-['Plus_Jakarta_Sans']"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Krypto-Alarm festlegen</h3>
                    <p className="text-xs text-neutral-400">{alertModalCoin.name} ({alertModalCoin.symbol})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertModalCoin(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Basis-Preis */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">Ausgangspreis jetzt</span>
                  <span className="text-lg font-mono font-bold text-white">
                    {alertModalCoin.price.toFixed(alertModalCoin.price < 1 ? 4 : 2)} €
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

              {/* Richtung */}
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
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={alertPercentInput}
                    onChange={(e) => setAlertPercentInput(e.target.value)}
                    placeholder="z.B. 5"
                    className="w-full bg-black/50 border border-white/15 focus:border-emerald-400/60 rounded-2xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold">
                    %
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  {['2', '3', '5', '10', '15', '20'].map((preset) => (
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

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSaveAlert}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Bell className="w-4 h-4 fill-black" />
                <span>Krypto-Alarm aktivieren</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={() => setIsHelpOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#1c1c1e] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white">Krypto-Märkte Übersicht</h3>
                <button type="button" onClick={() => setIsHelpOpen(false)} className="p-1 text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Live-Einblicke in die wichtigsten Kryptowährungen, Layer-1-Protokolle, DeFi- und dezentrale KI-Netzwerke mit Echtzeitkursen, Kursalarmen und KI-gestützter Marktanalyse.
              </p>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2.5 bg-white text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Verstanden
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
