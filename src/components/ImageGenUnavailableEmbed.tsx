import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, CheckCircle2, XCircle, ArrowRight, Copy, Check, MessageSquareCode, FileText } from 'lucide-react';

interface ImageGenUnavailableEmbedProps {
  originalPrompt?: string;
  onNavigateToImageStudio?: () => void;
  onGeneratePrompt?: (promptText: string) => void;
}

export const ImageGenUnavailableEmbed: React.FC<ImageGenUnavailableEmbedProps> = ({
  originalPrompt,
  onNavigateToImageStudio,
  onGeneratePrompt,
}) => {
  const [copied, setCopied] = useState(false);

  const cleanSubject = originalPrompt
    ? originalPrompt
        .replace(/^(erstelle|generiere|zeichne|male|mach)\s+(mir\s+)?(ein\s+|einem\s+|das\s+)?(bild|foto|grafik|zeichnung)\s*(von|zu|über)?\s*/i, '')
        .trim()
    : '';

  const handleCopyPromptHelp = () => {
    const textToCopy = cleanSubject 
      ? `A highly detailed, cinematic photograph of ${cleanSubject}, photorealistic, 8k resolution, studio lighting, hyper-detailed.`
      : `A highly detailed, cinematic concept art, photorealistic, 8k resolution, atmospheric lighting.`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskForPrompt = () => {
    const subject = cleanSubject || originalPrompt || "einem eindrucksvollen Motiv";
    const prompt = `Formuliere mir bitte 3 hochpräzise, englische Prompts für Midjourney und Imagen 3 zum Motiv "${subject}". Beziehe Kameraeinstellungen, Lichtverhältnisse, Stil und Detailgrad mit ein.`;
    onGeneratePrompt?.(prompt);
  };

  return (
    <div className="my-3.5 w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#0c1322]/95 border border-[#1e2f55] shadow-[0_16px_40px_rgba(0,0,0,0.65)] overflow-hidden transition-all text-neutral-100 font-['DM_Sans',system-ui,sans-serif]">
      {/* Decorative top accent gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
              <ImageIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/25">
                  Reines Sprachmodell (LLM)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Keine direkte Bildgenerierung im Chat
              </h3>
            </div>
          </div>
        </div>

        {/* Informative description text */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          Dandelious arbeitet als <strong className="text-white font-medium">Large Language Model (LLM)</strong> zur Analyse, Recherche und Generierung von natürlicher Sprache und Programmcode. Die direkte Erzeugung von Bilddateien (Diffusionsmodelle) ist in diesem Chat-Modus nicht integriert.
        </p>

        {/* Capability matrix overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs text-neutral-200">Text- und Dokumentenanalyse</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs text-neutral-200">Programmierung & Scripting</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs text-neutral-200">Deep Research & logische Synthese</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 stroke-[2.2]" />
            <span className="text-xs text-red-200 font-medium">Bildgenerierung (Nicht unterstützt)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-white/10">
          {onNavigateToImageStudio && (
            <button
              type="button"
              onClick={onNavigateToImageStudio}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/25"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zum Bildstudio wechseln</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          {onGeneratePrompt && (
            <button
              type="button"
              onClick={handleAskForPrompt}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#13203d] hover:bg-[#1a2d56] border border-[#213a70] active:scale-95 text-blue-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquareCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Bild-Prompt formulieren lassen</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyPromptHelp}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Beispiel-Prompt kopieren"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Kopiert</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Prompt-Vorlage</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
