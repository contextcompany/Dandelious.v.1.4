import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Utensils, 
  Folder, 
  Code2,
  Image as ImageIcon,
  Video,
  Layout,
  GraduationCap,
  ChevronRight, 
  X,
  HelpCircle,
  Download,
  ExternalLink,
  Plus,
  MoreVertical,
  MoreHorizontal,
  Trash2,
  ArrowUpRight,
  Globe,
  Check
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { openHelpLexikon } from '../utils/openHelp';
import { EngineSettings, ChatSession, ArtifactData, SaphireProject } from '../types';
import { LEXIKON_DATA, LexikonArticle } from '../data/lexikonArticles';
import { useDeviceType } from '../utils/useDeviceType';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  getLocalMediathekItems, 
  saveLocalMediathekItems,
  extractItemsFromSessions, 
  getDeletedMediathekIds, 
  addDeletedMediathekId,
  deleteMediathekItem,
  MediathekItem 
} from '../utils/mediaLibrary';

export type MediathekTab = 'meine' | 'community';
export type MediathekCategory = 'projekte' | 'dokumente' | 'deep_research' | 'kochbuecher' | 'code' | 'canvas' | 'lernhilfe';

interface MediathekProps {
  settings: EngineSettings;
  onToggleSidebar: () => void;
  isMobile: boolean;
  sessions?: ChatSession[];
  onOpenArtifact?: (artifact: ArtifactData) => void;
  onSelectSession?: (sessionId: string) => void;
  onNewChatWithPrompt?: (prompt: string) => void;
  onOpenLexikonArticle?: (articleId: string) => void;
  onOpenProjectsView?: () => void;
  onStartNewProjectChat?: (project: SaphireProject, initialPrompt?: string) => void;
}

