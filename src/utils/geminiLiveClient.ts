// Gemini Live Real-Time Audio & Video Client Pipeline
// Handles 16kHz PCM mic recording, 24kHz gapless model playback, interruption & visualizer state

export interface LiveTranscriptItem {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface GeminiLiveClientOptions {
  customApiKey?: string;
  voiceName?: string;
  systemInstruction?: string;
  appLanguage?: string;
  toneStyle?: string;
  userNickname?: string;
  userOccupation?: string;
  memoryContext?: string;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error', message?: string) => void;
  onTranscript?: (transcript: LiveTranscriptItem) => void;
  onVideoStreamChange?: (stream: MediaStream | null, source: 'camera' | 'screen' | null) => void;
  onUserVolume?: (volume: number) => void;
  onModelVolume?: (volume: number) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private outputGainNode: GainNode | null = null;
  
  private activeSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;
  private animFrameId: number | null = null;
  private isMuted: boolean = false;
  
  // Video fields
  private videoIntervalId: any = null;
  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  public isConnected: boolean = false;
  public transcripts: LiveTranscriptItem[] = [];

  constructor(private options: GeminiLiveClientOptions) {}

  public async connect() {
    this.options.onStatusChange?.('connecting', 'Verbindung wird aufgebaut...');

    try {
      // 1. Establish Audio Context
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('Web Audio API wird von diesem Browser nicht unterstützt.');
      }

      // Single audio context for maximum browser compatibility
      this.inputAudioCtx = new AudioCtxClass();
      this.outputAudioCtx = this.inputAudioCtx;

      // Resume suspended contexts
      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      // Setup output analyser & gain
      this.outputGainNode = this.outputAudioCtx.createGain();
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 64;
      this.outputGainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);

      // 2. Request Microphone Access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micSource = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 64;
      
      // Buffer size: 4096 samples
      this.audioProcessor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.micSource.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.audioProcessor);
      this.audioProcessor.connect(this.inputAudioCtx.destination);

      // Process raw audio buffer and downsample to 16-bit PCM at 16kHz
      const currentInputRate = this.inputAudioCtx.sampleRate;
      this.audioProcessor.onaudioprocess = (e) => {
        if (this.isMuted || !this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.resampleTo16kPCM(inputData, currentInputRate);
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        this.ws.send(JSON.stringify({
          type: 'audio',
          audio: base64
        }));
      };

      // 3. Connect to Backend WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Gemini Live Client] WebSocket opened, sending init...');
        this.ws?.send(JSON.stringify({
          type: 'init',
          options: {
            customApiKey: this.options.customApiKey,
            voiceName: this.options.voiceName || 'Zephyr',
            systemInstruction: this.options.systemInstruction,
            appLanguage: this.options.appLanguage || 'Deutsch',
            toneStyle: this.options.toneStyle || 'Freundlich',
            userNickname: this.options.userNickname,
            userOccupation: this.options.userOccupation,
            memoryContext: this.options.memoryContext,
          }
        }));
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('[Gemini Live Client] WebSocket error:', err);
        this.options.onStatusChange?.('error', 'Verbindungsfehler aufgetreten.');
      };

      this.ws.onclose = () => {
        console.log('[Gemini Live Client] WebSocket closed');
        this.isConnected = false;
        this.options.onStatusChange?.('disconnected', 'Verbindung beendet.');
      };

