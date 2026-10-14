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
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isShareToastOpen, setIsShareToastOpen] = useState(false);
  const [isSendingAnim, setIsSendingAnim] = useState(false);
  const CHAT_TUTORIAL_STORAGE_KEY = 'saphire_chat_first_tutorial_seen';
  const [chatTutorialStep, setChatTutorialStep] = useState<1 | 2 | 3 | 4 | null>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(CHAT_TUTORIAL_STORAGE_KEY);
      if (!seen && !isInsidePopupModal) {
        setChatTutorialStep(1);
      }
    } catch (e) {}
  }, [isInsidePopupModal]);
  
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
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-8 border-4 border-dashed border-lime-500/40 m-4 rounded-3xl pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-lime-500/10 border border-lime-400/30 flex items-center justify-center text-white mb-4 animate-bounce shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <UploadCloud className="w-10 h-10 text-lime-300" />
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
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-[#111114] border border-emerald-500/35 text-emerald-300 text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none select-none"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
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

      {/* Top Header Bar (Matching Screenshot 1:1) */}
      <header className={`absolute top-0 left-0 right-0 h-32 pt-[max(env(safe-area-inset-top,0px),12px)] px-4 sm:px-6 flex items-start justify-between bg-gradient-to-b from-black via-black/80 to-transparent shrink-0 pointer-events-none ${
        chatTutorialStep !== null ? 'z-50' : 'z-30'
      }`}>
        {/* Left: Sidebar Toggle Button or Popup Back Button + Model Selector right next to it */}
        <div className="flex items-center gap-2 sm:gap-3 z-10 pointer-events-auto">
          {isInsidePopupModal ? (
            <button
              type="button"
              onClick={() => {
                playSound("click", soundEnabled);
                onClosePopup?.();
              }}
              className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white cursor-pointer flex items-center justify-center transition-all shadow-md active:scale-95 border border-white/5 shrink-0"
              title="Zurück zum Projekt"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playSound("click", soundEnabled);
                onToggleSidebar?.();
              }}
              className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white cursor-pointer flex items-center justify-center transition-all shadow-md active:scale-95 border border-white/5 shrink-0"
              title="Seitenleiste umschalten"
              id="chat-header-sidebar-btn"
            >
              <TwoLinesIcon className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Model Selector aligned to the LEFT next to sidebar button */}
          {!isLiveActive ? (
            <div className={chatTutorialStep === 4 ? "relative z-50 pointer-events-auto ring-4 ring-[#C5DC57]/80 shadow-[0_0_30px_rgba(197,220,87,0.95)] animate-pulse rounded-full" : ""}>
              <ModelSelectorDropdown
                selectedModelId={selectedModel}
                onSelectModel={(modelId) => {
                  onModelChange(modelId);
                  if (chatTutorialStep === 4) {
                    playSound('chime', soundEnabled);
                    setChatTutorialStep(null);
                    try {
                      localStorage.setItem(CHAT_TUTORIAL_STORAGE_KEY, 'true');
                    } catch (e) {}
                  }
                }}
                isOpen={isModelDropdownOpen}
                onToggle={() => {
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                  if (chatTutorialStep === 4) {
                    playSound('chime', soundEnabled);
                    setChatTutorialStep(null);
                    try {
                      localStorage.setItem(CHAT_TUTORIAL_STORAGE_KEY, 'true');
                    } catch (e) {}
                  }
                }}
                onClose={() => setIsModelDropdownOpen(false)}
                soundEnabled={soundEnabled}
                userTier={settings?.userTier}
              />
            </div>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playSound("click", soundEnabled);
                  setIsLiveVoiceDropdownOpen(!isLiveVoiceDropdownOpen);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#242426] hover:bg-[#2c2c2e] rounded-full text-white font-medium text-sm transition-all shadow-md border border-white/5 active:scale-95 cursor-pointer"
              >
                <span>Stimme: {liveVoice}</span>
                <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isLiveVoiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isLiveVoiceDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLiveVoiceDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full mt-2 left-0 w-48 bg-black rounded-[24px] border border-white/15 p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      {['Aoede', 'Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'].map(voice => (
                        <button
                          key={voice}
                          onClick={() => {
                            playSound("click", soundEnabled);
                            setLiveVoice(voice);
                            setIsLiveVoiceDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-[16px] text-sm font-medium transition-colors cursor-pointer ${liveVoice === voice ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                        >
                          {voice}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Header Actions: Neuer Chat Pen Button + Connected Profile Avatar & 3-Dots Menu Pill Button + "API besorgen" Button */}
        <div className="relative z-10 flex flex-col items-end gap-1.5 pointer-events-auto">
          {isInsidePopupModal ? (
            <button
              type="button"
              onClick={() => {
                playSound("click", soundEnabled);
                onClosePopup?.();
              }}
              className="w-8 h-8 rounded-full bg-[#C5DC57] hover:bg-[#b8d049] active:bg-[#a6bd3a] text-black flex items-center justify-center transition-colors cursor-pointer shadow-md shrink-0 active:scale-95 mt-1"
              title="Fertig"
            >
              <Check className="w-4 h-4 stroke-[3] text-black" />
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Neuer Chat Button - Eigener runder grauer Button */}
              <button
                type="button"
                onClick={() => {
                  playSound("click", soundEnabled);
                  if (onNewChat) onNewChat();
                }}
                className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white flex items-center justify-center cursor-pointer shadow-md transition-all shrink-0 active:scale-95 border border-white/5"
                title="Neuer Chat"
                id="chat-header-new-chat-btn"
              >
                <PenSquare className="w-5 h-5 text-white stroke-[1.8]" />
              </button>

              {/* Profil / Account Button - Eigener runder grauer Button */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    playSound("click", soundEnabled);
                    onOpenSettings?.('account');
                  }}
                  className="w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] flex items-center justify-center overflow-hidden cursor-pointer shadow-md transition-all shrink-0 active:scale-95 border border-white/5 p-1"
                  title={currentUser.displayName || currentUser.email || 'Mein Account'}
                  id="chat-header-profile-btn"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Profil'}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-lime-800 via-lime-700 to-lime-600 text-white text-xs font-semibold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (chatTutorialStep !== null) return;
                    playSound("click", soundEnabled);
                    onOpenAuth?.();
                  }}
                  className={`w-10 h-10 rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white flex items-center justify-center transition-all shrink-0 shadow-md active:scale-95 border border-white/5 ${
                    chatTutorialStep !== null ? 'opacity-30 pointer-events-none' : 'cursor-pointer'
                  }`}
                  title="Mit Google anmelden"
                  id="chat-header-profile-btn"
                >
                  <UserIcon className="w-5 h-5 text-white stroke-[1.8]" />
                </button>
              )}

              {/* 3-Punkte Button - Eigener runder grauer Button */}
              <button
                type="button"
                onClick={() => {
                  playSound("click", soundEnabled);
                  setIsHeaderMenuOpen(!isHeaderMenuOpen);
                  if (chatTutorialStep === 2) {
                    setChatTutorialStep(3);
                  }
                }}
                className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center shrink-0 border border-white/5 shadow-md transition-all active:scale-95 ${
                  chatTutorialStep === 2
                    ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_25px_rgba(197,220,87,0.95)] animate-pulse relative z-50 pointer-events-auto'
                    : 'bg-[#242426] hover:bg-[#2c2c2e] text-white'
                }`}
                title="Optionen"
                id="dandelious-three-dots-btn"
              >
                <MoreHorizontal className={`w-5 h-5 ${chatTutorialStep === 2 ? 'text-black' : 'text-white'}`} />
              </button>
            </div>
          )}

          {/* "API besorgen" Button: Placed underneath Account and 3-dots, subtle and discreet with white text */}
          <AnimatePresence>
            {!isInsidePopupModal && (!settings?.customApiKey || settings.customApiKey.trim().length < 6) && (
              <motion.button
                initial={{ opacity: 0, y: -4, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                type="button"
                onClick={() => {
                  playSound("click", soundEnabled);
                  onOpenSettings?.('engine');
                }}
                className="mt-1 px-3 py-1 rounded-full bg-black hover:bg-neutral-900 text-white text-[12px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.7)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border-0 select-none group"
                title="Google AI Studio API-Key einrichten"
              >
                <Key className="w-3 h-3 text-white/80 group-hover:text-white transition-colors shrink-0" />
                <span className="text-white/90 group-hover:text-white transition-colors">API besorgen</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Dandelious 3-dots Dropdown Menu (matching Bild 2 exactly) */}
          <AnimatePresence>
            {isHeaderMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsHeaderMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.72, y: -16, filter: "blur(14px)" }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0, 
                    filter: "blur(0px)",
                    transition: {
                      type: "spring",
                      damping: 22,
                      stiffness: 360,
                      mass: 0.65,
                      staggerChildren: 0.035,
                      delayChildren: 0.02
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: -10, 
                    filter: "blur(8px)",
                    transition: { duration: 0.16, ease: "easeInOut" }
                  }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-full mt-2 z-50 w-72 bg-black rounded-[28px] shadow-2xl p-2 border border-white/10 backdrop-blur-md overflow-hidden"
                >
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.03,
                          delayChildren: 0.02
                        }
                      }
                    }}
                    className="space-y-0.5"
                  >
                    {isLiveActive ? (
                      <>
                        {/* Kamera teilen */}
                        <motion.button
                          variants={{
                            hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                          }}
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            playSound("click", soundEnabled);
                            handleToggleLiveCamera();
                          }}
                          className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 transition-colors cursor-pointer ${isLiveCameraActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-200 hover:text-white hover:bg-white/10'}`}
                        >
                          <Camera className={`w-5 h-5 shrink-0 stroke-[1.8] ${isLiveCameraActive ? 'text-emerald-400' : 'text-neutral-300'}`} />
                          <span className="text-[15px] font-normal">{isLiveCameraActive ? "Kamera beenden" : "Kamera teilen"}</span>
                        </motion.button>

                        {/* Bildschirm teilen */}
                        <motion.button
                          variants={{
                            hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                            visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                          }}
                          type="button"
                          onClick={() => {
                            setIsHeaderMenuOpen(false);
                            playSound("click", soundEnabled);
                            handleToggleLiveScreen();
                          }}
                          className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 transition-colors cursor-pointer ${isLiveScreenActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-200 hover:text-white hover:bg-white/10'}`}
                        >
                          <Monitor className={`w-5 h-5 shrink-0 stroke-[1.8] ${isLiveScreenActive ? 'text-emerald-400' : 'text-neutral-300'}`} />
                          <span className="text-[15px] font-normal">{isLiveScreenActive ? "Bildschirm teilen beenden" : "Bildschirm teilen"}</span>
                        </motion.button>
                      </>
                    ) : (
                      <>
                        {/* Unterhaltung teilen */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
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
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                      <span className="text-[15px] font-normal">Unterhaltung teilen</span>
                    </motion.button>

                    {/* Anpinnen */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        playSound("click", soundEnabled);
                        if (session && onUpdateSession) {
                          onUpdateSession({
                            ...session,
                            isPinned: !session.isPinned
                          });
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Pin className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                      <span className="text-[15px] font-normal">
                        {session?.isPinned ? "Pin lösen" : "Anpinnen"}
                      </span>
                    </motion.button>

                    {/* Umbenennen (only for normal chats) */}
                    {(!session?.projectId) && (
                      <motion.button
                        variants={{
                          hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                          visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                        }}
                        type="button"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          playSound("click", soundEnabled);
                          setRenameValue(session?.title || "");
                          setIsRenameModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                        <span className="text-[15px] font-normal">Umbenennen</span>
                      </motion.button>
                    )}

                    {/* Hilfe */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        playSound("click", soundEnabled);
                        openHelpLexikon();
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <HelpCircle className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                        <span className="text-[15px] font-normal">Hilfe</span>
                      </div>
                      <Share2 className="w-3.5 h-3.5 text-neutral-400 rotate-45" />
                    </motion.button>

                    {/* Feedback */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        playSound("click", soundEnabled);
                        if (onOpenFeedback) {
                          onOpenFeedback();
                        } else if (onOpenSettings) {
                          onOpenSettings('feedback');
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Flag className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                      <span className="text-[15px] font-normal">Feedback</span>
                    </motion.button>

                    {/* Einstellungen */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        playSound("click", soundEnabled);
                        if (onOpenSettings) onOpenSettings();
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Settings className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                      <span className="text-[15px] font-normal">Einstellungen</span>
                    </motion.button>

                    {/* Löschen */}
                    <motion.button
                      variants={{
                        hidden: { opacity: 0, y: -8, filter: "blur(4px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 20, stiffness: 350 } }
                      }}
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        playSound("click", soundEnabled);
                        if (session?.id && onDeleteChat) {
                          onDeleteChat(session.id);
                        } else {
                          onClearMessages();
                        }
                      }}
                      className="w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 text-neutral-200 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5 text-neutral-300 shrink-0 stroke-[1.8]" />
                      <span className="text-[15px] font-normal">Löschen</span>
                    </motion.button>
                      </>
                  )}
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

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
          {/* Soft Ambient Glow: Limettengrün for Project Chats */}
          {session?.projectId ? (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[450px] bg-[#C5DC57]/18 rounded-full blur-[160px] pointer-events-none -z-10" />
          ) : (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[360px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none -z-10" />
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
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
            {/* Background Limettengrün Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] sm:w-[740px] h-[380px] ${session?.projectId ? 'bg-[#C5DC57]/25' : 'bg-[#C5DC57]/15'} rounded-full blur-[140px] pointer-events-none -z-10`} />

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
                            className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200 cursor-pointer"
                          >
                            Speichern & Senden
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative max-w-[85%] sm:max-w-[75%] bg-[#C5DC57] text-[#0e1603] rounded-3xl px-5 py-3.5 text-sm sm:text-base border border-[#b4cc45] leading-relaxed shadow-[0_4px_22px_rgba(197,220,87,0.22)] font-medium">
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
                                <div className="inline-flex items-center gap-1.5 text-[#131f05] text-xs font-semibold px-2.5 py-1 rounded-full mb-2 bg-black/15 border border-black/15 shadow-sm float-right ml-2">
                                  <Pin className="w-3 h-3 fill-black/30 stroke-[2]" />
                                  Gepinnt
                                </div>
                              )}
                              {userModeInfo && (
                                <div className="inline-flex items-center gap-2 bg-black/15 text-[#101b04] text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full mb-2 border border-black/10 shadow-sm">
                                  <userModeInfo.icon className="w-3.5 h-3.5 text-[#101b04] stroke-[2.2]" />
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
                                        <Sparkles className="w-2.5 h-2.5 text-lime-300" />
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
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMessageDropdown(null);
                                    }}
                                  />
                                  <motion.div
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
                                </>
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
                          <div className="bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl border border-white/10 hover:border-white/20 rounded-[28px] p-4 sm:p-5 flex items-center justify-between gap-4 my-3 shadow-xl transition-all">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                                {isDeepResearchPrompt ? (
                                  <Orbit className="w-6 h-6 stroke-[1.5] text-neutral-300" />
                                ) : (
                                  <FileText className="w-6 h-6 stroke-[1.5]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[15px] sm:text-[16px] font-semibold text-white truncate">
                                  {extractedDocTitle}
                                </h4>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                  {new Date(msg.timestamp || Date.now()).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
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
                              className="px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <span>Öffnen</span>
                            </button>
                          </div>
                        )
                      ) : (
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
                      )}

                      {/* Typing cursor */}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-2 ml-1.5 bg-white rounded-full align-middle" />
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
                                className="relative z-10 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-all shrink-0 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-1.5"
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
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMessageDropdown(null);
                                    }}
                                  />
                                  <motion.div
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
                                </>
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

      {/* Floating Pill Input Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-3 sm:px-4 pt-4 transition-all duration-150 ease-out pointer-events-none ${
          chatTutorialStep !== null ? 'z-50' : 'z-20'
        }`}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 14px) + var(--viewport-offset-bottom, 0px))",
        }}
      >
        {/* Soft subtle base gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent -z-20 pointer-events-none" />

        <div className="max-w-xl sm:max-w-2xl mx-auto relative space-y-2 pointer-events-auto z-10">
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
                    className="relative w-[110px] h-[60px] rounded-full shadow-md shrink-0 border border-white/20 overflow-hidden"
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
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
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

          {/* Conditional Layout: Mode Card (matching screenshot 1:1) vs Normal Compact Pill */}
          {!isLiveActive && activeInputMode ? (
            /* Mode Selected Card Layout (Grey with smooth dynamic focus) */
            <div
              data-tour-target="prompt-input"
              className="w-full bg-[#242426] border border-white/10 rounded-[34px] sm:rounded-[38px] p-4 sm:p-4.5 shadow-[0_14px_45px_rgba(0,0,0,0.7)] flex flex-col justify-between min-h-[148px] sm:min-h-[158px] transition-all duration-300 focus-within:border-white/20 focus-within:ring-2 focus-within:ring-white/10"
            >
              {/* Top Row: Mode Chip with Close Button */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xl border border-white/10 text-white text-sm font-medium px-3.5 py-1.5 rounded-full shadow-sm">
                  {React.createElement(inputModeConfigs[activeInputMode].icon, { className: "w-4 h-4 text-white stroke-[2]" })}
                  <span>{inputModeConfigs[activeInputMode].name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setActiveInputMode(null);
                    }}
                    className="w-5 h-5 rounded-full bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0 ml-1 cursor-pointer active:scale-90"
                    title="Modus schließen"
                  >
                    <X className="w-3 h-3 stroke-[3]" />
                  </button>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/15 border border-lime-400/30">
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                    <div className="w-20 h-5 flex items-center">
                      <RealtimeAudioWaveform
                        analyser={activeAnalyserNode}
                        isRecording={isRecording}
                        height={18}
                        barCount={16}
                        theme="sapphire"
                      />
                    </div>
                    <span className="text-[11px] font-mono text-lime-300 font-semibold">
                      {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle Row: Textarea */}
              <div className="my-1.5">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={inputPrompt}
                  spellCheck={settings?.autoSpellCheck ?? true}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputModeConfigs[activeInputMode].placeholder}
                  className="w-full bg-transparent text-[15px] sm:text-[16px] text-white placeholder-neutral-400 focus:outline-none px-1 font-normal resize-none scrollbar-none py-1 leading-relaxed max-h-36"
                  autoFocus
                />
              </div>

              {/* Bottom Row: + on Left, Mic & Send on Right */}
              <div className="flex items-center justify-between pt-1">
                {/* Plus Button */}
                <button
                  type="button"
                  onClick={() => {
                    playSound("click", soundEnabled);
                    setIsPlusDrawerOpen(true);
                    if (chatTutorialStep === 1) {
                      setChatTutorialStep(2);
                    }
                  }}
                  className={`w-10 h-10 rounded-full border border-white/5 shadow-md flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 ${
                    chatTutorialStep === 1
                      ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_30px_rgba(197,220,87,0.95)] animate-pulse relative z-50 pointer-events-auto'
                      : chatTutorialStep !== null
                        ? 'bg-[#2c2c2e] text-neutral-500 opacity-25 pointer-events-none'
                        : 'bg-[#2c2c2e] hover:bg-[#343438] text-neutral-300 hover:text-white'
                  }`}
                  title="Aktionen & Anhänge"
                  id="chatwindow-plus-btn"
                >
                  <Plus className={`w-6 h-6 stroke-[1.75] ${chatTutorialStep === 1 ? 'text-black' : ''}`} />
                </button>

                {/* Right Actions: Mic + Send Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 relative active:scale-95 ${
                      isRecording
                        ? "bg-lime-600/35 text-lime-200 border border-lime-400/50 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                        : "bg-[#2c2c2e] hover:bg-[#343438] text-neutral-300 hover:text-white border border-white/5 shadow-md"
                    }`}
                    title={isRecording ? "Spracheingabe beenden" : "Spracheingabe starten"}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-lime-500/30 animate-ping pointer-events-none" />
                    )}
                    <Mic className="w-5.5 h-5.5 stroke-[1.8]" />
                  </button>

                  {isStreaming ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.88 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      onClick={() => {
                        playSound("click", soundEnabled);
                        onStopStreaming();
                      }}
                      className="w-11 h-11 rounded-full bg-[#2c2c2e] hover:bg-[#343438] text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 border border-white/10"
                      title="Stoppen"
                    >
                      <Square className="w-4 h-4 fill-white text-white" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      id="chatwindow-send-btn"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.86 }}
                      animate={isSendingAnim ? { scale: 0.85 } : { scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      onClick={handleSubmit}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 relative overflow-hidden border active:scale-95 ${
                        inputPrompt.trim().length > 0
                          ? 'bg-[#C5DC57] text-[#0f1704] font-semibold border-[#C5DC57]/40 shadow-[0_0_20px_rgba(197,220,87,0.4)]'
                          : 'bg-[#2c2c2e] hover:bg-[#343438] text-white border-white/5'
                      }`}
                      title="Senden"
                    >
                      <motion.div
                        animate={isSendingAnim ? { y: [-1, -6, 2, 0], opacity: [1, 0.4, 1] } : {}}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Extra Buttons for Deep Research: Quellen & Dateien matching Screenshot 4 */}
              {activeInputMode === 'deep_research' && (
                <div className="flex items-center gap-2.5 pt-3 mt-1.5 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      setIsSourcesModalOpen(true);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-full bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl hover:bg-white/10 text-white flex items-center justify-center gap-2 text-[14px] font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98] border border-white/5"
                  >
                    <GoogleGIcon className="w-4 h-4 shrink-0" />
                    <span>Quellen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click", soundEnabled);
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-full bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl hover:bg-white/10 text-white flex items-center justify-center gap-2 text-[14px] font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98] border border-white/5"
                  >
                    <Upload className="w-4 h-4 text-neutral-300 stroke-[2] shrink-0" />
                    <span>Dateien</span>
                  </button>
                </div>
              )}
            </div>
          ) : isLiveActive ? (
            /* Live Mode Floating Bar matching IMG_0907.jpeg with white audio waveform */
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

              {/* Screen Share Circle Button (Icon matching IMG_0907.jpeg) */}
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

              {/* Center Pill: Rounded Capsule with White Tonspur */}
              <div className="h-12 sm:h-14 px-4 sm:px-6 rounded-full bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10 border border-white/10 flex items-center justify-center shadow-xl min-w-[140px] sm:min-w-[190px] max-w-[260px]">
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
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.04] backdrop-blur-[60px] shadow-[0_0_30px_rgba(255,255,255,0.05)] border-white/10 hover:bg-[#252630] text-white flex items-center justify-center transition-all cursor-pointer shadow-xl border border-white/10"
                title="Live Gespräch beenden"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </motion.button>
            </div>
          ) : (
            /* Main Prompt Input Area: Standalone Outside Plus Button + Dark Transparent Blurred Bar */
            <div className="w-full flex flex-col items-center">
              {/* Voice Listening Active Indicator Pill with Waveform & Status */}
              <AnimatePresence>
                {(isRecording || isTranscribing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className="flex items-center justify-center gap-3 mb-2.5 px-4 py-2 rounded-full bg-[#1b102e]/95 border border-lime-400/40 text-lime-200 text-xs sm:text-sm font-medium backdrop-blur-2xl shadow-[0_8px_32px_rgba(109,40,217,0.45)] z-20 select-none"
                  >
                    <div className="flex items-center gap-2">
                      {isTranscribing ? (
                        <Loader2 className="w-3.5 h-3.5 text-lime-400 animate-spin" />
                      ) : (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
                        </span>
                      )}
                      <span className="text-white font-semibold tracking-wide">
                        {voiceFeedbackStatus || (isTranscribing ? "Transkribiere mit KI..." : "Höre zu... Sprich jetzt")}
                      </span>
                    </div>

                    {/* Animated Real-Time Audio Waveform */}
                    {!isTranscribing && (
                      <div className="flex items-center gap-2.5 px-1">
                        <div className="w-28 sm:w-36 h-6 flex items-center">
                          <RealtimeAudioWaveform
                            analyser={activeAnalyserNode}
                            isRecording={isRecording}
                            height={22}
                            barCount={24}
                            theme="sapphire"
                          />
                        </div>
                        <span className="font-mono text-[11px] text-lime-300 font-semibold tracking-wider min-w-[32px]">
                          {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Done / Fertig Button */}
                    {!isTranscribing && (
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className="ml-1 px-2.5 py-1 rounded-full bg-lime-600 hover:bg-lime-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Fertig</span>
                      </button>
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

              <div
                data-tour-target="prompt-input"
                className={`w-full flex ${isMultiline ? "items-end" : "items-center"} gap-2.5 sm:gap-3 transition-all duration-300 ease-out`}
              >
                {/* Standalone Plus Button outside the bar (matching user request) */}
                <motion.button
                  type="button"
                  id="chatwindow-plus-btn"
                  whileHover={{ scale: 1.06, rotate: 45 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  onClick={() => {
                    playSound("click", soundEnabled);
                    setIsPlusDrawerOpen(true);
                    if (chatTutorialStep === 1) {
                      setChatTutorialStep(2);
                    }
                  }}
                  className={`w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-full border border-white/5 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md active:scale-95 ${
                    chatTutorialStep === 1
                      ? 'bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_30px_rgba(197,220,87,0.95)] animate-pulse relative z-50 pointer-events-auto'
                      : chatTutorialStep !== null
                        ? 'bg-[#242426] text-neutral-500 opacity-25 pointer-events-none'
                        : 'bg-[#242426] hover:bg-[#2c2c2e] text-neutral-200 hover:text-white hover:border-white/15 hover:shadow-lg'
                  }`}
                  title="Aktionen & Anhänge"
                >
                  <Plus className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[2] ${chatTutorialStep === 1 ? 'text-black' : ''}`} />
                </motion.button>

                {/* Unified Persistent Prompt Capsule/Card: Grey #242426 with dynamic focus glow & elevation */}
                <div
                  className={`flex-1 bg-[#242426] hover:bg-[#28282b] focus-within:bg-[#28282b] border border-white/5 focus-within:border-white/20 focus-within:ring-2 focus-within:ring-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.75)] flex transition-all duration-300 ease-out group ${
                    isMultiline
                      ? "flex-col justify-between rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-4 min-h-[135px] sm:min-h-[148px]"
                      : "items-center rounded-full py-1.5 pl-5 sm:pl-6 pr-2 sm:pr-2.5 min-h-[62px] sm:min-h-[68px]"
                  }`}
                >
                  {/* Single Continuous Textarea - Never Unmounted */}
                  <div className={`w-full transition-all duration-200 ${isMultiline ? "px-1 pt-0.5 pb-2" : "flex-1 min-w-0"}`}>
                    {isRecording && !inputPrompt ? (
                      <div className="flex items-center gap-3 py-1.5 px-1">
                        <div className="w-32 sm:w-44 h-7 flex items-center">
                          <RealtimeAudioWaveform
                            analyser={activeAnalyserNode}
                            isRecording={isRecording}
                            height={24}
                            barCount={28}
                            theme="sapphire"
                          />
                        </div>
                        <span className="text-xs sm:text-[13.5px] font-medium text-lime-300 animate-pulse tracking-wide select-none">
                          Höre zu... sprich einfach drauflos
                        </span>
                      </div>
                    ) : (
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputPrompt}
                        disabled={chatTutorialStep !== null}
                        spellCheck={settings?.autoSpellCheck ?? true}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecording ? "Höre zu... sprich einfach drauflos" : "Frag Dandelious"}
                        className={`w-full bg-transparent text-[16px] sm:text-[17px] text-white placeholder-neutral-400 focus:outline-none font-normal resize-none leading-normal tracking-wide transition-[height] duration-150 ease-out ${
                          isMultiline
                            ? "max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 px-1 py-1"
                            : "max-h-36 overflow-hidden px-1 py-2 scrollbar-none"
                        }`}
                      />
                    )}
                  </div>

                  {/* Actions: Voice Mic Button + Live / Send Button */}
                  <div className={`flex items-center gap-2 sm:gap-2.5 shrink-0 transition-all duration-200 ${isMultiline ? "justify-end w-full pt-1" : ""}`}>
                    {/* Voice Speech-to-Text Mic Button */}
                    <button
                      type="button"
                      id="chatwindow-mic-btn"
                      onClick={toggleVoiceRecording}
                      disabled={isTranscribing || chatTutorialStep !== null}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shrink-0 relative active:scale-95 ${
                        chatTutorialStep !== null
                          ? 'opacity-25 pointer-events-none'
                          : 'cursor-pointer'
                      } ${
                        isRecording 
                          ? "bg-[#C5DC57]/30 text-[#e9f78d] border border-[#C5DC57]/60 shadow-[0_0_24px_rgba(197,220,87,0.5)]" 
                          : isTranscribing
                            ? "bg-[#C5DC57]/20 text-[#C5DC57] border border-[#C5DC57]/30"
                            : "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-transparent hover:border-white/5"
                      }`}
                      title={isTranscribing ? "Transkribiere..." : isRecording ? "Spracheingabe beenden" : "Spracheingabe starten"}
                    >
                      {isRecording && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-[#C5DC57]/30 animate-ping pointer-events-none" />
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#C5DC57] border-2 border-black" />
                        </>
                      )}
                      {isTranscribing ? (
                        <Loader2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2] animate-spin text-[#C5DC57]" />
                      ) : (
                        <Mic className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      )}
                    </button>

                    {/* Dandelious Live / Send Button with Soft Glow & Smooth Morph Animation */}
                    {isStreaming ? (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          playSound("click", soundEnabled);
                          onStopStreaming();
                        }}
                        className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-[#2c2c2e] hover:bg-[#38383c] border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md"
                        title="Stoppen"
                      >
                        <Square className="w-4.5 h-4.5 fill-white text-white" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        id={inputPrompt.trim().length > 0 ? "chatwindow-send-btn" : "chatwindow-live-btn"}
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.92 }}
                        animate={isSendingAnim ? { scale: [1, 0.8, 1.15, 1], y: [0, -3, 0] } : { scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        onClick={() => {
                          if (chatTutorialStep === 3) {
                            playSound("click", soundEnabled);
                            setChatTutorialStep(4);
                            return;
                          }
                          if (inputPrompt.trim().length > 0) {
                            handleSubmit();
                          } else {
                            playSound("click", soundEnabled);
                            onOpenLive?.();
                          }
                        }}
                        className={`w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center transition-all shrink-0 overflow-hidden shadow-md active:scale-95 ${
                          chatTutorialStep === 3
                            ? "bg-[#C5DC57] text-black ring-4 ring-[#C5DC57]/80 shadow-[0_0_30px_rgba(197,220,87,0.95)] animate-pulse relative z-50 pointer-events-auto cursor-pointer"
                            : chatTutorialStep !== null
                              ? "bg-[#2c2c2e] text-neutral-500 opacity-25 pointer-events-none"
                              : inputPrompt.trim().length > 0
                                ? "bg-[#C5DC57] hover:bg-[#b8d049] active:bg-[#a6bd3a] text-[#0f1704] font-semibold cursor-pointer shadow-[0_0_24px_rgba(197,220,87,0.45)] border border-[#C5DC57]/40"
                                : "bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#C5DC57] border border-white/5 hover:border-white/10 cursor-pointer shadow-sm"
                        }`}
                        title={chatTutorialStep === 3 ? "Live Modus" : inputPrompt.trim().length > 0 ? "Senden" : "Live Gespräch starten"}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {inputPrompt.trim().length > 0 ? (
                            <motion.div
                              key="send-icon"
                              initial={{ scale: 0.35, rotate: -70, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0.35, rotate: 70, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 450, damping: 24 }}
                              className="flex items-center justify-center text-[#0e1603]"
                            >
                              <ArrowUp className="w-5.5 h-5.5 sm:w-6 sm:h-6 stroke-[2.8]" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="live-icon"
                              initial={{ scale: 0.35, rotate: 70, opacity: 0 }}
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={{ scale: 0.35, rotate: -70, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 450, damping: 24 }}
                              className="flex items-center justify-center text-[#e8f78d]"
                            >
                              <svg className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                                <rect x="3.5" y="8" width="2.5" height="8" rx="1.25" />
                                <rect x="9" y="4" width="2.5" height="16" rx="1.25" />
                                <rect x="14.5" y="6" width="2.5" height="12" rx="1.25" />
                                <rect x="20" y="10" width="2.5" height="4" rx="1.25" />
                              </svg>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Disclaimer Text */}
          <div className="text-center mt-1.5 mb-0.5 text-[11px] text-[#8e8e93] font-medium max-w-md mx-auto leading-tight px-4 select-none">
            Dandelious ist eine KI und kann Fehler machen, auch bei Informationen über Personen.{" "}
            <a href="#" className="underline decoration-dotted underline-offset-4 hover:text-[#a0a0a5] transition-colors">
              Datenschutz und Context
            </a>
          </div>
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
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Link in die Zwischenablage kopiert!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Chat Modal */}
      <AnimatePresence>
        {isRenameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white/[0.04] backdrop-blur-[60px] border-white/10 shadow-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
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
                className="w-full bg-white/[0.03] backdrop-blur-[50px] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-lime-500"
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
