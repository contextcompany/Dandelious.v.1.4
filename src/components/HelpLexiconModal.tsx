import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  X,
  Search,
  BookOpen,
  Sparkles,
  Bot,
  Users,
  Puzzle,
  Video,
  Music,
  Image as ImageIcon,
  Code2,
  Mic,
  Shield,
  Key,
  Folder,
  Layers,
  Database,
  Sliders,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Cpu,
  Terminal,
  FileText,
  Share2,
  Radio,
  FileCheck,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { useDeviceType } from '../utils/useDeviceType';

interface HelpLexiconModalProps {
  isOpen: boolean;
  onClose: () => void;
  enableSound?: boolean;
}

interface LexiconArticle {
  id: string;
  category: 'all' | 'chat' | 'engine' | 'gemini' | 'group' | 'plugins' | 'studios' | 'plus' | 'audio' | 'privacy';
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  details: string[];
  tips: string[];
}

const LEXICON_CATEGORIES = [
  { id: 'all', label: '🌟 Alle Themen' },
  { id: 'chat', label: '💬 Chat & Prompts' },
  { id: 'engine', label: '⚡ Dandelious Engine' },
  { id: 'plugins', label: '🧩 Plugins & Tools' },
  { id: 'studios', label: '🎨 Kreativ-Studios' },
  { id: 'plus', label: '⚡ Plus-Aktionen' },
  { id: 'audio', label: '🎙️ Audio & Live' },
  { id: 'privacy', label: '🔒 Datenschutz & Key' },
];

