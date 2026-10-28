import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Trash2, 
  Settings, 
  Search, 
  PenSquare,
  Pin, 
  Check, 
  X,
  CheckSquare,
  Square,
  MoreVertical,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Dices,
  Edit2,
  Image as ImageIcon,
  Music,
  Video,
  Film,
  Code2,
  TrendingUp,
  Coins,
  Sparkles,
  Users,
  Library,
  Folder,
  Calendar,
  Puzzle,
  Share2,
  BookOpen,
  Radio,
  Pencil,
  User as UserIcon,
  LayoutGrid,
  Gem,
  Network,
  Brain,
  Laptop,
  HelpCircle
} from 'lucide-react';
import { loadRemoteState } from '../utils/remoteConnection';
import { ChatSession, EngineStats, GemmaModelId, EngineSettings } from '../types';
import { openHelpLexikon } from '../utils/openHelp';
import { User } from '../lib/firebase';
import { playSound } from '../utils/sound';
import { getUsageState, UsageState } from '../utils/usageTracker';
import { useDeviceType, useIsStandalone, setAppModePreference } from '../utils/useDeviceType';
import { ShardFitnessRing, loadShardsState } from '../utils/shardsTracker';
import { DandeliousLogo } from './DandeliousLogo';

export const TwoLinesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    className={className}
  >
    <line x1="4.5" y1="8.5" x2="19.5" y2="8.5" />
    <line x1="4.5" y1="15.5" x2="19.5" y2="15.5" />
  </svg>
);

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onBulkDeleteChats: (ids: string[]) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  onOpenIntegration?: () => void;
  onOpenDesktopGuide?: () => void;
  onOpenPWAInstall?: () => void;
  engineStats?: EngineStats | null;
  selectedModel?: GemmaModelId;
  onModelChange?: (model: GemmaModelId) => void;
  isTourActive?: boolean;
  tourStep?: number;
  onTourAction?: (action: 'click_new_chat' | 'click_settings') => void;
  enableSoundEffects?: boolean;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onOpenPlugins?: () => void;
  activeView?: 'chat' | 'dice' | 'code' | 'image' | 'music' | 'video' | 'mediathek' | 'projects' | 'knowledge' | string;
  onSelectView?: (view: any) => void;
  onOpenLive?: () => void;
  isLiveActive?: boolean;
  settings?: EngineSettings;
  isMobile?: boolean;
  onOpenRemoteSetup?: () => void;
  onOpenPricing?: () => void;
  onOpenHelp?: () => void;
}

