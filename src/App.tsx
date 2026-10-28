import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { DiceStudio } from './components/DiceStudio';
import { StocksStudio } from './components/StocksStudio';
import { ImageStudio } from './components/ImageStudio';
import { MusicStudio } from './components/MusicStudio';
import { VideoStudio } from './components/VideoStudio';
import { Mediathek } from './components/Mediathek';
import { Projects } from './components/Projects';
import { ReleasesStudio } from './components/ReleasesStudio';
import { CryptoStudio } from './components/CryptoStudio';
import { WeatherStudio } from './components/WeatherStudio';
import { RemoteWorkspace } from './components/RemoteWorkspace';
import { RemoteSetupModal } from './components/RemoteSetupModal';
import { BrowserPromoBanner } from './components/BrowserPromoBanner';
import { SteamAchievementToast } from './components/SteamAchievementToast';
import { loadShardsState, checkAndUpdateDailyShards } from './utils/shardsTracker';
import { checkShardMilestoneAchievements, checkAchievement } from './utils/achievementsTracker';
import { KnowledgeBaseDashboard } from './components/KnowledgeBaseDashboard';
import { SettingsModal } from './components/SettingsModal';
import { HelpLexiconModal } from './components/HelpLexiconModal';
import { IntegrationHubModal } from './components/IntegrationHubModal';
import { PluginsModal } from './components/PluginsModal';
import { DesktopExporterModal } from './components/DesktopExporterModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { LimitReachedModal } from './components/LimitReachedModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AppleFeatureShowcaseModal } from './components/AppleFeatureShowcaseModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AuthModal } from './components/AuthModal';
import { createOrUpdateUserProfile, getUserSubscriptionStatus } from './services/userService';
import { GeminiPromptBar } from './components/GeminiPromptBar';
import { ActionButtonGuideModal } from './components/ActionButtonGuideModal';
import { OfflineBanner } from './components/OfflineBanner';
import { AuroraPromptGlow } from './components/AuroraPromptGlow';
import { UpdateModal, CURRENT_SAPHIRE_VERSION } from './components/UpdateModal';
import { ArtifactsCanvas, ArtifactData } from './components/ArtifactsCanvas';
import { AppBootLoader } from './components/AppBootLoader';
import { openHelpLexikon } from './utils/openHelp';
import { GlassCapsuleDock } from './components/GlassCapsuleDock';
import { AudioTranscribeModal } from './components/AudioTranscribeModal';
import { FeatureIntroModal, IntroFeatureKey, hasSeenFeatureIntro } from './components/FeatureIntroModal';
import { initLiquidGlass } from './utils/liquidGlass';
import { generateSaphireChatResponse } from './server/saphireSynthesis';
import { useDeviceType } from './utils/useDeviceType';
import { playSound } from './utils/sound';
import { applyOSClassesToDocument, resolveEffectiveOS } from './utils/osAdaptation';
import { ChatSession, EngineSettings, EngineStats, GemmaModelId, Message, SaphireProject } from './types';
import { GEMMA_MODELS } from './data/models';
import { checkRateLimit, recordMessageSent } from './utils/rateLimit';
import { recordComputationUsage, is12hLimitReached, isModelAllowedUnderLimit } from './utils/usageTracker';
import { extractMemoriesFromText, formatMemoryGraphForAIContext, syncMemoriesFromCloud, loadMemoryTopics, loadMemoryGraph } from './lib/memoryGraphService';
import { auth, db, onAuthStateChanged, doc, setDoc, collection, onSnapshot, deleteDoc, User } from './lib/firebase';

const STORAGE_SESSIONS_KEY = 'vanguard_chat_sessions_v1';
const STORAGE_SETTINGS_KEY = 'vanguard_engine_settings_v1';
const STORAGE_ACTIVE_SESSION_KEY = 'vanguard_active_session_id';