const LEXICON_ARTICLES: LexiconArticle[] = [
  {
    id: 'dandelious-engine',
    category: 'engine',
    title: 'Dandelious Engine',
    badge: 'Flaggschiff',
    icon: Cpu,
    description: 'Das zentrale, hochmoderne KI-System von Dandelious für blitzschnelle Antworten, logisches Reasoning und multimodale Analyse.',
    details: [
      'Exklusives Backend: Alle Unterhaltungen, Analysen, Codegenerierungen und Zusammenfassungen werden direkt über die moderne Dandelious Engine berechnet.',
      'Kontextfenster: Riesige Speicherkapazität für lange Dokumente, Quelltexte und fortlaufende Konversationshistorien ohne Gedächtnisverlust.',
      'Stufenlose Synthese: Sollte das System temporär Quota-Limits erreichen, sorgt die integrierte Dandelious Synthese-Pipeline für sofortige, unterbrechungsfreie Antworten.'
    ],
    tips: [
      'Trage in den Einstellungen deinen eigenen API-Key ein, um maximale Antwortgeschwindigkeiten und unbegrenzte Quoten zu genießen.',
      'Formuliere komplexe Prompts mit klaren Rollenanweisungen ("Du bist ein Senior Architekt..."), um die Stärken von Dandelious voll auszuschöpfen.'
    ]
  },
  {
    id: 'prompt-input',
    category: 'chat',
    title: 'Prompt-Leiste & Chat-Steuerung',
    badge: 'Grundfunktion',
    icon: Sparkles,
    description: 'Die ergonomische Eingabeleiste für Multiline-Prompts, Sprachbefehle, Tastaturkürzel und Schnellaktionen.',
    details: [
      'Enter zum Senden: Drücke Enter, um deinen Prompt sofort abzusenden.',
      'Shift + Enter: Fügt einen Zeilenumbruch ein, ohne die Nachricht abzusenden – ideal für strukturierte Texte und Codeblöcke.',
      'Automatische Vergrößerung: Bei längeren Texten expandiert das Eingabefeld flüssig in eine geräumige Multiline-Kapsel mit übersichtlichen Buttons.',
      'Spracheingabe: Halte das Mikrofon-Symbol gedrückt oder klicke es an, um per Sprache zu diktieren.'
    ],
    tips: [
      'Nutze Markdown (z.B. **Fett**, Listen mit -, Tabellen oder Codeblöcke ```), um Antworten optimal zu strukturieren.',
      'Über den Pfeil-hoch-Button oder die Historie kannst du vorherige Prompts schnell wieder aufrufen.'
    ]
  },
  {
    id: 'sidebar-navigation',
    category: 'chat',
    title: 'Seitenleiste, Mediathek & Suche',
    badge: 'Navigation',
    icon: Layers,
    description: 'Zentrale Verwaltung aller Unterhaltungen, Projekte, Medien und Werkzeuge in tiefem Schwarz.',
    details: [
      'Neuer Chat: Startet sofort eine frische, unberührte Konversation.',
      'Chats durchsuchen: Kompakter Suchbutton zum blitzschnellen Durchsuchen aller gespeicherten Chats nach Begriffen oder Themen.',
      'Mediathek: Zentrale Ablage aller generierten Bilder, Videos, Audios, Code-Dateien und Dokumente.',
      'Projekte: Erstelle strukturierte Arbeitsbereiche mit eigenen Notizen, Wissensdateien und Chats.',
      '... Weitere Module: Beherbergt Plugins, Videos, Musik, Bilder und Code in einem aufklappbaren Menü.'
    ],
    tips: [
      'Per Rechtsklick oder langem Touch auf einen Chat in der Liste öffnest du das Kontextmenü zum Teilen, Anpinnen, Umbenennen oder Löschen.',
      'Gepinnte Chats verbleiben stets ganz oben in der Liste für den schnellen Zugriff.'
    ]
  },
  {
    id: 'plugins-tools',
    category: 'plugins',
    title: 'Plugins & Live-Werkzeuge',
    badge: 'Erweiterungen',
    icon: Puzzle,
    description: 'Erweitere die KI um Live-Websuche, sichere Code-Ausführung, Rechenzentrum, Mindmaps und interaktive Planer.',
    details: [
      'Google Search Grounding: Live-Suche im Internet für topaktuelle Nachrichten, Wetterdaten, Kursstände und Quellennachweise.',
      'Code Sandbox Runner: Führt HTML, CSS, JavaScript und TypeScript direkt in einem sicheren, isolierten Iframe aus.',
      'Rechenzentrum & Rechner: Präzise mathematische Gleichungen, Statistik- und Einheitenumrechnungen.',
      'Memory Graph Mindmap: Visuelle 2D/3D-Wissenslandkarte, die Erinnerungen und Konzepte interaktiv verknüpft.',
      'Planner: Interaktive Task- & To-Do-Boards mit Meilensteinen und Fortschrittsbalken.',
      'Kochbuch: Maßgeschneiderter Rezept-Generator mit Portionsrechner und Profi-Tipps.'
    ],
    tips: [
      'Plugins lassen sich in den Einstellungen oder direkt über die Seitenleiste unter "... Mehr -> Plugins" verwalten und aktivieren.'
    ]
  },
  {
    id: 'kreativ-studios',
    category: 'studios',
    title: 'Kreativ-Studios (Video, Musik, Bild, Code)',
    badge: 'Generative Medien',
    icon: Video,
    description: 'Vier dedizierte Studios für professionelle Medienproduktion direkt im Browser.',
    details: [
      'Video Studio (Veo 3 Ultra Motion): Erstelle flüssige, hochauflösende KI-Videoclips mit cineastischen Kamerafahrten.',
      'Musik Studio: Synthesizer-Engine für Ambient-Tracks, BGM, Melodien und dynamische Soundtracks.',
      'Bilder Studio: Text-zu-Bild-Generierung mit Prompt-Optimierer, Formatauswahl (1:1, 16:9, 9:16) und interaktiver Bildbearbeitung.',
      'Code Studio: Leistungsfähiger Quellcode-Editor mit Syntax-Highlighting, Live-Vorschau und Download.'
    ],
    tips: [
      'Alle im Studio generierten Werke werden automatisch in deiner Mediathek archiviert und können jederzeit exportiert werden.'
    ]
  },
  {
    id: 'plus-actions-drawer',
    category: 'plus',
    title: 'Plus-Aktionsmenü (+)',
    badge: 'Multimodal',
    icon: FileText,
    description: 'Der bündig angedockte Schnellzugriff für Anhänge, Kamera, Dokumentenerstellung, Canvas Workspace und Deep Research.',
    details: [
      'Fotos & Kamera: Lade Schnappschüsse hoch oder nimm direkt ein Foto auf – die KI analysiert Diagramme, Rechnungen und Objekte.',
      'Dateien anhängen: PDFs, Quelltexte, Tabellen und Dokumente anhängen für tiefgehende Analysen.',
      'Dokument: Erstelle professionell formatierte Konzepte, Exposés und strukturierte Berichte.',
      'Canvas: Zweigeteilter Workspace für paralleles Schreiben und Coden mit Live-Feedback.',
      'Deep Research: Autonome Mehrstufen-Recherche mit Zusammenfassung dutzender Quellen.',
      'Audio transkribieren: Sprache über das Mikrofon in kristallklaren Text umwandeln.'
    ],
    tips: [
      'Klicke auf den Plus-Knopf links neben der Prompt-Leiste, um das Menü aufzurufen. Es dockt bündig und solid schwarz am Boden an.'
    ]
  },
  {
    id: 'audio-live',
    category: 'audio',
    title: 'Gemini Live & Audio-Transkription',
    badge: 'Echtzeit-Sprache',
    icon: Mic,
    description: 'Führe natürliche, flüssige Sprachgespräche mit nativer 24kHz Audioübertragung und Live-Transkription.',
    details: [
      'Live-Modus: Klicke oben rechts auf "Live", um die Freisprech-Konversation zu starten.',
      'Native Audio Pipeline: Höre dem Modell in natürlicher Tonlage zu, ohne Verzögerungen.',
      'Kamera & Bildschirm teilen: Im Live-Modus kannst du deine Webcam oder deinen Desktop freigeben, damit die KI sieht, woran du arbeitest.',
      'Audio Transkription: Verarbeitet Sprachmemos und Sprachaufnahmen zuverlässig in reinen Text.'
    ],
    tips: [
      'Ein Klick auf den runden Audio-Orb pausiert oder beendet die Sprachübertragung sofort.'
    ]
  },
  {
    id: 'api-keys-privacy',
    category: 'privacy',
    title: 'API-Keys, Datenschutz & Backups',
    badge: 'Sicherheit',
    icon: Shield,
    description: 'Volle Kontrolle über deine Daten, eigene API-Schlüssel und vollständige Datensicherungen.',
    details: [
      'Eigener API-Key: Über "API besorgen" oder die Einstellungen kannst du deinen kostenlosen Google AI Studio Key hinterlegen.',
      'Lokale Speicherung & Cloud: Deine Chats werden lokal verschlüsselt gespeichert und optional mit deinem Google-Konto synchronisiert.',
      'JSON Backup: Exportiere alle Unterhaltungen, Einstellungen und Projekte mit einem Klick als Datei und stelle sie jederzeit wieder her.',
      'Kein Telemetrie-Tracking: Dandelious arbeitet ohne störende Tracker oder Werbedienste.'
    ],
    tips: [
      'Erstelle regelmäßig über "Einstellungen -> Backup" eine Sicherheitskopie deiner wichtigsten Chats.'
    ]
  },
  {
    id: 'live-support-system',
    category: 'privacy',
    title: 'Live-Support & Helpdesk',
    badge: 'Kundenservice',
    icon: HelpCircle,
    description: 'Echter, interaktiver Support direkt in den Einstellungen mit Ticket-Tracking und Soforthilfe.',
    details: [
      'Support-Ticket erstellen: Formuliere deine Frage oder Fehlermeldung direkt im Einstellungsmenü unter "Get support".',
      'Echtzeit-Antwort: Unser KI-gestütztes Support-Team antwortet dir umgehend und analysiert Systemdaten.',
      'Ticket-Status: Verfolge den Status deiner Anfrage ("Offen", "In Bearbeitung", "Gelöst") und sieh den Verlauf jederzeit ein.'
    ],
    tips: [
      'Klicke im 3-Punkte-Menü oder in den Einstellungen auf "Hilfe" oder "Feedback", um direkt mit dem Support zu sprechen.'
    ]
  }
];

