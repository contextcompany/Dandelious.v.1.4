import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquare,
  Radio,
  ChevronDown,
  X,
  Save,
  Check
} from 'lucide-react';
import { GeminiLiveClient, LiveTranscriptItem } from '../utils/geminiLiveClient';
import { playSound } from '../utils/sound';

interface GeminiLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey?: string;
  appLanguage?: string;
  toneStyle?: string;
  userNickname?: string;
  userOccupation?: string;
  soundEnabled?: boolean;
  onSaveTranscriptToChat?: (transcriptText: string) => void;
}

const AVAILABLE_VOICES = [
  { id: 'Zephyr', name: 'Zephyr', desc: 'Sanft & Ausgewogen (Standard)', gender: 'Neutral' },
  { id: 'Puck', name: 'Puck', desc: 'Lebendig & Dynamisch', gender: 'Männlich' },
  { id: 'Charon', name: 'Charon', desc: 'Ruhig & Tief', gender: 'Männlich' },
  { id: 'Kore', name: 'Kore', desc: 'Warm & Natürlich', gender: 'Weiblich' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Kräftig & Klar', gender: 'Männlich' },
  { id: 'Aoede', name: 'Aoede', desc: 'Melodisch & Expressiv', gender: 'Weiblich' },
];

export const GeminiLiveModal: React.FC<GeminiLiveModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  appLanguage = 'Deutsch',
  toneStyle = 'Freundlich',
  userNickname = '',
  userOccupation = '',
  soundEnabled = true,
  onSaveTranscriptToChat,
}) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [statusMessage, setStatusMessage] = useState('Verbindung zu Gemini Live wird aufgebaut...');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [showTranscripts, setShowTranscripts] = useState(true);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [userVolume, setUserVolume] = useState(0);
  const [modelVolume, setModelVolume] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const clientRef = useRef<GeminiLiveClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize and connect Live Client when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    setIsSaved(false);
    setTranscripts([]);
    setStatus('connecting');
    setStatusMessage('Verbindung zu Gemini Live wird aufgebaut...');

    const client = new GeminiLiveClient({
      customApiKey,
      voiceName: selectedVoice,
      appLanguage,
      toneStyle,
      userNickname,
      userOccupation,
      onStatusChange: (newStatus, msg) => {
        setStatus(newStatus);
        if (msg) setStatusMessage(msg);
        if (newStatus === 'connected') {
          playSound('chime', soundEnabled);
        }
      },
      onTranscript: (item) => {
        setTranscripts((prev) => {
          // If previous transcript item was same sender and within 2 seconds, merge or append
          return [...prev, item];
        });
      },
      onUserVolume: (vol) => {
        setUserVolume(vol);
      },
      onModelVolume: (vol) => {
        setModelVolume(vol);
      },
      onInterrupted: () => {
        // Interruption animation feedback
      },
    });

    clientRef.current = client;
    client.connect();

    return () => {
      cleanup();
    };
  }, [isOpen, selectedVoice]);

  // Scroll transcripts to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const cleanup = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleToggleMute = () => {
    playSound('click', soundEnabled);
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleCamera = async () => {
    playSound('click', soundEnabled);

    if (isCameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.stopVideoStream();
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);

        if (clientRef.current && videoRef.current) {
          clientRef.current.startVideoStream(videoRef.current);
        }
      } catch (err: any) {
        console.error('Camera access failed:', err);
        setStatusMessage('Kamera-Zugriff nicht möglich.');
      }
    }
  };

  const handleHangUp = () => {
    playSound('click', soundEnabled);
    cleanup();
    onClose();
  };

  const handleSaveToChat = () => {
    if (transcripts.length === 0 || !onSaveTranscriptToChat) return;
    playSound('chime', soundEnabled);

    const formattedTranscript = transcripts
      .map((t) => `**${t.sender === 'user' ? (userNickname || 'Du') : 'Dandelious Live'}**: ${t.text}`)
      .join('\n\n');

    const fullText = `### 🎙️ Gemini Live Gesprächsprotokoll\n*Dauer: ${transcripts.length} Beiträge*\n\n${formattedTranscript}`;
    onSaveTranscriptToChat(fullText);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!isOpen) return null;

  // Visualizer scale calculations
  const orbScale = 1 + modelVolume * 0.45 + (status === 'connecting' ? 0.05 : 0);
  const userRippleScale = 1 + userVolume * 0.6;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-2xl select-none font-['Plus_Jakarta_Sans']">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className={`relative w-full ${
            isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl h-[92vh] max-h-[850px] sm:rounded-[36px]'
          } bg-[#0a0a0c] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-lime-700/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-white">Dandelious Gemini Live</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live API
                  </span>
                </div>
                <p className="text-xs text-neutral-400">gemini-3.1-flash-live-preview • 24kHz Native Audio</p>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2">
              {/* Voice Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-200 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Stimme: {selectedVoice}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <AnimatePresence>
                  {showVoiceDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#16161a] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 space-y-1"
                    >
                      <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Gemini Live Stimme
                      </div>
                      {AVAILABLE_VOICES.map((v, idx) => (
                        <button
                          key={`gl-voice-${v.id || idx}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSelectedVoice(v.id);
                            setShowVoiceDropdown(false);
                            playSound('click', soundEnabled);
                          }}
                          className={`w-full flex flex-col items-start px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                            selectedVoice === v.id
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'hover:bg-white/5 text-neutral-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-medium">{v.name}</span>
                            <span className="text-[10px] text-neutral-500">{v.gender}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400">{v.desc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Subtitles Toggle */}
              <button
                type="button"
                onClick={() => {
                  setShowTranscripts(!showTranscripts);
                  playSound('click', soundEnabled);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  showTranscripts
                    ? 'bg-white/15 text-white border-white/20'
                    : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
                }`}
                title="Untertitel anzeigen/verbergen"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  playSound('click', soundEnabled);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Fenstermodus' : 'Vollbild'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleHangUp}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 text-neutral-400 transition-all cursor-pointer"
                title="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Visualizer Area */}
          <div className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: status === 'connected' ? (modelVolume > 0.1 ? 0.35 : 0.18) : 0.1,
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-lime-900/40 via-lime-700/30 to-lime-900/40 blur-[90px]"
              />
            </div>

            {/* Central Fluid Visualizer Orb */}
            <div className="relative flex items-center justify-center w-72 h-72 my-auto">
              {/* User Voice Outer Ripple Rings */}
              {userVolume > 0.05 && (
                <motion.div
                  style={{ scale: userRippleScale }}
                  className="absolute inset-0 rounded-full border border-lime-400/40 bg-lime-500/10 animate-ping pointer-events-none"
                />
              )}

              {/* Model Speaking Multi-Layer Outer Aura */}
              <motion.div
                style={{ scale: orbScale * 1.15 }}
                className="absolute inset-2 rounded-full bg-gradient-to-tr from-lime-600/30 via-lime-600/30 to-lime-600/30 blur-xl transition-transform duration-75"
              />

              {/* Secondary Pulsing Glow */}
              <motion.div
                style={{ scale: orbScale * 1.05 }}
                className="absolute inset-6 rounded-full bg-gradient-to-br from-lime-500/30 via-lime-600/30 to-lime-400/30 blur-md transition-transform duration-75"
              />

              {/* Core Liquid Glass Orb */}
              <motion.div
                style={{ scale: orbScale }}
                animate={{
                  rotate: status === 'connected' ? 360 : 0,
                }}
                transition={{
                  rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.08 },
                }}
                className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-[#131d08] via-[#0d1405] to-[#27380c] border-2 border-[#C5DC57]/50 shadow-[0_0_50px_rgba(197,220,87,0.35)] flex items-center justify-center overflow-hidden"
              >
                {/* Inner Specular Lighting Refractions */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/40 rounded-full" />
                
                {/* Reactive Acoustic Waves inside Core */}
                <div className="relative flex items-center justify-center gap-1.5 z-10">
                  {[40, 70, 100, 75, 45].map((height, i) => {
                    const dynamicHeight = status === 'connected'
                      ? (modelVolume > 0.05 ? height * (0.4 + modelVolume * 0.8) : (userVolume > 0.05 ? height * (0.3 + userVolume * 0.7) : 16))
                      : 12;
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: dynamicHeight }}
                        transition={{ duration: 0.08 }}
                        className="w-1.5 rounded-full bg-gradient-to-t from-[#C5DC57] to-white shadow-[0_0_10px_rgba(197,220,87,0.7)]"
                      />
                    );
                  })}
                </div>
              </motion.div>

              {/* Status Pill beneath Orb */}
              <div className="absolute -bottom-10 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl text-xs font-medium">
                  {status === 'connected' ? (
                    <>
                      <div className={`w-2 h-2 rounded-full ${modelVolume > 0.08 ? 'bg-lime-400 animate-pulse' : (userVolume > 0.08 ? 'bg-emerald-400 animate-pulse' : 'bg-lime-600')}`} />
                      <span className="text-neutral-200">
                        {modelVolume > 0.08 ? 'Dandelious spricht...' : (userVolume > 0.08 ? 'Hört zu...' : 'Bereit zum Sprechen')}
                      </span>
                    </>
                  ) : status === 'connecting' ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-neutral-300">{statusMessage}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-300">{statusMessage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Video Camera Vision Stream Pip (if active) */}
            <div
              className={`absolute top-4 right-4 z-30 transition-all ${
                isCameraActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
              }`}
            >
              <div className="relative w-44 sm:w-52 aspect-video rounded-2xl overflow-hidden border border-lime-500/40 shadow-2xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-lime-300 border border-lime-500/30 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                  Gemini Vision 1 FPS
                </div>
              </div>
            </div>

            {/* Live Subtitles & Transcripts Panel */}
            <AnimatePresence>
              {showTranscripts && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="w-full max-w-2xl max-h-44 mt-auto mb-2 overflow-y-auto px-4 py-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl space-y-2.5 custom-scrollbar"
                >
                  {transcripts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-neutral-500 italic">
                      Sprich einfach drauflos – Gemini Live antwortet in Echtzeit...
                    </div>
                  ) : (
                    transcripts.slice(-6).map((item, idx) => (
                      <div
                        key={`gl-tr-${item.id || idx}-${idx}`}
                        className={`flex items-start gap-2.5 text-xs ${
                          item.sender === 'user' ? 'text-lime-200' : 'text-neutral-200'
                        }`}
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                            item.sender === 'user'
                              ? 'bg-lime-500/20 text-lime-300 border border-lime-500/30'
                              : 'bg-white/10 text-white border border-white/15'
                          }`}
                        >
                          {item.sender === 'user' ? (userNickname || 'Du') : 'Dandelious'}
                        </span>
                        <span className="leading-relaxed">{item.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Call Control Dock */}
          <div className="px-6 py-5 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between z-20">
            {/* Left Action: Save Transcript to Chat */}
            <div>
              {transcripts.length > 0 && onSaveTranscriptToChat && (
                <button
                  type="button"
                  onClick={handleSaveToChat}
                  disabled={isSaved}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium text-white transition-all cursor-pointer active:scale-95"
                  title="Gesprächsprotokoll im Chat speichern"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Im Chat gespeichert!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-neutral-300" />
                      <span>Im Chat speichern</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Center Action Controls: Mic, Camera, Hang Up */}
            <div className="flex items-center gap-4">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isMuted
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                }`}
                title={isMuted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'}
              >
                {isMuted ? <MicOff className="w-6 h-6 stroke-[1.75]" /> : <Mic className="w-6 h-6 stroke-[1.75]" />}
              </button>

              {/* Camera Vision Toggle */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isCameraActive
                    ? 'bg-lime-600/20 border border-lime-500/50 text-lime-300 shadow-[0_0_25px_rgba(147,51,234,0.4)]'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                }`}
                title={isCameraActive ? 'Kamera ausschalten' : 'Kamera (Vision) übertragen'}
              >
                {isCameraActive ? <Video className="w-6 h-6 stroke-[1.75]" /> : <VideoOff className="w-6 h-6 stroke-[1.75]" />}
              </button>

              {/* Red Hang Up Button */}
              <button
                type="button"
                onClick={handleHangUp}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-95"
                title="Gespräch beenden"
              >
                <PhoneOff className="w-6 h-6 stroke-[2]" />
              </button>
            </div>

            {/* Right Spacer */}
            <div className="w-24 text-right">
              <span className="text-[11px] text-neutral-500 font-mono">
                {status === 'connected' ? 'LIVE AKTIV' : 'GETRENNT'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
