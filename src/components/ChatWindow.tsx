import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Square,
  Plus,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Trash2,
  ChevronDown,
  Download,
  Edit2,
  Brain,
  UploadCloud,
  Layers,
  FileText,
  Code,
  X,
  Play,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Wand2,
  AlertTriangle,
  Volume2,
  Share2,
  MoreHorizontal,
  Key,
  PenSquare,
  Mic,
  Image,
  Edit3,
  Globe,
  AudioLines,
  ArrowUp,
  Cpu,
  Pin,
  Users,
  ThumbsUp,
  ThumbsDown,
  UnfoldVertical,
  FoldVertical,
  UserX,
  CopyPlus,
  Orbit,
  BookOpen,
  Palette,
  GraduationCap,
  Upload,
  Monitor,
  Camera,
  Folder,
  MessageSquare,
  Settings,
  Lock,
  GitBranch,
  User as UserIcon,
  Radio,
  PinOff,
  MicOff,
  Loader2,
  Flag,
  HelpCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatSession,
  EngineSettings,
  GemmaModelId,
  AttachedFile,
} from "../types";
import { openHelpLexikon } from "../utils/openHelp";
import { GEMMA_MODELS } from "../data/models";
import { InteractiveQuiz } from "./InteractiveQuiz";
import { playSound } from "../utils/sound";
import { is12hLimitReached, isModelAllowedForTier } from "../utils/usageTracker";
import { ThinkingOrbitSpinner } from "./ThinkingOrbitSpinner";
import { ModelSelectorDropdown } from "./ModelSelectorDropdown";
import { DandeliousLogo } from "./DandeliousLogo";
import { SparklePenIcon } from "./SparklePenIcon";
import { PlusActionDrawer } from "./PlusActionDrawer";
import { DocumentViewerModal } from "./DocumentViewerModal";
import { ImageViewerModal } from "./ImageViewerModal";
import { SmartMarkdownImage } from "./SmartMarkdownImage";
import { MediathekItem, addMediathekItem, extractImagesFromContent } from "../utils/mediaLibrary";
import { DeepResearchSourcesModal, GoogleGIcon } from "./DeepResearchSourcesModal";
import { DeepResearchPlanCard } from "./DeepResearchPlanCard";
import { LiveRecordingSpool } from "./LiveRecordingSpool";
import { RealtimeAudioWaveform } from "./RealtimeAudioWaveform";
import { GeminiLiveClient } from "../utils/geminiLiveClient";
import { formatMemoryGraphForAIContext } from "../lib/memoryGraphService";
import { AudioTranscribeModal } from "./AudioTranscribeModal";
import { ImageGenUnavailableEmbed } from "./ImageGenUnavailableEmbed";

export const TwoLinesIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3.5" width="18" height="17" rx="3.5" />
    <line x1="8.5" y1="3.5" x2="8.5" y2="20.5" />
    <line x1="5.2" y1="8" x2="6.8" y2="8" strokeWidth="1.8" />
    <line x1="5.2" y1="12" x2="6.8" y2="12" strokeWidth="1.8" />
    <line x1="5.2" y1="16" x2="6.8" y2="16" strokeWidth="1.8" />
  </svg>
);

interface ChatWindowProps {
  session: ChatSession | null;
  onSendMessage: (text: string, images?: Array<{ mimeType: string; data: string; name?: string; url?: string }>) => void;
  onStopStreaming: () => void;
  onRegenerate: () => void;
  onClearMessages: () => void;
  isStreaming: boolean;
  selectedModel: GemmaModelId;
  onModelChange: (model: GemmaModelId) => void;
  isTurboEnabled?: boolean;
  onToggleTurbo?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  settings?: EngineSettings;
  fallbackToast?: string | null;
  onOpenSettings?: (subPage?: string) => void;
  onOpenHelpLexicon?: () => void;
  onOpenFeedback?: () => void;
  onSelectView?: (view: "chat" | "dice" | "code" | "image" | "music" | "video") => void;
  onNewChat?: () => void;
  onBranchSession?: (messageId: string) => void;
  onUpdateSession?: (session: ChatSession | ((prev: ChatSession) => ChatSession)) => void;
  onDeleteChat?: (id: string) => void;
  isTourActive?: boolean;
  tourStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  onTourAction?: (action: "send_prompt" | "click_settings") => void;
  onOpenArtifact?: (artifact: {
    id: string;
    title: string;
    language: string;
    content: string;
  }) => void;
  onOpenLive?: () => void;
  isLiveActive?: boolean;
  onCloseLive?: () => void;
  onSaveLiveTranscript?: (text: string, items?: { sender: 'user' | 'model'; text: string; timestamp?: number }[]) => void;
  isMobile?: boolean;
  currentUser?: any;
  onOpenAuth?: () => void;
  onInputPromptChange?: (text: string) => void;
  onVoiceStateChange?: (isRecording: boolean, volume: number) => void;
  isInsidePopupModal?: boolean;
  onClosePopup?: () => void;
}

