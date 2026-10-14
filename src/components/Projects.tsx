import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Plus,
  Search,
  Folder,
  FolderOpen,
  MessageSquare,
  Paperclip,
  MoreVertical,
  Settings,
  X,
  FileText,
  FileCode,
  FileImage,
  Upload,
  Library,
  Trash2,
  Share2,
  Edit2,
  Check,
  Sparkles,
  Mic,
  AudioWaveform,
  SmilePlus,
  BookOpen,
  DollarSign,
  PenTool,
  Heart,
  Briefcase,
  Code,
  Code2,
  Palette,
  Plane,
  Eye,
  ArrowUp,
  Camera,
  Image,
  SlidersHorizontal,
  Cloud,
  FileUp,
  LayoutGrid,
  MoreHorizontal,
  Pin,
  HelpCircle,
  Edit3,
  ChevronRight,
  ChevronLeft,
  ChefHat,
  UtensilsCrossed,
  Calendar,
  Video,
  Copy,
  Globe
} from 'lucide-react';
import { SaphireProject, ProjectSource, ChatSession, EngineSettings, GemmaModelId } from '../types';
import { playSound } from '../utils/sound';
import { db, auth, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc } from '../lib/firebase';
import { getLocalMediathekItems, extractItemsFromSessions, MediathekItem } from '../utils/mediaLibrary';
import { CookbookView } from './CookbookView';
import { DandeliousLogo } from './DandeliousLogo';
import { openHelpLexikon } from '../utils/openHelp';

interface ProjectsProps {
  settings: EngineSettings;
  sessions: ChatSession[];
  onBackToChat: () => void;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  onOpenProjectChat: (session: ChatSession, project: SaphireProject) => void;
  onStartNewProjectChat: (project: SaphireProject, initialPrompt?: string) => void;
  onUpdateSessions: (updater: (prev: ChatSession[]) => ChatSession[]) => void;
}

const STORAGE_PROJECTS_KEY = 'saphire_projects_v1';

// Preset Categories removed

const ICON_PICKER_OPTIONS = [
  { key: 'folder', label: 'Ordner', icon: Folder },
  { key: 'book', label: 'Lernen', icon: BookOpen },
  { key: 'dollar', label: 'Finanzen', icon: DollarSign },
  { key: 'pen', label: 'Schreiben', icon: PenTool },
  { key: 'heart', label: 'Fitness', icon: Heart },
  { key: 'code', label: 'Software', icon: Code },
  { key: 'palette', label: 'Design', icon: Palette },
  { key: 'plane', label: 'Reisen', icon: Plane },
  { key: 'briefcase', label: 'Business', icon: Briefcase },
  { key: 'sparkles', label: 'Kreativ', icon: Sparkles },
  { key: 'chef', label: 'Kochbuch', icon: ChefHat },
];

