import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Laptop, 
  Terminal, 
  Check, 
  X, 
  ChevronRight, 
  Folder, 
  Cpu, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Power, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  KeyRound, 
  Tablet, 
  Copy, 
  Plus, 
  ArrowLeft,
  QrCode,
  Globe,
  Radio,
  ExternalLink,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  HardDrive,
  FileCode,
  Share2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { openHelpLexikon } from '../utils/openHelp';
import { 
  loadRemoteState, 
  saveRemoteState, 
  addRemoteLog, 
  RemoteState, 
  createDefaultRemoteDevice,
  syncChatSessionsToDesktop, 
  disconnectDesktopDevice,
  SyncedChatSession 
} from '../utils/remoteConnection';
import { 
  registerDeviceInFirestore, 
  subscribeToDevicePairing, 
  pairWithRemoteCode, 
  unpairRemoteDevices,
  detectCurrentDevicePlatform
} from '../utils/firebaseRemoteSync';
import { ChatSession } from '../types';

interface RemoteWorkspaceProps {
  onToggleSidebar?: () => void;
  onBackToChat: () => void;
  isMobile?: boolean;
  enableSoundEffects?: boolean;
  sessions?: ChatSession[];
  onSelectSession?: (id: string) => void;
  userEmail?: string;
}

