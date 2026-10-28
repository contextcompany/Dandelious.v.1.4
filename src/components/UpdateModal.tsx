import React from 'react';
import { Sparkles, Check, Code2, Cpu, Zap, Layers, X } from 'lucide-react';
import { DotMatrixCanvas } from './DotMatrixCanvas';

export const CURRENT_SAPHIRE_VERSION = '3.2.0';
export const CURRENT_VANGUARD_VERSION = CURRENT_SAPHIRE_VERSION;

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const updates = [
    {
      icon: <Code2 className="w-5 h-5 text-[#4c8dff] shrink-0" />,
      title: 'Dice Studio: Erklärung & Code getrennt',
      description: 'Der Assistant erklärt im Chat präzise, was gebaut oder geändert wurde. Der fertige Code steht übersichtlich unter den Dicecodes / im Editor bereit.'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#4c8dff] shrink-0" />,
      title: 'Wogende Wellen-Raster Vorschau',
      description: 'Während die KI arbeitet, zeigt die Vorschau ein animiertes Wellen-Raster mit dem Status "Code wird generiert" auf tiefschwarzem Grund.'
    },
    {
      icon: <Layers className="w-5 h-5 text-[#4c8dff] shrink-0" />,
      title: 'Leere Canvas & Schnellauswahl',
      description: 'Starte sofort mit einem leeren Projekt oder wähle vorgefertigte Vorlagen, um dein eigenes Projekt frei mit der KI zu gestalten.'
    },
    {
      icon: <Zap className="w-5 h-5 text-[#4c8dff] shrink-0" />,
      title: 'Dandelious Liquid Glass & Velvet-Purple Akzente',
      description: 'Aufgeräumtes, elegantes Monochrom-Design mit sanften dunkellila Saphir-Akzenten und flüssigen Glaskonturen.'
    },
    {
      icon: <Cpu className="w-5 h-5 text-[#4c8dff] shrink-0" />,
      title: 'PWA Smartphone App & Cloud-Sync',
      description: 'Direkt installierbar als App auf Android, iPhone & Mac/Windows mit automatischem Service Worker & Cloud-Sync.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e0f14] border border-[#4c8dff]/20 rounded-3xl p-6 md:p-8 shadow-2xl text-white overflow-hidden space-y-6">
        
        {/* Dot Matrix Background */}
        <div className="absolute inset-0 pointer-events-none opacity-22">
          <DotMatrixCanvas density={28} interactive={false} glow={true} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#4c8dff]/15 border border-[#4c8dff]/30 text-[11px] font-mono text-blue-200">
              <Sparkles className="w-3 h-3 text-[#4c8dff]" />
              <span>Dandelious v{CURRENT_SAPHIRE_VERSION}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white pt-1">
              Was ist neu in Dandelious
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer border border-white/10"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {updates.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-start gap-3.5"
            >
              <div className="p-2 rounded-xl bg-white/10 border border-white/10 mt-0.5">
                {item.icon}
              </div>
              <div className="space-y-0.5 flex-1">
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Erkunden & Fortfahren</span>
          </button>
        </div>

      </div>
    </div>
  );
};