export const HelpLexiconModal: React.FC<HelpLexiconModalProps> = ({
  isOpen,
  onClose,
  enableSound = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>('gemini-3-8-flash');
  const deviceInfo = useDeviceType();
  const isHandy = (deviceInfo.isMobile && !deviceInfo.isTablet) || (typeof window !== 'undefined' && window.innerWidth < 640);

  const filteredArticles = useMemo(() => {
    return LEXICON_ARTICLES.filter((art) => {
      const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.description.toLowerCase().includes(q) ||
        art.badge.toLowerCase().includes(q) ||
        art.details.some(d => d.toLowerCase().includes(q)) ||
        art.tips.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
            isHandy ? 'p-0 bg-black' : 'p-3 sm:p-6 bg-black/85 backdrop-blur-xs'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              playSound('click', enableSound);
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 14 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className={`w-full bg-black text-white flex flex-col overflow-hidden relative ${
              isHandy
                ? 'h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none'
                : 'max-w-[760px] max-h-[92vh] rounded-[32px] sm:rounded-[36px] border border-white/15 shadow-[0_30px_90px_rgba(0,0,0,0.98)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar Header */}
            <div className={`p-5 sm:p-6 pb-3 border-b border-white/10 shrink-0 ${
              isHandy ? 'pt-[max(env(safe-area-inset-top,0px),16px)]' : ''
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white">
                      <BookOpen className="w-4 h-4 text-white stroke-[2]" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Dandelious Lexikon & Handbuch
                    </h2>
                  </div>
                  <p className="text-xs sm:text-[13px] text-neutral-400">
                    Ausführliche Erklärung aller Funktionen, Modelle, Studios & Werkzeuge
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSound);
                    onClose();
                  }}
                  className="w-9 h-9 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shrink-0"
                  title="Schließen (Esc)"
                >
                  <X className="w-5 h-5 stroke-[2]" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lexikon durchsuchen (z.B. Dandelious Engine, MotionPicture, Veo 3, API-Key)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 text-sm text-white placeholder-neutral-500 rounded-2xl pl-10 pr-4 py-2.5 outline-none border border-white/10 focus:border-white/25 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                  >
                    Löschen
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <LayoutGroup id="help-lexicon-categories">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1">
                  {LEXICON_CATEGORIES.map((cat, idx) => {
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={`hl-cat-${cat.id || idx}-${idx}`}
                        onClick={() => {
                          playSound('click', enableSound);
                          setSelectedCategory(cat.id);
                        }}
                        className={`relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer z-10 ${
                          isActive
                            ? 'text-black font-semibold shadow-sm'
                            : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-white/5'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="helpLexiconActiveCategory"
                            className="absolute inset-0 bg-white rounded-full -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                          />
                        )}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            {/* Content List: Expandable Cards */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-3">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-sm text-neutral-300 font-medium">Keine passenden Einträge gefunden</p>
                  <p className="text-xs text-neutral-500">
                    Versuche es mit einem anderen Begriff oder wähle eine andere Kategorie.
                  </p>
                </div>
              ) : (
                filteredArticles.map((art, idx) => {
                  const isExpanded = expandedArticleId === art.id;
                  const Icon = art.icon;

                  return (
                    <div
                      key={`hl-art-${art.id || idx}-${idx}`}
                      className={`rounded-2xl border transition-all ${
                        isExpanded
                          ? 'bg-neutral-950 border-white/20 shadow-lg'
                          : 'bg-neutral-950/80 hover:bg-neutral-900/90 border-white/10'
                      }`}
                    >
                      {/* Header row */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSound);
                          setExpandedArticleId(isExpanded ? null : art.id);
                        }}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center text-white shrink-0">
                            <Icon className="w-5 h-5 text-white stroke-[1.8]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[15px] font-semibold text-white tracking-tight">
                                {art.title}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-white/10 text-neutral-300">
                                {art.badge}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 truncate mt-0.5">
                              {art.description}
                            </p>
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </button>

                      {/* Expanded Details Body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden px-4 pb-5 pt-1 space-y-4 border-t border-white/10 text-xs sm:text-[13px]"
                          >
                            {/* Summary description */}
                            <p className="text-neutral-200 leading-relaxed font-normal pt-2">
                              {art.description}
                            </p>

                            {/* Details List */}
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                Funktionsweise & Details
                              </h4>
                              <div className="space-y-1.5 pl-1">
                                {art.details.map((detail, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5 text-neutral-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{detail}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Practical Tips */}
                            {art.tips.length > 0 && (
                              <div className="bg-neutral-900/90 rounded-xl p-3.5 border border-white/10 space-y-1.5">
                                <div className="flex items-center gap-2 text-lime-400 font-medium text-xs">
                                  <Lightbulb className="w-3.5 h-3.5 stroke-[2]" />
                                  <span>Profi-Tipp</span>
                                </div>
                                <div className="space-y-1 text-xs text-neutral-300">
                                  {art.tips.map((tip, idx) => (
                                    <p key={idx} className="leading-relaxed">
                                      • {tip}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="p-4 sm:px-6 bg-neutral-950 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                Dandelious v3.4.0 • Dandelious Engine
              </span>
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  onClose();
                }}
                className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-full transition-all cursor-pointer"
              >
                Verstanden
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