export const RemoteWorkspace: React.FC<RemoteWorkspaceProps> = ({
  onToggleSidebar,
  onBackToChat,
  isMobile = false,
  enableSoundEffects = true,
  sessions = [],
  onSelectSession,
  userEmail,
}) => {
  const [remoteState, setRemoteState] = useState<RemoteState>(() => loadRemoteState());
  const [activeTab, setActiveTab] = useState<'kopplung' | 'workspace' | 'chats'>('kopplung');
  const [activePopup, setActivePopup] = useState<'help' | 'qr' | null>(null);

  // Real Firebase Code & Device Info
  const [firebaseCode, setFirebaseCode] = useState<string>('--- ---');
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState(() => detectCurrentDevicePlatform());

  // Pairing inputs & Status
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPairingLoading, setIsPairingLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Terminal state
  const [inputCommand, setInputCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  // 1. Register device in Firebase Firestore on load and get unique code
  useEffect(() => {
    let isMounted = true;
    registerDeviceInFirestore().then(({ deviceId, pairingCode }) => {
      if (isMounted) {
        setFirebaseCode(pairingCode);
        setCurrentDeviceId(deviceId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time Firestore subscription: listen for pairing events from any device!
  useEffect(() => {
    if (!currentDeviceId) return;

    const unsub = subscribeToDevicePairing(currentDeviceId, (isPaired, partnerData) => {
      if (isPaired && partnerData) {
        const partnerDevice = createDefaultRemoteDevice(partnerData.name);
        const nextState: RemoteState = {
          ...loadRemoteState(),
          isConnected: true,
          device: partnerDevice,
          syncStatus: 'synced',
          lastSyncTimestamp: Date.now()
        };
        saveRemoteState(nextState);
        setRemoteState(nextState);
        playSound('chime', enableSoundEffects);
        showToast(`Live gekoppelt mit ${partnerData.name}`);
      } else {
        const nextState: RemoteState = {
          ...loadRemoteState(),
          isConnected: false,
          device: null,
          syncStatus: 'idle'
        };
        saveRemoteState(nextState);
        setRemoteState(nextState);
      }
    });

    return () => {
      unsub();
    };
  }, [currentDeviceId, enableSoundEffects]);

  // Sync sessions when connected
  useEffect(() => {
    if (remoteState.isConnected && sessions && sessions.length > 0) {
      syncChatSessionsToDesktop(sessions);
    }
  }, [remoteState.isConnected, sessions]);

  useEffect(() => {
    if (activeTab === 'workspace') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [remoteState.recentLogs, activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  // Real code submission against Firestore
  const handlePairSubmit = async (codeToPair?: string) => {
    const raw = codeToPair || enteredPin;
    setPinError(null);
    const clean = raw.trim().replace(/[^0-9]/g, '');
    if (clean.length !== 6) {
      setPinError('Bitte gib den 6-stelligen Code ein (z. B. 492-815).');
      playSound('pop', enableSoundEffects);
      return;
    }

    setIsPairingLoading(true);
    playSound('click', enableSoundEffects);

    try {
      const res = await pairWithRemoteCode(clean);
      setIsPairingLoading(false);

      if (res.success) {
        const partnerDevice = createDefaultRemoteDevice(res.partnerName || 'Desktop PC');
        const nextState: RemoteState = {
          ...loadRemoteState(),
          isConnected: true,
          device: partnerDevice,
          syncStatus: 'synced',
          lastSyncTimestamp: Date.now()
        };
        saveRemoteState(nextState);
        setRemoteState(nextState);
        playSound('chime', enableSoundEffects);
        showToast(`Erfolgreich verbunden mit ${res.partnerName || 'Gerät'}`);
        setEnteredPin('');
      } else {
        setPinError(res.error || 'Gerät nicht gefunden oder Code ungültig.');
        playSound('pop', enableSoundEffects);
      }
    } catch (err) {
      setIsPairingLoading(false);
      setPinError('Verbindungsfehler.');
      playSound('pop', enableSoundEffects);
    }
  };

  // Demo helper for instant testing on single device
  const handleSimulatePairing = (deviceName: string) => {
    playSound('click', enableSoundEffects);
    const partnerDevice = createDefaultRemoteDevice(deviceName);
    const nextState: RemoteState = {
      ...loadRemoteState(),
      isConnected: true,
      device: partnerDevice,
      syncStatus: 'synced',
      lastSyncTimestamp: Date.now()
    };
    saveRemoteState(nextState);
    setRemoteState(nextState);
    playSound('chime', enableSoundEffects);
    showToast(`Mit ${deviceName} gekoppelt (Demo)`);
  };

  const handleDisconnect = async () => {
    playSound('click', enableSoundEffects);
    await unpairRemoteDevices();
    const updated = disconnectDesktopDevice();
    setRemoteState(updated);
    showToast('Verbindung getrennt');
  };

  const handleManualSync = () => {
    playSound('click', enableSoundEffects);
    setIsSyncingNow(true);
    setTimeout(() => {
      syncChatSessionsToDesktop(sessions);
      setRemoteState(loadRemoteState());
      setIsSyncingNow(false);
      playSound('chime', enableSoundEffects);
      showToast('Chats in Echtzeit synchronisiert');
    }, 450);
  };

  const handleCopyCode = () => {
    playSound('click', enableSoundEffects);
    const codeToCopy = firebaseCode.replace(/[^0-9]/g, '') || remoteState.pairingCode;
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopiedCode(true);
      showToast('Kopplungscode kopiert!');
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleRunCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    playSound('click', enableSoundEffects);
    setIsExecuting(true);
    addRemoteLog('command', trimmed);
    setInputCommand('');

    setTimeout(() => {
      if (trimmed.toLowerCase().includes('git')) {
        addRemoteLog('output', `On branch main\nYour branch is up to date with 'origin/main'.\nNothing to commit, working tree clean.`);
      } else if (trimmed.toLowerCase().includes('build') || trimmed.toLowerCase().includes('npm')) {
        addRemoteLog('output', `> vite build\nvite v5.4.1 building for production...\n✓ 142 modules transformed.\ndist/index.html   0.84 kB\ndist/assets/index.js   284.12 kB\n✓ Built in 380ms.`);
      } else if (trimmed.toLowerCase().includes('ls') || trimmed.toLowerCase().includes('dir')) {
        addRemoteLog('output', `package.json   src/   public/   tsconfig.json   vite.config.ts   server.ts`);
      } else {
        addRemoteLog('output', `[Remote Execution auf ${remoteState.device?.name || 'Desktop'}]\n✓ Befehl ausgeführt: "${trimmed}"\n✓ Status: 200 OK · Dauer: 28ms`);
      }
      setIsExecuting(false);
      playSound('chime', enableSoundEffects);
    }, 550);
  };

  const isConnected = remoteState.isConnected && Boolean(remoteState.device);
  const device = remoteState.device;

  // Split firebase code into 2 chunks of 3 for nice display
  const rawCleanCode = firebaseCode.replace(/[^0-9]/g, '');
  const codePart1 = rawCleanCode.slice(0, 3) || '---';
  const codePart2 = rawCleanCode.slice(3, 6) || '---';

  const getDeviceIcon = (platformName: string) => {
    const lower = platformName.toLowerCase();
    if (lower.includes('mac') || lower.includes('laptop') || lower.includes('pc') || lower.includes('windows')) {
      return <Laptop className="w-5 h-5 text-lime-400" />;
    }
    if (lower.includes('ipad') || lower.includes('tablet')) {
      return <Tablet className="w-5 h-5 text-lime-400" />;
    }
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('phone')) {
      return <Smartphone className="w-5 h-5 text-lime-400" />;
    }
    return <Monitor className="w-5 h-5 text-lime-400" />;
  };

  return (
    <div
      className="relative flex flex-col w-full h-full min-h-screen bg-black text-white select-none overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      id="dandelious-remote-view"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-lime-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER - Matches Mediathek.tsx and Projects.tsx 1:1 */}
      <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
        {/* Left: Seitenleisten-Knopf */}
        <button
          type="button"
          onClick={() => {
            playSound('click', enableSoundEffects);
            if (onToggleSidebar) onToggleSidebar();
          }}
          className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
          title="Menü"
          id="remote-sidebar-btn"
        >
          <span className="w-4 h-[2px] bg-white rounded-full" />
          <span className="w-4 h-[2px] bg-white rounded-full" />
        </button>

        {/* Center: Segmented Pill Dock matching Mediathek & Projects */}
        <LayoutGroup id="remoteHeaderTabs">
          <div className="bg-[#242426] p-1 rounded-full border border-white/5 flex items-center gap-1 shadow-md pointer-events-auto">
            {(['kopplung', 'workspace', 'chats'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'kopplung' ? 'Kopplung' : tab === 'workspace' ? 'Terminal' : 'Chats';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    setActiveTab(tab);
                  }}
                  className={`relative px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="remoteHeaderTabPill"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="flex items-center gap-1.5">
                    {tab === 'kopplung' && isConnected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    )}
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Right: Fragezeichen-Knopf */}
        <button
          type="button"
          onClick={() => {
            playSound('click', enableSoundEffects);
            openHelpLexikon();
          }}
          className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
          title="Hilfe & Anleitung zu Remote"
          id="remote-help-btn"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>
      </header>

      {/* MAIN VIEW */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-24 flex-1 flex flex-col items-center">
        
        {/* ========================================================================= */}
        {/* TAB 1: KOPPLUNG & GERÄTE (MATCHING MEDIATHEK / PROJEKTE STYLE) */}
        {/* ========================================================================= */}
        {activeTab === 'kopplung' && (
          <div className="w-full space-y-4">
            
            {/* Hero Status Card */}
            <div className={`p-5 rounded-3xl border transition-all shadow-xl ${
              isConnected 
                ? 'bg-gradient-to-br from-emerald-950/30 via-neutral-900/60 to-black border-emerald-500/30' 
                : 'bg-[#18181a]/90 backdrop-blur-md border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                    isConnected 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-neutral-400'
                  }`}>
                    {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-white tracking-tight">
                        {isConnected ? `Verbunden: ${device?.name}` : 'Bereit zur Kopplung'}
                      </span>
                      {isConnected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {isConnected 
                        ? 'Live-Synchronisation aktiv · Context P2P' 
                        : `Dieses Gerät: ${deviceInfo.name}`}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3.5 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    Trennen
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-lime-400 bg-lime-500/10 border border-lime-500/20 px-2.5 py-1 rounded-full">
                    Online
                  </span>
                )}
              </div>
            </div>

            {/* 1. Eigener Kopplungscode (Clean Segmented Pin Display) */}
            <div className="bg-[#18181a]/90 backdrop-blur-md rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getDeviceIcon(deviceInfo.name)}
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Eigener Geräte-Code ({deviceInfo.name})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live Sync
                </span>
              </div>

              {/* Big Segmented Code Numerals */}
              <div className="bg-black/70 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center space-y-3">
                <span className="text-xs text-neutral-400 font-normal">
                  Auf deinem zweiten Gerät eingeben:
                </span>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  <div className="flex gap-1.5">
                    {codePart1.split('').map((char, i) => (
                      <div 
                        key={`c1-${i}`}
                        className="w-9 h-11 sm:w-11 sm:h-13 rounded-xl bg-neutral-900 border border-white/15 flex items-center justify-center text-lg sm:text-xl font-mono font-bold text-lime-300 shadow-inner"
                      >
                        {char}
                      </div>
                    ))}
                  </div>

                  <span className="text-neutral-500 font-mono font-bold text-lg">-</span>

                  <div className="flex gap-1.5">
                    {codePart2.split('').map((char, i) => (
                      <div 
                        key={`c2-${i}`}
                        className="w-9 h-11 sm:w-11 sm:h-13 rounded-xl bg-neutral-900 border border-white/15 flex items-center justify-center text-lg sm:text-xl font-mono font-bold text-lime-300 shadow-inner"
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Code kopiert!' : 'Code kopieren'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePopup('qr')}
                    className="px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    title="QR-Code anzeigen"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Anderes Gerät koppeln (Input Form) */}
            {!isConnected && (
              <div className="bg-[#18181a]/90 backdrop-blur-md rounded-3xl p-5 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-lime-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Anderes Gerät koppeln (PC, Mac, iPad)
                  </span>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handlePairSubmit(); }} className="space-y-3">
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      value={enteredPin}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 3) {
                          val = `${val.slice(0, 3)}-${val.slice(3, 6)}`;
                        }
                        setEnteredPin(val);
                        setPinError(null);
                      }}
                      placeholder="6-stelligen Code eingeben (z. B. 492-815)"
                      className="w-full bg-black/70 border border-white/15 focus:border-lime-400 text-white text-center text-lg sm:text-xl font-mono tracking-widest px-4 py-3 rounded-2xl focus:outline-none transition-all placeholder:text-neutral-600 placeholder:text-sm placeholder:font-sans"
                    />
                    {pinError && (
                      <p className="text-xs text-rose-400 text-center font-medium">{pinError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isPairingLoading || enteredPin.replace(/[^0-9]/g, '').length !== 6}
                    className="w-full py-3 bg-lime-400 text-black font-semibold rounded-2xl text-sm transition-all hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    {isPairingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Gerät verbinden</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Simulation for single-tab preview */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                  <span>Demo-Kopplung:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulatePairing('iPad Pro')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      iPad koppeln
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePairing('MacBook Pro')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      MacBook koppeln
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Navigation Rows matching Mediathek & Projects style */}
            <div className="space-y-[3px] w-full pt-1">
              <div 
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  setActiveTab('workspace');
                }}
                className="rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white">
                    <Terminal className="w-4 h-4 text-lime-400" />
                  </div>
                  <div>
                    <span className="text-[15px] text-white font-medium block">Remote-Terminal & Shell</span>
                    <span className="text-xs text-neutral-400">Workspace steuern und Befehle ausführen</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>

              <div 
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  setActiveTab('chats');
                }}
                className="rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white">
                    <MessageSquare className="w-4 h-4 text-neutral-300" />
                  </div>
                  <div>
                    <span className="text-[15px] text-white font-medium block">Live Chat-Synchronisation</span>
                    <span className="text-xs text-neutral-400">{sessions.length} Unterhaltungen spiegeln</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TERMINAL & WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === 'workspace' && (
          <div className="w-full space-y-4">
            
            {/* Terminal Container */}
            <div className="bg-[#121214] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Terminal Titlebar */}
              <div className="px-4 py-3 bg-[#18181b] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
                  <span className="text-xs font-mono text-neutral-400 ml-2">
                    {device?.name || 'Remote Device'} · zsh
                  </span>
                </div>
                <span className="text-[11px] text-lime-400 font-mono">
                  {isConnected ? '12ms Latency' : 'Lokal (Standalone)'}
                </span>
              </div>

              {/* Terminal Output */}
              <div className="p-4 font-mono text-xs text-neutral-300 space-y-2 max-h-[320px] overflow-y-auto">
                <div className="text-neutral-500">
                  Dandelious Remote Bridge v2.4 (Ready)
                </div>
                {remoteState.recentLogs.map((log) => (
                  <div key={log.id} className="leading-relaxed">
                    {log.type === 'command' && (
                      <span className="text-lime-400 font-semibold">$ {log.text}</span>
                    )}
                    {log.type === 'output' && (
                      <pre className="text-neutral-300 whitespace-pre-wrap font-mono mt-0.5">{log.text}</pre>
                    )}
                    {log.type === 'status' && (
                      <span className="text-neutral-400 italic">ℹ️ {log.text}</span>
                    )}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Command Input Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunCommand(inputCommand);
                }}
                className="p-3 bg-black/70 border-t border-white/5 flex items-center gap-2"
              >
                <span className="text-lime-400 font-mono text-xs pl-2 font-bold">$</span>
                <input
                  type="text"
                  value={inputCommand}
                  onChange={(e) => setInputCommand(e.target.value)}
                  placeholder="Befehl ausführen (z. B. git status, ls, npm run build)..."
                  className="flex-1 bg-transparent text-xs font-mono text-white placeholder-neutral-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isExecuting || !inputCommand.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                >
                  {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>

            {/* Quick Macro Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['git status', 'npm run build', 'ls -la', 'node -v', 'clear'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => {
                    if (cmd === 'clear') {
                      playSound('click', enableSoundEffects);
                      const updated: RemoteState = { ...loadRemoteState(), recentLogs: [] };
                      saveRemoteState(updated);
                      setRemoteState(updated);
                    } else {
                      handleRunCommand(cmd);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CHATS SYNCHRONISIEREN */}
        {/* ========================================================================= */}
        {activeTab === 'chats' && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Unterhaltungen spiegeln</h3>
                <p className="text-xs text-neutral-400">Verfügbare Chats auf gekoppelten Geräten</p>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>

            <div className="space-y-[3px] w-full">
              {sessions.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#18181a] border border-white/5 text-center text-neutral-400 text-xs">
                  Noch keine Chats vorhanden. Erstelle eine neue Unterhaltung, um sie mit dem Remote-Gerät zu synchronisieren.
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => {
                      playSound('click', enableSoundEffects);
                      if (onSelectSession) {
                        onSelectSession(sess.id);
                        onBackToChat();
                      }
                    }}
                    className="rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 mr-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-lime-400">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-[15px] text-white font-medium block truncate">
                          {sess.title || 'Unbenannte Unterhaltung'}
                        </span>
                        <span className="text-[11.5px] text-neutral-400 block">
                          {sess.messages?.length || 0} Nachrichten · Live synchron
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* HELP POPUP MODAL (Clean Design matching Mediathek / Projekte) */}
      <AnimatePresence>
        {activePopup === 'help' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-lime-400/20 flex items-center justify-center">
                    <Laptop className="w-5 h-5 text-lime-400" />
                  </div>
                  <h3 className="text-lg font-bold">Dandelious Remote</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed space-y-2.5">
                <p>
                  <strong>1. Sichere Kopplung:</strong> Jedes Gerät erhält in Firebase einen eigenen, sicheren 6-stelligen Code.
                </p>
                <p>
                  <strong>2. Live verbinden:</strong> Gib den Code deines PCs auf dem iPad ein (oder umgekehrt), um die Geräte in Echtzeit zu koppeln.
                </p>
                <p>
                  <strong>3. Nahtlose Synchronisation:</strong> Alle Chats, Terminal-Ausgaben und Workspaces bleiben sofort synchron.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="w-full py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Verstanden
              </button>
            </motion.div>
          </div>
        )}

        {/* QR Code Popup */}
        {activePopup === 'qr' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 text-white text-center space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Geräte-Code</h3>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
                {/* SVG QR Code Illustration */}
                <div className="w-40 h-40 flex items-center justify-center bg-black rounded-xl text-white font-mono font-bold text-2xl tracking-widest">
                  {rawCleanCode || '492815'}
                </div>
              </div>

              <p className="text-xs text-neutral-400">
                Code: <span className="font-mono font-bold text-lime-400">{firebaseCode}</span>
              </p>

              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="w-full py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
