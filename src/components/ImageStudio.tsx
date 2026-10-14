import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutGrid,
  PanelLeft,
  Plus,
  Trash2,
  Share,
  MoreHorizontal,
  X,
  ArrowUp,
  Camera,
  Image as ImageIcon,
  User,
  Check,
  Pencil,
  Sparkles,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  ChevronsUpDown,
  Download,
  Copy,
  Maximize2,
  Wifi,
  Battery,
  MessageSquare,
  FolderPlus,
  RotateCcw,
  Search,
  Mic,
  RotateCw,
  Compass
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';
import { ImageViewerModal } from './ImageViewerModal';
import { addMediathekItem } from '../utils/mediaLibrary';
import { NorthernLights } from './NorthernLights';

interface ImageStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenSettings?: (subPage?: string) => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

interface PlaygroundImage {
  id: string;
  title: string;
  url: string;
  prompt: string;
  modelUsed: string;
  aspectRatio: '1:1' | '9:16' | '16:9';
  style?: string;
  timestamp: number;
}

const STYLES = [
  { id: 'any', label: 'Beliebiger Stil' },
  { id: 'animation', label: 'Animation', suffix: ', 3D Pixar animation style, soft volumetric lighting, vibrant stylized render' },
  { id: 'illustration', label: 'Illustration', suffix: ', modern vector digital illustration, clean contours, refined editorial look' },
  { id: 'sketch', label: 'Skizze', suffix: ', pencil sketch, fine hatching, elegant graphite art on textured paper' },
  { id: 'photo', label: 'Fotorealistisch', suffix: ', 8k resolution, authentic photorealistic, natural lighting, 50mm f/1.4 lens' },
  { id: 'cinematic', label: 'Cinematic', suffix: ', cinematic still frame, 35mm film grain, anamorphic lens flare, dramatic studio lighting' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Quadrat', icon: Square, desc: '1:1' },
  { id: '9:16', label: 'Hochformat', icon: RectangleVertical, desc: '9:16' },
  { id: '16:9', label: 'Querformat', icon: RectangleHorizontal, desc: '16:9' }
] as const;

const SUGGESTIONS = [
  '„Waschbär hat gute Laune“ versuchen',
  '„Als Popstar“ versuchen',
  '„Ein Haus am Strand“ versuchen',
  '„Eine Grafikkarte“ versuchen',
  '„Cyberpunk-Katze mit Sonnenbrille“ versuchen',
  '„Schwebende Inseln im Sonnenuntergang“ versuchen'
];

// Helper to safely encode SVG data URIs
const makeSvgDataUri = (svgString: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;

// Beach house SVG that matches screenshot 5 ("Ein Haus am Strand")
const BEACH_HOUSE_SVG = makeSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#49b6ff"/>
      <stop offset="50%" stop-color="#70cbfd"/>
      <stop offset="100%" stop-color="#bae7ff"/>
    </linearGradient>
    <linearGradient id="seaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#006bb3"/>
      <stop offset="35%" stop-color="#009ddb"/>
      <stop offset="70%" stop-color="#00c8db"/>
      <stop offset="100%" stop-color="#55e2e8"/>
    </linearGradient>
    <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ecd9b6"/>
      <stop offset="40%" stop-color="#dfc59a"/>
      <stop offset="100%" stop-color="#cfb07e"/>
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dfaa52"/>
      <stop offset="50%" stop-color="#c68a35"/>
      <stop offset="100%" stop-color="#9f6720"/>
    </linearGradient>
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a47148"/>
      <stop offset="100%" stop-color="#7b4e2d"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="1024" height="1024" fill="url(#skyGrad)"/>
  
  <!-- Fluffy Cloud -->
  <path d="M 750,470 Q 770,430 820,440 Q 860,420 890,450 Q 940,460 930,500 Q 890,520 750,510 Z" fill="#ffffff" opacity="0.85" filter="url(#softGlow)"/>

  <!-- Ocean -->
  <rect y="480" width="1024" height="240" fill="url(#seaGrad)"/>
  <!-- Gentle Waves -->
  <path d="M 0,550 C 250,540 500,560 1024,545 L 1024,560 C 500,575 250,555 0,565 Z" fill="#ffffff" opacity="0.35"/>
  <path d="M 0,610 C 350,595 700,620 1024,605 L 1024,625 C 700,638 350,615 0,630 Z" fill="#ffffff" opacity="0.45"/>
  
  <!-- Shore Sand -->
  <path d="M 0,630 Q 512,680 1024,660 L 1024,1024 L 0,1024 Z" fill="url(#sandGrad)"/>
  <ellipse cx="800" cy="650" rx="30" ry="12" fill="#887355" opacity="0.7"/>
  <ellipse cx="730" cy="720" rx="16" ry="8" fill="#9c8462" opacity="0.6"/>

  <!-- Beach House (White Cottage with Thatched Roof) -->
  <!-- House Base & Walls -->
  <polygon points="420,530 630,410 740,480 540,650 420,630" fill="#eae8e5"/>
  <polygon points="420,530 540,650 540,780 420,740" fill="#f8f8f6"/>
  <polygon points="540,650 740,480 740,640 540,780" fill="#d8d5ce"/>

  <!-- Thatched Roof -->
  <polygon points="380,540 625,310 770,470 545,630" fill="url(#roofGrad)"/>
  <path d="M 370,540 C 420,565 520,640 545,640 C 590,570 730,490 775,475 L 755,460 L 625,305 Z" fill="#b0782a" opacity="0.8"/>
  <!-- Roof Texture strokes -->
  <path d="M 625,310 L 420,550 M 625,310 L 470,570 M 625,310 L 515,600 M 625,310 L 570,560 M 625,310 L 670,520 M 625,310 L 730,480" stroke="#875317" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
  <line x1="590" y1="310" x2="640" y2="340" stroke="#714210" stroke-width="12" stroke-linecap="round"/>
  <line x1="640" y1="310" x2="590" y2="340" stroke="#714210" stroke-width="12" stroke-linecap="round"/>

  <!-- Wooden Windows -->
  <rect x="445" y="555" width="40" height="50" rx="3" fill="#8c5830" stroke="#5d3517" stroke-width="4"/>
  <rect x="449" y="559" width="32" height="42" fill="#588ea8"/>
  <line x1="465" y1="559" x2="465" y2="601" stroke="#8c5830" stroke-width="3"/>
  <line x1="449" y1="580" x2="481" y2="580" stroke="#8c5830" stroke-width="3"/>

  <rect x="445" y="635" width="40" height="50" rx="3" fill="#8c5830" stroke="#5d3517" stroke-width="4"/>
  <rect x="449" y="639" width="32" height="42" fill="#497891"/>

  <rect x="570" y="540" width="36" height="46" rx="3" fill="#8c5830" stroke="#5d3517" stroke-width="4"/>
  <rect x="574" y="544" width="28" height="38" fill="#497891"/>

  <!-- Small Upper Window -->
  <rect x="575" y="440" width="24" height="32" rx="2" fill="#8c5830"/>
  <rect x="578" y="443" width="18" height="26" fill="#3a6478"/>

  <!-- Front Door -->
  <rect x="568" y="630" width="48" height="90" rx="4" fill="#321b0e"/>
  <polygon points="568,630 600,624 600,720 568,720" fill="#543118"/>
  <circle cx="580" cy="675" r="3" fill="#e5b460"/>
  <!-- Small Lantern above door -->
  <polygon points="585,600 595,600 598,612 582,612" fill="#ffdf70" filter="url(#softGlow)"/>
  <rect x="587" y="596" width="6" height="5" fill="#2d1c10"/>

  <!-- Wooden Deck & Veranda -->
  <polygon points="460,740 640,660 840,710 660,820" fill="url(#woodGrad)"/>
  <!-- Deck Planks -->
  <line x1="490" y1="755" x2="690" y2="805" stroke="#4a2e19" stroke-width="3"/>
  <line x1="520" y1="740" x2="720" y2="790" stroke="#4a2e19" stroke-width="3"/>
  <line x1="560" y1="720" x2="760" y2="770" stroke="#4a2e19" stroke-width="3"/>
  <line x1="600" y1="700" x2="800" y2="750" stroke="#4a2e19" stroke-width="3"/>
  <!-- Steps -->
  <polygon points="490,755 570,740 570,765 490,780" fill="#663e20"/>
  <polygon points="470,775 550,760 550,785 470,800" fill="#523017"/>

  <!-- Veranda Railing -->
  <line x1="640" y1="660" x2="835" y2="708" stroke="#5d3517" stroke-width="6"/>
  <line x1="680" y1="670" x2="680" y2="720" stroke="#71421d" stroke-width="6"/>
  <line x1="730" y1="685" x2="730" y2="735" stroke="#71421d" stroke-width="6"/>
  <line x1="780" y1="700" x2="780" y2="750" stroke="#71421d" stroke-width="6"/>
  <line x1="835" y1="710" x2="835" y2="760" stroke="#71421d" stroke-width="8"/>
  <line x1="835" y1="710" x2="660" y2="820" stroke="#5d3517" stroke-width="6"/>
  <line x1="775" y1="745" x2="775" y2="795" stroke="#71421d" stroke-width="6"/>
  <line x1="720" y1="780" x2="720" y2="830" stroke="#71421d" stroke-width="6"/>

  <!-- Palm Tree (Left side framing) -->
  <path d="M 470,360 Q 455,490 460,700" stroke="#8d5b2c" stroke-width="26" stroke-linecap="round" fill="none"/>
  <!-- Palm Fronds -->
  <path d="M 460,360 Q 520,290 600,320 Q 540,360 460,360 Z" fill="#2eb82e"/>
  <path d="M 460,360 Q 470,250 510,240 Q 480,310 460,360 Z" fill="#33cc33"/>
  <path d="M 460,360 Q 380,260 420,240 Q 430,300 460,360 Z" fill="#248f24"/>
  <path d="M 460,360 Q 370,320 350,380 Q 410,380 460,360 Z" fill="#1f7a1f"/>
  <path d="M 460,360 Q 440,390 420,440 Q 450,420 460,360 Z" fill="#2eb82e"/>

  <!-- Tropical Shrubs on Sand -->
  <path d="M 450,750 Q 480,720 500,750 Z" fill="#33cc33"/>
  <path d="M 810,750 Q 840,730 860,760 Z" fill="#2eb82e"/>
</svg>
`);

export const ImageStudio: React.FC<ImageStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar,
  onSendToChat
}) => {
  // Creations Gallery
  const [images, setImages] = useState<PlaygroundImage[]>(() => {
    try {
      const saved = localStorage.getItem('motionpicture_creations_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });

  // Save creations to localStorage
  useEffect(() => {
    try {
      if (images.length > 0) {
        localStorage.setItem('motionpicture_creations_v1', JSON.stringify(images.slice(0, 50)));
      }
    } catch (_) {}
  }, [images]);

  // View state
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(true);
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

  // Creation Card State
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('any');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);

  // Popover menus
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState<boolean>(false);
  const [isAspectMenuOpen, setIsAspectMenuOpen] = useState<boolean>(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState<boolean>(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  // Generating State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingPrompt, setGeneratingPrompt] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(15);
  const [revealedImageUrl, setRevealedImageUrl] = useState<string | null>(null);

  // Refine input
  const [refinePrompt, setRefinePrompt] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>('');

  // Modals & Feedback
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Input Ref for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const activeImage = images.find((img) => img.id === activeImageId);

  // Rotate suggestion placeholder periodically when prompt is empty
  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Close menus on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.playground-popover') && !target.closest('.playground-trigger')) {
        setIsStyleMenuOpen(false);
        setIsAspectMenuOpen(false);
        setIsPhotoMenuOpen(false);
        setIsShareMenuOpen(false);
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  // Start new creation
  const handleOpenNewCard = () => {
    playSound('pop', settings.enableSoundEffects);
    setIsCreatingNew(true);
    setIsGridView(false);
    setPrompt('');
    setTimeout(() => {
      promptInputRef.current?.focus();
    }, 100);
  };

  // Select an existing image
  const handleSelectImage = (id: string) => {
    playSound('click', settings.enableSoundEffects);
    setActiveImageId(id);
    setIsCreatingNew(false);
    setIsGridView(false);
  };

  // Delete current image
  const handleDeleteActiveImage = () => {
    if (!activeImage) return;
    playSound('click', settings.enableSoundEffects);
    const remaining = images.filter((img) => img.id !== activeImage.id);
    setImages(remaining);
    if (remaining.length > 0) {
      setActiveImageId(remaining[0].id);
    } else {
      setActiveImageId(null);
      setIsCreatingNew(false);
    }
    showToast('Bild gelöscht');
  };

  // Generate Image Handler
  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = (customPrompt || prompt).trim();
    if (!targetPrompt || isGenerating) return;

    playSound('click', settings.enableSoundEffects);
    setIsGenerating(true);
    setGeneratingPrompt(targetPrompt);
    setGenerationProgress(15);
    setRevealedImageUrl(null);

    const progressInterval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 93) return 93;
        const inc = p < 60 ? Math.floor(Math.random() * 8) + 6 : Math.floor(Math.random() * 5) + 3;
        return Math.min(93, p + inc);
      });
    }, 200);

    const styleObj = STYLES.find((s) => s.id === selectedStyle);
    const finalPrompt = selectedStyle !== 'any' && styleObj?.suffix
      ? `${targetPrompt}${styleObj.suffix}`
      : targetPrompt;

    let finalImageUrl = '';
    let finalModelUsed = 'Dandelious MotionPicture';

    try {
      // 1. Primary: Server-side generation (Gemini Image or high-speed Neural Synthesis)
      try {
        const res = await fetch('/api/image/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: finalPrompt,
            aspectRatio: aspectRatio,
            model: 'MotionPicture',
            customApiKey: settings.customApiKey
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.imageUrl) {
            finalImageUrl = data.imageUrl;
            finalModelUsed = data.modelUsed || 'Dandelious MotionPicture';
          }
        }
      } catch (err) {
        console.warn('Backend image generation fetch error:', err);
      }

      // 2. Direct client fallback if server didn't provide image
      if (!finalImageUrl) {
        const width = aspectRatio === '16:9' ? 1024 : aspectRatio === '9:16' ? 576 : 768;
        const height = aspectRatio === '16:9' ? 576 : aspectRatio === '9:16' ? 1024 : 768;
        const seed = Math.floor(Math.random() * 1000000);
        finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
        finalModelUsed = 'Dandelious Neural Diffusion';
      }

      // Preload image in browser memory so it reveals instantly without flicker
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = finalImageUrl;
        setTimeout(resolve, 2500);
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setRevealedImageUrl(finalImageUrl);

      // Brief delay to display 100% and cross-fade image
      await new Promise((r) => setTimeout(r, 450));

      const newImg: PlaygroundImage = {
        id: `img-${Date.now()}`,
        title: targetPrompt.length > 30 ? targetPrompt.slice(0, 30) + '…' : targetPrompt,
        url: finalImageUrl,
        prompt: targetPrompt,
        modelUsed: finalModelUsed,
        aspectRatio: aspectRatio,
        style: styleObj?.label,
        timestamp: Date.now()
      };

      setImages((prev) => [newImg, ...prev]);
      setActiveImageId(newImg.id);
      setIsCreatingNew(false);
      setPrompt('');
      setRefinePrompt('');

      // Add to Mediathek
      addMediathekItem({
        id: `playground_${Date.now()}`,
        type: 'image',
        title: newImg.title,
        createdAt: Date.now(),
        authorName: 'MotionPicture',
        url: newImg.url,
        tags: ['motionpicture', 'image', 'ai']
      });

      playSound('chime', settings.enableSoundEffects);
    } catch (err: any) {
      console.error('MotionPicture generation primary endpoint failed, attempting direct synthesis:', err);
      try {
        const width = aspectRatio === '16:9' ? 1024 : aspectRatio === '9:16' ? 576 : 768;
        const height = aspectRatio === '16:9' ? 576 : aspectRatio === '9:16' ? 1024 : 768;
        const seed = Math.floor(Math.random() * 1000000);
        const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

        clearInterval(progressInterval);
        setGenerationProgress(100);
        setRevealedImageUrl(directUrl);
        await new Promise((r) => setTimeout(r, 450));

        const fallbackImg: PlaygroundImage = {
          id: `img-${Date.now()}`,
          title: targetPrompt.length > 30 ? targetPrompt.slice(0, 30) + '…' : targetPrompt,
          url: directUrl,
          prompt: targetPrompt,
          modelUsed: 'MotionPicture',
          aspectRatio: aspectRatio,
          style: styleObj?.label,
          timestamp: Date.now()
        };

        setImages((prev) => [fallbackImg, ...prev]);
        setActiveImageId(fallbackImg.id);
        setIsCreatingNew(false);
        setPrompt('');
        setRefinePrompt('');

        addMediathekItem({
          id: `playground_${Date.now()}`,
          type: 'image',
          title: fallbackImg.title,
          createdAt: Date.now(),
          authorName: 'MotionPicture',
          url: fallbackImg.url,
          tags: ['motionpicture', 'image', 'ai']
        });

        playSound('chime', settings.enableSoundEffects);
      } catch (finalErr: any) {
        showToast('Fehler bei der Bildgenerierung: ' + (err?.message || 'Bitte erneut versuchen'));
        playSound('pop', settings.enableSoundEffects);
      }
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setRevealedImageUrl(null);
    }
  };

  // Edit / Refine current image using gemini-3.1-flash-image-preview
  const handleRefine = async () => {
    if (!refinePrompt.trim() || !activeImage || isGenerating) return;
    const editInstruction = refinePrompt.trim();

    playSound('click', settings.enableSoundEffects);
    setIsGenerating(true);
    setGeneratingPrompt(editInstruction);
    setGenerationProgress(20);
    setRevealedImageUrl(null);

    const progressInterval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 92) return 92;
        return p + 8;
      });
    }, 200);

    try {
      const editRes = await fetch('/api/image/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editInstruction,
          imageBase64: activeImage.url,
          aspectRatio: activeImage.aspectRatio,
          customApiKey: settings.customApiKey
        })
      });

      if (!editRes.ok) {
        throw new Error('Bearbeitungsfehler');
      }

      const data = await editRes.json();
      if (!data?.imageUrl) {
        throw new Error('Kein bearbeitetes Bild empfangen');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setRevealedImageUrl(data.imageUrl);
      await new Promise((r) => setTimeout(r, 400));

      const editedImg: PlaygroundImage = {
        id: `img-${Date.now()}`,
        title: editInstruction.length > 30 ? editInstruction.slice(0, 30) + '…' : editInstruction,
        url: data.imageUrl,
        prompt: `${activeImage.prompt} → ${editInstruction}`,
        modelUsed: data.modelUsed || 'gemini-3.1-flash-image-preview',
        aspectRatio: activeImage.aspectRatio,
        style: activeImage.style,
        timestamp: Date.now()
      };

      setImages((prev) => [editedImg, ...prev]);
      setActiveImageId(editedImg.id);
      setRefinePrompt('');
      showToast('Bild mit Gemini 3.1 Flash Image bearbeitet!');
      playSound('chime', settings.enableSoundEffects);
    } catch (err: any) {
      console.warn('Image edit fallback to generate:', err);
      // Fallback to combined generation
      const combinedPrompt = `${activeImage.prompt}, ${editInstruction}`;
      handleGenerate(combinedPrompt);
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setRevealedImageUrl(null);
    }
  };

  // Title save
  const handleSaveTitle = () => {
    if (activeImage && editedTitle.trim()) {
      setImages((prev) =>
        prev.map((img) => (img.id === activeImage.id ? { ...img, title: editedTitle.trim() } : img))
      );
    }
    setIsEditingTitle(false);
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        showToast('Foto hinzugefügt');
        setIsPhotoMenuOpen(false);
        if (!prompt) {
          setPrompt('Foto im MotionPicture-Stil verfeinern');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentStyleLabel = STYLES.find((s) => s.id === selectedStyle)?.label || 'Beliebiger Stil';

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Helvetica_Neue',Helvetica,Arial,sans-serif] overflow-hidden relative select-none">
      {/* Hidden File Inputs for Photo Upload & Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* TOP STATUS / NAVIGATION BAR (Directly over the Northern Lights) */}
      <header className="h-[58px] bg-transparent px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none relative">
        {/* Left Side: Circular, refined button for the sidebar */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => {
              playSound('click', settings.enableSoundEffects);
              if (onToggleSidebar) onToggleSidebar();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-[#242426] hover:bg-[#2c2c2e] text-white border border-white/5 shadow-md"
            title="Seitenleiste ein-/ausblenden"
          >
            <PanelLeft className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Action Group: Trash & Share Pill + More Button */}
          <div className="flex items-center gap-2 relative">
            {/* Trash & Share Connected Pill */}
            <div className="bg-white/[0.12] backdrop-blur-3xl border border-white/25 rounded-full flex items-center p-0.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.3)]">
              <button
                type="button"
                onClick={handleDeleteActiveImage}
                disabled={!activeImage}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/85 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/25" />
              <button
                type="button"
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                disabled={!activeImage}
                className="playground-trigger w-8 h-8 rounded-full flex items-center justify-center text-white/85 hover:text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Teilen & Exportieren"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>

            {/* More Options Button (...) */}
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="playground-trigger w-8 h-8 rounded-full bg-white/[0.12] backdrop-blur-3xl border border-white/25 flex items-center justify-center text-white hover:bg-white/[0.2] transition-colors cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.3)]"
              title="Weitere Optionen"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Share Popover Menu */}
            <AnimatePresence>
              {isShareMenuOpen && activeImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="playground-popover absolute right-10 top-11 w-56 bg-[#2a2b30] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 text-xs text-white"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = activeImage.url;
                      a.download = `${activeImage.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                      a.click();
                      setIsShareMenuOpen(false);
                      showToast('Bild heruntergeladen');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-white/80" />
                    <span>In Fotos sichern / PNG</span>
                  </button>

                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onSendToChat(activeImage.url, activeImage.prompt);
                        setIsShareMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-lime-400" />
                      <span>An Chat senden</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      addMediathekItem({
                        id: `pg_${Date.now()}`,
                        type: 'image',
                        title: activeImage.title,
                        createdAt: Date.now(),
                        authorName: 'Playground',
                        url: activeImage.url,
                        tags: ['playground']
                      });
                      setIsShareMenuOpen(false);
                      showToast('In Mediathek gesichert');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-emerald-400" />
                    <span>In Mediathek sichern</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeImage.prompt);
                      setIsShareMenuOpen(false);
                      showToast('Prompt kopiert');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-white/80" />
                    <span>Prompt kopieren</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* More Popover Menu */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="playground-popover absolute right-0 top-11 w-52 bg-[#2a2b30] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 text-xs text-white"
                >
                  {activeImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreviewImage({ url: activeImage.url, title: activeImage.title });
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4 text-white/80" />
                      <span>Vollbild anzeigen</span>
                    </button>
                  )}

                  <div className="px-3 py-2 border-t border-white/10 mt-1 text-[11px] text-white/60">
                    Modell: MotionPicture
                  </div>

                  {onBackToChat && (
                    <button
                      type="button"
                      onClick={onBackToChat}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span>Zurück zur Übersicht</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: CENTER CANVAS OVER NORTHERN LIGHTS */}
      <div className="flex-1 flex overflow-hidden relative bg-black">
        {/* CENTER STAGE */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden z-10 bg-black">
          {/* ACTIVE CARD STAGE: With Northern Lights directly and exclusively underneath the card */}
          {!isGridView && (
            <div className="relative flex flex-col items-center justify-center w-full max-w-[500px]">
              {/* NORTHERN LIGHTS: Only under the card, while the rest of MotionPicture is pitch black */}
              <NorthernLights />

              {/* STATE 1: GENERATING STATE (Exact Match to User Video) */}
              <AnimatePresence mode="wait">
                {isGenerating && (
                  <motion.div
                    key="generating-card"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="w-full max-w-[500px] h-[460px] bg-black/40 backdrop-blur-3xl border border-white/25 rounded-[38px] p-6 flex flex-col justify-between shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.35),inset_0_-1px_1.5px_rgba(0,0,0,0.25)] relative overflow-hidden select-text z-10"
                  >
                {/* Subtle Ambient Breathing Dark Wave Gradient (Matching Video Background) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#24252a]/80 via-[#1c1d22]/80 to-[#151619]/80 rounded-[38px] overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{
                      opacity: [0.35, 0.65, 0.35],
                      scale: [0.98, 1.03, 0.98]
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_65%)] blur-xl pointer-events-none"
                  />
                </div>

                {/* Top Header: Squircle Icon Badge on Left, Clean Percentage on Right */}
                <div className="flex items-center justify-between z-10 relative w-full">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.14] border border-white/25 flex items-center justify-center text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="text-white font-normal text-xl sm:text-2xl tracking-tight select-none font-sans drop-shadow-sm">
                    {Math.round(generationProgress)} %
                  </span>
                </div>

                {/* Center: Prompt Preview */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center z-10 relative">
                  <p className="text-white/60 text-sm sm:text-base font-normal max-w-[320px] line-clamp-3 leading-relaxed">
                    {generatingPrompt}
                  </p>
                </div>

                {/* Bottom: Placeholder spacer to balance layout */}
                <div className="h-9 z-10 relative" />

                {/* Cross-fade revealed image right inside the card at 100% */}
                {revealedImageUrl && (
                  <motion.img
                    src={revealedImageUrl}
                    alt="Generiertes Bild"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full object-cover rounded-[38px] z-20"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 2: PLAYGROUND CREATION CARD (IMG_0998 Translucent Frosted Glass) */}
          <AnimatePresence>
            {isCreatingNew && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="w-full max-w-[500px] h-[460px] bg-white/[0.08] hover:bg-white/[0.1] backdrop-blur-3xl border border-white/25 rounded-[38px] p-6 flex flex-col justify-between shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.35),inset_0_-1px_1.5px_rgba(0,0,0,0.25)] relative select-text transition-all duration-300 z-10"
              >
                {/* Top of Card: Style Pill 'Beliebiger Stil ⇅' (Cross button removed) */}
                <div className="flex items-center justify-end z-10 relative">
                  {/* Style Pill Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
                      className="playground-trigger bg-white/[0.12] hover:bg-white/[0.2] backdrop-blur-2xl border border-white/25 text-white text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.25)]"
                    >
                      <span>{currentStyleLabel}</span>
                      <ChevronsUpDown className="w-3.5 h-3.5 text-white/70" />
                    </button>

                    {/* Style Dropdown Menu */}
                    <AnimatePresence>
                      {isStyleMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          className="playground-popover absolute right-0 top-9 w-48 bg-[#12141c]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 text-xs text-white"
                        >
                          {STYLES.map((st, idx) => (
                            <button
                              key={`st-${st.id || idx}-${idx}`}
                              type="button"
                              onClick={() => {
                                setSelectedStyle(st.id);
                                setIsStyleMenuOpen(false);
                                playSound('click', settings.enableSoundEffects);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <span>{st.label}</span>
                              {selectedStyle === st.id && <Check className="w-3.5 h-3.5 text-lime-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Center of Card: Prompt Input & Suggestion Hints */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 relative my-auto">
                  <textarea
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder=""
                    rows={3}
                    className="w-full text-center text-white text-lg sm:text-xl font-normal bg-transparent outline-none resize-none leading-relaxed border-none focus:ring-0 placeholder-transparent"
                  />

                  {/* Placeholder overlay when prompt is empty */}
                  {!prompt && (
                    <div
                      onClick={() => promptInputRef.current?.focus()}
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-text pointer-events-none"
                    >
                      <span className="text-white/85 text-lg sm:text-xl font-normal drop-shadow-sm">
                        Bild beschreiben
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanSug = SUGGESTIONS[suggestionIndex]
                            .replace(/^„|“ versuchen$/g, '')
                            .trim();
                          setPrompt(cleanSug);
                          playSound('pop', settings.enableSoundEffects);
                        }}
                        className="text-white/80 text-xs mt-2 px-4 py-1.5 rounded-full bg-white/[0.12] hover:bg-white/[0.22] backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-all pointer-events-auto cursor-pointer"
                      >
                        {SUGGESTIONS[suggestionIndex]}
                      </button>
                    </div>
                  )}

                  {/* Quick Inspiration Chips */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3 max-w-[420px] pointer-events-auto">
                    {[
                      { label: '🔮 Cyberpunk', text: 'Futuristische Cyberpunk Stadt bei Nacht mit Neonlicht und Regen' },
                      { label: '🌌 Kosmos', text: 'Atemberaubender kosmischer Nebel in Tiefviolett mit fernen Galaxien' },
                      { label: '🏔️ Berge', text: 'Majestätische Bergkette im goldenen Morgenlicht am spiegelnden See' },
                      { label: '🎨 Renaissance', text: 'Klassisches Renaissance Porträt mit edlem Licht und feinen Texturen' },
                      { label: '✨ Fotorealismus', text: 'Makroaufnahme einer leuchtenden Libelle mit Wassertropfen, 8k' }
                    ].map((chip, idx) => (
                      <button
                        key={`chip-${chip.label || idx}-${idx}`}
                        type="button"
                        onClick={() => {
                          setPrompt(chip.text);
                          playSound('pop', settings.enableSoundEffects);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-lime-950/40 hover:bg-lime-900/60 text-lime-200/90 hover:text-white border border-lime-500/25 hover:border-lime-400/50 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom of Card: Aspect Ratio & Send Purple Circle */}
                <div className="flex items-center justify-between z-10 relative">
                  {/* Left Controls: Aspect Ratio Button */}
                  <div className="flex items-center gap-2">
                    {/* Aspect Ratio Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAspectMenuOpen(!isAspectMenuOpen)}
                        className="playground-trigger bg-white/[0.12] hover:bg-white/[0.2] backdrop-blur-2xl border border-white/25 rounded-full w-9.5 h-9.5 flex items-center justify-center text-white transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.25)]"
                        title="Seitenverhältnis"
                      >
                        {aspectRatio === '1:1' ? (
                          <Square className="w-4 h-4" />
                        ) : aspectRatio === '9:16' ? (
                          <RectangleVertical className="w-4 h-4" />
                        ) : (
                          <RectangleHorizontal className="w-4 h-4" />
                        )}
                      </button>

                      {/* Aspect Ratio Popover */}
                      <AnimatePresence>
                        {isAspectMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            className="playground-popover absolute left-0 bottom-12 w-44 bg-[#12141c]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 text-xs text-white"
                          >
                            {ASPECT_RATIOS.map((item, idx) => {
                              const IconComp = item.icon;
                              const isSelected = aspectRatio === item.id;
                              return (
                                <button
                                  key={`aspect-${item.id || idx}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setAspectRatio(item.id);
                                    setIsAspectMenuOpen(false);
                                    playSound('click', settings.enableSoundEffects);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    isSelected ? 'bg-lime-900/50 text-lime-200' : 'hover:bg-white/10 text-white'
                                  }`}
                                >
                                  {isSelected ? (
                                    <Check className="w-3.5 h-3.5 text-lime-400" />
                                  ) : (
                                    <span className="w-3.5" />
                                  )}
                                  <IconComp className="w-4 h-4 text-white/70" />
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Dark Purple Send / Generate Arrow Button */}
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-800 to-lime-600 hover:from-lime-700 hover:to-lime-500 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(147,51,234,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Generieren"
                  >
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STATE 3: GENERATED IMAGE / ACTIVE VIEW */}
          {!isCreatingNew && !isGenerating && activeImage && (
            <div className="flex flex-col items-center justify-center max-w-full z-10">
              {/* Header Title with Edit Pencil: "Ein Haus am Strand ✎" */}
              <div className="flex items-center gap-2 text-white text-base sm:text-lg font-normal mb-5">
                {isEditingTitle ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveTitle();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      autoFocus
                      className="bg-[#24252a] text-white px-3 py-1 rounded-lg text-base border border-white/20 outline-none text-center"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedTitle(activeImage.title);
                      setIsEditingTitle(true);
                    }}
                    className="flex items-center gap-2 hover:text-white/80 transition-colors cursor-pointer group"
                  >
                    <span>{activeImage.title}</span>
                    <Pencil className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                  </button>
                )}
              </div>

              {/* The Image in the Squircle Container with Dynamic Aspect Ratio */}
              <div
                onClick={() => setSelectedPreviewImage({ url: activeImage.url, title: activeImage.title })}
                className={`w-[90vw] max-w-[500px] ${
                  activeImage.aspectRatio === '16:9'
                    ? 'aspect-[16/9]'
                    : activeImage.aspectRatio === '9:16'
                    ? 'aspect-[9/16] max-h-[520px]'
                    : 'aspect-square'
                } rounded-[38px] overflow-hidden border border-white/25 shadow-[0_24px_64px_rgba(88,28,135,0.3),inset_0_1.5px_2px_rgba(255,255,255,0.35)] bg-black/40 backdrop-blur-3xl cursor-pointer group relative transition-transform hover:scale-[1.005]`}
              >
                <img
                  src={activeImage.url}
                  alt={activeImage.title}
                  className="w-full h-full object-cover rounded-[38px]"
                />

                {/* Convenient Hover Overlay on the Card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between pointer-events-none">
                  {/* Top-Right Action Badges */}
                  <div className="flex items-center justify-end gap-2 pointer-events-auto">
                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToChat(activeImage.url, activeImage.prompt);
                          showToast('An Chat gesendet');
                        }}
                        className="p-2 rounded-full bg-black/60 hover:bg-lime-900/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                        title="An Chat senden"
                      >
                        <MessageSquare className="w-4 h-4 text-lime-300" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const a = document.createElement('a');
                        a.href = activeImage.url;
                        a.download = `${activeImage.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                        a.click();
                        showToast('Bild heruntergeladen');
                      }}
                      className="p-2 rounded-full bg-black/60 hover:bg-lime-900/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreviewImage({ url: activeImage.url, title: activeImage.title });
                      }}
                      className="p-2 rounded-full bg-black/60 hover:bg-lime-900/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                      title="Großansicht"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Bottom Model & Style Tag */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <span className="px-3 py-1 rounded-full bg-lime-950/70 border border-lime-500/30 text-[11px] text-lime-200 font-medium backdrop-blur-md flex items-center gap-1.5 shadow-md">
                      <Sparkles className="w-3 h-3 text-lime-400" />
                      <span>{activeImage.modelUsed || 'MotionPicture'} • {activeImage.aspectRatio || '1:1'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Refinement Bar: Transparent iOS Frosted Search Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRefine();
                }}
                className="w-[90vw] max-w-[480px] sm:max-w-[500px] rounded-full bg-white/[0.12] hover:bg-white/[0.16] backdrop-blur-3xl border border-white/25 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4),0_12px_36px_rgba(0,0,0,0.5)] px-4 py-2.5 flex items-center gap-3 mt-5 transition-all group focus-within:border-lime-500/50 focus-within:ring-2 focus-within:ring-purple-500/20"
              >
                <Search className="w-4.5 h-4.5 text-white/50 group-focus-within:text-lime-300 transition-colors shrink-0" />
                <input
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="Suchen oder Änderung beschreiben..."
                  className="flex-1 bg-transparent border-none text-sm sm:text-base text-white placeholder-white/45 outline-none focus:ring-0 font-normal leading-normal"
                />
                {refinePrompt.trim() ? (
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-800 to-lime-600 hover:from-lime-700 hover:to-lime-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 shadow-[0_2px_12px_rgba(147,51,234,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                    title="Änderung anwenden"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('pop', settings.enableSoundEffects);
                      showToast('Spracheingabe bereit');
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Diktieren"
                  >
                    <Mic className="w-4.5 h-4.5" />
                  </button>
                )}
              </form>

              {/* Floating iOS Frosted Action Capsule (Exact Match to IMG_0996) */}
              <div className="rounded-full bg-[#1c1d22]/85 hover:bg-[#24252a]/90 backdrop-blur-3xl border border-white/20 px-8 py-3 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.25),0_14px_38px_rgba(0,0,0,0.6)] flex items-center justify-center gap-9 mt-4 transition-all">
                <button
                  type="button"
                  onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                  className="text-white/85 hover:text-white transition-transform active:scale-95 cursor-pointer"
                  title="Teilen & Exportieren"
                >
                  <Share className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(activeImage.prompt);
                    handleGenerate(activeImage.prompt);
                  }}
                  disabled={isGenerating}
                  className="text-white/85 hover:text-white transition-transform active:scale-95 hover:rotate-45 duration-200 cursor-pointer disabled:opacity-40"
                  title="Variation neu generieren"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewImage({ url: activeImage.url, title: activeImage.title })}
                  className="text-white/85 hover:text-white transition-transform active:scale-95 cursor-pointer"
                  title="Vollbild anzeigen"
                >
                  <Compass className="w-5 h-5" />
                </button>
              </div>

              {/* MotionPicture Disclaimer (Tiny text underneath) */}
              <p className="text-neutral-500 text-[11px] text-center mt-3 tracking-tight">
                MotionPicture kann unerwartete Ergebnisse generieren.
              </p>
            </div>
          )}

          {/* STATE 4: EMPTY STATE */}
          {!isCreatingNew && !isGenerating && !activeImage && (
            <div className="flex flex-col items-center justify-center text-center z-10 p-6 rounded-[34px] bg-white/[0.08] backdrop-blur-3xl border border-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.35)]">
              <span className="text-neutral-300 text-sm font-normal mb-3">Nichts ausgewählt</span>
              <button
                type="button"
                onClick={handleOpenNewCard}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bild beschreiben</span>
              </button>
            </div>
          )}
            </div>
          )}

          {/* STATE 5: GALLERY GRID VIEW (When ⊞ is toggled) */}
          {isGridView && (
            <div className="w-full max-w-4xl h-full overflow-y-auto p-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">Galerie</h2>
                <button
                  type="button"
                  onClick={handleOpenNewCard}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-lime-800 to-lime-800 hover:from-lime-700 hover:to-lime-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-lime-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Neues Bild</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={`img-item-${img.id || idx}-${idx}`}
                    onClick={() => {
                      setActiveImageId(img.id);
                      setIsGridView(false);
                      setIsCreatingNew(false);
                    }}
                    className="aspect-square rounded-[26px] overflow-hidden border border-white/10 hover:border-white/30 cursor-pointer shadow-lg relative group transition-transform hover:scale-[1.02]"
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <span className="text-xs font-medium text-white truncate">{img.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#2c2d33] border border-white/15 text-white text-xs px-4 py-2 rounded-full shadow-2xl z-50 pointer-events-none"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE VIEWER MODAL */}
      <ImageViewerModal
        isOpen={!!selectedPreviewImage}
        imageUrl={selectedPreviewImage?.url || null}
        title={selectedPreviewImage?.title}
        onClose={() => setSelectedPreviewImage(null)}
      />
    </div>
  );
};
