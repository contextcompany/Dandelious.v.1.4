import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Code2,
  Folder,
  FileCode,
  Sparkles,
  Terminal,
  Layers,
  Cpu,
  ChevronRight,
  Plus,
  X,
  ArrowLeft,
  ArrowUpRight,
  MoreHorizontal,
  Trash2,
  Copy,
  Check,
  Download,
  HelpCircle,
  Play,
  Eye,
  RefreshCw,
  Search,
  Braces,
  Edit2,
  Edit3,
  MessageSquare,
  ArrowUp,
  FileUp,
  ExternalLink,
  Laptop,
  CheckCheck,
  Mic
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { DandeliousLogo } from './DandeliousLogo';
import { openHelpLexikon } from '../utils/openHelp';

export interface CodebaseFile {
  id: string;
  name: string;
  language: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CodebaseMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeBlocks?: { language: string; code: string; filename?: string }[];
  timestamp: number;
}

export interface Codebase {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  files: CodebaseFile[];
  messages: CodebaseMessage[];
}

interface DiceStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

const STORAGE_KEY = 'saphire_codebases_v1';

const DEFAULT_CODEBASES: Codebase[] = [
  {
    id: 'codebase-1',
    name: 'Codebase 1',
    icon: 'terminal',
    description: 'Erste Codebase mit UI-Komponenten und Backend-Logik.',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    files: [
      {
        id: 'file-1',
        name: 'App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 max-w-md mx-auto rounded-3xl bg-neutral-900 border border-white/10 text-white text-center shadow-2xl">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Dandelious Codebase</h1>
      <p className="text-sm text-neutral-400 mb-6">Interaktive Komponente direkt im Code-Workspace.</p>
      <button
        onClick={() => setCount(c => c + 1)}
        className="px-6 py-2.5 rounded-full bg-[#2563eb] text-white font-semibold text-xs transition-transform active:scale-95 cursor-pointer shadow-lg shadow-blue-600/20"
      >
        Geklickt: {count}x
      </button>
    </div>
  );
}`,
        createdAt: Date.now() - 3600000 * 24,
        updatedAt: Date.now() - 3600000 * 24
      },
      {
        id: 'file-2',
        name: 'api.ts',
        language: 'typescript',
        content: `export async function fetchUserData(userId: string) {
  const res = await fetch(\`/api/users/\${userId}\`);
  if (!res.ok) throw new Error('Benutzerdaten konnten nicht geladen werden');
  return res.json();
}`,
        createdAt: Date.now() - 3600000 * 18,
        updatedAt: Date.now() - 3600000 * 18
      }
    ],
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Erstelle eine saubere App.tsx Hauptkomponente mit Zähler-Funktion.',
        timestamp: Date.now() - 3600000 * 24
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Ich habe die Komponente `App.tsx` für dich erstellt und direkt unter „Code“ gespeichert!',
        codeBlocks: [
          {
            filename: 'App.tsx',
            language: 'typescript',
            code: `export default function App() { /* Siehe App.tsx in Code */ }`
          }
        ],
        timestamp: Date.now() - 3600000 * 24
      }
    ]
  }
];