export const Mediathek: React.FC<MediathekProps> = ({ 
  settings, 
  onToggleSidebar,
  isMobile,
  sessions = [],
  onOpenArtifact,
  onSelectSession,
  onOpenLexikonArticle,
  onOpenProjectsView,
  onStartNewProjectChat
}) => {
  const [activeTab, setActiveTab] = useState<MediathekTab>('meine');
  const [activePopup, setActivePopup] = useState<MediathekCategory | null>(null);
  const [showLexikonFallback, setShowLexikonFallback] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<MediathekItem | null>(null);

  const deviceInfo = useDeviceType();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTabletOrPc = deviceInfo.isTablet || deviceInfo.isDesktop || windowWidth >= 640;

  // 3-Punkte Action-Popup Menü Status
  interface ActionMenuItem {
    id: string;
    title: string;
    category: MediathekCategory;
    raw: any;
    rect: { top: number; left: number; right: number; bottom: number };
  }
  const [activeMenuTarget, setActiveMenuTarget] = useState<ActionMenuItem | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [mediaVersion, setMediaVersion] = useState(0);
  const [communityItems, setCommunityItems] = useState<MediathekItem[]>([]);

  const MEDIATHEK_TUTORIAL_STORAGE_KEY = 'saphire_mediathek_first_tutorial_seen';
  const [mediathekTutorialStep, setMediathekTutorialStep] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(MEDIATHEK_TUTORIAL_STORAGE_KEY);
      if (!seen) {
        setMediathekTutorialStep(1);
      }
    } catch (e) {}
  }, []);

  const handleNextMediathekTutorial = () => {
    playSound('click', settings.enableSoundEffects ?? true);
    if (mediathekTutorialStep === 1) {
      setMediathekTutorialStep(2);
    } else if (mediathekTutorialStep === 2) {
      setMediathekTutorialStep(3);
    } else {
      setMediathekTutorialStep(null);
      try {
        localStorage.setItem(MEDIATHEK_TUTORIAL_STORAGE_KEY, 'true');
      } catch (e) {}
    }
  };

  // Real-time synchronization with Firestore community_hub
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'community_hub'), (snapshot) => {
        if (!snapshot.empty) {
          const items: MediathekItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as MediathekItem;
            items.push({ ...data, id: docSnap.id });
          });
          setCommunityItems(items);
        } else {
          setCommunityItems([]);
        }
      }, (err) => {
        console.warn('Community snapshot notice:', err);
      });
      return () => unsub();
    } catch (err) {
      console.warn('Community snapshot setup notice:', err);
    }
  }, []);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => {
      setFeedbackToast(prev => (prev === msg ? null : prev));
    }, 2400);
  };

  const openActionMenu = (item: ActionMenuItem) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActiveMenuTarget(item);
  };

  const getActionMenuStyle = () => {
    if (!activeMenuTarget?.rect) return {};
    const { top, bottom, right } = activeMenuTarget.rect;
    const menuHeight = 150;
    const menuWidth = 230;

    const opensUpward = typeof window !== 'undefined' && bottom + menuHeight + 20 > window.innerHeight;
    const computedTop = opensUpward 
      ? Math.max(16, top - menuHeight - 8) 
      : Math.min(bottom + 8, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuHeight - 16);

    const computedRight = Math.max(16, Math.min((typeof window !== 'undefined' ? window.innerWidth : 1000) - menuWidth - 16, (typeof window !== 'undefined' ? window.innerWidth : 1000) - right));

    return {
      top: `${computedTop}px`,
      right: `${computedRight}px`
    };
  };

  // Klick direkt auf das Item (Projekt, Kochbuch, Dokument, Recherche, Bild, Video)
  const handleItemClick = (item: any, category: MediathekCategory) => {
    playSound('click', settings.enableSoundEffects ?? true);
    closeCategoryPopup();

    if (category === 'projekte' || category === 'kochbuecher') {
      if (onStartNewProjectChat) {
        onStartNewProjectChat(item);
      } else if (onOpenProjectsView) {
        onOpenProjectsView();
      }
    } else if (category === 'dokumente' || category === 'deep_research' || category === 'code') {
      if (onOpenArtifact) {
        onOpenArtifact({
          id: item.id,
          title: item.title,
          content: item.content || item.description || '',
          language: item.language || (category === 'code' ? 'typescript' : 'markdown')
        });
      }
    }
  };

  // 1. Löschen
  const handleDelete = async (target: ActionMenuItem) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActiveMenuTarget(null);

    // Blacklist ID so neither local nor seed item shows again
    addDeletedMediathekId(target.id);

    if (target.category === 'projekte' || target.category === 'kochbuecher') {
      const updated = projects.filter(p => p.id !== target.id);
      setProjects(updated);
      try {
        const uid = auth.currentUser?.uid;
        const key = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';
        localStorage.setItem(key, JSON.stringify(updated));
        if (uid) {
          await deleteDoc(doc(db, 'users', uid, 'projects', target.id));
        }
        await deleteDoc(doc(db, 'community_hub', target.id));
      } catch (e) {}
    } else {
      await deleteMediathekItem(target.id);
      try {
        await deleteDoc(doc(db, 'community_hub', target.id));
      } catch (e) {}
      setMediaVersion(v => v + 1);
    }
    showToast(`"${target.title}" gelöscht`);
  };

  // 2. Zu [Name des Projektes, Kochbuches …]
  const handleNavigateTo = (target: ActionMenuItem) => {
    setActiveMenuTarget(null);
    handleItemClick(target.raw, target.category);
  };

  // Prüft, ob ein Ziel-Item aktuell veröffentlicht oder freigegeben ist
  const isTargetPublished = (target: ActionMenuItem | null): boolean => {
    if (!target) return false;
    if (target.category === 'projekte' || target.category === 'kochbuecher') {
      const proj = projects.find(p => p.id === target.id);
      return Boolean(proj?.isShared ?? target.raw?.isShared);
    }
    const foundInMedia = mediaItems.find(i => i.id === target.id);
    if (foundInMedia && (foundInMedia.isPublished || (foundInMedia as any).isPrivateShared)) return true;
    const local = getLocalMediathekItems();
    const item = local.find(i => i.id === target.id);
    if (item && (item.isPublished || (item as any).isPrivateShared)) return true;
    return Boolean(target.raw?.isPublished || target.raw?.isPrivateShared);
  };

  // 3. Veröffentlichen
  const handlePublish = async (target: ActionMenuItem) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActiveMenuTarget(null);

    try {
      if (target.category === 'projekte' || target.category === 'kochbuecher') {
        const uid = auth.currentUser?.uid;
        const authorName = settings.userNickname || auth.currentUser?.displayName || 'Du';
        const authorId = uid || 'anon';
        const key = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';

        const updated = projects.map(p => p.id === target.id ? { 
          ...p, 
          isShared: true, 
          isPublished: true,
          isPrivateShared: false,
          createdByName: authorName,
          updatedAt: Date.now() 
        } : p);

        if (!updated.some(p => p.id === target.id)) {
          updated.unshift({
            ...target.raw,
            id: target.id,
            name: target.title,
            isShared: true,
            isPublished: true,
            isPrivateShared: false,
            createdByName: authorName,
            updatedAt: Date.now()
          });
        }

        setProjects(updated);
        localStorage.setItem(key, JSON.stringify(updated));

        const projData = updated.find(p => p.id === target.id) || target.raw;
        if (uid) {
          await setDoc(doc(db, 'users', uid, 'projects', target.id), { 
            ...projData, 
            isShared: true, 
            isPublished: true,
            isPrivateShared: false,
            createdByName: authorName,
            updatedAt: Date.now() 
          }, { merge: true });
        }

        // Also publish full project payload to community_hub
        await setDoc(doc(db, 'community_hub', target.id), {
          id: target.id,
          name: projData.name || target.title,
          title: projData.name || target.title,
          type: target.category === 'kochbuecher' ? 'cookbook' : 'project',
          category: target.category,
          description: projData.description || (target.category === 'kochbuecher' ? 'Rezept-Manager & KI-Küchenchef' : 'Projekt-Arbeitsbereich'),
          icon: projData.icon || (target.category === 'kochbuecher' ? 'chef' : 'folder'),
          instructions: projData.instructions || '',
          sources: projData.sources || [],
          recipes: projData.recipes || [],
          authorName: authorName,
          authorId: authorId,
          createdBy: authorId,
          createdByName: authorName,
          isPublished: true,
          createdAt: projData.createdAt || Date.now(),
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        const local = getLocalMediathekItems();
        const idx = local.findIndex(i => i.id === target.id);
        const itemToPublish: MediathekItem = idx >= 0
          ? { ...local[idx], isPublished: true, isPrivateShared: false, authorName: 'Du', updatedAt: Date.now() }
          : { ...target.raw, id: target.id, title: target.title, isPublished: true, isPrivateShared: false, authorName: 'Du', updatedAt: Date.now() };

        if (idx >= 0) {
          local[idx] = itemToPublish;
        } else {
          local.unshift(itemToPublish);
        }
        saveLocalMediathekItems(local);
        setMediaVersion(v => v + 1);

        // Upload to Firestore community_hub
        await setDoc(doc(db, 'community_hub', target.id), itemToPublish, { merge: true });
      }
      showToast(`"${target.title}" in Community freigegeben`);
    } catch (e) {
      console.warn('Publish notice:', e);
      showToast(`"${target.title}" veröffentlicht`);
    }
  };

  // 4. Unveröffentlichen
  const handleUnpublish = async (target: ActionMenuItem) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActiveMenuTarget(null);

    try {
      if (target.category === 'projekte' || target.category === 'kochbuecher') {
        const uid = auth.currentUser?.uid;
        const key = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';
        const updated = projects.map(p => p.id === target.id ? { 
          ...p, 
          isShared: false, 
          isPublished: false,
          isPrivateShared: false,
          updatedAt: Date.now() 
        } : p);

        setProjects(updated);
        localStorage.setItem(key, JSON.stringify(updated));

        if (uid) {
          await setDoc(doc(db, 'users', uid, 'projects', target.id), { 
            isShared: false, 
            isPublished: false,
            isPrivateShared: false,
            updatedAt: Date.now() 
          }, { merge: true });
        }

        try {
          await deleteDoc(doc(db, 'community_hub', target.id));
        } catch {}
      } else {
        const local = getLocalMediathekItems();
        const idx = local.findIndex(i => i.id === target.id);
        const itemToUnpublish: MediathekItem = idx >= 0
          ? { ...local[idx], isPublished: false, isPrivateShared: false, updatedAt: Date.now() }
          : { ...target.raw, id: target.id, title: target.title, isPublished: false, isPrivateShared: false, updatedAt: Date.now() };

        if (idx >= 0) {
          local[idx] = itemToUnpublish;
        } else {
          local.unshift(itemToUnpublish);
        }
        saveLocalMediathekItems(local);
        setMediaVersion(v => v + 1);

        try {
          await deleteDoc(doc(db, 'community_hub', target.id));
        } catch {}
        try {
          await deleteDoc(doc(db, 'private_hub', target.id));
        } catch {}
      }
      showToast(`"${target.title}" unveröffentlicht`);
    } catch (e) {
      console.warn('Unpublish notice:', e);
      showToast(`"${target.title}" unveröffentlicht`);
    }
  };

  // Projects state synchronized from localStorage and Firestore
  const [projects, setProjects] = useState<SaphireProject[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const uid = auth.currentUser?.uid;
      const key = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const key = uid ? `saphire_projects_v1_${uid}` : 'saphire_projects_v1_guest';

    const handleStorage = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setProjects(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);

    if (!uid) {
      return () => window.removeEventListener('storage', handleStorage);
    }

    try {
      const unsub = onSnapshot(collection(db, 'users', uid, 'projects'), (snap) => {
        const list: SaphireProject[] = [];
        snap.forEach(d => list.push(d.data() as SaphireProject));
        setProjects(list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)));
      }, () => {});
      return () => {
        window.removeEventListener('storage', handleStorage);
        unsub();
      };
    } catch {
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [auth.currentUser?.uid]);

  // Media items (Images, documents, deep research, videos) extracted from sessions & library
  const mediaItems = useMemo(() => {
    const local = getLocalMediathekItems();
    const fromSessions = extractItemsFromSessions(sessions || []);
    const deleted = getDeletedMediathekIds();

    const map = new Map<string, MediathekItem>();
    [...local, ...fromSessions].forEach(item => {
      if (item && item.id && !deleted.has(item.id)) {
        const key = item.url ? `url:${item.url.trim().toLowerCase()}` : `id:${item.id}`;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }, [sessions, mediaVersion]);

  // Floating close button scroll visibility in popup
  const [showPopupClose, setShowPopupClose] = useState(true);
  const popupLastScrollRef = useRef(0);

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const current = e.currentTarget.scrollTop;
    if (current <= 15) {
      setShowPopupClose(true);
    } else if (current < popupLastScrollRef.current - 4) {
      setShowPopupClose(true);
    } else if (current > popupLastScrollRef.current + 4) {
      setShowPopupClose(false);
    }
    popupLastScrollRef.current = current;
  };

  useEffect(() => {
    setShowPopupClose(true);
    popupLastScrollRef.current = 0;
  }, [activePopup]);

  const openCategoryPopup = (category: MediathekCategory) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActivePopup(category);
  };

  const closeCategoryPopup = () => {
    playSound('click', settings.enableSoundEffects ?? true);
    setActivePopup(null);
  };

  const categoriesConfig = [
    {
      id: 'projekte' as MediathekCategory,
      title: 'Projekte',
      icon: Folder,
      description: 'Strukturierte Arbeitsbereiche mit dedizierten System-Prompts, Zielen und Dokumenten.'
    },
    {
      id: 'dokumente' as MediathekCategory,
      title: 'Dokumente',
      icon: FileText,
      description: 'Gespeicherte Notizen, Texte und Ausarbeitungen aus deinen Unterhaltungen.'
    },
    {
      id: 'deep_research' as MediathekCategory,
      title: 'Deep Research',
      icon: Sparkles,
      description: 'Umfassende Recherche-Dossiers, Marktanalysen und strukturierte Langzeitberichte.'
    },
    {
      id: 'kochbuecher' as MediathekCategory,
      title: 'Kochbücher',
      icon: Utensils,
      description: 'Deine gesammelten Rezepte, Menüfolgen, Ernährungspläne und kulinarische Sammlungen.'
    },
    {
      id: 'code' as MediathekCategory,
      title: 'Code',
      icon: Code2,
      description: 'Gespeicherte Code-Dateien, Snippets, Skripte und Software-Artefakte.'
    },
    {
      id: 'canvas' as MediathekCategory,
      title: 'Canvas',
      icon: Layout,
      description: 'Interaktive Canvas-Grafiken, Mindmaps, Whiteboards und Schaubilder.'
    },
    {
      id: 'lernhilfe' as MediathekCategory,
      title: 'Lernhilfe',
      icon: GraduationCap,
      description: 'Lernkarten, Zusammenfassungen, Quizfragen, Karteikarten und Spickzettel.'
    }
  ];

  const currentPopupConfig = categoriesConfig.find(c => c.id === activePopup);

  // Helper to determine if an item is owned/authored by the user
  const isOwnItem = (item: any) => {
    if (!item) return false;
    if (item.authorName === 'Du' || item.authorName === 'Nutzer' || item.createdByName === 'Du') return true;
    if (item.isOwn || item.isUserCreated) return true;
    if (projects.some(p => p.id === item.id)) return true;
    const local = getLocalMediathekItems();
    if (local.some(l => l.id === item.id)) return true;
    return false;
  };

  // Filter items per category
  const filteredProjects = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const nonCookbooks = projects.filter(p => p.type !== 'cookbook' && !deleted.has(p.id));

    if (activeTab === 'community') {
      const map = new Map<string, SaphireProject>();
      // 1. Own shared projects
      nonCookbooks.filter(p => p.isShared).forEach(p => map.set(p.id, { ...p, createdByName: p.createdByName || 'Du' }));
      // 2. Community projects from Firestore
      communityItems.filter(i => ((i.type as any) === 'project' || i.category === 'projekte') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, {
            id: i.id,
            name: i.title,
            type: 'project',
            createdByName: i.authorName || 'Community',
            createdBy: i.authorId || 'anon',
            createdAt: i.createdAt,
            updatedAt: i.updatedAt || i.createdAt,
            sources: [],
            chatIds: [],
            isShared: true
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return nonCookbooks;
  }, [projects, activeTab, communityItems, mediaVersion]);

  const filteredCookbooks = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const cookbooks = projects.filter(p => p.type === 'cookbook' && !deleted.has(p.id));

    if (activeTab === 'community') {
      const map = new Map<string, SaphireProject>();
      // 1. Own shared cookbooks
      cookbooks.filter(p => p.isShared).forEach(p => map.set(p.id, { ...p, createdByName: p.createdByName || 'Du' }));
      // 2. Community cookbooks from Firestore
      communityItems.filter(i => ((i.type as any) === 'cookbook' || i.category === 'kochbuecher') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, {
            id: i.id,
            name: i.title,
            type: 'cookbook',
            createdByName: i.authorName || 'Community',
            createdBy: i.authorId || 'anon',
            createdAt: i.createdAt,
            updatedAt: i.updatedAt || i.createdAt,
            sources: [],
            chatIds: [],
            isShared: true
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return cookbooks;
  }, [projects, activeTab, communityItems, mediaVersion]);

  const filteredDocuments = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const docs = mediaItems.filter(i => i.type === 'document' && !deleted.has(i.id));

    if (activeTab === 'community') {
      const map = new Map<string, MediathekItem>();
      // 1. Own published documents
      docs.filter(i => i.isPublished).forEach(i => map.set(i.id, { ...i, authorName: 'Du' }));
      // 2. Community documents from Firestore
      communityItems.filter(i => i.type === 'document' && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, i);
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return docs;
  }, [mediaItems, activeTab, communityItems, mediaVersion]);

  const filteredCode = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const codes = mediaItems.filter(i => (i.type === 'code' || i.category === 'code' || (i.type === 'document' && (i.title.endsWith('.ts') || i.title.endsWith('.tsx') || i.title.endsWith('.js') || i.title.endsWith('.jsx') || i.title.endsWith('.py') || i.title.endsWith('.html') || i.title.endsWith('.css') || i.title.endsWith('.json') || (i.content && (i.content.includes('```') || i.content.includes('function ') || i.content.includes('const ') || i.content.includes('import ')))))) && !deleted.has(i.id));

    if (activeTab === 'community') {
      const map = new Map<string, MediathekItem>();
      codes.filter(i => i.isPublished).forEach(i => map.set(i.id, { ...i, authorName: 'Du' }));
      communityItems.filter(i => (i.type === 'code' || i.category === 'code') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, i);
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return codes;
  }, [mediaItems, activeTab, communityItems, mediaVersion]);

  const filteredDeepResearch = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const res = mediaItems.filter(i => (i.type === 'deep_research' || i.category === 'deep_research') && !deleted.has(i.id));

    if (activeTab === 'community') {
      const map = new Map<string, MediathekItem>();
      res.filter(i => i.isPublished).forEach(i => map.set(i.id, { ...i, authorName: 'Du' }));
      communityItems.filter(i => (i.type === 'deep_research' || i.category === 'deep_research') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, i);
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return res;
  }, [mediaItems, activeTab, communityItems, mediaVersion]);

  const filteredCanvas = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const items = mediaItems.filter(i => (i.type === 'canvas' || i.category === 'canvas' || (i.tags && i.tags.includes('canvas'))) && !deleted.has(i.id));

    if (activeTab === 'community') {
      const map = new Map<string, MediathekItem>();
      items.filter(i => i.isPublished).forEach(i => map.set(i.id, { ...i, authorName: 'Du' }));
      communityItems.filter(i => (i.type === 'canvas' || i.category === 'canvas') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, i);
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return items;
  }, [mediaItems, activeTab, communityItems, mediaVersion]);

  const filteredLernhilfe = useMemo(() => {
    const deleted = getDeletedMediathekIds();
    const items = mediaItems.filter(i => (i.type === 'lernhilfe' || i.category === 'lernhilfe' || (i.tags && (i.tags.includes('quiz') || i.tags.includes('flashcards') || i.tags.includes('lernhilfe')))) && !deleted.has(i.id));

    if (activeTab === 'community') {
      const map = new Map<string, MediathekItem>();
      items.filter(i => i.isPublished).forEach(i => map.set(i.id, { ...i, authorName: 'Du' }));
      communityItems.filter(i => (i.type === 'lernhilfe' || i.category === 'lernhilfe') && !deleted.has(i.id)).forEach(i => {
        if (!map.has(i.id)) {
          map.set(i.id, i);
        }
      });
      return Array.from(map.values()).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    return items;
  }, [mediaItems, activeTab, communityItems, mediaVersion]);

  // Dynamischer Text pro Kategorie bei Leerzustand
  const getEmptyLabel = (catId: MediathekCategory | null) => {
    switch (catId) {
      case 'projekte':
        return activeTab === 'community' ? 'noch keine geteilten Projekte' : 'noch keine Projekte';
      case 'dokumente':
        return activeTab === 'community' ? 'noch keine geteilten Dokumente' : 'noch keine Dokumente';
      case 'deep_research':
        return activeTab === 'community' ? 'noch keine geteilten Recherchen' : 'noch keine Deep Research Berichte';
      case 'kochbuecher':
        return activeTab === 'community' ? 'noch keine geteilten Kochbücher' : 'noch keine Kochbücher';
      case 'code':
        return activeTab === 'community' ? 'noch kein geteilter Code' : 'noch keine Code-Dateien';
      case 'canvas':
        return activeTab === 'community' ? 'noch keine geteilten Canvas-Grafiken' : 'noch keine Canvas-Grafiken';
      case 'lernhilfe':
        return activeTab === 'community' ? 'noch keine geteilten Lernhilfen' : 'noch keine Lernhilfen';
      default:
        return 'noch keine Dateien';
    }
  };

  // Polished iOS Empty State for empty categories
  const renderEmptyState = (catId: MediathekCategory) => {
    let IconComp = FileText;
    let headline = activeTab === 'community' ? 'Noch keine geteilten Dokumente' : 'Keine Dokumente vorhanden';
    let subtext = activeTab === 'community'
      ? 'In der Community sind noch keine Dokumente geteilt worden.'
      : 'Generierte Dokumente, Notizen und Texte werden hier automatisch gesammelt.';

    switch (catId) {
      case 'projekte':
        IconComp = Folder;
        headline = activeTab === 'community' ? 'Noch keine geteilten Projekte' : 'Keine Projekte vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community sind noch keine Projekte geteilt worden.'
          : 'Erstelle strukturierte Arbeitsbereiche, um deine Projekte hier zu verwalten.';
        break;
      case 'dokumente':
        IconComp = FileText;
        headline = activeTab === 'community' ? 'Noch keine geteilten Dokumente' : 'Keine Dokumente vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community sind noch keine Dokumente geteilt worden.'
          : 'Generierte Dokumente, Notizen und Texte werden hier automatisch gesammelt.';
        break;
      case 'deep_research':
        IconComp = Sparkles;
        headline = activeTab === 'community' ? 'Noch keine geteilten Recherchen' : 'Keine Recherchen vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community sind noch keine Deep Research Berichte geteilt worden.'
          : 'Starte eine Tiefenrecherche im Chat, um umfassende Dossiers hier zu speichern.';
        break;
      case 'kochbuecher':
        IconComp = Utensils;
        headline = activeTab === 'community' ? 'Noch keine geteilten Kochbücher' : 'Keine Kochbücher vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community sind noch keine Kochbücher geteilt worden.'
          : 'Erstelle Rezepte und Menüfolgen, um sie in deinem Kochbuch zu bündeln.';
        break;
      case 'code':
        IconComp = Code2;
        headline = activeTab === 'community' ? 'Noch kein geteilter Code' : 'Kein Code vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community ist noch kein Code geteilt worden.'
          : 'Gespeicherte Code-Dateien, Skripte und Snippets aus Unterhaltungen werden hier gelistet.';
        break;
      case 'canvas':
        IconComp = Layout;
        headline = activeTab === 'community' ? 'Noch keine geteilten Canvas-Grafiken' : 'Keine Canvas-Grafiken vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community wurden noch keine Canvas-Grafiken geteilt.'
          : 'Erstelle Whiteboards und Mindmaps im Chat, um sie hier zu sichern.';
        break;
      case 'lernhilfe':
        IconComp = GraduationCap;
        headline = activeTab === 'community' ? 'Noch keine geteilten Lernhilfen' : 'Keine Lernhilfen vorhanden';
        subtext = activeTab === 'community'
          ? 'In der Community wurden noch keine Lernhilfen oder Karteikarten geteilt.'
          : 'Generiere Lernkarten, Zusammenfassungen oder Quizfragen, um sie hier zu sichern.';
        break;
      default:
        IconComp = Folder;
        headline = activeTab === 'community' ? 'Noch keine geteilten Inhalte' : 'Keine Inhalte vorhanden';
        subtext = activeTab === 'community'
          ? 'Sobald jemand Inhalte in der Community freigibt, werden sie hier angezeigt.'
          : 'Gespeicherte Medien und Dateien werden hier übersichtlich dargestellt.';
        break;
    }

    return (
      <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center select-none px-4">
        <IconComp className="w-12 h-12 text-slate-600 mb-2 stroke-[1.5]" />
        <h4 className="text-base font-medium text-white">{headline}</h4>
        <p className="text-xs text-slate-400 max-w-[220px] text-center mt-1 leading-relaxed">
          {subtext}
        </p>
      </div>
    );
  };

  // Mediathek Lexikon Artikel
  const mediathekArticle: LexikonArticle | undefined = (() => {
    for (const cat of LEXIKON_DATA) {
      const art = cat.articles.find(a => a.id === 'mediathek-guide');
      if (art) return art;
    }
    return undefined;
  })();

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="font-semibold text-[#C5DC57]">
            {part.slice(2, -2)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent text-neutral-100 font-['Plus_Jakarta_Sans'] overflow-y-auto overflow-x-hidden w-full max-w-full min-w-0 no-scrollbar select-none relative">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-lime-900/15 rounded-full blur-[80px] pointer-events-none z-0 overflow-hidden" />

      {/* Top Header - ohne Trennleiste, Knöpfe zentriert, Seitenleisten-Knopf minimal weiter nach links */}
      <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
        {/* Seitenleisten-Knopf ganz links */}
        <button
          type="button"
          onClick={() => {
            playSound('click', settings.enableSoundEffects ?? true);
            onToggleSidebar();
          }}
          className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
          title="Menü"
        >
          <span className="w-4 h-[2px] bg-white rounded-full" />
          <span className="w-4 h-[2px] bg-white rounded-full" />
        </button>

        {/* Freistehende, unverbundene Buttons mit Abstand - exakt zentriert */}
        <LayoutGroup id="mediathek-header-tabs">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-[#242426] rounded-full border border-white/5 shadow-md pointer-events-auto">
            {(['meine', 'community'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const isHighlightCommunity = mediathekTutorialStep === 3 && tab === 'community';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setActiveTab(tab);
                    if (mediathekTutorialStep === 3) {
                      setMediathekTutorialStep(null);
                      try {
                        localStorage.setItem(MEDIATHEK_TUTORIAL_STORAGE_KEY, 'true');
                      } catch (e) {}
                    }
                  }}
                  className={`relative px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                    isHighlightCommunity
                      ? 'ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.95)] animate-bounce bg-[#C5DC57] text-black font-bold'
                      : isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  } ${mediathekTutorialStep === 1 || mediathekTutorialStep === 2 ? 'pointer-events-none opacity-40' : ''}`}
                >
                  {isActive && !isHighlightCommunity && (
                    <motion.div
                      layoutId="mediathekHeaderTabPill"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{tab === 'meine' ? 'Meine' : 'Community'}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Fragezeichen-Knopf ganz rechts (Hilfe direkt über externes Dandelious-Lexikon) */}
        <button
          type="button"
          onClick={() => {
            playSound('click', settings.enableSoundEffects ?? true);
            openHelpLexikon();
          }}
          className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
          title="Hilfe (Dandelious Lexikon)"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>
      </header>

      {/* Black Tutorial Banner (Matching Projects / Cookbooks Tutorial Style) */}
      {mediathekTutorialStep !== null && (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-1 shrink-0 z-20">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 sm:p-4 rounded-2xl bg-black border border-white/15 shadow-2xl text-center"
          >
            <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
              {mediathekTutorialStep === 1 && 'Tippe auf Dokumente, um deine gespeicherten Dateien anzusehen.'}
              {mediathekTutorialStep === 2 && 'Tippe oben links auf das Schließen-Kreuz (✕).'}
              {mediathekTutorialStep === 3 && 'Tippe oben auf Community, um geteilte Werke zu entdecken.'}
            </p>
          </motion.div>
        </div>
      )}

      {/* Hauptbereich: Nach oben positionierte Kapsel-Buttons mit Stagger-Animation & Spring Bounce Drag */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-20 relative z-10 box-border overflow-x-hidden flex-1 flex flex-col items-center">
        <motion.div 
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.25}
          dragSnapToOrigin
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.04 }
            }
          }}
          className="space-y-[3px] w-full"
        >
          {categoriesConfig.map((item) => {
            const ItemIcon = item.icon;
            const isHighlightDokumente = mediathekTutorialStep === 1 && item.id === 'dokumente';
            return (
              <motion.div 
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.97 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: { type: "spring", stiffness: 380, damping: 26 }
                  }
                }}
                whileHover={{ scale: 1.015, x: 4, backgroundColor: '#2c2c2e' }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  if (mediathekTutorialStep === 3) return;
                  openCategoryPopup(item.id);
                  if (mediathekTutorialStep === 1) {
                    setMediathekTutorialStep(2);
                  }
                }}
                className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full ${
                  isHighlightDokumente
                    ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.9)] animate-pulse relative z-30 cursor-pointer'
                    : mediathekTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                }`}
              >
                {/* Links: Zeichen (Icon) vor der Schrift */}
                <div className="flex items-center gap-3.5">
                  <ItemIcon className={`w-5 h-5 stroke-[1.8] shrink-0 ${isHighlightDokumente ? 'text-black' : 'text-neutral-300 group-hover:text-white'}`} />
                  <span className={`text-[15px] font-normal ${isHighlightDokumente ? 'text-black font-semibold' : 'text-white'}`}>{item.title}</span>
                </div>

                {/* Rechts: der Pfeil */}
                <ChevronRight className={`w-4 h-4 stroke-[2] ${isHighlightDokumente ? 'text-black' : 'text-[#8e8e93] group-hover:text-white group-hover:translate-x-1'} transition-all shrink-0`} />
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* ========================================================================= */}
      {/* FLOATING POPUP OVERLAY FÜR DIE MEDIATHEK-KATEGORIEN */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activePopup && currentPopupConfig && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
              isMobile ? "p-0" : "p-3 sm:p-6"
            }`}
          >
            {/* Backdrop overlay */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={closeCategoryPopup}
            />

            <motion.div
              key={`mediathek-popup-${activePopup}`}
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full bg-[#000000] text-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans'] ${
                isMobile
                  ? "h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none"
                  : "max-w-[500px] sm:max-w-[540px] max-h-[92%] h-[680px] rounded-[32px] sm:rounded-[36px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)]"
              }`}
            >
              {/* Floating Close Button X */}
              <button
                type="button"
                onClick={() => {
                  closeCategoryPopup();
                  if (mediathekTutorialStep === 2) {
                    setMediathekTutorialStep(3);
                  }
                }}
                className={`absolute top-5 left-5 z-30 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 ease-out ${
                  mediathekTutorialStep === 2
                    ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.9)] animate-pulse border-2 border-white pointer-events-auto'
                    : `bg-[#1c1c1e]/85 backdrop-blur-md hover:bg-[#2c2c2e] text-neutral-300 hover:text-white border border-white/10 ${
                        showPopupClose 
                          ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto' 
                          : 'opacity-0 scale-75 -translate-y-2 blur-[2px] pointer-events-none'
                      }`
                }`}
                title="Schließen"
              >
                <X className={`w-4 h-4 stroke-[2.5] ${mediathekTutorialStep === 2 ? 'text-black' : ''}`} />
              </button>

              {/* Popup Inhalt */}
              <div 
                onScroll={handlePopupScroll}
                className={`w-full h-full overflow-y-auto no-scrollbar px-5 sm:px-8 ${
                  mediathekTutorialStep === 2 ? 'pointer-events-none opacity-40' : ''
                } ${
                  isMobile 
                    ? "pt-[max(env(safe-area-inset-top,0px),56px)] pb-[max(env(safe-area-inset-bottom,0px),32px)]" 
                    : "pt-14 pb-8"
                } flex flex-col`}
              >
                <div className="space-y-4">
                  {/* Header Bereich */}
                  <div className="space-y-1.5 border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {currentPopupConfig?.title || 'Kategorie'}
                      </h3>
                      {activeTab === 'community' && (
                        <span className="text-[11px] font-semibold text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-1 rounded-full border border-[#C5DC57]/25 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          Community
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#8e8e93] leading-relaxed">
                      {activeTab === 'community' 
                        ? `Alle freigegebenen ${currentPopupConfig?.title?.toLowerCase() || 'Einträge'} von dir und anderen Nutzern der Community.` 
                        : currentPopupConfig?.description}
                    </p>
                  </div>

                  {/* KACHEL-DARSTELLUNG JE NACH KATEGORIE */}
                  {/* 1. PROJEKTE: Im Design wie bei den Einstellungen */}
                  {activePopup === 'projekte' && (
                    filteredProjects.length > 0 ? (
                      <div className="space-y-1.5 w-full pt-2 pb-6">
                        {filteredProjects.map((proj, pIdx) => (
                          isTabletOrPc ? (
                            <div key={`med-proj-pc-${proj.id || pIdx}-${pIdx}`} className="flex items-center gap-2.5 w-full group">
                              <div
                                onClick={() => handleItemClick(proj, 'projekte')}
                                className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{proj.name}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(proj) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[12px] text-[#8e8e93] shrink-0 truncate max-w-[130px]">
                                      Von {proj.createdByName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && proj.isShared && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: proj.id,
                                      title: proj.name,
                                      category: 'projekte',
                                      raw: proj,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                                  title="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              key={`med-proj-m-${proj.id || pIdx}-${pIdx}`}
                              className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden"
                            >
                              <div 
                                onClick={() => handleItemClick(proj, 'projekte')}
                                className={`flex-1 min-w-0 ${activeTab === 'community' ? 'px-5' : 'pl-5 pr-2'} py-3.5 flex items-center justify-between cursor-pointer active:opacity-80`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{proj.name}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(proj) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#8e8e93] shrink-0 truncate max-w-[100px]">
                                      Von {proj.createdByName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && proj.isShared && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: proj.id,
                                      title: proj.name,
                                      category: 'projekte',
                                      raw: proj,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-14 self-stretch flex items-center justify-center text-[#8e8e93] hover:text-white active:bg-white/10 transition-colors shrink-0 cursor-pointer border-l border-white/5"
                                  title="Optionen"
                                  aria-label="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('projekte')
                    )
                  )}

                  {/* 2. DOKUMENTE: Im Design wie bei den Einstellungen */}
                  {activePopup === 'kochbuecher' && (
                    filteredCookbooks.length > 0 ? (
                      <div className="space-y-1.5 w-full pt-2 pb-6">
                        {filteredCookbooks.map((book, bIdx) => (
                          isTabletOrPc ? (
                            <div key={`med-book-pc-${book.id || bIdx}-${bIdx}`} className="flex items-center gap-2.5 w-full group">
                              <div
                                onClick={() => handleItemClick(book, 'kochbuecher')}
                                className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Utensils className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{book.name}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(book) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[12px] text-[#8e8e93] shrink-0 truncate max-w-[130px]">
                                      Von {book.createdByName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && book.isShared && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: book.id,
                                      title: book.name,
                                      category: 'kochbuecher',
                                      raw: book,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                                  title="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              key={`med-book-m-${book.id || bIdx}-${bIdx}`}
                              className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden"
                            >
                              <div 
                                onClick={() => handleItemClick(book, 'kochbuecher')}
                                className={`flex-1 min-w-0 ${activeTab === 'community' ? 'px-5' : 'pl-5 pr-2'} py-3.5 flex items-center justify-between cursor-pointer active:opacity-80`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Utensils className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{book.name}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(book) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#8e8e93] shrink-0 truncate max-w-[100px]">
                                      Von {book.createdByName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && book.isShared && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: book.id,
                                      title: book.name,
                                      category: 'kochbuecher',
                                      raw: book,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-14 self-stretch flex items-center justify-center text-[#8e8e93] hover:text-white active:bg-white/10 transition-colors shrink-0 cursor-pointer border-l border-white/5"
                                  title="Optionen"
                                  aria-label="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('kochbuecher')
                    )
                  )}

                  {/* 4. DOKUMENTE: Im Design wie bei den Einstellungen */}
                  {activePopup === 'dokumente' && (
                    filteredDocuments.length > 0 ? (
                      <div className="space-y-1.5 w-full pt-2 pb-6">
                        {filteredDocuments.map((doc, dIdx) => (
                          isTabletOrPc ? (
                            <div key={`med-doc-pc-${doc.id || dIdx}-${dIdx}`} className="flex items-center gap-2.5 w-full group">
                              <div
                                onClick={() => handleItemClick(doc, 'dokumente')}
                                className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <FileText className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{doc.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(doc) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[12px] text-[#8e8e93] shrink-0 truncate max-w-[130px]">
                                      Von {doc.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && doc.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: doc.id,
                                      title: doc.title,
                                      category: 'dokumente',
                                      raw: doc,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                                  title="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              key={`med-doc-m-${doc.id || dIdx}-${dIdx}`}
                              className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden"
                            >
                              <div 
                                onClick={() => handleItemClick(doc, 'dokumente')}
                                className={`flex-1 min-w-0 ${activeTab === 'community' ? 'px-5' : 'pl-5 pr-2'} py-3.5 flex items-center justify-between cursor-pointer active:opacity-80`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <FileText className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{doc.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(doc) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#8e8e93] shrink-0 truncate max-w-[100px]">
                                      Von {doc.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && doc.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: doc.id,
                                      title: doc.title,
                                      category: 'dokumente',
                                      raw: doc,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-14 self-stretch flex items-center justify-center text-[#8e8e93] hover:text-white active:bg-white/10 transition-colors shrink-0 cursor-pointer border-l border-white/5"
                                  title="Optionen"
                                  aria-label="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('dokumente')
                    )
                  )}

                  {/* 5. DEEP RESEARCH: Im Design wie bei den Einstellungen */}
                  {activePopup === 'deep_research' && (
                    filteredDeepResearch.length > 0 ? (
                      <div className="space-y-1.5 w-full pt-2 pb-6">
                        {filteredDeepResearch.map((res, rIdx) => (
                          isTabletOrPc ? (
                            <div key={`med-res-pc-${res.id || rIdx}-${rIdx}`} className="flex items-center gap-2.5 w-full group">
                              <div
                                onClick={() => handleItemClick(res, 'deep_research')}
                                className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Sparkles className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{res.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(res) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[12px] text-[#8e8e93] shrink-0 truncate max-w-[130px]">
                                      Von {res.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && res.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: res.id,
                                      title: res.title,
                                      category: 'deep_research',
                                      raw: res,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                                  title="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              key={`med-res-m-${res.id || rIdx}-${rIdx}`}
                              className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden"
                            >
                              <div 
                                onClick={() => handleItemClick(res, 'deep_research')}
                                className={`flex-1 min-w-0 ${activeTab === 'community' ? 'px-5' : 'pl-5 pr-2'} py-3.5 flex items-center justify-between cursor-pointer active:opacity-80`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Sparkles className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate">{res.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(res) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#8e8e93] shrink-0 truncate max-w-[100px]">
                                      Von {res.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && res.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: res.id,
                                      title: res.title,
                                      category: 'deep_research',
                                      raw: res,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-14 self-stretch flex items-center justify-center text-[#8e8e93] hover:text-white active:bg-white/10 transition-colors shrink-0 cursor-pointer border-l border-white/5"
                                  title="Optionen"
                                  aria-label="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('deep_research')
                    )
                  )}

                  {/* 5. CODE */}
                  {activePopup === 'code' && (
                    filteredCode.length > 0 ? (
                      <div className="space-y-[3px] pt-1 pb-6">
                        {filteredCode.map((item, cIdx) => (
                          isTabletOrPc ? (
                            <div key={`med-code-pc-${item.id || cIdx}-${cIdx}`} className="flex items-center gap-2.5 w-full group">
                              <div
                                onClick={() => handleItemClick(item, 'code')}
                                className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Code2 className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate font-mono">{item.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(item) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[12px] text-[#8e8e93] shrink-0 truncate max-w-[130px]">
                                      Von {item.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && item.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: item.id,
                                      title: item.title,
                                      category: 'code',
                                      raw: item,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-12 h-12 sm:w-[50px] sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                                  title="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              key={`med-code-m-${item.id || cIdx}-${cIdx}`}
                              className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden"
                            >
                              <div 
                                onClick={() => handleItemClick(item, 'code')}
                                className={`flex-1 min-w-0 ${activeTab === 'community' ? 'px-5' : 'pl-5 pr-2'} py-3.5 flex items-center justify-between cursor-pointer active:opacity-80`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                                  <Code2 className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                                  <span className="text-[15px] font-normal text-white truncate font-mono">{item.title}</span>
                                </div>
                                {activeTab === 'community' && (
                                  isOwnItem(item) ? (
                                    <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                      Von dir
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-[#8e8e93] shrink-0 truncate max-w-[100px]">
                                      Von {item.authorName || 'Community'}
                                    </span>
                                  )
                                )}
                                {activeTab === 'meine' && item.isPublished && (
                                  <span className="text-[10px] text-lime-400/90 bg-lime-400/10 px-2 py-0.5 rounded-full shrink-0">
                                    Freigegeben
                                  </span>
                                )}
                              </div>

                              {activeTab !== 'community' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    openActionMenu({
                                      id: item.id,
                                      title: item.title,
                                      category: 'code',
                                      raw: item,
                                      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom }
                                    });
                                  }}
                                  className="w-14 self-stretch flex items-center justify-center text-[#8e8e93] hover:text-white active:bg-white/10 transition-colors shrink-0 cursor-pointer border-l border-white/5"
                                  title="Optionen"
                                  aria-label="Optionen"
                                >
                                  <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                                </button>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('code')
                    )
                  )}

                  {/* 6. CANVAS */}
                  {activePopup === 'canvas' && (
                    filteredCanvas.length > 0 ? (
                      <div className="space-y-[3px] pt-1 pb-6">
                        {filteredCanvas.map((can, cIdx) => (
                          <div
                            key={`med-can-${can.id || cIdx}-${cIdx}`}
                            onClick={() => handleItemClick(can, 'canvas')}
                            className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                              <Layout className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                              <span className="text-[15px] font-normal text-white truncate">{can.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('canvas')
                    )
                  )}

                  {/* 9. LERNHILFE */}
                  {activePopup === 'lernhilfe' && (
                    filteredLernhilfe.length > 0 ? (
                      <div className="space-y-[3px] pt-1 pb-6">
                        {filteredLernhilfe.map((l, lIdx) => (
                          <div
                            key={`med-learn-${l.id || lIdx}-${lIdx}`}
                            onClick={() => handleItemClick(l, 'lernhilfe')}
                            className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                              <GraduationCap className="w-5 h-5 text-neutral-200 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                              <span className="text-[15px] font-normal text-white truncate">{l.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderEmptyState('lernhilfe')
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* LEXIKON POPUP FALLBACK: MEDIATHEK ERKLÄRUNG */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLexikonFallback && mediathekArticle && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
              isMobile ? "p-0" : "p-3 sm:p-6"
            }`}
          >
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
              onClick={() => setShowLexikonFallback(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full bg-[#000000] text-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans'] ${
                isMobile
                  ? "h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none"
                  : "max-w-[500px] sm:max-w-[530px] max-h-[92%] h-[680px] rounded-[32px] sm:rounded-[36px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowLexikonFallback(false)}
                className="absolute top-5 left-5 z-30 w-8 h-8 rounded-full bg-[#1c1c1e]/85 backdrop-blur-md hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-lg"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>

              <div 
                className={`w-full h-full overflow-y-auto no-scrollbar px-5 sm:px-8 ${
                  isMobile 
                    ? "pt-[max(env(safe-area-inset-top,0px),56px)] pb-[max(env(safe-area-inset-bottom,0px),32px)]" 
                    : "pt-14 pb-8"
                }`}
              >
                <div className="space-y-4 max-w-xl mx-auto pb-8">
                  {/* Fette Überschrift */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    {mediathekArticle.title}
                  </h3>

                  {/* Text in weiß mit hervorgehobenen Wörtern */}
                  <div className="space-y-3.5 text-white text-[15px] sm:text-[16px] leading-relaxed font-normal">
                    {mediathekArticle.paragraphs.map((para, idx) => (
                      <p key={idx} className="text-white">
                        {renderHighlightedText(para)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3-PUNKTE ACTION POPUP (Löschen, zu [Name], Veröffentlichen / Unveröffentlichen) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeMenuTarget && activeMenuTarget.rect && (
          <div 
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] select-none"
            onClick={() => setActiveMenuTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[85] w-56 sm:w-64 bg-[#1c1c1e] border border-white/15 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-sm select-none flex flex-col gap-0.5"
              style={getActionMenuStyle()}
            >
              {/* 1. Löschen */}
              <button
                type="button"
                onClick={() => handleDelete(activeMenuTarget)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-normal cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[1.8] shrink-0" />
                <span className="text-[14px]">Löschen</span>
              </button>

              {/* 2. zu [Name des Projektes, Kochbuches …] */}
              <button
                type="button"
                onClick={() => handleNavigateTo(activeMenuTarget)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                <span className="text-[14px] truncate">zu {activeMenuTarget.title}</span>
              </button>

              {/* 3. Veröffentlichen oder Unveröffentlichen */}
              {isTargetPublished(activeMenuTarget) ? (
                <button
                  type="button"
                  onClick={() => handleUnpublish(activeMenuTarget)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                  <span className="text-[14px]">Unveröffentlichen</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePublish(activeMenuTarget)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                  <span className="text-[14px]">Veröffentlichen</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEEDBACK TOAST */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-[#1c1c1e] border border-white/15 text-white text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-4 h-4 text-lime-400 stroke-[2.2]" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
