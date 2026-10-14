import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, MessageSquare, Settings, Plus, X, Zap, Cpu, Terminal, Shield, Mic } from 'lucide-react';
import { ChatSession, GemmaModelId } from '../types';
import { GEMMA_MODELS } from '../data/models';
import { DotMatrixCanvas } from './DotMatrixCanvas';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: (subPage?: any) => void;
  onModelChange: (model: GemmaModelId) => void;
  selectedModel: GemmaModelId;
  onOpenTranscribe?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewChat,
  onOpenSettings,
  onModelChange,
  selectedModel,
  onOpenTranscribe,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter(
    s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.messages.some(m => m.content.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/80 backdrop-blur-2xl transition-all"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#0b0c10]/95 border border-white/15 rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-3xl overflow-hidden flex flex-col text-neutral-200 select-none transform-gpu relative"
        >
          {/* Background Dot Matrix */}
          <div className="absolute inset-0 pointer-events-none opacity-15">
            <DotMatrixCanvas density={20} interactive={false} />
          </div>
          {/* Top Search Input */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Befehl ausführen oder Chat durchsuchen... (Cmd+K)"
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none font-normal"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action List & Results */}
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {/* Quick Actions */}
            {!query && (
              <div className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Schnellaktionen
                </div>
                <button
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs sm:text-sm text-neutral-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Neuen Chat starten</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Ctrl+Shift+O
                  </kbd>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs sm:text-sm text-neutral-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>Einstellungen öffnen</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Ctrl+,
                  </kbd>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings('api');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs sm:text-sm text-neutral-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span>Context AI Studio Key einrichten</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    API Key
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenTranscribe) onOpenTranscribe();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs sm:text-sm text-neutral-200 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center">
                      <Mic className="w-4 h-4" />
                    </div>
                    <span>Audio transkribieren</span>
                  </div>
                  <span className="text-[10px] font-mono text-lime-300 bg-lime-950/80 px-2 py-0.5 rounded border border-lime-500/30">
                    gemini-3.5-transcribe
                  </span>
                </button>
              </div>
            )}

            {/* Model Switcher */}
            {!query && (
              <div className="space-y-1">
                <div className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Modell wechseln
                </div>
                {GEMMA_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModelChange(m.id);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs text-neutral-200 transition-all cursor-pointer ${
                      selectedModel === m.id ? 'bg-white/15 border border-white/20 text-white font-medium' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-lime-400" />
                      <span>{m.name}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">{m.badge}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Chat History Search Results */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                {query ? 'Suchergebnisse' : 'Letzte Chats'}
              </div>
              {filteredSessions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-neutral-500">
                  Keine passenden Chats gefunden.
                </div>
              ) : (
                filteredSessions.slice(0, 8).map(session => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/10 flex items-center gap-3 text-xs sm:text-sm text-neutral-200 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-white">{session.title}</div>
                      {session.messages.length > 0 && (
                        <div className="truncate text-[11px] text-neutral-500 font-normal">
                          {session.messages[session.messages.length - 1].content.slice(0, 60)}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
