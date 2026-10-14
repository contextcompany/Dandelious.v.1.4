import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  Settings, 
  Search, 
  Lock, 
  Plus, 
  Check, 
  ExternalLink, 
  Share2, 
  Mail, 
  Cloud, 
  Sparkles, 
  ChevronDown, 
  Table, 
  Calendar as CalendarIcon, 
  Github, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  SlidersHorizontal, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  ChevronRight,
  Send,
  Play
} from 'lucide-react';
import { playSound, triggerVibration } from '../utils/sound';
import { 
  signInWithGoogleWorkspace, 
  getGoogleAccessToken, 
  auth 
} from '../lib/firebase';
import { 
  getConnectedPluginsState, 
  saveConnectedPluginState,
  removeConnectedPluginState 
} from '../lib/pluginServices';

export interface PluginItem {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  category: string;
  isGoogle?: boolean;
  popular?: boolean;
  installed?: boolean;
  developer: string;
  version: string;
  interactive?: boolean;
  samplePrompts: string[];
  description: string;
  infoText: string;
}

const PLUGINS_DATA: PluginItem[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    subtitle: 'Posteingang durchsuchen, E-Mails lesen & Entwürfe erstellen',
    icon: 'gmail',
    category: 'Google Workspace',
    isGoogle: true,
    popular: true,
    developer: 'Google / Context',
    version: '0.1.10',
    interactive: true,
    samplePrompts: [
      '@Gmail Fasse die letzten 5 E-Mails zusammen und hebe offene Punkte hervor',
      '@Gmail Entwirf eine höfliche Antwort auf die letzte Anfrage',
      '@Gmail Erstelle eine Aufgabenliste aus dem aktuellen E-Mail-Verlauf'
    ],
    description: 'Verknüpfe Gmail, um deinen Posteingang im Gespräch zusammenzufassen, Antworten zu entwerfen und E-Mail-Threads zu organisieren.',
    infoText: 'Mit der Gmail Integration kann Dandelious deine E-Mails auf deinen ausdrücklichen Wunsch hin auslesen. Deine Daten bleiben stets geschützt und privat.'
  },
  {
    id: 'maps',
    name: 'Google Maps',
    subtitle: 'Interaktive Karten, Ortssuche, Routen & Umgebungen erkunden',
    icon: 'maps',
    category: 'Google Workspace',
    isGoogle: true,
    popular: true,
    developer: 'Google / Context',
    version: '0.1.0',
    interactive: true,
    samplePrompts: [
      '@Maps Zeige mir gute Italienische Restaurants in der Nähe von München',
      '@Maps Finde eine interessante Route von Berlin nach Hamburg',
      '@Maps Zeige mir Sehenswürdigkeiten in Paris auf der interaktiven Karte'
    ],
    description: 'Verknüpfe Google Maps, um Orte zu suchen, interaktive Karten mit Markern anzuzeigen, Routen zu berechnen und Umgebungen zu erkunden.',
    infoText: 'Mit Google Maps kann Dandelious Geodaten verarbeiten, Empfehlungen ausgeben und Karten direkt im Chat-Fenster anzeigen.'
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    subtitle: 'Tabellen erstellen, analysieren und Daten bearbeiten',
    icon: 'sheets',
    category: 'Google Workspace',
    isGoogle: true,
    popular: true,
    developer: 'Google / Context',
    version: '0.1.0',
    interactive: true,
    samplePrompts: [
      '@Sheets Zeige meine aktuellen Google Tabellen aus Google Drive an',
      '@Sheets Erstelle eine neue Tabelle "Projektbudget 2026" mit Kostenaufstellung',
      '@Sheets Lese Daten aus meiner Tabellenkalkulation und berechne Gesamtsummen'
    ],
    description: 'Verknüpfe Google Sheets, um Tabellendaten direkt mit Dandelious auszulesen, neue Kalkulationen zu erstellen und Geschäftsdaten zu analysieren.',
    infoText: 'Mit Google Sheets erhält Dandelious sicheren Zugriff auf deine freigegebenen Tabellen in Google Drive.'
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    subtitle: 'Termine verwalten, Kalender prüfen & Treffen planen',
    icon: 'calendar',
    category: 'Google Workspace',
    isGoogle: true,
    popular: true,
    developer: 'Google / Context',
    version: '0.1.0',
    interactive: true,
    samplePrompts: [
      '@Calendar Zeige meine anstehenden Termine für diese Woche',
      '@Calendar Erstelle einen neuen Termin "Strategie Meeting" für morgen um 10:00 Uhr',
      '@Calendar Prüfe meinen Terminkalender und schlage freie Zeitfenster vor'
    ],
    description: 'Verbinde Google Calendar, um Termine zu planen, deinen Tagesablauf zu prüfen und Kalendereinträge im Gespräch zu verwalten.',
    infoText: 'Dandelious kann auf deinen primären Google-Kalender zugreifen, um Terminkonflikte zu erkennen und Termine eintragen.'
  },
  {
    id: 'github',
    name: 'GitHub',
    subtitle: 'Code Repositories, Pull Requests & Issues verwalten',
    icon: 'github',
    category: 'Entwickler',
    isGoogle: false,
    popular: true,
    developer: 'GitHub / Context',
    version: '0.2.1',
    interactive: true,
    samplePrompts: [
      '@GitHub Zeige meine öffentlichen und privaten Repositories',
      '@GitHub Prüfe offene Pull Requests und kürzlich gemeldete Issues',
      '@GitHub Fasse die Commits der letzten Tage zusammen'
    ],
    description: 'Verbinde dein GitHub-Konto, um Code-Repositories zu durchsuchen, Commits zu analysieren und Pull Requests direkt aus dem Chat zu prüfen.',
    infoText: 'Ermöglicht die schnelle Analyse von Repositories, Issue-Trackern und Pull-Request-Aktivitäten.'
  },
  {
    id: 'onedrive',
    name: 'OneDrive & Cloud',
    subtitle: 'Cloud-Dateien, Dokumente & Backups verwalten',
    icon: 'onedrive',
    category: 'Produktivität',
    isGoogle: false,
    popular: true,
    developer: 'Microsoft / Context',
    version: '0.1.4',
    interactive: true,
    samplePrompts: [
      '@OneDrive Zeige meine zuletzt geänderten Dokumente',
      '@OneDrive Suche nach PDF-Dateien zum Thema Quartalsbericht'
    ],
    description: 'Sicherer Zugriff auf deine Cloud-Dateien zur nahtlosen Verarbeitung in Unterhaltungen.',
    infoText: 'Liest Dokumente auf Anfrage aus, um Inhalte für Zusammenfassungen und Recherchen bereitzustellen.'
  }
];

interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivatePlugin?: (pluginId: string) => void;
  installedPluginIds?: string[];
  enableSound?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({
  isOpen,
  onClose,
  onActivatePlugin,
  installedPluginIds = [],
  enableSound = true,
  onSelectPrompt
}) => {
  const [activeTab, setActiveTab] = useState<'Alle' | 'Google Workspace' | 'Installiert'>('Alle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginItem | null>(null);
  const [connectedPlugins, setConnectedPlugins] = useState<Record<string, boolean>>({});
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getConnectedPluginsState();
      const initialMap: Record<string, boolean> = {};
      Object.keys(stored).forEach(k => {
        if (stored[k]?.connected) initialMap[k] = true;
      });
      (installedPluginIds || []).forEach(id => {
        initialMap[id] = true;
      });
      setConnectedPlugins(initialMap);
    }
  }, [isOpen, installedPluginIds]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 2500);
  };

  const handleToggleInstall = async (plugin: PluginItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('click', enableSound);
    const isCurrentlyInstalled = Boolean(connectedPlugins[plugin.id]);

    if (plugin.isGoogle && !isCurrentlyInstalled) {
      setIsAuthenticating(true);
      try {
        const token = await signInWithGoogleWorkspace();
        if (token) {
          const next = { ...connectedPlugins, [plugin.id]: true };
          setConnectedPlugins(next);
          saveConnectedPluginState(plugin.id, { pluginId: plugin.id, connected: true, connectedAt: Date.now() });
          showToast(`${plugin.name} erfolgreich aktiviert!`);
          playSound('chime', enableSound);
        } else {
          showToast(`Anmeldung für ${plugin.name} abgebrochen`);
        }
      } catch (err) {
        showToast(`Verbindungsfehler bei ${plugin.name}`);
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      const isNext = !isCurrentlyInstalled;
      const next = { ...connectedPlugins, [plugin.id]: isNext };
      setConnectedPlugins(next);
      if (isNext) {
        saveConnectedPluginState(plugin.id, { pluginId: plugin.id, connected: true, connectedAt: Date.now() });
      } else {
        removeConnectedPluginState(plugin.id);
      }
      showToast(isNext ? `${plugin.name} aktiviert` : `${plugin.name} deaktiviert`);
    }
  };

  const handleExecutePrompt = (prompt: string) => {
    playSound('click', enableSound);
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
      onClose();
    } else if (onActivatePlugin && selectedPlugin) {
      onActivatePlugin(selectedPlugin.id);
      onClose();
    }
  };

  const filteredPlugins = PLUGINS_DATA.filter(p => {
    const isInstalled = Boolean(connectedPlugins[p.id]);
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'Installiert') return matchesSearch && isInstalled;
    if (activeTab === 'Google Workspace') return matchesSearch && p.isGoogle;
    return matchesSearch;
  });

  const renderPluginIcon = (icon: string, size = 'w-5 h-5') => {
    switch (icon) {
      case 'gmail':
        return <Mail className={`${size} text-red-400`} />;
      case 'maps':
        return <MapPin className={`${size} text-sky-400`} />;
      case 'sheets':
        return <Table className={`${size} text-emerald-400`} />;
      case 'calendar':
        return <CalendarIcon className={`${size} text-lime-400`} />;
      case 'github':
        return <Github className={`${size} text-white`} />;
      case 'onedrive':
        return <Cloud className={`${size} text-sky-300`} />;
      default:
        return <Sparkles className={`${size} text-[#C5DC57]`} />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif] select-none overflow-x-hidden"
        id="dandelious-plugins-view"
      >
        {/* Toast Notification */}
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-neutral-900/95 backdrop-blur-md text-white text-xs font-medium px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/15 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-[#C5DC57] shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}

        {/* HEADER: Matches Mediathek & Projects 1:1 */}
        <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
          {/* Left: Close / Back Button */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              if (selectedPlugin) {
                setSelectedPlugin(null);
              } else {
                onClose();
              }
            }}
            className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
            title="Schließen"
          >
            {selectedPlugin ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          {/* Center: Segmented Pill Dock matching Mediathek & Projects */}
          <LayoutGroup id="pluginHeaderTabs">
            <div className="bg-neutral-950/30 backdrop-blur-md p-1 rounded-full border border-white/15 flex items-center gap-1 shadow-inner pointer-events-auto">
              {(['Alle', 'Google Workspace', 'Installiert'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const installedCount = Object.values(connectedPlugins).filter(Boolean).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      playSound('click', enableSound);
                      setActiveTab(tab);
                      setSelectedPlugin(null);
                    }}
                    className={`relative px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                      isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="pluginHeaderTabPill"
                        className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span>
                      {tab}
                      {tab === 'Installiert' && installedCount > 0 ? ` (${installedCount})` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          {/* Right: Help Button */}
          <button
            type="button"
            onClick={() => {
              playSound('click', enableSound);
              setShowHelp(true);
            }}
            className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
            title="Plugin Info"
          >
            <HelpCircle className="w-5 h-5 stroke-[1.8]" />
          </button>
        </header>

        {/* MAIN BODY: Matches Mediathek & Projects Capsule Layout */}
        <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 pb-20 flex-1 flex flex-col items-center">
          {!selectedPlugin ? (
            /* ================= VIEW 1: PLUGINS LIST ================= */
            <div className="w-full space-y-4">
              {/* Search Bar matching Projects / Mediathek */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Plugins & Cloud-Tools durchsuchen..."
                  className="w-full bg-[#1c1c1e] sm:bg-[#202022] border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5DC57] transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Capsule Rows matching Mediathek categories */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
                className="space-y-[3px] w-full"
              >
                {filteredPlugins.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-[#1c1c1e] text-center text-neutral-400 text-xs mt-4">
                    Keine Plugins für diese Filterung gefunden.
                  </div>
                ) : (
                  filteredPlugins.map((plugin) => {
                    const isInstalled = Boolean(connectedPlugins[plugin.id]);
                    return (
                      <motion.div
                        key={plugin.id}
                        variants={{
                          hidden: { opacity: 0, y: 14, scale: 0.98 },
                          visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } }
                        }}
                        whileHover={{ scale: 1.015, x: 3, backgroundColor: '#2c2c2e' }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          playSound('click', enableSound);
                          setSelectedPlugin(plugin);
                        }}
                        className="rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 mr-2">
                          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            {renderPluginIcon(plugin.icon, "w-4 h-4")}
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-[14.5px] text-white font-medium block truncate">
                                {plugin.name}
                              </span>
                              {plugin.isGoogle && (
                                <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 font-semibold">
                                  Google
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-neutral-400 block truncate">
                              {plugin.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isInstalled ? (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Aktiv</span>
                            </span>
                          ) : (
                            <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
                              Details
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </div>
          ) : (
            /* ================= VIEW 2: PLUGIN DETAIL VIEW ================= */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full space-y-4"
            >
              {/* Header Card */}
              <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-3xl p-6 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                      {renderPluginIcon(selectedPlugin.icon, "w-7 h-7")}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{selectedPlugin.name}</span>
                        {selectedPlugin.isGoogle && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                            Verified
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {selectedPlugin.developer} · v{selectedPlugin.version}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleInstall(selectedPlugin, e)}
                    disabled={isAuthenticating}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-md ${
                      connectedPlugins[selectedPlugin.id]
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                        : 'bg-[#C5DC57] text-black hover:brightness-110'
                    }`}
                  >
                    {isAuthenticating ? 'Verbinde...' : connectedPlugins[selectedPlugin.id] ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>

                <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed pt-1">
                  {selectedPlugin.description}
                </p>

                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 text-[11.5px] text-neutral-400 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{selectedPlugin.infoText}</span>
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-2">
                  Beispiel-Befehle im Chat
                </h3>
                <div className="space-y-[3px]">
                  {selectedPlugin.samplePrompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleExecutePrompt(prompt)}
                      className="rounded-2xl px-4 py-3 bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 mr-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5DC57] shrink-0" />
                        <span className="text-xs text-neutral-200 group-hover:text-white font-mono truncate">
                          {prompt}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#C5DC57] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Ausführen</span>
                        <Send className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </main>

        {/* HELP MODAL */}
        <AnimatePresence>
          {showHelp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#C5DC57]/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#C5DC57]" />
                    </div>
                    <h3 className="text-lg font-bold">Dandelious Plugins</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed space-y-2.5">
                  <p>
                    <strong>Google Workspace:</strong> Nutze Gmail, Google Maps, Google Sheets und Google Calendar direkt im Chat via @Mention (z. B. <code>@Gmail Suche E-Mails</code>).
                  </p>
                  <p>
                    <strong>Entwickler-Tools:</strong> Verbinde GitHub und Cloud-Dienste für automatische Code- und Repository-Analysen.
                  </p>
                  <p>
                    <strong>Privatsphäre:</strong> Dandelious greift ausschließlich auf die freigegebenen Daten zu, die du ausdrücklich anfragst.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="w-full py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Verstanden
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
