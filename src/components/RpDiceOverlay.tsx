import React, { useState } from 'react';
import { 
  Dices, 
  X, 
  Sparkles, 
  RotateCcw, 
  Send, 
  Bot,
  Zap
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface RpDiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onPostRollToChat: (rollText: string, triggerAi: boolean) => void;
  soundEnabled?: boolean;
}

export const RpDiceOverlay: React.FC<RpDiceOverlayProps> = ({
  isOpen,
  onClose,
  onPostRollToChat,
  soundEnabled = true
}) => {
  const [selectedDice, setSelectedDice] = useState<number>(20); // default D20
  const [diceCount, setDiceCount] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [customFormula, setCustomFormula] = useState<string>('');
  
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{
    rolls: number[];
    modifier: number;
    total: number;
    expression: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRoll = () => {
    playSound('click', soundEnabled);
    setIsRolling(true);

    let count = diceCount;
    let sides = selectedDice;
    let mod = modifier;

    // Parse custom formula if specified (e.g. 2d20+5 or 1d6-2)
    if (customFormula.trim()) {
      const match = customFormula.trim().toLowerCase().match(/(\d+)?d(\d+)([\+\-]\d+)?/);
      if (match) {
        count = match[1] ? parseInt(match[1], 10) : 1;
        sides = match[2] ? parseInt(match[2], 10) : 20;
        mod = match[3] ? parseInt(match[3], 10) : 0;
      }
    }

    count = Math.max(1, Math.min(count, 10));
    sides = Math.max(2, Math.min(sides, 100));

    // Simulate animated rolling delay
    setTimeout(() => {
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push(val);
        sum += val;
      }
      const total = sum + mod;
      const modStr = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
      const expression = `${count}D${sides}${modStr}`;

      setRollResult({
        rolls,
        modifier: mod,
        total,
        expression
      });
      setIsRolling(false);
      playSound('chime', soundEnabled);
    }, 600);
  };

  const handlePostResult = (triggerAi: boolean) => {
    if (!rollResult) return;
    const rollsStr = rollResult.rolls.join(', ');
    const modStr = rollResult.modifier > 0 ? ` + ${rollResult.modifier}` : rollResult.modifier < 0 ? ` - ${Math.abs(rollResult.modifier)}` : '';
    const formattedText = `🎲 **Würfel-Probe [${rollResult.expression}]**: **${rollResult.total}** *(Gewürfelt: [${rollsStr}]${modStr})*`;

    onPostRollToChat(formattedText, triggerAi);
    onClose();
  };

  const DICE_PRESETS = [
    { label: 'D4', sides: 4, icon: '🔺' },
    { label: 'D6', sides: 6, icon: '🎲' },
    { label: 'D8', sides: 8, icon: '💎' },
    { label: 'D10', sides: 10, icon: '💠' },
    { label: 'D12', sides: 12, icon: '🔷' },
    { label: 'D20', sides: 20, icon: '⭐' },
    { label: 'D100', sides: 100, icon: '💯' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md rounded-[28px] bg-[#0c0d12]/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-5 text-white relative flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dices className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Dandelious Dice Engine</h3>
              <p className="text-[11px] text-slate-400">3D-Logic Würfelproben für RP & Taktik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Dice Selection Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Würfeltyp wählen</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {DICE_PRESETS.map((d) => (
              <button
                key={d.sides}
                onClick={() => {
                  setSelectedDice(d.sides);
                  setCustomFormula('');
                }}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  selectedDice === d.sides && !customFormula
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] scale-105'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-sm">{d.icon}</span>
                <span className="text-[10px] font-bold mt-0.5">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity & Modifier Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Anzahl Würfel</label>
            <div className="flex items-center gap-1 bg-[#14151c] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                -
              </button>
              <span className="flex-1 text-center text-xs font-bold text-white">{diceCount}x</span>
              <button
                onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Modifikator (+/-)</label>
            <div className="flex items-center gap-1 bg-[#14151c] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setModifier(modifier - 1)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                -
              </button>
              <span className="flex-1 text-center text-xs font-bold text-amber-300">
                {modifier >= 0 ? `+${modifier}` : modifier}
              </span>
              <button
                onClick={() => setModifier(modifier + 1)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Custom Formula Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Manuelle Formel (z. B. 2d20+5)</label>
          <input
            type="text"
            value={customFormula}
            onChange={(e) => setCustomFormula(e.target.value)}
            placeholder="z. B. 1d20+3 oder 3d6"
            className="w-full bg-[#14151c] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Action Button: Roll */}
        <button
          onClick={handleRoll}
          disabled={isRolling}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? 'Würfel rollen...' : 'Jetzt Würfeln'}</span>
        </button>

        {/* Result Box */}
        {rollResult && (
          <div className="bg-[#14161f] border border-amber-500/30 rounded-2xl p-4 text-center space-y-2.5 animate-fade-in shadow-inner">
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Ergebnis [{rollResult.expression}]
            </div>
            
            <div className="text-3xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              {rollResult.total}
            </div>

            <div className="text-xs text-slate-300">
              Einzel-Würfel: <span className="font-mono text-amber-200">[{rollResult.rolls.join(', ')}]</span>
              {rollResult.modifier !== 0 && (
                <span className="text-slate-400"> (Mod: {rollResult.modifier >= 0 ? `+${rollResult.modifier}` : rollResult.modifier})</span>
              )}
            </div>

            {/* Post Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => handlePostResult(false)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-slate-300" />
                <span>In Chat posten</span>
              </button>

              <button
                onClick={() => handlePostResult(true)}
                className="py-2 px-3 rounded-xl bg-lime-600/20 hover:bg-lime-600/30 border border-lime-400/40 text-xs font-bold text-lime-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Bot className="w-3.5 h-3.5 text-lime-400" />
                <span>Posten + Dandelious KI</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