export const Projects: React.FC<ProjectsProps> = ({
  settings,
  sessions,
  onBackToChat,
  onToggleSidebar,
  isMobile = false,
  onOpenProjectChat,
  onStartNewProjectChat,
  onUpdateSessions,
}) => {
  // Persistence state - isolated per user
  const [projects, setProjects] = useState<SaphireProject[]>(() => {
    try {
      const uid = auth.currentUser?.uid;
      const key = uid ? `${STORAGE_PROJECTS_KEY}_${uid}` : `${STORAGE_PROJECTS_KEY}_guest`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Fehler beim Laden der Projekte:', e);
    }
    return [];
  });

  // Navigation / View states
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<SaphireProject | null>(null);
  const [projectDetailTab, setProjectDetailTab] = useState<'chats' | 'sources'>('chats');

  // Modal & Drawer states
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAddSourceMenu, setShowAddSourceMenu] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isChatPickerOpen, setIsChatPickerOpen] = useState(false);
  const [chatPickerSearch, setChatPickerSearch] = useState('');
  const [isProjectSourcePickerOpen, setIsProjectSourcePickerOpen] = useState(false);
  const [projectSourceSearch, setProjectSourceSearch] = useState('');
  const [isCookbookSourcePickerOpen, setIsCookbookSourcePickerOpen] = useState(false);
  const [cookbookSourceSearch, setCookbookSourceSearch] = useState('');
  const [isMediathekCategoryModalOpen, setIsMediathekCategoryModalOpen] = useState(false);
  const [selectedMediathekCategory, setSelectedMediathekCategory] = useState<'deep_research' | 'document' | 'code' | null>(null);
  const [isMediathekItemModalOpen, setIsItemModalOpen] = useState(false);
  const [mediathekItemSearch, setMediathekItemSearch] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isPlusDrawerOpen, setIsPlusDrawerOpen] = useState(false);
  const [viewingSource, setViewingSource] = useState<ProjectSource | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<'projects' | 'cookbooks' | null>(null);
  const [itemMenuTarget, setItemMenuTarget] = useState<{
    item: SaphireProject;
    rect: { top: number; bottom: number; left: number; right: number };
  } | null>(null);
  const [isOpeningAnimation, setIsOpeningAnimation] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3 | null>(null);
  const [sourceTutorialStep, setSourceTutorialStep] = useState<1 | 2 | 3 | null>(null);
  const SOURCE_TUTORIAL_STORAGE_KEY = 'saphire_projects_first_source_tutorial_seen';

  const checkAndShowSourceTutorial = () => {
    try {
      const seen = localStorage.getItem(SOURCE_TUTORIAL_STORAGE_KEY);
      if (!seen) {
        setSourceTutorialStep(1);
      }
    } catch (e) {}
  };

  const handleCloseSourceTutorial = () => {
    setSourceTutorialStep(null);
    try {
      localStorage.setItem(SOURCE_TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {}
  };
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for New / Edit Project
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectIconKey, setProjectIconKey] = useState('folder');
  const [projectInstructionsInput, setProjectInstructionsInput] = useState('');
  const [projectCategoryInput, setProjectCategoryInput] = useState('');

  // Source form states
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Prompt dock input in project (Matching Dandelious Promptleiste)
  const [chatPromptInput, setChatPromptInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Menu refs
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const [activeProjectMenuId, setActiveProjectMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  // Tab in popup: 'mine' (own private projects) or 'community' (public community projects)
  const [popupTab, setPopupTab] = useState<'mine' | 'community'>('mine');
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [communityProjects, setCommunityProjects] = useState<SaphireProject[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper to persist and sync private user project
  const syncProjectDoc = (proj: SaphireProject) => {
    const uid = auth.currentUser?.uid;
    const authorName = settings.userNickname || auth.currentUser?.displayName || 'Du';
    const authorId = uid || 'anon';

    if (uid) {
      setDoc(doc(db, 'users', uid, 'projects', proj.id), proj, { merge: true }).catch((e) => {
        console.warn('Sync user project error:', e);
      });
    }

    // Also update community_hub if project is published
    if (proj.isPublished) {
      setDoc(doc(db, 'community_hub', proj.id), {
        ...proj,
        title: proj.name,
        authorName: authorName,
        authorId: authorId,
        createdBy: authorId,
        createdByName: authorName,
        isPublished: true,
        updatedAt: Date.now()
      }, { merge: true }).catch(() => {});
    } else {
      deleteDoc(doc(db, 'community_hub', proj.id)).catch(() => {});
    }
  };

  // Helper to delete project
  const deleteProjectDoc = (projId: string) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      deleteDoc(doc(db, 'users', uid, 'projects', projId)).catch((e) => {
        console.warn('Delete user project error:', e);
      });
    }
    deleteDoc(doc(db, 'community_hub', projId)).catch(() => {});
  };

  // Sync to LocalStorage (User isolated)
  useEffect(() => {
    try {
      const uid = auth.currentUser?.uid;
      const key = uid ? `${STORAGE_PROJECTS_KEY}_${uid}` : `${STORAGE_PROJECTS_KEY}_guest`;
      localStorage.setItem(key, JSON.stringify(projects));
    } catch (e) {
      console.warn('Projects persist notice:', e);
    }
  }, [projects, auth.currentUser?.uid]);

  // Firestore Realtime Sync for User's PRIVATE Projects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = auth.currentUser?.uid;
    const key = uid ? `${STORAGE_PROJECTS_KEY}_${uid}` : `${STORAGE_PROJECTS_KEY}_guest`;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    }

    if (!uid) return;

    try {
      const projCol = collection(db, 'users', uid, 'projects');
      const unsub = onSnapshot(
        projCol,
        (snapshot) => {
          const remoteProjects: SaphireProject[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as SaphireProject;
            if (data && (data.id || docSnap.id)) {
              remoteProjects.push({ ...data, id: docSnap.id });
            }
          });
          const sorted = remoteProjects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setProjects(sorted);
          try {
            localStorage.setItem(`${STORAGE_PROJECTS_KEY}_${uid}`, JSON.stringify(sorted));
          } catch {}
        },
        (err) => {
          console.warn('Firestore user projects sync notice:', err);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Firestore user projects sync setup notice:', err);
    }
  }, [auth.currentUser?.uid]);

  // Firestore Realtime Sync for COMMUNITY Published Projects from all users
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const unsub = onSnapshot(
        collection(db, 'community_hub'),
        (snapshot) => {
          const items: SaphireProject[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            if (data && (data.type === 'project' || data.type === 'cookbook' || data.category === 'projekte' || data.category === 'kochbuecher')) {
              items.push({
                id: docSnap.id,
                name: data.name || data.title || 'Community Projekt',
                type: (data.type === 'cookbook' || data.category === 'kochbuecher') ? 'cookbook' : 'project',
                icon: data.icon || (data.type === 'cookbook' ? 'chef' : 'folder'),
                category: data.category || (data.type === 'cookbook' ? 'Kochen & Rezepte' : 'Community'),
                description: data.description || 'Community Projekt',
                instructions: data.instructions,
                sources: data.sources || [],
                recipes: data.recipes || [],
                chatIds: data.chatIds || [],
                createdAt: data.createdAt || Date.now(),
                updatedAt: data.updatedAt || Date.now(),
                createdBy: data.authorId || data.createdBy || 'Community',
                createdByName: data.authorName || data.createdByName || 'Community',
                isShared: true,
                isPublished: true,
              });
            }
          });
          setCommunityProjects(items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        },
        (err) => {
          console.warn('Community projects sync notice:', err);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Community projects sync notice:', err);
    }
  }, []);

  // Check URL params for project invite / share link (?project=PROJ_ID)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const projId = params.get('project') || params.get('proj');
      if (projId) {
        const found = projects.find((p) => p.id === projId) || communityProjects.find((p) => p.id === projId);
        if (found) {
          setSelectedProject(found);
        } else {
          // Fetch from Firestore community_hub
          const docRef = doc(db, 'community_hub', projId);
          getDoc(docRef).then((snap) => {
            if (snap.exists()) {
              const data = snap.data() as any;
              const sharedProj: SaphireProject = {
                id: snap.id,
                name: data.name || data.title || 'Geteiltes Projekt',
                type: data.type === 'cookbook' ? 'cookbook' : 'project',
                icon: data.icon || 'folder',
                category: data.category,
                description: data.description,
                instructions: data.instructions,
                sources: data.sources || [],
                recipes: data.recipes || [],
                chatIds: [],
                createdAt: data.createdAt || Date.now(),
                updatedAt: data.updatedAt || Date.now(),
                createdBy: data.authorId || 'Community',
                createdByName: data.authorName || 'Community',
                isShared: true,
                isPublished: true
              };
              setProjects((prev) => [sharedProj, ...prev.filter((p) => p.id !== snap.id)]);
              setSelectedProject(sharedProj);
              showToast(`Projekt "${sharedProj.name}" geladen`);
            }
          }).catch((e) => console.warn('Fetch shared project error:', e));
        }
      }
    } catch (e) {
      console.warn('URL project check notice:', e);
    }
  }, [projects.length, communityProjects.length]);

  // Keep selectedProject up to date with projects array
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find((p) => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [projects]);

  // Position style for 3-dots context menu on projects / cookbooks
  const getItemActionMenuStyle = () => {
    if (!itemMenuTarget?.rect) return {};
    const { top, bottom, right } = itemMenuTarget.rect;
    const menuHeight = 110;
    const menuWidth = 190;

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

  // Helper to render Lucide vector icons for a project
  const renderVectorIcon = (iconKey?: string, className = "w-5 h-5") => {
    switch (iconKey) {
      case 'book': return <BookOpen className={className} />;
      case 'dollar': return <DollarSign className={className} />;
      case 'pen': return <PenTool className={className} />;
      case 'heart': return <Heart className={className} />;
      case 'code': return <Code className={className} />;
      case 'palette': return <Palette className={className} />;
      case 'plane': return <Plane className={className} />;
      case 'briefcase': return <Briefcase className={className} />;
      case 'sparkles': return <Sparkles className={className} />;
      case 'chef': return <ChefHat className={className} />;
      case 'calendar': return <Calendar className={className} />;
      default: return <Folder className={className} />;
    }
  };

  // Helper to render highlighted text with lime green keywords like Mediathek
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={`highlight-${i}`} className="font-semibold text-[#C5DC57]">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <React.Fragment key={`text-${i}`}>{part}</React.Fragment>;
    });
  };

  // Creation Type: user chooses between 'select', 'project', or 'cookbook'
  const [creationType, setCreationType] = useState<'select' | 'project' | 'cookbook' | 'planner'>('select');
  const [cookbookNameInput, setCookbookNameInput] = useState('Mein Kochbuch');

  // Handle swipe-to-open creation with animation
  const handleConfirmCreateAndOpen = () => {
    if (isOpeningAnimation) return;
    setIsOpeningAnimation(true);
    playSound('send', settings.enableSoundEffects ?? true);

    setTimeout(() => {
      if (creationType === 'cookbook') {
        const finalName = (projectNameInput || cookbookNameInput || 'Mein Kochbuch').trim();
        const newCookbook: SaphireProject = {
          id: `cookbook-${Date.now()}`,
          name: finalName,
          type: 'cookbook',
          icon: projectIconKey || 'chef',
          category: 'Kochen & Rezepte',
          description: 'Rezept-Manager & KI-Küchenchef',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: settings.userNickname || 'Ich',
          sources: [],
          chatIds: [],
          recipes: []
        };
        setProjects((prev) => [newCookbook, ...prev]);
        setSelectedProject(newCookbook);
        syncProjectDoc(newCookbook);
        showToast(`Kochbuch "${newCookbook.name}" geöffnet`);
      } else {
        const finalName = (projectNameInput || 'Neues Projekt').trim();
        const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newProj: SaphireProject = {
          id: newId,
          name: finalName,
          type: 'project',
          icon: projectIconKey || 'folder',
          category: projectCategoryInput.trim() || undefined,
          instructions: projectInstructionsInput.trim() || undefined,
          description: 'Projekt-Arbeitsbereich',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: settings.userNickname || 'Ich',
          sources: [],
          chatIds: []
        };
        setProjects((prev) => [newProj, ...prev]);
        setSelectedProject(newProj);
        syncProjectDoc(newProj);
        showToast(`Projekt "${newProj.name}" geöffnet`);
      }
      if (tutorialStep !== null) {
        try {
          localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        } catch (e) {}
        setTutorialStep(null);
      }
      setIsCreatingProject(false);
      setIsOpeningAnimation(false);
      setProjectNameInput('');
      setCookbookNameInput('Mein Kochbuch');
    }, 380);
  };

  // Handle open creation modal
  const handleOpenCreateModal = () => {
    playSound('pop', settings.enableSoundEffects ?? true);
    setCreationType('select');
    setProjectNameInput('');
    setProjectIconKey('folder');
    setProjectInstructionsInput('');
    setProjectCategoryInput('');
    setCookbookNameInput('Mein Kochbuch');
    setIsOpeningAnimation(false);
    setIsCreatingProject(true);
    setIsEditingProject(false);
  };

  const TUTORIAL_STORAGE_KEY = 'saphire_projects_first_plus_tutorial_seen';

  const checkAndShowTutorial = () => {
    try {
      const seen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!seen) {
        setTutorialStep(1);
      }
    } catch (e) {}
  };

  const handleCloseTutorial = () => {
    playSound('click', settings.enableSoundEffects ?? true);
    setTutorialStep(null);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {}
  };

  // Handle open creation modal specifically for Project
  const handleOpenCreateProject = () => {
    playSound('pop', settings.enableSoundEffects ?? true);
    setCreationType('project');
    setProjectNameInput('');
    setProjectIconKey('folder');
    setProjectInstructionsInput('');
    setProjectCategoryInput('');
    setIsOpeningAnimation(false);
    setIsCreatingProject(true);
    setIsEditingProject(false);
    checkAndShowTutorial();
  };

  // Handle open creation modal specifically for Cookbook
  const handleOpenCreateCookbook = () => {
    playSound('pop', settings.enableSoundEffects ?? true);
    setCreationType('cookbook');
    setProjectNameInput('');
    setCookbookNameInput('Mein Kochbuch');
    setProjectIconKey('chef');
    setIsOpeningAnimation(false);
    setIsCreatingProject(true);
    setIsEditingProject(false);
    checkAndShowTutorial();
  };

  // Handle instant creation and opening of a Cookbook project
  const handleCreateCookbook = (customName?: string) => {
    playSound('send', settings.enableSoundEffects ?? true);
    const newCookbook: SaphireProject = {
      id: `cookbook-${Date.now()}`,
      name: (customName || cookbookNameInput || 'Mein Kochbuch').trim(),
      type: 'cookbook',
      icon: 'chef',
      category: 'Kochen & Rezepte',
      description: 'Rezept-Manager & KI-Küchenchef',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: settings.userNickname || 'Ich',
      sources: [],
      chatIds: [],
      recipes: []
    };
    setProjects((prev) => [newCookbook, ...prev]);
    setSelectedProject(newCookbook);
    setIsCreatingProject(false);
    syncProjectDoc(newCookbook);
    showToast(`Kochbuch "${newCookbook.name}" geöffnet`);
  };

  // Handle instant creation and opening of a Planner project
  const handleCreatePlanner = (customName?: string) => {
    playSound('send', settings.enableSoundEffects ?? true);
    const newPlanner: SaphireProject = {
      id: `planner-${Date.now()}`,
      name: (customName || 'Kühlschrank- & Essensplaner').trim(),
      type: 'planner',
      icon: 'calendar',
      category: 'Planer',
      description: 'Kühlschrank-Scan, Vorrats-Tracking & smarte Einkaufsliste',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: settings.userNickname || 'Ich',
      sources: [],
      chatIds: [],
      recipes: [],
      plannerState: {
        peopleCount: 4,
        scans: [],
        shoppingList: []
      }
    };
    setProjects((prev) => [newPlanner, ...prev]);
    setSelectedProject(newPlanner);
    setIsCreatingProject(false);
    syncProjectDoc(newPlanner);
    showToast(`Planer "${newPlanner.name}" geöffnet`);
  };

  // Toggle publish to community
  const handleTogglePublishProject = async (proj: SaphireProject) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setItemMenuTarget(null);
    const willPublish = !proj.isPublished;
    const authorName = settings.userNickname || auth.currentUser?.displayName || 'Du';
    const authorId = auth.currentUser?.uid || 'anon';

    const updatedProj: SaphireProject = {
      ...proj,
      isPublished: willPublish,
      isShared: willPublish,
      createdByName: authorName,
      updatedAt: Date.now()
    };

    setProjects((prev) => prev.map((p) => (p.id === proj.id ? updatedProj : p)));
    if (selectedProject?.id === proj.id) {
      setSelectedProject(updatedProj);
    }
    syncProjectDoc(updatedProj);

    try {
      if (willPublish) {
        const communityPayload = {
          id: proj.id,
          name: proj.name,
          title: proj.name,
          type: proj.type === 'cookbook' ? 'cookbook' : 'project',
          category: proj.type === 'cookbook' ? 'kochbuecher' : 'projekte',
          description: proj.description || (proj.type === 'cookbook' ? 'Rezept-Manager & KI-Küchenchef' : 'Projekt-Arbeitsbereich'),
          icon: proj.icon || (proj.type === 'cookbook' ? 'chef' : 'folder'),
          instructions: proj.instructions || '',
          sources: proj.sources || [],
          recipes: proj.recipes || [],
          chatIds: [],
          authorName: authorName,
          authorId: authorId,
          isPublished: true,
          createdAt: proj.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        await setDoc(doc(db, 'community_hub', proj.id), communityPayload, { merge: true });
        showToast(`"${proj.name}" in der Community veröffentlicht!`);
      } else {
        await deleteDoc(doc(db, 'community_hub', proj.id));
        showToast(`"${proj.name}" aus der Community entfernt.`);
      }
    } catch (err) {
      console.warn('Publish error:', err);
      showToast(willPublish ? `Veröffentlicht` : `Aus Community entfernt`);
    }
  };

  // Copy Community Project into user's own projects
  const handleCopyCommunityProject = (commProj: SaphireProject) => {
    playSound('send', settings.enableSoundEffects ?? true);
    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const clonedProj: SaphireProject = {
      ...commProj,
      id: newId,
      name: `${commProj.name} (Kopie)`,
      createdBy: settings.userNickname || 'Ich',
      createdByName: undefined,
      isShared: false,
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProjects((prev) => [clonedProj, ...prev]);
    setSelectedProject(clonedProj);
    setActivePopup(null);
    syncProjectDoc(clonedProj);
    showToast(`"${clonedProj.name}" in deine Projekte übernommen!`);
  };

  // Handle save new or edited project
  const handleSaveProject = () => {
    if (!projectNameInput.trim()) return;
    playSound('send', settings.enableSoundEffects ?? true);

    if (isEditingProject && selectedProject) {
      const updatedProject: SaphireProject = {
        ...selectedProject,
        name: projectNameInput.trim(),
        icon: projectIconKey,
        instructions: projectInstructionsInput.trim(),
        category: projectCategoryInput,
        updatedAt: Date.now(),
      };

      setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updatedProject : p)));
      setSelectedProject(updatedProject);
      syncProjectDoc(updatedProject);

      setIsCreatingProject(false);
      setIsEditingProject(false);
      showToast(`Projekt "${updatedProject.name}" aktualisiert`);
    } else {
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProject: SaphireProject = {
        id: newId,
        name: projectNameInput.trim(),
        icon: projectIconKey,
        instructions: projectInstructionsInput.trim(),
        category: projectCategoryInput,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: settings.userNickname || 'user-me',
        createdByName: settings.userNickname || 'Du',
        sources: [],
        chatIds: [],
        isShared: false,
      };

      setProjects((prev) => [newProject, ...prev]);
      setSelectedProject(newProject);
      syncProjectDoc(newProject);

      setIsCreatingProject(false);
      showToast(`Projekt "${newProject.name}" erstellt`);
    }
  };

  // Delete project
  const handleDeleteProject = (projId: string) => {
    playSound('click', settings.enableSoundEffects ?? true);
    setProjects((prev) => prev.filter((p) => p.id !== projId));
    if (selectedProject?.id === projId) {
      setSelectedProject(null);
    }
    setActiveProjectMenuId(null);
    deleteProjectDoc(projId);
    showToast('Projekt gelöscht');
  };

  // Toggle Pin Project
  const handleTogglePinProject = (projId: string) => {
    playSound('click', settings.enableSoundEffects ?? true);
    const target = projects.find((p) => p.id === projId);
    const nextPinned = !target?.isPinned;

    const updatedProj = target ? { ...target, isPinned: nextPinned, updatedAt: Date.now() } : null;
    if (updatedProj) {
      setProjects((prev) => prev.map((p) => (p.id === projId ? updatedProj : p)));
      if (selectedProject?.id === projId) {
        setSelectedProject(updatedProj);
      }
      syncProjectDoc(updatedProj);
      showToast(nextPinned ? 'Projekt angepinnt' : 'Pin gelöst');
    }
  };

  // Add source to project
  const handleAddSource = (source: ProjectSource) => {
    if (!selectedProject) return;
    playSound('pop', settings.enableSoundEffects ?? true);
    if (sourceTutorialStep !== null) {
      handleCloseSourceTutorial();
    }

    const alreadyExists = selectedProject.sources.some(
      (s) => s.id === source.id || (s.name === source.name && s.content === source.content)
    );
    if (alreadyExists) {
      showToast(`Quelle "${source.name}" ist bereits vorhanden`);
      return;
    }

    const updatedSources = [source, ...selectedProject.sources];
    const updatedProject: SaphireProject = {
      ...selectedProject,
      sources: updatedSources,
      updatedAt: Date.now(),
    };

    setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updatedProject : p)));
    setSelectedProject(updatedProject);
    syncProjectDoc(updatedProject);
    showToast(`Quelle "${source.name}" hinzugefügt`);
  };

  // Remove source
  const handleRemoveSource = (sourceId: string) => {
    if (!selectedProject) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const updatedSources = selectedProject.sources.filter((s) => s.id !== sourceId);
    const updatedProject: SaphireProject = {
      ...selectedProject,
      sources: updatedSources,
      updatedAt: Date.now(),
    };

    setProjects((prev) => prev.map((p) => (p.id === selectedProject.id ? updatedProject : p)));
    setSelectedProject(updatedProject);
    syncProjectDoc(updatedProject);
    showToast('Quelle entfernt');
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProject) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const newSource: ProjectSource = {
            id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: 'file',
            content: content,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            mimeType: file.type,
            uploadedAt: Date.now(),
          };
          handleAddSource(newSource);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const newSource: ProjectSource = {
            id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            type: 'file',
            content: content,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            mimeType: file.type || 'text/plain',
            uploadedAt: Date.now(),
          };
          handleAddSource(newSource);
        };
        reader.readAsText(file);
      }
    });

    setShowAddSourceMenu(false);
    setIsPlusDrawerOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Note Submit
  const handleSaveNoteSource = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !selectedProject) return;
    const newSource: ProjectSource = {
      id: `src_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newNoteTitle.trim(),
      type: 'note',
      content: newNoteContent.trim(),
      size: `${newNoteContent.length} Zeichen`,
      uploadedAt: Date.now(),
    };
    handleAddSource(newSource);
    setNewNoteTitle('');
    setNewNoteContent('');
    setIsAddNoteModalOpen(false);
    setShowAddSourceMenu(false);
    setIsPlusDrawerOpen(false);
  };

  // Combined items from local storage & sessions for Mediathek picking
  const combinedMediathekItems = useMemo(() => {
    const local = getLocalMediathekItems();
    const fromSessions = extractItemsFromSessions(sessions);
    const map = new Map<string, MediathekItem>();
    fromSessions.forEach((i) => map.set(i.id, i));
    local.forEach((i) => map.set(i.id, i));
    return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [sessions, isMediathekCategoryModalOpen, isMediathekItemModalOpen]);

  const researchItems = useMemo(() => {
    return combinedMediathekItems.filter(
      (i) => i.type === 'deep_research' || i.tags?.includes('deep-research') || (i.title && i.title.toLowerCase().includes('research'))
    );
  }, [combinedMediathekItems]);

  const documentItems = useMemo(() => {
    return combinedMediathekItems.filter(
      (i) => i.type === 'document' && !i.tags?.includes('deep-research') && !(i.title && i.title.toLowerCase().includes('research'))
    );
  }, [combinedMediathekItems]);

  const codeItems = useMemo(() => {
    return combinedMediathekItems.filter(
      (i) => i.type === 'code' || i.category === 'code' || (i.type === 'document' && (i.title.endsWith('.ts') || i.title.endsWith('.tsx') || i.title.endsWith('.js') || i.title.endsWith('.jsx') || i.title.endsWith('.py') || i.title.endsWith('.html') || i.title.endsWith('.css') || i.title.endsWith('.json') || (i.content && (i.content.includes('```') || i.content.includes('function ') || i.content.includes('const ') || i.content.includes('import ')))))
    );
  }, [combinedMediathekItems]);

  // Filtered items in Mediathek Item Picker
  const filteredCategoryItems = useMemo(() => {
    if (!selectedMediathekCategory) return [];
    let items: MediathekItem[] = [];
    if (selectedMediathekCategory === 'deep_research') {
      items = researchItems;
    } else if (selectedMediathekCategory === 'document') {
      items = documentItems;
    } else if (selectedMediathekCategory === 'code') {
      items = codeItems;
    }

    if (!mediathekItemSearch.trim()) return items;
    const q = mediathekItemSearch.toLowerCase();
    return items.filter((i) => {
      const titleMatch = (i.title || '').toLowerCase().includes(q);
      const contentMatch = (i.content || '').toLowerCase().includes(q);
      const descMatch = (i.description || '').toLowerCase().includes(q);
      return titleMatch || contentMatch || descMatch;
    });
  }, [selectedMediathekCategory, researchItems, documentItems, codeItems, mediathekItemSearch]);

  // Available chat sessions for Chat Picker
  const availableChatSessions = useMemo(() => {
    const list = sessions.filter((s) => s && s.messages && s.messages.length > 0);
    if (!chatPickerSearch.trim()) return list;
    const q = chatPickerSearch.toLowerCase();
    return list.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const contentMatch = s.messages.some((m) => m.content && m.content.toLowerCase().includes(q));
      return titleMatch || contentMatch;
    });
  }, [sessions, chatPickerSearch]);

  // Handle adding an existing Chat as a Source
  const handleAddChatSource = (session: ChatSession) => {
    if (!selectedProject) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const transcript = session.messages
      .map((m) => {
        const sender = m.role === 'user' ? 'Nutzer' : 'Dandelious';
        return `[${sender}]:\n${m.content}`;
      })
      .join('\n\n---\n\n');

    const newSource: ProjectSource = {
      id: `src_chat_${session.id}_${Date.now()}`,
      name: `Chat: ${session.title || 'Unterhaltung'}`,
      type: 'chat',
      content: transcript,
      size: `${session.messages.length} Nachrichten`,
      uploadedAt: Date.now(),
    };

    handleAddSource(newSource);
    setIsChatPickerOpen(false);
    setChatPickerSearch('');
  };

  // Handle adding another Project as a Source
  const handleAddProjectSource = (proj: SaphireProject) => {
    if (!selectedProject) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const infoParts = [
      `Projekt: ${proj.name}`,
      proj.category ? `Kategorie: ${proj.category}` : '',
      proj.instructions ? `Anweisungen: ${proj.instructions}` : '',
      proj.sources && proj.sources.length > 0
        ? `Quellen (${proj.sources.length}):\n` + proj.sources.map((s) => `- ${s.name}: ${s.content?.slice(0, 200)}`).join('\n')
        : ''
    ].filter(Boolean).join('\n\n');

    const newSource: ProjectSource = {
      id: `src_proj_${proj.id}_${Date.now()}`,
      name: `Projekt: ${proj.name}`,
      type: 'project',
      content: infoParts || proj.name,
      size: `${proj.sources?.length || 0} Quellen`,
      uploadedAt: Date.now(),
    };

    handleAddSource(newSource);
    setIsProjectSourcePickerOpen(false);
    setProjectSourceSearch('');
  };

  // Handle adding a Cookbook as a Source
  const handleAddCookbookSource = (cb: SaphireProject) => {
    if (!selectedProject) return;
    playSound('click', settings.enableSoundEffects ?? true);

    const infoParts = [
      `Kochbuch: ${cb.name}`,
      cb.description ? `Beschreibung: ${cb.description}` : '',
      cb.sources && cb.sources.length > 0
        ? `Rezepte & Quellen (${cb.sources.length}):\n` + cb.sources.map((s) => `- ${s.name}: ${s.content?.slice(0, 200)}`).join('\n')
        : ''
    ].filter(Boolean).join('\n\n');

    const newSource: ProjectSource = {
      id: `src_cb_${cb.id}_${Date.now()}`,
      name: `Kochbuch: ${cb.name}`,
      type: 'cookbook',
      content: infoParts || cb.name,
      size: `${cb.sources?.length || 0} Einträge`,
      uploadedAt: Date.now(),
    };

    handleAddSource(newSource);
    setIsCookbookSourcePickerOpen(false);
    setCookbookSourceSearch('');
  };

  // Select a category from Mediathek to open the items picker window
  const handleSelectMediathekCategory = (cat: 'deep_research' | 'document' | 'code') => {
    playSound('click', settings.enableSoundEffects ?? true);
    setSelectedMediathekCategory(cat);
    setIsMediathekCategoryModalOpen(false);
    setIsItemModalOpen(true);
    setMediathekItemSearch('');
  };

  // Back from item picker to category picker
  const handleBackToMediathekCategories = () => {
    playSound('click', settings.enableSoundEffects ?? true);
    setIsItemModalOpen(false);
    setIsMediathekCategoryModalOpen(true);
    setMediathekItemSearch('');
  };

  // Handle adding a specific Mediathek item as a Source
  const handleAddMediathekSource = (item: MediathekItem) => {
    if (!selectedProject) return;
    playSound('click', settings.enableSoundEffects ?? true);

    let content = item.content || item.description || item.url || '';
    let mimeType = 'text/plain';
    let size = `${content.length} Zeichen`;

    if (item.type === 'image' || item.url) {
      content = item.url || item.content || '';
      mimeType = 'image/png';
      size = 'Bild';
    } else if (item.type === 'deep_research') {
      mimeType = 'text/markdown';
      size = `${Math.round(content.length / 1000)}k Zeichen`;
    } else if (item.type === 'document' || item.type === 'code') {
      mimeType = item.type === 'code' ? 'text/plain' : 'text/markdown';
      size = `${Math.round(content.length / 1000)}k Zeichen`;
    }

    const prefix = item.type === 'deep_research' ? 'Research: ' : item.type === 'image' ? 'Bild: ' : 'Dokument: ';
    const cleanTitle = item.title?.replace(/^(Research|Bild|Dokument):\s*/i, '') || 'Mediathek-Inhalt';

    const newSource: ProjectSource = {
      id: `src_med_${item.id}_${Date.now()}`,
      name: `${prefix}${cleanTitle}`,
      type: 'mediathek',
      content: content,
      size: size,
      mimeType: mimeType,
      uploadedAt: Date.now(),
    };

    handleAddSource(newSource);
    setIsItemModalOpen(false);
    setIsMediathekCategoryModalOpen(false);
    setMediathekItemSearch('');
  };

  // Start new chat in project via prompt bar
  const handleStartChatInProject = (promptText?: string) => {
    if (!selectedProject) return;
    const textToSend = promptText !== undefined ? promptText : chatPromptInput;
    playSound('send', settings.enableSoundEffects ?? true);
    onStartNewProjectChat(selectedProject, textToSend);
    setChatPromptInput('');
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (activeTab === 'created' && p.isShared) return false;
    if (activeTab === 'shared' && !p.isShared) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.instructions && p.instructions.toLowerCase().includes(q))
    );
  });

  const regularProjects = useMemo(() => {
    const seen = new Set<string>();
    return projects.filter((p) => {
      if (!p || !p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return p.type !== 'cookbook' && p.type !== 'planner';
    });
  }, [projects]);

  const cookbookProjects = useMemo(() => {
    const seen = new Set<string>();
    return projects.filter((p) => {
      if (!p || !p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return p.type === 'cookbook' || p.type === 'planner';
    });
  }, [projects]);

  // Get project chats from sessions
  const projectChats = useMemo(() => {
    if (!selectedProject) return [];
    const seen = new Set<string>();
    return sessions.filter((s) => {
      if (!s || !s.id || seen.has(s.id)) return false;
      const isMatch = s.projectId === selectedProject.id || selectedProject.chatIds?.includes(s.id);
      if (isMatch) {
        seen.add(s.id);
        return true;
      }
      return false;
    });
  }, [selectedProject, sessions]);

  return (
    <div
      className="relative flex flex-col w-full h-full h-[100dvh] bg-black text-white select-none overflow-hidden"
      id="dandelious-projects-view"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-lime-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,.txt,.js,.ts,.py,.json,.md,.css,.html,.sql,.sh,.pdf,.doc,.docx"
        className="hidden"
      />

      {/* VIEW 1: PROJECTS LIST OVERVIEW */}
      <AnimatePresence mode="wait">
        {!selectedProject && (
          <motion.div
            key="projects-overview-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex-1 flex flex-col justify-between relative bg-black select-none"
          >
            {/* Top Header - Links Seitenleisten-Knopf wie bei Mediathek, Rechts Fragezeichen */}
            <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0">
              {/* Seitenleisten-Knopf ganz links wie bei der Mediathek */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  onToggleSidebar();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
                title="Menü"
                id="projects-sidebar-btn"
              >
                <span className="w-4 h-[2px] bg-white rounded-full" />
                <span className="w-4 h-[2px] bg-white rounded-full" />
              </button>

              {/* Fragezeichen-Knopf ganz rechts wie bei der Mediathek */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  openHelpLexikon();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
                title="Hilfe (Dandelious Lexikon)"
                id="projects-help-btn"
              >
                <HelpCircle className="w-5 h-5 stroke-[1.8]" />
              </button>
            </header>

            {/* Oben positioniert wie bei der Mediathek mit Stagger-Animation & Spring Bounce Drag */}
            <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-12 flex-1 flex flex-col items-center">
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
                    transition: { staggerChildren: 0.08 }
                  }
                }}
                className="w-full space-y-3 sm:space-y-3.5"
              >
                {/* 1. REIHE: PROJEKT BUTTON + SEPARATER PLUS BUTTON */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } }
                  }}
                  className="flex items-center gap-2.5 sm:gap-3 w-full"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015, x: 3, backgroundColor: '#2c2c2e' }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setActivePopup('projects');
                    }}
                    className="flex-1 min-w-0 bg-[#242426] rounded-full px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-white/5"
                    id="projects-btn-project"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 mr-2">
                      <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                      <span className="text-[15px] font-normal text-white truncate">Projekt</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      handleOpenCreateProject();
                    }}
                    className="w-12 sm:w-[50px] h-12 sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer shadow-sm shrink-0 group"
                    title="Neues Projekt erstellen"
                    id="projects-btn-project-plus"
                  >
                    <Plus className="w-5 h-5 stroke-[2] text-neutral-300 group-hover:text-white transition-colors" />
                  </motion.button>
                </motion.div>

                {/* 2. REIHE: KOCHBUCH BUTTON + SEPARATER PLUS BUTTON */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } }
                  }}
                  className="flex items-center gap-2.5 sm:gap-3 w-full"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015, x: 3, backgroundColor: '#2c2c2e' }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setActivePopup('cookbooks');
                    }}
                    className="flex-1 min-w-0 bg-[#242426] rounded-full px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-white/5"
                    id="projects-btn-cookbook"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 mr-2">
                      <ChefHat className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                      <span className="text-[15px] font-normal text-white truncate">Kochbuch</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      handleOpenCreateCookbook();
                    }}
                    className="w-12 sm:w-[50px] h-12 sm:h-[50px] rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer shadow-sm shrink-0 group"
                    title="Neues Kochbuch erstellen"
                    id="projects-btn-cookbook-plus"
                  >
                    <Plus className="w-5 h-5 stroke-[2] text-neutral-300 group-hover:text-white transition-colors" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </main>

            <div className="h-4 w-full shrink-0" />
          </motion.div>
        )}

      {/* POPUP MODAL FÜR PROJEKTE ODER KOCHBÜCHER */}
      <AnimatePresence>
        {activePopup && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setActivePopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-[#000000] border border-white/10 sm:rounded-[32px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Schließen Button */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setActivePopup(null);
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-md transition-all active:scale-95"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    {activePopup === 'projects' ? (
                      <Folder className="w-5 h-5 text-white stroke-[1.8]" />
                    ) : (
                      <ChefHat className="w-5 h-5 text-white stroke-[1.8]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {activePopup === 'projects' ? 'Projekte' : 'Kochbücher'}
                    </h3>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      {activePopup === 'projects'
                        ? 'Wähle ein Projekt aus oder entdecke Community-Projekte'
                        : 'Wähle ein Kochbuch aus oder entdecke Community-Kochbücher'}
                    </p>
                  </div>
                </div>

                {/* Tabs: Meine vs Community */}
                <div className="flex items-center gap-1.5 p-1 bg-[#1c1c1e] rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setPopupTab('mine');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      popupTab === 'mine'
                        ? 'bg-white text-black shadow'
                        : 'text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    Meine ({activePopup === 'projects' ? regularProjects.length : cookbookProjects.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', settings.enableSoundEffects ?? true);
                      setPopupTab('community');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      popupTab === 'community'
                        ? 'bg-white text-black shadow'
                        : 'text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    Community ({activePopup === 'projects' ? communityProjects.filter(p => p.type !== 'cookbook' && p.type !== 'planner').length : communityProjects.filter(p => p.type === 'cookbook' || p.type === 'planner').length})
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-2.5 flex-1 max-h-[60vh]">
                {popupTab === 'community' && (
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={popupSearchQuery}
                      onChange={(e) => setPopupSearchQuery(e.target.value)}
                      placeholder={activePopup === 'projects' ? "Community-Projekte durchsuchen..." : "Community-Kochbücher durchsuchen..."}
                      className="w-full bg-[#1c1c1e] text-white placeholder-neutral-500 text-xs sm:text-sm rounded-full pl-9 pr-9 py-2.5 border border-white/10 focus:outline-none focus:border-white/25 transition-all"
                    />
                    {popupSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPopupSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {popupTab === 'mine' ? (
                  activePopup === 'projects' ? (
                    regularProjects.length > 0 ? (
                      regularProjects.map((proj, pIdx) => (
                        <div key={`proj-popup-${proj.id || pIdx}-${pIdx}`} className="flex items-center gap-2.5 w-full group">
                          <div
                            onClick={() => {
                              playSound('click', settings.enableSoundEffects ?? true);
                              setSelectedProject(proj);
                              setActivePopup(null);
                            }}
                            className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                              {renderVectorIcon(proj.icon || 'folder', "w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0")}
                              <span className="text-[15px] font-normal text-white truncate">{proj.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {proj.isPublished && (
                                <span className="text-[10px] text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2 py-0.5 rounded-full font-medium">
                                  Community
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound('click', settings.enableSoundEffects ?? true);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setItemMenuTarget({
                                item: proj,
                                rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
                              });
                            }}
                            className="w-12 h-12 rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                            title="Optionen"
                          >
                            <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <Folder className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                        <p className="text-sm font-medium text-white">Noch keine eigenen Projekte</p>
                        <p className="text-xs text-neutral-400 mt-1 max-w-[220px]">
                          Tippe auf das Plus (+) neben „Projekt“, um dein erstes Projekt anzulegen, oder wechsle zum Community-Tab!
                        </p>
                      </div>
                    )
                  ) : (
                    cookbookProjects.length > 0 ? (
                      cookbookProjects.map((cb, cIdx) => (
                        <div key={`cb-popup-${cb.id || cIdx}-${cIdx}`} className="flex items-center gap-2.5 w-full group">
                          <div
                            onClick={() => {
                              playSound('click', settings.enableSoundEffects ?? true);
                              setSelectedProject(cb);
                              setActivePopup(null);
                            }}
                            className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                              <ChefHat className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                              <span className="text-[15px] font-normal text-white truncate">{cb.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {cb.isPublished && (
                                <span className="text-[10px] text-lime-400 bg-lime-400/10 border border-lime-400/20 px-2 py-0.5 rounded-full font-medium">
                                  Community
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound('click', settings.enableSoundEffects ?? true);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setItemMenuTarget({
                                item: cb,
                                rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
                              });
                            }}
                            className="w-12 h-12 rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                            title="Optionen"
                          >
                            <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <ChefHat className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                        <p className="text-sm font-medium text-white">Noch keine eigenen Kochbücher</p>
                        <p className="text-xs text-neutral-400 mt-1 max-w-[220px]">
                          Tippe auf das Plus (+) neben „Kochbuch“, um dein erstes Kochbuch anzulegen, oder schaue in die Community!
                        </p>
                      </div>
                    )
                  )
                ) : (
                  /* COMMUNITY TAB */
                  (() => {
                    const isCb = activePopup === 'cookbooks';
                    const q = popupSearchQuery.toLowerCase().trim();
                    const list = communityProjects.filter((p) => {
                      if (isCb ? (p.type !== 'cookbook' && p.type !== 'planner') : (p.type === 'cookbook' || p.type === 'planner')) {
                        return false;
                      }
                      if (!q) return true;
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.category && p.category.toLowerCase().includes(q)) ||
                        (p.description && p.description.toLowerCase().includes(q)) ||
                        (p.createdByName && p.createdByName.toLowerCase().includes(q))
                      );
                    });

                    if (list.length === 0) {
                      return (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                          <Globe className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                          <p className="text-sm font-medium text-white">Keine Community-{isCb ? 'Kochbücher' : 'Projekte'} gefunden</p>
                          <p className="text-xs text-neutral-400 mt-1 max-w-[260px]">
                            {popupSearchQuery
                              ? 'Keine Ergebnisse für deine Suche.'
                              : 'Veröffentliche deine eigenen Projekte über die Optionen (...), damit andere sie hier entdecken können!'}
                          </p>
                        </div>
                      );
                    }

                    return list.map((item, idx) => {
                      const isOwn = item.createdBy === auth.currentUser?.uid || item.createdByName === (settings.userNickname || 'Du') || projects.some(p => p.id === item.id);
                      return (
                        <div key={`comm-item-${item.id || idx}-${idx}`} className="flex items-center gap-2.5 w-full group">
                          <div
                            onClick={() => {
                              playSound('click', settings.enableSoundEffects ?? true);
                              setSelectedProject(item);
                              setActivePopup(null);
                            }}
                            className="flex-1 min-w-0 bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                              {isCb ? (
                                <ChefHat className="w-5 h-5 text-lime-400 stroke-[1.8] shrink-0" />
                              ) : (
                                renderVectorIcon(item.icon || 'folder', "w-5 h-5 text-lime-400 stroke-[1.8] shrink-0")
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[15px] font-normal text-white truncate">{item.name}</span>
                                <span className="text-[11px] text-[#8e8e93] truncate">
                                  Von {isOwn ? 'dir' : (item.createdByName || 'Community')} {item.sources?.length ? `• ${item.sources.length} Quellen` : ''} {item.recipes?.length ? `• ${item.recipes.length} Rezepte` : ''}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isOwn ? (
                                <span className="text-[11px] font-medium text-[#C5DC57] bg-[#C5DC57]/15 px-2.5 py-0.5 rounded-full border border-[#C5DC57]/30 shrink-0">
                                  Von dir
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-neutral-300 bg-white/10 px-2.5 py-0.5 rounded-full shrink-0">
                                  Community
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound('click', settings.enableSoundEffects ?? true);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setItemMenuTarget({
                                item: item,
                                rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }
                              });
                            }}
                            className="w-12 h-12 rounded-full bg-[#242426] hover:bg-[#2c2c2e] active:scale-95 border border-white/5 flex items-center justify-center text-[#8e8e93] hover:text-white transition-all cursor-pointer shrink-0 shadow-sm"
                            title="Optionen"
                          >
                            <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-PUNKTE ACTION POPUP FÜR PROJEKTE & KOCHBÜCHER */}
      <AnimatePresence>
        {itemMenuTarget && itemMenuTarget.rect && (
          <div 
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[1px] select-none"
            onClick={() => setItemMenuTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -4 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[85] w-52 sm:w-56 bg-[#1c1c1e] border border-white/15 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-sm select-none flex flex-col gap-0.5"
              style={getItemActionMenuStyle()}
            >
              {/* 1. Öffnen */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setSelectedProject(itemMenuTarget.item);
                  setActivePopup(null);
                  setItemMenuTarget(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                <span className="text-[14px]">Öffnen</span>
              </button>

              {/* 2. In Community teilen / Aus Community entfernen (wenn eigenes Projekt) */}
              {projects.some(p => p.id === itemMenuTarget.item.id) || itemMenuTarget.item.createdBy === auth.currentUser?.uid ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleTogglePublishProject(itemMenuTarget.item);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors text-left font-normal cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-neutral-300 stroke-[1.8] shrink-0" />
                    <span className="text-[14px]">
                      {itemMenuTarget.item.isPublished ? 'Aus Community entfernen' : 'In Community teilen'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProject(itemMenuTarget.item.id);
                      setItemMenuTarget(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left font-normal cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.8] shrink-0" />
                    <span className="text-[14px]">Löschen</span>
                  </button>
                </>
              ) : (
                /* Fremdes Community-Projekt: In eigene Projekte kopieren */
                <button
                  type="button"
                  onClick={() => {
                    handleCopyCommunityProject(itemMenuTarget.item);
                    setItemMenuTarget(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-lime-400 hover:bg-lime-400/10 transition-colors text-left font-normal cursor-pointer"
                >
                  <Copy className="w-4 h-4 stroke-[1.8] shrink-0" />
                  <span className="text-[14px]">Als Kopie übernehmen</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW 2: PROJECT DETAIL VIEW OR COOKBOOK VIEW */}
      {selectedProject && !isCreatingProject && (
        <motion.div
          key={`project-detail-${selectedProject.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="w-full h-full flex flex-col"
        >
          {selectedProject.type === 'cookbook' || selectedProject.type === 'planner' ? (
          <CookbookView
            project={selectedProject}
            initialCategory={selectedProject.type === 'planner' ? 'Planer' : undefined}
            onUpdateProject={(updated) => {
              setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              setSelectedProject(updated);
              syncProjectDoc(updated);
            }}
            onBackToProjects={() => setSelectedProject(null)}
            onToggleSidebar={onToggleSidebar}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            isMobile={isMobile}
            soundEnabled={settings.enableSoundEffects ?? true}
          />
        ) : (
        <div className="flex flex-col w-full h-full relative select-none">
          {/* Top Header: Links Seitenleiste & Pfeil, Mitte Name, Rechts Fragezeichen */}
          <header className="sticky top-0 z-30 bg-transparent pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0">
            {/* Links: Seitenleistenknopf & Pfeilknopf */}
            <div className="flex items-center gap-2">
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

              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setSelectedProject(null);
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 flex items-center justify-center text-white transition-all cursor-pointer shadow-md active:scale-95"
                title="Zurück zu Projekten"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* In der Mitte: Name des Projektes (z.B. "Projekt 1") */}
            <div className="flex-1 min-w-0 px-2 text-center">
              <h1 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight truncate">
                {selectedProject.name}
              </h1>
            </div>

            {/* Rechts: Fragezeichenknopf */}
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

          {/* Community Banner wenn Projekt veröffentlicht oder aus Community geladen */}
          {selectedProject.isPublished && (
            <div className="max-w-xl mx-auto w-full px-4 sm:px-6 mb-2">
              <div className="w-full px-4 py-2.5 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="text-neutral-300 truncate">
                    {selectedProject.createdBy === auth.currentUser?.uid || selectedProject.createdByName === (settings.userNickname || 'Du') ? (
                      <span>Von dir in der Community veröffentlicht</span>
                    ) : (
                      <span>Community-Projekt von <strong className="text-white">{selectedProject.createdByName || 'Community'}</strong></span>
                    )}
                  </span>
                </div>
                {selectedProject.createdBy !== auth.currentUser?.uid && selectedProject.createdByName !== (settings.userNickname || 'Du') ? (
                  <button
                    type="button"
                    onClick={() => handleCopyCommunityProject(selectedProject)}
                    className="px-3 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all text-xs shrink-0 cursor-pointer shadow active:scale-95 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopieren</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTogglePublishProject(selectedProject)}
                    className="px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-all text-xs shrink-0 cursor-pointer active:scale-95"
                  >
                    Aus Community entfernen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat & Quellen Tabs direkt unter dem Namen des Projekts (mit verschiebbarem Spring-Pill-Indikator) */}
          <div className="flex items-center justify-center gap-2.5 max-w-xl mx-auto w-full px-4 sm:px-6 pt-2 pb-4 shrink-0">
            {(['chats', 'sources'] as const).map((tab) => {
              const isActive = projectDetailTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setProjectDetailTab(tab);
                  }}
                  className={`relative flex-1 py-2.5 sm:py-3 rounded-full font-semibold text-[15px] transition-colors cursor-pointer text-center z-10 ${
                    isActive ? 'text-black' : 'text-neutral-300 hover:text-white bg-[#242426] hover:bg-[#2c2c2e]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="projectsDetailActiveTab"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span>{tab === 'chats' ? 'Chats' : 'Quellen'}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: CHATS IN PROJECT */}
          {projectDetailTab === 'chats' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden max-w-xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-2.5 no-scrollbar pb-4">
                {projectChats.length === 0 ? (
                  <div className="py-14 sm:py-16 flex flex-col items-center justify-center text-center relative px-4">
                    {/* Soft Lime Glow in Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#C5DC57]/20 rounded-full blur-3xl pointer-events-none -z-10" />

                    {/* Dandelious Logo above the Project Title */}
                    <div className="relative group mb-4">
                      <div className="absolute inset-0 rounded-3xl bg-[#C5DC57]/35 blur-2xl group-hover:bg-[#C5DC57]/50 transition-all pointer-events-none" />
                      <DandeliousLogo className="w-16 h-16 sm:w-20 sm:h-20 shadow-2xl relative z-10" variant="badge" />
                    </div>

                    <h2 className="text-[22px] sm:text-[26px] font-semibold text-white/95 tracking-tight leading-snug">
                      {selectedProject.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xs">
                      Tippe unten auf „Chat erstellen“, um eine Unterhaltung mit Kontext aus diesem Projekt zu starten.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }}
                    className="space-y-2.5 w-full"
                  >
                    {projectChats.map((chat, chIdx) => (
                      <motion.div
                        key={`proj-chat-${chat.id || chIdx}-${chIdx}`}
                        variants={{
                          hidden: { opacity: 0, y: 12, scale: 0.98 },
                          visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } }
                        }}
                        whileHover={{ scale: 1.015, x: 3, backgroundColor: '#2c2c2e' }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          playSound('click', settings.enableSoundEffects ?? true);
                          onOpenProjectChat(chat, selectedProject);
                        }}
                        className="bg-[#242426] rounded-full px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer group shadow-sm w-full"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                          <MessageSquare className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                          <span className="text-[15px] font-normal text-white truncate">{chat.title}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Unten: Chat erstellen Button */}
              <div className="p-4 sm:px-6 pb-8 shrink-0 w-full">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    handleStartChatInProject('');
                  }}
                  className="w-full py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-black stroke-[2.5]" />
                  <span>Chat erstellen</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SOURCES IN PROJECT */}
          {projectDetailTab === 'sources' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden max-w-xl mx-auto w-full">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-2.5 no-scrollbar pb-4">
                {!selectedProject.sources || selectedProject.sources.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <Folder className="w-10 h-10 text-neutral-600 mb-3 stroke-[1.5]" />
                    <p className="text-sm font-medium text-white">Noch keine Quellen</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Tippe unten auf „Quelle hinzufügen“, um Dateien, Notizen oder Chats hinzuzufügen.
                    </p>
                  </div>
                ) : (
                  selectedProject.sources.map((source, sIdx) => (
                    <div
                      key={`proj-src-${source.id || sIdx}-${sIdx}`}
                      className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full"
                    >
                      <div
                        onClick={() => setViewingSource(source)}
                        className="flex items-center gap-3.5 min-w-0 mr-2 flex-1 cursor-pointer"
                      >
                        {source.type === 'note' ? (
                          <FileText className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                        ) : source.type === 'chat' ? (
                          <MessageSquare className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                        ) : (
                          <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                        )}
                        <span className="text-[15px] font-normal text-white truncate">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingSource(source)}
                          className="p-1.5 text-[#8e8e93] hover:text-white transition-colors cursor-pointer"
                          title="Vorschau"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSource(source.id)}
                          className="p-1.5 text-[#8e8e93] hover:text-red-400 transition-colors cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Unten: Quelle hinzufügen Button */}
              <div className="p-4 sm:px-6 pb-8 shrink-0 w-full">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    checkAndShowSourceTutorial();
                    setIsPlusDrawerOpen(true);
                  }}
                  className="w-full py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[15px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-black stroke-[2.5]" />
                  <span>Quelle hinzufügen</span>
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </motion.div>
      )}
      </AnimatePresence>

      {/* VIEW 3: NEW / EDIT PROJECT & COOKBOOK SCREEN */}
      <AnimatePresence>
        {isCreatingProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex flex-col justify-between text-white select-none"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 z-10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setIsCreatingProject(false);
                  setIsEditingProject(false);
                  setTutorialStep(null);
                }}
                className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h2 className="text-[18px] sm:text-[19px] font-semibold text-white tracking-tight">
                {isEditingProject 
                  ? 'Projekt bearbeiten' 
                  : creationType === 'cookbook' 
                    ? 'Neues Kochbuch' 
                    : 'Neues Projekt'
                }
              </h2>
              
              <div className="w-16 flex justify-end">
                {tutorialStep !== null ? (
                  <button
                    type="button"
                    onClick={handleCloseTutorial}
                    className="text-[11px] text-[#8e8e93] hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Tutorial beenden"
                  >
                    Überspringen
                  </button>
                ) : (
                  <div className="w-10" />
                )}
              </div>
            </div>

            {/* Black Tutorial Banner with Plain Text */}
            {tutorialStep !== null && (
              <div className="px-4 sm:px-6 max-w-lg mx-auto w-full pt-2 shrink-0 z-20">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-black border border-white/15 shadow-2xl text-center">
                  <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                    {tutorialStep === 1 && 'Wähle ein Icon aus.'}
                    {tutorialStep === 2 && `Gebe „${creationType === 'cookbook' ? 'Kochbuch 1' : 'Projekt 1'}“ als Namen ein.`}
                    {tutorialStep === 3 && 'Wische das Textfeld nach rechts.'}
                  </p>
                </div>
              </div>
            )}

            {/* Main Center Area with Swipe-to-Open Light-Grey Rounded Pill */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-lg mx-auto w-full z-10 -mt-10">
              <div className="w-full space-y-4">
                {/* Swipeable Light-Grey Rounded Pill Field */}
                <div className="relative w-full">
                  <motion.div
                    drag={tutorialStep === null || tutorialStep === 3 ? "x" : false}
                    dragConstraints={{ left: 0, right: 240 }}
                    dragElastic={0.25}
                    dragSnapToOrigin={!isOpeningAnimation}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x > 35 || info.velocity.x > 80) {
                        handleConfirmCreateAndOpen();
                      }
                    }}
                    animate={isOpeningAnimation ? { x: 380, opacity: 0, scale: 1.08 } : {}}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`w-full rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white shadow-2xl flex items-center px-3.5 py-3 sm:py-3.5 relative select-none touch-none transition-all ${
                      tutorialStep === null || tutorialStep === 3 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    } ${
                      tutorialStep === 3
                        ? 'border-[#C5DC57]/70 shadow-[0_0_30px_rgba(197,220,87,0.25)]'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Icon Button (Left side inside pill) */}
                    <button
                      type="button"
                      disabled={tutorialStep === 2 || tutorialStep === 3}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsIconPickerOpen(!isIconPickerOpen);
                        if (tutorialStep === 1) {
                          setTutorialStep(2);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-all active:scale-95 cursor-pointer mr-2.5 ${
                        tutorialStep === 1
                          ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/60 shadow-[0_0_20px_rgba(197,220,87,0.8)] animate-pulse'
                          : 'bg-white/10 hover:bg-white/15 border border-white/10 text-neutral-200 hover:text-white'
                      }`}
                      title="Icon ändern"
                    >
                      {renderVectorIcon(projectIconKey, `w-5 h-5 stroke-[1.8] ${tutorialStep === 1 ? 'text-black' : 'text-neutral-200'}`)}
                    </button>

                    {/* Text Field Input */}
                    <input
                      type="text"
                      disabled={tutorialStep === 1 || tutorialStep === 3}
                      value={projectNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjectNameInput(val);
                        if (tutorialStep === 2) {
                          const targetName = creationType === 'cookbook' ? 'kochbuch 1' : 'projekt 1';
                          if (val.trim().toLowerCase() === targetName) {
                            playSound('pop', settings.enableSoundEffects ?? true);
                            setTutorialStep(3);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tutorialStep === 2) {
                            const targetName = creationType === 'cookbook' ? 'kochbuch 1' : 'projekt 1';
                            if (projectNameInput.trim().toLowerCase() === targetName) {
                              playSound('pop', settings.enableSoundEffects ?? true);
                              setTutorialStep(3);
                            }
                          } else if (tutorialStep === 3 || tutorialStep === null) {
                            handleConfirmCreateAndOpen();
                          }
                        }
                      }}
                      placeholder={creationType === 'cookbook' ? "Name des Kochbuchs eingeben..." : "Name des Projekts eingeben..."}
                      autoFocus
                      className={`flex-1 bg-transparent text-white placeholder:text-[#8e8e93] font-medium text-[15px] sm:text-[16px] outline-none min-w-0 ${
                        tutorialStep === 2 ? 'border-b border-[#C5DC57]/80 pb-0.5' : ''
                      }`}
                    />

                    {/* Swipe indicator chevron on right */}
                    <div 
                      onClick={() => {
                        if (tutorialStep === null || tutorialStep === 3) {
                          handleConfirmCreateAndOpen();
                        }
                      }}
                      className={`flex items-center gap-1 shrink-0 select-none pl-2 pr-1 transition-colors ${
                        tutorialStep === null || tutorialStep === 3 ? 'cursor-pointer hover:text-white text-[#8e8e93]' : 'cursor-default text-neutral-600'
                      }`}
                      title="Nach rechts wischen zum Öffnen"
                    >
                      <ChevronRight className={`w-5 h-5 animate-pulse stroke-[2.5] ${tutorialStep === 3 ? 'text-[#C5DC57]' : 'text-[#8e8e93]'}`} />
                    </div>

                    {/* Animated visual slide indicator for Step 3 without emojis */}
                    {tutorialStep === 3 && (
                      <motion.div
                        animate={{
                          x: [0, 150, 150, 0],
                          opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          times: [0, 0.55, 0.8, 1],
                          ease: "easeInOut"
                        }}
                        className="absolute top-1/2 -translate-y-1/2 left-14 z-30 pointer-events-none flex items-center gap-1.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#C5DC57] text-black flex items-center justify-center shadow-[0_0_20px_rgba(197,220,87,0.9)]">
                          <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div className="h-1.5 w-14 bg-gradient-to-r from-[#C5DC57] via-[#C5DC57]/60 to-transparent rounded-full" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Icon Picker Popover */}
                  {isIconPickerOpen && (
                    <div className="absolute left-0 right-0 top-16 p-3.5 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/15 grid grid-cols-6 gap-2 z-40 shadow-2xl">
                      {ICON_PICKER_OPTIONS.map((opt) => {
                        const IconComp = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectIconKey(opt.key);
                              setIsIconPickerOpen(false);
                              if (tutorialStep === 1) {
                                setTutorialStep(2);
                              }
                            }}
                            className={`p-2.5 rounded-xl flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                              projectIconKey === opt.key ? 'bg-white/25 text-white' : 'hover:bg-white/10 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                            <span className="text-[10px] truncate max-w-[45px]">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom area - NO BUTTON! */}
            <div className="h-6 w-full shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* OPENING ANIMATION OVERLAY */}
      <AnimatePresence>
        {isOpeningAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1.6], opacity: [0.6, 1, 0] }}
              transition={{ duration: 0.4 }}
              className="w-24 h-24 rounded-full bg-white/20 blur-xl"
            />
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl">
                {renderVectorIcon(projectIconKey, "w-8 h-8 text-white")}
              </div>
              <p className="text-base font-semibold tracking-tight">
                {projectNameInput.trim() || (creationType === 'cookbook' ? 'Kochbuch' : 'Projekt')} wird geöffnet...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL FÜR QUELLE HINZUFÜGEN */}
      <AnimatePresence>
        {isPlusDrawerOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setIsPlusDrawerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-[#000000] border border-white/10 sm:rounded-[32px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Schließen Button */}
              <button
                type="button"
                onClick={() => {
                  playSound('click', settings.enableSoundEffects ?? true);
                  setIsPlusDrawerOpen(false);
                }}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-md transition-all active:scale-95"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <Plus className="w-5 h-5 text-white stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Quelle hinzufügen
                    </h3>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Wähle aus, was du zum Projekt hinzufügen möchtest
                    </p>
                  </div>
                </div>
              </div>

              {/* Black Tutorial Banner for First Source Addition */}
              {sourceTutorialStep !== null && (
                <div className="px-6 pt-3 shrink-0 z-20">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-black border border-white/15 shadow-2xl text-center">
                    <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                      {sourceTutorialStep === 1 && 'Tippe auf Notizen, um eine Notiz als Quelle anzulegen.'}
                      {sourceTutorialStep === 2 && 'Gib den Titel „Notiz 1“ ein.'}
                      {sourceTutorialStep === 3 && 'Tippe auf Quelle speichern.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Items List (Projekte, Kochbuch, Chats, Notizen, Videos, Bilder, Deep Research, Dokumente) */}
              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-2.5 flex-1 max-h-[60vh]">
                {/* 1. Projekte */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    setIsProjectSourcePickerOpen(true);
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <Folder className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Projekte</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* 2. Kochbuch */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    setIsCookbookSourcePickerOpen(true);
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <ChefHat className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Kochbuch</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* 3. Chats */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    setIsChatPickerOpen(true);
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <MessageSquare className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Chats</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* 4. Notizen */}
                <div
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    setIsAddNoteModalOpen(true);
                    if (sourceTutorialStep === 1) {
                      setSourceTutorialStep(2);
                    }
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep === 1
                      ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.9)] animate-pulse'
                      : 'bg-[#242426] hover:bg-[#2c2c2e]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <Edit3 className={`w-5 h-5 stroke-[1.8] shrink-0 ${sourceTutorialStep === 1 ? 'text-black' : 'text-neutral-300 group-hover:text-white'}`} />
                    <span className={`text-[15px] font-normal truncate ${sourceTutorialStep === 1 ? 'text-black font-semibold' : 'text-white'}`}>Notizen</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 stroke-[2] shrink-0 ${sourceTutorialStep === 1 ? 'text-black' : 'text-[#8e8e93] group-hover:text-white'}`} />
                </div>

                {/* 5. Code */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    handleSelectMediathekCategory('code');
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <Code2 className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Code</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* 7. Deep Research */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    handleSelectMediathekCategory('deep_research');
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <Sparkles className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Deep Research</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>

                {/* 8. Dokumente */}
                <div
                  onClick={() => {
                    if (sourceTutorialStep !== null) return;
                    playSound('click', settings.enableSoundEffects ?? true);
                    setIsPlusDrawerOpen(false);
                    handleSelectMediathekCategory('document');
                  }}
                  className={`rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm active:scale-[0.99] w-full ${
                    sourceTutorialStep !== null
                      ? 'bg-[#242426] opacity-25 pointer-events-none'
                      : 'bg-[#242426] hover:bg-[#2c2c2e] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 mr-2">
                    <FileText className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[15px] font-normal text-white truncate">Dokumente</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROJECT SOURCE PICKER MODAL */}
      <AnimatePresence>
        {isProjectSourcePickerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setIsProjectSourcePickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-[#000000] border border-white/10 sm:rounded-[32px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsProjectSourcePickerOpen(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-md"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <Folder className="w-5 h-5 text-white stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Projekt als Quelle hinzufügen
                    </h3>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Wähle ein anderes Projekt als Wissenskontext
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-2.5 flex-1 max-h-[60vh]">
                {regularProjects.filter(p => p.id !== selectedProject?.id).length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Folder className="w-10 h-10 text-neutral-600 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium text-white">Keine weiteren Projekte verfügbar</p>
                  </div>
                ) : (
                  regularProjects.filter(p => p.id !== selectedProject?.id).map((p, pIdx) => (
                    <div
                      key={`proj-src-picker-${p.id || pIdx}-${pIdx}`}
                      onClick={() => handleAddProjectSource(p)}
                      className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99] w-full"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                        {renderVectorIcon(p.icon || 'folder', "w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0")}
                        <span className="text-[15px] font-normal text-white truncate">{p.name}</span>
                      </div>
                      <Plus className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COOKBOOK SOURCE PICKER MODAL */}
      <AnimatePresence>
        {isCookbookSourcePickerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setIsCookbookSourcePickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-[#000000] border border-white/10 sm:rounded-[32px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsCookbookSourcePickerOpen(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer border border-white/10 shadow-md"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>

              <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <ChefHat className="w-5 h-5 text-white stroke-[1.8]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Kochbuch als Quelle hinzufügen
                    </h3>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Wähle ein Kochbuch als Kontext aus
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-2.5 flex-1 max-h-[60vh]">
                {cookbookProjects.filter(cb => cb.id !== selectedProject?.id).length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <ChefHat className="w-10 h-10 text-neutral-600 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium text-white">Keine Kochbücher verfügbar</p>
                  </div>
                ) : (
                  cookbookProjects.filter(cb => cb.id !== selectedProject?.id).map((cb, cbIdx) => (
                    <div
                      key={`cb-src-picker-${cb.id || cbIdx}-${cbIdx}`}
                      onClick={() => handleAddCookbookSource(cb)}
                      className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-5 py-3.5 flex items-center justify-between transition-all cursor-pointer group shadow-sm active:scale-[0.99] w-full"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                        <ChefHat className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                        <span className="text-[15px] font-normal text-white truncate">{cb.name}</span>
                      </div>
                      <Plus className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white transition-colors shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROJECT SETTINGS & INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  Projekt-Anweisungen für Dandelious
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Lege fest, wie Dandelious bei diesem Projekt vorgehen soll. Diese Anweisungen gelten für alle Chats in diesem Projekt.
              </p>

              <textarea
                value={projectInstructionsInput}
                onChange={(e) => setProjectInstructionsInput(e.target.value)}
                placeholder="z. B. Beantworte alle Fragen im akademischen Stil, beziehe Formeln ein und formatiere Quellcode präzise."
                rows={5}
                className="w-full rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 border border-white/10 p-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500/50 resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                >
                  Fertig
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD NOTE / DIRECT TEXT SOURCE MODAL */}
      <AnimatePresence>
        {isAddNoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-lg rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  Notiz oder Richtlinie als Quelle hinzufügen
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Tutorial Step Banner */}
              {sourceTutorialStep !== null && (
                <div className="p-3.5 rounded-2xl bg-black border border-white/15 shadow-2xl text-center">
                  <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                    Gib einen Titel und Notiztext ein und tippe auf „Notiz speichern“.
                  </p>
                </div>
              )}

              <input
                type="text"
                disabled={sourceTutorialStep === 3}
                value={newNoteTitle}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewNoteTitle(val);
                  if (sourceTutorialStep === 2 && val.trim().length > 0) {
                    setNewNoteContent('Beispiel-Notiz für Dandelious Kontext.');
                    setSourceTutorialStep(3);
                  }
                }}
                placeholder="Titel der Notiz (z. B. Notiz 1)"
                autoFocus
                className={`w-full rounded-2xl bg-white/15 backdrop-blur-2xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  sourceTutorialStep === 2
                    ? 'border-2 border-[#C5DC57] ring-4 ring-[#C5DC57]/50 shadow-[0_0_20px_rgba(197,220,87,0.5)]'
                    : 'border border-white/20'
                }`}
              />

              <textarea
                value={newNoteContent}
                disabled={sourceTutorialStep === 2 || sourceTutorialStep === 3}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Inhalt oder Richtlinien eingeben..."
                rows={6}
                className={`w-full rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 p-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none transition-colors ${
                  sourceTutorialStep !== null ? 'opacity-50 pointer-events-none' : ''
                }`}
              />

              <div className="flex justify-end gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsAddNoteModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-neutral-400 hover:text-white cursor-pointer transition-colors"
                >
                  Abbrechen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={!newNoteTitle.trim() || sourceTutorialStep === 2}
                  onClick={() => {
                    handleSaveNoteSource();
                    if (sourceTutorialStep !== null) {
                      handleCloseSourceTutorial();
                    }
                  }}
                  className={`px-5 py-2 rounded-full font-semibold text-xs cursor-pointer transition-all shadow-lg ${
                    sourceTutorialStep === 3
                      ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.9)] animate-pulse'
                      : 'bg-white text-black hover:bg-neutral-200 disabled:opacity-40'
                  }`}
                >
                  Quelle speichern
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT PICKER MODAL (Minimalist Monochrome) */}
      <AnimatePresence>
        {isChatPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-lg rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Chat als Quelle hinzufügen</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Wähle eine bestehende Unterhaltung als Kontext für dieses Projekt.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsChatPickerOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Tutorial Step Banner */}
              {sourceTutorialStep !== null && (
                <div className="p-3.5 rounded-2xl bg-black border border-white/15 shadow-2xl text-center">
                  <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                    Wähle einen Chat aus, um ihn als Kontext für dieses Projekt zu hinterlegen.
                  </p>
                </div>
              )}

              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={chatPickerSearch}
                  onChange={(e) => setChatPickerSearch(e.target.value)}
                  placeholder="Chats durchsuchen..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-2xl border border-white/20 border border-white/5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar min-h-[220px]">
                {availableChatSessions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    Keine passenden Chats gefunden.
                  </div>
                ) : (
                  availableChatSessions.map((session, sIdx) => (
                    <motion.div
                      key={`chat-picker-${session.id || sIdx}-${sIdx}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleAddChatSource(session)}
                      className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 hover:bg-white/25 border border-white/5 hover:border-white/15 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/10 shrink-0 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-white line-clamp-1 group-hover:text-neutral-200 transition-colors">
                            {session.title || 'Unterhaltung'}
                          </h4>
                          <span className="text-[10px] text-neutral-400">
                            {session.messages.length} Nachrichten • {new Date(session.updatedAt || session.createdAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full bg-white/[0.08] group-hover:bg-white text-neutral-300 group-hover:text-black font-medium text-[11px] transition-all ml-2 shrink-0"
                      >
                        Hinzufügen
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEDIATHEK STEP 1: CATEGORY PICKER MODAL (Minimalist Monochrome) */}
      <AnimatePresence>
        {isMediathekCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-lg rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white">Mediathek auswählen</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Wähle den Typ aus, den du als Kontext zu diesem Projekt hinzufügen möchtest.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setIsMediathekCategoryModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Tutorial Step Banner */}
              {sourceTutorialStep !== null && (
                <div className="p-3.5 rounded-2xl bg-black border border-white/15 shadow-2xl text-center">
                  <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                    Wähle einen Mediathek-Bereich, um Inhalte zu deinem Projekt hinzuzufügen.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {/* Option 1: Deep Research */}
                <motion.div
                  whileHover={{ scale: 1.015, x: 2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectMediathekCategory('deep_research')}
                  className="p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 hover:bg-white/25 border border-white/5 hover:border-white/20 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/10 shrink-0 transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Researches</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 font-mono border border-white/5">
                          {researchItems.length}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Deep-Research-Berichte, Analysen & Studien
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>

                {/* Option 2: Dokumente */}
                <motion.div
                  whileHover={{ scale: 1.015, x: 2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectMediathekCategory('document')}
                  className="p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 hover:bg-white/25 border border-white/5 hover:border-white/20 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/10 shrink-0 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Dokumente</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 font-mono border border-white/5">
                          {documentItems.length}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Textdokumente, Notizen, PDFs und Code-Artefakte
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>

                {/* Option 3: Code */}
                <motion.div
                  whileHover={{ scale: 1.015, x: 2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectMediathekCategory('code')}
                  className="p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 hover:bg-white/25 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/10 shrink-0 transition-colors">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">Code</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-neutral-300 font-mono border border-white/5">
                          {codeItems.length}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Code-Dateien, Skripte, Algorithmen & Software-Artefakte
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEDIATHEK STEP 2: SPECIFIC ITEM PICKER MODAL (Minimalist Monochrome) */}
      <AnimatePresence>
        {isMediathekItemModalOpen && selectedMediathekCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-xl rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
            >
              {/* Header with Back button */}
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={handleBackToMediathekCategories}
                    className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    title="Zurück zu Kategorien"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {selectedMediathekCategory === 'deep_research'
                        ? 'Research auswählen'
                        : selectedMediathekCategory === 'document'
                        ? 'Dokument auswählen'
                        : 'Code auswählen'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {selectedMediathekCategory === 'deep_research'
                        ? 'Wähle einen Deep-Research-Bericht aus deiner Mediathek'
                        : selectedMediathekCategory === 'document'
                        ? 'Wähle ein Dokument als Quelle'
                        : 'Wähle eine Code-Datei oder ein Skript als Quelle'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setIsMediathekCategoryModalOpen(false);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mediathekItemSearch}
                  onChange={(e) => setMediathekItemSearch(e.target.value)}
                  placeholder={
                    selectedMediathekCategory === 'deep_research'
                      ? 'Researches durchsuchen...'
                      : selectedMediathekCategory === 'document'
                      ? 'Dokumente durchsuchen...'
                      : 'Code durchsuchen...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-2xl border border-white/20 border border-white/5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>

              {/* Items display */}
              <div className="flex-1 overflow-y-auto no-scrollbar min-h-[260px]">
                {filteredCategoryItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 mb-3">
                      {selectedMediathekCategory === 'deep_research' ? (
                        <Sparkles className="w-6 h-6" />
                      ) : selectedMediathekCategory === 'document' ? (
                        <FileText className="w-6 h-6" />
                      ) : (
                        <Code2 className="w-6 h-6" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-white mb-1">
                      {selectedMediathekCategory === 'deep_research'
                        ? 'Keine Deep-Research-Berichte gefunden'
                        : selectedMediathekCategory === 'document'
                        ? 'Keine Dokumente gefunden'
                        : 'Keine Code-Dateien gefunden'}
                    </p>
                    <p className="text-xs text-neutral-500 max-w-xs">
                      {selectedMediathekCategory === 'deep_research'
                        ? 'Führe im Chat einen Deep Research durch, um Dossiers hier zu hinterlegen.'
                        : selectedMediathekCategory === 'document'
                        ? 'Erstelle Dokumente in deinen Chats, um sie hier auszuwählen.'
                        : 'Generiere oder speichere Code-Snippets, um sie hier auszuwählen.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredCategoryItems.map((item, itmIdx) => (
                      <motion.div
                        key={`catitem-doc-${item.id || itmIdx}-${itmIdx}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAddMediathekSource(item)}
                        className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 hover:bg-white/25 cursor-pointer flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:bg-white/10 shrink-0 transition-colors">
                            {selectedMediathekCategory === 'deep_research' ? (
                              <Sparkles className="w-5 h-5" />
                            ) : selectedMediathekCategory === 'document' ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <Code2 className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-neutral-200 transition-colors font-mono">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                              {item.description || item.content?.slice(0, 100) || 'Keine Vorschau'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                              <span>{new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
                              <span>•</span>
                              <span>
                                {item.content ? `${Math.round(item.content.length / 1000)}k Zeichen` : 'Datei'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-white/[0.08] group-hover:bg-white text-neutral-300 group-hover:text-black font-medium text-xs transition-all ml-3 shrink-0"
                        >
                          Auswählen
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOURCE VIEWER MODAL (Minimalist Monochrome) */}
      <AnimatePresence>
        {viewingSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-2xl rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/5 flex items-center justify-center text-neutral-300 shrink-0">
                    {viewingSource.type === 'note' ? (
                      <FileText className="w-4 h-4" />
                    ) : viewingSource.type === 'chat' || viewingSource.name.startsWith('Chat:') ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : viewingSource.name.startsWith('Research:') || viewingSource.name.toLowerCase().includes('research') ? (
                      <Sparkles className="w-4 h-4" />
                    ) : viewingSource.mimeType?.startsWith('image/') || viewingSource.content.startsWith('data:image') || viewingSource.content.startsWith('http') ? (
                      <FileImage className="w-4 h-4" />
                    ) : (
                      <FileCode className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-white truncate">
                    {viewingSource.name}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setViewingSource(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* RENDER CONTENT BASED ON SOURCE TYPE */}
              <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                {viewingSource.mimeType?.startsWith('image/') || viewingSource.content.startsWith('data:image') || viewingSource.content.startsWith('http') ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <img
                      src={viewingSource.content}
                      alt={viewingSource.name}
                      className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
                    />
                  </div>
                ) : viewingSource.type === 'chat' || viewingSource.name.startsWith('Chat:') ? (
                  <div className="space-y-3">
                    {viewingSource.content.split('\n\n---\n\n').map((block, idx) => {
                      const isUser = block.startsWith('[Nutzer]:') || block.startsWith('Nutzer:') || block.startsWith('User:');
                      const cleanText = block.replace(/^\[(Nutzer|Dandelious|User)\]:\n?/, '').replace(/^(Nutzer|Dandelious|User):\n?/, '');
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isUser
                              ? 'bg-white/15 ml-6 text-white border border-white/10'
                              : 'bg-white/5 mr-6 text-neutral-200 border border-white/5'
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                            {isUser ? 'Nutzer' : 'Dandelious'}
                          </span>
                          <p className="whitespace-pre-wrap">{cleanText}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-4 rounded-2xl border border-white/5">
                    {viewingSource.content}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <span className="text-xs text-neutral-500">
                  {viewingSource.size || `${(viewingSource.content.length / 1024).toFixed(1)} KB`}
                </span>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setViewingSource(null)}
                  className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer hover:bg-neutral-200 transition-colors shadow-lg"
                >
                  Schließen
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {isShareModalOpen && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">
                  Projekt teilen
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Jeder mit diesem Link kann deinem Projekt beitreten, die Quellen einsehen und gemeinsame Chats mit Dandelious führen.
              </p>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}?project=${selectedProject.id}`}
                  className="w-full bg-transparent text-xs text-neutral-300 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(
                        `${window.location.origin}?project=${selectedProject.id}`
                      );
                      showToast('Link in Zwischenablage kopiert');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 shrink-0 cursor-pointer"
                >
                  Kopieren
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP MODAL (Exakt im Stil der Mediathek mit Lexikon-Design und hervorgehobenem Text) */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md select-none"
            onClick={() => setIsHelpModalOpen(false)}
          >
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
              {/* Schließen Button oben links wie in der Mediathek */}
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
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
                    Projekte & Kochbücher
                  </h3>

                  {/* Text in weiß mit hervorgehobenen Wörtern im Stil des Lexikons */}
                  <div className="space-y-3.5 text-white text-[15px] sm:text-[16px] leading-relaxed font-normal">
                    <p className="text-white">
                      {renderHighlightedText('**Projekte** sind deine persönlichen, flexiblen Arbeitsbereiche. Hier organisierst du **Chats**, **Dateien**, **Notizen** und **Recherchen** übersichtlich an einem Ort. Alle hinterlegten Quellen dienen Dandelious als direkter Arbeitskontext für präzise Antworten.')}
                    </p>
                    <p className="text-white">
                      {renderHighlightedText('**Kochbücher** sind dein digitaler Rezept-Manager. Speichere deine Lieblingsrezepte, organisiere Zutaten und nutze den integrierten **KI-Küchenchef**, um aus vorhandenen Zutaten neue Gerichte und Menüs zu zaubern.')}
                    </p>
                    <p className="text-white">
                      {renderHighlightedText('Über die **Plus-Buttons (+)** neben den Einträgen erstellst du im Handumdrehen neue Bereiche: Wähle dein Wunsch-Icon, gib den Namen ein und **wische das Textfeld nach rechts**, um dein Projekt oder Kochbuch sofort zu öffnen.')}
                    </p>
                  </div>

                  {/* Tutorial Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHelpModalOpen(false);
                        handleOpenCreateProject();
                        setTutorialStep(1);
                      }}
                      className="w-full py-3.5 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 text-[#C5DC57]" />
                      <span>Schritt-für-Schritt Tutorial starten</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEEDBACK MODAL */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white/[0.04] backdrop-blur-[80px] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/10 shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-lime-400" />
                  Feedback zu Projekten
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    setFeedbackText('');
                  }}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                Wie können wir die Dandelious Projekte noch nützlicher für dich gestalten?
              </p>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Dein Feedback oder Ideen..."
                rows={4}
                className="w-full p-3.5 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 border border-white/10 text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-lime-500/50 resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    setFeedbackText('');
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 text-neutral-300 font-medium text-xs hover:bg-white/25 cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('send', settings.enableSoundEffects ?? true);
                    setIsFeedbackModalOpen(false);
                    setFeedbackText('');
                    showToast('Vielen Dank für dein Feedback!');
                  }}
                  className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 cursor-pointer"
                >
                  Senden
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