const STORAGE_SIDEBAR_WIDTH = 'saphire_sidebar_width';

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  isOpen,
  onToggleOpen,
  onSelectSession,
  onNewChat,
  onDeleteChat,
  onBulkDeleteChats,
  onRenameChat,
  onTogglePin,
  onOpenSettings,
  onOpenDesktopGuide,
  onOpenPWAInstall,
  enableSoundEffects = true,
  currentUser = null,
  onOpenAuth,
  onOpenPlugins,
  activeView = 'chat',
  onSelectView,
  onOpenLive,
  isLiveActive = false,
  settings,
  isMobile: isMobileProp,
  onOpenRemoteSetup,
  onOpenPricing,
  onOpenHelp,
}) => {
  const [remoteState, setRemoteState] = useState(() => loadRemoteState());

  useEffect(() => {
    const handleRemoteUpdate = () => {
      setRemoteState(loadRemoteState());
    };
    window.addEventListener('dandelious_remote_state_changed', handleRemoteUpdate);
    return () => {
      window.removeEventListener('dandelious_remote_state_changed', handleRemoteUpdate);
    };
  }, []);
  const deviceInfo = useDeviceType();
  // Phones (Handys): viewport width < 640px, or isMobile without tablet
  const isHandy = (isMobileProp !== undefined ? isMobileProp : (deviceInfo.isMobile && !deviceInfo.isTablet)) || (typeof window !== 'undefined' && window.innerWidth < 640);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [contextMenu, setContextMenu] = useState<{ session: ChatSession; x: number; y: number } | null>(null);

  // Resizable Sidebar state (default 315px, min 260px, max 460px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_SIDEBAR_WIDTH);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 460) return parsed;
      }
    }
    return 315;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMoreToolsExpanded, setIsMoreToolsExpanded] = useState(() => {
    return activeView === 'image' || activeView === 'video' || activeView === 'music' || activeView === 'code';
  });

  useEffect(() => {
    if (['video', 'music', 'image', 'code'].includes(activeView)) {
      setIsMoreToolsExpanded(true);
    }
  }, [activeView]);
  const [usage, setUsage] = useState<UsageState>(() => getUsageState());
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const userDisplayName = React.useMemo(() => {
    if (settings?.userNickname?.trim()) return settings.userNickname.trim();
    if (currentUser?.displayName?.trim()) return currentUser.displayName.trim();
    if (currentUser?.providerData) {
      for (const p of currentUser.providerData) {
        if (p.displayName?.trim()) return p.displayName.trim();
      }
    }
    if (currentUser?.email) {
      const raw = currentUser.email.split('@')[0];
      return raw
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return '';
  }, [currentUser, settings?.userNickname]);

  const userPhotoURL = React.useMemo(() => {
    if (currentUser?.photoURL) return currentUser.photoURL;
    if (currentUser?.providerData) {
      for (const p of currentUser.providerData) {
        if (p.photoURL) return p.photoURL;
      }
    }
    return null;
  }, [currentUser]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [userPhotoURL]);

  const showSidebarToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleShareSession = (session: ChatSession) => {
    const shareUrl = `${window.location.origin}/?chat=${encodeURIComponent(session.id)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showSidebarToast('Unterhaltung geteilt: Link kopiert!');
      playSound('pop', enableSoundEffects);
    }).catch(() => {
      showSidebarToast('Link konnte nicht kopiert werden');
    });
  };

  const handleAddToNotebook = (session: ChatSession) => {
    try {
      const existing = JSON.parse(localStorage.getItem('saphire_notebook') || '[]');
      if (!existing.some((item: any) => item.id === session.id)) {
        existing.push({
          id: session.id,
          title: session.title,
          addedAt: Date.now(),
          messageCount: session.messages?.length || 0,
        });
        localStorage.setItem('saphire_notebook', JSON.stringify(existing));
      }
      showSidebarToast('Zum Notebook hinzugefügt');
      playSound('pop', enableSoundEffects);
    } catch {
      showSidebarToast('Zum Notebook hinzugefügt');
    }
  };

  useEffect(() => {
    const handleUsageUpdate = (e: any) => {
      if (e.detail) {
        setUsage(e.detail);
      } else {
        setUsage(getUsageState());
      }
    };
    window.addEventListener('saphir_usage_updated', handleUsageUpdate);
    return () => window.removeEventListener('saphir_usage_updated', handleUsageUpdate);
  }, []);

  const touchTimerRef = useRef<any>(null);
  const isResizingRef = useRef(false);

  // Handle Drag Resizing of Sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 240), 420);
      setSidebarWidth(newWidth);
      localStorage.setItem(STORAGE_SIDEBAR_WIDTH, newWidth.toString());
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Close full-screen sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggleOpen]);

  const filteredSessions = React.useMemo(() => {
    const seen = new Set<string>();
    return sessions.filter(s => {
      if (!s || !s.id || seen.has(s.id)) return false;
      // Hide project chats from the main sidebar
      if (s.projectId) return false;
      
      // Hide chats that have no messages yet
      if (!s.messages || s.messages.length === 0) return false;
      
      const match = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()));

      if (match) {
        seen.add(s.id);
        return true;
      }
      return false;
    });
  }, [sessions, searchTerm]);

  const groupSessionsByTime = (sessionList: ChatSession[]) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

    const heute: ChatSession[] = [];
    const gestern: ChatSession[] = [];
    const dreissigTage: ChatSession[] = [];

    sessionList.forEach((s) => {
      const time = s.updatedAt || s.createdAt || Date.now();
      if (time >= startOfToday) {
        heute.push(s);
      } else if (time >= startOfYesterday) {
        gestern.push(s);
      } else {
        dreissigTage.push(s);
      }
    });

    return { heute, gestern, dreissigTage };
  };

  const { heute, gestern, dreissigTage } = groupSessionsByTime(filteredSessions);

  const toggleSelectSession = (id: string) => {
    setSelectedSessionIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessionIds.length === filteredSessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(filteredSessions.map(s => s.id));
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedSessionIds.length > 0) {
      onBulkDeleteChats(selectedSessionIds);
      setSelectedSessionIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
    setContextMenu(null);
  };

  const handleSaveRename = (e: React.SyntheticEvent, id: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleTouchStart = (e: React.TouchEvent, session: ChatSession) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setContextMenu({ session, x, y });
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleContextMenu = (e: React.MouseEvent, session: ChatSession) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ session, x: e.clientX, y: e.clientY });
  };

  const isStandalone = useIsStandalone();
  const isWebGuestMode = !currentUser && !isStandalone && settings?.appMode !== 'webapp';
  const currentTier = settings?.userTier || 'Plus';

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="sidebar-floating-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            playSound('click', enableSoundEffects);
            onToggleOpen();
          }}
          className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] cursor-pointer ${
            isHandy ? "hidden" : "block"
          } sm:block`}
          id="sidebar-backdrop"
        />
      )}

      {isOpen && (
        <motion.aside 
          key="sidebar-drawer"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            style={
              !isHandy
                ? {
                    top: '1mm',
                    bottom: '1mm',
                    left: '1mm',
                    height: 'calc(100dvh - 2mm)',
                    width: `${sidebarWidth}px`,
                    maxWidth: 'calc(100vw - 16px)',
                  }
                : undefined
            }
            className={`fixed z-50 flex flex-col select-none text-white overflow-hidden transition-[box-shadow,border-color] duration-200 bg-black ${
              isHandy 
                ? "inset-0 w-full h-full min-h-[100dvh] rounded-none border-0 shadow-none" 
                : "top-[1mm] bottom-[1mm] left-[1mm] h-[calc(100dvh-2mm)] rounded-[20px] border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.95)]"
            } sm:top-[1mm] sm:bottom-[1mm] sm:left-[1mm] sm:h-[calc(100dvh-2mm)] sm:rounded-[20px] sm:bg-black sm:border sm:border-white/[0.12] sm:shadow-[0_20px_60px_rgba(0,0,0,0.95)]`}
            id="dandelious-main-sidebar"
          >
            {/* Content Column */}
            <div className={`w-full h-full flex flex-col justify-between relative overflow-hidden px-4 bg-black ${
              isHandy ? "max-w-md mx-auto" : "sm:px-4"
            } sm:max-w-none`}>
              
              {isWebGuestMode ? (
                /* ========================================================================= */
                /* WEB VERSION GUEST SIDEBAR (Only in normal web browser when not standalone/webapp) */
                /* ========================================================================= */
                <div className="flex flex-col h-full justify-between py-4 select-none text-white">
                  {/* Top Bar: Dandelious Title + Search Round Button */}
                  <div>
                    <div className="flex items-center justify-between pb-6 pt-2">
                      <h1 className="text-[26px] sm:text-[28px] font-bold text-white tracking-tight">
                        Dandelious
                      </h1>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          setShowSearchInput(!showSearchInput);
                        }}
                        className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border-0 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                        title="Suchen"
                      >
                        <Search className="w-5 h-5 stroke-[2]" />
                      </button>
                    </div>

                    {showSearchInput && (
                      <div className="pb-4">
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-[#1c1c1e] text-xs text-white placeholder-neutral-400 rounded-full px-4 py-2.5 outline-none border-0"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Menu List Items im einheitlichen grauen Kapsel-Design wie Mediathek & Einstellungen */}
                    <div className="space-y-1.5">
                      {/* 1. Neuer Chat */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onNewChat();
                          if (onSelectView) onSelectView('chat');
                          onToggleOpen();
                        }}
                        className="w-full bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <MessageSquare className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Neuer Chat</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      {/* 2. Mediathek */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onSelectView) onSelectView('mediathek');
                          onToggleOpen();
                        }}
                        className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                          activeView === 'mediathek'
                            ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                            : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <svg className="w-5 h-5 text-neutral-300 stroke-[1.8] shrink-0 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3.5" y="3.5" width="7" height="7" rx="2.5" />
                            <rect x="13.5" y="3.5" width="7" height="7" rx="2.5" />
                            <rect x="3.5" y="13.5" width="7" height="7" rx="2.5" />
                            <rect x="13.5" y="13.5" width="7" height="7" rx="2.5" />
                          </svg>
                          <span className="text-[15px] font-normal text-white">Mediathek</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      {/* 3. Projekte */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onSelectView) onSelectView('projects');
                          onToggleOpen();
                        }}
                        className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                          activeView === 'projects'
                            ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                            : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Projekte</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      {/* 4. Remote */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onSelectView) onSelectView('remote');
                          onToggleOpen();
                        }}
                        className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                          activeView === 'remote'
                            ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                            : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Laptop className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Remote</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      {/* 5. Deep Research */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onNewChat();
                          if (onSelectView) onSelectView('chat');
                          onToggleOpen();
                        }}
                        className="w-full bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <Sparkles className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Deep Research</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      {/* 6. Pläne und Preise anzeigen */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onOpenPricing) {
                            onOpenPricing();
                          } else {
                            onOpenSettings();
                          }
                          onToggleOpen();
                        }}
                        className="w-full bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <Gem className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Pläne und Preise anzeigen</span>
                        </div>
                        <Share2 className="w-4 h-4 text-neutral-400 rotate-45 shrink-0" />
                      </button>

                      {/* 7. Hilfe (Direkt zu externem Dandelious-Lexikon) */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          openHelpLexikon();
                          onToggleOpen();
                        }}
                        className="w-full bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <HelpCircle className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white">Hilfe</span>
                        </div>
                        <Share2 className="w-4 h-4 text-neutral-400 rotate-45 shrink-0" />
                      </button>

                      {/* 8. Als WebApp nutzen (Vollversion) */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('pop', enableSoundEffects);
                          setAppModePreference('webapp');
                          showSidebarToast('WebApp-Vollversion aktiviert');
                        }}
                        className="w-full bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3.5">
                          <Laptop className="w-5 h-5 text-[#4c8dff] stroke-[1.8] shrink-0" />
                          <span className="text-[15px] font-normal text-white">Als WebApp nutzen</span>
                        </div>
                        <span className="text-[11px] font-semibold bg-[#4c8dff]/20 text-[#4c8dff] px-2 py-0.5 rounded-full uppercase tracking-wider">Vollversion</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Section matching Screenshot */}
                  <div className="space-y-5 pt-4">
                    {/* Sign-in Promotion Box */}
                    <div className="p-5 rounded-3xl bg-[#141416] border border-white/5 space-y-3 shadow-xl">
                      <h3 className="text-[15px] font-bold text-white tracking-tight leading-snug">
                        Erhalte Antworten, die auf dich zugeschnitten sind
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                        Melde dich an, um Antworten basierend auf gespeicherten Chats zu erhalten sowie Bilder zu erstellen und Dateien hochzuladen.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onOpenAuth) onOpenAuth();
                          onToggleOpen();
                        }}
                        className="w-full py-3 bg-[#242426] hover:bg-[#2c2c2e] active:scale-98 text-white font-semibold text-sm rounded-full transition-all cursor-pointer text-center shadow-md"
                      >
                        Anmelden
                      </button>
                    </div>

                    {/* Bottom Floating Bar: Blue Chat Button + Gear Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onNewChat();
                          if (onSelectView) onSelectView('chat');
                          onToggleOpen();
                        }}
                        className="bg-[#3b82f6] hover:bg-[#2563eb] active:scale-95 text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2.5 shadow-lg cursor-pointer transition-all text-sm"
                      >
                        <PenSquare className="w-4 h-4 text-white stroke-[2]" />
                        <span>Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onOpenSettings();
                          onToggleOpen();
                        }}
                        className="w-11 h-11 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
                        title="Einstellungen"
                      >
                        <Settings className="w-5 h-5 stroke-[1.8]" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* LOGGED IN FULL SIDEBAR */
                /* ========================================================================= */
                <>
              {/* Top Bar: "Dandelious" and "X" Close Button */}
              <div className={`flex items-center justify-between shrink-0 pb-2 ${
                isHandy ? "pt-[max(env(safe-area-inset-top,0px),18px)]" : "pt-3.5"
              } sm:pt-3.5`}>
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const currentShards = loadShardsState().shardsCount;
                    const nextMilestone = currentShards < 20 ? 20 : currentShards < 50 ? 50 : currentShards < 70 ? 70 : 100;
                    return (
                      <motion.button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onOpenSettings();
                        }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          scale: [1, 1.06, 1],
                          filter: [
                            'drop-shadow(0 0 2px rgba(56,189,248,0.4))',
                            'drop-shadow(0 0 8px rgba(168,85,247,0.8))',
                            'drop-shadow(0 0 2px rgba(56,189,248,0.4))'
                          ]
                        }}
                        transition={{
                          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                          filter: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                        }}
                        className="cursor-pointer flex items-center justify-center relative p-0.5 rounded-full shrink-0"
                        title={`Dandelious Shards (${currentShards} / ${nextMilestone} Shards bis zum nächsten Vorteil)`}
                      >
                        <ShardFitnessRing shardsCount={currentShards} maxGoal={nextMilestone} size={25} strokeWidth={3.5} showCenterIcon={false} />
                      </motion.button>
                    );
                  })()}
                  <span className="text-[20px] font-semibold text-white tracking-tight">
                    Dandelious
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    onToggleOpen();
                  }}
                  className="p-1.5 -mr-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Schließen (Esc)"
                  id="sidebar-close-btn"
                >
                  <X className="w-6 h-6 stroke-[1.8]" />
                </button>
              </div>

            {/* Scrollable Navigation & Chat List Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pt-1 pb-4">
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                dragSnapToOrigin
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
                className="space-y-1"
              >
              {/* 1. Neuer Chat */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  onNewChat();
                  if (onSelectView) onSelectView('chat');
                  onToggleOpen();
                }}
                className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                  activeView === 'chat' && (!activeSessionId || sessions.find(s => s.id === activeSessionId)?.messages?.length === 0)
                    ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                    : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                }`}
                id="sidebar-new-chat-btn"
              >
                <div className="flex items-center gap-3.5">
                  <MessageSquare className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                  <span className="text-[15px] font-normal text-white">Neuer Chat</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* 2. Mediathek */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  if (onSelectView) onSelectView('mediathek');
                  onToggleOpen();
                }}
                className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                  activeView === 'mediathek'
                    ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                    : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                }`}
                id="sidebar-mediathek-btn"
              >
                <div className="flex items-center gap-3.5">
                  <svg className="w-5 h-5 text-neutral-300 stroke-[1.8] shrink-0 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="3.5" width="7" height="7" rx="2.5" />
                    <rect x="13.5" y="3.5" width="7" height="7" rx="2.5" />
                    <rect x="3.5" y="13.5" width="7" height="7" rx="2.5" />
                    <rect x="13.5" y="13.5" width="7" height="7" rx="2.5" />
                  </svg>
                  <span className="text-[15px] font-normal text-white">Mediathek</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* 3. Projekte */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  if (onSelectView) onSelectView('projects');
                  onToggleOpen();
                }}
                className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                  activeView === 'projects'
                    ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                    : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                }`}
                id="sidebar-projects-btn"
              >
                <div className="flex items-center gap-3.5">
                  <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                  <span className="text-[15px] font-normal text-white">Projekte</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* 4. Remote */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  if (onSelectView) onSelectView('remote');
                  onToggleOpen();
                }}
                className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                  activeView === 'remote'
                    ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                    : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                }`}
                id="sidebar-remote-btn"
              >
                <div className="flex items-center gap-3.5">
                  <Laptop className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                  <span className="text-[15px] font-normal text-white">Remote</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* 5. Chats durchsuchen */}
              <div className="space-y-1">
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', enableSoundEffects);
                      setShowSearchInput(!showSearchInput);
                    }}
                    className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                      showSearchInput || searchTerm 
                        ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium' 
                        : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                    }`}
                    id="sidebar-search-btn"
                  >
                    <div className="flex items-center gap-3.5">
                      <Search className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                      <span className="text-[15px] font-normal text-white">Chats durchsuchen</span>
                    </div>
                    {searchTerm ? (
                      <span className="text-[11px] font-mono text-[#4c8dff] bg-[#4c8dff]/15 px-2 py-0.5 rounded-full border border-[#4c8dff]/25">
                        {filteredSessions.length} {filteredSessions.length === 1 ? 'Treffer' : 'Treffer'}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {showSearchInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pt-1 pb-1 px-1"
                    >
                      <div className="relative flex items-center">
                        <Search className="absolute left-3.5 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Titel oder Nachrichten durchsuchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              if (searchTerm) setSearchTerm('');
                              else setShowSearchInput(false);
                            }
                          }}
                          className="w-full bg-[#18191c] text-xs text-white placeholder-neutral-500 rounded-full pl-9 pr-8 py-2.5 outline-none border border-white/10 focus:border-white/30 transition-colors shadow-inner"
                          autoFocus
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              playSound('pop', enableSoundEffects);
                              setSearchTerm('');
                            }}
                            className="absolute right-2.5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            title="Suche leeren"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. Ausklapp-Menü (Weitere Module) */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    setIsMoreToolsExpanded(prev => !prev);
                  }}
                  className={`w-full rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm cursor-pointer text-left active:scale-[0.99] ${
                    ['video', 'music', 'image', 'code'].includes(activeView as string)
                      ? 'bg-[#2c2c2e] ring-1 ring-white/20 text-white font-medium'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                  }`}
                  id="sidebar-more-tools-btn"
                  title="Weitere Module"
                >
                  <div className="flex items-center gap-3.5">
                    <MoreHorizontal className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white">Weitere Module</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8e8e93] transition-transform duration-200 group-hover:text-white ${
                      isMoreToolsExpanded ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {/* Sub-Items */}
                <AnimatePresence>
                  {isMoreToolsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-3 space-y-1 border-l border-white/10 ml-5 my-1"
                    >
                      {/* Plugins */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onOpenPlugins) onOpenPlugins();
                          onToggleOpen();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-full text-[14px] bg-[#1c1c1e] hover:bg-[#252528] text-[#e3e3e3] hover:text-white transition-colors cursor-pointer text-left"
                        id="sidebar-plugins-btn"
                      >
                        <div className="flex items-center gap-3">
                          <Puzzle className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                          <span>Plugins</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
                      </button>

                      {/* Code */}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          if (onSelectView) onSelectView('code');
                          onToggleOpen();
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-[14px] transition-colors cursor-pointer text-left ${
                          activeView === 'code' ? 'bg-[#2c2c2e] text-white font-medium ring-1 ring-white/20' : 'bg-[#1c1c1e] hover:bg-[#252528] text-[#e3e3e3]'
                        }`}
                        id="sidebar-code-btn"
                      >
                        <div className="flex items-center gap-3">
                          <Code2 className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                          <span>Code</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section Header: "Letzte" (matching Screenshot) */}
              <div className="pt-6 pb-2 px-3">
                <span className="text-[13.5px] font-medium text-neutral-400 tracking-normal">
                  Letzte
                </span>
              </div>

              {/* Chats List */}
              <div className="space-y-0.5">
                {isSelectionMode && (
                  <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 rounded-xl mb-2 border border-white/10">
                    <span className="text-xs font-medium text-white">{selectedSessionIds.length} ausgewählt</span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleSelectAll} className="text-xs text-white hover:underline cursor-pointer">Alle</button>
                      <button onClick={handleConfirmBulkDelete} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"><Trash2 className="w-3 h-3 text-red-400"/> Löschen</button>
                      <button onClick={() => { setIsSelectionMode(false); setSelectedSessionIds([]); }} className="text-xs text-neutral-400 hover:text-white cursor-pointer">Abbrechen</button>
                    </div>
                  </div>
                )}
                
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-6 text-sm text-neutral-500">
                    Keine Chats vorhanden
                  </div>
                ) : (
                  <>
                    {/* Show pinned sessions first, then the rest */}
                    {filteredSessions
                      .slice()
                      .sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        const timeA = a.updatedAt || a.createdAt || 0;
                        const timeB = b.updatedAt || b.createdAt || 0;
                        return timeB - timeA;
                      })
                      .map((s, idx) => renderChatItem(s, idx))}
                  </>
                )}
              </div>
              </motion.div>
            </div>

            {/* Bottom Footer: User Profile + Tier + Settings (Matching Screenshot) */}
            <div className={`shrink-0 flex items-center justify-between border-t border-white/[0.08] select-none pt-3 ${
              isHandy ? "pb-[max(env(safe-area-inset-bottom,0px),16px)] bg-black" : "pb-3.5 bg-transparent"
            } sm:pb-3.5 sm:bg-transparent`}>
              {currentUser ? (
                <div 
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    onOpenSettings();
                    onToggleOpen();
                  }}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer group"
                >
                  {/* Circular Avatar with referrerPolicy and initials fallback */}
                  <div className="w-10 h-10 rounded-full border border-white/10 shrink-0 overflow-hidden flex items-center justify-center bg-neutral-900">
                    {userPhotoURL && !avatarLoadError ? (
                      <img
                        src={userPhotoURL}
                        alt={userDisplayName}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarLoadError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white font-semibold text-[15px] select-none">
                        {userDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & Tier */}
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[15px] font-medium text-white tracking-tight truncate group-hover:text-neutral-300 transition-colors">
                      {userDisplayName}
                    </span>
                    <span className="text-[11.5px] font-semibold text-neutral-400 tracking-wider uppercase">
                      {(settings?.userTier || 'Plus').toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    if (onOpenAuth) onOpenAuth();
                    onToggleOpen();
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors">
                    <UserIcon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="flex flex-col min-w-0 justify-center">
                    <span className="text-[15px] font-medium text-white tracking-tight group-hover:text-neutral-300 transition-colors">
                      Anmelden
                    </span>
                    <span className="text-[11.5px] text-neutral-400">
                      Konto verbinden
                    </span>
                  </div>
                </div>
              )}

              {/* Settings Gear Icon on the right */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  onOpenSettings();
                  onToggleOpen();
                }}
                className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Einstellungen"
                id="sidebar-settings-btn"
              >
                <Settings className="w-6 h-6 stroke-[1.8]" />
              </button>
            </div>
          </>
          )}
        </div>

          {/* Toast Notification Pill */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-20 left-4 right-4 z-50 bg-neutral-900 border border-white/15 px-4 py-2.5 rounded-full text-xs text-white font-medium text-center shadow-2xl"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Context Menu Popup matching iOS/ChatGPT Screenshot IMG_0899.jpeg */}
          <AnimatePresence>
            {contextMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.72, y: -14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -8 }}
                transition={{ type: "spring", damping: 22, stiffness: 360, mass: 0.65 }}
                style={{ 
                  top: Math.min(contextMenu.y, window.innerHeight - 260), 
                  left: Math.min(contextMenu.x, window.innerWidth - 240),
                  transformOrigin: "top left"
                }}
                className="fixed z-50 w-60 bg-black border border-white/15 rounded-[24px] p-1.5 shadow-2xl space-y-0.5 text-[14.5px] text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Unterhaltung teilen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareSession(contextMenu.session);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-neutral-900 text-left transition-colors cursor-pointer text-white font-normal"
                >
                  <Share2 className="w-[18px] h-[18px] text-white stroke-[1.8] shrink-0" />
                  <span>Unterhaltung teilen</span>
                </button>

                {/* 2. Anpinnen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(contextMenu.session.id);
                    playSound('pop', enableSoundEffects);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-neutral-900 text-left transition-colors cursor-pointer text-white font-normal"
                >
                  <Pin className="w-[18px] h-[18px] text-white stroke-[1.8] shrink-0" />
                  <span>{contextMenu.session.isPinned ? 'Pin lösen' : 'Anpinnen'}</span>
                </button>

                {/* 3. Umbenennen */}
                <button
                  onClick={(e) => handleStartRename(e, contextMenu.session)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-neutral-900 text-left transition-colors cursor-pointer text-white font-normal"
                >
                  <Pencil className="w-[18px] h-[18px] text-white stroke-[1.8] shrink-0" />
                  <span>Umbenennen</span>
                </button>

                {/* 4. Löschen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(contextMenu.session.id);
                    playSound('click', enableSoundEffects);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-red-500/15 text-left transition-colors cursor-pointer text-[#ff453a] font-normal"
                >
                  <Trash2 className="w-[18px] h-[18px] text-[#ff453a] stroke-[1.8] shrink-0" />
                  <span className="text-[#ff453a]">Löschen</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drag resize handle for PC/desktop/tablet */}
          {!isHandy && (
            <div 
              onMouseDown={handleStartResize}
              className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-[#4c8dff]/20 active:bg-[#4c8dff]/40 transition-colors z-20 hidden sm:block"
              title="Breite anpassen"
            />
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );

  function renderChatItem(session: ChatSession, index: number) {
    const isActive = session.id === activeSessionId && activeView === 'chat';
    const isEditing = editingId === session.id;
    const isSelected = selectedSessionIds.includes(session.id);

    return (
      <motion.div
        key={`sb-session-${session.id || index}-${index}`}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        onClick={() => {
          if (isSelectionMode) {
            toggleSelectSession(session.id);
          } else {
            playSound('click', enableSoundEffects);
            onSelectSession(session.id);
            if (onSelectView) onSelectView('chat');
            onToggleOpen();
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, session)}
        onTouchStart={(e) => handleTouchStart(e, session)}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={`group relative flex items-center justify-between px-4 py-2.5 rounded-full cursor-pointer transition-colors select-none ${
          isActive && !isSelectionMode
            ? 'bg-[#1e1f20] text-white font-medium' 
            : isSelected
            ? 'bg-[#2a2a2f] text-white font-medium'
            : 'text-[#e3e3e3] hover:text-white hover:bg-[#1a1a1e]'
        }`}
        id={`chat-item-${session.id}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
          {isSelectionMode ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectSession(session.id);
              }}
              className="p-0.5 shrink-0"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-white fill-white/20 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400 shrink-0" />
              )}
            </button>
          ) : null}

          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e, session.id)}
              className="bg-black text-white px-2.5 py-1 rounded-lg border border-white/20 text-[16px] font-medium w-full focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="min-w-0 truncate">
              <span className={`truncate block text-[16.5px] leading-snug tracking-tight ${
                isActive ? 'font-semibold text-white' : 'font-medium text-neutral-100 group-hover:text-white'
              }`}>
                {session.title}
              </span>
              {searchTerm.trim() && session.messages && (
                (() => {
                  const matchMsg = session.messages.find(m => 
                    m.content && m.content.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  if (matchMsg && !session.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                    const idx = matchMsg.content.toLowerCase().indexOf(searchTerm.toLowerCase());
                    const start = Math.max(0, idx - 15);
                    const snippet = matchMsg.content.slice(start, start + 50);
                    return (
                      <span className="text-[11.5px] text-neutral-400 truncate block mt-0.5 font-normal">
                        ...{snippet}...
                      </span>
                    );
                  }
                  return null;
                })()
              )}
            </div>
          )}
        </div>

        {/* Right Indicators & Options Trigger */}
        <div className="flex items-center gap-1 shrink-0">
          {!isSelectionMode && (
            <>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleSaveRename(e, session.id)}
                    className="p-1 text-white hover:text-neutral-300"
                    title="Speichern"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                    className="p-1 text-neutral-400 hover:text-white"
                    title="Abbrechen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Context Menu Button (Triggered on hover or long press, Pin icon removed as requested) */}
                  <button
                    type="button"
                    onClick={(e) => handleContextMenu(e, session)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-white/10"
                    title="Optionen"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }
};
