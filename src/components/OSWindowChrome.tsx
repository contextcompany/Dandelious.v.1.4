import React from 'react';
import { OSType, OS_PROFILES } from '../utils/osAdaptation';
import { Monitor, Smartphone, Tablet, Apple, Terminal, Sliders, Check } from 'lucide-react';

interface OSWindowChromeProps {
  currentOS?: OSType;
  targetOS?: OSType;
  onSelectOS?: (os: OSType) => void;
  title?: string;
  subtitle?: string;
  isDark?: boolean;
  className?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  showSelector?: boolean;
}

export const OSWindowChrome: React.FC<OSWindowChromeProps> = ({
  currentOS,
  targetOS,
  onSelectOS,
  title = 'Dandelious AI System',
  subtitle,
  isDark = true,
  className = '',
  onClose,
  onMinimize,
  onMaximize,
  showSelector = false
}) => {
  const effectiveOS = targetOS || currentOS || 'macos';
  const profile = OS_PROFILES[effectiveOS] || OS_PROFILES.macos;
  const [selectorOpen, setSelectorOpen] = React.useState(false);

  // macOS Style Chrome
  if (effectiveOS === 'macos') {
    return (
      <div className={`h-9 w-full flex items-center justify-between px-3.5 bg-black/40 border-b border-white/10 select-none transition-all ${className}`}>
        <div className="flex items-center gap-2">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 group">
            <button 
              onClick={onClose}
              title="Schließen"
              className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-90 transition-transform"
            >
              <span className="text-[7px] text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
            </button>
            <button 
              onClick={onMinimize}
              title="Minimieren"
              className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-90 transition-transform"
            >
              <span className="text-[7px] text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity">─</span>
            </button>
            <button 
              onClick={onMaximize}
              title="Vollbild"
              className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-90 transition-transform"
            >
              <span className="text-[7px] text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity">＋</span>
            </button>
          </div>
          <span className="text-[11px] font-medium text-neutral-400 ml-2 font-mono tracking-tight">{title}</span>
        </div>

        {/* OS Switcher / Indicator */}
        <div className="relative flex items-center">
          <button 
            onClick={() => setSelectorOpen(!selectorOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neutral-300 font-mono transition-colors"
          >
            <Apple size={11} className="text-neutral-300" />
            <span>macOS UI</span>
          </button>

          {selectorOpen && onSelectOS && (
            <OSDropdownMenu currentOS={effectiveOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  // Windows 11 Fluent Chrome
  if (effectiveOS === 'windows') {
    return (
      <div className={`h-8 w-full flex items-center justify-between pl-3 pr-0 bg-[#0f1118]/95 border-b border-white/15 select-none font-['Segoe_UI'] ${className}`}>
        <div className="flex items-center gap-2">
          {/* Windows 4-Square Logo */}
          <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
            <div className="bg-[#0078d4] rounded-[0.5px]"></div>
            <div className="bg-[#0078d4] rounded-[0.5px]"></div>
            <div className="bg-[#0078d4] rounded-[0.5px]"></div>
            <div className="bg-[#0078d4] rounded-[0.5px]"></div>
          </div>
          <span className="text-[11px] font-semibold text-neutral-200 tracking-wide">{title}</span>
        </div>

        <div className="flex items-center">
          {/* OS Switcher */}
          {showSelector && (
            <button 
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1 px-2 py-0.5 mr-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neutral-300 transition-colors"
            >
              <Monitor size={10} />
              <span>Win 11 Mica</span>
            </button>
          )}

          {selectorOpen && onSelectOS && (
            <OSDropdownMenu currentOS={effectiveOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
          )}

          {/* Windows Caption Controls */}
          <div className="flex items-center">
            <button 
              onClick={onMinimize} 
              className="w-11 h-8 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Minimieren"
            >
              <span className="text-xs">─</span>
            </button>
            <button 
              onClick={onMaximize} 
              className="w-11 h-8 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Maximieren"
            >
              <span className="text-[10px] border border-current w-2.5 h-2.5 block"></span>
            </button>
            <button 
              onClick={onClose} 
              className="w-11 h-8 flex items-center justify-center text-neutral-400 hover:bg-[#e81123] hover:text-white transition-colors"
              title="Schließen"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iPadOS Chrome
  if (effectiveOS === 'ipados') {
    return (
      <div className={`h-9 w-full flex items-center justify-between px-4 bg-black/60 border-b border-white/12 select-none ${className}`}>
        <div className="flex items-center gap-2">
          <Tablet size={13} className="text-neutral-300" />
          <span className="text-[11px] font-semibold text-neutral-200 tracking-tight">{title}</span>
        </div>

        {/* Multitasking Pill (iPadOS Stage Manager 3-Dots) */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
        </div>

        <div className="relative">
          {showSelector && (
            <button 
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-neutral-300 font-medium transition-colors"
            >
              <span>iPadOS Stage</span>
            </button>
          )}
          {selectorOpen && onSelectOS && (
            <OSDropdownMenu currentOS={effectiveOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  // Android Material 3 Chrome
  if (effectiveOS === 'android') {
    return (
      <div className={`h-11 w-full flex items-center justify-between px-4 bg-[#1e1f26] border-b border-white/8 select-none shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-300 hover:bg-white/10">
              <span className="text-sm">←</span>
            </button>
          )}
          <span className="text-xs font-semibold text-neutral-100 tracking-normal font-['Google_Sans',Roboto,sans-serif]">{title}</span>
        </div>

        <div className="relative flex items-center gap-2">
          {showSelector && (
            <button 
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-[10px] text-neutral-200 font-medium transition-colors border border-white/5"
            >
              <span>Material 3</span>
            </button>
          )}
          {selectorOpen && onSelectOS && (
            <OSDropdownMenu currentOS={effectiveOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
          )}
        </div>
      </div>
    );
  }

  // Linux GNOME / GTK4 Chrome
  if (effectiveOS === 'linux') {
    return (
      <div className={`h-9 w-full flex items-center justify-between px-3 bg-[#181820] border-b border-white/10 select-none ${className}`}>
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-neutral-400" />
          <span className="text-[11px] font-medium text-neutral-300 font-sans">{title}</span>
        </div>

        <div className="relative flex items-center gap-2">
          {showSelector && (
            <button 
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-neutral-300 transition-colors border border-white/10"
            >
              <span>GTK4 Adwaita</span>
            </button>
          )}
          {selectorOpen && onSelectOS && (
            <OSDropdownMenu currentOS={effectiveOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-neutral-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  // iOS Cupertino Chrome (Default)
  return (
    <div className="h-9 w-full flex items-center justify-between px-4 bg-black/40 border-b border-white/10 select-none">
      <div className="flex items-center gap-2">
        <Smartphone size={13} className="text-neutral-300" />
        <span className="text-[11px] font-semibold text-neutral-200 tracking-tight">{title}</span>
      </div>

      <div className="relative">
        <button 
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-neutral-300 font-medium transition-colors"
        >
          <span>iOS Cupertino</span>
        </button>
        {selectorOpen && onSelectOS && (
          <OSDropdownMenu currentOS={currentOS} onSelect={(os) => { onSelectOS(os); setSelectorOpen(false); }} onClose={() => setSelectorOpen(false)} />
        )}
      </div>
    </div>
  );
};

// Dropdown Helper for Instant OS Switching
const OSDropdownMenu: React.FC<{
  currentOS: OSType;
  onSelect: (os: OSType) => void;
  onClose: () => void;
}> = ({ currentOS, onSelect, onClose }) => {
  const osList: OSType[] = ['ios', 'ipados', 'macos', 'android', 'windows', 'linux'];

  return (
    <div 
      className="absolute top-8 right-0 w-64 p-2 rounded-2xl bg-[#141418]/95 border border-white/20 shadow-2xl backdrop-blur-2xl z-[99999] space-y-1 animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
        <span>Betriebssystem-Profil</span>
        <button onClick={onClose} className="text-neutral-500 hover:text-white">✕</button>
      </div>

      <div className="space-y-1">
        {osList.map((os) => {
          const prof = OS_PROFILES[os];
          const isSelected = currentOS === os;
          return (
            <button
              key={os}
              onClick={() => onSelect(os)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                isSelected ? 'bg-white/15 text-white font-semibold' : 'text-neutral-300 hover:bg-white/10'
              }`}
            >
              <div>
                <div className="text-xs flex items-center gap-1.5">
                  <span>{prof.name}</span>
                </div>
                <div className="text-[10px] text-neutral-400 line-clamp-1">{prof.badgeLabel}</div>
              </div>
              {isSelected && <Check size={13} className="text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
