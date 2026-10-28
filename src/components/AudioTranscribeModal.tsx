import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Square,
  UploadCloud,
  Sparkles,
  Copy,
  Check,
  Download,
  X,
  RefreshCw,
  FileAudio,
  Send,
  Languages,
  AlertCircle
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface AudioTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
  customApiKey?: string;
  soundEnabled?: boolean;
}

export const AudioTranscribeModal: React.FC<AudioTranscribeModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  customApiKey,
  soundEnabled = true
}) => {
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('de');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0.1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up recording state on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
      setErrorMessage(null);
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Safe catch
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Safe catch
      }
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setAudioVolume(0.1);
  };

  const startRecording = async () => {
    playSound('click', soundEnabled);
    setErrorMessage(null);
    setTranscript('');
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Set up AudioContext for reactive audio volume meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioVolume(Math.min(1, Math.max(0.15, avg / 120)));
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        animFrameRef.current = requestAnimationFrame(checkVolume);
      }

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4', ''];
      const chosenMime = mimeTypes.find((m) => m === '' || MediaRecorder.isTypeSupported(m)) || '';
      const recorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = chosenMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioFileName(`Aufnahme_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Automatically trigger gemini-3.5-transcribe
        transcribeAudioBlob(blob, mime);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setErrorMessage(
        isDenied
          ? 'Mikrofon-Berechtigung verweigert. Bitte erlaube den Mikrofon-Zugriff im Browser.'
          : 'Mikrofon nicht gefunden oder nicht verfügbar.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    playSound('send', soundEnabled);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
    setAudioVolume(0.1);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|webm|ogg|aac|flac)$/i)) {
      setErrorMessage('Bitte wähle eine gültige Audiodatei (MP3, WAV, M4A, WebM, OGG).');
      return;
    }

    setErrorMessage(null);
    setTranscript('');
    setAudioBlob(file);
    setAudioFileName(file.name);
    setAudioUrl(URL.createObjectURL(file));

    transcribeAudioBlob(file, file.type || 'audio/webm');
  };

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      const resp = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-custom-api-key': customApiKey } : {})
        },
        body: JSON.stringify({
          audioBase64,
          mimeType: mimeType.split(';')[0] || 'audio/webm',
          language,
          prompt: `Transkribiere diese Audioaufnahme exakt auf ${
            language === 'de' ? 'Deutsch' : language === 'en' ? 'Englisch' : 'der gesprochenen Sprache'
          }. Achte auf korrekte Interpunktion, Satzbau und Grammatik. Gib ausschließlich den transkribierten Text zurück.`
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData?.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      if (data.transcript && data.transcript.trim()) {
        setTranscript(data.transcript.trim());
        playSound('send', soundEnabled);
      } else {
        setErrorMessage('Keine verständliche Sprache in der Aufnahme erkannt.');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(`Transkriptionsfehler: ${err.message || 'Serverfehler'}. Bitte erneut versuchen.`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!transcript) return;
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Transkript_gemini-3.5-transcribe_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    playSound('click', soundEnabled);
  };

  const handleInsert = () => {
    if (!transcript) return;
    onInsertToChat?.(transcript);
    playSound('send', soundEnabled);
    onClose();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            playSound('click', soundEnabled);
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative z-10 w-full max-w-xl bg-neutral-950/90 backdrop-blur-2xl border border-lime-500/20 rounded-[32px] p-6 sm:p-8 shadow-[0_0_80px_rgba(147,51,234,0.15)] text-white overflow-hidden space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-blue-400 shadow-md">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">Audio Transkription</h2>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-lime-950/80 border border-lime-400/40 text-blue-300">
                    gemini-3.5-transcribe
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Präzise Audio-zu-Text Konvertierung per Mikrofon oder Datei
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher & Language Selector */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('record');
                  playSound('click', soundEnabled);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'record'
                    ? 'bg-lime-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mikrofon-Aufnahme
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('upload');
                  playSound('click', soundEnabled);
                }}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-lime-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Datei hochladen
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-blue-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/5 border border-white/10 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-lime-500/50 cursor-pointer"
              >
                <option value="de" className="bg-neutral-900 text-white">Deutsch (DE)</option>
                <option value="en" className="bg-neutral-900 text-white">Englisch (EN)</option>
                <option value="fr" className="bg-neutral-900 text-white">Französisch (FR)</option>
                <option value="es" className="bg-neutral-900 text-white">Spanisch (ES)</option>
                <option value="auto" className="bg-neutral-900 text-white">Automatisch</option>
              </select>
            </div>
          </div>

          {/* Mode 1: Microphone Live Recording */}
          {mode === 'record' && (
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-5">
              {/* Dynamic Waveform / Equalizer Pulse Visualizer */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {isRecording && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.35 * audioVolume + 0.9, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-lime-500/20 blur-md pointer-events-none"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.6 * audioVolume + 0.8, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-lime-600/10 blur-xl pointer-events-none"
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 text-white ring-4 ring-red-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white ring-4 ring-purple-500/20 hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 fill-current" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Status and Timer */}
              <div className="text-center space-y-1">
                {isRecording ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-mono font-bold text-white">
                      REC {formatSeconds(recordingSeconds)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">
                    Klicke auf das Mikrofon, um die Aufnahme zu starten
                  </span>
                )}
              </div>

              {/* Recording Audio Bars Animation */}
              {isRecording && (
                <div className="flex items-center gap-1.5 h-8">
                  {[40, 75, 55, 90, 60, 85, 45, 95, 65, 80, 50, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: `${Math.max(6, Math.round(h * audioVolume))}px`
                      }}
                      transition={{ duration: 0.1 }}
                      className="w-1.5 bg-gradient-to-t from-blue-600 to-blue-300 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Audio File Upload */}
          {mode === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-3xl bg-white/[0.02] border-2 border-dashed border-blue-500/30 hover:border-blue-400/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-500/5 group space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  Audiodatei auswählen oder hierher ziehen
                </span>
                <span className="text-xs text-neutral-400 mt-0.5 block">
                  Unterstützt MP3, WAV, M4A, WebM, OGG, FLAC
                </span>
              </div>
            </div>
          )}

          {/* Transcribing Indicator */}
          {isTranscribing && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Transkribiere mit gemini-3.5-transcribe...
                </span>
                <span className="text-[11px] text-blue-300">
                  Audio wird analysiert und präzise in Text gewandelt
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transcript Output Box */}
          {transcript && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Transkript ({transcript.split(/\s+/).filter(Boolean).length} Wörter)
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer border border-white/5 flex items-center gap-1 text-xs"
                    title="In Zwischenablage kopieren"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Kopieren</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTranscript}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer border border-white/5 flex items-center gap-1 text-xs"
                    title="Als Textdatei herunterladen"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Herunterladen</span>
                  </button>
                </div>
              </div>

              {/* Text Area Output */}
              <div className="w-full max-h-48 overflow-y-auto p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-neutral-100 leading-relaxed font-normal select-text custom-scrollbar">
                {transcript}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setAudioBlob(null);
                    setAudioFileName(null);
                    if (audioUrl) URL.revokeObjectURL(audioUrl);
                    setAudioUrl(null);
                    playSound('click', soundEnabled);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold cursor-pointer border border-white/5"
                >
                  Neu aufnehmen
                </button>

                {onInsertToChat && (
                  <button
                    type="button"
                    onClick={handleInsert}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>In Chat einfügen</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Audio Player if audio available */}
          {audioUrl && !isRecording && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <FileAudio className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-neutral-300 font-medium truncate block">
                  {audioFileName || 'Audioaufnahme'}
                </span>
                <audio src={audioUrl} controls className="w-full h-7 mt-1" />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
