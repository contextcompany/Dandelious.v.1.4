import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  AlignLeft, 
  FileText, 
  Clock, 
  Edit3, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Orbit,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { playSound } from '../utils/sound';

export interface DeepResearchPlanCardProps {
  title: string;
  topic?: string;
  status: 'draft' | 'running' | 'completed';
  subtasks?: string[];
  estimatedMinutes?: number;
  onStartResearch: () => void;
  onEditPlan?: () => void;
  onOpenReport?: () => void;
  soundEnabled?: boolean;
}

export const DeepResearchPlanCard: React.FC<DeepResearchPlanCardProps> = ({
  title,
  topic,
  status,
  subtasks = [
    '(1) Recherche nach allgemeinen Informationen, technischen Daten und Spezifikationen.',
    '(2) Identifiziere die verschiedenen Varianten, Schlüsselmerkmale und historische Entwicklung.',
    '(3) Strukturiere fundierte Gegenüberstellungen und Quellenzusammenfassungen.'
  ],
  estimatedMinutes = 3,
  onStartResearch,
  onEditPlan,
  onOpenReport,
  soundEnabled = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customTitle, setCustomTitle] = useState(title);

  // Status 1: Draft - Interaktiver Rechercheplan (matching Screenshot 2)
  if (status === 'draft') {
    return (
      <div className="w-full max-w-xl my-3 select-none">
        <div className="bg-[#141416] border border-white/10 rounded-[30px] sm:rounded-[34px] p-5 sm:p-6 text-white shadow-2xl space-y-5">
          {/* Card Title matching screenshot 2 */}
          <div className="flex items-center justify-between">
            {isEditingPrompt ? (
              <div className="w-full flex items-center gap-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#202024] text-white px-3 py-1.5 rounded-xl text-base border border-white/20 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt(false)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-200 rounded-xl text-xs font-semibold text-black cursor-pointer shadow-sm"
                >
                  Fertig
                </button>
              </div>
            ) : (
              <h3 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight">
                {customTitle || title || "Recherche-Übersicht"}
              </h3>
            )}
          </div>

          {/* Connected Step Timeline matching screenshot 2 */}
          <div className="relative pl-1 py-1 space-y-4">
            {/* Vertical connector line */}
            <div className="absolute left-[13px] top-[26px] bottom-[26px] w-[1.5px] bg-neutral-700/70" />

            {/* Step 1: Recherche-Websites */}
            <div className="relative flex items-start gap-3.5">
              <div className="w-6 h-6 rounded-md bg-[#242428] border border-white/10 flex items-center justify-center text-white shrink-0 z-10">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-[15px] font-medium text-white">
                  Recherche-Websites
                </h4>
                
                <div className="mt-2 text-[13px] text-neutral-300 space-y-1.5 leading-relaxed">
                  {subtasks.slice(0, isExpanded ? subtasks.length : 2).map((st, i) => (
                    <p key={i} className="text-neutral-300">
                      {st}
                    </p>
                  ))}

                  {subtasks.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setIsExpanded(!isExpanded);
                      }}
                      className="text-neutral-400 hover:text-white text-xs underline underline-offset-4 pt-1 cursor-pointer block font-medium"
                    >
                      {isExpanded ? 'Weniger' : 'Mehr'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Analysiere Ergebnisse */}
            <div className="relative flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-md bg-[#242428] border border-white/10 flex items-center justify-center text-white shrink-0 z-10">
                <AlignLeft className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[15px] font-medium text-white">
                Analysiere Ergebnisse
              </span>
            </div>

            {/* Step 3: Erstelle Bericht */}
            <div className="relative flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-md bg-[#242428] border border-white/10 flex items-center justify-center text-white shrink-0 z-10">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[15px] font-medium text-white">
                Erstelle Bericht
              </span>
            </div>

            {/* Step 4: Estimated Time */}
            <div className="relative flex items-center gap-3.5 pt-1">
              <div className="w-6 h-6 flex items-center justify-center text-neutral-400 shrink-0 z-10">
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <span className="text-[14px] text-neutral-400 font-normal">
                In wenigen Minuten fertig
              </span>
            </div>
          </div>

          {/* Action Buttons matching screenshot 2 */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                if (onEditPlan) onEditPlan();
                else setIsEditingPrompt(true);
              }}
              className="text-[14px] text-neutral-300 hover:text-white font-normal transition-colors px-2 py-1.5 cursor-pointer"
            >
              Plan bearbeiten
            </button>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onStartResearch();
              }}
              className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-[14px] sm:text-[15px] shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Recherche starten</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Status 2: Running - Recherche läuft (matching Screenshot 1)
  if (status === 'running') {
    return (
      <div className="w-full max-w-xl my-3 select-none">
        <div className="bg-[#141416] border border-white/10 rounded-[30px] sm:rounded-[34px] p-5 sm:p-6 text-white shadow-2xl flex items-center gap-4">
          {/* Rounded Icon Box with list lines icon matching screenshot 1 */}
          <div className="w-12 h-12 rounded-2xl bg-[#202026] border border-white/10 flex items-center justify-center text-white shrink-0 shadow-inner">
            <div className="space-y-1 w-5 flex flex-col items-start">
              <div className="w-5 h-[2px] bg-white rounded-full" />
              <div className="w-3.5 h-[2px] bg-neutral-400 rounded-full" />
              <div className="w-4 h-[2px] bg-neutral-400 rounded-full" />
            </div>
          </div>

          {/* Title & Live Status */}
          <div className="min-w-0 flex-1">
            <h4 className="text-[16px] sm:text-[17px] font-semibold text-white truncate tracking-tight">
              {title || "Recherche-Übersicht"}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[13px] text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-neutral-500 animate-ping" />
              <span className="animate-pulse">Recherche wird gestartet...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Status 3: Completed - Bericht fertig (matching Screenshot 4 1:1)
  const formattedTime = new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <div className="w-full max-w-xl my-2 select-none">
      <div className="bg-[#18181b] border border-white/10 hover:border-white/20 rounded-[28px] sm:rounded-[32px] p-4.5 sm:p-5 text-white shadow-2xl flex items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-200 shrink-0">
            <Orbit className="w-5 h-5 stroke-[1.75] text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[15px] sm:text-[16.5px] font-medium text-white truncate tracking-tight">
              {title || "Deep Research Übersicht"}
            </h4>
            <p className="text-[13px] text-neutral-400 mt-0.5 font-normal">
              {formattedTime}
            </p>
          </div>
        </div>

        {/* Action Button: Öffnen matching Screenshot 4 */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            if (onOpenReport) onOpenReport();
          }}
          className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-[13.5px] sm:text-[14px] shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Öffnen</span>
        </button>
      </div>
    </div>
  );
};
