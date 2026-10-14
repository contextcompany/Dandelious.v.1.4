import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  MoreVertical,
  Share2,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  Send,
  Mic,
  FileText,
  Orbit,
  Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { playSound } from '../utils/sound';
import { MediathekItem } from '../utils/mediaLibrary';
import { SmartMarkdownImage } from './SmartMarkdownImage';
import { ImageViewerModal } from './ImageViewerModal';

interface DocumentViewerModalProps {
  documentItem: MediathekItem | null;
  onClose: () => void;
  onAskSaphire?: (question: string) => void;
  onPublish?: (item: MediathekItem) => void;
  onUnpublish?: (item: MediathekItem) => void;
  onDelete?: (id: string, publishedId?: string) => void;
  onReload?: (item: MediathekItem) => void;
  soundEnabled?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentItem,
  onClose,
  onAskSaphire,
  onPublish,
  onUnpublish,
  onDelete,
  onReload,
  soundEnabled = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeImageLightbox, setActiveImageLightbox] = useState<{ url: string; title: string } | null>(null);

  if (!documentItem) return null;

  const isDeepResearch = 
    documentItem.type === 'deep_research' || 
    documentItem.tags?.includes('deep-research') ||
    documentItem.title.toLowerCase().includes('deep research');
  const hasPromptBar = !isDeepResearch && documentItem.type !== 'image' && !documentItem.url;

  const metadata = documentItem.docMetadata || {
    docId: isDeepResearch ? 'DR-2026-X1' : 'PRJ-2026-X4',
    status: 'Fertiggestellt',
    classification: isDeepResearch ? 'Deep Research Dossier' : 'Intern / Konzeptphase',
    lastUpdated: new Date(documentItem.createdAt || Date.now()).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  };

  const handleCopy = () => {
    if (documentItem.content) {
      navigator.clipboard.writeText(documentItem.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playSound('pop', soundEnabled);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([documentItem.content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentItem.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSound('chime', soundEnabled);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    playSound('send', soundEnabled);
    const q = promptInput.trim();
    setPromptInput('');
    if (onAskSaphire) {
      onAskSaphire(`Bezugnehmend auf das Dokument "${documentItem.title}":\n\n${q}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-[#0c0c0e] text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans'] overflow-hidden"
      >
        {/* Top App Bar matching Screenshot 1 */}
        <header className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-white/10 bg-[#121215]/90 backdrop-blur-xl shrink-0 z-20">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Zurück"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 max-w-[60%] sm:max-w-md">
            {isDeepResearch ? (
              <Orbit className="w-4 h-4 text-neutral-400 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
            )}
            <span className="text-sm font-semibold text-white truncate">
              {documentItem.title}
            </span>
          </div>

          {/* Three Dots Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setIsMenuOpen(!isMenuOpen);
              }}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Optionen"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Floating Context Menu styled identically to 3-dots */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#18181c] rounded-[32px] shadow-2xl p-2.5 border border-white/10 backdrop-blur-2xl overflow-hidden"
                  >
                    <div className="space-y-1">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleCopy();
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-5 h-5 text-emerald-400 shrink-0" /> : <Copy className="w-5 h-5 text-neutral-300 shrink-0" />}
                        <span className="text-[15px] font-normal">{copied ? 'Kopiert!' : 'Inhalt kopieren'}</span>
                      </button>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleDownload();
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Download className="w-5 h-5 text-neutral-300 shrink-0" />
                        <span className="text-[15px] font-normal">Als Markdown speichern</span>
                      </button>

                      {/* Print / PDF */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handlePrint();
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Printer className="w-5 h-5 text-neutral-300 shrink-0" />
                        <span className="text-[15px] font-normal">Drucken / Als PDF</span>
                      </button>

                      {/* Publish / Unpublish to Community Hub */}
                      {documentItem.isPublished ? (
                        onUnpublish && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onUnpublish(documentItem);
                            }}
                            className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-5 h-5 text-amber-400 shrink-0" />
                            <span className="text-[15px] font-normal">Aus Community Hub entfernen (Unpublish)</span>
                          </button>
                        )
                      ) : (
                        onPublish && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onPublish(documentItem);
                            }}
                            className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-5 h-5 text-neutral-300 shrink-0" />
                            <span className="text-[15px] font-normal">In Community Hub teilen</span>
                          </button>
                        )
                      )}

                      {/* Reload / Regenerate */}
                      {onReload && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onReload(documentItem);
                            onClose();
                          }}
                          className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-5 h-5 text-neutral-300 shrink-0" />
                          <span className="text-[15px] font-normal">Neu generieren / Überarbeiten</span>
                        </button>
                      )}

                      {/* Delete */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onDelete(documentItem.id, documentItem.publishedId);
                            onClose();
                          }}
                          className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
                          <span className="text-[15px] font-normal">Dokument löschen</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Document Scrollable Content Area */}
        <main className={`flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto ${hasPromptBar ? 'pb-32' : 'pb-12'} custom-scrollbar select-text`}>
          {/* Header Metadata Section */}
          {!isDeepResearch && (
            <div className="mb-8 pb-6 border-b border-white/10 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                {documentItem.title}
              </h1>

              {/* Key-Value Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-neutral-300 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-medium">Dokumenten-ID:</span>
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">{metadata.docId || 'PRJ-2026-X4'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-medium">Status:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {metadata.status || 'In Überprüfung'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-medium">Klassifizierung:</span>
                  <span className="text-neutral-200">{metadata.classification || 'Intern / Konzeptphase'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-medium">Letzte Aktualisierung:</span>
                  <span className="text-neutral-200">{metadata.lastUpdated || '30. August 2026'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Document Content Body rendered with Markdown */}
          <div className="prose prose-invert max-w-none text-neutral-200 text-sm sm:text-[15.5px] leading-relaxed space-y-4 font-['Inter',sans-serif]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1({ children }) {
                  return <h1 className="text-2xl sm:text-[32px] font-semibold text-white mt-4 mb-6 tracking-tight leading-[1.25]">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-xl sm:text-2xl font-medium text-white mt-10 mb-4 tracking-tight leading-snug">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-lg sm:text-xl font-medium text-white mt-8 mb-3 tracking-tight">{children}</h3>;
                },
                p({ children }: any) {
                  return <div className="my-3.5 leading-[1.7] text-neutral-300">{children}</div>;
                },
                pre({ children }: any) {
                  return <>{children}</>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside space-y-2 my-4 text-neutral-300 pl-4">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside space-y-1.5 my-3 text-neutral-200 pl-2">{children}</ol>;
                },
                li({ children }) {
                  return <li className="text-neutral-200 leading-relaxed">{children}</li>;
                },
                img({ src, alt }: any) {
                  return (
                    <SmartMarkdownImage
                      src={src}
                      alt={alt}
                      onOpenViewer={(url, title) => setActiveImageLightbox({ url, title: title || 'Großansicht' })}
                    />
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#141418] shadow-lg">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="px-4 py-3 bg-white/10 border-b border-white/10 font-semibold text-white">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="px-4 py-2.5 border-b border-white/5 text-neutral-300">
                      {children}
                    </td>
                  );
                },
                code({ inline, children }: any) {
                  return inline ? (
                    <code className="bg-white/10 text-neutral-200 px-1.5 py-0.5 rounded text-[13px] font-mono border border-white/5">
                      {children}
                    </code>
                  ) : (
                    <div className="my-4 p-4 rounded-2xl bg-[#121215] border border-white/10 overflow-x-auto font-mono text-xs text-neutral-200">
                      <code>{children}</code>
                    </div>
                  );
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-lime-500/80 bg-lime-600/5 px-4 py-2 my-4 rounded-r-xl text-neutral-300 italic">
                      {children}
                    </blockquote>
                  );
                }
              }}
            >
              {documentItem.content || (documentItem.url ? `![${documentItem.title || 'Bild'}](${documentItem.url})` : 'Kein Inhalt vorhanden.')}
            </ReactMarkdown>
          </div>
        </main>

        {/* Bottom Sticky Prompt Bar matching Screenshot 1 - Hidden when viewing Deep Research or Image results */}
        {hasPromptBar && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/95 to-transparent z-30">
            <form
              onSubmit={handleSendQuestion}
              className="max-w-2xl mx-auto flex items-center gap-2 bg-[#18181c] border border-white/15 rounded-full px-4 py-2 shadow-2xl backdrop-blur-xl"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="+ Frag Dandelious"
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-hidden px-2"
              />

              <button
                type="button"
                onClick={() => {
                  playSound('pop', soundEnabled);
                  setIsRecording(!isRecording);
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-neutral-400 hover:text-white'
                }`}
                title="Spracheingabe"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={!promptInput.trim()}
                className="p-2 rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shrink-0 shadow-md"
                title="Absenden"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Lightbox Image Viewer */}
        <ImageViewerModal
          isOpen={!!activeImageLightbox}
          imageUrl={activeImageLightbox?.url || null}
          title={activeImageLightbox?.title}
          onClose={() => setActiveImageLightbox(null)}
        />
      </motion.div>
    </AnimatePresence>
  );
};
