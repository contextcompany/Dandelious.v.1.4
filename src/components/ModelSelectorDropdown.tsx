import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { ChevronDown, Check, Lock } from 'lucide-react';
import { GEMMA_MODELS } from '../data/models';
import { GemmaModelId, SubscriptionTier } from '../types';
import { playSound } from '../utils/sound';
import { is12hLimitReached, isModelAllowedUnderLimit } from '../utils/usageTracker';

interface ModelSelectorDropdownProps {
  selectedModelId: GemmaModelId;
  onSelectModel: (modelId: GemmaModelId) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  soundEnabled?: boolean;
  userTier?: SubscriptionTier;
  onOpenSettings?: () => void;
}

const TIER_HIERARCHY: Record<string, number> = {
  'Kostenlos': 0,
  'Plus': 1,
  'Expanded': 1,
  'Pro': 2,
  'Ultra': 3,
  'Extreme': 3,
  'Unlimited': 3
};

const isModelLocked = (modelTier: SubscriptionTier | undefined, userTier: SubscriptionTier | undefined): boolean => {
  if (!modelTier || modelTier === 'Kostenlos') return false;
  
  const userLevel = TIER_HIERARCHY[userTier || 'Kostenlos'] ?? 0;
  const requiredLevel = TIER_HIERARCHY[modelTier] ?? 0;
  
  return userLevel < requiredLevel;
};

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  selectedModelId,
  onSelectModel,
  isOpen,
  onToggle,
  onClose,
  soundEnabled = true,
  userTier = 'Kostenlos',
  onOpenSettings
}) => {
  // Find current selected model or fallback to Dandelious Lite
  const currentModel =
    GEMMA_MODELS.find((m) => m.id === selectedModelId) || GEMMA_MODELS[0];

  return (
    <div className="relative inline-block text-left" id="model-selector-wrapper">
      {/* Trigger Button (e.g. "Dandelious Lite ⌵") */}
      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          onToggle();
        }}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white font-normal text-[15.5px] sm:text-[16.5px] transition-all cursor-pointer select-none border border-white/5 shadow-md active:scale-95"
        id="model-selector-trigger"
      >
        <span className="tracking-tight">{currentModel.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -6 }}
              transition={{ type: "spring", damping: 25, stiffness: 420, mass: 0.6 }}
              style={{ transformOrigin: "top left", backgroundColor: "#000000" }}
              className="absolute top-full left-0 mt-2.5 z-[100] w-[310px] sm:w-[330px] bg-black bg-[#000000] rounded-[28px] shadow-[0_30px_90px_rgba(0,0,0,1)] p-3 text-neutral-200 select-none border border-white/20 overflow-hidden opacity-100"
              id="model-selector-dropdown-card"
            >
              <LayoutGroup id="model-selector-dropdown-scope">
                <div className="flex flex-col gap-1">
                  {GEMMA_MODELS.map((model, idx) => {
                  const isSelected = model.id === currentModel.id;
                  const tierLocked = isModelLocked(model.tierRequired, userTier);
                  const limitLocked = is12hLimitReached() && !isModelAllowedUnderLimit(model.id);
                  const locked = tierLocked || limitLocked;

                  return (
                    <button
                      key={`gemma-model-${model.id || idx}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (locked) {
                          if (onOpenSettings) {
                            onClose();
                            onOpenSettings();
                          }
                          return;
                        }
                        playSound('click', soundEnabled);
                        onSelectModel(model.id);
                        onClose();
                      }}
                      className={`relative w-full text-left py-3 px-3 rounded-2xl flex items-start gap-3 transition-colors z-10 ${
                        locked
                          ? 'opacity-35 text-neutral-500 cursor-not-allowed hover:bg-white/[0.02]'
                          : isSelected 
                            ? 'text-white cursor-pointer' 
                            : 'hover:bg-white/10 text-white cursor-pointer'
                      }`}
                    >
                      {isSelected && !locked && (
                        <motion.div
                          layoutId="modelSelectorActivePill"
                          className="absolute inset-0 bg-white/15 rounded-2xl border border-white/20 shadow-md -z-10"
                          transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        />
                      )}
                      {/* Checkmark slot on the left */}
                      <div className="w-5 h-6 flex items-center justify-center shrink-0 pt-0.5">
                        {isSelected ? (
                          <Check className="w-5 h-5 text-white stroke-[2.5]" />
                        ) : null}
                      </div>

                      {/* Title & Subtitle */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-[16px] font-medium tracking-tight leading-tight ${locked ? 'text-neutral-400' : 'text-white'}`}>
                          {model.name}
                        </span>
                        <span className={`text-[13px] font-normal leading-normal mt-0.5 ${locked ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          {model.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
                </div>
              </LayoutGroup>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