export const DiceStudio: React.FC<DiceStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar,
  isMobile = false
}) => {
  // Persistence state
  const [codebases, setCodebases] = useState<Codebase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CODEBASES;
  });

  // Navigation / View states
  const [selectedCodebase, setSelectedCodebase] = useState<Codebase | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'programmieren' | 'code'>('programmieren');
  const [activePopup, setActivePopup] = useState<'codebases' | null>(null);
  const [isCreatingCodebase, setIsCreatingCodebase] = useState(false);
  const [codebaseNameInput, setCodebaseNameInput] = useState('');
  const [codebaseIconKey, setCodebaseIconKey] = useState('terminal');

  // Programming Prompt Bar State
  const [programmingPrompt, setProgrammingPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // File Viewer & Editor Modal
  const [viewingFile, setViewingFile] = useState<CodebaseFile | null>(null);
  const [isAddingFileModal, setIsAddingFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('typescript');
  const [newFileContent, setNewFileContent] = useState('');

  // 3-Dots Action Menu Target
  const [itemMenuTarget, setItemMenuTarget] = useState<{
    item: Codebase;
    rect: { top: number; left: number; right: number; bottom: number };
  } | null>(null);

  // Help Modal & Toast
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(codebases));
    } catch (e) {}
  }, [codebases]);

  // Sync selectedCodebase with codebases array
  useEffect(() => {
    if (selectedCodebase) {
      const fresh = codebases.find(c => c.id === selectedCodebase.id);
      if (fresh && fresh !== selectedCodebase) {
        setSelectedCodebase(fresh);
      }
    }
  }, [codebases]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeDetailTab === 'programmieren') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedCodebase?.messages, activeDetailTab]);

  // Create Codebase (like Project in Projects.tsx)
  const handleConfirmCreateCodebase = () => {
    playSound('click', settings.enableSoundEffects ?? true);
    const name = codebaseNameInput.trim() || `Codebase ${codebases.length + 1}`;
    const newCb: Codebase = {
      id: `codebase-${Date.now()}`,
      name,
      icon: codebaseIconKey,
      description: 'Code-Projekt & Entwicklungsbereich',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: [],
      messages: []
    };

    setCodebases(prev => [newCb, ...prev]);
    setSelectedCodebase(newCb);
    setIsCreatingCodebase(false);
    setCodebaseNameInput('');
    showToast(`„${name}“ erfolgreich erstellt!`);
  };

  // Delete Codebase
  const handleDeleteCodebase = (id: string) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setCodebases(prev => prev.filter(c => c.id !== id));
    if (selectedCodebase?.id === id) setSelectedCodebase(null);
    setItemMenuTarget(null);
    showToast('Codebase gelöscht');
  };

  // Send Programming Prompt in "Programmieren"
  const handleSendProgrammingPrompt = async () => {
    if (!programmingPrompt.trim() || isGenerating || !selectedCodebase) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const userText = programmingPrompt.trim();
    setProgrammingPrompt('');
    setIsGenerating(true);

    const userMsg: CodebaseMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };

    const currentFiles = selectedCodebase.files || [];
    const filesContext = currentFiles.length > 0
      ? `Aktuell vorhandene Dateien in dieser Codebase:\n` +
        currentFiles.map(f => `--- ${f.name} (${f.language}) ---\n${f.content.slice(0, 1500)}`).join('\n\n')
      : `Noch keine Dateien in dieser Codebase.`;

    // Optimistically update messages
    const updatedMessages = [...(selectedCodebase.messages || []), userMsg];
    const updatedCb = { ...selectedCodebase, messages: updatedMessages, updatedAt: Date.now() };
    setSelectedCodebase(updatedCb);
    setCodebases(prev => prev.map(c => c.id === updatedCb.id ? updatedCb : c));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Du bist die Dandelious Code Engine. Du bist in der Codebase "${selectedCodebase.name}".
${filesContext}