const getFileExtensionForLang = (lang: string) => {
  const l = (lang || "").toLowerCase();
  if (l.includes("py")) return "py";
  if (l.includes("typescript") || l === "ts") return "ts";
  if (l.includes("javascript") || l === "js") return "js";
  if (l.includes("html")) return "html";
  if (l.includes("css")) return "css";
  if (l.includes("json")) return "json";
  if (l.includes("sql")) return "sql";
  if (l.includes("sh") || l.includes("bash")) return "sh";
  if (l.includes("cpp") || l.includes("c++")) return "cpp";
  if (l.includes("c#") || l.includes("cs")) return "cs";
  if (l.includes("java")) return "java";
  if (l.includes("rust") || l === "rs") return "rs";
  if (l.includes("go")) return "go";
  if (l.includes("markdown") || l === "md") return "md";
  return "txt";
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onClearMessages,
  isStreaming,
  selectedModel,
  onModelChange,
  isTurboEnabled = false,
  onToggleTurbo,
  isSidebarOpen = true,
  onToggleSidebar,
  settings,
  fallbackToast,
  onOpenSettings,
  onOpenHelpLexicon,
  onOpenFeedback,
  onSelectView,
  onNewChat,
  onBranchSession,
  onUpdateSession,
  onDeleteChat,
  onOpenLive,
  isLiveActive = false,
  onCloseLive,
  onSaveLiveTranscript,
  isTourActive = false,
  tourStep = 1,
  onTourAction,
  onOpenArtifact,
  isMobile = false,
  currentUser = null,
  onOpenAuth,
  onInputPromptChange,
  onVoiceStateChange,
  isInsidePopupModal = false,
  onClosePopup,
}) => {
  const soundEnabled = settings?.enableSoundEffects ?? true;
  const [inputPrompt, setInputPrompt] = useState("");

  useEffect(() => {
    onInputPromptChange?.(inputPrompt);
  }, [inputPrompt, onInputPromptChange]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activeMessageDropdown, setActiveMessageDropdown] = useState<string | null>(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState("");
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<
    Record<string, boolean>
  >({});
  const [activePersona, setActivePersona] = useState<
    "standard" | "code" | "kreativ" | "praezise"
  >("standard");
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [moreMenuOpenId, setMoreMenuOpenId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isShareToastOpen, setIsShareToastOpen] = useState(false);
  const [isSendingAnim, setIsSendingAnim] = useState(false);

  // Model reel swipe & drag gesture state
  const [modelDragOffset, setModelDragOffset] = useState(0);
  const isModelDraggingRef = useRef(false);
  const modelStartYRef = useRef(0);
  const modelStartXRef = useRef(0);
  const hasMovedModelRef = useRef(false);
  const CHAT_TUTORIAL_STORAGE_KEY = 'saphire_chat_first_tutorial_seen';
  const [chatTutorialStep, setChatTutorialStep] = useState<1 | 2 | 3 | 4 | null>(null);
  // Tutorial rings disabled to ensure clean borderless buttons without highlighting rings
  
  // Speech Recognition, MediaRecorder & Multimodal Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const [voiceFeedbackStatus, setVoiceFeedbackStatus] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeAnalyserNode, setActiveAnalyserNode] = useState<AnalyserNode | null>(null);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const promptPrefixRef = useRef("");
  const accumulatedTextRef = useRef("");
  const hadSpeechRecognitionSuccessRef = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopVoiceRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    onVoiceStateChange?.(false, 0);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setActiveAnalyserNode(null);
    setRecordingSeconds(0);

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 1. Stop SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // 2. Stop AudioContext
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    // 3. Stop MediaRecorder and grab audio Blob
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    const audioStream = audioStreamRef.current;
    audioStreamRef.current = null;

    let audioBlob: Blob | null = null;
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          }
          resolve();
        };
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    } else if (audioChunksRef.current.length > 0) {
      audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    }

    // Stop all media tracks
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    // Transcribe recorded microphone audio with gemini-3.5-transcribe via /api/transcribe
    if (audioBlob && (audioBlob as Blob).size > 600) {
      setVoiceFeedbackStatus("Transkribiere mit gemini-3.5-transcribe...");
      setIsTranscribing(true);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const audioBase64 = await base64Promise;

        const resp = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(settings?.customApiKey ? { "x-custom-api-key": settings.customApiKey } : {})
          },
          body: JSON.stringify({
            audioBase64,
            mimeType: (audioBlob as Blob).type || "audio/webm",
            language: "de"
          })
        });

        if (!resp.ok) {
          throw new Error(`Transkription HTTP ${resp.status}`);
        }

        const data = await resp.json();
        if (data.transcript && data.transcript.trim()) {
          const prefix = promptPrefixRef.current ? promptPrefixRef.current.trim() + " " : "";
          const newPrompt = (prefix + data.transcript.trim()).trim();
          setInputPrompt(newPrompt);
          if (soundEnabled) playSound("send", true);
        } else if (accumulatedTextRef.current.trim().length > 0) {
          // Fallback to recognized text if gemini returned empty
          const prefix = promptPrefixRef.current ? promptPrefixRef.current.trim() + " " : "";
          setInputPrompt((prefix + accumulatedTextRef.current.trim()).trim());
          if (soundEnabled) playSound("send", true);
        } else {
          setVoiceToast("Keine Sprache erkannt. Bitte erneut versuchen.");
          setTimeout(() => setVoiceToast(null), 3500);
        }
      } catch (err: any) {
        console.warn("AI Transcription error:", err);
        if (accumulatedTextRef.current.trim().length > 0) {
          const prefix = promptPrefixRef.current ? promptPrefixRef.current.trim() + " " : "";
          setInputPrompt((prefix + accumulatedTextRef.current.trim()).trim());
        } else {
          setVoiceToast("Transkription nicht möglich. Bitte erneut versuchen.");
          setTimeout(() => setVoiceToast(null), 3500);
        }
      } finally {
        setIsTranscribing(false);
        setVoiceFeedbackStatus(null);
      }
    } else if (hadSpeechRecognitionSuccessRef.current && accumulatedTextRef.current.trim().length > 0) {
      setVoiceFeedbackStatus(null);
      if (soundEnabled) playSound("send", true);
    } else {
      setVoiceFeedbackStatus(null);
    }
  }, [onVoiceStateChange, soundEnabled, settings?.customApiKey]);

  const startVoiceRecording = async () => {
    if (soundEnabled) playSound("click", true);
    promptPrefixRef.current = inputPrompt;
    accumulatedTextRef.current = "";
    hadSpeechRecognitionSuccessRef.current = false;
    audioChunksRef.current = [];
    setVoiceToast(null);

    // 1. Request microphone stream
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
    } catch (micErr: any) {
      console.error("Microphone access error:", micErr);
      const isDenied = micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError';
      const msg = isDenied
        ? "Mikrofon-Berechtigung verweigert. Bitte im Browser erlauben."
        : "Mikrofon nicht gefunden oder nicht verfügbar.";
      setVoiceToast(msg);
      setTimeout(() => setVoiceToast(null), 5000);
      return;
    }

    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    setVoiceFeedbackStatus("Höre zu... Sprich jetzt");
    onVoiceStateChange?.(true, 0.4);

    // 2. Real-time AudioContext Volume & Equalizer animation
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && stream) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        setActiveAnalyserNode(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!isRecordingRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, Math.max(0.1, avg / 100));
          onVoiceStateChange?.(true, normalized);
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        animFrameRef.current = requestAnimationFrame(checkVolume);
      }
    } catch (ctxErr) {
      console.warn("AudioContext setup notice:", ctxErr);
    }

    // 3. MediaRecorder capture for guaranteed audio transcription
    try {
      if (stream && typeof MediaRecorder !== "undefined") {
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
        const chosenMime = mimeTypes.find(m => m === '' || MediaRecorder.isTypeSupported(m)) || '';
        const recorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      }
    } catch (recInitErr) {
      console.warn("MediaRecorder setup notice:", recInitErr);
    }

    // 4. Web Speech Recognition for instant live typing (if supported & enabled in browser)
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "de-DE";

        recognition.onstart = () => {
          setVoiceFeedbackStatus("Höre zu... Sprich jetzt");
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalChunk = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalChunk) {
            accumulatedTextRef.current = (
              accumulatedTextRef.current ? accumulatedTextRef.current + " " : ""
            ) + finalChunk.trim();
            hadSpeechRecognitionSuccessRef.current = true;
          }

          const prefix = promptPrefixRef.current ? promptPrefixRef.current.trim() + " " : "";
          const fullText = (
            prefix +
            accumulatedTextRef.current +
            (interimTranscript ? (accumulatedTextRef.current ? " " : "") + interimTranscript.trim() : "")
          ).trim();

          if (fullText) {
            setInputPrompt(fullText);
            setVoiceFeedbackStatus("Erkenne Sprache...");
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition notice:", event.error);
          // Don't kill recording on network error or not-allowed; MediaRecorder handles it!
          if (event.error === "no-speech") {
            setVoiceFeedbackStatus("Höre weiter zu...");
          }
        };

        recognition.onend = () => {
          if (isRecordingRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (recErr) {
        console.warn("Speech recognition startup notice:", recErr);
      }
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  useEffect(() => {
    return () => {
      stopVoiceRecording();
    };
  }, [stopVoiceRecording]);

  useEffect(() => {
    const handleGlobalClick = () => setMoreMenuOpenId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Gemini Live in Prompt Bar State
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'error' | 'closed' | 'disconnected'>('closed');
  const [liveStatusText, setLiveStatusText] = useState('');
  const [liveUserVolume, setLiveUserVolume] = useState(0);
  const [liveModelVolume, setLiveModelVolume] = useState(0);
  const [isLiveMuted, setIsLiveMuted] = useState(false);
  const [liveLastTranscript, setLiveLastTranscript] = useState('');
  const [liveSpeaker, setLiveSpeaker] = useState<'user' | 'model' | null>(null);
  const [liveVoice, setLiveVoice] = useState('Zephyr');
  const [isLiveVoiceDropdownOpen, setIsLiveVoiceDropdownOpen] = useState(false);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [isLiveScreenActive, setIsLiveScreenActive] = useState(false);
  const [liveVideoStream, setLiveVideoStream] = useState<MediaStream | null>(null);
  const [liveVideoSource, setLiveVideoSource] = useState<'camera' | 'screen' | null>(null);
  const [isScreenShareModalOpen, setIsScreenShareModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveClientRef = useRef<GeminiLiveClient | null>(null);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && liveVideoStream) {
      node.srcObject = liveVideoStream;
      node.play().catch((err) => console.warn('[ChatWindow] Video play notice:', err));
    }
  }, [liveVideoStream]);

  useEffect(() => {
    if (videoRef.current && liveVideoStream) {
      videoRef.current.srcObject = liveVideoStream;
      videoRef.current.play().catch(() => {});
    }
  }, [liveVideoStream]);

  useEffect(() => {
    if (!isLiveActive) {
      if (liveClientRef.current) {
        const client = liveClientRef.current;
        const transcripts = client.transcripts ? [...client.transcripts] : [];
        if (transcripts.length === 0 && liveLastTranscript) {
          transcripts.push({
            id: `tr-${Date.now()}`,
            sender: liveSpeaker || 'model',
            text: liveLastTranscript,
            timestamp: Date.now(),
          });
        }
        if (transcripts.length > 0) {
          const formatted = transcripts
            .map((t) => `${t.sender === 'user' ? 'Du' : 'Dandelious'}: ${t.text}`)
            .join('\n\n');
          onSaveLiveTranscript?.(formatted, transcripts);
        }
        client.disconnect();
        liveClientRef.current = null;
      }
      setLiveStatus('closed');
      setLiveStatusText('');
      setLiveUserVolume(0);
      setLiveModelVolume(0);
      setLiveLastTranscript('');
      setLiveSpeaker(null);
      setIsLiveVoiceDropdownOpen(false);
      setLiveVideoStream(null);
      setLiveVideoSource(null);
      setIsLiveCameraActive(false);
      setIsLiveScreenActive(false);
      return;
    }

    setLiveStatus('connecting');
    setLiveStatusText('Verbindung wird aufgebaut...');

    const client = new GeminiLiveClient({
      customApiKey: settings?.customApiKey,
      voiceName: liveVoice,
      appLanguage: settings?.appLanguage || 'Deutsch',
      toneStyle: settings?.toneStyle || 'Freundlich',
      userNickname: settings?.userNickname,
      userOccupation: settings?.userOccupation,
      systemInstruction: settings?.customInstructionsDetail,
      memoryContext: formatMemoryGraphForAIContext(),
      onStatusChange: (status, message) => {
        setLiveStatus(status);
        if (message) setLiveStatusText(message);
      },
      onUserVolume: (vol) => {
        setLiveUserVolume(vol);
      },
      onModelVolume: (vol) => {
        setLiveModelVolume(vol);
      },
      onTranscript: (item) => {
        setLiveLastTranscript(item.text);
        setLiveSpeaker(item.sender);
      },
      onVideoStreamChange: (stream, source) => {
        setLiveVideoStream(stream);
        setLiveVideoSource(source);
        setIsLiveCameraActive(source === 'camera');
        setIsLiveScreenActive(source === 'screen');
      },
    });

    liveClientRef.current = client;
    client.connect().catch((err) => {
      console.error('[ChatWindow] Live connect error:', err);
      setLiveStatus('error');
      setLiveStatusText(err.message || 'Verbindung fehlgeschlagen');
    });

    return () => {
      if (liveClientRef.current) {
        const client = liveClientRef.current;
        const transcripts = client.transcripts ? [...client.transcripts] : [];
        if (transcripts.length > 0) {
          const formatted = transcripts
            .map((t) => `${t.sender === 'user' ? 'Du' : 'Dandelious'}: ${t.text}`)
            .join('\n\n');
          onSaveLiveTranscript?.(formatted, transcripts);
        }
        client.disconnect();
        liveClientRef.current = null;
      }
    };
  }, [isLiveActive]); // Removed liveVoice to prevent disconnecting on voice change

  // Watch for liveVoice changes and update the existing client
  useEffect(() => {
    if (isLiveActive && liveClientRef.current) {
      liveClientRef.current.updateVoice(liveVoice);
    }
  }, [liveVoice, isLiveActive]);

  const handleToggleLiveMute = () => {
    if (liveClientRef.current) {
      const nextMute = !isLiveMuted;
      liveClientRef.current.setMute(nextMute);
      setIsLiveMuted(nextMute);
    }
  };

  const handleToggleLiveCamera = async () => {
    if (!liveClientRef.current || liveStatus !== 'connected') {
      setCopiedMessageId("Bitte warte kurz, bis die Verbindung aufgebaut ist.");
      setTimeout(() => setCopiedMessageId(null), 3000);
      return;
    }
    if (isLiveCameraActive) {
      liveClientRef.current.stopVideo();
    } else {
      const res = await liveClientRef.current.startVideo('camera');
      if (!res.success && res.error) {
        setCopiedMessageId(res.error);
        setTimeout(() => setCopiedMessageId(null), 4000);
      }
    }
  };

  const handleToggleLiveScreen = async () => {
    if (!liveClientRef.current || liveStatus !== 'connected') {
      setCopiedMessageId("Bitte warte kurz, bis die Verbindung aufgebaut ist.");
      setTimeout(() => setCopiedMessageId(null), 3000);
      return;
    }
    if (isLiveScreenActive) {
      liveClientRef.current.stopVideo();
      return;
    }

    // Check if getDisplayMedia is supported in the current environment
    const hasGetDisplayMedia = typeof navigator !== 'undefined' 
      && !!navigator.mediaDevices 
      && typeof navigator.mediaDevices.getDisplayMedia === 'function';

    if (!hasGetDisplayMedia) {
      setIsScreenShareModalOpen(true);
      return;
    }

    const res = await liveClientRef.current.startVideo('screen');
    if (!res.success) {
      if (res.error?.includes('unterstützt') || res.error?.includes('Vorschaufenster') || res.error?.includes('blockiert') || res.error?.includes('Iframe')) {
        setIsScreenShareModalOpen(true);
      } else {
        setCopiedMessageId(res.error || "Bildschirmübertragung nicht möglich.");
        setTimeout(() => setCopiedMessageId(null), 4000);
      }
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isPlusDrawerOpen, setIsPlusDrawerOpen] = useState(false);
  const [isTranscribeModalOpen, setIsTranscribeModalOpen] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState<'document' | 'canvas' | 'deep_research' | 'tutor' | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(['google']);
  const [selectedDocumentModalItem, setSelectedDocumentModalItem] = useState<MediathekItem | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<{ url: string; title: string } | null>(null);
  const dragCounterRef = useRef(0);

  const inputModeConfigs = {
    document: {
      id: 'document' as const,
      name: 'Dokument',
      icon: FileText,
      placeholder: 'Worüber soll Dandelious ein Dokument oder Konzept erstellen?',
      prefix: '[Dokument] ',
    },
    canvas: {
      id: 'canvas' as const,
      name: 'Canvas',
      icon: CopyPlus,
      placeholder: 'Lass uns gemeinsam schreiben oder programmieren',
      prefix: '[Canvas-Modus] ',
    },
    deep_research: {
      id: 'deep_research' as const,
      name: 'Deep Research',
      icon: Orbit,
      placeholder: 'Was möchtest du recherchieren?',
      prefix: '[Deep Research] ',
    },
    tutor: {
      id: 'tutor' as const,
      name: 'Lernhilfe',
      icon: BookOpen,
      placeholder: 'Was möchtest du heute lernen?',
      prefix: '[Lernhilfe] ',
    },
  };

  const currentModel =
    GEMMA_MODELS.find((m) => m.id === selectedModel) || GEMMA_MODELS[0];

  // Smart Scroll Lock handling
  const handleScroll = () => {
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    setScrollOffset(scrollTop);
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom > 80) {
      setIsUserScrolledUp(true);
    } else {
      setIsUserScrolledUp(false);
    }
  };

  const scrollToBottom = (force = false) => {
    if ((force || !isUserScrolledUp) && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isStreaming]);

  const [isMultiline, setIsMultiline] = useState(false);

  // Stable Multiline detection with strong Hysteresis:
  // Expanding to multiline card happens when:
  // 1. Text contains an explicit newline (\n)
  // 2. OR text length >= 42 characters
  // Contracting back to single-line capsule ONLY happens when:
  // - There is no newline AND text is cleared or <= 15 characters
  useEffect(() => {
    const hasNewline = inputPrompt.includes('\n');
    const isLong = inputPrompt.trim().length >= 42;

    if (!isMultiline) {
      if (hasNewline || isLong) {
        setIsMultiline(true);
      }
    } else {
      if (!hasNewline && inputPrompt.trim().length <= 15) {
        setIsMultiline(false);
      }
    }
  }, [inputPrompt, isMultiline]);

  // Adjust textarea height smoothly based on content without layout jarring
  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    if (isMultiline) {
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      el.style.height = `${Math.min(Math.max(scrollHeight, 52), 180)}px`;
    } else {
      el.style.height = "auto";
    }

    // Preserve caret position so user never jumps to beginning of text
    if (document.activeElement === el && start !== null && end !== null) {
      el.setSelectionRange(start, end);
    }
  }, [inputPrompt, isMultiline]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    if ((!inputPrompt.trim() && attachedFiles.length === 0) || isStreaming)
      return;
    playSound("send", soundEnabled);
    setIsSendingAnim(true);
    setTimeout(() => setIsSendingAnim(false), 600);

    let finalPrompt = inputPrompt.trim();
    const imagesPayload: Array<{ mimeType: string; data: string; name?: string; url?: string }> = [];

    // Process attached files
    if (attachedFiles.length > 0) {
      const textFiles: string[] = [];
      attachedFiles.forEach((f) => {
        const isImg = f.type === 'image' || f.mimeType?.startsWith('image/') || f.content?.startsWith('data:image/');
        if (isImg) {
          let mime = f.mimeType || 'image/jpeg';
          let base64Data = f.content;
          if (base64Data.includes(';base64,')) {
            const parts = base64Data.split(';base64,');
            mime = parts[0].replace('data:', '') || mime;
            base64Data = parts[1];
          }
          imagesPayload.push({
            mimeType: mime,
            data: base64Data,
            name: f.name,
            url: f.content
          });
        } else {
          textFiles.push(`[Datei: ${f.name}]\n${f.content.slice(0, 4000)}`);
        }
      });

      if (textFiles.length > 0) {
        finalPrompt = textFiles.join("\n\n") + (finalPrompt ? `\n\n${finalPrompt}` : "");
      }
    }

    // Check if submitting in Deep Research mode -> generate interactive Rechercheplan (Screenshot 2)
    if (activeInputMode === 'deep_research') {
      const topic = inputPrompt.trim();
      const title = topic.length > 40 ? topic.slice(0, 38) + "..." : (topic || "Recherche-Übersicht");
      const userMsg = {
        id: `msg-user-${Date.now()}`,
        role: 'user' as const,
        content: `[Deep Research] ${topic}`,
        timestamp: Date.now(),
      };
      
      const asstMsgId = `msg-asst-${Date.now() + 1}`;
      const loadingAsstMsg = {
        id: asstMsgId,
        role: 'assistant' as const,
        content: '',
        isStreaming: true,
        timestamp: Date.now() + 1,
      };

      if (session && onUpdateSession) {
        // Step 1: Add loading message
        onUpdateSession({
          ...session,
          title: session.messages.length === 0 ? title : session.title,
          messages: [...session.messages, userMsg, loadingAsstMsg],
          updatedAt: Date.now(),
        });

        // Step 2: After delay, replace with actual plan
        setTimeout(() => {
          onUpdateSession((prev: any) => {
            if (!prev) return prev;
            const msgs = [...prev.messages];
            const idx = msgs.findIndex((m: any) => m.id === asstMsgId);
            if (idx !== -1) {
              msgs[idx] = {
                ...msgs[idx],
                content: 'Ich habe einen Rechercheplan erstellt. Sag mir, falls ich ihn ändern soll.',
                isStreaming: false,
                deepResearchData: {
                  title,
                  topic,
                  status: 'draft',
                  sources: selectedSources,
                  subtasks: [
                    `(1) Recherche nach allgemeinen Informationen und technischen Daten zu "${title}".`,
                    `(2) Identifiziere die verschiedenen Varianten, Schlüsselmerkmale und Spezifikationen.`,
                    `(3) Sammle historische Kontexte, Spezifikationen und Vergleiche.`,
                    `(4) Strukturiere fundierte Gegenüberstellungen und Quellenzusammenfassungen.`
                  ],
                  estimatedMinutes: 3,
                }
              };
            }
            return { ...prev, messages: msgs, updatedAt: Date.now() };
          });
        }, 2500);
      } else {
        onSendMessage(`[Deep Research] ${topic}`);
      }

      setInputPrompt("");
      setIsMultiline(false);
      setActiveInputMode(null);
      setAttachedFiles([]);
      setIsUserScrolledUp(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    // Attach active input mode context (Canvas, Document, Tutor)
    if (activeInputMode && inputModeConfigs[activeInputMode]) {
      finalPrompt = `${inputModeConfigs[activeInputMode].prefix}${finalPrompt}`;
    }

    // Attach persona mode context if non-standard
    if (
      activePersona === "code" &&
      !finalPrompt.toLowerCase().includes("code")
    ) {
      finalPrompt = `[Modus: Code & Programmierung]\n${finalPrompt}`;
    } else if (activePersona === "kreativ") {
      finalPrompt = `[Modus: Kreativ & Brainstorming]\n${finalPrompt}`;
    } else if (activePersona === "praezise") {
      finalPrompt = `[Modus: Präzise & Analytisch]\n${finalPrompt}`;
    }

    onSendMessage(finalPrompt, imagesPayload.length > 0 ? imagesPayload : undefined);
    setInputPrompt("");
    setIsMultiline(false);
    setActiveInputMode(null);
    setAttachedFiles([]);
    setIsUserScrolledUp(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    if (isTourActive && tourStep === 1) {
      onTourAction?.("send_prompt");
    }
  };

  const handleStartDeepResearch = (targetMsg: any) => {
    playSound("send", soundEnabled);
    const researchTopic = targetMsg.deepResearchData?.topic || targetMsg.deepResearchData?.title || "Recherche";

    // 1. Update the message status to 'running'
    if (session && onUpdateSession) {
      const updatedMessages = session.messages.map((m) => {
        if (m.id === targetMsg.id && m.deepResearchData) {
          return {
            ...m,
            content: 'Geht klar. Während ich recherchiere, kannst du diesen Chat gerne verlassen. Ich sag dir Bescheid, sobald ich fertig bin.',
            deepResearchData: {
              ...m.deepResearchData,
              status: 'running' as const,
            },
          };
        }
        return m;
      });
      onUpdateSession({
        ...session,
        messages: updatedMessages,
      });
    }

    // 2. Trigger the AI Deep Research prompt
    onSendMessage("Recherche starten");
  };

  // Watch for completed deep research stream to store in Mediathek and update card
  useEffect(() => {
    if (!session || isStreaming) return;
    const runningMsgIndex = session.messages.findIndex(m => m.deepResearchData?.status === 'running');
    if (runningMsgIndex >= 0) {
      const runningMsg = session.messages[runningMsgIndex];
      // Find subsequent assistant message containing the generated research dossier
      const nextAsstMsg = session.messages.slice(runningMsgIndex + 1).find(m => m.role === 'assistant' && !m.isStreaming && m.content.length > 50);
      const reportText = nextAsstMsg ? nextAsstMsg.content : (runningMsg.content.length > 50 ? runningMsg.content : '');

      if (reportText && onUpdateSession) {
        const topic = runningMsg.deepResearchData?.title || "Deep Research Bericht";
        // Save to Mediathek
        addMediathekItem({
          type: 'deep_research',
          title: topic,
          content: reportText,
          description: runningMsg.deepResearchData?.topic || topic,
          authorName: 'Dandelious',
          docMetadata: {
            docId: `DR-${Date.now().toString().slice(-4)}`,
            status: 'Fertiggestellt',
            classification: 'Deep Research Dossier',
            lastUpdated: new Date().toLocaleDateString('de-DE'),
          }
        });

        // Update deepResearchData status to completed
        const updated = session.messages.map(m => {
          if (m.id === runningMsg.id && m.deepResearchData) {
            return {
              ...m,
              deepResearchData: {
                ...m.deepResearchData,
                status: 'completed' as const,
                reportContent: reportText,
              }
            };
          }
          return m;
        });

        onUpdateSession({
          ...session,
          messages: updated
        });
      }
    }
  }, [session, isStreaming]);

  const handleTogglePinMessage = (msgId: string) => {
    if (!onUpdateSession || !session) return;
    playSound("click", soundEnabled);
    onUpdateSession(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m)
    }));
  };

  const handleCopyMessage = (id: string, text: string) => {
    playSound("click", soundEnabled);
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleCopyCode = (codeText: string, codeId: string) => {
    playSound("click", soundEnabled);
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(codeId);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleDownloadCode = (codeText: string, lang: string) => {
    playSound("click", soundEnabled);
    const ext = getFileExtensionForLang(lang);
    const blob = new Blob([codeText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saphire_code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const sizeKb = (file.size / 1024).toFixed(1);
          setAttachedFiles((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name,
              size: `${sizeKb} KB`,
              content,
              type: isImage ? 'image' : 'text',
              mimeType: file.type || (isImage ? 'image/jpeg' : 'text/plain')
            },
          ]);
          playSound("pop", soundEnabled);
        }
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const removeAttachedFile = (fileId: string) => {
    playSound("click", soundEnabled);
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const toggleThinkingAccordion = (msgId: string) => {
    playSound("click", soundEnabled);
    setExpandedThinkingIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 h-full h-[100dvh] flex flex-col bg-transparent relative overflow-hidden"
    >
      {/* Global Drag-and-Drop Dropzone Glass Overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-8 border-4 border-dashed border-blue-500/40 m-4 rounded-3xl pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-400/30 flex items-center justify-center text-white mb-4 animate-bounce shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <UploadCloud className="w-10 h-10 text-blue-300" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Datei hier ablegen
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Code, Text- oder Konfigurationsdatei direkt als Glaskarte in
              Dandelious laden
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback Toast Notification */}
      <AnimatePresence>
        {fallbackToast && (
          <motion.div
            key="fallback-toast"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-[#111114] border border-[#4c8dff]/35 text-blue-200 text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none select-none"
          >
            <Zap className="w-3.5 h-3.5 text-[#4c8dff] animate-pulse" />
            <span>{fallbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Black Tutorial Banner (Matching Projects Style) */}
      {chatTutorialStep !== null && (
        <>
          {/* Blocking Backdrop so user can only interact with the highlighted element */}
          <div className="fixed inset-0 z-40 bg-black/40 pointer-events-auto" />

          <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 max-w-md w-[90%] z-50 pointer-events-none">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-center pointer-events-auto relative">
              <p className="text-sm font-medium text-white tracking-tight leading-relaxed">
                {chatTutorialStep === 1 && 'Tippe auf das Plus (+), um Dateien, Bilder oder Werkzeuge anzuhängen.'}
                {chatTutorialStep === 2 && 'Tippe oben rechts auf die drei Punkte (···) für Optionen und Menüs.'}
                {chatTutorialStep === 3 && 'Tippe auf das Live-Symbol, um den Sprach- und Live-Modus zu starten.'}
                {chatTutorialStep === 4 && 'Tippe auf das Modell, um zwischen den KI-Engines zu wechseln.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setChatTutorialStep(null);
                  try {
                    localStorage.setItem(CHAT_TUTORIAL_STORAGE_KEY, 'true');
                  } catch (e) {}
                }}
                className="mt-2 text-[11px] text-[#8e8e93] hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Überspringen
              </button>
            </div>
          </div>
        </>
      )}

      {/* Top Header Bar matching Dandelious prototype */}
      <header className={`top ${chatTutorialStep !== null ? 'z-50' : 'z-30'}`}>
        {/* Left: Sidebar Toggle Button */}
        {isInsidePopupModal ? (
          <button
            type="button"
            data-s="38"
            onClick={() => {
              playSound("click", soundEnabled);
              onClosePopup?.();
            }}
            className="circle lg"
            title="Zurück"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            type="button"
            className="circle lg"
            id="menuBtn"
            aria-label="Menü"
            data-s="38"
            onClick={() => {
              playSound("click", soundEnabled);
              onToggleSidebar?.();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        )}

        {/* Right Header Actions: Unified long liquid-glass pill button (Neuer Chat + 3 Punkte) */}
        <div className="top-right lg" data-s="38">
          <button
            type="button"
            className="circle new"
            id="newChat"
            aria-label="Neuer Chat"
            title="Neuer Chat"
            onClick={() => {
              playSound("click", soundEnabled);
              if (onNewChat) onNewChat();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
              <path fillRule="evenodd" d="M3 21.2 5.21 16.9A9 9 0 1 1 8.77 19.4ZM11 7.2h2v3.8h3.8v2H13v3.8h-2V13H7.2v-2H11Z"/>
            </svg>
          </button>

          <button
            type="button"
            className="circle"
            id="more"
            aria-label="Mehr Aktionen"
            title="Mehr Aktionen"
            onClick={() => {
              playSound("click", soundEnabled);
              setIsHeaderMenuOpen(!isHeaderMenuOpen);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px]">
              <circle cx="5" cy="12" r="2.3"/>
              <circle cx="12" cy="12" r="2.3"/>
              <circle cx="19" cy="12" r="2.3"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Backdrop for More Menu */}
      {isHeaderMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsHeaderMenuOpen(false)}
        />
      )}

      {/* Prototype 3-Dots Dropdown Menu with deeper blur */}
      <div className={`more lg ${isHeaderMenuOpen ? 'open' : ''}`} id="moreMenu" data-s="36" data-b="8">
        <button
          type="button"
          className="item"
          id="optShare"
          onClick={async () => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            try {
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
              }
              setIsShareToastOpen(true);
              setTimeout(() => setIsShareToastOpen(false), 2500);
            } catch (e) {
              console.warn(e);
            }
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </span>
          Unterhaltung teilen
        </button>

        <button
          type="button"
          className="item"
          id="optPin"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            if (session && onUpdateSession) {
              onUpdateSession({
                ...session,
                isPinned: !session.isPinned,
              });
            }
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
          </span>
          {session?.isPinned ? "Pin lösen" : "Anpinnen"}
        </button>

        <button
          type="button"
          className="item"
          id="optRename"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            setRenameValue(session?.title || "");
            setIsRenameModalOpen(true);
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </span>
          Umbenennen
        </button>

        <button
          type="button"
          className="item"
          id="optHelp"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            openHelpLexikon();
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
            </svg>
          </span>
          Hilfe
        </button>

        <button
          type="button"
          className="item"
          id="optFeedback"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            if (onOpenFeedback) onOpenFeedback();
            else if (onOpenSettings) onOpenSettings('feedback');
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
            </svg>
          </span>
          Feedback
        </button>

        <button
          type="button"
          className="item"
          id="optSettings"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            if (onOpenSettings) onOpenSettings();
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </span>
          Einstellungen
        </button>

        <button
          type="button"
          className="item danger"
          id="optDelete"
          onClick={() => {
            setIsHeaderMenuOpen(false);
            playSound("click", soundEnabled);
            if (session?.id && onDeleteChat) {
              onDeleteChat(session.id);
            } else {
              onClearMessages();
            }
          }}
        >
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </span>
          Löschen
        </button>
      </div>

      {/* Main Messages Canvas Area with Smart Scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden px-4 sm:px-16 pt-24 sm:pt-28 pb-36 sm:pb-40 z-10 flex flex-col no-scrollbar"
      >
        <motion.div
          key={session?.id || 'empty-session'}
          initial={{ opacity: 0.82, filter: "blur(14px)", scale: 0.995 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col w-full min-h-full"
        >
          {/* Subtle Ambient Glow for Project Chats */}
          {session?.projectId && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[450px] bg-blue-600/18 rounded-full blur-[160px] pointer-events-none -z-10" />
          )}

        {isLiveActive && liveVideoStream ? (
          /* Live Video Stage (Screen Share or Camera) */
          <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 w-full max-w-5xl mx-auto my-auto relative">
            <div className="relative w-full aspect-video max-h-[62vh] rounded-3xl overflow-hidden bg-black/95 border border-white/15 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex items-center justify-center group">
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />

              {/* Status Header Overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#4c8dff] animate-pulse" />
                  <span>{isLiveScreenActive ? "Bildschirmübertragung aktiv" : "Kamera aktiv"}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isLiveScreenActive) handleToggleLiveScreen();
                    if (isLiveCameraActive) handleToggleLiveCamera();
                  }}
                  className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-red-500/20 text-white/80 hover:text-red-300 backdrop-blur-md border border-white/15 text-xs font-medium transition-colors cursor-pointer"
                >
                  Beenden
                </button>
              </div>

              {/* Live Subtitle HUD right on the screen */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 right-4 max-w-xl mx-auto pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 text-center shadow-2xl"
                >
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-white/50 mb-1">
                    {liveSpeaker === 'model' ? 'Dandelious Live' : liveSpeaker === 'user' ? 'Du' : 'Live Übertragung'}
                  </div>
                  <p className="text-sm sm:text-base font-normal text-white leading-relaxed">
                    {liveLastTranscript ? `"${liveLastTranscript}"` : (isLiveScreenActive ? "Ich sehe deinen Bildschirm und höre zu..." : "Ich sehe deine Kamera und höre zu...")}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : isLiveActive ? (
          /* Live Audio Stage: Large Spoken Text Centered on Screen */
          <div className="flex-1 flex flex-col items-center justify-center relative select-none my-auto p-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center max-w-xl mx-auto space-y-4"
            >
              <h1 className="text-[26px] sm:text-[32px] md:text-[38px] font-normal text-white/95 tracking-tight leading-snug select-none text-center">
                {liveLastTranscript ? (
                  <span className="text-white">"{liveLastTranscript}"</span>
                ) : (
                  <span className="text-white/40">Ich höre dir zu...</span>
                )}
              </h1>
            </motion.div>
          </div>
        ) : (!session?.messages || session.messages.length === 0) ? (
          /* Empty State - Minimalist Hero matching Bild 1:1 */
          <div className="flex-1 flex flex-col items-center justify-center relative select-none my-auto p-4 text-center">

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center max-w-lg mx-auto space-y-4"
            >
              {/* Title: In project chat shows only the project name (e.g. "Projekt 1"), otherwise "Womit fangen wir an?" */}
              <h1 className="text-[28px] sm:text-[34px] md:text-[38px] font-normal text-white/95 tracking-tight leading-snug select-none text-center pt-1">
                {session?.projectName || "Womit fangen wir an?"}
              </h1>
            </motion.div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
            {session.messages.map((msg, index) => {
              if (msg.role === "user") {
                const isEditingThisMsg = editingMessageId === msg.id;

                return (
                  <motion.div
                    key={`user-msg-${msg.id || index}-${index}`}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 26, stiffness: 420 }}
                    className="flex flex-col items-end my-4 transform-gpu group"
                  >
                    {isEditingThisMsg ? (
                      <div className="w-full max-w-[85%] sm:max-w-[75%] bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-3.5 border border-white/15 shadow-xl space-y-2">
                        <textarea
                          value={editPromptText}
                          onChange={(e) => setEditPromptText(e.target.value)}
                          className="w-full bg-transparent text-sm text-white focus:outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={() => {
                              setEditingMessageId(null);
                              onSendMessage(editPromptText);
                            }}
                            className="px-3 py-1 bg-[#4c8dff] text-white text-xs font-semibold rounded-lg hover:bg-[#3b82f6] border-0 cursor-pointer"
                          >
                            Speichern & Senden
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative max-w-[88%] sm:max-w-[78%] bubble-user backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,0.6)] font-normal text-[16.5px] sm:text-[17px] leading-[1.4] border-0">
                        {/* Mode Capsule Chip matching screenshot */}
                        {(() => {
                          let userModeInfo: { name: string; icon: React.ComponentType<{ className?: string }> } | null = null;
                          let cleanText = msg.content || '';
                          if (cleanText.toLowerCase().startsWith('[dokument]')) {
                            userModeInfo = { name: 'Dokument', icon: FileText };
                            cleanText = cleanText.replace(/^\[dokument\]\s*/i, '');
                          } else if (cleanText.toLowerCase().startsWith('[canvas]')) {
                            userModeInfo = { name: 'Canvas', icon: Palette };
                            cleanText = cleanText.replace(/^\[canvas\]\s*/i, '');
                          } else if (cleanText.toLowerCase().startsWith('[deep research]')) {
                            userModeInfo = { name: 'Deep Research', icon: Orbit };
                            cleanText = cleanText.replace(/^\[deep research\]\s*/i, '');
                          } else if (cleanText.toLowerCase().startsWith('[lernhilfe]')) {
                            userModeInfo = { name: 'Lernhilfe', icon: GraduationCap };
                            cleanText = cleanText.replace(/^\[lernhilfe\]\s*/i, '');
                          } else if (cleanText.toLowerCase().startsWith('[modus: code & programmierung]')) {
                            userModeInfo = { name: 'Code', icon: Code };
                            cleanText = cleanText.replace(/^\[modus: code & programmierung\]\s*/i, '');
                          }

                          return (
                            <>
                              {msg.isPinned && (
                                <div className="inline-flex items-center gap-1.5 text-white/90 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 bg-white/10 border border-white/15 shadow-sm float-right ml-2">
                                  <Pin className="w-3 h-3 fill-white/40 stroke-[2]" />
                                  Gepinnt
                                </div>
                              )}
                              {userModeInfo && (
                                <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full mb-2 border border-white/15 shadow-sm">
                                  <userModeInfo.icon className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                                  <span>{userModeInfo.name}</span>
                                </div>
                              )}
                              {msg.images && msg.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2.5">
                                  {msg.images.map((img, imgIdx) => (
                                    <div key={`msg-img-${msg.id || index}-${imgIdx}`} className="relative group/chatimg rounded-2xl overflow-hidden border border-black/15 shadow-md">
                                      <img
                                        src={img.url}
                                        alt={img.name || "Angehängtes Bild"}
                                        onClick={() => setSelectedImagePreview({ url: img.url, title: img.name || 'Angehängtes Bild' })}
                                        className="max-w-full max-h-72 rounded-2xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                      />
                                      <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white flex items-center gap-1 shadow opacity-90 group-hover/chatimg:opacity-100 transition-opacity pointer-events-none">
                                        <Sparkles className="w-2.5 h-2.5 text-blue-300" />
                                        <span>MotionPicture</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="whitespace-pre-wrap selection:bg-black/20 selection:text-black">{cleanText}</div>
                            </>
                          );
                        })()}
                        <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditPromptText(msg.content);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-white cursor-pointer"
                            title="Prompt bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSound('click', soundEnabled);
                                setActiveMessageDropdown(activeMessageDropdown === `more-user-${msg.id}` ? null : `more-user-${msg.id}`);
                              }}
                              className="w-6 h-6 rounded-full bg-black hover:bg-neutral-800 border border-white/15 text-white flex items-center justify-center cursor-pointer shadow-sm transition-all"
                              title="Mehr Optionen"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-white" />
                            </button>

                            <AnimatePresence>
                              {activeMessageDropdown === `more-user-${msg.id}` && (
                                <motion.div
                                  key={`more-user-backdrop-${msg.id}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMessageDropdown(null);
                                  }}
                                />
                              )}
                              {activeMessageDropdown === `more-user-${msg.id}` && (
                                <motion.div
                                  key={`more-user-menu-${msg.id}`}
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 top-full mt-2 z-50 w-56 max-w-[calc(100vw-32px)] p-2 rounded-2xl bg-black shadow-2xl space-y-1 text-sm text-neutral-200 border border-white/15 backdrop-blur-xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                      onClick={() => {
                                        setActiveMessageDropdown(null);
                                        if (onBranchSession) {
                                          onBranchSession(msg.id);
                                        }
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                    >
                                      <GitBranch className="w-4 h-4 text-neutral-300 shrink-0" />
                                      <span className="whitespace-nowrap">Thread erstellen</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMessageDropdown(null);
                                        handleTogglePinMessage(msg.id);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                    >
                                      {msg.isPinned ? (
                                        <>
                                          <PinOff className="w-4 h-4 text-neutral-300 shrink-0" />
                                          <span className="whitespace-nowrap">Kontext entpinnen</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="w-4 h-4 text-neutral-300 shrink-0" />
                                          <span className="whitespace-nowrap">Kontext pinnen</span>
                                        </>
                                      )}
                                    </button>
                                  </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              }

              // Assistant Response
              const isThinkingExpanded =
                expandedThinkingIds[msg.id] ??
                (isTurboEnabled && msg.isStreaming);

              const prevUserMsg = index > 0 ? session?.messages[index - 1] : null;
              const isDocPrompt = prevUserMsg?.content?.includes('[Dokument]') || prevUserMsg?.content?.toLowerCase().includes('dokument erstellen') || prevUserMsg?.content?.toLowerCase().includes('erstelle ein dokument');
              const isDeepResearchPrompt = prevUserMsg?.content?.toLowerCase() === 'recherche starten' || prevUserMsg?.content?.includes('[Deep Research]') || prevUserMsg?.content?.toLowerCase().includes('deep research');
              const hasDocKeywords = msg.content.includes('Projektdossier') || msg.content.includes('Strategiekonzept') || msg.content.includes('Executive Summary') || msg.content.includes('Dokumentenübersicht');
              const isDocCardEligible = (isDocPrompt || isDeepResearchPrompt || hasDocKeywords) && (msg.content.length > 30 || msg.isStreaming);

              let extractedDocTitle = isDeepResearchPrompt ? "Deep Research Übersicht" : "Projekt- und Strategiekonzept";
              if (isDocCardEligible) {
                const titleMatch = msg.content.match(/^#+\s*(.+)$/m) || msg.content.match(/^(?:Titel|Projekt|Dokument|Dossier):\s*(.+)$/im);
                if (titleMatch && titleMatch[1]) {
                  extractedDocTitle = titleMatch[1].replace(/[*_#]/g, '').trim();
                } else if (prevUserMsg?.content) {
                  const clean = prevUserMsg.content.replace(/^\[.*?\]\s*/, '').trim();
                  if (clean) extractedDocTitle = clean.length > 38 ? clean.slice(0, 35) + "..." : clean;
                }
              }

              return (
                <motion.div
                  key={`asst-msg-${msg.id || index}-${index}`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  className="flex flex-col justify-start my-6 space-y-2 transform-gpu"
                >
                  {!msg.content && msg.isStreaming ? (
                    /* 3 Orbiting Dots Spinner */
                    <div className="py-2 px-1">
                      <ThinkingOrbitSpinner />
                    </div>
                  ) : (
                    <div className="w-full text-neutral-100 text-[16.5px] sm:text-[18px] leading-[1.65] space-y-3.5 px-1 tracking-[-0.01em]">
                      {msg.isPinned && (
                        <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full mb-2 bg-amber-500/10 border border-amber-500/20 shadow-sm float-right">
                          <Pin className="w-3 h-3 fill-amber-500/20 stroke-[2]" />
                          Gepinnt
                        </div>
                      )}
                      {/* Deep Research Plan / Live Progress / Completed Card matching Screenshots 1, 2 */}
                      {msg.deepResearchData ? (
                        <div className="space-y-3">
                          <div className="text-[16.5px] sm:text-[18px] leading-[1.65] text-neutral-100 font-normal">
                            {msg.content}
                          </div>
                          <DeepResearchPlanCard
                            title={msg.deepResearchData.title}
                            topic={msg.deepResearchData.topic}
                            status={msg.deepResearchData.status}
                            subtasks={msg.deepResearchData.subtasks}
                            estimatedMinutes={msg.deepResearchData.estimatedMinutes}
                            onStartResearch={() => handleStartDeepResearch(msg)}
                            onOpenReport={() => {
                              setSelectedDocumentModalItem({
                                id: `doc_${msg.id}`,
                                type: 'deep_research',
                                title: msg.deepResearchData?.title || 'Deep Research Übersicht',
                                content: msg.deepResearchData?.reportContent || msg.content,
                                createdAt: msg.timestamp || Date.now(),
                                authorName: 'Dandelious',
                                docMetadata: {
                                  docId: 'DR-2026-X',
                                  status: 'Fertiggestellt',
                                  classification: 'Deep Research Dossier',
                                  lastUpdated: new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
                                },
                              });
                            }}
                            soundEnabled={soundEnabled}
                          />
                        </div>
                      ) : isDocCardEligible ? (
                        msg.isStreaming ? (
                          <div className="bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl border border-white/20 rounded-[28px] p-4 sm:p-5 flex items-center justify-between gap-4 my-3 shadow-xl">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 animate-pulse">
                                {isDeepResearchPrompt ? (
                                  <Orbit className="w-6 h-6 stroke-[1.5]" />
                                ) : (
                                  <FileText className="w-6 h-6 stroke-[1.5]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[15px] sm:text-[16px] font-semibold text-white truncate">
                                  {extractedDocTitle}
                                </h4>
                                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-ping" />
                                  <span>{isDeepResearchPrompt ? 'Recherche wird durchgeführt...' : 'Dokument wird erstellt...'}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="card lg my-3"
                            data-s="34"
                            onClick={() => {
                              playSound("click", soundEnabled);
                              setSelectedDocumentModalItem({
                                id: `doc_${msg.id}`,
                                type: isDeepResearchPrompt ? 'deep_research' : 'document',
                                title: extractedDocTitle,
                                content: msg.content,
                                createdAt: msg.timestamp || Date.now(),
                                authorName: "Dandelious",
                                docMetadata: {
                                  docId: "PRJ-2026-X4",
                                  status: "Fertiggestellt",
                                  classification: "Intern / Konzeptphase",
                                  lastUpdated: new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
                                },
                              });
                            }}
                          >
                            <div className="thumb">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                                <rect x="3" y="7" width="14" height="11" rx="2.5"/>
                                <path d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3H19a2 2 0 0 1 2 2v8a2.5 2.5 0 0 1-2.5 2.5H17"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate">{extractedDocTitle}</h3>
                              <p>{isDeepResearchPrompt ? 'Recherche-Bericht' : 'Dokument'}&nbsp; DOCX</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="reply">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                          p({ children }: any) {
                            return <div className="text-[16.5px] sm:text-[18px] leading-[1.65] my-2 text-neutral-100 font-normal">{children}</div>;
                          },
                          pre({ children }: any) {
                            return <>{children}</>;
                          },
                          h1({ children }) {
                            return <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 mb-2 tracking-tight">{children}</h1>;
                          },
                          h2({ children }) {
                            return <h2 className="text-lg sm:text-xl font-semibold text-white mt-3.5 mb-2 tracking-tight">{children}</h2>;
                          },
                          h3({ children }) {
                            return <h3 className="text-base sm:text-lg font-semibold text-white mt-3 mb-1.5">{children}</h3>;
                          },
                          ul({ children }) {
                            return <ul className="list-disc list-inside space-y-1.5 my-2.5 text-[16.5px] sm:text-[18px] text-neutral-100 leading-relaxed">{children}</ul>;
                          },
                          ol({ children }) {
                            return <ol className="list-decimal list-inside space-y-1.5 my-2.5 text-[16.5px] sm:text-[18px] text-neutral-100 leading-relaxed">{children}</ol>;
                          },
                          li({ children }) {
                            return <li className="text-[16.5px] sm:text-[18px] text-neutral-100">{children}</li>;
                          },
                          img({ src, alt }: any) {
                            return (
                              <SmartMarkdownImage
                                src={src}
                                alt={alt}
                                onOpenViewer={(imgUrl, title) => {
                                  setSelectedImagePreview({
                                    url: imgUrl,
                                    title: title || 'Großansicht'
                                  });
                                }}
                              />
                            );
                          },
                          table({ children }) {
                            return (
                              <div className="my-4 overflow-x-auto rounded-2xl border border-white/10 bg-[#0e0e11] shadow-lg">
                                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          th({ children }) {
                            return (
                              <th className="px-4 py-2.5 bg-white/5 border-b border-white/10 font-semibold text-white">
                                {children}
                              </th>
                            );
                          },
                          td({ children }) {
                            return (
                              <td className="px-4 py-2 border-b border-white/5 text-neutral-300">
                                {children}
                              </td>
                            );
                          },
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: any) {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
                            const codeString = String(children).replace(
                              /\n$/,
                              "",
                            );
                            const langName = match ? match[1] : "code";
                            const codeId = `${msg.id}-${langName}-${codeString.length}`;

                            if (!inline && (langName === "json" || langName === "quiz" || codeString.includes('"questions"'))) {
                              try {
                                const cleanJson = codeString.trim();
                                const parsedQuiz = JSON.parse(cleanJson);
                                if (parsedQuiz && (parsedQuiz.quiz || Array.isArray(parsedQuiz.questions)) && Array.isArray(parsedQuiz.questions) && parsedQuiz.questions.length > 0) {
                                  return <InteractiveQuiz data={parsedQuiz} />;
                                }
                              } catch (e) {
                                // Fallback to standard code rendering
                              }
                            }

                            return !inline ? (
                              <div className="my-4 rounded-2xl bg-[#0e0e11] border border-white/10 overflow-hidden font-mono text-xs shadow-lg group">
                                <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/10 text-neutral-400">
                                  <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Code className="w-3.5 h-3.5 text-neutral-300" />
                                    {langName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {/* Canvas Preview Trigger Button */}
                                    {onOpenArtifact && (
                                      <button
                                        onClick={() => {
                                          playSound("click", soundEnabled);
                                          onOpenArtifact({
                                            id: codeId,
                                            title: `${langName.toUpperCase()} Code`,
                                            language: langName,
                                            content: codeString,
                                          });
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg apple-glass-btn text-[11px] text-white hover:text-white transition-colors cursor-pointer bg-white/10 border border-white/20"
                                        title="Im Canvas Side-Panel öffnen & live ausführen"
                                      >
                                        <Play className="w-3 h-3 text-white" />{" "}
                                        Canvas
                                      </button>
                                    )}

                                    <button
                                      onClick={() =>
                                        handleCopyCode(codeString, codeId)
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg apple-glass-btn text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                      {copiedCodeIndex === codeId ? (
                                        <>
                                          <Check className="w-3 h-3 text-white" />{" "}
                                          Kopiert
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" /> Kopieren
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDownloadCode(codeString, langName)
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg apple-glass-btn text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                                      title="Als Datei herunterladen"
                                    >
                                      <Download className="w-3 h-3 text-neutral-400" />{" "}
                                      Speichern
                                    </button>
                                  </div>
                                </div>
                                <div className="p-4 overflow-x-auto text-neutral-200 leading-relaxed font-mono">
                                  <code>{children}</code>
                                </div>
                              </div>
                            ) : (
                              <code
                                className="bg-white/10 text-neutral-200 px-1.5 py-0.5 rounded text-[13px] font-mono border border-white/5"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      </div>
                      )}

                      {/* Typing cursor */}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-2 ml-1.5 bg-white rounded-full align-middle" />
                      )}

                      {/* Image Generation Unavailable Embed */}
                      {(msg.imageGenEmbed || (msg.content && msg.content.includes("kann leider keine Bilder erstellen") && msg.content.includes("reines Sprachmodell"))) && (
                        <ImageGenUnavailableEmbed
                          originalPrompt={msg.imageGenEmbed?.originalPrompt || (index > 0 ? session?.messages[index - 1]?.content : undefined)}
                          onNavigateToImageStudio={() => onSelectView?.('image')}
                          onGeneratePrompt={(prompt) => onSendMessage(prompt)}
                        />
                      )}

                      {/* Interactive API Key / Action Card for Errors */}
                      {!msg.isStreaming &&
                        (msg.error ||
                          (msg.content &&
                            (msg.content.includes("API-Key") ||
                              msg.content.includes("API-Schlüssel") ||
                              msg.content.includes("unterbrochen")))) && (
                          <div className="mt-3.5 relative overflow-hidden p-4 rounded-2xl bg-white/[0.03] backdrop-blur-[50px] border border-white/15 text-xs sm:text-sm text-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xl backdrop-blur-md">
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Key className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-white tracking-tight">
                                  Dandelious API-Schlüssel erforderlich
                                </p>
                                <p className="text-[11px] text-neutral-400">
                                  Trage deinen kostenlosen Context AI Studio
                                  API-Key ein, um völlig unbegrenzt mit Dandelious
                                  zu chatten.
                                </p>
                              </div>
                            </div>
                            {onOpenSettings && (
                              <button
                                onClick={() => {
                                  playSound("click", soundEnabled);
                                  onOpenSettings("api");
                                }}
                                className="relative z-10 px-4 py-2 rounded-xl bg-[#4c8dff] text-white font-semibold text-xs hover:bg-[#3b82f6] border-0 transition-all shrink-0 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>API-Key eintragen</span>
                              </button>
                            )}
                          </div>
                        )}

                      {/* Clean Minimal Frameless Message Action Icons */}
                      {!msg.isStreaming && msg.content && (
                        <div className="pt-2 mt-2 flex items-center gap-1.5">
                          <button
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
                            title="Gut"
                          >
                            <ThumbsUp className="w-4 h-4 stroke-[1.8]" />
                          </button>
                          <button
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
                            title="Schlecht"
                          >
                            <ThumbsDown className="w-4 h-4 stroke-[1.8]" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playSound("click", soundEnabled);
                                setMoreMenuOpenId(
                                  moreMenuOpenId === `refresh-${msg.id}` ? null : `refresh-${msg.id}`,
                                );
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
                              title="Wiederholen & Anpassen"
                            >
                              <RefreshCw className="w-4 h-4 stroke-[1.8]" />
                            </button>
                            
                            <AnimatePresence>
                              {moreMenuOpenId === `refresh-${msg.id}` && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-0 top-full mt-1.5 z-40 w-56 p-2 rounded-2xl bg-black/95 shadow-2xl space-y-1 text-sm text-neutral-200 border border-white/10 backdrop-blur-3xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setMoreMenuOpenId(null);
                                      playSound("click", soundEnabled);
                                      onSendMessage("Schreibe die vorherige Antwort länger und ausführlicher.");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                  >
                                    <UnfoldVertical className="w-4 h-4 stroke-[1.8] text-neutral-300" />
                                    <span>Länger</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMoreMenuOpenId(null);
                                      playSound("click", soundEnabled);
                                      onSendMessage("Fasse die vorherige Antwort prägnanter und kürzer zusammen.");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                  >
                                    <FoldVertical className="w-4 h-4 stroke-[1.8] text-neutral-300" />
                                    <span>Kürzer</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMoreMenuOpenId(null);
                                      playSound("click", soundEnabled);
                                      onSendMessage("Schreibe die vorherige Antwort neutral und sachlich um.");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                  >
                                    <UserX className="w-4 h-4 stroke-[1.8] text-neutral-300" />
                                    <span>Nicht personalisieren</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMoreMenuOpenId(null);
                                      playSound("click", soundEnabled);
                                      if (index === session.messages.length - 1) {
                                        onRegenerate();
                                      } else {
                                        onSendMessage("Bitte generiere eine andere Antwort.");
                                      }
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className="w-4 h-4 stroke-[1.8] text-neutral-300" />
                                    <span>Wiederholen</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button
                            onClick={() => {
                              playSound("click", soundEnabled);
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(msg.content);
                                setCopiedMessageId(msg.id);
                                setTimeout(
                                  () => setCopiedMessageId(null),
                                  2000,
                                );
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
                            title="Teilen & Exportieren"
                          >
                            <Share2 className="w-4 h-4 stroke-[1.8]" />
                          </button>

                          <button
                            onClick={() =>
                              handleCopyMessage(msg.id, msg.content)
                            }
                            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
                            title="Kopieren"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-4 h-4 text-white stroke-[2.5]" />
                            ) : (
                              <Copy className="w-4 h-4 stroke-[1.8]" />
                            )}
                          </button>

                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                playSound('click', soundEnabled);
                                setActiveMessageDropdown(activeMessageDropdown === `more-${msg.id}` ? null : `more-${msg.id}`);
                              }}
                              className="w-7 h-7 rounded-full bg-black hover:bg-neutral-800 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                              title="Mehr Optionen"
                            >
                              <MoreHorizontal className="w-4 h-4 text-white stroke-[1.8]" />
                            </motion.button>

                            <AnimatePresence>
                              {activeMessageDropdown === `more-${msg.id}` && (
                                <motion.div
                                  key={`more-asst-backdrop-${msg.id}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMessageDropdown(null);
                                  }}
                                />
                              )}
                              {activeMessageDropdown === `more-${msg.id}` && (
                                <motion.div
                                  key={`more-asst-menu-${msg.id}`}
                                  initial={{ opacity: 0, scale: 0.72, y: -12, filter: "blur(10px)" }}
                                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                                  exit={{ opacity: 0, scale: 0.8, y: -8, filter: "blur(6px)", transition: { duration: 0.14 } }}
                                  transition={{ type: "spring", damping: 22, stiffness: 380, mass: 0.6 }}
                                  style={{ transformOrigin: "top right" }}
                                  className="absolute right-0 top-full mt-2 z-50 w-56 max-w-[calc(100vw-32px)] p-2 rounded-2xl bg-black shadow-2xl space-y-1 text-sm text-neutral-200 border border-white/15 backdrop-blur-2xl origin-top-right overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                    <motion.button
                                      whileHover={{ x: 3 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setActiveMessageDropdown(null);
                                        if (onBranchSession) {
                                          onBranchSession(msg.id);
                                        }
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                    >
                                      <GitBranch className="w-4 h-4 text-neutral-300 shrink-0" />
                                      <span className="whitespace-nowrap">Thread erstellen</span>
                                    </motion.button>

                                    <motion.button
                                      whileHover={{ x: 3 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        setActiveMessageDropdown(null);
                                        handleTogglePinMessage(msg.id);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 hover:text-white text-left transition-colors cursor-pointer"
                                    >
                                      {msg.isPinned ? (
                                        <>
                                          <PinOff className="w-4 h-4 text-neutral-300 shrink-0" />
                                          <span className="whitespace-nowrap">Kontext entpinnen</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="w-4 h-4 text-neutral-300 shrink-0" />
                                          <span className="whitespace-nowrap">Kontext pinnen</span>
                                        </>
                                      )}
                                    </motion.button>
                                  </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {/* Live mode active and there are messages: display transcript at the bottom of the stream */}
            {isLiveActive && session.messages && session.messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col items-center justify-center p-6 border-t border-white/10"
              >
                <p className="text-xl sm:text-2xl font-normal text-white/90 text-center tracking-tight leading-snug">
                  {liveLastTranscript ? `"${liveLastTranscript}"` : <span className="text-white/40">Ich höre dir zu...</span>}
                </p>
              </motion.div>
            )}

            {/* Bottom clearance spacer so last message & actions stay clearly accessible */}
            <div className="h-16 sm:h-20 shrink-0 pointer-events-none" />
            <div ref={messagesEndRef} />
          </div>
        )}
        </motion.div>
      </div>

      {/* Composer Area matching Liquid Glass Prototype */}
      <div
        className={`composer-wrap ${
          chatTutorialStep !== null ? 'z-50' : 'z-20'
        }`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 14px) + var(--viewport-offset-bottom, 0px))",
        }}
      >
        <div className="w-full max-w-[680px] relative pointer-events-auto z-10 flex flex-col gap-2">
          {/* Dynamic File-Preview Glass Cards */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
              >
                {attachedFiles.map((file, fileIdx) => (
                  <div
                    key={`att-file-${file.id || fileIdx}-${fileIdx}`}
                    className="relative w-[110px] h-[60px] rounded-2xl shadow-md shrink-0 border border-white/20 overflow-hidden bg-white/5"
                  >
                    {file.type === 'image' || file.content?.startsWith('data:image/') ? (
                      <img src={file.content} alt={file.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[#141418] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-neutral-300" />
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachedFile(file.id)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="image/*,.txt,.js,.ts,.py,.json,.md,.css,.html,.sql,.sh,.pdf,.doc,.docx"
          />
          <input
            type="file"
            ref={photoInputRef}
            onChange={handleFileUpload}
            className="hidden"
            multiple
            accept="image/*"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
            capture="environment"
          />

          {/* Fallback Toast / Error Notification Banner */}
          <AnimatePresence>
            {fallbackToast && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="relative overflow-hidden p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-[50px] border border-white/15 text-neutral-200 text-xs font-medium backdrop-blur-md flex items-center justify-between shadow-2xl"
              >
                <div className="relative z-10 flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span>{fallbackToast}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Listening Active Indicator Pill with Waveform & Status */}
          <AnimatePresence>
            {(isRecording || isTranscribing) && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-black/80 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-medium backdrop-blur-2xl shadow-xl select-none"
              >
                <div className="flex items-center gap-2">
                  {isTranscribing ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  ) : (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                  )}
                  <span className="text-white font-medium">
                    {voiceFeedbackStatus || (isTranscribing ? "Transkribiere mit KI..." : "Höre zu... Sprich jetzt")}
                  </span>
                </div>

                {!isTranscribing && (
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-32 h-5 flex items-center">
                      <RealtimeAudioWaveform
                        analyser={activeAnalyserNode}
                        isRecording={isRecording}
                        height={18}
                        barCount={20}
                        theme="sapphire"
                      />
                    </div>
                    <span className="font-mono text-[11px] text-blue-300 font-semibold min-w-[32px]">
                      {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className="ml-1 px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Fertig</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Voice Toast Banner (e.g. Permission denied, no speech) */}
          <AnimatePresence>
            {voiceToast && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                className="flex items-center gap-2 mb-2 px-4 py-2 rounded-full bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-medium shadow-xl backdrop-blur-xl select-none"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{voiceToast}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isLiveActive ? (
            /* Live Mode Floating Bar */
            <div className="w-full flex items-center justify-center gap-2.5 sm:gap-4 py-2 select-none">
              {/* Camera Circle Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playSound("click", soundEnabled);
                  handleToggleLiveCamera();
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl border ${
                  isLiveCameraActive 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.35)]" 
                    : "bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10 hover:bg-[#252630] text-white border-white/10"
                }`}
                title={isLiveCameraActive ? "Kamera beenden" : "Kamera anmachen"}
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </motion.button>

              {/* Screen Share Circle Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playSound("click", soundEnabled);
                  handleToggleLiveScreen();
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl border ${
                  isLiveScreenActive 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.35)]" 
                    : "bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10 hover:bg-[#252630] text-white border-white/10"
                }`}
                title={isLiveScreenActive ? "Bildschirmübertragung beenden" : "Bildschirm teilen"}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <path d="M12 16V8" />
                  <path d="M8 12l4-4 4 4" />
                </svg>
              </motion.button>

              {/* Center Pill */}
              <div className="h-12 sm:h-14 px-4 sm:px-6 rounded-full bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 flex items-center justify-center shadow-xl min-w-[140px] sm:min-w-[190px] max-w-[260px]">
                <LiveRecordingSpool
                  status={liveStatus === 'disconnected' ? 'closed' : liveStatus}
                  statusText={liveStatusText}
                  userVolume={liveUserVolume}
                  modelVolume={liveModelVolume}
                />
              </div>

              {/* Mic Circle Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playSound("click", soundEnabled);
                  handleToggleLiveMute();
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl border ${
                  isLiveMuted 
                    ? "bg-neutral-800 text-neutral-400 border-white/5" 
                    : "bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10 hover:bg-[#252630] text-white border-white/10"
                }`}
                title={isLiveMuted ? "Mikrofon einschalten" : "Stummschalten"}
              >
                {isLiveMuted ? (
                  <MicOff className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                ) : (
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                )}
              </motion.button>

              {/* End Live 'X' Circle Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  playSound("click", soundEnabled);
                  onCloseLive?.();
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 hover:bg-[#252630] text-white flex items-center justify-center transition-all cursor-pointer shadow-xl"
                title="Live Gespräch beenden"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </motion.button>
            </div>
          ) : (
            /* Liquid Glass Composer Card matching Dandelious prototype */
            <div className="composer lg" data-s="36" data-tour-target="prompt-input">
              {/* Attachment spring menu backdrop */}
              {isAttachMenuOpen && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsAttachMenuOpen(false)}
                />
              )}

              {/* Spring Attachment Pop-up Menu */}
              <div className={`menu lg ${isAttachMenuOpen ? 'open' : ''}`} id="menu" data-s="36" data-b="8">
                <button
                  type="button"
                  className="item"
                  id="actCam"
                  onClick={() => {
                    setIsAttachMenuOpen(false);
                    playSound("click", soundEnabled);
                    cameraInputRef.current?.click();
                  }}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm8 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
                    </svg>
                  </span>
                  Kamera
                </button>

                <button
                  type="button"
                  className="item"
                  id="actPhoto"
                  onClick={() => {
                    setIsAttachMenuOpen(false);
                    playSound("click", soundEnabled);
                    photoInputRef.current?.click();
                  }}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H5V5h14v14ZM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5Z"/>
                    </svg>
                  </span>
                  Fotos
                </button>

                <button
                  type="button"
                  className="item"
                  id="actFile"
                  onClick={() => {
                    setIsAttachMenuOpen(false);
                    playSound("click", soundEnabled);
                    fileInputRef.current?.click();
                  }}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm4 18H6V4h7v5h5v11Z"/>
                    </svg>
                  </span>
                  Dateien
                </button>

                <button
                  type="button"
                  className="item"
                  id="actLibrary"
                  onClick={() => {
                    setIsAttachMenuOpen(false);
                    playSound("click", soundEnabled);
                    setIsPlusDrawerOpen(true);
                  }}
                >
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6Zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm0 14H8V4h12v12Z"/>
                    </svg>
                  </span>
                  Mediathek
                </button>
              </div>

              {/* Active Mode Chip (if user selected Document, Deep Research, etc.) */}
              {activeInputMode && (
                <div className="flex items-center justify-between mb-1">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border-0 text-white text-xs sm:text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                    {React.createElement(inputModeConfigs[activeInputMode].icon, { className: "w-3.5 h-3.5 text-white stroke-[2]" })}
                    <span>{inputModeConfigs[activeInputMode].name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setActiveInputMode(null);
                      }}
                      className="w-4 h-4 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 ml-1 cursor-pointer active:scale-90 border-0"
                      title="Modus schließen"
                    >
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input Textarea */}
              <textarea
                ref={textareaRef}
                rows={isMultiline ? 3 : 2}
                value={inputPrompt}
                disabled={chatTutorialStep !== null}
                spellCheck={settings?.autoSpellCheck ?? true}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeInputMode
                    ? inputModeConfigs[activeInputMode].placeholder
                    : isRecording
                      ? "Höre zu... sprich einfach drauflos"
                      : "Frag Dandelious…"
                }
                aria-label="Nachricht"
              />

              {/* Deep Research Extra Actions if active */}
              {activeInputMode === 'deep_research' && (
                <div className="flex items-center gap-2 pt-2 mb-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      setIsSourcesModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer border border-white/5"
                  >
                    <GoogleGIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Quellen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer border border-white/5"
                  >
                    <Upload className="w-3.5 h-3.5 text-neutral-300 stroke-[2] shrink-0" />
                    <span>Dateien</span>
                  </button>
                </div>
              )}

              {/* Bottom Row inside Composer */}
              <div className="row">
                {/* Group Capsule: Attachment Paperclip + 3D Model Wheel */}
                <div className="grp lg" data-s="30">
                  <button
                    type="button"
                    aria-label="Anhängen"
                    id="attach"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      setIsAttachMenuOpen(!isAttachMenuOpen);
                    }}
                    className="circle"
                    title="Anhängen"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.88"/>
                    </svg>
                  </button>

                  {/* 3D Vertical Perspective Model Reel with Touch & Mouse Swipe Gestures */}
                  <div
                    className="model select-none touch-none"
                    id="model"
                    title="Wischen oder Klicken, um Modell zu wechseln"
                    style={{ touchAction: 'none', cursor: 'grab' }}
                    onPointerDown={(e) => {
                      isModelDraggingRef.current = true;
                      modelStartYRef.current = e.clientY;
                      modelStartXRef.current = e.clientX;
                      hasMovedModelRef.current = false;
                      setModelDragOffset(0);
                      try {
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      } catch {}
                    }}
                    onPointerMove={(e) => {
                      if (!isModelDraggingRef.current) return;
                      const dy = e.clientY - modelStartYRef.current;
                      const dx = e.clientX - modelStartXRef.current;
                      if (Math.abs(dy) > 3 || Math.abs(dx) > 3) {
                        hasMovedModelRef.current = true;
                      }
                      const curIdx = selectedModel === 'dandelious-lite' ? 0 : selectedModel === 'dandelious-pro' ? 2 : 1;
                      const effective = Math.abs(dx) > Math.abs(dy) ? -dx : dy;
                      let damped = effective;
                      if ((curIdx === 0 && effective > 0) || (curIdx === 2 && effective < 0)) {
                        damped = effective * 0.35;
                      }
                      setModelDragOffset(damped);
                    }}
                    onPointerUp={(e) => {
                      if (!isModelDraggingRef.current) return;
                      isModelDraggingRef.current = false;
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {}

                      const curIdx = selectedModel === 'dandelious-lite' ? 0 : selectedModel === 'dandelious-pro' ? 2 : 1;
                      const MODELS = ['Lite', 'Plus', 'Pro'] as const;
                      const MODEL_IDS: GemmaModelId[] = ['dandelious-lite', 'dandelious-plus', 'dandelious-pro'];

                      if (hasMovedModelRef.current && Math.abs(modelDragOffset) >= 12) {
                        // Swipe recognized
                        if (modelDragOffset < -12) {
                          // Swiped UP -> Next model
                          const nextIdx = Math.min(MODELS.length - 1, curIdx + 1);
                          if (nextIdx !== curIdx) {
                            playSound("click", soundEnabled);
                            onModelChange(MODEL_IDS[nextIdx]);
                          }
                        } else if (modelDragOffset > 12) {
                          // Swiped DOWN -> Prev model
                          const nextIdx = Math.max(0, curIdx - 1);
                          if (nextIdx !== curIdx) {
                            playSound("click", soundEnabled);
                            onModelChange(MODEL_IDS[nextIdx]);
                          }
                        }
                      } else {
                        // Quick click / tap: top half moves back, bottom half advances, middle cycles
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        let nextIdx = curIdx;
                        if (y < rect.height * 0.38) {
                          nextIdx = Math.max(0, curIdx - 1);
                        } else if (y > rect.height * 0.62) {
                          nextIdx = Math.min(MODELS.length - 1, curIdx + 1);
                        } else {
                          nextIdx = (curIdx + 1) % MODELS.length;
                        }
                        if (nextIdx !== curIdx) {
                          playSound("click", soundEnabled);
                          onModelChange(MODEL_IDS[nextIdx]);
                        }
                      }
                      setModelDragOffset(0);
                    }}
                    onPointerCancel={() => {
                      isModelDraggingRef.current = false;
                      setModelDragOffset(0);
                    }}
                    onWheel={(e) => {
                      const curIdx = selectedModel === 'dandelious-lite' ? 0 : selectedModel === 'dandelious-pro' ? 2 : 1;
                      const MODEL_IDS: GemmaModelId[] = ['dandelious-lite', 'dandelious-plus', 'dandelious-pro'];
                      if (e.deltaY > 12) {
                        const nextIdx = Math.min(2, curIdx + 1);
                        if (nextIdx !== curIdx) {
                          playSound("click", soundEnabled);
                          onModelChange(MODEL_IDS[nextIdx]);
                        }
                      } else if (e.deltaY < -12) {
                        const nextIdx = Math.max(0, curIdx - 1);
                        if (nextIdx !== curIdx) {
                          playSound("click", soundEnabled);
                          onModelChange(MODEL_IDS[nextIdx]);
                        }
                      }
                    }}
                  >
                    <div className="mreel pointer-events-none" id="mreel">
                      {(['Lite', 'Plus', 'Pro'] as const).map((m, i) => {
                        const curIdx = selectedModel === 'dandelious-lite' ? 0 : selectedModel === 'dandelious-pro' ? 2 : 1;
                        const fractionalPos = curIdx - (modelDragOffset / 44);
                        const d = i - fractionalPos;
                        const deg = -d * 50;
                        const op = Math.max(0, 1 - Math.min(Math.abs(d), 1) * 0.7);
                        return (
                          <div
                            key={m}
                            className="mi"
                            style={{
                              transform: `perspective(160px) rotateX(${deg}deg)`,
                              opacity: op,
                              transition: modelDragOffset !== 0 ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.4, 1), opacity 0.22s ease',
                            }}
                          >
                            {m}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mdots pointer-events-none" id="mdots">
                      {[0, 1, 2].map((i) => {
                        const curIdx = selectedModel === 'dandelious-lite' ? 0 : selectedModel === 'dandelious-pro' ? 2 : 1;
                        const fractionalPos = curIdx - (modelDragOffset / 44);
                        const activeDotIdx = Math.max(0, Math.min(2, Math.round(fractionalPos)));
                        return <i key={i} className={i === activeDotIdx ? 'on' : ''} />;
                      })}
                    </div>
                  </div>
                </div>

                {/* Voice Mic Button */}
                <button
                  type="button"
                  data-s="32"
                  id="mic"
                  aria-label="Diktieren"
                  onClick={toggleVoiceRecording}
                  disabled={isTranscribing}
                  className={`circle lg ${isRecording ? '!text-blue-400 !bg-blue-600/30' : ''}`}
                  title={isTranscribing ? "Transkribiere..." : isRecording ? "Spracheingabe beenden" : "Diktieren"}
                >
                  {isTranscribing ? (
                    <Loader2 className="w-5 h-5 stroke-[2] animate-spin text-[#4c8dff]" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
                      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/>
                    </svg>
                  )}
                </button>

                {/* Spacer */}
                <span className="spacer" />

                {/* Send / Stop Button */}
                {isStreaming ? (
                  <button
                    type="button"
                    data-s="34"
                    aria-label="Stoppen"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      onStopStreaming();
                    }}
                    className="send lg !bg-red-600/50 hover:!bg-red-600/70 !text-white border-0"
                    title="Stoppen"
                  >
                    <Square className="w-4 h-4 fill-white text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-s="34"
                    aria-label="Senden"
                    id="chatwindow-send-btn"
                    onClick={() => {
                      if (inputPrompt.trim().length > 0) {
                        handleSubmit();
                      } else {
                        playSound("click", soundEnabled);
                        textareaRef.current?.focus();
                      }
                    }}
                    className="send lg blue border-0"
                    title="Senden"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]">
                      <path fillRule="evenodd" d="M3 21.2 5.21 16.9A9 9 0 1 1 8.77 19.4ZM12 6.4l4.4 4.4-1.4 1.4-2-2V17h-2v-6.8l-2 2-1.4-1.4Z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Prototype Hint Disclaimer */}
          <p className="hint">Dandelious ist eine KI und kann Fehler machen.</p>
        </div>
      </div>

      {/* Plus Action Drawer Modal */}
      <PlusActionDrawer
        isOpen={isPlusDrawerOpen}
        onClose={() => setIsPlusDrawerOpen(false)}
        onSelectPhoto={() => photoInputRef.current?.click()}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectFile={() => fileInputRef.current?.click()}
        onSelectDocument={() => {
          setActiveInputMode('document');
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        onSelectCanvas={() => {
          setActiveInputMode('canvas');
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        onSelectDeepResearch={() => {
          setActiveInputMode('deep_research');
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        onSelectTutor={() => {
          setActiveInputMode('tutor');
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        onSelectTranscribe={() => {
          setIsTranscribeModalOpen(true);
        }}
        soundEnabled={soundEnabled}
      />

      {/* Audio Transcription Modal powered by gemini-3.5-transcribe */}
      <AudioTranscribeModal
        isOpen={isTranscribeModalOpen}
        onClose={() => setIsTranscribeModalOpen(false)}
        onInsertToChat={(text) => {
          setInputPrompt((prev) => (prev ? prev.trim() + " " + text : text));
          setTimeout(() => textareaRef.current?.focus(), 80);
        }}
        customApiKey={settings?.customApiKey}
        soundEnabled={soundEnabled}
      />

      {/* Deep Research Sources Modal (matching Screenshot 3) */}
      <DeepResearchSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        selectedSources={selectedSources}
        onToggleSource={(sourceId) => {
          setSelectedSources((prev) =>
            prev.includes(sourceId)
              ? prev.length > 1
                ? prev.filter((s) => s !== sourceId)
                : prev
              : [...prev, sourceId]
          );
        }}
        onApply={() => setIsSourcesModalOpen(false)}
        soundEnabled={soundEnabled}
      />

      {/* Fullscreen Document Viewer Modal */}
      {selectedDocumentModalItem && (
        <DocumentViewerModal
          documentItem={selectedDocumentModalItem}
          onClose={() => setSelectedDocumentModalItem(null)}
          onAskSaphire={(question) => {
            onSendMessage(question);
          }}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Fullscreen Image Lightbox Viewer Modal */}
      <ImageViewerModal
        isOpen={!!selectedImagePreview}
        imageUrl={selectedImagePreview?.url || null}
        title={selectedImagePreview?.title}
        onClose={() => setSelectedImagePreview(null)}
      />

      {/* Share Toast */}
      <AnimatePresence>
        {isShareToastOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl border border-white/10 text-white text-sm font-medium shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-[#4c8dff]" />
            <span>Link in die Zwischenablage kopiert!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Chat Modal */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-semibold text-white">Chat umbenennen</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (session && onUpdateSession && renameValue.trim()) {
                      onUpdateSession({ ...session, title: renameValue.trim() });
                    }
                    setIsRenameModalOpen(false);
                  }
                }}
                className="w-full bg-white/[0.03] backdrop-blur-[50px] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Name der Unterhaltung"
                autoFocus
              />
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (session && onUpdateSession && renameValue.trim()) {
                      onUpdateSession({ ...session, title: renameValue.trim() });
                    }
                    setIsRenameModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Screen Share Guidance Modal */}
        {isScreenShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScreenShareModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-md rounded-3xl bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl border border-white/15 p-6 shadow-2xl z-10 text-white select-none space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <svg className="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <path d="M12 16V8" />
                  <path d="M8 12l4-4 4 4" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">Bildschirmübertragung</h3>
                <p className="text-sm text-neutral-300 leading-relaxed mt-1.5">
                  Web-Browser erlauben die Freigabe des Bildschirms aus Sicherheitsgründen nur in einem separaten Browser-Tab und nicht innerhalb eingebetteter Vorschaufenster (Iframes) oder auf Mobilgeräten.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsScreenShareModalOpen(false);
                    window.open(window.location.href, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                >
                  <span>In neuem Tab öffnen</span>
                  <svg className="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsScreenShareModalOpen(false);
                    handleToggleLiveCamera();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Stattdessen Kamera verwenden</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsScreenShareModalOpen(false)}
                  className="w-full py-2 px-4 rounded-xl text-neutral-400 hover:text-white transition-colors text-xs font-medium cursor-pointer text-center"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
