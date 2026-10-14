import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, Check, X, User, Briefcase, Sparkles, Smile,
  BookOpen, Puzzle, Palette, Settings, Activity, Bell, AudioWaveform, Mic, ShieldCheck,
  Lock, Laptop, HardDrive, FileText, History, Info, MoreVertical, Edit2,
  Camera, Upload, Plus, Trash2, ArrowUpRight, ArrowRight, Search, Play, Pause, AlertCircle,
  Database, RefreshCw, Key, Shield, Smartphone, Globe, Sun, Moon, Monitor, Trophy,
  Zap, LogIn, LogOut, CheckCircle2, Copy, ExternalLink, RefreshCcw, Gift
} from 'lucide-react';
import { EngineSettings, SubscriptionTier } from '../types';
import { playSound } from '../utils/sound';
import { openHelpLexikon } from '../utils/openHelp';
import { MemoryOverviewView } from './MemoryOverviewView';
import { loadMemoryTopics } from '../lib/memoryGraphService';
import { getUsageState, get12hResetInfo, getWeeklyResetInfo } from '../utils/usageTracker';
import { loadShardsState, resetShardsState, ShardsState, redeemShardsForLimitBoost } from '../utils/shardsTracker';
import { loadAchievementsState, resetAchievementsState, Achievement } from '../utils/achievementsTracker';
import { validateAccessCardCode } from '../data/accessCards';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { deleteUserAccount } from '../services/userService';
import { useDeviceType } from '../utils/useDeviceType';
import { UsageLimitsView } from './UsageLimitsView';
import { AboPlanView } from './AboPlanView';
import { PersonalizationView } from './PersonalizationView';
import { AchievementsView } from './AchievementsView';
import { ShardsRewardsView } from './ShardsRewardsView';

export type PopupType = 
  | 'account'
  | 'workspace'
  | 'abo'
  | 'api_key'
  | 'shards'
  | 'achievements'
  | 'personalisierung'
  | 'referenzfotos'
  | 'erinnerung'
  | 'erinnerungsuebersicht'
  | 'plugins'
  | 'allgemein'
  | 'limits'
  | 'storage'
  | 'privacy'
  | 'history'
  | null;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (newSettings: EngineSettings) => void;
  initialSubPage?: any;
  initialLexikonArticleId?: string | null;
  currentUser?: any;
  onOpenAuth?: () => void;
  onOpenOnboarding?: () => void;
  onNewChatWithPlugin?: (pluginId: string) => void;
  onOpenPlugins?: () => void;
  chatSessions?: any[];
  onOpenPWAInstall?: () => void;
  onOpenDesktopExporter?: () => void;
  onOpenShowcase?: () => void;
  onOpenHelpLexicon?: () => void;
}

export const ACCENT_COLORS = [
  { id: 'limettengruen', name: 'Limettengrün', hex: '#cfe45a', ink: '#1a2307' },
  { id: 'himmelblau', name: 'Himmelblau', hex: '#7cc4ff', ink: '#06223a' },
  { id: 'lavendel', name: 'Lavendel', hex: '#c2a6ff', ink: '#1f1038' },
  { id: 'koralle', name: 'Koralle', hex: '#ff9a85', ink: '#3a0f06' },
  { id: 'bernstein', name: 'Bernstein', hex: '#ffc24d', ink: '#2e1d00' }
] as const;