Aufgabe: Antworte präzise auf die Programmieranweisung des Entwicklers. Wenn du Code generierst oder änderst, gib den Dateinamen (z.B. \`App.tsx\`, \`index.html\`, \`server.ts\`, \`style.css\`) an und formatiere den Code in sauberen Markdown Codeblöcken mit Angabe der Sprache.
Erkläre kurz, was du gebaut hast.`
            },
            ...updatedMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.text || data.content || 'Code wurde generiert.';

        // Extract code blocks to automatically add or update files
        const codeBlockRegex = /```([a-zA-Z0-9_\-\.]+)?\n([\s\S]*?)```/g;
        let match;
        const newFiles = [...currentFiles];
        const extractedBlocks: { language: string; code: string; filename?: string }[] = [];

        while ((match = codeBlockRegex.exec(replyText)) !== null) {
          const lang = (match[1] || 'typescript').toLowerCase();
          const codeBody = match[2].trim();

          // Try to guess or derive filename
          let guessedName = '';
          if (lang.includes('.')) {
            guessedName = lang;
          } else {
            const ext = lang === 'typescript' ? 'ts' : lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : lang === 'sql' ? 'sql' : 'ts';
            guessedName = `file_${newFiles.length + 1}.${ext}`;
          }

          extractedBlocks.push({
            language: lang,
            code: codeBody,
            filename: guessedName
          });

          // Check if file already exists
          const existingIdx = newFiles.findIndex(f => f.name.toLowerCase() === guessedName.toLowerCase());
          if (existingIdx >= 0) {
            newFiles[existingIdx] = {
              ...newFiles[existingIdx],
              content: codeBody,
              updatedAt: Date.now()
            };
          } else {
            newFiles.push({
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: guessedName,
              language: lang.replace(/[^a-z]/g, ''),
              content: codeBody,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        }

        const assistantMsg: CodebaseMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: replyText,
          codeBlocks: extractedBlocks,
          timestamp: Date.now()
        };

        const finalCb = {
          ...updatedCb,
          files: newFiles,
          messages: [...updatedMessages, assistantMsg],
          updatedAt: Date.now()
        };

        setSelectedCodebase(finalCb);
        setCodebases(prev => prev.map(c => c.id === finalCb.id ? finalCb : c));
        if (extractedBlocks.length > 0) {
          showToast(`${extractedBlocks.length} Datei(en) unter „Code“ aktualisiert!`);
        }
      }
    } catch (e) {
      console.error('Programming prompt error:', e);
      showToast('Fehler bei der Codegenerierung');
    } finally {
      setIsGenerating(false);
    }
  };

  // Add / Save manual file in "Code" tab
  const handleSaveManualFile = () => {
    if (!newFileName.trim() || !selectedCodebase) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const file: CodebaseFile = {
      id: `file-${Date.now()}`,
      name: newFileName.trim(),
      language: newFileLang,
      content: newFileContent || `// ${newFileName}\n\n`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedCb = {
      ...selectedCodebase,
      files: [file, ...(selectedCodebase.files || [])],
      updatedAt: Date.now()
    };

    setSelectedCodebase(updatedCb);
    setCodebases(prev => prev.map(c => c.id === updatedCb.id ? updatedCb : c));
    setIsAddingFileModal(false);
    setNewFileName('');
    setNewFileContent('');
    showToast(`„${file.name}“ hinzugefügt`);
  };

  // Delete file from "Code" tab
  const handleDeleteFile = (fileId: string) => {
    if (!selectedCodebase) return;
    playSound('click', settings.enableSoundEffects ?? true);
    const updatedCb = {
      ...selectedCodebase,
      files: selectedCodebase.files.filter(f => f.id !== fileId),
      updatedAt: Date.now()
    };
    setSelectedCodebase(updatedCb);
    setCodebases(prev => prev.map(c => c.id === updatedCb.id ? updatedCb : c));
    if (viewingFile?.id === fileId) setViewingFile(null);
    showToast('Datei gelöscht');
  };

  // Upload local file to Codebase
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCodebase) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const langMap: Record<string, string> = {
          ts: 'typescript',
          tsx: 'typescript',
          js: 'javascript',
          jsx: 'javascript',
          py: 'python',
          html: 'html',
          css: 'css',
          sql: 'sql',
          json: 'json',
          sh: 'bash'
        };

        const newFile: CodebaseFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          language: langMap[ext] || ext,
          content: text,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        setSelectedCodebase(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            files: [newFile, ...(prev.files || [])],
            updatedAt: Date.now()
          };
          setCodebases(all => all.map(c => c.id === updated.id ? updated : c));
          return updated;
        });
        showToast(`„${file.name}“ hochgeladen!`);
      };
      reader.readAsText(file);
    });
  };

  return (
    <div
      className="relative flex flex-col w-full h-full h-[100dvh] bg-black text-white select-none overflow-hidden font-['Plus_Jakarta_Sans']"
      id="dandelious-code-view"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-lime-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept=".ts,.tsx,.js,.jsx,.py,.html,.css,.sql,.json,.sh,.md,.txt"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* VIEW 1: CODEBASE LIST OVERVIEW (Exactly matching Projects.tsx) */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {!selectedCodebase && (
          <motion.div
            key="codebases-overview-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex-1 flex flex-col justify-between relative bg-black select-none"
          >
            {/* Top Header - Links Seitenleisten-Knopf wie bei Mediathek & Projekte, Rechts Fragezeichen */}
            <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  if (onToggleSidebar) onToggleSidebar();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
                title="Menü"
              >
                <span className="w-4 h-[2px] bg-white rounded-full" />
                <span className="w-4 h-[2px] bg-white rounded-full" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  openHelpLexikon();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
                title="Hilfe & Anleitung"
              >
                <HelpCircle className="w-5 h-5 stroke-[1.8]" />
              </button>
            </header>

            {/* Oben positioniert wie bei Projekten & Mediathek */}
            <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-12 flex-1 flex flex-col items-center">
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                dragSnapToOrigin
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                className="w-full space-y-3 sm:space-y-3.5"
              >
                {/* 1. REIHE: CODEBASE BUTTON + SEPARATER PLUS BUTTON (wie Projekt in Projects.tsx) */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } }
                  }}
                  className="flex items-center gap-2.5 sm:gap-3 w-full"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015, x: 3, backgroundColor: '#2c2c2e' }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setActivePopup('codebases');
                    }}
                    className="flex-1 min-w-0 bg-[#242426] rounded-full px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-white/5"
                    id="code-btn-codebase"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 mr-2">
                      <Code2 className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                      <span className="text-[15px] font-normal text-white truncate">Codebase</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.06, backgroundColor: '#2c2c2e' }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setIsCreatingCodebase(true);
                    }}
                    className="w-12 h-12 rounded-full bg-[#242426] border border-white/5 flex items-center justify-center text-white cursor-pointer shrink-0 shadow-sm"
                    title="Neue Codebase erstellen"
                    id="code-btn-add-codebase"
                  >
                    <Plus className="w-5 h-5 stroke-[2]" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* CODEBASES POPUP MODAL (Öffnet beim Klick auf "Codebase") */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePopup === 'codebases' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setActivePopup(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-[500px] sm:max-w-[540px] max-h-[92%] h-[680px] rounded-[32px] sm:rounded-[36px] bg-[#000000] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)] text-white flex flex-col overflow-hidden"
            >
              {/* Schließen-Button */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setActivePopup(null);
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-md transition-all active:scale-95"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <Code2 className="w-5 h-5 text-white stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Codebases</h3>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Wähle eine Codebase aus oder erstelle eine neue
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-2.5 flex-1 max-h-[60vh]">
                {codebases.length > 0 ? (
                  codebases.map((cb, cIdx) => (
                    <div key={`codebase-item-${cb.id || cIdx}-${cIdx}`} className="flex items-center gap-2.5 w-full group">
                      <div
                        onClick={() => {
                          playSound('click', settings.enableSoundEffects ?? true);
                          setSelectedCodebase(cb);
                          setActivePopup(null);
                        }}
                        className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                          <Terminal className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white truncate">{cb.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-neutral-400 border border-white/5">
                            {cb.files?.length || 0} Dateien
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click', settings.enableSoundEffects ?? true);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setItemMenuTarget({
                            item: cb,
                            rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
                          });
                        }}
                        className="w-12 h-12 rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                        title="Optionen"
                      >
                        <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <Code2 className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-medium text-white">Noch keine Codebases</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-[220px]">
                      Tippe auf das Plus (+) neben „Codebase“, um deine erste Codebase anzulegen.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VIEW 2: CODEBASE DETAIL VIEW (Matches Projects Detail View!) */}
      {/* Tabs: "Programmieren" (statt Chats) & "Code" (statt Quellen) */}
      {/* ========================================================================= */}
      {selectedCodebase && !isCreatingCodebase && (
        <motion.div
          key={`codebase-detail-${selectedCodebase.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="w-full h-full flex flex-col relative select-none"
        >
          {/* Top Header: Links Seitenleiste & Pfeil, Mitte Name der Codebase, Rechts Fragezeichen */}
          <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  if (onToggleSidebar) onToggleSidebar();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
                title="Menü"
              >
                <span className="w-4 h-[2px] bg-white rounded-full" />
                <span className="w-4 h-[2px] bg-white rounded-full" />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setSelectedCodebase(null);
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center text-white transition-all cursor-pointer shadow-md active:scale-95"
                title="Zurück zu Codebases"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* In der Mitte: Name der Codebase (z.B. "Codebase 1") */}
            <div className="flex-1 min-w-0 px-2 text-center">
              <h1 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight truncate">
                {selectedCodebase.name}
              </h1>
            </div>

            {/* Rechts: Fragezeichenknopf */}
            <button
              type="button"
              onClick={() => {
                playSound('click', settings.enableSoundEffects ?? true);
                openHelpLexikon();
              }}
              className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
              title="Hilfe & Anleitung"
            >
              <HelpCircle className="w-5 h-5 stroke-[1.8]" />
            </button>
          </header>

          {/* TAB-LEISTE: "Programmieren" (statt Chats) & "Code" (statt Quellen) */}
          <div className="flex items-center justify-center gap-2.5 max-w-xl mx-auto w-full px-4 sm:px-6 pt-2 pb-4 shrink-0">
            {(['programmieren', 'code'] as const).map((tab) => {
              const isActive = activeDetailTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setActiveDetailTab(tab);
                  }}
                  className={`relative flex-1 py-2.5 sm:py-3 rounded-full font-semibold text-[15px] transition-colors cursor-pointer text-center z-10 ${
                    isActive ? 'text-black' : 'text-neutral-300 hover:text-white bg-[#242426] hover:bg-[#2c2c2e]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="codebaseDetailActiveTab"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span>{tab === 'programmieren' ? 'Programmieren' : 'Code'}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: "PROGRAMMIEREN" (Mit Promptzeile unten!) */}
          {/* ========================================================================= */}
          {activeDetailTab === 'programmieren' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden max-w-xl mx-auto w-full">
              
              {/* Nachrichten / Programmierverlauf */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4 no-scrollbar pb-4">
                {(!selectedCodebase.messages || selectedCodebase.messages.length === 0) ? (
                  <div className="py-14 sm:py-16 flex flex-col items-center justify-center text-center relative px-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

                    <div className="relative group mb-4">
                      <div className="absolute inset-0 rounded-3xl bg-blue-600/35 blur-2xl group-hover:bg-blue-500/50 transition-all pointer-events-none" />
                      <DandeliousLogo className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl relative z-10" variant="badge" />
                    </div>

                    <h2 className="text-[22px] sm:text-[26px] font-semibold text-white/95 tracking-tight leading-snug">
                      {selectedCodebase.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xs leading-relaxed">
                      Gib unten in der Promptzeile ein, was du programmieren möchtest. Der Code wird hier generiert und automatisch unter „Code“ abgelegt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 w-full pt-2">
                    {selectedCodebase.messages.map((msg, mIdx) => (
                      <div
                        key={`codebase-msg-${msg.id || mIdx}-${mIdx}`}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[88%] sm:max-w-[80%] rounded-[24px] px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-white text-black font-medium'
                              : 'bg-[#1c1c1e] text-neutral-200 border border-white/10'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          {/* Render code blocks with "Unter 'Code' ansehen" button */}
                          {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                              {msg.codeBlocks.map((blk, bIdx) => (
                                <div key={bIdx} className="bg-black/60 rounded-xl p-2.5 border border-white/10 font-mono text-xs">
                                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                                    <span className="text-[#3b82f6] font-semibold">{blk.filename || 'Code'}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playSound('click', settings.enableSoundEffects ?? true);
                                        setActiveDetailTab('code');
                                      }}
                                      className="text-xs text-neutral-300 hover:text-white underline cursor-pointer"
                                    >
                                      In „Code“ öffnen →
                                    </button>
                                  </div>
                                  <pre className="text-neutral-300 truncate max-h-24 overflow-hidden">
                                    {blk.code.slice(0, 150)}...
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* UNTEN: PROMPTZEILE (Design einer normalen Dandeliousleiste) */}
              <div className="p-3 sm:px-6 pb-5 shrink-0 w-full max-w-2xl mx-auto">
                <div
                  className="relative flex items-center bg-black/95 sm:bg-black rounded-full border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.95)] px-2.5 py-1.5 gap-2 select-none focus-within:border-white/30 transition-all"
                >
                  {/* Plus Icon Button on Left */}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Code-Datei anhängen (+)"
                  >
                    <Plus className="w-5 h-5 stroke-[2]" />
                  </button>

                  <input
                    type="text"
                    value={programmingPrompt}
                    onChange={(e) => setProgrammingPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (programmingPrompt.trim() && !isGenerating) {
                          handleSendProgrammingPrompt();
                        }
                      }
                    }}
                    placeholder={isGenerating ? "Dandelious generiert Code..." : "Frag Dandelious oder Code schreiben..."}
                    className="flex-1 bg-transparent text-[16px] sm:text-[17px] text-white placeholder-neutral-400/80 focus:outline-none px-2 min-w-0 font-normal leading-normal"
                    disabled={isGenerating}
                  />

                  {/* Right Actions: Voice Mic + Dandelious Signature Send Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', settings.enableSoundEffects ?? true);
                        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                          try {
                            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            const rec = new SpeechRec();
                            rec.lang = 'de-DE';
                            rec.onresult = (evt: any) => {
                              const transcript = evt.results[0][0].transcript;
                              setProgrammingPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
                            };
                            rec.start();
                          } catch (e) {
                            console.warn('Speech rec error:', e);
                          }
                        }
                      }}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
                      title="Spracheingabe"
                    >
                      <Mic className="w-5 h-5 stroke-[1.8]" />
                    </button>

                    {isGenerating ? (
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#3b82f6]" />
                      </div>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          if (programmingPrompt.trim() && !isGenerating) {
                            handleSendProgrammingPrompt();
                          }
                        }}
                        disabled={!programmingPrompt.trim()}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.8)] ${
                          programmingPrompt.trim()
                            ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer'
                            : 'bg-white/10 text-neutral-500 cursor-not-allowed'
                        }`}
                        title="Absenden (Enter)"
                      >
                        <ArrowUp className="w-5.5 h-5.5 stroke-[2.8]" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: "CODE" (Dort ist der Code abgespeichert, genau wie Quellen!) */}
          {/* ========================================================================= */}
          {activeDetailTab === 'code' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden max-w-xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-2.5 no-scrollbar pb-4">
                {(!selectedCodebase.files || selectedCodebase.files.length === 0) ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <FileCode className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-medium text-white">Noch kein Code vorhanden</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                      Verwende den Tab „Programmieren“ oder tippe unten auf „Code hinzufügen“, um Skripte und Dateien abzulegen.
                    </p>
                  </div>
                ) : (
                  selectedCodebase.files.map((file, fIdx) => (
                    <div
                      key={`file-${file.id || fIdx}-${fIdx}`}
                      className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full"
                    >
                      <div
                        onClick={() => {
                          playSound('click', settings.enableSoundEffects ?? true);
                          setViewingFile(file);
                        }}
                        className="flex items-center gap-3.5 min-w-0 mr-2 flex-1 cursor-pointer"
                      >
                        <FileCode className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[15px] font-normal text-white truncate font-mono">{file.name}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-black/40 text-neutral-400 border border-white/5 shrink-0">
                            {file.language}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click', settings.enableSoundEffects ?? true);
                            setViewingFile(file);
                          }}
                          className="p-1.5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
                          title="Öffnen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click', settings.enableSoundEffects ?? true);
                            navigator.clipboard.writeText(file.content);
                            showToast('Code kopiert');
                          }}
                          className="p-1.5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
                          title="Kopieren"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-[#8e8e93] hover:text-red-400 transition-colors cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Unten: Code hinzufügen Button (wie Quelle hinzufügen in Projects!) */}
              <div className="p-4 sm:px-6 pb-8 shrink-0 w-full flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsAddingFileModal(true);
                  }}
                  className="flex-1 py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-black stroke-[2.5]" />
                  <span>Code hinzufügen</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/10 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                  title="Datei hochladen"
                >
                  <FileUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: NEUE CODEBASE ERSTELLEN (Swipe-to-Create exakt wie Projects.tsx!) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreatingCodebase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col justify-between text-white select-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 z-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setIsCreatingCodebase(false);
                }}
                className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h2 className="text-[18px] sm:text-[19px] font-semibold text-white tracking-tight">
                Neue Codebase
              </h2>

              <div className="w-10" />
            </div>

            {/* Main Center Area with Swipe-to-Open Light-Grey Rounded Pill */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-lg mx-auto w-full z-10 -mt-10">
              <div className="w-full space-y-4">
                
                {/* Swipeable Pill */}
                <div className="relative w-full">
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 240 }}
                    dragElastic={0.25}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x > 35 || info.velocity.x > 80) {
                        handleConfirmCreateCodebase();
                      }
                    }}
                    className="w-full rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white shadow-2xl flex items-center px-3.5 py-3 sm:py-3.5 relative select-none touch-none border border-white/10 cursor-grab active:cursor-grabbing"
                  >
                    {/* Icon Button */}
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-neutral-200 shrink-0 mr-2.5">
                      <Code2 className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    {/* Text Field Input */}
                    <input
                      type="text"
                      value={codebaseNameInput}
                      onChange={(e) => setCodebaseNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreateCodebase()}
                      placeholder="Codebase 1..."
                      className="flex-1 bg-transparent text-sm sm:text-base font-medium text-white placeholder-neutral-500 focus:outline-none min-w-0"
                    />

                    {/* Swipe Indicator Text */}
                    <div className="flex items-center gap-1 pl-2 text-xs text-neutral-400 font-medium shrink-0">
                      <span>Wischen</span>
                      <ChevronRight className="w-4 h-4 stroke-[2]" />
                    </div>
                  </motion.div>
                </div>

                <p className="text-center text-xs text-neutral-500">
                  Tippe einen Namen ein und wische die Leiste nach rechts, um die Codebase zu öffnen.
                </p>

              </div>
            </div>

            {/* Bottom Button Fallback */}
            <div className="p-4 sm:px-6 pb-8 shrink-0 max-w-lg mx-auto w-full">
              <button
                type="button"
                onClick={handleConfirmCreateCodebase}
                className="w-full py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-black stroke-[2.5]" />
                <span>Codebase anlegen</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: CODE-DATEI ANSEHEN & EDITIEREN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {viewingFile && selectedCodebase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              onClick={() => setViewingFile(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-2xl h-[85vh] bg-[#0c0d12] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden text-white font-mono"
            >
              {/* Header */}
              <div className="h-14 border-b border-white/10 px-5 flex items-center justify-between shrink-0 bg-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode className="w-5 h-5 text-[#3b82f6]" />
                  <span className="font-semibold text-sm truncate">{viewingFile.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-neutral-400 uppercase">
                    {viewingFile.language}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      navigator.clipboard.writeText(viewingFile.content);
                      showToast('Code kopiert');
                    }}
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Kopieren"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingFile(null)}
                    className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Schließen"
                  >
                    <X className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Editor / Textarea */}
              <textarea
                value={viewingFile.content}
                onChange={(e) => {
                  const updatedContent = e.target.value;
                  const updatedFile = { ...viewingFile, content: updatedContent, updatedAt: Date.now() };
                  setViewingFile(updatedFile);
                  const updatedCb = {
                    ...selectedCodebase,
                    files: selectedCodebase.files.map(f => f.id === updatedFile.id ? updatedFile : f),
                    updatedAt: Date.now()
                  };
                  setSelectedCodebase(updatedCb);
                  setCodebases(all => all.map(c => c.id === updatedCb.id ? updatedCb : c));
                }}
                spellCheck={false}
                className="flex-1 w-full p-5 bg-transparent text-xs sm:text-sm font-mono text-lime-100 focus:outline-none resize-none leading-relaxed selection:bg-lime-400/30 selection:text-white"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: NEUE CODE-DATEI ERSTELLEN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddingFileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsAddingFileModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold">Code-Datei hinzufügen</h3>
                <button
                  type="button"
                  onClick={() => setIsAddingFileModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Dateiname</label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="z.B. Button.tsx oder script.py"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Sprache</label>
                  <select
                    value={newFileLang}
                    onChange={(e) => setNewFileLang(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="typescript">TypeScript (.ts / .tsx)</option>
                    <option value="javascript">JavaScript (.js / .jsx)</option>
                    <option value="python">Python (.py)</option>
                    <option value="html">HTML (.html)</option>
                    <option value="css">CSS (.css)</option>
                    <option value="sql">SQL (.sql)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="bash">Bash / Shell (.sh)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">Code / Inhalt (Optional)</label>
                  <textarea
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    placeholder="// Schreibe oder füge deinen Code hier ein..."
                    rows={6}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveManualFile}
                disabled={!newFileName.trim()}
                className="w-full py-3.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all disabled:opacity-40 cursor-pointer"
              >
                Datei speichern
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3-PUNKTE ACTION POPUP FÜR CODEBASES (Öffnen & Löschen) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {itemMenuTarget && (
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] select-none"
            onClick={() => setItemMenuTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[85] w-48 sm:w-52 bg-[#1c1c1e] border border-white/15 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-sm select-none flex flex-col gap-0.5"
              style={{
                top: Math.min(itemMenuTarget.rect.bottom + 6, window.innerHeight - 150),
                left: Math.max(12, Math.min(itemMenuTarget.rect.left - 140, window.innerWidth - 220))
              }}
            >
              {/* 1. Öffnen */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setSelectedCodebase(itemMenuTarget.item);
                  setActivePopup(null);
                  setItemMenuTarget(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                <span className="text-[14px]">Öffnen</span>
              </button>

              {/* 2. Löschen */}
              <button
                type="button"
                onClick={() => handleDeleteCodebase(itemMenuTarget.item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-normal cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[1.8] shrink-0" />
                <span className="text-[14px]">Löschen</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* HILFE & ANLEITUNG MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setIsHelpModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative z-10 w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-[32px] p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold">Codebase erklärt</h3>
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                <p>
                  Eine <span className="font-semibold text-white">Codebase</span> funktioniert wie ein Projekt, ist jedoch speziell auf Software- und Webentwicklung ausgelegt.
                </p>
                <p>
                  • <span className="font-semibold text-white">Programmieren:</span> Hier befindet sich die interaktive Promptzeile. Gib einfach ein, was du bauen willst. Die KI programmiert für dich und beantwortet technische Fragen.
                </p>
                <p>
                  • <span className="font-semibold text-white">Code:</span> Hier sind alle Dateien deiner Codebase gespeichert (z.B. Komponenten, Skripte, Schemata). Du kannst sie jederzeit ansehen, editieren oder neue Dateien hochladen.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
