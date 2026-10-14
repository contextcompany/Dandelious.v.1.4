import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Zap, Trophy, Sparkles, Check, 
  Flame, Gift, ArrowUpRight, Clock, History, 
  ShieldCheck, AlertCircle, Compass, MessageSquare, Palette
} from 'lucide-react';
import { 
  ShardsState, 
  SHARD_TIERS, 
  loadShardsState, 
  saveShardsState, 
  redeemShardsForLimitBoost,
  checkAndUpdateDailyShards,
  getTodayDateStr
} from '../utils/shardsTracker';
import { playSound } from '../utils/sound';

export interface ShardsRewardsViewProps {
  onBack: () => void;
  shardsState?: ShardsState;
  onUpdateShardsState?: (newState: ShardsState) => void;
  onOpenAchievements?: () => void;
  soundEnabled?: boolean;
}

type TabType = 'rewards' | 'earn' | 'history';

interface ExtraReward {
  id: string;
  title: string;
  desc: string;
  cost: number;
  icon: 'palette' | 'sparkles' | 'compass';
  unlockedKey: string;
}

const EXTRA_REWARDS: ExtraReward[] = [
  {
    id: 'glow_effect',
    title: 'Neon-Limetten Glow',
    desc: 'Schaltet ein dezentes, elegantes Leuchten für aktive Prompts und Fensterrahmen frei.',
    cost: 35,
    icon: 'palette',
    unlockedKey: 'dandelious_unlocked_lime_glow'
  },
  {
    id: 'dice_theme',
    title: '3D Gold-Würfel Skin',
    desc: 'Exklusive metallische Gold-Textur für das interaktive 3D-Würfelstudio.',
    cost: 45,
    icon: 'sparkles',
    unlockedKey: 'dandelious_unlocked_gold_dice'
  },
  {
    id: 'deep_pass',
    title: 'Deep Research Fast-Pass',
    desc: 'Priorisierte Verarbeitung für komplexe Multi-Quellen Webrecherchen.',
    cost: 60,
    icon: 'compass',
    unlockedKey: 'dandelious_unlocked_fast_pass'
  }
];