      // 4. Start Real-time Volume Monitoring
      this.startVolumeMonitoring();

    } catch (err: any) {
      console.error('[Gemini Live Client] Setup failed:', err);
      this.disconnect();
      this.options.onStatusChange?.('error', err?.message || 'Mikrofonzugriff oder Verbindung fehlgeschlagen.');
    }
  }

  private appendTranscript(sender: 'user' | 'model', text: string) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    const lastItem = this.transcripts[this.transcripts.length - 1];
    
    // If the sender is the same and within 6 seconds, check if cumulative or incremental
    if (lastItem && lastItem.sender === sender && (Date.now() - lastItem.timestamp < 6000)) {
      if (cleanText.startsWith(lastItem.text)) {
        lastItem.text = cleanText;
      } else if (!lastItem.text.endsWith(cleanText)) {
        lastItem.text += (lastItem.text.endsWith(' ') || cleanText.startsWith(' ') ? '' : ' ') + cleanText;
      }
      lastItem.timestamp = Date.now();
      this.options.onTranscript?.(lastItem);
    } else {
      const item: LiveTranscriptItem = {
        id: `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender,
        text: cleanText,
        timestamp: Date.now()
      };
      this.transcripts.push(item);
      this.options.onTranscript?.(item);
    }
  }

  private handleServerMessage(rawData: string) {
    try {
      const msg = JSON.parse(rawData);

      switch (msg.type) {
        case 'session_ready':
          this.isConnected = true;
          this.options.onStatusChange?.('connected', 'Live verbunden');
          break;

        case 'audio':
          if (msg.audio) {
            this.queueAudioChunk(msg.audio);
          }
          break;

        case 'output_transcript':
          if (msg.text) {
            this.appendTranscript('model', msg.text);
          }
          break;

        case 'input_transcript':
          if (msg.text) {
            this.appendTranscript('user', msg.text);
          }
          break;

        case 'interrupted':
          this.stopAllAudio();
          this.options.onInterrupted?.();
          break;

        case 'turn_complete':
          this.options.onTurnComplete?.();
          break;

        case 'error':
          console.error('[Gemini Live Client] Server reported error:', msg.error);
          this.options.onStatusChange?.('error', msg.error);
          break;

        case 'session_closed':
          this.disconnect();
          break;
      }
    } catch (e) {
      console.error('[Gemini Live Client] Failed to parse message:', e);
    }
  }

  // Decodes 24kHz PCM from base64 and schedules gapless playback
  private queueAudioChunk(base64Audio: string) {
    if (!this.outputAudioCtx || !this.outputGainNode) return;

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM little endian safely with DataView
      const sampleCount = Math.floor(len / 2);
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const float32Array = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768.0;
      }

      // Create AudioBuffer at 24,000 Hz (Gemini Live native output rate)
      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputGainNode);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.02; // Small 20ms jitter cushion
      }

      sourceNode.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeSources.push(sourceNode);
      sourceNode.onended = () => {
        const index = this.activeSources.indexOf(sourceNode);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error('[Gemini Live Client] Audio decode error:', err);
    }
  }

  // Immediately stops all audio on user interruption
  public stopAllAudio() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // Ignore already stopped
      }
    });
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
  }

  // Downsamples any microphone input buffer sample rate to 16,000 Hz 16-bit PCM
  private resampleTo16kPCM(inputData: Float32Array, inputSampleRate: number): Int16Array {
    if (!inputSampleRate || inputSampleRate === 16000) {
      const output = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return output;
    }

    const ratio = inputSampleRate / 16000;
    const newLength = Math.max(1, Math.round(inputData.length / ratio));
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const startIdx = Math.floor(i * ratio);
      const endIdx = Math.min(Math.floor((i + 1) * ratio), inputData.length);
      let sum = 0;
      let count = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += inputData[j];
        count++;
      }
      const sample = count > 0 ? sum / count : 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      result[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    return result;
  }

  // Converts Float32 audio samples [-1.0, 1.0] to 16-bit PCM
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Real-time volume loop for visualizer
  private startVolumeMonitoring() {
    const userBuffer = new Uint8Array(64);
    const modelBuffer = new Uint8Array(64);

    const checkVolume = () => {
      if (this.inputAnalyser && !this.isMuted) {
        this.inputAnalyser.getByteFrequencyData(userBuffer);
        let sum = 0;
        for (let i = 0; i < userBuffer.length; i++) {
          sum += userBuffer[i];
        }
        const userVol = Math.min(1, (sum / userBuffer.length) / 100);
        this.options.onUserVolume?.(userVol);
      } else {
        this.options.onUserVolume?.(0);
      }

      if (this.outputAnalyser && this.activeSources.length > 0) {
        this.outputAnalyser.getByteFrequencyData(modelBuffer);
        let sum = 0;
        for (let i = 0; i < modelBuffer.length; i++) {
          sum += modelBuffer[i];
        }
        const modelVol = Math.min(1, (sum / modelBuffer.length) / 80);
        this.options.onModelVolume?.(modelVol);
      } else {
        this.options.onModelVolume?.(0);
      }

      this.animFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  // Video vision frame stream (Webcam or Screen at 1 FPS)
  public startVideoStream(videoElement: HTMLVideoElement) {
    this.stopVideoStream();

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    this.videoIntervalId = setInterval(() => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      if (!videoElement.videoWidth) return;

      try {
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          const base64 = dataUrl.split(',')[1];
          if (base64) {
            this.ws.send(JSON.stringify({
              type: 'video',
              video: base64
            }));
          }
        }
      } catch (err) {
        console.warn('[Gemini Live Client] Frame capture warning:', err);
      }
    }, 1000); // 1 frame per second
  }

  public stopVideoStream() {
    if (this.videoIntervalId) {
      clearInterval(this.videoIntervalId);
      this.videoIntervalId = null;
    }
  }

  // Send typed text message into live session
  public sendTextMessage(text: string) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'text',
      text
    }));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public async startVideo(source: 'camera' | 'screen'): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected || !this.ws) {
      console.warn('Cannot start video: Live session is not connected.');
      return { success: false, error: 'Live-Sitzung ist nicht verbunden.' };
    }
    
    try {
      this.stopVideo(); // Stop any existing video stream

      if (source === 'camera') {
        if (!navigator.mediaDevices?.getUserMedia) {
          return {
            success: false,
            error: 'Kamera wird von diesem Browser/Gerät nicht unterstützt.'
          };
        }
        this.videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      } else {
        const getDisplayMedia = navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices)
          || (navigator as any).getDisplayMedia?.bind(navigator);

        if (!getDisplayMedia) {
          return {
            success: false,
            error: 'Bildschirmübertragung wird von diesem Browser/Gerät nicht unterstützt (z. B. auf Mobilgeräten oder im aktuellen Vorschaufenster). Bitte öffne die App in einem Desktop-Browser.'
          };
        }

        try {
          this.videoStream = await getDisplayMedia({ 
            video: true,
            audio: false
          });
        } catch (displayErr: any) {
          if (displayErr?.name === 'NotAllowedError') {
            return {
              success: false,
              error: 'Bildschirmübertragung wurde abgelehnt oder im Vorschaufenster blockiert. Tipp: Öffne die App in einem neuen Tab für direkte Browser-Rechte.'
            };
          }
          return {
            success: false,
            error: displayErr?.message || 'Bildschirmübertragung abgebrochen.'
          };
        }
      }

      if (!this.videoStream) {
        return { success: false, error: 'Kein Videostream empfangen.' };
      }

      // Notify UI of active video stream immediately so the stage renders without delay
      this.options.onVideoStreamChange?.(this.videoStream, source);

      // Prepare off-screen element for canvas snapshots
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.videoStream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      this.videoElement.setAttribute('muted', '');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.play().catch(() => {});

      this.canvasElement = document.createElement('canvas');

      // Start capturing frames at ~1 FPS and send to Gemini Live
      this.videoIntervalId = setInterval(() => {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (!this.videoElement || !this.canvasElement) return;
        if (this.videoElement.readyState < 2) return; // Wait until frame data is available
        
        const targetWidth = 640;
        const vW = this.videoElement.videoWidth || 640;
        const vH = this.videoElement.videoHeight || 360;
        const targetHeight = Math.max(180, Math.round((vH / vW) * targetWidth));
        
        this.canvasElement.width = targetWidth;
        this.canvasElement.height = targetHeight;
        
        const ctx = this.canvasElement.getContext('2d');
        if (ctx) {
          ctx.drawImage(this.videoElement, 0, 0, targetWidth, targetHeight);
          const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.8);
          const base64Data = dataUrl.split(',')[1];
          
          if (base64Data) {
            this.ws.send(JSON.stringify({
              type: 'video',
              video: base64Data
            }));
          }
        }
      }, 1000); // 1 frame per second

      // If user stops the screen share natively via browser UI
      const track = this.videoStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          this.stopVideo();
        };
      }

      return { success: true };
    } catch (err: any) {
      console.warn(`[Gemini Live Client] Notice starting ${source}:`, err?.message || err);
      this.stopVideo();
      return { success: false, error: err?.message || 'Zugriff verweigert oder abgebrochen.' };
    }
  }

  public stopVideo() {
    if (this.videoIntervalId) {
      clearInterval(this.videoIntervalId);
      this.videoIntervalId = null;
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    this.videoElement = null;
    this.canvasElement = null;
    this.options.onVideoStreamChange?.(null, null);
  }

  public updateVoice(voiceName: string) {
    this.options.voiceName = voiceName;
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'init',
        options: {
          customApiKey: this.options.customApiKey,
          voiceName: this.options.voiceName,
          systemInstruction: this.options.systemInstruction,
          appLanguage: this.options.appLanguage || 'Deutsch',
          toneStyle: this.options.toneStyle || 'Freundlich',
          userNickname: this.options.userNickname,
          userOccupation: this.options.userOccupation,
        }
      }));
    }
  }

  public disconnect() {
    this.isConnected = false;
    this.stopVideo();

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.stopAllAudio();

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }

    // Close AudioContext safely without duplicate close on same instance or closed state
    const audioContextsToClose = new Set<AudioContext>();
    if (this.inputAudioCtx) audioContextsToClose.add(this.inputAudioCtx);
    if (this.outputAudioCtx) audioContextsToClose.add(this.outputAudioCtx);

    this.inputAudioCtx = null;
    this.outputAudioCtx = null;

    audioContextsToClose.forEach(ctx => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch (e) {}
    });

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }
}