export type AccentColorId = typeof ACCENT_COLORS[number]['id'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  initialSubPage = null,
  currentUser = null,
  onOpenAuth,
  onOpenPlugins,
  chatSessions = []
}) => {
  const deviceInfo = useDeviceType();
  const isHandy = (deviceInfo.isMobile && !deviceInfo.isTablet) || (typeof window !== 'undefined' && window.innerWidth < 640);

  const [activePopup, setActivePopup] = useState<PopupType>(initialSubPage as PopupType || null);
  const [localSettings, setLocalSettings] = useState<EngineSettings>(() => ({
    ...settings,
    apiKey: settings.apiKey || settings.customApiKey || '',
    customApiKey: settings.customApiKey || settings.apiKey || '',
    selectedAiProvider: settings.selectedAiProvider || 'gemini',
    userNickname: settings.userNickname || (currentUser ? currentUser.displayName || 'Vincent' : 'Gast'),
    userOccupation: settings.userOccupation || 'Tech & KI-Explorer',
    userAbout: settings.userAbout || '',
    userTier: settings.userTier || 'Kostenlos',
    ttsVoice: settings.ttsVoice || 'Ember',
    ttsRate: settings.ttsRate ?? 1.0,
    searchGroundingEnabled: settings.searchGroundingEnabled ?? true,
    enableSoundEffects: settings.enableSoundEffects ?? true,
  }));

  // Custom accent color
  const [accentColor, setAccentColor] = useState<AccentColorId>(() => {
    try {
      return (localStorage.getItem('dandelious_accent_color') as AccentColorId) || 'limettengruen';
    } catch {
      return 'limettengruen';
    }
  });
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false);
  const [showAccessCardInput, setShowAccessCardInput] = useState(false);
  const [showSwitchConfirmSheet, setShowSwitchConfirmSheet] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<'Kostenlos' | 'Plus' | 'Pro' | 'Ultra' | null>(null);
  const [showComparisonTable, setShowComparisonTable] = useState(false);

  // Personalisierung sub-page states (initialized from localSettings)
  const [toneStyle, setToneStyle] = useState<'Standard' | 'Professionell' | 'Locker' | 'Akademisch' | 'Kreativ'>(
    () => (localSettings.toneStyle as any) || 'Standard'
  );
  const [openToneDropdown, setOpenToneDropdown] = useState<string | null>(null);
  const [warmth, setWarmth] = useState<'Standard' | 'Mehr' | 'Weniger'>(
    () => (localSettings.warmthLevel as any) || 'Standard'
  );
  const [enthusiasm, setEnthusiasm] = useState<'Weniger' | 'Standard' | 'Mehr'>(
    () => (localSettings.enthusiasmLevel as any) || 'Weniger'
  );
  const [headingsLists, setHeadingsLists] = useState<'Mehr' | 'Standard' | 'Weniger'>(
    () => (localSettings.headingsListsLevel as any) || 'Mehr'
  );
  const [emojiLevel, setEmojiLevel] = useState<'Weniger' | 'Standard' | 'Mehr'>(
    () => (localSettings.emojiLevel as any) || 'Weniger'
  );
  const [fastAnswers, setFastAnswers] = useState<boolean>(
    () => localSettings.fastAnswers ?? false
  );
  const [customInstructions, setCustomInstructions] = useState(
    () => localSettings.customInstructionsDetail || localSettings.userAbout || ''
  );
  const [enhancedAnswers, setEnhancedAnswers] = useState<boolean>(
    () => (localSettings as any).enhancedAnswers ?? true
  );
  const [librarySearch, setLibrarySearch] = useState<boolean>(
    () => (localSettings as any).librarySearch ?? false
  );

  // Erinnerung states
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(
    () => localSettings.enableMemories ?? true
  );

  // Allgemein states
  const [appLanguage, setAppLanguage] = useState<string>(
    () => localSettings.appLanguage || 'Deutsch'
  );
  const [appTheme, setAppTheme] = useState<'System (Standard)' | 'Hell' | 'Dunkel'>(() => {
    if (localSettings.theme === 'light') return 'Hell';
    if (localSettings.theme === 'dark') return 'Dunkel';
    return 'System (Standard)';
  });
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(
    () => localSettings.hapticFeedback ?? true
  );
  const [webSearchAuto, setWebSearchAuto] = useState<boolean>(
    () => localSettings.webSearchAuto ?? true
  );
  const [enableSoundEffects, setEnableSoundEffects] = useState<boolean>(
    () => localSettings.enableSoundEffects ?? true
  );
  const [fontScale, setFontScale] = useState<'kompakt' | 'standard' | 'gross'>(
    () => (localSettings.fontScale as any) || 'standard'
  );
  const [fontFamily, setFontFamily] = useState<'jakarta' | 'inter' | 'mono'>(
    () => (localSettings.fontFamily as any) || 'jakarta'
  );
  const [boldMode, setBoldMode] = useState<boolean>(
    () => localSettings.boldMode ?? false
  );

  // Privacy states
  const [improveModelForAll, setImproveModelForAll] = useState(true);

  // Reference photos
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'face' | 'body' | null>(null);

  // Dandelious API Key & Access Cards
  const [customApiKeyInput, setCustomApiKeyInput] = useState(() => localSettings.customApiKey || localSettings.apiKey || '');
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'claude' | 'deepseek'>(
    () => (localSettings.selectedAiProvider as any) || 'gemini'
  );
  const [accessCardInput, setAccessCardInput] = useState('');
  const [accessCardFeedback, setAccessCardFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedAboPlan, setSelectedAboPlan] = useState<'Kostenlos' | 'Plus' | 'Pro' | 'Ultra'>('Pro');
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountDeleteProgress, setAccountDeleteProgress] = useState<string | null>(null);

  // Trackers
  const [shardsState, setShardsState] = useState<ShardsState>(() => loadShardsState());
  const [achievementsState, setAchievementsState] = useState<Achievement[]>(() => loadAchievementsState());
  const [usageState, setUsageState] = useState(getUsageState);

  useEffect(() => {
    if (initialSubPage) {
      setActivePopup(initialSubPage as PopupType);
    }
  }, [initialSubPage]);

  useEffect(() => {
    setShardsState(loadShardsState());
    setAchievementsState(loadAchievementsState());
    setUsageState(getUsageState());
  }, [isOpen, activePopup]);

  const handleResetProgress = () => {
    const freshShards = resetShardsState();
    const freshAchievements = resetAchievementsState();
    setShardsState(freshShards);
    setAchievementsState(freshAchievements);
    updateSetting('shardsCount', 0);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  useEffect(() => {
    const chosen = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];
    document.documentElement.style.setProperty('--accent', chosen.hex);
    document.documentElement.style.setProperty('--accent-ink', chosen.ink);
  }, [accentColor]);

  if (!isOpen) return null;

  const updateSetting = (key: keyof EngineSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  // Immediate setting actions that also update local state & apply to DOM / localStorage
  const handleSelectTone = (t: typeof toneStyle) => {
    setToneStyle(t);
    updateSetting('toneStyle', t);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectWarmth = (w: typeof warmth) => {
    setWarmth(w);
    updateSetting('warmthLevel', w);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectEnthusiasm = (e: typeof enthusiasm) => {
    setEnthusiasm(e);
    updateSetting('enthusiasmLevel', e);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectHeadingsLists = (l: typeof headingsLists) => {
    setHeadingsLists(l);
    updateSetting('headingsListsLevel', l);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectEmojiLevel = (em: typeof emojiLevel) => {
    setEmojiLevel(em);
    updateSetting('emojiLevel', em);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleToggleFastAnswers = (fa: boolean) => {
    setFastAnswers(fa);
    updateSetting('fastAnswers', fa);
  };

  const handleCustomInstructionsChange = (val: string) => {
    setCustomInstructions(val);
    updateSetting('userAbout', val);
    updateSetting('customInstructionsDetail', val);
  };

  const handleToggleEnhancedAnswers = (val: boolean) => {
    setEnhancedAnswers(val);
    updateSetting('enhancedAnswers' as any, val);
  };

  const handleToggleLibrarySearch = (val: boolean) => {
    setLibrarySearch(val);
    updateSetting('librarySearch' as any, val);
  };

  const handleToggleMemory = (val: boolean) => {
    setMemoryEnabled(val);
    updateSetting('enableMemories', val);
    try {
      localStorage.setItem('dandelious_memory_enabled', JSON.stringify(val));
    } catch {}
  };

  const handleSelectTheme = (t: typeof appTheme) => {
    setAppTheme(t);
    const mapped = t === 'Hell' ? 'light' : t === 'Dunkel' ? 'dark' : 'system';
    updateSetting('theme', mapped as any);
    if (typeof document !== 'undefined') {
      if (mapped === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectLanguage = (lang: string) => {
    setAppLanguage(lang);
    updateSetting('appLanguage', lang);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleToggleHaptic = (val: boolean) => {
    setHapticFeedback(val);
    updateSetting('hapticFeedback', val);
    if (val && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const handleToggleWebSearch = (val: boolean) => {
    setWebSearchAuto(val);
    updateSetting('webSearchAuto', val);
    updateSetting('searchGroundingEnabled', val);
  };

  const handleToggleSoundEffects = (val: boolean) => {
    setEnableSoundEffects(val);
    updateSetting('enableSoundEffects', val);
  };

  const handleSelectFontScale = (scale: 'kompakt' | 'standard' | 'gross') => {
    setFontScale(scale);
    const mapped = scale === 'kompakt' ? 'small' : scale === 'gross' ? 'large' : 'standard';
    updateSetting('fontScale', mapped);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleSelectFontFamily = (family: 'jakarta' | 'inter' | 'mono') => {
    setFontFamily(family);
    const mapped = family === 'mono' ? 'jetbrains' : 'jakarta';
    updateSetting('fontFamily', mapped);
    setOpenToneDropdown(null);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleToggleBoldMode = (val: boolean) => {
    setBoldMode(val);
    updateSetting('boldMode', val);
  };

  const handleSelectAccent = (colorId: string) => {
    const chosen = ACCENT_COLORS.find(c => c.id === colorId) || ACCENT_COLORS[0];
    setAccentColor(chosen.id);
    try {
      localStorage.setItem('dandelious_accent_color', chosen.id);
      document.documentElement.style.setProperty('--accent', chosen.hex);
      document.documentElement.style.setProperty('--accent-ink', chosen.ink);
    } catch {}
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleTriggerUpload = (target: 'face' | 'body') => {
    setUploadTarget(target);
    photoInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (uploadTarget === 'face') setFacePhoto(url);
    if (uploadTarget === 'body') setBodyPhoto(url);
    playSound('pop', localSettings.enableSoundEffects ?? true);
  };

  const handleRedeemAccessCard = () => {
    if (!accessCardInput.trim()) return;
    const cleanCode = accessCardInput.trim().toUpperCase().replace(/[\s-]/g, '');
    const card = validateAccessCardCode(cleanCode);

    if (card && card.isValid && card.tier) {
      updateSetting('userTier', card.tier);
      setAccessCardFeedback({
        type: 'success',
        message: card.message || `Erfolgreich eingelöst! Dandelious ${card.tier} aktiviert.`
      });
      setAccessCardInput('');
      playSound('chime', localSettings.enableSoundEffects ?? true);
    } else {
      setAccessCardFeedback({
        type: 'error',
        message: card?.message || 'Ungültiger Zugangskarten-Code. Bitte prüfe die Eingabe.'
      });
      playSound('pop', localSettings.enableSoundEffects ?? true);
    }
  };

  const handleSaveApiKey = () => {
    const key = customApiKeyInput.trim();
    updateSetting('customApiKey', key);
    updateSetting('apiKey', key);
    updateSetting('selectedAiProvider', selectedProvider);
    playSound('chime', localSettings.enableSoundEffects ?? true);
    setActivePopup(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      playSound('pop', localSettings.enableSoundEffects ?? true);
      setActivePopup(null);
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    playSound('pop', localSettings.enableSoundEffects ?? true);
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount(currentUser, (step) => {
        setAccountDeleteProgress(step);
      });
      setShowDeleteAccountConfirm(false);
      setActivePopup(null);
      playSound('click', localSettings.enableSoundEffects ?? true);
    } catch (err: any) {
      console.error('Account deletion error:', err);
      alert(err.code === 'auth/requires-recent-login'
        ? 'Sicherheits-Hinweis: Bitte melde dich kurz erneut an und klicke dann erneut auf "Löschen".'
        : (err.message || 'Fehler beim Löschen des Accounts.')
      );
    } finally {
      setIsDeletingAccount(false);
      setAccountDeleteProgress(null);
    }
  };

  // Helper toggle component matching the exact iOS/Android native pill switch
  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => {
        playSound('click', localSettings.enableSoundEffects ?? true);
        onChange(!checked);
      }}
      className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer shrink-0 p-0.5 outline-none ${
        checked ? 'bg-[#C5DC57]' : 'bg-[#2c2c2e]'
      }`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`w-6 h-6 rounded-full shadow-md ${checked ? 'bg-black ml-auto' : 'bg-[#8e8e93] mr-auto'}`}
      />
    </button>
  );

  // RENDER SUBPAGES
  const renderSubPage = () => {
    // 1. DANDELIOUS PLÄNE (PLUS, PRO, ULTRA) & ZUGANGSKARTEN
    if (activePopup === 'abo') {
      return (
        <AboPlanView
          currentTier={localSettings.userTier || 'Kostenlos'}
          onBack={() => setActivePopup(null)}
          onOpenLimits={() => setActivePopup('limits')}
          onSwitchPlan={(newTier) => {
            if (newTier === 'Free' || newTier === 'Kostenlos') {
              updateSetting('userTier', 'Kostenlos');
              playSound('chime', localSettings.enableSoundEffects ?? true);
            }
          }}
          onRedeemAccessCard={(code) => {
            const cleanCode = code.trim().toUpperCase().replace(/[\s-]/g, '');
            const card = validateAccessCardCode(cleanCode);
            if (card && card.isValid && card.tier) {
              updateSetting('userTier', card.tier);
              playSound('chime', localSettings.enableSoundEffects ?? true);
              return { success: true, message: card.message || `Erfolgreich eingelöst! Dandelious ${card.tier} aktiviert.`, tier: card.tier };
            }
            playSound('pop', localSettings.enableSoundEffects ?? true);
            return { success: false, message: card?.message || 'Ungültiger Zugangskarten-Code.' };
          }}
        />
      );
    }
    
    // 2. DANDELIOUS API-KEY & PROVIDER
    if (activePopup === 'api_key') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">API-Key & Provider</h2>
            <div className="w-9 h-9" />
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-[24px] bg-[#1c1c1e] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Key className="w-4 h-4 text-[#C5DC57]" />
              <span>Direkte Provider-Anbindung mit eigenem Key</span>
            </div>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Trage deinen eigenen Google AI Studio API-Key ein, um Anfragen direkt über dein eigenes Entwickler-Konto zu leiten. Beachte: Raten- und Kontingentlimits deines Anbieters gelten weiterhin.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#C5DC57] hover:text-[#d7ec78] underline underline-offset-4 pt-1 font-medium"
            >
              <span>API-Key bei Google AI Studio verwalten</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Provider Selection */}
          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2.5">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Bevorzugter Provider</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'gemini', name: 'Google Gemini (Standard)' },
                { id: 'openai', name: 'OpenAI (GPT-4o)' },
                { id: 'claude', name: 'Anthropic Claude' },
                { id: 'deepseek', name: 'DeepSeek Reasoner' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id as any)}
                  className={`p-3 rounded-2xl text-left text-xs font-medium border transition-all cursor-pointer ${
                    selectedProvider === p.id 
                      ? 'bg-[#C5DC57]/15 text-white border-[#C5DC57]/50 ring-1 ring-[#C5DC57]/30' 
                      : 'bg-black/30 text-neutral-400 border-white/5 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Key Input */}
          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2">
            <label className="text-xs font-semibold text-neutral-400 block">API-Key eingeben</label>
            <input
              type="password"
              value={customApiKeyInput}
              onChange={(e) => setCustomApiKeyInput(e.target.value)}
              placeholder="AIzaSy... oder sk-..."
              className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5DC57]/50"
            />
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setCustomApiKeyInput('');
                  updateSetting('customApiKey', '');
                  updateSetting('apiKey', '');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Key entfernen
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2.5 rounded-full bg-[#C5DC57] hover:bg-[#b4cb4b] text-black font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Speichern & Übernehmen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 3. SHARDS & FITNESS-RING (Shards & Belohnungen Dandelious View)
    if (activePopup === 'shards') {
      return (
        <ShardsRewardsView
          onBack={() => setActivePopup(null)}
          shardsState={shardsState}
          onUpdateShardsState={(updated) => setShardsState(updated)}
          onOpenAchievements={() => setActivePopup('achievements')}
          soundEnabled={localSettings.enableSoundEffects ?? true}
        />
      );
    }

    // 4. ERFOLGE (ACHIEVEMENTS)
    if (activePopup === 'achievements') {
      return (
        <AchievementsView
          onBack={() => setActivePopup(null)}
          achievements={achievementsState}
        />
      );
    }

    // 5. KONTO / PROFIL & AUTHENTIFIZIERUNG
    if (activePopup === 'account') {
      return (
        <div className="space-y-4 pb-12 font-['DM_Sans']">
          <div className="flex items-center justify-between pb-2 border-b border-[#2b3627]">
            <button
              onClick={() => setActivePopup(null)}
              className="w-10 h-10 rounded-full bg-[#161d14] hover:bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#9aa58f] hover:text-[#eef2e4] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold font-['Bricolage_Grotesque'] text-[#eef2e4]">Konto & Cloud-Sync</h2>
            <div className="w-10 h-10" />
          </div>

          {currentUser ? (
            /* Angemeldeter Zustand */
            <div className="bg-[#161d14] rounded-[26px] p-5 border border-[#2b3627] space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1e271b] border-2 border-[#cfe45a]/50 flex items-center justify-center text-[#cfe45a] font-bold text-lg">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold text-[#eef2e4] truncate">
                    {currentUser.displayName || localSettings.userNickname || 'Dandelious-Nutzer'}
                  </div>
                  <div className="text-xs text-[#9aa58f] mt-0.5 truncate">{currentUser.email}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full bg-[#cfe45a]/15 text-[#cfe45a] font-semibold border border-[#cfe45a]/30">
                      <Check className="w-3 h-3" />
                      {localSettings.userTier || 'Kostenlos'}
                    </span>
                    <span className="text-[10px] text-[#9aa58f] px-2 py-0.5 rounded-full bg-[#0e130c] border border-[#2b3627]">
                      Cloud aktiv
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0e130c] border border-[#2b3627] text-xs text-[#9aa58f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Sichere Cloud-Speicherung:</span>
                  <span className="text-[#cfe45a] font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Aktiv
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Benutzer-ID (UID):</span>
                  <code className="text-[#eef2e4]">{currentUser.uid.slice(0, 12)}...</code>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2b3627] space-y-2">
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth();
                    setActivePopup(null);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#1e271b] hover:bg-[#283424] text-[#eef2e4] border border-[#2b3627] font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-[#cfe45a]" />
                  <span>Konto verwalten & Passwort ändern</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-2xl bg-[#1e271b] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-[#2b3627] hover:border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Abmelden</span>
                </button>

                {!showDeleteAccountConfirm ? (
                  <button
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    className="w-full py-2 text-center text-[11px] text-rose-400/80 hover:text-rose-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Konto & Cloud-Daten DSGVO-konform löschen</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-600/30 text-center space-y-2.5 mt-2">
                    <p className="text-xs text-rose-200 leading-relaxed">
                      Möchtest du dein Konto und alle synchronisierten Chats, Einstellungen und Profildaten wirklich unwiderruflich löschen?
                    </p>
                    {accountDeleteProgress && (
                      <p className="text-[11px] text-amber-300 font-medium">
                        {accountDeleteProgress}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isDeletingAccount ? 'Wird gelöscht...' : 'Endgültig löschen'}
                      </button>
                      <button
                        onClick={() => setShowDeleteAccountConfirm(false)}
                        disabled={isDeletingAccount}
                        className="px-3.5 py-2 rounded-xl bg-[#1e271b] text-[#9aa58f] hover:text-[#eef2e4] text-xs font-medium border border-[#2b3627] transition-colors cursor-pointer"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Gast-Zustand */
            <div className="bg-[#161d14] rounded-[26px] p-6 border border-[#2b3627] space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1e271b] border border-[#2b3627] mx-auto flex items-center justify-center text-[#cfe45a]">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold font-['Bricolage_Grotesque'] text-[#eef2e4]">Gast-Modus aktiv</h3>
                <p className="text-xs text-[#9aa58f] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  Erstelle ein kostenloses Konto mit E-Mail & Passwort, um deine Chats, Shards und personalisierten Einstellungen geräteübergreifend in der Cloud zu sichern.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth();
                    setActivePopup(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#cfe45a] hover:bg-[#b9d047] text-[#1a2307] font-['Bricolage_Grotesque'] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Jetzt anmelden oder registrieren</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 6. WORKSPACE
    if (activePopup === 'workspace') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Workspace</h2>
            <div className="w-9 h-9" />
          </div>

          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/5 space-y-2">
            <div className="text-[15px] font-medium text-white">Persönlicher Workspace</div>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              In deinem Workspace laufen alle deine Chats, Codeprojekte, Notizen und Mediengenerierungen isoliert zusammen.
            </p>
          </div>
        </div>
      );
    }

    // 7. PERSONALISIERUNG (Limettengrün Dandelious Designsystem)
    if (activePopup === "personalisierung") {
      return (
        <PersonalizationView
          onBack={() => setActivePopup(null)}
          soundEnabled={localSettings.enableSoundEffects ?? true}
          toneStyle={toneStyle as any}
          onSelectTone={handleSelectTone}
          warmth={warmth}
          onSelectWarmth={handleSelectWarmth}
          enthusiasm={enthusiasm}
          onSelectEnthusiasm={handleSelectEnthusiasm}
          headingsLists={headingsLists}
          onSelectHeadingsLists={handleSelectHeadingsLists}
          emojiLevel={emojiLevel}
          onSelectEmojiLevel={handleSelectEmojiLevel}
          fastAnswers={fastAnswers}
          onToggleFastAnswers={handleToggleFastAnswers}
          enhancedAnswers={enhancedAnswers}
          onToggleEnhancedAnswers={handleToggleEnhancedAnswers}
          librarySearch={librarySearch}
          onToggleLibrarySearch={handleToggleLibrarySearch}
          customInstructions={customInstructions}
          onChangeCustomInstructions={handleCustomInstructionsChange}
          userNickname={localSettings.userNickname || ""}
          onChangeUserNickname={(val) => {
            updateSetting("userNickname", val);
          }}
          userOccupation={localSettings.userOccupation || ""}
          onChangeUserOccupation={(val) => {
            updateSetting("userOccupation", val);
          }}
          userAbout={localSettings.userAbout || ""}
          onChangeUserAbout={(val) => {
            updateSetting("userAbout", val);
          }}
          onOpenReferencePhotos={() => setActivePopup("referenzfotos")}
          onResetToDefaults={() => {
            handleSelectTone("Standard");
            handleSelectWarmth("Standard");
            handleSelectEnthusiasm("Weniger");
            handleSelectHeadingsLists("Mehr");
            handleSelectEmojiLevel("Weniger");
            handleToggleFastAnswers(false);
            handleToggleEnhancedAnswers(true);
            handleToggleLibrarySearch(false);
            handleCustomInstructionsChange("");
          }}
        />
      );
    }

    // 8. REFERENZFOTOS (matching video 00:39)
    if (activePopup === 'referenzfotos') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup('personalisierung')}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Referenzfotos</h2>
            <div className="w-9 h-9" />
          </div>

          <p className="text-xs text-[#8e8e93] leading-relaxed">
            Diese Fotos helfen Dandelious, Bilder zu erstellen, die dir ähnlicher sehen.
          </p>

          <input
            type="file"
            ref={photoInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="bg-[#1c1c1e] rounded-[24px] border border-white/5 divide-y divide-white/5 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[15px] font-medium text-white">Gesichtsfoto</div>
                <div className="text-xs text-[#8e8e93] mt-0.5">Klar und frontal</div>
              </div>
              <button
                onClick={() => handleTriggerUpload('face')}
                className="px-3.5 py-1.5 rounded-full bg-[#C5DC57]/15 hover:bg-[#C5DC57]/25 text-[#C5DC57] border border-[#C5DC57]/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                {facePhoto ? 'Ersetzen' : 'Hinzufügen'}
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[15px] font-medium text-white">Ganzkörperfoto</div>
                <div className="text-xs text-[#8e8e93] mt-0.5">Scharf und vollständig im Bild</div>
              </div>
              <button
                onClick={() => handleTriggerUpload('body')}
                className="px-3.5 py-1.5 rounded-full bg-[#C5DC57]/15 hover:bg-[#C5DC57]/25 text-[#C5DC57] border border-[#C5DC57]/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                {bodyPhoto ? 'Ersetzen' : 'Hinzufügen'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#8e8e93] text-center pt-2">
            Verwende klare, aktuelle Fotos, die bei gutem Licht aufgenommen wurden.
          </p>
        </div>
      );
    }

    // 9. ERINNERUNG (matching video 00:50)
    if (activePopup === 'erinnerung') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Erinnerung</h2>
            <div className="w-9 h-9" />
          </div>

          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-medium text-white">Erinnerung aktivieren</span>
              <ToggleSwitch checked={memoryEnabled} onChange={handleToggleMemory} />
            </div>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Lass Dandelious dein Erlebnis anhand deiner Chats, Dateien und gelernten Daten personalisieren.
            </p>
          </div>

          <div 
            onClick={() => {
              playSound('click', localSettings.enableSoundEffects ?? true);
              setActivePopup('erinnerungsuebersicht');
            }}
            className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2 cursor-pointer hover:bg-[#222226] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-medium text-white">Erinnerungsübersicht</span>
              <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
            </div>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Sieh dir eine Übersicht darüber an, was Dandelious über dich gelernt hat.
            </p>
          </div>

          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-3">
            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-1">Dein Nickname</label>
              <input
                type="text"
                value={localSettings.userNickname || ''}
                onChange={(e) => updateSetting('userNickname', e.target.value)}
                placeholder="Nickname"
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-1">Dein Beruf</label>
              <input
                type="text"
                value={localSettings.userOccupation || ''}
                onChange={(e) => updateSetting('userOccupation', e.target.value)}
                placeholder="Ingenieur:in, Student:in usw."
                className="w-full bg-[#121214] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/25"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-400 block mb-1">Mehr über dich</label>
              <textarea
                rows={3}
                value={localSettings.userAbout || ''}
                onChange={(e) => updateSetting('userAbout', e.target.value)}
                placeholder="Interessen, Werte oder Präferenzen, die berücksichtigt werden sollen"
                className="w-full bg-[#121214] border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/25 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      );
    }

    // 10. ERINNERUNGSÜBERSICHT
    if (activePopup === 'erinnerungsuebersicht') {
      return (
        <div className="h-full">
          <MemoryOverviewView 
            onBack={() => setActivePopup('erinnerung')} 
            chatSessions={chatSessions} 
          />
        </div>
      );
    }

    // 11. ALLGEMEIN (Alle Einstellungen funktionsfähig)
    if (activePopup === 'allgemein') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Allgemein</h2>
            <div className="w-9 h-9" />
          </div>

          <div className="bg-[#1c1c1e] rounded-[24px] border border-white/10 divide-y divide-white/5 overflow-hidden">
            {/* Sprache */}
            <div className="p-4">
              <div 
                onClick={() => setOpenToneDropdown(openToneDropdown === 'lang' ? null : 'lang')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-[15px] font-medium text-white">Sprache</div>
                  <div className="text-xs text-[#8e8e93] mt-0.5">{appLanguage}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#8e8e93] transition-transform ${openToneDropdown === 'lang' ? 'rotate-180 text-white' : ''}`} />
              </div>
              <AnimatePresence>
                {openToneDropdown === 'lang' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-3 mt-3 border-t border-white/5 space-y-1 overflow-hidden"
                  >
                    {['Deutsch', 'English', 'Français', 'Español'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleSelectLanguage(lang)}
                        className="w-full px-3 py-2 rounded-xl text-left text-sm text-white hover:bg-white/5 flex items-center justify-between cursor-pointer"
                      >
                        <span>{lang}</span>
                        {appLanguage === lang && <Check className="w-4 h-4 text-[#C5DC57]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Darstellung */}
            <div className="p-4">
              <div 
                onClick={() => setOpenToneDropdown(openToneDropdown === 'theme' ? null : 'theme')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-neutral-300" />
                  <span className="text-[15px] font-medium text-white">Darstellung</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8e8e93]">{appTheme}</span>
                  <ChevronDown className={`w-4 h-4 text-[#8e8e93] transition-transform ${openToneDropdown === 'theme' ? 'rotate-180 text-white' : ''}`} />
                </div>
              </div>
              <AnimatePresence>
                {openToneDropdown === 'theme' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-3 mt-3 border-t border-white/5 space-y-1 overflow-hidden"
                  >
                    {(['System (Standard)', 'Hell', 'Dunkel'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleSelectTheme(t)}
                        className="w-full px-3 py-2 rounded-xl text-left text-sm text-white hover:bg-white/5 flex items-center justify-between cursor-pointer"
                      >
                        <span>{t}</span>
                        {appTheme === t && <Check className="w-4 h-4 text-[#C5DC57]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Schriftgröße */}
            <div className="p-4">
              <div 
                onClick={() => setOpenToneDropdown(openToneDropdown === 'font_scale' ? null : 'font_scale')}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-[15px] font-medium text-white">Schriftgröße</div>
                  <div className="text-xs text-[#8e8e93] mt-0.5 capitalize">{fontScale}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#8e8e93] transition-transform ${openToneDropdown === 'font_scale' ? 'rotate-180 text-white' : ''}`} />
              </div>
              <AnimatePresence>
                {openToneDropdown === 'font_scale' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-3 mt-3 border-t border-white/5 space-y-1 overflow-hidden"
                  >
                    {[
                      { id: 'kompakt', label: 'Kompakt' },
                      { id: 'standard', label: 'Standard' },
                      { id: 'gross', label: 'Groß' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectFontScale(s.id as any)}
                        className="w-full px-3 py-2 rounded-xl text-left text-sm text-white hover:bg-white/5 flex items-center justify-between cursor-pointer"
                      >
                        <span>{s.label}</span>
                        {fontScale === s.id && <Check className="w-4 h-4 text-[#C5DC57]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Soundeffekte */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[15px] font-medium text-white">Soundeffekte</span>
                <p className="text-xs text-[#8e8e93] mt-0.5">Akustisches Feedback bei Aktionen</p>
              </div>
              <ToggleSwitch checked={enableSoundEffects} onChange={handleToggleSoundEffects} />
            </div>

            {/* Haptisches Feedback */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[15px] font-medium text-white">Haptisches Feedback</span>
                <p className="text-xs text-[#8e8e93] mt-0.5">Vibration bei Interaktionen auf Mobilgeräten</p>
              </div>
              <ToggleSwitch checked={hapticFeedback} onChange={handleToggleHaptic} />
            </div>

            {/* Fetter Text */}
            <div className="p-4 flex items-center justify-between">
              <span className="text-[15px] font-medium text-white">Fettgedruckter Text</span>
              <ToggleSwitch checked={boldMode} onChange={handleToggleBoldMode} />
            </div>
          </div>

          {/* Websuche */}
          <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#8e8e93] uppercase tracking-wider font-semibold">Automatisch verwenden</div>
                <div className="text-[15px] font-medium text-white mt-0.5">Websuche</div>
              </div>
              <ToggleSwitch checked={webSearchAuto} onChange={handleToggleWebSearch} />
            </div>
            <p className="text-xs text-[#8e8e93] leading-relaxed">
              Erlaube, dass im Internet nach Echtzeitinformationen gesucht wird.
            </p>
          </div>
        </div>
      );
    }

    // 12. NUTZUNG UND GRENZWERTE (Circular Gauge & Cycle Timer)
    if (activePopup === 'limits') {
      return (
        <UsageLimitsView
          userTier={localSettings.userTier || 'Kostenlos'}
          customApiKey={localSettings.customApiKey || localSettings.apiKey || ''}
          onSaveApiKey={(key) => {
            updateSetting('customApiKey', key);
            updateSetting('apiKey', key);
            playSound('chime', localSettings.enableSoundEffects ?? true);
          }}
          onRemoveApiKey={() => {
            updateSetting('customApiKey', '');
            updateSetting('apiKey', '');
            playSound('pop', localSettings.enableSoundEffects ?? true);
          }}
          onBack={() => setActivePopup(null)}
          onGoToUpgrade={() => setActivePopup('abo')}
          soundEnabled={localSettings.enableSoundEffects ?? true}
        />
      );
    }

    // 13. SPEICHER & MEDIATHEK (Clean Monochrome)
    if (activePopup === 'storage') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex justify-center pt-1 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Speicher</h2>
            <div className="w-9 h-9" />
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-sm font-semibold text-white text-center">
              183 MB von 512 MB verwendet
            </div>
            <div className="w-full h-2 rounded-full bg-[#2c2c2e] overflow-hidden flex">
              <div className="h-full bg-white rounded-full" style={{ width: '35%' }} />
              <div className="h-full bg-neutral-500 rounded-full" style={{ width: '3%' }} />
            </div>
          </div>

          <div className="bg-[#1c1c1e] rounded-[24px] border border-white/10 divide-y divide-white/5 overflow-hidden mt-4">
            <div className="p-4 flex items-center justify-between cursor-pointer">
              <span className="text-[15px] font-medium text-white">Dateien & Mediathek</span>
              <span className="text-xs text-[#8e8e93] flex items-center gap-1">
                178 MB <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="p-4 flex items-center justify-between cursor-pointer">
              <span className="text-[15px] font-medium text-white">Bilder & MotionPicture</span>
              <span className="text-xs text-[#8e8e93] flex items-center gap-1">
                5,1 MB <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 14. DATENSCHUTZCENTER & BACKUP (ohne Werbung)
    if (activePopup === 'privacy') {
      return (
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <button
              onClick={() => setActivePopup(null)}
              className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">Datenschutzcenter</h2>
            <div className="w-9 h-9" />
          </div>

          <p className="text-xs text-[#8e8e93] leading-relaxed">
            Deine Daten gehören dir. Dandelious speichert Chats lokal auf deinem Gerät und synchronisiert sie verschlüsselt nur auf Wunsch.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 flex flex-col justify-between min-h-[105px]">
              <ShieldCheck className="w-5 h-5 text-neutral-300" />
              <div className="text-xs font-semibold text-white mt-3">Wir verkaufen deine Daten nicht</div>
            </div>
            <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 flex flex-col justify-between min-h-[105px]">
              <Check className="w-5 h-5 text-white" />
              <div className="text-xs font-semibold text-white mt-3">Keine Werbe-Tracker</div>
            </div>
          </div>

          <div className="space-y-1 pt-3">
            <div className="text-xs text-[#8e8e93] px-1 font-medium">Datenkontrollen</div>
            <div className="bg-[#1c1c1e] rounded-[24px] p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-white">Das Modell lokal verbessern</span>
                <ToggleSwitch checked={improveModelForAll} onChange={setImproveModelForAll} />
              </div>
              <p className="text-xs text-[#8e8e93] leading-relaxed">
                Erlaube lokale Kontextoptimierungen auf deinem Gerät für flüssigere Antworten.
              </p>
            </div>

            <div className="bg-[#1c1c1e] rounded-[24px] border border-white/10 divide-y divide-white/5 overflow-hidden mt-2">
              <div 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(chatSessions, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dandelious_backup_${Date.now()}.json`;
                  a.click();
                  playSound('chime', localSettings.enableSoundEffects ?? true);
                }}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span className="text-[15px] font-medium text-white">Chat-Verlauf & Daten exportieren</span>
                <ChevronRight className="w-4 h-4 text-[#8e8e93]" />
              </div>

              <div 
                onClick={() => {
                  if (confirm('Möchtest du wirklich alle lokalen Daten und Chats zurücksetzen?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="p-4 flex items-center justify-between cursor-pointer text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <span className="text-[15px] font-medium">Alle lokalen Daten löschen</span>
                <ChevronRight className="w-4 h-4 text-rose-400/60" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback
    return (
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <button
            onClick={() => setActivePopup(null)}
            className="w-9 h-9 rounded-full bg-[#1c1c1e] hover:bg-[#252528] flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-white">Einstellungen</h2>
          <div className="w-9 h-9" />
        </div>
        <p className="text-sm text-neutral-400">Diese Ansicht wird geladen...</p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
        isHandy ? "p-0 bg-black" : "p-2 sm:p-6 bg-black/85 backdrop-blur-md"
      }`}>
        <motion.div
          key="dandelious-settings-modal-card"
          initial={{ opacity: 0, scale: isHandy ? 1 : 0.96, y: isHandy ? 20 : 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: isHandy ? 1 : 0.96, y: isHandy ? 20 : 15 }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className={`w-full bg-[#000000] text-[#eef2e4] flex flex-col overflow-hidden relative font-['DM_Sans',system-ui,sans-serif] ${
            isHandy
              ? "h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none"
              : "max-w-[480px] max-h-[92vh] h-[860px] rounded-[38px] border border-[#2b3627] shadow-[0_30px_90px_rgba(0,0,0,0.98)]"
          }`}
        >
          {/* Scrollable Container */}
          <div className={`flex-1 overflow-y-auto px-4.5 py-4 bg-[#000000] text-[#eef2e4] ${
            isHandy ? "pb-[max(env(safe-area-inset-bottom,0px),24px)]" : "pb-10"
          }`}>
            {activePopup ? (
              renderSubPage()
            ) : (
              /* DANDELIOUS EINSTELLUNGEN - DESIGN SYSTEM */
              <div className="w-full max-w-[480px] mx-auto text-[#eef2e4] font-['DM_Sans',system-ui,sans-serif]">
                {/* Header */}
                <header className="flex items-center justify-between gap-3.5 pt-1 pb-2">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Zurück"
                    className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#eef2e4] hover:border-[#cfe45a]/50 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h1
                    className="text-[22px] font-bold text-[#eef2e4] flex-1 tracking-tight"
                    style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                  >
                    Einstellungen
                  </h1>
                  <button
                    type="button"
                    onClick={() => openHelpLexikon()}
                    aria-label="Info"
                    className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#9aa58f] hover:text-[#eef2e4] hover:border-[#cfe45a]/50 transition-colors cursor-pointer"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </header>

                {/* Profil */}
                <section className="mt-3.5 bg-[#161d14] border border-[#2b3627] rounded-[26px] p-[18px] flex items-center gap-4">
                  <div className="relative flex-none w-16 h-16 rounded-full bg-[#1e271b] border border-[#2b3627] flex items-center justify-center text-[#9aa58f]">
                    {currentUser?.photoURL || facePhoto ? (
                      <img
                        src={currentUser?.photoURL || facePhoto}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-[30px] h-[30px]" />
                    )}
                    <b className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#cfe45a] text-[#1a2307] flex items-center justify-center text-[17px] leading-none font-semibold shadow-sm">
                      +
                    </b>
                  </div>
                  <div className="flex-1 min-w-0">
                    <b
                      className="block text-[19px] font-bold leading-tight text-[#eef2e4] truncate"
                      style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                    >
                      {currentUser ? (currentUser.displayName || localSettings.userNickname || "Vincent") : "Nicht angemeldet"}
                    </b>
                    <span className="text-sm text-[#9aa58f] truncate block">
                      {currentUser ? (currentUser.email || "Persönliches Konto") : "Du nutzt Dandelious als Gast"}
                    </span>
                  </div>
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => onOpenAuth ? onOpenAuth() : setActivePopup("account")}
                      className="flex-none min-h-[44px] px-[18px] rounded-full bg-[#cfe45a] text-[#1a2307] font-semibold text-[15px] hover:bg-[#b4cb4b] transition-colors cursor-pointer"
                    >
                      Anmelden
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActivePopup("account")}
                      className="flex-none min-h-[44px] px-[18px] rounded-full bg-[#1e271b] border border-[#2b3627] text-[#eef2e4] hover:border-[#cfe45a]/50 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Profil
                    </button>
                  )}
                </section>

                {/* Plan-Karte */}
                <button
                  type="button"
                  onClick={() => {
                    playSound("click", localSettings.enableSoundEffects ?? true);
                    setActivePopup("abo");
                  }}
                  className="mt-3 w-full flex items-center gap-3.5 rounded-[26px] p-[18px] bg-[#cfe45a] text-[#1a2307] relative overflow-hidden transition-all hover:brightness-105 cursor-pointer text-left shadow-sm"
                >
                  <span className="w-[46px] h-[46px] rounded-[15px] bg-[#1a2307] text-[#cfe45a] flex items-center justify-center flex-none">
                    <Sparkles className="w-6 h-6 stroke-[2]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <small className="block text-[13px] font-medium opacity-75">Dandelious Upgrade</small>
                    <b
                      className="text-[22px] font-bold leading-tight block tracking-tight"
                      style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                    >
                      {localSettings.userTier || "Kostenlos"} ist aktiv
                    </b>
                    <span className="flex gap-1.5 mt-1.5">
                      <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${localSettings.userTier === "Plus" ? "bg-[#1a2307] text-[#cfe45a] border-[#1a2307]" : "border-[#1a2307]/40 opacity-65"}`}>
                        Plus
                      </span>
                      <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${localSettings.userTier === "Pro" ? "bg-[#1a2307] text-[#cfe45a] border-[#1a2307]" : "border-[#1a2307]/40 opacity-65"}`}>
                        Pro
                      </span>
                      <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${localSettings.userTier === "Ultra" ? "bg-[#1a2307] text-[#cfe45a] border-[#1a2307]" : "border-[#1a2307]/40 opacity-65"}`}>
                        Ultra
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#1a2307] shrink-0" />
                </button>

                {/* Fortschritt / Kacheln */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("shards");
                    }}
                    className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-4 flex flex-col gap-1.5 min-h-[132px] text-left hover:border-[#cfe45a]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[#cfe45a]">
                      <Zap className="w-[22px] h-[22px]" />
                      <ChevronRight className="w-4.5 h-4.5 text-[#9aa58f]" />
                    </div>
                    <b
                      className="text-[26px] font-bold text-[#eef2e4] leading-none mt-1.5"
                      style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                    >
                      {shardsState.shardsCount}
                      <em className="not-italic text-[15px] text-[#9aa58f] font-medium font-sans"> / 50</em>
                    </b>
                    <span className="text-[13px] text-[#9aa58f]">Shards & Belohnungen</span>
                    <div className="h-[7px] rounded-full bg-[#1e271b] overflow-hidden mt-auto">
                      <i
                        className="block h-full rounded-full bg-[#cfe45a] transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (shardsState.shardsCount / 50) * 100))}%` }}
                      />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("achievements");
                    }}
                    className="bg-[#161d14] border border-[#2b3627] rounded-[26px] p-4 flex flex-col gap-1.5 min-h-[132px] text-left hover:border-[#cfe45a]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[#cfe45a]">
                      <Trophy className="w-[22px] h-[22px]" />
                      <ChevronRight className="w-4.5 h-4.5 text-[#9aa58f]" />
                    </div>
                    <b
                      className="text-[26px] font-bold text-[#eef2e4] leading-none mt-1.5"
                      style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                    >
                      {achievementsState.filter(a => a.unlocked).length}
                      <em className="not-italic text-[15px] text-[#9aa58f] font-medium font-sans"> / {achievementsState.length || 19}</em>
                    </b>
                    <span className="text-[13px] text-[#9aa58f]">Erfolge</span>
                    <div className="h-[7px] rounded-full bg-[#1e271b] overflow-hidden mt-auto">
                      <i
                        className="block h-full rounded-full bg-[#cfe45a] transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (achievementsState.filter(a => a.unlocked).length / (achievementsState.length || 19)) * 100))}%` }}
                      />
                    </div>
                  </button>
                </div>

                <div className="flex justify-end mt-1 px-1">
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    className="text-[11px] text-[#9aa58f] hover:text-[#cfe45a] transition-colors cursor-pointer"
                  >
                    Fortschritt auf 0 zurücksetzen
                  </button>
                </div>

                {/* Konto */}
                <h2
                  className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-6.5 mb-2.5 px-1"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  Konto
                </h2>
                <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] overflow-hidden divide-y divide-[#2b3627]">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("account");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <User className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Konto</b>
                      <span className="block text-xs text-[#9aa58f] truncate">
                        {currentUser ? (currentUser.email || "Angemeldet") : "Nicht angemeldet (Gast)"}
                      </span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("workspace");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Briefcase className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Workspace</b>
                      <span className="block text-xs text-[#9aa58f]">Persönlich</span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>
                </div>

                {/* Anpassen */}
                <h2
                  className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-6.5 mb-2.5 px-1"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  Anpassen
                </h2>
                <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] overflow-hidden divide-y divide-[#2b3627]">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("personalisierung");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Smile className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Personalisierung</b>
                      <span className="block text-xs text-[#9aa58f]">Stil, Ton und Anweisungen</span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("erinnerung");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <BookOpen className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Erinnerung</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      if (onOpenPlugins) onOpenPlugins();
                      else setActivePopup("plugins");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Puzzle className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Plugins</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => setIsAccentDropdownOpen(!isAccentDropdownOpen)}
                      aria-expanded={isAccentDropdownOpen}
                      className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                    >
                      <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                        <Palette className="w-[21px] h-[21px]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Akzentfarbe</b>
                      </span>
                      <span className="flex items-center gap-2 text-sm text-[#9aa58f] mr-1">
                        <i
                          className="w-3 h-3 rounded-full inline-block"
                          style={{
                            background: (ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0]).hex
                          }}
                        />
                        <span>{(ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0]).name}</span>
                      </span>
                      <ChevronRight
                        className={`w-[18px] h-[18px] text-[#9aa58f] flex-none transition-transform duration-200 ${
                          isAccentDropdownOpen ? "rotate-90 text-[#eef2e4]" : ""
                        }`}
                      />
                    </button>

                    {isAccentDropdownOpen && (
                      <div className="px-4 pb-4.5 pt-2 pl-4 sm:pl-[70px] border-t border-[#2b3627]">
                        <div className="flex gap-3 flex-wrap">
                          {ACCENT_COLORS.map((c) => {
                            const isChecked = accentColor === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectAccent(c.id)}
                                aria-label={c.name}
                                aria-checked={isChecked}
                                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                  isChecked ? "border-[#eef2e4]" : "border-transparent hover:scale-105"
                                }`}
                              >
                                <i
                                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-inner"
                                  style={{ background: c.hex }}
                                >
                                  {isChecked && (
                                    <Check className="w-4 h-4 stroke-[3]" style={{ color: c.ink }} />
                                  )}
                                </i>
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs text-[#9aa58f]">
                          Wähle deine bevorzugte Akzentfarbe für Dandelious.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verbindung & Nutzung */}
                <h2
                  className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-6.5 mb-2.5 px-1"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  Verbindung & Nutzung
                </h2>
                <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] overflow-hidden divide-y divide-[#2b3627]">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("api_key");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Key className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">API-Key & Provider</b>
                    </span>
                    <span className="flex-none flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#cfe45a]/15 text-[#cfe45a] mr-1">
                      <i className="w-2 h-2 rounded-full bg-[#cfe45a]" />
                      <span>{localSettings.customApiKey ? "Eigener Key aktiv" : "Standard-Provider"}</span>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("limits");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Activity className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Nutzung und Grenzwerte</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("storage");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <HardDrive className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Speicher</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>
                </div>

                {/* App */}
                <h2
                  className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f] mt-6.5 mb-2.5 px-1"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  App
                </h2>
                <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] overflow-hidden divide-y divide-[#2b3627]">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("allgemein");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <Settings className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Allgemein</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", localSettings.enableSoundEffects ?? true);
                      setActivePopup("privacy");
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 min-h-[64px] hover:bg-[#1e271b] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-10 h-10 rounded-[13px] bg-[#cfe45a]/15 text-[#cfe45a] flex items-center justify-center flex-none">
                      <ShieldCheck className="w-[21px] h-[21px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="block font-semibold text-sm text-[#eef2e4] leading-tight">Datenschutzcenter & Daten</b>
                    </span>
                    <ChevronRight className="w-[18px] h-[18px] text-[#9aa58f] flex-none" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
