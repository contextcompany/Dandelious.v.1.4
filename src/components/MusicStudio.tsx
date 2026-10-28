import React, { useState, useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  Sparkles,
  Disc3,
  Sliders,
  Radio,
  FileAudio,
  ListMusic,
  Clock,
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { EngineSettings, GemmaModelId } from '../types';
import { playSound } from '../utils/sound';

interface MusicStudioProps {
  settings: EngineSettings;
  selectedModel?: GemmaModelId;
  onSelectModel?: (modelId: GemmaModelId) => void;
  onBackToChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenSettings?: (subPage?: string) => void;
}

export interface GeneratedTrack {
  id: string;
  title: string;
  genre: string;
  mood: string;
  duration: number;
  bpm: number;
  audioBase64: string;
  mimeType: string;
  lyrics?: string;
  modelUsed: string;
  createdAt: number;
}

const GENRE_PRESETS = [
  { id: 'synthwave', label: 'Synthwave / Retro', prompt: '80s analog synthesizer, nostalgic neon arpeggio, gated reverb snare, cinematic bassline' },
  { id: 'lofi', label: 'Lo-Fi Hip-Hop', prompt: 'Chill lofi hip-hop beat, vinyl crackle, warm rhodes piano chords, mellow bass' },
  { id: 'orchestral', label: 'Epic Orchestral', prompt: 'Cinematic orchestral soundtrack, soaring strings, brass fanfare, dramatic war drums' },
  { id: 'cyberpunk', label: 'Cyberpunk Techno', prompt: 'Dark industrial cyberpunk electro, driving 135 bpm groove, distorted acid 303 synth' },
  { id: 'acoustic', label: 'Acoustic Folk', prompt: 'Gentle acoustic fingerpicking guitar, warm wooden room acoustics, melodic whistling' },
  { id: 'ambient', label: 'Deep Ambient', prompt: 'Spiritual meditative ambient pads, crystal quartz harmonics, slow drifting atmosphere' },
  { id: 'metal', label: 'Heavy Metal', prompt: 'Heavy electric guitar riff, double bass drum blast beats, aggressive groove' },
  { id: 'chiptune', label: '8-Bit Arcade', prompt: 'Upbeat retro 8-bit game chiptune, NES square wave melody, catchy arcade rhythm' }
];

const MOODS = [
  'Energetisch & Treibend',
  'Entspannt & Mellow',
  'Episch & Heroisch',
  'Düster & Geheimnisvoll',
  'Fröhlich & Inspirierend',
  'Melancholisch'
];

export const MusicStudio: React.FC<MusicStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeModel, setActiveModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [selectedGenre, setSelectedGenre] = useState('synthwave');
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [durationSec, setDurationSec] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track history
  const [library, setLibrary] = useState<GeneratedTrack[]>(() => {
    try {
      const saved = localStorage.getItem('saphire_lyria_tracks_v1');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (library.length > 0) {
        localStorage.setItem('saphire_lyria_tracks_v1', JSON.stringify(library.slice(0, 30)));
      }
    } catch (_) {}
  }, [library]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate Music handler
  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || GENRE_PRESETS.find(g => g.id === selectedGenre)?.prompt || 'Harmonische instrumentale Musik';
    setIsGenerating(true);
    playSound('click', settings.enableSoundEffects);

    try {
      const res = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: activeModel,
          genre: GENRE_PRESETS.find(g => g.id === selectedGenre)?.label || 'Electronic',
          mood: selectedMood,
          durationSeconds: durationSec,
          imageBase64: referenceImage || undefined,
          customApiKey: settings.customApiKey
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler bei der Musikgenerierung');
      }

      const data = await res.json();
      const newTrack: GeneratedTrack = {
        id: data.id || `track_${Date.now()}`,
        title: data.title || finalPrompt.slice(0, 28),
        genre: data.genre || 'Ambient',
        mood: data.mood || selectedMood,
        duration: data.duration || durationSec,
        bpm: data.bpm || 120,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        lyrics: data.lyrics,
        modelUsed: data.modelUsed || activeModel,
        createdAt: Date.now()
      };

      setLibrary(prev => [newTrack, ...prev]);
      playTrack(newTrack);
      showToast('Track erfolgreich generiert!');
      playSound('chime', settings.enableSoundEffects);
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Fehler bei der Musikgenerierung');
      playSound('pop', settings.enableSoundEffects);
    } finally {
      setIsGenerating(false);
    }
  };

  const playTrack = (track: GeneratedTrack) => {
    setCurrentTrack(track);
    if (!audioRef.current) return;
    audioRef.current.src = `data:${track.mimeType};base64,${track.audioBase64}`;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(e => console.warn('Audio play error:', e));
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const link = document.createElement('a');
    link.href = `data:${track.mimeType};base64,${track.audioBase64}`;
    link.download = `${track.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.wav`;
    link.click();
    showToast('Download gestartet');
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = 48;
      const barWidth = w / bars;

      for (let i = 0; i < bars; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const freq = Math.sin((i * 0.3) + offset) * 0.5 + 0.5;
          const amp = Math.cos((i * 0.15) - offset * 1.5) * 0.5 + 0.5;
          barHeight = Math.max(6, (freq * amp * (h - 12)) + 6);
        } else if (currentTrack) {
          barHeight = 10 + Math.sin(i * 0.4) * 6;
        }

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth + 1.5, (h - barHeight) / 2, barWidth - 3, barHeight);
      }

      if (isPlaying) offset += 0.12;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTrack]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImage(reader.result as string);
        showToast('Referenzbild als Inspiration geladen');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050507] text-neutral-100 font-['Plus_Jakarta_Sans'] overflow-hidden relative select-text">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Hidden image input for cover inspiration */}
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
          <Check className="w-3.5 h-3.5 text-blue-300" />
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
            <div className="w-8 h-8 rounded-xl bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-blue-300">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Dandelious Lyria</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/20 text-blue-300 border border-blue-500/20 font-mono">
                  Audio Studio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Model switcher tabs */}
        <LayoutGroup id="music-studio-tabs">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg text-xs">
            {(['lyria-3-clip-preview', 'lyria-3-pro-preview'] as const).map((model) => {
              const isActive = activeModel === model;
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => setActiveModel(model)}
                  className={`relative px-4 py-1.5 rounded-full transition-colors cursor-pointer font-medium z-10 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  }`}
                  title={model === 'lyria-3-clip-preview' ? 'Kurze Musik-Clips bis 30 Sekunden' : 'Volle Musiktracks mit erweitertem Arrangement'}
                >
                  {isActive && (
                    <motion.div
                      layoutId="musicStudioActiveModel"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span>{model === 'lyria-3-clip-preview' ? 'Lyria Clip (bis 30s)' : 'Lyria Pro (Full Track)'}</span>
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

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10">
        {/* Left / Top Studio Configuration Column */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-white/5 bg-[#09090d] flex flex-col overflow-y-auto p-5 gap-5 shrink-0">
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              Musik-Prompt & Beschreibung
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Beschreibe die Instrumente, Rhythmus, Melodie oder die emotionale Stimmung..."
              rows={3}
              className="w-full bg-[#121218] border border-white/10 rounded-xl p-3 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Genre Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              Genre & Klangbild
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENRE_PRESETS.map((g, idx) => (
                <button
                  key={`genre-${g.id || idx}-${idx}`}
                  onClick={() => {
                    setSelectedGenre(g.id);
                    if (!prompt) setPrompt(g.prompt);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex flex-col gap-1 ${
                    selectedGenre === g.id
                      ? 'bg-lime-900/25 border-lime-500/50 text-blue-200'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold text-white text-[13px]">{g.label}</span>
                  <span className="text-[10px] text-neutral-500 truncate">{g.prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              Stimmung
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m, idx) => (
                <button
                  key={`mood-${m || idx}-${idx}`}
                  onClick={() => setSelectedMood(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedMood === m
                      ? 'bg-blue-700 text-white'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Model Info */}
          <div className="bg-[#121218] rounded-xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                Track-Dauer
              </span>
              <span className="font-mono text-white font-semibold">{durationSec} Sekunden</span>
            </div>
            <input
              type="range"
              min={10}
              max={activeModel === 'lyria-3-pro-preview' ? 30 : 25}
              step={1}
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />

            {/* Optional Cover Art Inspiration */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                {referenceImage ? 'Bild-Inspiration aktiv' : 'Cover-Bild für Inspiration hochladen'}
              </button>
              {referenceImage && (
                <button
                  onClick={() => setReferenceImage(null)}
                  className="text-[11px] text-red-400 hover:text-red-300 cursor-pointer"
                >
                  Entfernen
                </button>
              )}
            </div>
          </div>

          {/* Generate CTA Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isGenerating ? (
              <>
                <Disc3 className="w-4 h-4 animate-spin text-blue-100" />
                <span>Lyria komponiert Track...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-100" />
                <span>Musikstück generieren ({activeModel === 'lyria-3-pro-preview' ? 'Pro' : 'Clip'})</span>
              </>
            )}
          </button>
        </div>

        {/* Right Player & Visualizer Stage */}
        <div className="flex-1 flex flex-col bg-[#050507] overflow-y-auto p-6 lg:p-8 gap-6 justify-between">
          {/* Main Visualizer Card */}
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {currentTrack ? (
              <div className="w-full bg-[#0d0d14] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Track Meta Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-blue-900/20 text-blue-300 border border-blue-500/20">
                      {currentTrack.modelUsed}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
                      {currentTrack.title}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      {currentTrack.genre} • {currentTrack.mood} • {currentTrack.bpm} BPM
                    </p>
                  </div>

                  <button
                    onClick={() => downloadTrack(currentTrack)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                    title="Track herunterladen"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* Animated Waveform Canvas */}
                <div className="w-full h-28 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center p-2 overflow-hidden">
                  <canvas ref={canvasRef} width={640} height={100} className="w-full h-full" />
                </div>

                {/* Progress Bar & Timestamps */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || currentTrack.duration}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-white/10 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (audioRef.current) audioRef.current.volume = v;
                        setIsMuted(false);
                      }}
                      className="w-20 accent-purple-600 cursor-pointer"
                    />
                  </div>

                  {/* Big Play / Pause Button */}
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 transition-all cursor-pointer active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <div className="w-24 text-right">
                    <button
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = 0;
                      }}
                      className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 ml-auto"
                      title="Neu starten"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </button>
                  </div>
                </div>

                {/* Arrangement & Lyrics notes if available */}
                {currentTrack.lyrics && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                      Kompositionsnotizen
                    </span>
                    <p className="text-xs text-neutral-300 whitespace-pre-line font-mono bg-black/30 p-3 rounded-lg border border-white/5">
                      {currentTrack.lyrics}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-blue-900/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-300">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Noch kein Track aktiv</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Wähle links ein Musikgenre aus oder gib einen eigenen Prompt ein, um deinen ersten Track mit Google Gemini Lyria zu erzeugen.
                </p>
              </div>
            )}
          </div>

          {/* Track History List */}
          {library.length > 0 && (
            <div className="w-full max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <ListMusic className="w-4 h-4 text-blue-300" />
                  Bisher generierte Tracks ({library.length})
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {library.map((t, idx) => (
                  <div
                    key={`track-${t.id || idx}-${idx}`}
                    onClick={() => playTrack(t)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      currentTrack?.id === t.id
                        ? 'bg-blue-900/25 border-blue-500/40 text-white'
                        : 'bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-300">
                        {currentTrack?.id === t.id && isPlaying ? (
                          <Disc3 className="w-4 h-4 animate-spin text-blue-300" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{t.title}</p>
                        <p className="text-[10px] text-neutral-400">{t.genre} • {t.duration}s</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadTrack(t);
                      }}
                      className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </button>
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