const DEFAULT_SETTINGS: EngineSettings = {
  model: 'gemma-2-9b-it',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 8192,
  systemInstruction: 'Du bist Dandelious, die fortschrittliche KI von Context. Du antwortest stets präzise, hocheffizient und strukturiert. Fasse dich bei einfachen Fragen kurz und auf den Punkt.',
  customApiKey: '',
  enableStream: true,
  glassBlurIntensity: 'high',
  ambientGlow: true,
  externalApiPort: 3000,
  externalApiEnabled: true,
  autoTitleChats: true,
  userTier: 'Kostenlos',
  userNickname: '',
  userOccupation: '',
  userAbout: '',
  enableMemories: true,
  autoSpellCheck: true,
  autoIntelligenceSwitch: true,
  autoComplete: true,
  popularSearches: true,
  webSearchAuto: true,
  toneStyle: 'Freundlich',
  warmthLevel: 'Ausgewogen',
  enthusiasmLevel: 'Ausgewogen',
  headingsListsLevel: 'Mehr',
  emojiLevel: 'Ausgewogen',
  fastAnswers: true,
  customInstructionsDetail: '',
  rpEnabled: true,
  fontScale: 'standard',
  boldMode: false,
  fontFamily: 'jakarta',
  useCases: ['dev', 'dialog'],
  responseStyle: 'precise',
  saveChatHistoryLocally: true,
  anonymousMode: true,
  dailyMode: 'auto_execute',
  visualFeedback: 'minimalist'
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const map = new Map<string, ChatSession>();
          parsed.forEach((s) => {
            if (s && s.id && !map.has(s.id)) {
              if (Array.isArray(s.messages)) {
                const msgSet = new Set<string>();
                s.messages = s.messages.map((m: any, idx: number) => {
                  let mId = m.id || `msg-${Date.now()}-${idx}`;
                  if (msgSet.has(mId)) {
                    mId = `${mId}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
                  }
                  msgSet.add(mId);
                  return { ...m, id: mId };
                });
              }
              map.set(s.id, s);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.error("Fehler beim Laden der gespeicherten Unterhaltungen:", e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
      const savedSessionsStr = localStorage.getItem(STORAGE_SESSIONS_KEY);
      const initialSessions: ChatSession[] = savedSessionsStr ? JSON.parse(savedSessionsStr) : [];
      if (savedId && initialSessions.some(s => s.id === savedId)) {
        return savedId;
      }
      return initialSessions.length > 0 ? initialSessions[0].id : null;
    } catch (e) {
      return null;
    }
  });

  const [settings, setSettings] = useState<EngineSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      const loaded: EngineSettings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      
      const userKey = localStorage.getItem('vg_user_api_key');
      if (userKey) {
        loaded.customApiKey = userKey;
      }

      // Check active 10-minute trial status on initial load
      const trialExpiresStr = localStorage.getItem('vanguard_trial_expires');
      if (trialExpiresStr) {
        const expiresAt = parseInt(trialExpiresStr, 10);
        if (Date.now() < expiresAt) {
          loaded.userTier = 'Expanded';
        }
      }
      return loaded;
    } catch (e) {
      console.error("Fehler beim Laden der Einstellungen:", e);
    }
    return DEFAULT_SETTINGS;
  });

  // Persist Settings to LocalStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Fehler beim Speichern der Einstellungen:', e);
    }
  }, [settings]);

  // Apply OS adaptation style dynamically to document root
  useEffect(() => {
    const effectiveOS = resolveEffectiveOS(settings.osTarget);
    applyOSClassesToDocument(effectiveOS);
  }, [settings.osTarget]);

  // Apply Typography and Bold Mode dynamically to document root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Font Scale
    root.classList.remove('font-size-small', 'font-size-standard', 'font-size-large');
    root.classList.add(`font-size-${settings.fontScale || 'standard'}`);

    // Bold Mode
    if (settings.boldMode) {
      root.classList.add('font-weight-bold');
    } else {
      root.classList.remove('font-weight-bold');
    }

    // Font Family
    root.classList.remove('font-family-jakarta', 'font-family-jetbrains');
    root.classList.add(`font-family-${settings.fontFamily || 'jakarta'}`);
  }, [settings.fontScale, settings.boldMode, settings.fontFamily]);

  // Model & Firebase & Auth state
  const [selectedModel, setSelectedModel] = useState<GemmaModelId>(settings.model);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRemoteSetupOpen, setIsRemoteSetupOpen] = useState(false);

  const checkStandaloneView = useCallback((): 'stocks' | 'code' | 'projects' | 'mediathek' | 'releases' | 'wetter' | 'crypto' | 'remote' | null => {
    if (typeof window === 'undefined') return null;
    try {
      const pathname = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const params = new URLSearchParams(window.location.search);

      // 1. Aktien / Stocks / Finanzen
      if (
        pathname.startsWith('/aktien') || pathname.startsWith('/stocks') || pathname.startsWith('/finanzen') ||
        hash.includes('aktien') || hash.includes('stocks') || hash.includes('finanzen') ||
        params.has('aktien') || params.has('stocks') || params.has('finanzen') ||
        params.get('view') === 'aktien' || params.get('view') === 'stocks' || params.get('mode') === 'aktien' ||
        params.get('standalone') === 'aktien' || params.get('standalone') === 'stocks'
      ) {
        return 'stocks';
      }

      // 2. Code / Dice Studio
      if (
        pathname.startsWith('/code') || pathname.startsWith('/dice') || pathname.startsWith('/cube') ||
        hash.includes('code') || hash.includes('dice') || hash.includes('cube') ||
        params.has('code') || params.has('dice') || params.has('cube') ||
        params.get('view') === 'code' || params.get('view') === 'dice' || params.get('mode') === 'code' ||
        params.get('standalone') === 'code' || params.get('standalone') === 'dice'
      ) {
        return 'code';
      }

      // 3. Projekte / Projects
      if (
        pathname.startsWith('/projekte') || pathname.startsWith('/projects') ||
        hash.includes('projekte') || hash.includes('projects') ||
        params.has('projekte') || params.has('projects') ||
        params.get('view') === 'projekte' || params.get('view') === 'projects' || params.get('mode') === 'projekte' ||
        params.get('standalone') === 'projekte' || params.get('standalone') === 'projects'
      ) {
        return 'projects';
      }

      // 4. Mediathek
      if (
        pathname.startsWith('/mediathek') || pathname.startsWith('/media') ||
        hash.includes('mediathek') || hash.includes('media') ||
        params.has('mediathek') || params.get('view') === 'mediathek'
      ) {
        return 'mediathek';
      }

      // 5. Releases & Premieren (Games, Serien, Filme) - supports "relase" & "release"
      if (
        pathname.startsWith('/releases') || pathname.startsWith('/release') || pathname.startsWith('/relase') || pathname.startsWith('/premieren') ||
        hash.includes('releases') || hash.includes('release') || hash.includes('relase') || hash.includes('premieren') ||
        params.has('releases') || params.has('release') || params.has('relase') || params.has('premieren') ||
        params.get('view') === 'releases' || params.get('view') === 'release' || params.get('view') === 'relase' || params.get('mode') === 'releases' ||
        params.get('standalone') === 'releases' || params.get('standalone') === 'release' || params.get('standalone') === 'relase'
      ) {
        return 'releases';
      }

      // 6. Crypto / Kryptowährungen - supports "crypo" & "crypto"
      if (
        pathname.startsWith('/crypto') || pathname.startsWith('/krypto') || pathname.startsWith('/crypo') ||
        hash.includes('crypto') || hash.includes('krypto') || hash.includes('crypo') ||
        params.has('crypto') || params.has('krypto') || params.has('crypo') ||
        params.get('view') === 'crypto' || params.get('view') === 'crypo' || params.get('mode') === 'crypto' ||
        params.get('standalone') === 'crypto' || params.get('standalone') === 'crypo'
      ) {
        return 'crypto';
      }

      // 7. Wetter / Weather (Geheimer Direktzugriff)
      if (
        pathname.startsWith('/wetter') || pathname.startsWith('/weather') ||
        hash.includes('wetter') || hash.includes('weather') ||
        params.has('wetter') || params.has('weather') ||
        params.get('view') === 'wetter' || params.get('view') === 'weather' ||
        params.get('standalone') === 'wetter'
      ) {
        return 'wetter';
      }

      // 8. Remote PC Verbindung
      if (
        pathname.startsWith('/remote') || hash.includes('remote') || params.has('remote') || params.get('view') === 'remote' || params.get('standalone') === 'remote'
      ) {
        return 'remote';
      }
    } catch (e) {
      console.warn('Standalone view check error:', e);
    }
    return null;
  }, []);

  const [standaloneView, setStandaloneView] = useState<'stocks' | 'code' | 'projects' | 'mediathek' | 'releases' | 'wetter' | 'crypto' | 'remote' | null>(checkStandaloneView);

  const isStandaloneApp = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      setStandaloneView(checkStandaloneView());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [checkStandaloneView]);

  const [activeView, setActiveView] = useState<'chat' | 'dice' | 'code' | 'image' | 'music' | 'video' | 'mediathek' | 'projects' | 'knowledge' | 'stocks' | 'aktien' | 'releases' | 'crypto' | 'remote'>(() => {
    const initStandalone = checkStandaloneView();
    if (initStandalone === 'stocks') return 'stocks';
    if (initStandalone === 'code') return 'dice';
    if (initStandalone === 'projects') return 'projects';
    if (initStandalone === 'mediathek') return 'mediathek';
    if (initStandalone === 'releases') return 'releases';
    if (initStandalone === 'crypto') return 'crypto';
    if (initStandalone === 'remote') return 'remote';
    return 'chat';
  });

  // First-time feature intro state (matching IMG_1233_ac1d5731.png)
  const [activeIntroFeature, setActiveIntroFeature] = useState<IntroFeatureKey | null>(null);

  useEffect(() => {
    if (activeView === 'projects') checkAchievement('open_projects');
    else if (activeView === 'mediathek') checkAchievement('open_mediathek');
    else if (activeView === 'crypto') checkAchievement('open_crypto');
    else if (activeView === 'stocks' || activeView === 'aktien') checkAchievement('open_stocks');

    // Automatically trigger feature intro on first-time open
    const featureMap: Record<string, IntroFeatureKey> = {
      image: 'image',
      mediathek: 'mediathek',
      video: 'video',
      music: 'music',
      projects: 'projects',
      crypto: 'crypto',
      stocks: 'stocks',
      aktien: 'stocks',
      releases: 'releases',
      remote: 'remote',
      knowledge: 'knowledge',
      dice: 'dice',
      code: 'code'
    };
    const key = featureMap[activeView];
    if (key && !hasSeenFeatureIntro(key)) {
      setActiveIntroFeature(key);
    }
  }, [activeView]);

  // Mount Liquid Glass refraction displacement engine
  useEffect(() => {
    const cleanup = initLiquidGlass();
    return cleanup;
  }, []);

  const [isAppBooting, setIsAppBooting] = useState<boolean>(false);

  // Shards & Activity status synchronization (starts at 0 without auto-crediting)
  useEffect(() => {
    if (settings.enableShards !== false) {
      const state = loadShardsState();
      if (state.shardsCount !== settings.shardsCount) {
        setSettings(prev => ({
          ...prev,
          shardsCount: state.shardsCount
        }));
      }
      checkShardMilestoneAchievements(state.shardsCount);
    }
  }, [settings.enableShards]);

  // Firestore Realtime Synchronization & Local-to-Cloud Migration
  useEffect(() => {
    let unsubSettings: (() => void) | null = null;
    let unsubChats: (() => void) | null = null;
    let unsubMemories: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Ensure user profile document exists securely in Firestore
        createOrUpdateUserProfile(user).catch(err => {
          console.warn('Firestore profile sync notice:', err);
        });

        // Sync verified server-side subscription tier from read-only subcollection
        getUserSubscriptionStatus(user.uid).then(sub => {
          if (sub?.tier && sub.status === 'active') {
            setSettings(prev => ({ ...prev, userTier: sub.tier }));
          }
        }).catch(() => {});

        try {
          // Sync User Settings from Firestore
          const settingsRef = doc(db, 'users', user.uid, 'settings', 'config');
          unsubSettings = onSnapshot(settingsRef, (snap) => {
            if (snap.exists()) {
              setSettings(prev => ({ ...prev, ...snap.data() }));
            } else {
              setDoc(settingsRef, settings, { merge: true }).catch(err => {
                console.warn('Firestore setDoc settings notice:', err);
              });
            }
          }, (err) => {
            console.warn('Firestore settings snapshot notice:', err);
          });

          // Sync User Memories from Firestore
          const memoriesRef = doc(db, 'users', user.uid, 'settings', 'memories');
          unsubMemories = onSnapshot(memoriesRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data?.topics || data?.graph) {
                syncMemoriesFromCloud(data.topics || [], data.graph);
              }
            } else {
              const currentTopics = loadMemoryTopics();
              const currentGraph = loadMemoryGraph();
              if (currentTopics.length > 0 || (currentGraph.nodes && currentGraph.nodes.length > 0)) {
                setDoc(memoriesRef, {
                  topics: currentTopics,
                  graph: currentGraph,
                  updatedAt: Date.now()
                }, { merge: true }).catch(err => {
                  console.warn('Firestore memories initial upload notice:', err);
                });
              }
            }
          }, (err) => {
            console.warn('Firestore memories snapshot notice:', err);
          });

          // Realtime Listener for User Chats in Firestore
          const chatsRef = collection(db, 'users', user.uid, 'chats');
          unsubChats = onSnapshot(chatsRef, (snapshot) => {
            const cloudChats: ChatSession[] = [];
            snapshot.forEach((docSnap) => {
              cloudChats.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
            });

            if (cloudChats.length > 0) {
              cloudChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              setSessions(prevLocal => {
                // If local sessions have active messages or newer edits, preserve them
                const merged: ChatSession[] = cloudChats.map(cloud => {
                  const local = prevLocal.find(l => l.id === cloud.id);
                  if (local) {
                    const hasStreaming = local.messages?.some(m => m.isStreaming);
                    if (hasStreaming || (local.updatedAt || 0) > (cloud.updatedAt || 0)) {
                      return local;
                    }
                  }
                  return cloud;
                });

                // Also keep any local-only sessions that haven't synced to cloud yet
                prevLocal.forEach(local => {
                  if (local && local.id && !merged.some(m => m.id === local.id)) {
                    merged.push(local);
                  }
                });

                const uniqueMap = new Map<string, ChatSession>();
                merged.forEach(s => {
                  if (s && s.id && !uniqueMap.has(s.id)) {
                    uniqueMap.set(s.id, s);
                  }
                });
                const uniqueList = Array.from(uniqueMap.values());
                uniqueList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                return uniqueList;
              });

              setActiveSessionId(prev => {
                if (!prev || !cloudChats.some(c => c.id === prev)) {
                  return cloudChats[0].id;
                }
                return prev;
              });
            } else {
              // Local-to-Cloud Migration on First Auth
              try {
                const localSaved = localStorage.getItem(STORAGE_SESSIONS_KEY);
                if (localSaved) {
                  const localChats: ChatSession[] = JSON.parse(localSaved);
                  localChats.forEach((c) => {
                    setDoc(doc(db, 'users', user.uid, 'chats', c.id), c).catch(err => {
                      console.warn('Migration chat sync notice:', err);
                    });
                  });
                }
              } catch (err) {
                console.warn("Local to Cloud migration notice:", err);
              }
            }
          }, (err) => {
            console.warn('Firestore chats snapshot notice:', err);
          });
        } catch (syncErr) {
          console.warn('Firestore sync setup notice:', syncErr);
        }
      } else {
        if (unsubSettings) {
          unsubSettings();
          unsubSettings = null;
        }
        if (unsubChats) {
          unsubChats();
          unsubChats = null;
        }
        if (unsubMemories) {
          unsubMemories();
          unsubMemories = null;
        }
      }
    });

    return () => {
      if (unsubSettings) unsubSettings();
      if (unsubChats) unsubChats();
      if (unsubMemories) unsubMemories();
      unsubAuth();
    };
  }, []);
  const [isTurboEnabled, setIsTurboEnabled] = useState(false);
  const [engineStats, setEngineStats] = useState<EngineStats | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isGlobalTranscribeOpen, setIsGlobalTranscribeOpen] = useState(false);
  const [isPromptBarOpen, setIsPromptBarOpen] = useState(false);
  const [isActionGuideOpen, setIsActionGuideOpen] = useState(false);

  const handleSaveTranscriptToChat = (
    transcriptText: string,
    transcriptItems?: { sender: 'user' | 'model'; text: string; timestamp?: number }[]
  ) => {
    if (!transcriptText && (!transcriptItems || transcriptItems.length === 0)) return;

    // Automatically extract memories from any facts spoken by user in Live mode
    if (transcriptItems && transcriptItems.length > 0) {
      transcriptItems.forEach(item => {
        if (item.sender === 'user' && item.text) {
          try {
            extractMemoriesFromText(item.text, 'Dandelious Live');
          } catch (e) {
            console.warn('Live transcript memory extraction:', e);
          }
        }
      });
    }

    let msgs: Message[] = [];
    if (transcriptItems && transcriptItems.length > 0) {
      msgs = transcriptItems.map((item, idx) => ({
        id: `msg-live-${Date.now()}-${idx}`,
        role: item.sender === 'user' ? 'user' : 'assistant',
        content: item.text,
        timestamp: item.timestamp || Date.now() + idx,
        modelUsed: 'gemini-3.1-flash-live-preview',
      }));
    } else {
      msgs = [
        {
          id: `msg-live-${Date.now()}`,
          role: 'assistant',
          content: transcriptText,
          timestamp: Date.now(),
          modelUsed: 'gemini-3.1-flash-live-preview',
        },
      ];
    }

    const newSession: ChatSession = {
      id: `session-live-${Date.now()}`,
      title: 'Dandelious Live',
      messages: msgs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.1-flash-live-preview',
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'chats', newSession.id);
      setDoc(docRef, JSON.parse(JSON.stringify(newSession)), { merge: true }).catch((err) => {
        console.warn('Firestore live session sync notice:', err);
      });
    }
  };

  const handleCloseUpdateModal = () => {
    try {
      localStorage.setItem('vg_last_seen_version', CURRENT_SAPHIRE_VERSION);
    } catch (e) {
      console.error(e);
    }
    setIsUpdateModalOpen(false);
  };

  const [isAppleShowcaseOpen, setIsAppleShowcaseOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const seen = localStorage.getItem('dandelious_apple_showcase_seen_v1');
        return !seen;
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(1);

  const completeOnboardingTour = () => {
    try {
      localStorage.setItem('vg_onboarding_completed', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsOnboardingOpen(false);
    setIsSettingsOpen(false);
    setOnboardingStep(1);

    // Dynamic DOM Cleanup: remove all highlight classes, spotlight overlays, and glow effects
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll(
        '[data-tour-target], [data-tour-active], .tour-spotlight, .tour-highlight, .highlighted, .tutorial-active, .glow-yellow'
      );
      elements.forEach((el) => {
        el.removeAttribute('data-tour-active');
        el.classList.remove(
          'ring-2',
          'ring-white',
          'ring-amber-300',
          'ring-amber-400',
          'shadow-[0_0_35px_rgba(255,255,255,0.9)]',
          'shadow-[0_0_25px_rgba(255,255,255,0.95)]',
          'shadow-[0_0_30px_rgba(255,255,255,0.95)]',
          'animate-pulse',
          'highlighted',
          'tutorial-active',
          'glow-yellow'
        );
        if (el instanceof HTMLElement) {
          el.style.pointerEvents = 'auto';
          el.style.opacity = '1';
        }
      });
    }
  };

  const handleReopenOnboarding = () => {
    localStorage.removeItem('vg_onboarding_completed');
    setOnboardingStep(1);
    setIsOnboardingOpen(true);
  };

  const handleTourAction = (action: 'send_prompt' | 'click_settings' | 'click_new_chat') => {
    if (!isOnboardingOpen) return;
    if (action === 'send_prompt' && onboardingStep === 1) {
      setOnboardingStep(2);
    } else if (action === 'click_settings' && onboardingStep === 2) {
      setIsSettingsOpen(true);
      setOnboardingStep(3);
    } else if (action === 'click_new_chat') {
      setIsSettingsOpen(false);
      setOnboardingStep(9);
    }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Trigger intro when settings are opened for the first time (matching IMG_1233_ac1d5731.png)
  useEffect(() => {
    if (isSettingsOpen && !hasSeenFeatureIntro('settings')) {
      setActiveIntroFeature('settings');
    }
  }, [isSettingsOpen]);
  const [isHelpLexiconOpen, setIsHelpLexiconOpen] = useState(false);
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [isDesktopGuideOpen, setIsDesktopGuideOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isNoKeyLimitExceeded, setIsNoKeyLimitExceeded] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [limitRetryAfterSeconds, setLimitRetryAfterSeconds] = useState<number>(900);
  const [limitMaxAllowed, setLimitMaxAllowed] = useState<number>(50);
  const [settingsInitialSubPage, setSettingsInitialSubPage] = useState<any>(null);
  const [settingsInitialLexikonArticle, setSettingsInitialLexikonArticle] = useState<string | null>(null);
  const [isProjectChatModalOpen, setIsProjectChatModalOpen] = useState(false);

  const streamAbortController = useRef<AbortController | null>(null);

  const deviceInfo = useDeviceType();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Central UI Navigation & Context Synchronization for Tutorial Steps
  const resetUIContextForStep = useCallback((step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => {
    // 1. Reset/Close temporary overlays & modals
    setIsIntegrationOpen(false);
    setIsDesktopGuideOpen(false);
    setIsLimitModalOpen(false);

    // 2. Configure target UI context per step
    switch (step) {
      case 1:
      case 2:
        setIsSettingsOpen(false);
        setSettingsInitialSubPage(null);
        break;
      case 3:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('personalisierung');
        break;
      case 4:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('erinnerung');
        break;
      case 5:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('allgemein');
        break;
      case 6:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('api');
        break;
      case 7:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('engine');
        break;
      case 8:
        setIsSettingsOpen(true);
        setSettingsInitialSubPage('abo');
        break;
      case 9:
        setIsSettingsOpen(false);
        setSettingsInitialSubPage(null);
        setIsSidebarOpen(true);
        break;
    }
  }, []);

  useEffect(() => {
    if (isOnboardingOpen) {
      resetUIContextForStep(onboardingStep);
    }
  }, [isOnboardingOpen, onboardingStep, resetUIContextForStep]);

  // Real-time Visual Viewport & Dynamic Viewport Height Listener
  useEffect(() => {
    const updateLayoutViewport = () => {
      const isInputActive =
        typeof document !== 'undefined' &&
        (document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement);

      if (!window.visualViewport) {
        const vh = window.innerHeight;
        document.documentElement.style.setProperty('--visible-height', `${vh}px`);
        document.documentElement.style.setProperty('--viewport-offset-bottom', '0px');
        return;
      }

      const visibleHeight = window.visualViewport.height;
      const heightDeficit = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      // Only apply viewport offset if a form field is active and there is significant shrinkage from the virtual keyboard
      const offsetBottom = (isInputActive && heightDeficit > 140) ? Math.max(0, heightDeficit) : 0;

      document.documentElement.style.setProperty('--visible-height', `${visibleHeight}px`);
      document.documentElement.style.setProperty('--viewport-offset-bottom', `${offsetBottom}px`);
    };

    updateLayoutViewport();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateLayoutViewport);
      window.visualViewport.addEventListener('scroll', updateLayoutViewport);
    }
    window.addEventListener('resize', updateLayoutViewport);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateLayoutViewport);
        window.visualViewport.removeEventListener('scroll', updateLayoutViewport);
      }
      window.removeEventListener('resize', updateLayoutViewport);
    };
  }, []);

  // Synchronize Theme (Dark / Light / System) across DOM
  useEffect(() => {
    const currentTheme = settings.theme || 'dark';
    const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [settings.theme]);

  // Monitor 10-Minute Trial Expiration
  useEffect(() => {
    const checkTrial = () => {
      const trialExpiresStr = localStorage.getItem('vanguard_trial_expires');
      if (trialExpiresStr) {
        const expiresAt = parseInt(trialExpiresStr, 10);
        if (Date.now() > expiresAt) {
          localStorage.removeItem('vanguard_trial_expires');
          setSettings(prev => {
            if (prev.userTier === 'Expanded') {
              const updated = { ...prev, userTier: 'Kostenlos' as const };
              localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
          setFallbackToast('10-Minuten Expanded Testphase abgelaufen — Status zurückgesetzt auf Kostenlos');
          setTimeout(() => setFallbackToast(null), 4000);
        }
      }
    };

    checkTrial();
    const timer = setInterval(checkTrial, 3000);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts (Cmd/Ctrl+K for Command Palette, Cmd/Ctrl+Shift+O for New Chat, Alt+Up/Down for Chat Switching, Esc for Modals)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPromptBarOpen(prev => !prev);
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (sessions.length === 0) return;
        const currentIndex = sessions.findIndex(s => s.id === activeSessionId);
        let nextIndex = 0;
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex <= 0 ? sessions.length - 1 : currentIndex - 1;
        } else {
          nextIndex = currentIndex >= sessions.length - 1 ? 0 : currentIndex + 1;
        }
        setActiveSessionId(sessions[nextIndex].id);
        playSound('click', settings.enableSoundEffects ?? true);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsSettingsOpen(false);
        setIsIntegrationOpen(false);
        setIsDesktopGuideOpen(false);
        setIsLimitModalOpen(false);
        setIsPromptBarOpen(false);
        setIsActionGuideOpen(false);
        setActiveArtifact(null);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [sessions, activeSessionId, settings.enableSoundEffects]);

  // Handle URL Query Params / Direct Group Invite Links / PWA Shortcuts / Action Button Triggers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const groupCode = urlParams.get('group') || urlParams.get('code') || urlParams.get('join') || urlParams.get('room') || urlParams.get('joinGroup');
      const privateDocToken = urlParams.get('privateDoc') || urlParams.get('privateMedia') || urlParams.get('pvt') || urlParams.get('private');
      const viewParam = urlParams.get('view') || urlParams.get('shortcut');
      const actionParam = urlParams.get('action') || urlParams.get('prompt') || urlParams.get('power') || urlParams.get('gemini');

      if (viewParam) {
        const cleanView = viewParam.toLowerCase().trim();
        if (cleanView === 'stocks' || cleanView === 'finanzen' || cleanView === 'aktien') {
          setActiveView('stocks');
        } else if (cleanView === 'chat') {
          setActiveView('chat');
        } else if (cleanView === 'projects' || cleanView === 'projekte') {
          setActiveView('projects');
        } else if (cleanView === 'dice') {
          setActiveView('dice');
        }
      }

      if (actionParam && (actionParam === 'prompt' || actionParam === 'true' || actionParam === 'gemini' || actionParam === 'voice' || actionParam === 'speech')) {
        setIsPromptBarOpen(true);
      }

      if (privateDocToken) {
        setActiveView('mediathek');
      }
    } catch (err) {
      console.warn('URL check notice:', err);
    }
  }, []);

  // Persist sessions with 400ms debounce to prevent freezing during high-speed streaming
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn("Fehler beim Speichern der Sessions:", e);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [sessions]);

  // Persist active session id
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, activeSessionId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    }
  }, [activeSessionId]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Fetch Reshaped Engine stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/reshaped/status');
        if (res.ok) {
          const data = await res.json();
          setEngineStats(data.engineStats || null);
        }
      } catch (err) {
        console.warn("Reshaped Engine Status Fetch Error:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const handleNewChatWithPlugin = (pluginId: string) => {
    const pluginTitles: Record<string, string> = {
      gmail: 'Gmail Integration',
      sheets: 'Google Sheets Integration',
      calendar: 'Google Calendar Integration',
      github: 'GitHub Integration',
      onedrive: 'OneDrive Integration'
    };

    const pluginPrompts: Record<string, string> = {
      gmail: 'Ich bin mit deinem Gmail-Konto verbunden! Du kannst mich fragen: `@Gmail Zeige ungelesene Mails` oder `@Gmail Fasse den Posteingang zusammen`.',
      sheets: 'Ich bin mit Google Sheets verbunden! Du kannst sagen: `@Sheets Zeige meine Tabellen` oder `@Sheets Erstelle eine neue Tabelle`.',
      calendar: 'Ich bin mit deinem Google Calendar verbunden! Du kannst fragen: `@Calendar Zeige meine Termine für diese Woche` oder `@Calendar Erstelle einen neuen Termin`.',
      github: 'Ich bin mit deinem GitHub-Konto verbunden! Frage mich: `@GitHub Zeige meine Repositories` oder `@GitHub Prüfe offene Pull Requests`.',
      onedrive: 'Ich bin mit OneDrive verbunden! Du kannst fragen: `@OneDrive Suche nach Dokumenten` oder `@OneDrive Fasse eine Datei zusammen`.'
    };

    const title = pluginTitles[pluginId] || `${pluginId.toUpperCase()} Integration`;
    const welcome = pluginPrompts[pluginId] || `Ich bin bereit. Du hast die ${title} aktiviert. Was möchtest du tun?`;

    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: [{
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: welcome,
        timestamp: Date.now()
      }],
      tags: [pluginId]
    };
    setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
  };
  // Handler to start a new chat session
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: 'Neue Unterhaltung',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: []
    };
    setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
    setActiveSessionId(newSession.id);
  };

  const handleBranchSession = (messageId: string) => {
    if (!activeSession) return;

    const msgIndex = activeSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    // Copy messages up to and including the selected message
    const branchedMessages = activeSession.messages.slice(0, msgIndex + 1);
    
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: `Thread: ${activeSession.title}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeSession.model,
      messages: branchedMessages,
      isGroup: false,
      tags: activeSession.tags
    };
    setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
  };

  // Handler to start a new chat with a prompt (e.g. from Mediathek)
  const handleNewChatWithPrompt = (promptText: string) => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: generateSmartTitle(promptText),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: []
    };
    setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
    setActiveSessionId(newSession.id);
    setActiveView('chat');
    setTimeout(() => {
      handleSendMessage(promptText);
    }, 150);
  };

  // Open existing project chat in popup modal
  const handleOpenProjectChat = (session: ChatSession, project: SaphireProject) => {
    setActiveSessionId(session.id);
    setIsProjectChatModalOpen(true);
  };

  // Start new chat within project in popup modal
  const handleStartNewProjectChat = (project: SaphireProject, initialPrompt?: string) => {
    const defaultTitle = project.name;

    const newChatSession: ChatSession = {
      id: `session-proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: initialPrompt && initialPrompt.trim() ? generateSmartTitle(initialPrompt) : defaultTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: selectedModel,
      messages: [],
      projectId: project.id,
      projectName: project.name
    };

    setSessions(prev => [newChatSession, ...prev.filter(s => s.id !== newChatSession.id)]);
    setActiveSessionId(newChatSession.id);
    setIsProjectChatModalOpen(true);

    if (initialPrompt && initialPrompt.trim()) {
      setTimeout(() => {
        handleSendMessage(initialPrompt.trim());
      }, 150);
    }
  };

  // Delete session
  const handleDeleteChat = (id: string) => {
    if (currentUser?.uid) {
      deleteDoc(doc(db, 'users', currentUser.uid, 'chats', id)).catch(err => {
        console.warn('Firestore delete chat notice:', err);
      });
    }
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setActiveView('chat');
        } else {
          const freshSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: 'Neue Unterhaltung',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: selectedModel,
            messages: []
          };
          setActiveSessionId(freshSession.id);
          setActiveView('chat');
          return [freshSession];
        }
      }
      return remaining;
    });
  };

  // Bulk delete sessions
  const handleBulkDeleteChats = (ids: string[]) => {
    if (currentUser?.uid) {
      ids.forEach(id => {
        deleteDoc(doc(db, 'users', currentUser.uid, 'chats', id)).catch(err => {
          console.warn('Firestore bulk delete notice:', err);
        });
      });
    }
    setSessions(prev => {
      const remaining = prev.filter(s => !ids.includes(s.id));
      if (activeSessionId && ids.includes(activeSessionId)) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Rename session
  const handleRenameChat = (id: string, newTitle: string) => {
    if (currentUser?.uid) {
      setDoc(doc(db, 'users', currentUser.uid, 'chats', id), { title: newTitle, updatedAt: Date.now() }, { merge: true }).catch(err => {
        console.warn('Firestore rename notice:', err);
      });
    }
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s));
  };

  // Helper for generating concise smart titles on first message
  const generateSmartTitle = (text: string) => {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (clean.length <= 32) return clean;
    const words = clean.split(' ');
    if (words.length > 1 && words.slice(0, 5).join(' ').length <= 35) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return clean.slice(0, 30) + '...';
  };

  // Toggle pin status
  const handleTogglePin = (id: string) => {
    setSessions(prev => {
      const target = prev.find(s => s.id === id);
      const nextPinned = !target?.isPinned;
      if (currentUser?.uid && target) {
        setDoc(doc(db, 'users', currentUser.uid, 'chats', id), { isPinned: nextPinned, updatedAt: Date.now() }, { merge: true }).catch(err => {
          console.warn('Firestore pin notice:', err);
        });
      }
      return prev.map(s => s.id === id ? { ...s, isPinned: nextPinned } : s);
    });
  };

  // Model change handler
  const handleModelChange = (model: GemmaModelId) => {
    setSelectedModel(model);
    setSettings(prev => ({ ...prev, model }));
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, model } : s));
    }
  };

  // Send message and handle SSE stream from Reshaped Engine
  const handleSendMessage = async (userText: string, images?: Array<{ mimeType: string; data: string; name?: string; url?: string }>) => {
    const hasCustomKey = !!(settings.customApiKey && settings.customApiKey.trim().length > 5);

    // 1. Enforce strict subscription rate limits
    const rateCheck = checkRateLimit(settings.userTier || 'Kostenlos', hasCustomKey);
    if (!rateCheck.allowed) {
      setIsNoKeyLimitExceeded(!!rateCheck.isNoKeyExceeded);
      setLimitRetryAfterSeconds(rateCheck.retryAfterSeconds);
      setLimitMaxAllowed(rateCheck.limit);
      setIsLimitModalOpen(true);
      return;
    }

    // 2. Check 12h dynamic compute limit
    let effectiveModel = selectedModel;
    if (is12hLimitReached() && !isModelAllowedUnderLimit(selectedModel)) {
      effectiveModel = 'dandelious-lite';
      setSelectedModel('dandelious-lite');
      setFallbackToast('12h-Limit erreicht: Automatisch auf Dandelious Lite umgeschaltet.');
      setTimeout(() => setFallbackToast(null), 3000);
    }

    recordComputationUsage(effectiveModel, {
      isWebSearch: settings.webSearchAuto ?? true,
      hasAttachments: !!(images && images.length > 0),
      isDeepReasoning: isTurboEnabled
    });

    recordMessageSent(hasCustomKey);
    checkAchievement('first_msg');

    let currentSessionId = activeSessionId;
    let targetSession = activeSession;

    // Create session if none exists
    if (!currentSessionId || !targetSession) {
      const smartTitle = generateSmartTitle(userText || (images?.length ? "Bildanalyse" : "Neue Chat-Anfrage"));
      const newSession: ChatSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: smartTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: selectedModel,
        messages: []
      };
      currentSessionId = newSession.id;
      targetSession = newSession;
      setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
      setActiveSessionId(newSession.id);
    } else if (targetSession.messages.length === 0 || targetSession.title === 'Neue Unterhaltung') {
      const autoTitle = generateSmartTitle(userText || (images?.length ? "Bildanalyse" : "Neue Chat-Anfrage"));
      handleRenameChat(targetSession.id, autoTitle);
    }

    const userMessageImages = images?.map(img => ({
      url: img.url || (img.data.startsWith('data:') ? img.data : `data:${img.mimeType};base64,${img.data}`),
      name: img.name,
      mimeType: img.mimeType
    }));

    const userMessage: Message = {
      id: `msg-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      images: userMessageImages
    };

    // User prompt: "Passe an, wenn man „Erstelle ein Bild“ oder so eingibt soll die Antwort kommen dass es keine Bilder erstellen kann und nur ein LLM ist aber nicht zur Bildgenerierung fähig ist und darunter noch ein Embed damit es schöner aussieht."
    const isImageGenRequest = (text: string): boolean => {
      const t = text.trim().toLowerCase();
      if (images && images.length > 0 && !t.includes('erstelle') && !t.includes('generiere') && !t.includes('bild')) {
        return false;
      }
      const patterns = [
        /(?:erstelle|generiere|zeichne|male|mach|erzeuge)\s+(?:mir\s+)?(?:ein\s+|einem\s+|das\s+)?(?:bild|foto|grafik|zeichnung|gemälde|illustration|artwork)/i,
        /kannst\s+du\s+(?:ein\s+|mir\s+ein\s+)?(?:bild|foto|grafik)\s+(?:erstellen|generieren|zeichnen|malen|machen|erzeugen)/i,
        /bild\s+(?:erstellen|generieren|erzeugen|zeichnen|malen)/i,
        /foto\s+(?:erstellen|generieren|erzeugen)/i,
        /bildgenerierung/i,
        /^(?:erstelle|generiere|zeichne|male)\s+ein\s+bild\b/i,
        /^(?:erstelle|generiere)\s+ein\s+foto\b/i,
        /^(?:create|generate|draw|paint)\s+(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\b/i,
        /can\s+you\s+(?:create|generate|make)\s+(?:an?\s+)?(?:image|picture|photo)/i,
      ];
      return patterns.some(p => p.test(t));
    };

    if (isImageGenRequest(userText)) {
      const clarificationText = `Ich kann leider keine Bilder erstellen. Als reines Sprachmodell (Large Language Model / LLM) bin ich auf die Analyse, Generierung und Beantwortung von Texten, Daten und Code spezialisiert, besitze aber keine integrierte Funktion zur Bildgenerierung.

Wenn du möchtest, kann ich dir jedoch gerne einen hochdetaillierten Bild-Prompt für spezialisierte Bildgeneratoren wie Midjourney, Imagen 3 oder DALL-E formulieren oder du wechselst direkt in unser integriertes Bildstudio.`;

      const assistantMessage: Message = {
        id: `msg-asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'assistant',
        content: clarificationText,
        timestamp: Date.now(),
        modelUsed: GEMMA_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
        isStreaming: false,
        imageGenEmbed: {
          type: 'image_gen_unavailable',
          originalPrompt: userText
        }
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage, assistantMessage]
          };
        }
        return s;
      }));

      playSound("pop", settings.enableSoundEffects ?? true);
      return;
    }

    const assistantMessageId = `msg-asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelUsed: GEMMA_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
      isStreaming: true
    };

    // Update session state with user message + assistant placeholder
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          updatedAt: Date.now(),
          messages: [...s.messages, userMessage, assistantPlaceholder]
        };
      }
      return s;
    }));

    setIsStreaming(true);
    const controller = new AbortController();
    streamAbortController.current = controller;

    // Automatic knowledge graph extraction from user input across chats
    if (settings.enableMemories !== false && userText) {
      try {
        extractMemoriesFromText(userText, targetSession?.title);
      } catch (e) {
        console.warn('Memory graph auto-extract:', e);
      }
    }

    const priorMessages = targetSession ? targetSession.messages : [];
    let accumulatedContent = '';
    let renderedContent = '';
    let lastMetrics: any = null;
    let streamIntervalId: any = null;
    let isStreamEnded = false;

    const stopAnimation = () => {
      if (streamIntervalId) {
        clearInterval(streamIntervalId);
        streamIntervalId = null;
      }
    };

    const updateSessionMessage = (content: string, metrics?: any, isFinal = false) => {
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: s.messages.map(m => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content,
                  isStreaming: !isFinal,
                  metrics: metrics || m.metrics
                };
              }
              return m;
            })
          };
        }
        return s;
      }));
    };

    try {
      let activeInstruction = isTurboEnabled
        ? `${settings.systemInstruction}\n\n[TURBO THINKING MODUS AKTIV]: Analysiere die Anfrage extrem sorgfältig, denke Schritt für Schritt tiefer nach, validiere alle Logik- und Fakten-Schritte gründlich vor deiner Antwort.`
        : settings.systemInstruction;

      // Inject Dynamic Knowledge Network / Memory Graph context
      if (settings.enableMemories !== false) {
        try {
          const memContext = formatMemoryGraphForAIContext();
          if (memContext) {
            activeInstruction += memContext;
          }
        } catch (e) {
          console.warn('Memory Graph Context Injection:', e);
        }
      }

      // Inject Project Context and Attached Sources if active chat belongs to a project
      if (targetSession?.projectId) {
        try {
          const uid = auth.currentUser?.uid;
          const userKey = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';
          const rawProjs = localStorage.getItem(userKey) || localStorage.getItem('saphire_projects_v1');
          if (rawProjs) {
            const parsedProjs = JSON.parse(rawProjs);
            const foundProj = parsedProjs.find((p: any) => p.id === targetSession?.projectId);
            if (foundProj) {
              let projContext = `\n\n[PROJEKT-KONTEXT: "${foundProj.name}"]\nDieses Gespräch findet innerhalb des Dandelious-Projekts "${foundProj.name}" statt. Befolge alle Projekt-Richtlinien strikt und nutze die hinterlegten Quellen als primäre Wissensbasis.`;
              if (foundProj.instructions && foundProj.instructions.trim()) {
                projContext += `\n\nProjekt-Spezifische Richtlinien & Anweisungen:\n${foundProj.instructions.trim()}`;
              }
              if (foundProj.sources && foundProj.sources.length > 0) {
                projContext += `\n\nProjekt-Quellen & Dokumente:`;
                foundProj.sources.forEach((src: any, idx: number) => {
                  const isImg = src.mimeType?.startsWith('image/') || (typeof src.content === 'string' && src.content.startsWith('data:image'));
                  if (isImg) {
                    projContext += `\n--- Bildquelle ${idx + 1}: ${src.name} ---\n[Hinterlegte Bild-Ressource: ${src.name}]\n`;
                  } else {
                    const contentSlice = typeof src.content === 'string' ? src.content.slice(0, 25000) : '';
                    projContext += `\n--- Dokument ${idx + 1}: ${src.name} (${src.type || 'Dokument'}) ---\n${contentSlice}\n`;
                  }
                });
              }
              activeInstruction += projContext;
            }
          }
        } catch (e) {
          console.warn('Projekt-Kontext Injection:', e);
        }
      }

      // Smooth throttled streamer (30ms interval keeps the browser responsive and prevents UI thread locking)
      const startSmoothStreamer = () => {
        streamIntervalId = setInterval(() => {
          if (renderedContent.length < accumulatedContent.length) {
            const backlog = accumulatedContent.length - renderedContent.length;
            let stepSize = 2;
            if (backlog > 200) stepSize = Math.ceil(backlog / 4);
            else if (backlog > 80) stepSize = Math.ceil(backlog / 8);
            else if (backlog > 30) stepSize = 6;
            else if (backlog > 10) stepSize = 3;

            renderedContent = accumulatedContent.slice(0, renderedContent.length + stepSize);
            updateSessionMessage(renderedContent, lastMetrics, false);
          } else if (isStreamEnded) {
            updateSessionMessage(accumulatedContent, lastMetrics, true);
            stopAnimation();
          }
        }, 30);
      };

      startSmoothStreamer();

      let finalApiPrompt = userText;
      if (userText.trim().toLowerCase() === 'recherche starten' && targetSession) {
        const lastResearchMsg = [...targetSession.messages].reverse().find(m => m.deepResearchData != null);
        if (lastResearchMsg && lastResearchMsg.deepResearchData) {
          const researchTopic = lastResearchMsg.deepResearchData.topic || "das Thema";
          finalApiPrompt = `[Deep Research Durchführung] Erstelle ein vollständiges, hochdetailliertes und professionell gegliedertes Gesamtdossier über "${researchTopic}". Führe eine tiefgehende, fundierte Recherche durch und analysiere relevante Quellen und Fachdaten. Beziehe allgemeine Grundlagen, technische Daten & Spezifikationen, verschiedene Varianten, historische Meilensteine, tabellarische Vergleiche und fundierte Quellenzusammenfassungen ein. Formatiere den Haupttitel des Berichts als Markdown Header (z.B. "# Der Titel").`;
        }
      }

      // Dynamic activity timeout (resets on every incoming chunk)
      let activityTimeoutId: any = null;
      const resetActivityTimeout = () => {
        if (activityTimeoutId) clearTimeout(activityTimeoutId);
        activityTimeoutId = setTimeout(() => {
          if (controller && !controller.signal.aborted) {
            console.warn("No stream data received for 60s, terminating stream.");
            controller.abort();
          }
        }, 60000);
      };
      resetActivityTimeout();

      try {
        const response = await fetch('/api/reshaped/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalApiPrompt,
            images: images?.map(i => ({ mimeType: i.mimeType, data: i.data })),
            history: priorMessages,
            model: effectiveModel,
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
            systemInstruction: activeInstruction,
            customApiKey: (settings.customApiKey || (typeof window !== 'undefined' ? (localStorage.getItem('vg_user_api_key') || localStorage.getItem('saphir_api_key') || '') : '') || '').replace(/[\r\n\t "']/g, '').trim(),
            openaiApiKey: (settings.openaiApiKey || (typeof window !== 'undefined' ? (localStorage.getItem('vg_openai_key') || '') : '') || '').replace(/[\r\n\t "']/g, '').trim(),
            selectedAiProvider: settings.selectedAiProvider || 'auto',
            enableAutoRouting: settings.enableAutoRouting ?? true,
            appLanguage: settings.appLanguage || 'Deutsch',
            userNickname: settings.userNickname || '',
            userOccupation: settings.userOccupation || '',
            userAbout: settings.userAbout || '',
            enableMemories: settings.enableMemories ?? true,
            toneStyle: settings.toneStyle || 'Freundlich',
            warmthLevel: settings.warmthLevel || 'Mehr',
            enthusiasmLevel: settings.enthusiasmLevel || 'Mehr',
            headingsListsLevel: settings.headingsListsLevel || 'Mehr',
            emojiLevel: settings.emojiLevel || 'Weniger',
            fastAnswers: settings.fastAnswers ?? true,
            customInstructionsDetail: settings.customInstructionsDetail || '',
            webSearchAuto: settings.webSearchAuto ?? true,
            userTier: settings.userTier || 'Kostenlos'
          }),
          signal: controller.signal
        });

        if (!response.ok || !response.body) {
          throw new Error(`Server antwortete mit Status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let buffer = '';
        let streamDoneReceived = false;

        const processBufferLines = () => {
          let separatorIndex;
          while ((separatorIndex = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, separatorIndex).trim();
            buffer = buffer.slice(separatorIndex + 2);

            const lines = block.split('\n');
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.limitReached) {
                    setIsNoKeyLimitExceeded(!!parsed.noKey || !hasCustomKey);
                    if (parsed.retryAfterSeconds) {
                      setLimitRetryAfterSeconds(parsed.retryAfterSeconds);
                    }
                    setIsLimitModalOpen(true);
                    if (!accumulatedContent) {
                      setSessions(prev => prev.map(s => {
                        if (s.id === currentSessionId) {
                          return { ...s, messages: s.messages.filter(m => m.id !== assistantMessageId) };
                        }
                        return s;
                      }));
                    }
                    streamDoneReceived = true;
                    break;
                  }
                  if (parsed.fallbackNotice) {
                    setFallbackToast(parsed.fallbackNotice);
                    if (parsed.switchedModel) {
                      setSelectedModel(parsed.switchedModel);
                    }
                    setTimeout(() => { setFallbackToast(null); }, 2500);
                  }
                  if (parsed.autoRouting) {
                    const routingMeta = parsed.autoRouting;
                    setSessions(prev => prev.map(s => {
                      if (s.id === currentSessionId) {
                        return {
                          ...s,
                          messages: s.messages.map(m => {
                            if (m.id === assistantMessageId) {
                              return {
                                ...m,
                                autoRouting: routingMeta,
                                modelUsed: routingMeta.modelName || m.modelUsed
                              };
                            }
                            return m;
                          })
                        };
                      }
                      return s;
                    }));
                  }
                  if (parsed.error) {
                    accumulatedContent += `\n\n⚠️ **Hinweis:** ${parsed.error}`;
                  } else if (parsed.chunk) {
                    accumulatedContent += parsed.chunk;
                  }
                  if (parsed.metrics) {
                    lastMetrics = parsed.metrics;
                  }
                  if (parsed.done) {
                    streamDoneReceived = true;
                    break;
                  }
                } catch (e) {}
              }
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // Process any remaining text in buffer
            if (buffer.trim()) {
              buffer += '\n\n';
              processBufferLines();
            }
            break;
          }

          resetActivityTimeout();
          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, '\n');
          processBufferLines();

          if (streamDoneReceived) {
            break;
          }
        }
        isStreamEnded = true;
      } catch (fetchErr) {
        throw fetchErr;
      } finally {
        if (activityTimeoutId) clearTimeout(activityTimeoutId);
      }
    } catch (err: any) {
      console.warn("Streaming fallback synthesis:", err);
      if (!accumulatedContent || accumulatedContent.length < 15) {
        const mappedHistory = priorMessages.map(m => ({ role: m.role, content: m.content }));
        accumulatedContent = generateSaphireChatResponse(userText || 'Hallo Dandelious', mappedHistory, {
          model: effectiveModel,
          appLanguage: settings.appLanguage || 'Deutsch',
          toneStyle: settings.toneStyle || 'Freundlich',
          userNickname: settings.userNickname || '',
          userOccupation: settings.userOccupation || ''
        });
      }
    } finally {
      isStreamEnded = true;
      stopAnimation();
      setIsStreaming(false);
      streamAbortController.current = null;

      const finalContent = accumulatedContent || "Entschuldigung, es gab ein Problem bei der Übertragung. Bitte versuche es erneut.";

      // Ensure assistant message is final and marked as not streaming
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentSessionId) {
            const updatedSession = {
              ...s,
              updatedAt: Date.now(),
              messages: s.messages.map(m => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    content: finalContent,
                    isStreaming: false
                  };
                }
                return m;
              })
            };

            if (currentUser?.uid) {
              try {
                // Remove undefined values to prevent synchronous Firestore throw which crashes the state update
                const cleanSession = JSON.parse(JSON.stringify(updatedSession));
                setDoc(doc(db, 'users', currentUser.uid, 'chats', currentSessionId), cleanSession, { merge: true }).catch(() => {});
              } catch (syncErr) {
                console.warn('Firestore sync safe fallback:', syncErr);
              }
            }
            return updatedSession;
          }
          return s;
        });
        return updated;
      });
    }
  };

  const handleStopStreaming = () => {
    if (streamAbortController.current) {
      try {
        streamAbortController.current.abort();
      } catch (e) {}
      streamAbortController.current = null;
    }
    setIsStreaming(false);
    setFallbackToast("Generierung angehalten.");
    setTimeout(() => {
      setFallbackToast(null);
    }, 2000);

    // Update the active session assistant message to show stopped status cleanly
    if (activeSessionId) {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const updatedSession = {
            ...s,
            updatedAt: Date.now(),
            messages: s.messages.map(m => {
              if (m.isStreaming) {
                return {
                  ...m,
                  isStreaming: false,
                  content: m.content ? m.content : "Generierung angehalten."
                };
              }
              return m;
            })
          };
          if (currentUser?.uid) {
            try {
              const cleanSession = JSON.parse(JSON.stringify(updatedSession));
              setDoc(doc(db, 'users', currentUser.uid, 'chats', activeSessionId), cleanSession, { merge: true }).catch(() => {});
            } catch (syncErr) {
              console.warn("Firestore sync safe fallback:", syncErr);
            }
          }
          return updatedSession;
        }
        return s;
      }));
    }
  };

  const handleRegenerate = () => {
    if (!activeSession || activeSession.messages.length < 2) return;
    const lastUserMessage = [...activeSession.messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message and re-send prompt
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: s.messages.filter(m => m.id !== activeSession.messages[activeSession.messages.length - 1].id)
          };
        }
        return s;
      }));
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleClearMessages = () => {
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [] } : s));
    }
  };

  const [currentChatInput, setCurrentChatInput] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const hasChatMessages = Boolean(activeSession && activeSession.messages && activeSession.messages.length > 0) || activeView !== 'chat';
  const hasPromptText = currentChatInput.trim().length > 0;

  if (standaloneView === 'stocks') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <StocksStudio
          settings={settings}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          isStandaloneMode={true}
        />
      </div>
    );
  }

  if (standaloneView === 'code') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <DiceStudio
          settings={settings}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
        />
      </div>
    );
  }

  if (standaloneView === 'projects') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <Projects
          settings={settings}
          sessions={sessions}
          onBackToChat={() => {}}
          onToggleSidebar={() => {}}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          onOpenProjectChat={handleOpenProjectChat}
          onStartNewProjectChat={handleStartNewProjectChat}
          onUpdateSessions={setSessions}
        />
      </div>
    );
  }

  if (standaloneView === 'mediathek') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <Mediathek
          settings={settings}
          onToggleSidebar={() => {}}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          sessions={sessions}
          onOpenArtifact={(art) => setActiveArtifact(art)}
          onSelectSession={(sId) => setActiveSessionId(sId)}
          onNewChatWithPrompt={handleNewChatWithPrompt}
        />
      </div>
    );
  }

  if (standaloneView === 'releases') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <ReleasesStudio
          settings={settings}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          isStandaloneMode={true}
        />
      </div>
    );
  }

  if (standaloneView === 'crypto') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <CryptoStudio
          settings={settings}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          isStandaloneMode={true}
        />
      </div>
    );
  }

  if (standaloneView === 'wetter') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <WeatherStudio
          settings={settings}
        />
      </div>
    );
  }

  if (standaloneView === 'remote') {
    return (
      <div 
        className="flex w-full h-[100dvh] overflow-hidden bg-black text-white font-['Plus_Jakarta_Sans']"
      >
        <RemoteWorkspace
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onBackToChat={() => {
            setStandaloneView(null);
            setActiveView('chat');
          }}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          enableSoundEffects={settings.enableSoundEffects ?? true}
        />
      </div>
    );
  }

  return (
    <div 
      className="flex w-full overflow-hidden overflow-x-hidden bg-black text-neutral-100 font-['Plus_Jakarta_Sans'] app-root-container relative"
      style={{
        height: '100vh',
        minHeight: '100dvh',
        maxHeight: 'var(--visible-height, 100dvh)',
      }}
    >
      {/* Persistent Northern Lights Aurora radiating strictly in the bottom 1/4 behind the prompt area */}
      <AuroraPromptGlow 
        isStreaming={isStreaming} 
        isSidebarOpen={isSidebarOpen} 
        hasMessages={hasChatMessages} 
        hasInputText={hasPromptText}
        isVoiceRecording={isVoiceRecording}
        voiceVolume={voiceVolume}
      />

      {/* Offline Internet Status Banner matching IMG_0912.jpeg */}
      <OfflineBanner />

      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobile={deviceInfo.isMobile && !deviceInfo.isTablet}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setActiveView('chat');
        }}
        onNewChat={() => {
          handleNewChat();
          setActiveView('chat');
          if (isOnboardingOpen && onboardingStep === 4) {
            setOnboardingStep(5);
          }
        }}
        onDeleteChat={handleDeleteChat}
        onBulkDeleteChats={handleBulkDeleteChats}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          if (isOnboardingOpen && onboardingStep === 2) {
            setOnboardingStep(3);
          }
        }}
        onOpenIntegration={() => setIsIntegrationOpen(true)}
        onOpenDesktopGuide={() => setIsDesktopGuideOpen(true)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        engineStats={engineStats}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isTourActive={isOnboardingOpen}
        tourStep={onboardingStep}
        onTourAction={handleTourAction}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenPlugins={() => setIsPluginsOpen(true)}
        onOpenPricing={() => {
          setSettingsInitialSubPage('abo');
          setIsSettingsOpen(true);
        }}
        onOpenHelp={() => openHelpLexikon()}
        onOpenLive={() => {
          setActiveView('chat');
          setIsLiveActive(prev => !prev);
        }}
        isLiveActive={isLiveActive}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v as any);
        }}
        settings={settings}
        onOpenRemoteSetup={() => setIsRemoteSetupOpen(true)}
      />

      {/* Browser View Promo Bar (only visible when in browser, NOT installed as WebApp) */}
      {!standaloneView && (
        <BrowserPromoBanner
          isStandalone={isStandaloneApp}
          onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAbo={() => {
            setSettingsInitialSubPage('subscription');
            setIsSettingsOpen(true);
          }}
          enableSound={settings.enableSoundEffects}
        />
      )}

      {/* Main Workspace Window (Chat vs Music Studio vs Image Studio vs Video Studio vs Code Studio) */}
      {activeView === 'music' ? (
        <MusicStudio
          settings={settings}
          selectedModel={selectedModel}
          onSelectModel={(m) => setSelectedModel(m)}
          onBackToChat={() => setActiveView('chat')}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={(subPage) => {
            if (subPage) setSettingsInitialSubPage(subPage as any);
            setIsSettingsOpen(true);
          }}
        />
      ) : activeView === 'image' ? (
        <ImageStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={(subPage) => {
            if (subPage) setSettingsInitialSubPage(subPage as any);
            setIsSettingsOpen(true);
          }}
          onSendToChat={(imageUrl, promptText) => {
            setActiveView('chat');
            handleSendMessage(`Hier ist mein Bild aus MotionPicture zu "${promptText}":`, [
              {
                mimeType: 'image/png',
                data: imageUrl.startsWith('data:') ? imageUrl.split(',')[1] : '',
                url: imageUrl,
                name: promptText.slice(0, 30)
              }
            ]);
          }}
        />
      ) : activeView === 'video' ? (
        <VideoStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={(subPage) => {
            if (subPage) setSettingsInitialSubPage(subPage as any);
            setIsSettingsOpen(true);
          }}
        />
      ) : activeView === 'dice' || activeView === 'code' ? (
        <DiceStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
        />
      ) : activeView === 'stocks' || activeView === 'aktien' ? (
        <StocksStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          onAnalyzeInChat={(target) => {
            setActiveView('chat');
            if (target && 'prompt' in target && target.prompt) {
              handleSendMessage(target.prompt);
            } else if (target && target.name) {
              handleSendMessage(`Analysiere bitte die Aktie ${target.name} (${target.symbol || ''}) im Detail: Kursentwicklung, Kennzahlen, Chancen und Risiken.`);
            }
          }}
        />
      ) : activeView === 'releases' ? (
        <ReleasesStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          isStandaloneMode={false}
        />
      ) : activeView === 'crypto' ? (
        <CryptoStudio
          settings={settings}
          onBackToChat={() => setActiveView('chat')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          isStandaloneMode={false}
          onAnalyzeInChat={(coin) => {
            setActiveView('chat');
            handleSendMessage(`Erstelle bitte eine detaillierte Krypto-Marktanalyse für ${coin.name} (${coin.symbol}): Kursentwicklung, On-Chain-Metriken, technologische Grundlagen, Chancen und Risiken.`);
          }}
        />
      ) : activeView === 'mediathek' ? (
        <Mediathek
          settings={settings}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          sessions={sessions}
          onOpenArtifact={(art) => setActiveArtifact(art)}
          onSelectSession={(sId) => {
            setActiveSessionId(sId);
            setActiveView('chat');
          }}
          onNewChatWithPrompt={handleNewChatWithPrompt}
          onOpenLexikonArticle={(_articleId) => {
            openHelpLexikon();
          }}
          onOpenProjectsView={() => setActiveView('projects')}
          onStartNewProjectChat={handleStartNewProjectChat}
        />
      ) : activeView === 'projects' ? (
        <Projects
          settings={settings}
          sessions={sessions}
          onBackToChat={() => setActiveView('chat')}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          onOpenProjectChat={handleOpenProjectChat}
          onStartNewProjectChat={handleStartNewProjectChat}
          onUpdateSessions={setSessions}
        />
      ) : activeView === 'knowledge' ? (
        <KnowledgeBaseDashboard
          onBackToChat={() => setActiveView('chat')}
          onNewChatWithPrompt={handleNewChatWithPrompt}
          enableSoundEffects={settings.enableSoundEffects ?? true}
        />
      ) : activeView === 'remote' ? (
        <RemoteWorkspace
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onBackToChat={() => setActiveView('chat')}
          isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
          enableSoundEffects={settings.enableSoundEffects ?? true}
          sessions={sessions}
          onSelectSession={(sId) => {
            setActiveSessionId(sId);
            setActiveView('chat');
          }}
          userEmail={currentUser?.email || undefined}
        />
      ) : (
        <ChatWindow
          session={activeSession}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onRegenerate={handleRegenerate}
          onClearMessages={handleClearMessages}
          onInputPromptChange={setCurrentChatInput}
          onVoiceStateChange={(rec, vol) => {
            setIsVoiceRecording(rec);
            setVoiceVolume(vol);
          }}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          isTurboEnabled={isTurboEnabled}
          onToggleTurbo={() => setIsTurboEnabled(!isTurboEnabled)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          settings={settings}
          fallbackToast={fallbackToast}
          onSelectView={(view) => setActiveView(view)}
          onNewChat={handleNewChat}
          onBranchSession={handleBranchSession}
          onUpdateSession={(updated) => setSessions(prev => typeof updated === 'function' ? prev.map(s => {
            if (s.id !== activeSession?.id) return s;
            const res = updated(s);
            return res.id === s.id ? res : s;
          }) : prev.map(s => s.id === updated.id ? updated : s))}
          onDeleteChat={handleDeleteChat}
          onOpenSettings={(subPage?: string) => {
            if (subPage) {
              setSettingsInitialSubPage(subPage as any);
            }
            setIsSettingsOpen(true);
            if (isOnboardingOpen && onboardingStep === 2) {
              setOnboardingStep(3);
            }
          }}
          onOpenHelpLexicon={() => openHelpLexikon()}
          onOpenFeedback={() => {
            setSettingsInitialSubPage('feedback' as any);
            setIsSettingsOpen(true);
          }}
          isTourActive={isOnboardingOpen}
          tourStep={onboardingStep}
          onTourAction={handleTourAction}
          onOpenArtifact={(art) => setActiveArtifact(art)}
          onOpenLive={() => {
            setActiveView('chat');
            setIsLiveActive(true);
          }}
          isLiveActive={isLiveActive}
          onCloseLive={() => setIsLiveActive(false)}
          onSaveLiveTranscript={handleSaveTranscriptToChat}
          isMobile={deviceInfo.isMobile}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Artifacts Canvas */}

      <ArtifactsCanvas
        artifact={activeArtifact}
        onClose={() => setActiveArtifact(null)}
      />

      {/* Progressive Unfolding Interactive Tour - Only shows after boot loader and update modal are dismissed */}
      <OnboardingModal
        isOpen={isOnboardingOpen && !isAppBooting && !isUpdateModalOpen}
        onClose={completeOnboardingTour}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        step={onboardingStep}
        setStep={setOnboardingStep}
        isSettingsOpen={isSettingsOpen}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          if (onboardingStep === 2) setOnboardingStep(3);
        }}
        onCloseSettings={() => {
          setIsSettingsOpen(false);
          if (onboardingStep === 3) setOnboardingStep(4);
        }}
        onNewChat={() => {
          handleNewChat();
          if (onboardingStep === 4) setOnboardingStep(5);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsInitialSubPage(null);
          setSettingsInitialLexikonArticle(null);
          if (isOnboardingOpen && onboardingStep === 3) {
            setOnboardingStep(4);
          }
        }}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        initialSubPage={settingsInitialSubPage}
        initialLexikonArticleId={settingsInitialLexikonArticle}
        onOpenOnboarding={handleReopenOnboarding}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenPlugins={() => setIsPluginsOpen(true)}
        onNewChatWithPlugin={handleNewChatWithPlugin}
        chatSessions={sessions}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        onOpenDesktopExporter={() => setIsDesktopGuideOpen(true)}
        onOpenShowcase={() => setIsAppleShowcaseOpen(true)}
        onOpenHelpLexicon={() => openHelpLexikon()}
      />

      {/* Project Chat Popup Modal (Centered, not taking full screen, like LimitReachedModal) */}
      <AnimatePresence>
        {isProjectChatModalOpen && activeSession && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md select-none transform-gpu"
            onClick={() => setIsProjectChatModalOpen(false)}
          >
            <motion.div
              key="project-chat-popup-container"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl sm:max-w-2xl h-[78vh] max-h-[640px] bg-[#121215] border border-white/10 rounded-[28px] sm:rounded-[32px] shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden text-white relative flex flex-col font-['Plus_Jakarta_Sans']"
            >
              {/* Soft Ambient Dunkelblau Glow in Background */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 bg-blue-600/20 rounded-full blur-[130px] pointer-events-none -z-10" />

              <ChatWindow
                session={activeSession}
                isInsidePopupModal={true}
                onClosePopup={() => setIsProjectChatModalOpen(false)}
                onSendMessage={handleSendMessage}
                onStopStreaming={handleStopStreaming}
                onRegenerate={handleRegenerate}
                onClearMessages={handleClearMessages}
                onInputPromptChange={setCurrentChatInput}
                onVoiceStateChange={(rec, vol) => {
                  setIsVoiceRecording(rec);
                  setVoiceVolume(vol);
                }}
                isStreaming={isStreaming}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                isTurboEnabled={isTurboEnabled}
                onToggleTurbo={() => setIsTurboEnabled(!isTurboEnabled)}
                settings={settings}
                fallbackToast={fallbackToast}
                onSelectView={(view) => {
                  setIsProjectChatModalOpen(false);
                  setActiveView(view);
                }}
                onNewChat={handleNewChat}
                onBranchSession={handleBranchSession}
                onUpdateSession={(updated) => setSessions(prev => typeof updated === 'function' ? prev.map(s => {
                  if (s.id !== activeSession?.id) return s;
                  const res = updated(s);
                  return res.id === s.id ? res : s;
                }) : prev.map(s => s.id === updated.id ? updated : s))}
                onDeleteChat={(delId) => {
                  handleDeleteChat(delId);
                  setIsProjectChatModalOpen(false);
                }}
                onOpenSettings={(subPage?: string) => {
                  if (subPage) setSettingsInitialSubPage(subPage as any);
                  setIsSettingsOpen(true);
                }}
                onOpenHelpLexicon={() => openHelpLexikon()}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                isMobile={deviceInfo.isMobile || deviceInfo.isTablet}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HelpLexiconModal
        isOpen={isHelpLexiconOpen}
        onClose={() => setIsHelpLexiconOpen(false)}
        enableSound={settings.enableSoundEffects}
      />

      <AppleFeatureShowcaseModal
        isOpen={isAppleShowcaseOpen}
        onClose={() => setIsAppleShowcaseOpen(false)}
        enableSound={settings.enableSoundEffects}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        onOpenRedeem={() => {
          setSettingsInitialSubPage('abo');
          setIsSettingsOpen(true);
        }}
        onOpenApiKeys={() => {
          setSettingsInitialSubPage('api');
          setIsSettingsOpen(true);
        }}
        userTier={settings.userTier || 'Kostenlos'}
        limit={limitMaxAllowed}
        retryAfterSeconds={limitRetryAfterSeconds}
        isNoKeyExceeded={isNoKeyLimitExceeded}
      />

      <IntegrationHubModal
        isOpen={isIntegrationOpen}
        onClose={() => setIsIntegrationOpen(false)}
      />

      <PluginsModal
        isOpen={isPluginsOpen}
        onClose={() => setIsPluginsOpen(false)}
        onActivatePlugin={(pluginId) => {
          if (!installedPluginIds.includes(pluginId)) {
            setInstalledPluginIds(prev => [...prev, pluginId]);
          }
          handleNewChatWithPlugin(pluginId);
        }}
        installedPluginIds={installedPluginIds}
        enableSound={settings.enableSoundEffects}
      />

      <DesktopExporterModal
        isOpen={isDesktopGuideOpen}
        onClose={() => setIsDesktopGuideOpen(false)}
      />

      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        deferredPrompt={deferredPrompt}
        onOpenDesktopGuide={() => setIsDesktopGuideOpen(true)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        sessions={sessions}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onOpenSettings={(subPage) => {
          setSettingsInitialSubPage(subPage || null);
          setIsSettingsOpen(true);
        }}
        onModelChange={handleModelChange}
        selectedModel={selectedModel}
        onOpenTranscribe={() => setIsGlobalTranscribeOpen(true)}
      />

      <AudioTranscribeModal
        isOpen={isGlobalTranscribeOpen}
        onClose={() => setIsGlobalTranscribeOpen(false)}
        onInsertToChat={(text) => {
          setActiveView('chat');
          handleSendMessage(text);
        }}
        customApiKey={settings.customApiKey}
        soundEnabled={settings.enableSoundEffects}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        enableSound={settings.enableSoundEffects}
      />

      <GeminiPromptBar
        isOpen={isPromptBarOpen}
        onClose={() => setIsPromptBarOpen(false)}
        onSubmitPrompt={(promptText) => {
          setActiveView('chat');
          handleSendMessage(promptText);
        }}
        onOpenActionGuide={() => setIsActionGuideOpen(true)}
        enableSound={settings.enableSoundEffects}
      />

      <ActionButtonGuideModal
        isOpen={isActionGuideOpen}
        onClose={() => setIsActionGuideOpen(false)}
        onTestPromptBar={() => setIsPromptBarOpen(true)}
        enableSound={settings.enableSoundEffects}
      />

      <RemoteSetupModal
        isOpen={isRemoteSetupOpen}
        onClose={() => setIsRemoteSetupOpen(false)}
        userEmail={currentUser?.email || undefined}
        onConnected={() => {
          setActiveView('remote');
        }}
        enableSoundEffects={settings.enableSoundEffects}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen && !isAppBooting}
        onClose={handleCloseUpdateModal}
      />

      {/* Steam-Style Achievement Toast Notification */}
      <SteamAchievementToast />

      {/* First-Time Feature Intro Modal matching IMG_1233_ac1d5731.png */}
      <FeatureIntroModal
        featureKey={activeIntroFeature}
        isOpen={Boolean(activeIntroFeature)}
        onClose={() => setActiveIntroFeature(null)}
        soundEnabled={settings.enableSoundEffects}
      />

      {/* 5-Second System Boot & Warm-Up Matrix Loader */}
      {isAppBooting && (
        <AppBootLoader
          durationMs={5000}
          onComplete={() => setIsAppBooting(false)}
        />
      )}
    </div>
  );
}