export const ShardsRewardsView: React.FC<ShardsRewardsViewProps> = ({
  onBack,
  shardsState: propShardsState,
  onUpdateShardsState,
  onOpenAchievements,
  soundEnabled = true
}) => {
  const [localState, setLocalState] = useState<ShardsState>(() => propShardsState || loadShardsState());
  const [activeTab, setActiveTab] = useState<TabType>('rewards');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Synchronize with parent state
  const state = propShardsState || localState;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleStateChange = (newState: ShardsState) => {
    setLocalState(newState);
    saveShardsState(newState);
    if (onUpdateShardsState) {
      onUpdateShardsState(newState);
    }
  };

  const todayStr = getTodayDateStr();
  const canClaimDaily = state.lastVisitDateStr !== todayStr;

  const handleClaimDaily = () => {
    const result = checkAndUpdateDailyShards();
    handleStateChange(result.state);
    playSound('chime', soundEnabled);
    showToast('+2 Shards für deinen heutigen Besuch gutgeschrieben!');
  };

  const handleRedeemBoost = (cost: number, percent: number) => {
    if (state.shardsCount < cost) {
      playSound('pop', soundEnabled);
      showToast(`Du benötigst mindestens ${cost} Shards für diesen Boost`, 'error');
      return;
    }

    const res = redeemShardsForLimitBoost(cost, percent);
    const updated = loadShardsState();
    handleStateChange(updated);
    playSound(res.success ? 'chime' : 'pop', soundEnabled);
    showToast(res.message, res.success ? 'success' : 'error');
  };

  const handleRedeemCosmetic = (reward: ExtraReward) => {
    if (state.shardsCount < reward.cost) {
      playSound('pop', soundEnabled);
      showToast(`Du benötigst ${reward.cost} Shards für ${reward.title}`, 'error');
      return;
    }

    // Deduct shards
    const updated: ShardsState = {
      ...state,
      shardsCount: state.shardsCount - reward.cost,
      historyLogs: [
        {
          date: todayStr,
          change: -reward.cost,
          reason: `Freigeschaltet: ${reward.title}`
        },
        ...(state.historyLogs || [])
      ]
    };

    try {
      localStorage.setItem(reward.unlockedKey, 'true');
    } catch (e) {}

    handleStateChange(updated);
    playSound('chime', soundEnabled);
    showToast(`Glückwunsch! „${reward.title}“ wurde dauerhaft freigeschaltet.`);
  };

  // Check if limit boost is currently active
  const isBoostActive = useMemo(() => {
    return Boolean(state.limitBoostExpiresAt && state.limitBoostExpiresAt > Date.now());
  }, [state.limitBoostExpiresAt]);

  const boostRemainingHours = useMemo(() => {
    if (!state.limitBoostExpiresAt || state.limitBoostExpiresAt <= Date.now()) return 0;
    const diffMs = state.limitBoostExpiresAt - Date.now();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
  }, [state.limitBoostExpiresAt]);

  // Milestone 50 Shards
  const goalProgress = Math.min(100, Math.max(0, (state.shardsCount / 50) * 100));

  return (
    <div className="min-h-screen bg-[#000000] text-[#eef2e4] font-['DM_Sans',system-ui,sans-serif] pb-24">
      <div className="max-w-[480px] mx-auto px-4.5 pt-4">
        {/* Header */}
        <header className="flex items-center gap-3.5 py-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück"
            className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#eef2e4] hover:border-[#cfe45a]/50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-[22px] font-bold tracking-tight text-[#eef2e4] truncate"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
              Shards & Belohnungen
            </h1>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e271b] border border-[#2b3627] text-xs font-semibold text-[#cfe45a]">
            <Zap className="w-3.5 h-3.5 fill-[#cfe45a]/20" />
            {state.shardsCount}
          </span>
        </header>

        {/* Guthaben Hero Card */}
        <section
          className="mt-3.5 bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5 relative overflow-hidden"
          aria-label="Shards Guthaben"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#cfe45a]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a]">
                <Zap className="w-4 h-4 fill-[#cfe45a]/30" />
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#9aa58f]">
                Aktuelles Guthaben
              </span>
            </div>

            {state.daysActiveCount > 1 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#f0b878] bg-[#2d2214] border border-[#f0b878]/30 px-2.5 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-[#f0b878] fill-[#f0b878]/20" />
                {state.daysActiveCount} Tage Serie
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2.5">
            <span
              className="text-[40px] font-bold text-[#cfe45a] leading-none"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
              {state.shardsCount}
            </span>
            <span className="text-base text-[#9aa58f] font-medium">Shards gesammelt</span>
          </div>

          <p className="text-xs text-[#9aa58f] mt-1.5 leading-relaxed">
            Sammle Shards durch tägliche Besuche und Unterhaltungen. Löse sie gegen sofortige Limit-Wiederherstellungen und Extras ein.
          </p>

          {/* Progress Bar towards 50 milestone */}
          <div className="mt-4 pt-3 border-t border-[#2b3627]">
            <div className="flex justify-between items-center text-xs text-[#9aa58f] mb-1.5">
              <span>Etappenziel (50 Shards)</span>
              <span className="font-semibold text-[#eef2e4]">{state.shardsCount} / 50</span>
            </div>
            <div className="h-2 rounded-full bg-[#1e271b] overflow-hidden">
              <div 
                className="h-full rounded-full bg-[#cfe45a] transition-all duration-500 ease-out"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>

          {/* Daily Reward Claim CTA */}
          {canClaimDaily ? (
            <div className="mt-4 p-3.5 rounded-[16px] bg-[#1e271b] border border-[#cfe45a]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#cfe45a] text-[#1a2307] flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#eef2e4]">Tägliche Belohnung bereit</div>
                  <div className="text-[11px] text-[#cfe45a] font-medium">+2 Shards kostenlos abholen</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClaimDaily}
                className="px-3.5 py-1.5 rounded-full bg-[#cfe45a] text-[#1a2307] text-xs font-bold hover:bg-[#b4cb4b] active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
              >
                Einsammeln
              </button>
            </div>
          ) : (
            <div className="mt-3.5 flex items-center gap-2 text-[11px] text-[#9aa58f]">
              <Check className="w-3.5 h-3.5 text-[#cfe45a]" />
              <span>Heutige +2 Shards bereits eingesammelt. Neuer Bonus ab Mitternacht!</span>
            </div>
          )}

          {/* Active Limit Boost Banner if applicable */}
          {isBoostActive && (
            <div className="mt-3 p-3 rounded-[16px] bg-[#cfe45a]/10 border border-[#cfe45a]/30 flex items-center gap-2.5 text-xs text-[#cfe45a]">
              <Clock className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold">Limit-Boost aktiv:</span> Noch ca. {boostRemainingHours} Stunden gültig.
              </div>
            </div>
          )}
        </section>

        {/* Segment Tabs Navigation */}
        <nav
          className="mt-5 grid grid-cols-3 gap-1 bg-[#161d14] border border-[#2b3627] rounded-[16px] p-1"
          aria-label="Bereiche"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('rewards');
              playSound('click', soundEnabled);
            }}
            className={`min-h-[40px] rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-[#cfe45a] text-[#1a2307] shadow-sm font-bold'
                : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Einlösen
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('earn');
              playSound('click', soundEnabled);
            }}
            className={`min-h-[40px] rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'earn'
                ? 'bg-[#cfe45a] text-[#1a2307] shadow-sm font-bold'
                : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Sammeln
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              playSound('click', soundEnabled);
            }}
            className={`min-h-[40px] rounded-[12px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#cfe45a] text-[#1a2307] shadow-sm font-bold'
                : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Verlauf
          </button>
        </nav>

        {/* TAB CONTENT 1: BELOHNUNGEN EINLÖSEN */}
        {activeTab === 'rewards' && (
          <div className="mt-5 space-y-5">
            <div>
              <h2 className="text-xs uppercase tracking-wider text-[#9aa58f] font-semibold mb-2.5 px-1">
                Nutzungslimit-Boosts
              </h2>

              <div className="space-y-2.5">
                {/* 10 Shards Quick Boost */}
                <div className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3 hover:border-[#cfe45a]/30 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                      <Zap className="w-5 h-5 fill-[#cfe45a]/20" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#eef2e4]">Sofort-Boost</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#cfe45a]/10 border border-[#cfe45a]/30 text-[10px] font-bold text-[#cfe45a]">
                          Beliebt
                        </span>
                      </div>
                      <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                        Verdoppelt dein verfügbares Kontingent sofort für 24 Stunden.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRedeemBoost(10, 50)}
                    disabled={state.shardsCount < 10}
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      state.shardsCount >= 10
                        ? 'bg-[#cfe45a] text-[#1a2307] hover:bg-[#b4cb4b] active:scale-95 shadow-sm'
                        : 'bg-[#1e271b] text-[#9aa58f] opacity-40 cursor-not-allowed'
                    }`}
                  >
                    10 Shards
                  </button>
                </div>

                {/* Tiered recovery options */}
                {SHARD_TIERS.map((tier) => {
                  const canAfford = state.shardsCount >= tier.shardsRequired;
                  return (
                    <div
                      key={tier.shardsRequired}
                      className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3 hover:border-[#cfe45a]/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[#eef2e4]">{tier.title}</div>
                          <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                            Stellt +{tier.limitPercentRecovery}% deines Tageslimits sofort wieder her.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRedeemBoost(tier.shardsRequired, tier.limitPercentRecovery)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-[#cfe45a] text-[#1a2307] hover:bg-[#b4cb4b] active:scale-95 shadow-sm'
                            : 'bg-[#1e271b] text-[#9aa58f] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {tier.shardsRequired} Shards
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exklusive Extras */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-[#9aa58f] font-semibold mb-2.5 px-1">
                Exklusive Upgrades & Themes
              </h2>

              <div className="space-y-2.5">
                {EXTRA_REWARDS.map((reward) => {
                  const isUnlocked = typeof window !== 'undefined' && localStorage.getItem(reward.unlockedKey) === 'true';
                  const canAfford = state.shardsCount >= reward.cost;

                  return (
                    <div
                      key={reward.id}
                      className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3 hover:border-[#cfe45a]/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                          {reward.icon === 'palette' && <Palette className="w-5 h-5" />}
                          {reward.icon === 'sparkles' && <Sparkles className="w-5 h-5" />}
                          {reward.icon === 'compass' && <Compass className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#eef2e4]">{reward.title}</span>
                            {isUnlocked && (
                              <span className="px-2 py-0.5 rounded-full bg-[#cfe45a]/10 border border-[#cfe45a]/30 text-[10px] font-bold text-[#cfe45a]">
                                Freigeschaltet
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                            {reward.desc}
                          </p>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <div className="w-8 h-8 rounded-full bg-[#1e271b] text-[#cfe45a] flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRedeemCosmetic(reward)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-[#cfe45a] text-[#1a2307] hover:bg-[#b4cb4b] active:scale-95 shadow-sm'
                              : 'bg-[#1e271b] text-[#9aa58f] opacity-40 cursor-not-allowed'
                          }`}
                        >
                          {reward.cost} Shards
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: SHARDS VERDIENEN */}
        {activeTab === 'earn' && (
          <div className="mt-5 space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-[#9aa58f] font-semibold mb-2.5 px-1">
              So sammelst du Shards
            </h2>

            {/* Täglicher Login */}
            <div className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                  <Flame className="w-5 h-5 fill-[#cfe45a]/20" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#eef2e4]">Täglicher Besuch</div>
                  <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                    Öffne Dandelious jeden Kalendertag für deine Aktivitätsserie.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1e271b] border border-[#2b3627] text-xs font-bold text-[#cfe45a] shrink-0">
                +2 Shards
              </span>
            </div>

            {/* Chat & Prompts */}
            <div className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#eef2e4]">Fragen & Recherchen</div>
                  <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                    Sende Prompts und nutze die Deep Research Features.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1e271b] border border-[#2b3627] text-xs font-bold text-[#cfe45a] shrink-0">
                +1 pro 10
              </span>
            </div>

            {/* Erfolge abschließen */}
            <div className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[14px] bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#cfe45a] shrink-0 mt-0.5">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#eef2e4]">Erfolge freischalten</div>
                  <p className="text-xs text-[#9aa58f] mt-0.5 leading-relaxed">
                    Entdecke versteckte Meilensteine, Studios und Funktionen.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1e271b] border border-[#2b3627] text-xs font-bold text-[#cfe45a] shrink-0">
                bis zu +10
              </span>
            </div>

            {/* Shortcut to Achievements */}
            {onOpenAchievements && (
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenAchievements();
                }}
                className="w-full mt-2 p-3.5 rounded-[18px] bg-[#1e271b] border border-[#2b3627] hover:border-[#cfe45a]/50 text-xs font-bold text-[#cfe45a] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Alle Erfolge ansehen</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* TAB CONTENT 3: HISTORIE */}
        {activeTab === 'history' && (
          <div className="mt-5 space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-[#9aa58f] font-semibold mb-2.5 px-1">
              Letzte Transaktionen
            </h2>

            {state.historyLogs && state.historyLogs.length > 0 ? (
              <div className="space-y-2">
                {state.historyLogs.map((log, idx) => {
                  const isPositive = log.change > 0;
                  return (
                    <div
                      key={idx}
                      className="bg-[#161d14] border border-[#2b3627] rounded-[18px] p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isPositive
                              ? 'bg-[#cfe45a]/15 text-[#cfe45a] border border-[#cfe45a]/30'
                              : 'bg-[#1e271b] text-[#9aa58f] border border-[#2b3627]'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#eef2e4] truncate">
                            {log.reason}
                          </div>
                          <div className="text-[11px] text-[#9aa58f] mt-0.5">
                            {log.date}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono font-bold shrink-0 ${
                          isPositive ? 'text-[#cfe45a]' : 'text-[#eef2e4]'
                        }`}
                      >
                        {isPositive ? `+${log.change}` : log.change} Shards
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#161d14] border border-[#2b3627] rounded-[22px] p-8 text-center">
                <History className="w-8 h-8 text-[#9aa58f] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#9aa58f]">
                  Noch keine Transaktionen aufgezeichnet. Starte mit täglichen Logins oder Prompts!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div
              className={`px-4 py-2.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border ${
                toastType === 'success'
                  ? 'bg-[#161d14] border-[#cfe45a] text-[#cfe45a]'
                  : 'bg-[#161d14] border-red-500 text-red-400'
              }`}
            >
              {toastType === 'success' ? (
                <Check className="w-4 h-4 text-[#cfe45a]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
