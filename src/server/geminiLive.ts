import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface LiveSessionOptions {
  customApiKey?: string;
  voiceName?: string;
  systemInstruction?: string;
  appLanguage?: string;
  toneStyle?: string;
  userNickname?: string;
  userOccupation?: string;
  memoryContext?: string;
}

export function setupGeminiLiveServer(httpServer: http.Server) {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/api/live-ws" 
  });

  console.log("[Gemini Live API] WebSocket Server initialized on /api/live-ws");

  wss.on("connection", (ws: WebSocket) => {
    console.log("[Gemini Live API] Client connected to live session");

    let liveSession: any = null;
    let isConnected = false;
    let currentVoice = "Zephyr";

    const closeLiveSession = () => {
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          // Ignore close error
        }
        liveSession = null;
      }
      isConnected = false;
    };

    ws.on("message", async (rawMessage: any) => {
      try {
        const data = JSON.parse(rawMessage.toString());

        if (data.type === "init") {
          closeLiveSession();

          const options: LiveSessionOptions = data.options || {};
          currentVoice = options.voiceName || "Zephyr";

          // Select API Key (Custom user key or System Key)
          let rawKey = options.customApiKey || process.env.GEMINI_API_KEY || "";
          let apiKey = rawKey.replace(/[\r\n\t "']/g, "").trim();
          if (!apiKey || apiKey === "undefined" || apiKey === "null") {
            ws.send(JSON.stringify({
              type: "error",
              error: "Kein gültiger API-Schlüssel für Gemini Live gefunden. Bitte hinterlege einen Google AI Studio API-Key in den Einstellungen."
            }));
            return;
          }

          const ai = new GoogleGenAI({ 
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build'
              }
            }
          });

          // Build system prompt for live conversation with full knowledge about Dandelious & memories
          let sysPrompt = `Du bist Dandelious Live, der intelligente, reaktionsschnelle und natürliche Echtzeit-Sprach- und Video-Begleiter von Dandelious.
IDENTITÄT & WISSEN ÜBER DANDELIOUS:
- Du bist ein integraler Teil von Dandelious und teilst dasselbe Wissen, dieselbe Intelligenz und dieselbe Persönlichkeit wie Dandelious im Text-Chat.
- Dandelious ist eine moderne, zukunftsweisende KI-Plattform mit multimodalem Erlebnis: ultraschneller Konversations-Chat, Dice Coder für interaktive Web-Apps, Deep Research für tiefgründige Analysen, Mediathek für echte Bilder aus dem Web, interaktive Quizze und ein vernetztes Langzeitgedächtnis (Memory Graph).
- Du weißt alles über Dandelious und kannst dem Nutzer jederzeit erklären, wie Dandelious funktioniert, welche Features existieren und wie man sie nutzt.
- Wenn der Nutzer dich nach Dandelious fragt ("Was ist Dandelious?", "Was kannst du?", "Wer bist du?"), erkläre deine Identität stolz, herzlich und kompetent.

GESPRÄCHSSTIL & LIVE-INTERAKTION:
- Führe ein natürliches, flüssiges und dynamisches Echtzeit-Gespräch mit dem Nutzer.
- Antworte prägnant, lebendig, pointiert und direkt (idealerweise 1-3 Sätze pro Sprechpause), damit das Gespräch wie ein echter Anruf fließt.
- Wenn Kamera oder Bildschirmübertragung aktiv sind, beziehe dich unmittelbar und visuell auf das, was der Nutzer dir zeigt.
- Sprache: ${options.appLanguage || 'Deutsch'}.
- Tonfall: ${options.toneStyle || 'Freundlich, empathisch, humorvoll und hochkompetent'}.`;

          if (options.userNickname) {
            sysPrompt += `\n- Der Name des Nutzers ist ${options.userNickname}.`;
          }
          if (options.userOccupation) {
            sysPrompt += `\n- Beruf des Nutzers: ${options.userOccupation}.`;
          }
          if (options.memoryContext) {
            sysPrompt += `\n\n${options.memoryContext}`;
          }
          if (options.systemInstruction) {
            sysPrompt += `\n\nZusätzliche individuelle Anweisungen:\n${options.systemInstruction}`;
          }

          const candidateModels = [
            "gemini-3.1-flash-live-preview",
            "gemini-2.5-flash-native-audio-preview",
            "gemini-2.0-flash-realtime-exp"
          ];

          let connectedModel = "";
          for (const modelName of candidateModels) {
            try {
              console.log(`[Gemini Live API] Attempting connection to ${modelName} with voice ${currentVoice}...`);
              
              liveSession = await ai.live.connect({
                model: modelName,
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: currentVoice
                      }
                    }
                  },
                  systemInstruction: sysPrompt,
                  outputAudioTranscription: {},
                  inputAudioTranscription: {}
                },
                callbacks: {
                  onopen: () => {
                    isConnected = true;
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: "session_ready",
                        model: modelName,
                        voice: currentVoice
                      }));
                    }
                  },
                  onmessage: (msg: LiveServerMessage) => {
                    if (ws.readyState !== WebSocket.OPEN) return;

                    // 1. Audio and text parts from Gemini
                    if (msg.serverContent?.modelTurn?.parts) {
                      for (const part of msg.serverContent.modelTurn.parts) {
                        if (part.inlineData?.data) {
                          ws.send(JSON.stringify({
                            type: "audio",
                            audio: part.inlineData.data
                          }));
                        }
                        if (part.text) {
                          ws.send(JSON.stringify({
                            type: "output_transcript",
                            text: part.text
                          }));
                        }
                      }
                    }

                    // 2. Transcriptions
                    const outText = (msg.serverContent as any)?.outputTranscription?.text || (msg.serverContent as any)?.outputAudioTranscription?.text;
                    if (outText) {
                      ws.send(JSON.stringify({
                        type: "output_transcript",
                        text: outText
                      }));
                    }

                    const inText = (msg.serverContent as any)?.inputTranscription?.text || (msg.serverContent as any)?.interimInputTranscription?.text || (msg.serverContent as any)?.inputAudioTranscription?.text;
                    if (inText) {
                      ws.send(JSON.stringify({
                        type: "input_transcript",
                        text: inText
                      }));
                    }

                    // 3. User Interruption detection
                    if (msg.serverContent?.interrupted) {
                      ws.send(JSON.stringify({
                        type: "interrupted"
                      }));
                    }

                    // 4. Model Turn Complete
                    if (msg.serverContent?.turnComplete) {
                      ws.send(JSON.stringify({
                        type: "turn_complete"
                      }));
                    }
                  },
                  onclose: (closeEvent?: any) => {
                    console.log("[Gemini Live API] Model connection closed", closeEvent?.code, closeEvent?.reason);
                    isConnected = false;
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: "session_closed"
                      }));
                    }
                  },
                  onerror: (err: any) => {
                    console.error(`[Gemini Live API] Session error on ${modelName}:`, err);
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: "error",
                        error: err?.message || "Fehler in der Gemini Live Verbindung"
                      }));
                    }
                  }
                }
              });

              connectedModel = modelName;
              isConnected = true;
              console.log(`[Gemini Live API] Successfully connected to ${modelName}!`);
              break;
            } catch (candErr: any) {
              console.warn(`[Gemini Live API] Failed to connect with ${modelName}:`, candErr?.message || candErr);
            }
          }

          if (!connectedModel || !liveSession) {
            console.error("[Gemini Live API] All candidate models failed to connect.");
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "error",
                error: "Verbindung zu Gemini Live fehlgeschlagen. Bitte prüfe deinen API-Key und deine Internetverbindung."
              }));
            }
          } else {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "session_ready",
                model: connectedModel,
                voice: currentVoice
              }));
            }
          }
          return;
        }

        if (!liveSession || !isConnected) {
          return;
        }

        // Realtime audio input from client microphone (PCM 16kHz base64)
        if (data.type === "audio" && data.audio) {
          liveSession.sendRealtimeInput({
            audio: {
              data: data.audio,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        }

        // Realtime video / camera frame input (JPEG base64)
        if (data.type === "video" && data.video) {
          try {
            (liveSession as any).sendRealtimeInput({
              media: {
                data: data.video,
                mimeType: "image/jpeg"
              }
            });
          } catch {
            try {
              (liveSession as any).sendRealtimeInput({
                video: {
                  data: data.video,
                  mimeType: "image/jpeg"
                }
              });
            } catch (vErr) {
              console.warn("[Gemini Live API] Video frame input notice:", vErr);
            }
          }
        }

        // Realtime text input if user types something
        if (data.type === "text" && data.text) {
          liveSession.sendRealtimeInput({
            text: data.text
          });
        }

      } catch (err: any) {
        console.error("[Gemini Live API] Message parsing error:", err);
      }
    });

    ws.on("close", () => {
      console.log("[Gemini Live API] Client disconnected");
      closeLiveSession();
    });

    ws.on("error", (err) => {
      console.error("[Gemini Live API] WebSocket error:", err);
      closeLiveSession();
    });
  });

  return wss;
}
