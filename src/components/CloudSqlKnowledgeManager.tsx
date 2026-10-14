import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Brain, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  FileText, 
  Clock, 
  BarChart2, 
  Code2, 
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  fetchSqlRagDocuments, 
  addSqlRagDocument, 
  deleteSqlRagDocument, 
  querySqlRagMemory,
  fetchSqlTelemetry,
  fetchSqlAiGenerations,
  CloudSqlRagDocument,
  CloudSqlTelemetryStats,
  CloudSqlAiGeneration
} from '../lib/cloudSqlService';
import { playSound } from '../utils/sound';

interface CloudSqlKnowledgeManagerProps {
  currentUser: any;
  onOpenAuth: () => void;
  isSoundActive?: boolean;
}

export const CloudSqlKnowledgeManager: React.FC<CloudSqlKnowledgeManagerProps> = ({
  currentUser,
  onOpenAuth,
  isSoundActive = true,
}) => {
  const [activeTab, setActiveTab] = useState<'rag' | 'search' | 'telemetry' | 'generations'>('rag');
  const [documents, setDocuments] = useState<CloudSqlRagDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docType, setDocType] = useState('text');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search RAG state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Telemetry & Generations
  const [telemetry, setTelemetry] = useState<CloudSqlTelemetryStats | null>(null);
  const [generations, setGenerations] = useState<CloudSqlAiGeneration[]>([]);

  const loadDocs = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const list = await fetchSqlRagDocuments();
      setDocuments(list);
    } catch (e) {
      console.warn('Failed to load SQL RAG docs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTelemetry = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchSqlTelemetry();
      setTelemetry(data);
    } catch (e) {
      console.warn('Failed to load telemetry:', e);
    }
  };

  const loadGenerations = async () => {
    if (!currentUser) return;
    try {
      const data = await fetchSqlAiGenerations();
      setGenerations(data);
    } catch (e) {
      console.warn('Failed to load generations:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDocs();
      loadTelemetry();
      loadGenerations();
    }
  }, [currentUser]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      setStatusMsg({ type: 'error', text: 'Bitte Titel und Textinhalt angeben.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);
    try {
      const created = await addSqlRagDocument(docTitle.trim(), docContent.trim(), docType);
      if (created) {
        setDocTitle('');
        setDocContent('');
        setStatusMsg({ type: 'success', text: 'Dokument mit 768-D Vektor-Embeddings in PostgreSQL gespeichert.' });
        playSound('chime', isSoundActive);
        await loadDocs();
      } else {
        setStatusMsg({ type: 'error', text: 'Fehler beim Speichern in Cloud SQL.' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Fehler beim Speichern.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleDelete = async (id: number) => {
    playSound('pop', isSoundActive);
    const ok = await deleteSqlRagDocument(id);
    if (ok) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await querySqlRagMemory(searchQuery.trim(), 4);
      setSearchResults(res);
      playSound('click', isSoundActive);
    } catch (e) {
      console.warn('RAG search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6 rounded-2xl liquid-glass-card border border-white/10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Cloud SQL (PostgreSQL) Langzeitgedächtnis</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
            Melde dich an, um dein RAG-Wissen, Vektor-Embeddings und relationale Session-Protokolle in Context Cloud SQL zu verwalten.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold shadow hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Mit Firebase anmelden
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cloud SQL Status Banner */}
      <div className="p-4 rounded-2xl liquid-glass-card border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center border border-amber-500/30 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Context Cloud SQL (PostgreSQL & pgvector)</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                Deaktiviert
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Cloud SQL ist deaktiviert. Alle Daten werden über Firebase Firestore & den lokalen Speicher verarbeitet.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            loadDocs();
            loadTelemetry();
            loadGenerations();
            playSound('click', isSoundActive);
          }}
          className="px-3 py-1.5 rounded-xl liquid-glass-subtle text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#101015] rounded-xl border border-white/10">
        {[
          { id: 'rag', label: 'Wissens-Dokumente (RAG)', icon: FileText },
          { id: 'search', label: 'Semantische Vektorsuche', icon: Search },
          { id: 'telemetry', label: 'Telemetrie & Token-Logs', icon: BarChart2 },
          { id: 'generations', label: 'Gespeicherte Code-Artifacts', icon: Code2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                playSound('click', isSoundActive);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RAG Documents */}
      {activeTab === 'rag' && (
        <div className="space-y-5">
          {/* Add Doc Form */}
          <form onSubmit={handleAddDocument} className="p-4 rounded-2xl liquid-glass-card border border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              Neues Dokument für KI-Langzeitgedächtnis hinzufügen
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Titel (z.B. API-Spezifikation, Projekt-Notizen)"
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#14141A] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
              />
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#14141A] border border-white/15 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="text">Text / Dokument</option>
                <option value="code">Code / Schema</option>
                <option value="notes">Persönliche Notiz</option>
                <option value="project">Projektkontext</option>
              </select>
            </div>

            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Dokument-Inhalt oder Markdown hier einfügen... Dandelious & Dice können diese Inhalte semantisch in Antworten einbeziehen."
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-[#14141A] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 resize-none font-mono"
            />

            {statusMsg && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success' ? 'bg-white/10 text-white border border-white/20' : 'bg-red-950/50 text-red-300 border border-red-800/40'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Speichert in pgvector...' : 'In PostgreSQL speichern'}</span>
              </button>
            </div>
          </form>

          {/* List of Documents */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
              Gespeicherte Wissens-Einträge ({documents.length})
            </span>

            {documents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/10 bg-[#0d0d12] text-neutral-400 text-xs">
                Noch keine Dokumente in Cloud SQL gespeichert.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="p-3.5 rounded-xl liquid-glass-subtle border border-white/10 flex items-start justify-between gap-3 hover:border-white/25 transition-all"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{docItem.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-neutral-300 font-mono">
                          {docItem.sourceType}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 font-mono">
                        {docItem.rawContent}
                      </p>
                      <span className="text-[10px] text-neutral-500 block">
                        Erstellt: {new Date(docItem.createdAt).toLocaleString('de-DE')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(docItem.id)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Semantic Search */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <form onSubmit={handleRunSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Frage oder Konzept eingeben (z.B. Wie funktioniert die Authentifizierung?)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141A] border border-white/15 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Sucht...' : 'Vektorsuche'}</span>
            </button>
          </form>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
              Suchergebnisse mit Ähnlichkeitswert ({searchResults.length})
            </span>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-white/10 bg-[#0d0d12] text-neutral-400 text-xs">
                Führe eine Suche aus, um Vektor-Matches aus der PostgreSQL-Datenbank abzufragen.
              </div>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((res, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#121218] border border-white/15 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{res.docTitle}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                        Score: {(res.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 bg-[#0a0a0e] p-2.5 rounded-lg border border-white/5 font-mono whitespace-pre-wrap">
                      {res.chunkContent}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Telemetry & Logs */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl liquid-glass-subtle border border-white/10">
              <span className="text-[11px] text-neutral-400 uppercase font-mono block">Verbrauchte Token (Gesamt)</span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {telemetry?.totalTokens.toLocaleString('de-DE') || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl liquid-glass-subtle border border-white/10">
              <span className="text-[11px] text-neutral-400 uppercase font-mono block">Geloggte System-Ereignisse</span>
              <span className="text-xl font-extrabold text-white font-mono mt-1 block">
                {telemetry?.totalEvents.toLocaleString('de-DE') || 0}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
              Aktuelle PostgreSQL-Systemprotokolle
            </span>

            {telemetry?.recentLogs && telemetry.recentLogs.length > 0 ? (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {telemetry.recentLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-[#111116] border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white">
                        {log.eventType}
                      </span>
                      <span className="text-neutral-400 truncate text-[11px]">
                        {JSON.stringify(log.details)}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                      {new Date(log.createdAt).toLocaleTimeString('de-DE')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-white/10 bg-[#0d0d12] text-neutral-400 text-xs">
                Keine Systemprotokolle gefunden.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Generations */}
      {activeTab === 'generations' && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">
            Persistente Code-Snippets in Cloud SQL ({generations.length})
          </span>

          {generations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-white/10 bg-[#0d0d12] text-neutral-400 text-xs">
              Noch keine Code-Snippets in Cloud SQL gespeichert. Generiere Widgets in Dice Studio oder frage nach HTML/JS in Dandelious!
            </div>
          ) : (
            <div className="space-y-3">
              {generations.map((gen) => (
                <div key={gen.id} className="p-4 rounded-xl bg-[#121218] border border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white truncate max-w-[70%]">{gen.prompt}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white">
                      {gen.language} • {gen.model}
                    </span>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#09090d] border border-white/10 text-[11px] text-neutral-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {gen.codeSnippet}
                  </pre>
                  <div className="flex justify-between items-center text-[10px] text-neutral-500">
                    <span>{new Date(gen.createdAt).toLocaleString('de-DE')}</span>
                    <span className="text-neutral-400">Status: {gen.executionStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
