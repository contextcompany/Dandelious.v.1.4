import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  MoreVertical,
  Info,
  RotateCcw,
  Trash2,
  ArrowUp,
  Edit2,
  Check,
  X,
  Sparkles,
  Search,
  Plus,
  Brain,
  Download,
  Upload,
  Tag,
  Clock,
  Filter,
  CheckCircle2
} from 'lucide-react';
import {
  MemoryTopic,
  loadMemoryTopics,
  saveMemoryTopics,
  addOrUpdateMemoryTopic,
  deleteMemoryTopic,
  clearAllMemoryTopics,
  resetMemoryTopicsToDefault,
  clearMemoryGraph,
  extractMemoriesFromText
} from '../lib/memoryGraphService';
import { playSound } from '../utils/sound';

interface MemoryOverviewViewProps {
  onBack?: () => void;
  chatSessions?: any[];
}

export const MemoryOverviewView: React.FC<MemoryOverviewViewProps> = ({
  onBack,
  chatSessions = []
}) => {
  const [topics, setTopics] = useState<MemoryTopic[]>(loadMemoryTopics);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // Add new topic state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Edit topic state
  const [editingTopic, setEditingTopic] = useState<MemoryTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('Soeben aktualisiert');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with custom events
  useEffect(() => {
    const handleTopicsUpdate = (e: any) => {
      if (e.detail) {
        setTopics(e.detail);
      } else {
        setTopics(loadMemoryTopics());
      }
    };
    window.addEventListener('saphire_memory_topics_updated', handleTopicsUpdate);
    return () => window.removeEventListener('saphire_memory_topics_updated', handleTopicsUpdate);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handle Submit in "Fragen oder aktualisieren"
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setInputText('');

    // Check if user is asking to delete
    if (query.toLowerCase().startsWith('lösche') || query.toLowerCase().startsWith('entferne') || query.toLowerCase().startsWith('delete')) {
      const targetWord = query.replace(/^(lösche|entferne|delete)\s+/i, '').trim().toLowerCase();
      const matched = topics.find(t => t.title.toLowerCase().includes(targetWord) || t.content.toLowerCase().includes(targetWord));
      if (matched) {
        const updated = deleteMemoryTopic(matched.id);
        setTopics(updated);
        showToast(`"${matched.title}" aus Erinnerungen entfernt`);
        setLastUpdatedText('Soeben aktualisiert');
        playSound('click', true);
        return;
      }
    }

    // Otherwise add as new memory note
    const updated = addOrUpdateMemoryTopic(
      query.length > 28 ? query.slice(0, 28) + '...' : query,
      query
    );
    setTopics(updated);
    showToast('Neue Erinnerung gespeichert');
    playSound('chime', true);
    setLastUpdatedText('Soeben aktualisiert');
  };

  const handleSaveNewTopic = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const updated = addOrUpdateMemoryTopic(newTitle.trim(), newContent.trim());
    setTopics(updated);
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
    showToast('Erinnerung hinzugefügt');
    playSound('chime', true);
  };

  const handleSaveEdit = () => {
    if (!editingTopic || !editTitle.trim() || !editContent.trim()) return;
    const updated = addOrUpdateMemoryTopic(editTitle.trim(), editContent.trim(), editingTopic.id);
    setTopics(updated);
    setEditingTopic(null);
    showToast('Erinnerung aktualisiert');
    playSound('click', true);
  };

  const handleDeleteTopic = (id: string, title: string) => {
    const updated = deleteMemoryTopic(id);
    setTopics(updated);
    showToast(`"${title}" entfernt`);
    playSound('click', true);
  };

  const handleExtractFromChats = () => {
    setIsMenuOpen(false);
    if (!chatSessions || chatSessions.length === 0) {
      showToast('Keine Chats zum Analysieren gefunden');
      return;
    }
    let allText = '';
    chatSessions.forEach(session => {
      session.messages?.forEach((m: any) => {
        if (m.role === 'user') allText += m.content + '\n';
      });
    });

    if (!allText.trim()) {
      showToast('Keine passenden Daten gefunden');
      return;
    }

    const result = extractMemoriesFromText(allText);
    const updated = loadMemoryTopics();
    setTopics(updated);
    showToast(`${result.addedNodes || updated.length} Erinnerungen synchronisiert`);
    playSound('chime', true);
  };

  const handleExportJSON = () => {
    setIsMenuOpen(false);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(topics, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'dandelious-memories.json';
    a.click();
    showToast('Erinnerungen exportiert');
    playSound('chime', true);
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#1c1c1e] text-white font-['Plus_Jakarta_Sans'] relative select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2c2c2e] border border-white/15 text-xs font-semibold text-white rounded-full shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Row */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-medium text-[#8e8e93] hover:text-white transition-colors cursor-pointer -ml-2 px-2 py-1"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              <span>Zurück</span>
            </button>
          )}
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Brain className="w-4 h-4 text-neutral-300" />
              <span>Erinnerungen</span>
              <span className="text-xs font-normal text-[#8e8e93] px-2 py-0.5 rounded-full bg-[#2c2c2e]">
                {topics.length}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-8 h-8 rounded-full bg-[#2c2c2e] hover:bg-[#343438] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Neue Notiz hinzufügen"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#2c2c2e] hover:bg-[#343438] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Optionen"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Popover Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -6 }}
                  className="absolute right-0 top-10 z-50 w-64 bg-[#2c2c2e] border border-[#3a3a3c] rounded-2xl p-1.5 shadow-2xl space-y-1"
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsInfoModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#38383c] text-left text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-[#8e8e93]" />
                    <span>Info zu Erinnerungen</span>
                  </button>

                  <button
                    onClick={handleExtractFromChats}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#38383c] text-left text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#8e8e93]" />
                    <span>Aus Chats synchronisieren</span>
                  </button>

                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#38383c] text-left text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#8e8e93]" />
                    <span>Als JSON exportieren</span>
                  </button>

                  <div className="h-[1px] bg-[#3a3a3c] my-1" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (confirm("Möchtest du wirklich alle Erinnerungen unwiderruflich löschen?")) {
                        clearAllMemoryTopics();
                        setTopics([]);
                        showToast("Alle Erinnerungen gelöscht");
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/20 text-left text-xs font-medium text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Alle Erinnerungen löschen</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex items-center gap-2.5 bg-[#2c2c2e] px-3.5 py-2 rounded-xl border border-white/5 focus-within:border-[#1a73e8] transition-all">
          <Search className="w-4 h-4 text-[#8e8e93] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Erinnerungen filtern..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#8e8e93] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#8e8e93] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Grouped iOS Cards) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-5 py-2 space-y-3 pb-24 no-scrollbar"
      >
        {filteredTopics.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#2c2c2e] flex items-center justify-center mx-auto text-[#8e8e93]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">
              {searchQuery ? 'Keine Treffer' : 'Keine Erinnerungen vorhanden'}
            </h4>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              {searchQuery 
                ? 'Versuche einen anderen Suchbegriff.' 
                : 'Dandelious lernt im Chat deine Vorlieben automatisch. Du kannst auch oben über das Plus eigene Fakten hinterlegen.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#2c2c2e] rounded-2xl overflow-hidden divide-y divide-[#3a3a3c] border border-white/5">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 hover:bg-[#343438] transition-colors group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {topic.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#d4d4d4] leading-relaxed">
                      {topic.content}
                    </p>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingTopic(topic);
                        setEditTitle(topic.title);
                        setEditContent(topic.content);
                      }}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id, topic.title)}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#8e8e93] hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Quick-Prompt Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/90 to-transparent z-20">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#2c2c2e] rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2 border border-white/10 focus-within:border-[#1a73e8] transition-all shadow-xl"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Erinnerung hinzufügen oder fragen..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#8e8e93] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputText.trim()
                ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm'
                : 'bg-white/10 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.6]" />
          </button>
        </form>
      </div>

      {/* MODAL: NEUE ERINNERUNG HINZUFÜGEN */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#2c2c2e] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Neue Erinnerung anlegen</h4>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-[#8e8e93] block mb-1">Titel / Thema</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="z. B. Coding-Präferenzen"
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#8e8e93] block mb-1">Details & Inhalt</label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Was soll sich Dandelious merken?"
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1a73e8] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8e8e93] hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveNewTopic}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ERINNERUNG BEARBEITEN */}
      <AnimatePresence>
        {editingTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#2c2c2e] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Erinnerung bearbeiten</h4>
                <button
                  onClick={() => setEditingTopic(null)}
                  className="w-7 h-7 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-[#8e8e93] block mb-1">Titel</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#8e8e93] block mb-1">Inhalt</label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1a73e8] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setEditingTopic(null)}
                  className="px-3 py-1.5 text-xs text-[#8e8e93] hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || !editContent.trim()}
                  className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  Aktualisieren
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: INFO */}
      <AnimatePresence>
        {isInfoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#2c2c2e] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-[#1a73e8]" />
                  <h4 className="text-sm font-semibold text-white">Über das Gedächtnis</h4>
                </div>
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#8e8e93] leading-relaxed">
                Dandelious nutzt einen interaktiven Memory Graph. Bei jeder Unterhaltung erkennt die KI wichtige Fakten und speichert diese lokal und verschlüsselt auf deinem Gerät, um in zukünftigen Antworten maßgeschneidert auf deinen Kontext einzugehen.
              </p>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full py-2 bg-[#1a73e8] text-white text-xs font-semibold rounded-xl"
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
