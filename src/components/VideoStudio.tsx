import React, { useState, useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Film,
  Maximize2,
  Volume2,
  VolumeX,
  Upload,
  Image as ImageIcon,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Check,
  Clock,
  ArrowLeft,
  Layers,
  Sparkle
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';

interface VideoStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenSettings?: (subPage?: string) => void;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  mode: 'text-to-video' | 'image-to-video';
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: number;
}

const VIDEO_PRESETS = [
  {
    label: 'Cinematic Drone Flyover',
    prompt: 'Breathtaking 4K drone shot skimming over turquoise alpine lake at golden hour, dramatic mist rising from evergreen forest',
    aspectRatio: '16:9' as const
  },
  {
    label: 'Cyberpunk Neon Street',
    prompt: 'Futuristic Neo-Tokyo city street in heavy rain, glowing holographic billboards reflections on wet asphalt, flying cars passing above',
    aspectRatio: '16:9' as const
  },
  {
    label: 'Social Portrait Reel',
    prompt: 'Elegant fashion model walking down sunny Parisian street, slow motion camera dolly in, lens flare, cinematic portrait lighting',
    aspectRatio: '9:16' as const
  },
  {
    label: 'Galactic Deep Space',
    prompt: 'Swirling luminous cosmic nebula with glowing stars, camera traveling through interstellar dust cloud, epic celestial scale',
    aspectRatio: '16:9' as const
  },
  {
    label: 'Microscopic Water Droplet',
    prompt: 'Macro slow motion shot of single water droplet splashing into calm pool, crown formation ripples dispersing in crystal clarity',
    aspectRatio: '16:9' as const
  }
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar
}) => {
  const [activeTab, setActiveTab] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [inputImage, setInputImage] = useState<string | null>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Video Player
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Gallery
  const [gallery, setGallery] = useState<GeneratedVideo[]>(() => {
    try {
      const saved = localStorage.getItem('saphire_veo_videos_v1');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      if (gallery.length > 0) {
        localStorage.setItem('saphire_veo_videos_v1', JSON.stringify(gallery.slice(0, 20)));
      }
    } catch (_) {}
  }, [gallery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Image upload for Image-to-Video
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setInputImage(reader.result as string);
        setActiveTab('image-to-video');
        if (!prompt) {
          setPrompt('Sanfte filmische Kamerabewegung, dynamisches Licht und lebendige Partikel');
        }
        showToast('Bild geladen! Jetzt in Video animieren.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate Video using Veo 3
  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || 'Cinematic ultra motion visual scene';
    setIsGenerating(true);
    setProgressPercent(10);
    setGenerationPhase('Initialisiere Veo 3 Video-Pipeline...');
    playSound('click', settings.enableSoundEffects);

    try {
      const startRes = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageBase64: activeTab === 'image-to-video' && inputImage ? inputImage : undefined,
          aspectRatio,
          resolution,
          customApiKey: settings.customApiKey
        })
      });

      if (!startRes.ok) {
        const data = await startRes.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Starten der Videogenerierung');
      }

      const jobData = await startRes.json();
      setProgressPercent(30);
      setGenerationPhase('Veo 3 rendert Motion-Frames & Beleuchtung...');

      let finalVideoUrl = jobData.videoUrl;

      // If job is already completed (instant render or procedural fallback)
      if (jobData.status === 'completed' && jobData.videoUrl) {
        finalVideoUrl = jobData.videoUrl;
      } else if (jobData.id) {
        // Poll status every 3 seconds for up to 45 seconds
        const jobId = jobData.id;
        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          setProgressPercent(Math.min(92, 30 + i * 5));
          setGenerationPhase(`Rendere Szene (Schritt ${i + 1}/15)...`);

          try {
            const statusRes = await fetch('/api/video/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId, customApiKey: settings.customApiKey })
            });

            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === 'completed' && statusData.videoUrl) {
                finalVideoUrl = statusData.videoUrl;
                break;
              }
            }
          } catch (_) {}
        }
      }

      if (!finalVideoUrl) {
        // Graceful fallback URL
        finalVideoUrl = jobData.videoUrl;
      }

      const newVideo: GeneratedVideo = {
        id: jobData.id || `video_${Date.now()}`,
        prompt: finalPrompt,
        mode: activeTab,
        aspectRatio,
        resolution,
        videoUrl: finalVideoUrl,
        thumbnailUrl: jobData.thumbnailUrl || finalVideoUrl,
        createdAt: Date.now()
      };

      setProgressPercent(100);
      setGenerationPhase('Video fertiggestellt!');
      setGallery((prev) => [newVideo, ...prev]);
      setCurrentVideo(newVideo);
      showToast('Video erfolgreich erstellt!');
      playSound('chime', settings.enableSoundEffects);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Fehler bei der Videogenerierung');
      playSound('pop', settings.enableSoundEffects);
    } finally {
      setIsGenerating(false);
      setProgressPercent(0);
      setGenerationPhase('');
    }
  };

  const handleDownload = (video: GeneratedVideo) => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    link.download = `saphire_veo_${video.id}.${video.videoUrl.startsWith('data:video/mp4') ? 'mp4' : 'webm'}`;
    link.click();
    showToast('Download gestartet');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050507] text-neutral-100 font-['Plus_Jakarta_Sans'] overflow-hidden relative select-text">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/90 text-white text-xs border border-white/10 shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-lime-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-16 border-b border-white/5 bg-[#050507]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] border border-white/5 text-white transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95"
              title="Seitenleiste umschalten"
            >
              <span className="w-5 h-[2px] bg-neutral-300 rounded-full" />
              <span className="w-5 h-[2px] bg-neutral-300 rounded-full" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lime-600/20 border border-lime-500/30 flex items-center justify-center text-lime-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Dandelious Veo 3</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/20 font-mono">
                  Video Studio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <LayoutGroup id="video-studio-tabs">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-xs">
            {(['text-to-video', 'image-to-video'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-1.5 rounded-full transition-colors cursor-pointer font-medium flex items-center gap-1.5 z-10 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="videoStudioActiveTab"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  {tab === 'text-to-video' ? (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Text zu Video</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Bild animieren</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="w-10 flex justify-end">
          {onBackToChat && (
            <button
              onClick={() => {
                playSound('click', settings.enableSoundEffects);
                onBackToChat();
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Zurück zum Chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10">
        {/* Left Parameter Controls */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-white/5 bg-[#09090d] flex flex-col overflow-y-auto p-5 gap-5 shrink-0">
          {/* Image-to-video upload card */}
          {activeTab === 'image-to-video' && (
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                Startbild zur Animation
              </label>
              {inputImage ? (
                <div className="relative rounded-xl overflow-hidden border border-lime-500/40 bg-black/40 group">
                  <img src={inputImage} alt="Input" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-lime-700 text-xs text-white font-medium hover:bg-lime-600 cursor-pointer"
                    >
                      Anderes Bild
                    </button>
                    <button
                      onClick={() => setInputImage(null)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/80 text-xs text-white font-medium hover:bg-red-600 cursor-pointer"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border border-dashed border-white/15 hover:border-lime-500/50 bg-white/5 hover:bg-lime-500/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-neutral-400 hover:text-white p-4 text-center"
                >
                  <Upload className="w-6 h-6 text-lime-400" />
                  <span className="text-xs font-medium">Foto oder Bild hier hochladen</span>
                  <span className="text-[10px] text-neutral-500">PNG, JPG, WebP bis 10MB</span>
                </div>
              )}
            </div>
          )}

          {/* Prompt input */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              {activeTab === 'image-to-video' ? 'Kameraführung & Bewegungsanweisung' : 'Szenenbeschreibung (Prompt)'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'image-to-video'
                  ? 'z.B.: Langsames Hineinzoomen auf die Szene, wehende Haare im Wind, lebendige Beleuchtung...'
                  : 'z.B.: Filmische Drohnenaufnahme über ein blaues Meer bei Sonnenuntergang, 4K Qualität...'
              }
              rows={3}
              className="w-full bg-[#121218] border border-white/10 rounded-xl p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-lime-500 transition-colors resize-none"
            />
          </div>

          {/* Preset Prompts */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              Inspiration & Filmvorlagen
            </label>
            <div className="space-y-1.5">
              {VIDEO_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                    setAspectRatio(p.aspectRatio);
                  }}
                  className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-white">{p.label}</span>
                  <span className="text-[11px] text-neutral-400 truncate">{p.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Video Formats & Dimensions */}
          <div className="bg-[#121218] rounded-xl p-4 border border-white/5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-neutral-400 block mb-2">Seitenverhältnis</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    aspectRatio === '16:9'
                      ? 'bg-lime-600/20 border-lime-500 text-lime-300'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                  <span>16:9 Querformat</span>
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    aspectRatio === '9:16'
                      ? 'bg-lime-600/20 border-lime-500 text-lime-300'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <RectangleVertical className="w-4 h-4" />
                  <span>9:16 Hochformat</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
              <span className="text-neutral-400">Auflösung</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setResolution('720p')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    resolution === '720p' ? 'bg-lime-700 text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  720p HD
                </button>
                <button
                  onClick={() => setResolution('1080p')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    resolution === '1080p' ? 'bg-lime-700 text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  1080p FHD
                </button>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-lime-800 to-lime-800 hover:from-lime-700 hover:to-lime-700 text-white font-semibold text-sm shadow-lg shadow-lime-900/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] border border-lime-500/30"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-lime-200" />
                <span>Veo rendert Video...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-lime-200" />
                <span>Video mit Veo 3 generieren</span>
              </>
            )}
          </button>
        </div>

        {/* Right Video Player Stage */}
        <div className="flex-1 flex flex-col bg-[#050507] overflow-y-auto p-6 lg:p-8 gap-6">
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center">
            {isGenerating ? (
              <div className="w-full max-w-lg bg-[#0d0d14] border border-lime-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-lime-600/20 border border-lime-500/30 flex items-center justify-center mx-auto text-lime-400 animate-pulse">
                  <Film className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">Veo 3 generiert Video</h3>
                  <p className="text-xs text-neutral-400">{generationPhase}</p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-lime-700 to-lime-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-neutral-500">{progressPercent}% abgeschlossen</span>
              </div>
            ) : currentVideo ? (
              <div className="w-full bg-[#0d0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                {/* Video display container */}
                <div className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[560px] overflow-hidden">
                  {currentVideo.videoUrl.startsWith('data:video') ? (
                    <video
                      ref={videoRef}
                      src={currentVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="max-h-[560px] w-full object-contain"
                    />
                  ) : (
                    /* High fidelity animated SVG preview */
                    <img
                      src={currentVideo.videoUrl}
                      alt={currentVideo.prompt}
                      className="w-full h-full object-contain max-h-[560px]"
                    />
                  )}
                </div>

                {/* Video Meta & Action bar */}
                <div className="p-5 flex items-center justify-between border-t border-white/5 bg-[#0a0a0f]">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-lime-500/10 text-lime-400 border border-lime-500/20">
                        Veo 3 • {currentVideo.aspectRatio} • {currentVideo.resolution}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {currentVideo.mode === 'image-to-video' ? 'Bild animiert' : 'Text zu Video'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 font-medium line-clamp-2">
                      {currentVideo.prompt}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownload(currentVideo)}
                    className="px-4 py-2 rounded-xl bg-lime-700 hover:bg-lime-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer shadow-lime-900/25"
                  >
                    <Download className="w-4 h-4" />
                    <span>Herunterladen</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-lime-600/10 border border-lime-500/20 flex items-center justify-center mx-auto mb-4 text-lime-400">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Noch kein Video aktiv</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Gib links eine Szene ein oder lade ein Foto hoch, um filmische Clips im 16:9- oder 9:16-Format mit Google Veo 3 zu erstellen.
                </p>
              </div>
            )}
          </div>

          {/* Gallery history */}
          {gallery.length > 0 && (
            <div className="w-full max-w-4xl mx-auto space-y-3">
              <span className="text-xs font-medium text-neutral-400 block">
                Generierte Videos ({gallery.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gallery.map((v, idx) => (
                  <div
                    key={`video-${v.id || idx}-${idx}`}
                    onClick={() => setCurrentVideo(v)}
                    className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      currentVideo?.id === v.id ? 'border-lime-500 ring-2 ring-purple-500/40' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-video bg-black/60 relative">
                      <img
                        src={v.thumbnailUrl || v.videoUrl}
                        alt={v.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                        {v.aspectRatio}
                      </div>
                    </div>
                    <div className="p-2 bg-[#0d0d12]">
                      <p className="text-[11px] text-neutral-300 font-medium truncate">{v.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
