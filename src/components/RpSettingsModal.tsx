import React, { useState, useRef } from 'react';
import { 
  Code2, 
  Eye, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  Check, 
  Copy, 
  Play, 
  Layers, 
  FileCode, 
  Tag, 
  RefreshCw,
  X,
  Edit3
} from 'lucide-react';
import { RpModule } from '../types';
import { DEFAULT_RP_MODULES } from '../data/defaultRpModules';
import { injectRpBridge } from '../utils/rp-bridge';

interface RpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: RpModule[];
  rpEnabled: boolean;
  onSaveModules: (modules: RpModule[]) => void;
  onToggleRpEnabled: (enabled: boolean) => void;
  userName?: string;
  userRole?: string;
  roomCode?: string;
  vaultCredits?: number;
  initialEditingModuleId?: string | null;
}

export const RpSettingsModal: React.FC<RpSettingsModalProps> = ({
  isOpen,
  onClose,
  modules = [],
  rpEnabled,
  onSaveModules,
  onToggleRpEnabled,
  userName = 'Spieler',
  userRole = 'Mitglied',
  roomCode = 'ARC-001',
  vaultCredits = 2500,
  initialEditingModuleId = null
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'import-export'>('editor');
  
  // Selected module in editor
  const [selectedModId, setSelectedModId] = useState<string | null>(
    initialEditingModuleId || modules[0]?.id || null
  );

  // Editor fields
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSymbol, setEditSymbol] = useState<string>('S');
  const [editIconName, setEditIconName] = useState<string>('shopping-bag');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editHtml, setEditHtml] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load selected module into editor fields
  const activeModuleToEdit = modules.find(m => m.id === selectedModId);

  React.useEffect(() => {
    if (activeModuleToEdit) {
      setEditTitle(activeModuleToEdit.title);
      setEditSymbol(activeModuleToEdit.symbol);
      setEditIconName(activeModuleToEdit.iconName || 'shopping-bag');
      setEditDesc(activeModuleToEdit.description || '');
      setEditHtml(activeModuleToEdit.htmlContent);
    } else if (modules.length > 0) {
      setSelectedModId(modules[0].id);
    }
  }, [selectedModId, activeModuleToEdit, modules]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleSaveCurrentModule = () => {
    if (!selectedModId) return;
    const updated = modules.map(m => m.id === selectedModId ? {
      ...m,
      title: editTitle.trim() || 'Unbenanntes RP Modul',
      symbol: (editSymbol.trim() || 'X').toUpperCase().substring(0, 2),
      iconName: editIconName,
      description: editDesc.trim(),
      htmlContent: editHtml
    } : m);
    onSaveModules(updated);
    showFeedback('Modul erfolgreich gespeichert!');
  };

  const handleCreateNewModule = () => {
    const newId = 'rp-mod-' + Date.now();
    const newMod: RpModule = {
      id: newId,
      title: 'Neues HTML RP Modul',
      symbol: 'N',
      iconName: 'terminal',
      active: true,
      description: 'Benutzerdefiniertes HTML/JS Modul',
      htmlContent: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { background: #0c0d12; color: #fff; font-family: sans-serif; padding: 14px; margin: 0; }
  .btn { background: #3b82f6; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; }
</style>
</head>
<body>
  <h3>👋 Hallo {{USER_NAME}}!</h3>
  <p style="font-size:12px; color:#94a3b8;">Raum-Code: {{ROOM_CODE}} | Rolle: {{USER_ROLE}}</p>
  <button class="btn" onclick="sendAction()">Aktion an Dandelious senden</button>
  <script>
    function sendAction() {
      if (window.saphireRp || window.vanguardRp) {
        const rp = window.saphireRp || window.vanguardRp;
        rp.postAction('[RP Modul]: {{USER_NAME}} hat eine interaktive Aktion ausgeführt!');
      }
    }
  </script>
</body>
</html>`
    };

    onSaveModules([...modules, newMod]);
    setSelectedModId(newId);
    showFeedback('Neues Modul erstellt!');
  };

  const handleDeleteModule = (id: string) => {
    const filtered = modules.filter(m => m.id !== id);
    onSaveModules(filtered);
    if (selectedModId === id) {
      setSelectedModId(filtered[0]?.id || null);
    }
    showFeedback('Modul gelöscht.');
  };

  const handleInstallPreset = (preset: RpModule) => {
    const newId = 'rp-preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const cloned: RpModule = {
      ...preset,
      id: newId
    };
    onSaveModules([...modules, cloned]);
    setSelectedModId(newId);
    setActiveTab('editor');
    showFeedback(`Preset "${preset.title}" installiert!`);
  };

  // Import / Export JSON Preset
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(modules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dandelious-rp-setup-${roomCode || 'export'}.dandelious-rp.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('RP-Setup erfolgreich exportiert!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onSaveModules(imported);
          if (imported.length > 0) setSelectedModId(imported[0].id);
          showFeedback(`${imported.length} RP-Module importiert!`);
        } else {
          alert('Ungültiges RP-Preset Format.');
        }
      } catch (err) {
        alert('Fehler beim Lesen der JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const insertTagAtCursor = (tag: string) => {
    setEditHtml(prev => prev + tag);
  };

  // Preview html content with bridge
  const livePreviewDoc = injectRpBridge(editHtml, {
    userName,
    userRole,
    roomCode,
    vaultCredits
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-5xl rounded-[28px] bg-[#0c0d12]/95 border border-white/15 backdrop-blur-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-white/20 flex items-center justify-center text-amber-300 shadow-md">
              <Code2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Dandelious Tabletop HTML Studio</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#4c8dff]/15 border border-[#4c8dff]/30 text-[10px] font-bold text-blue-200">
                  Application Engine v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Live Code-Studio, Multi-User State Bridge & Preset Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {feedbackMsg && (
              <span className="text-xs font-semibold text-[#4c8dff] bg-[#4c8dff]/15 border border-[#4c8dff]/30 px-3 py-1 rounded-xl animate-fade-in">
                {feedbackMsg}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-white/10 bg-black/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'editor'
                  ? 'bg-white/10 text-white border border-white/20 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Split-View Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-white/10 text-white border border-white/20 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Preset-Bibliothek</span>
            </button>

            <button
              onClick={() => setActiveTab('import-export')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'import-export'
                  ? 'bg-white/10 text-white border border-white/20 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Download className="w-4 h-4 text-[#4c8dff]" />
              <span>Import / Export</span>
            </button>
          </div>

          <button
            onClick={handleCreateNewModule}
            className="px-3.5 py-1.5 rounded-xl bg-[#4c8dff]/20 hover:bg-[#4c8dff]/30 border border-[#4c8dff]/40 text-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Neues Modul</span>
          </button>
        </div>

        {/* TAB 1: SPLIT-VIEW EDITOR */}
        {activeTab === 'editor' && (
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
            {/* Left Module List Sidebar */}
            <div className="lg:col-span-3 border-r border-white/10 bg-[#0a0b0f] p-3 overflow-y-auto space-y-2 custom-scrollbar">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Installierte Module ({modules.length})
              </div>

              {modules.map((m) => {
                const isSelected = selectedModId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModId(m.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-md'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                        {m.symbol}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{m.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{m.description || 'HTML Modul'}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(m.id);
                      }}
                      title="Modul löschen"
                      className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Middle & Right Split View: Editor + Live Preview */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-[#0e0f15]">
              {/* Code Editor Column */}
              <div className="border-r border-white/10 p-4 flex flex-col space-y-3 overflow-y-auto custom-scrollbar">
                
                {/* Meta Inputs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Modul Titel</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#14151c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Symbol</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={editSymbol}
                      onChange={(e) => setEditSymbol(e.target.value)}
                      className="w-full bg-[#14151c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold text-center uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Variable Injection Helper Buttons */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-pink-400" /> Dynamic Tag Insertion
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => insertTagAtCursor('{{USER_NAME}}')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-pink-300 font-mono cursor-pointer"
                    >
                      &#123;&#123;USER_NAME&#125;&#125;
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('{{USER_ROLE}}')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-blue-200 font-mono cursor-pointer"
                    >
                      &#123;&#123;USER_ROLE&#125;&#125;
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('{{ROOM_CODE}}')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-blue-200 font-mono cursor-pointer"
                    >
                      &#123;&#123;ROOM_CODE&#125;&#125;
                    </button>
                    <button
                      onClick={() => insertTagAtCursor('{{VAULT_CREDITS}}')}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-amber-300 font-mono cursor-pointer"
                    >
                      &#123;&#123;VAULT_CREDITS&#125;&#125;
                    </button>
                  </div>
                </div>

                {/* Code Editor Textarea */}
                <div className="flex-1 flex flex-col space-y-1 min-h-[220px]">
                  <label className="text-[10px] font-semibold text-slate-400">HTML / CSS / JS Code</label>
                  <textarea
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    className="flex-1 w-full bg-[#08090d] border border-white/10 rounded-2xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-400 custom-scrollbar leading-relaxed"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveCurrentModule}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Modul Speichern</span>
                </button>
              </div>

              {/* Live Preview Column */}
              <div className="p-4 flex flex-col space-y-2 bg-[#090a0e] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Echtzeit Live-Vorschau
                  </label>
                  <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Bridge Aktiv
                  </span>
                </div>

                <div className="flex-1 w-full rounded-2xl border border-white/10 bg-[#08090c] overflow-hidden min-h-[340px]">
                  <iframe
                    title="Live Preview"
                    srcDoc={livePreviewDoc}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-forms allow-modals"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESET BIBLIOTHEK */}
        {activeTab === 'templates' && (
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Empfohlene Dandelious RP Templates</h4>
              <p className="text-xs text-slate-400">1-Klick Installation vorgefertigter interaktiver Module für Rollenspiel, Taktik & Shop.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEFAULT_RP_MODULES.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-[#12131b] border border-white/10 hover:border-pink-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all group shadow-lg"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center font-bold text-pink-300 text-sm">
                          {preset.symbol}
                        </span>
                        <h5 className="font-bold text-sm text-white">{preset.title}</h5>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                  </div>

                  <button
                    onClick={() => handleInstallPreset(preset)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/40 text-xs font-bold text-pink-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>In Raum Installieren</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: IMPORT / EXPORT */}
        {activeTab === 'import-export' && (
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Box */}
              <div className="bg-[#12131b] border border-white/10 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4c8dff]/15 border border-[#4c8dff]/30 flex items-center justify-center text-[#4c8dff]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">RP Setup Exportieren</h5>
                    <p className="text-xs text-slate-400">Als `.dandelious-rp.json` Datei sichern</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Exportiert alle {modules.length} aktuell konfigurierten HTML RP-Module inklusive Code, Symbole und Beschreibungen.
                </p>

                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 rounded-xl bg-[#4c8dff] hover:bg-blue-600 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Setup Herunterladen</span>
                </button>
              </div>

              {/* Import Box */}
              <div className="bg-[#12131b] border border-white/10 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#4c8dff]/15 border border-[#4c8dff]/30 flex items-center justify-center text-[#4c8dff]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">RP Setup Importieren</h5>
                    <p className="text-xs text-slate-400">JSON Kampagnen-Preset laden</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Lade ein bestehendes Dandelious RP Setup aus einer JSON-Datei hoch. Ersetzt oder ergänzt deine bestehende Bibliothek.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportJson}
                  accept=".json,.dandelious-rp.json,.vanguard-rp.json"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl bg-[#4c8dff] hover:bg-blue-600 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>JSON Datei Auswählen</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
