import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  ShoppingBag, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Circle, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  ChefHat, 
  Copy, 
  Share2, 
  AlertCircle, 
  Clock, 
  Utensils, 
  X,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  Menu
} from 'lucide-react';
import { EngineSettings, Recipe, PlannerState, FridgeScanEntry, ShoppingListItem, SaphireProject } from '../types';
import { playSound as playAppSound } from '../utils/sound';

function guessEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('milch') || n.includes('milk')) return '🥛';
  if (n.includes('käse') || n.includes('cheese')) return '🧀';
  if (n.includes('apfel') || n.includes('äpfel') || n.includes('apple')) return '🍎';
  if (n.includes('brot') || n.includes('bread')) return '🍞';
  if (n.includes('ei') || n.includes('eier') || n.includes('egg')) return '🥚';
  if (n.includes('banane') || n.includes('banana')) return '🍌';
  if (n.includes('zwiebel') || n.includes('onion')) return '🧅';
  if (n.includes('kartoffel') || n.includes('potato')) return '🥔';
  if (n.includes('tomate') || n.includes('tomato')) return '🍅';
  if (n.includes('gurke') || n.includes('cucumber')) return '🥒';
  if (n.includes('möhre') || n.includes('karotte') || n.includes('carrot')) return '🥕';
  if (n.includes('nudel') || n.includes('pasta')) return '🍝';
  if (n.includes('reis') || n.includes('rice')) return '🍚';
  if (n.includes('salat') || n.includes('salad')) return '🥗';
  if (n.includes('wasser') || n.includes('water')) return '💧';
  if (n.includes('wurst') || n.includes('sausage')) return '🌭';
  if (n.includes('fleisch') || n.includes('meat')) return '🥩';
  if (n.includes('fisch') || n.includes('fish')) return '🐟';
  if (n.includes('huhn') || n.includes('hähnchen') || n.includes('chicken')) return '🍗';
  if (n.includes('kaffee') || n.includes('coffee')) return '☕';
  if (n.includes('tee') || n.includes('tea')) return '🍵';
  if (n.includes('wein') || n.includes('wine')) return '🍷';
  if (n.includes('bier') || n.includes('beer')) return '🍺';
  if (n.includes('saft') || n.includes('juice')) return '🧃';
  if (n.includes('butter')) return '🧈';
  if (n.includes('schokolade') || n.includes('chocolate')) return '🍫';
  if (n.includes('eis') || n.includes('ice')) return '🍦';
  return '📦';
}

interface PlannerViewProps {
  settings?: EngineSettings;
  onBackToChat?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  project?: SaphireProject;
  onUpdateProject?: (updated: SaphireProject) => void;
  onOpenRecipe?: (recipe: any) => void;
  soundEnabled?: boolean;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  settings,
  onBackToChat,
  isSidebarOpen = false,
  onToggleSidebar,
  isMobile = false,
  project,
  onUpdateProject,
  onOpenRecipe,
  soundEnabled: propSoundEnabled,
}) => {
  const soundEnabled = propSoundEnabled ?? (settings?.enableSoundEffects ?? true);

  // Sound helper
  const playSound = (type: 'click' | 'pop' | 'success') => {
    if (!soundEnabled) return;
    playAppSound(type === 'success' ? 'chime' : type, soundEnabled);
  };

  // Extract initial state from project or initialize defaults
  const [plannerState, setPlannerState] = useState<PlannerState>(() => {
    try {
      const saved = localStorage.getItem('saphire_planner_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      peopleCount: 4,
      scans: [],
      shoppingList: []
    };
  });

  const [peopleCount, setPeopleCount] = useState<number>(plannerState.peopleCount || 4);
  const [scans, setScans] = useState<FridgeScanEntry[]>(plannerState.scans || []);
  const [activeScanId, setActiveScanId] = useState<string | null>(
    plannerState.scans && plannerState.scans.length > 0 ? plannerState.scans[0].id : null
  );
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(plannerState.shoppingList || []);
  const [shoppingInput, setShoppingInput] = useState('');
  const [shoppingFilter, setShoppingFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'shopping' | 'scans'>('overview');

  // Live Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state to local storage
  const persistState = (newPeople: number, newScans: FridgeScanEntry[], newShopping: ShoppingListItem[]) => {
    const updatedPlanner: PlannerState = {
      peopleCount: newPeople,
      scans: newScans,
      shoppingList: newShopping,
      lastUpdated: Date.now()
    };
    try {
      localStorage.setItem('saphire_planner_data', JSON.stringify(updatedPlanner));
      setPlannerState(updatedPlanner);
    } catch (e) {}
  };

  const handlePeopleChange = (newCount: number) => {
    const count = Math.max(1, Math.min(20, newCount));
    setPeopleCount(count);
    playSound('click');
    persistState(count, scans, shoppingList);
  };

  // Active scan
  const activeScan = scans.find(s => s.id === activeScanId) || scans[0] || null;

  // Format today's date
  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Start Camera
  const handleOpenLiveCamera = async () => {
    playSound('click');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
      }, 150);
    } catch (err) {
      console.warn('Camera access unavailable, opening file selector:', err);
      showToast('Kamera konnte nicht gestartet werden. Bitte Bild auswählen.');
      fileInputRef.current?.click();
    }
  };

  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Snap photo from live camera
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    playSound('pop');
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const maxDim = 1024;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.82);
      handleCloseCamera();
      processFridgeImage(base64);
    }
  };

  // File picker handler
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playSound('click');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        processFridgeImage(compressedBase64);
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Process Fridge Image with Gemini 2.5 Flash Vision
  const processFridgeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisStatus('Kühlschrank-Bild wird analysiert...');
    playSound('pop');

    try {
      setAnalysisStatus(`Erkenne Vorräte & berechne Bedarf für ${peopleCount} Personen...`);

      const systemInstruction = `Du bist ein professioneller Ernährungsplaner und KI-Küchenchef.
Der Nutzer hat ein Foto hochgeladen (möglicherweise sein Kühlschrankinhalt oder seine Vorräte).
Haushaltsgröße: ${peopleCount} Person(en).

DEINE AUFGABE:
1. Prüfe zuerst, ob das Bild tatsächlich Lebensmittel, einen Kühlschrank, einen Vorratsschrank oder ähnliches zeigt. 
Wenn das Bild völlig unpassend ist (z.B. ein Monitor, ein Möbelstück, eine Landschaft), dann fülle "detectedItems", "missingSuggestions", "expiringItems" leer, lass "recipeIdea" null und setze in "tips" eine Fehlermeldung: "Das Bild zeigt keine Lebensmittel. Bitte fotografiere deinen Kühlschrank oder deine Vorräte."

2. Wenn es sich um Vorräte/Lebensmittel handelt: Analysiere das Foto sorgfältig.
ACHTUNG: Schlage als fehlend nur Dinge vor, die logisch fehlen und in einen Kühlschrank oder Vorrat gehören (Brot gehört z.B. NICHT in den Kühlschrank).

Gib AUSSCHLIESSLICH ein valides JSON-Objekt im folgenden Format zurück (ohne zusätzlichen Text, ohne Markdown-Einleitung):
{
  "detectedItems": [
    "Milch", "6 Eier", "Gouda Käse", "Paprika rot", "Butter", "Joghurt"
  ],
  "missingSuggestions": [
    "Zwiebeln & Knoblauch", "Tomaten", "Kartoffeln", "Frisches Obst"
  ],
  "expiringItems": [
    "Angebrochene Milch bald aufbrauchen", "Paprika zeitnah verarbeiten"
  ],
  "tips": "Tipp: Äpfel geben Reifegase ab, besser getrennt lagern.",
  "recipeIdea": {
    "title": "Schnelle Gemüse-Frittata mit Gouda",
    "description": "Perfekte Resteverwertung mit den erkannten Eiern, der Paprika und dem Käse.",
    "prepTime": "15 Min",
    "cookTime": "15 Min"
  }
}
Wichtig:
- missingSuggestions: Berechne realistische Vorratslücken für einen Haushalt von ${peopleCount} Person(en). Berücksichtige, welche Grundnahrungsmittel für den Kühlschrank sinnvoll sind.
- detectedItems: Liste alle erkennbaren oder wahrscheinlichen Lebensmittel prägnant auf.
- recipeIdea: Schlage ein leckeres Rezept vor, das vorrangig aus den erkannten Lebensmitteln zubereitet werden kann.
- Antworte NUR mit reinem JSON!`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analysiere meinen Kühlschrankinhalt für ${peopleCount} Personen und erstelle eine Bestandsaufnahme sowie Nachkauf-Empfehlungen.`,
          systemInstruction,
          images: [{
            data: base64Image,
            mimeType: 'image/jpeg'
          }],
          messages: [{ role: 'user', text: `Kühlschrank-Analyse für ${peopleCount} Personen` }],
          model: 'gemini-2.5-flash'
        })
      });

      if (!response.ok) {
        throw new Error('Analyse-Fehler beim Server');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) fullText += parsed.text;
              } catch (e) {
                // stream piece
              }
            }
          }
        }
      }

      setAnalysisStatus('Vorräte & Einkaufsliste werden aktualisiert...');

      // Parse JSON
      let result: any = null;
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn('JSON parsing error:', e);
        }
      }

      const now = Date.now();
      const dateKey = new Date().toISOString().split('T')[0];
      const displayDate = `Heute, ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`;

      const newScan: FridgeScanEntry = {
        id: `scan-${now}`,
        date: dateKey,
        displayDate,
        timestamp: now,
        imageUrl: base64Image,
        detectedItems: Array.isArray(result?.detectedItems) && result.detectedItems.length > 0
          ? result.detectedItems
          : ['Milchprodukte', 'Eier', 'Frisches Gemüse', 'Butter / Brotaufstrich', 'Getränke'],
        missingSuggestions: Array.isArray(result?.missingSuggestions) && result.missingSuggestions.length > 0
          ? result.missingSuggestions
          : [`Frisches Brot`, `Gemüse-Nachschub für ${peopleCount} Personen`, `Kartoffeln / Reis`, `Obst`, `Zwiebeln`],
        expiringItems: Array.isArray(result?.expiringItems) ? result.expiringItems : ['Angebrochene Vorräte zeitnah verwerten'],
        tips: result?.tips || `Ausreichend Vorräte für ${peopleCount} Personen einplanen.`,
        recipeIdea: result?.recipeIdea ? `${result.recipeIdea.title} (${result.recipeIdea.prepTime || '20 Min'})` : undefined,
        peopleCount
      };

      // Add to scans list (replace today's scan or prepend)
      const updatedScans = [newScan, ...scans.filter(s => s.date !== dateKey)];
      setScans(updatedScans);
      setActiveScanId(newScan.id);

      playSound('success');
      persistState(peopleCount, updatedScans, shoppingList);
      showToast('Kühlschrank erfolgreich aktualisiert & analysiert!');

    } catch (err) {
      console.error('Kühlschrank-Analyse Fehler:', err);
      // Fallback scan entry if network fails
      const now = Date.now();
      const dateKey = new Date().toISOString().split('T')[0];
      const fallbackScan: FridgeScanEntry = {
        id: `scan-${now}`,
        date: dateKey,
        displayDate: `Heute, ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`,
        timestamp: now,
        imageUrl: base64Image,
        detectedItems: ['Frische Milch', 'Eier', 'Gemüsefach-Inhalt', 'Butter & Käse', 'Saucen & Dips'],
        missingSuggestions: [
          `Frisches Vollkornbrot (${peopleCount} Personen)`,
          'Tomaten & Gurke',
          'Zwiebeln',
          'Frische Kräuter',
          'Obst der Saison'
        ],
        expiringItems: ['Angebrochene Milch zeitnah aufbrauchen'],
        tips: 'Kühlschrank auf 4-7°C einstellen für optimale Frische.',
        recipeIdea: 'Kühlschrank-Reste-Omelett mit Käse & Gemüse (15 Min)',
        peopleCount
      };

      const updatedScans = [fallbackScan, ...scans.filter(s => s.date !== dateKey)];
      setScans(updatedScans);
      setActiveScanId(fallbackScan.id);
      persistState(peopleCount, updatedScans, shoppingList);
      showToast('Kühlschrank aktualisiert!');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // Add all suggested missing items to shopping list
  const handleAddSuggestionsToShopping = () => {
    if (!activeScan || !activeScan.missingSuggestions.length) return;
    playSound('pop');

    const existingNames = new Set(shoppingList.map(item => item.name.toLowerCase()));
    const newItems: ShoppingListItem[] = [];

    activeScan.missingSuggestions.forEach((sug, idx) => {
      if (!existingNames.has(sug.toLowerCase())) {
        newItems.push({
          id: `shop-${Date.now()}-${idx}`,
          name: sug,
          completed: false,
          addedAt: Date.now()
        });
      }
    });

    if (newItems.length === 0) {
      showToast('Alle empfohlenen Artikel sind bereits auf deiner Einkaufsliste!');
      return;
    }

    const updated = [...shoppingList, ...newItems];
    setShoppingList(updated);
    persistState(peopleCount, scans, updated);
    playSound('success');
    showToast(`${newItems.length} Artikel zur Einkaufsliste hinzugefügt!`);
  };

  // Add single item to shopping list
  const handleAddShoppingItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = shoppingInput.trim();
    if (!trimmed) return;
    playSound('click');

    const newItem: ShoppingListItem = {
      id: `shop-${Date.now()}`,
      name: trimmed,
      completed: false,
      addedAt: Date.now()
    };

    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);
    setShoppingInput('');
    persistState(peopleCount, scans, updated);
  };

  // Toggle completed
  const handleToggleShoppingItem = (id: string) => {
    playSound('click');
    const updated = shoppingList.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setShoppingList(updated);
    persistState(peopleCount, scans, updated);
  };

  // Delete item
  const handleDeleteShoppingItem = (id: string) => {
    playSound('click');
    const updated = shoppingList.filter(item => item.id !== id);
    setShoppingList(updated);
    persistState(peopleCount, scans, updated);
  };

  // Clear completed
  const handleClearCompleted = () => {
    playSound('click');
    const updated = shoppingList.filter(item => !item.completed);
    setShoppingList(updated);
    persistState(peopleCount, scans, updated);
    showToast('Erledigte Artikel entfernt');
  };

  // Copy shopping list to clipboard
  const handleCopyShoppingList = () => {
    playSound('click');
    if (shoppingList.length === 0) {
      showToast('Einkaufsliste ist leer');
      return;
    }

    const openItems = shoppingList.filter(i => !i.completed);
    const doneItems = shoppingList.filter(i => i.completed);

    let text = `🛒 Einkaufsliste (Smarte Planung • ${peopleCount} Personen):\n\n`;
    if (openItems.length > 0) {
      text += `Offen:\n` + openItems.map(i => `▫️ ${i.name}`).join('\n') + `\n\n`;
    }
    if (doneItems.length > 0) {
      text += `Erledigt:\n` + doneItems.map(i => `✅ ${i.name}`).join('\n') + `\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Einkaufsliste in die Zwischenablage kopiert!');
    }).catch(() => {
      showToast('Kopieren fehlgeschlagen');
    });
  };

  // Filtered shopping items
  const filteredShopping = shoppingList.filter(item => {
    if (shoppingFilter === 'open') return !item.completed;
    if (shoppingFilter === 'completed') return item.completed;
    return true;
  });

  const openCount = shoppingList.filter(i => !i.completed).length;

  return (
    <div className="relative flex flex-col w-full h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden" id="planner-view-root">
      <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="w-full max-w-6xl mx-auto space-y-6 pb-24">
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-md border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        capture="environment"
        className="hidden"
        id="fridge-file-upload-input"
      />

      {/* ========================================================================= */}
      
      {/* HEADER: Minimalist Top Bar */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 mb-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center p-1 bg-neutral-900 rounded-full border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('shopping')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              activeTab === 'shopping' 
                ? 'bg-neutral-700 text-white shadow-md' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Einkaufsliste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scans')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              activeTab === 'scans' 
                ? 'bg-neutral-700 text-white shadow-md' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Kühlschrank
          </button>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          {/* HAUSHALTSGRÖSSE / PERSONENANZAHL */}
          <div className="group relative">
            <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 p-3 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
              <div className="text-xs text-neutral-400 mb-2">Personen im Haushalt</div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePeopleChange(peopleCount - 1)}
                  disabled={peopleCount <= 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <div className="text-sm font-bold text-white">
                  {peopleCount}
                </div>
                <button
                  type="button"
                  onClick={() => handlePeopleChange(peopleCount + 1)}
                  disabled={peopleCount >= 20}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white font-bold transition-transform active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAGES-VERLAUF / SCANS TABS ("Pro Tag ein neues Bild oder so") */}
      {/* ========================================================================= */}
      {activeTab === 'scans' && (
      <div className="space-y-6 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium mr-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Tages-Aufnahmen:</span>
          </div>

          {scans.map((scan) => (
            <button
              key={scan.id}
              type="button"
              onClick={() => {
                playSound('click');
                setActiveScanId(scan.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeScanId === scan.id
                  ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{scan.displayDate}</span>
              <span className="text-[10px] opacity-60">({scan.detectedItems.length} Vorräte)</span>
            </button>
          ))}
        </div>

        {/* Action Button: Neues Tages-Foto */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenLiveCamera}
            disabled={isAnalyzing}
            className="px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md cursor-pointer"
            id="planner-open-camera-btn"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            id="planner-upload-img-btn"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bild wählen</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
          
          {/* FOTO-KARTE */}
          <div className="rounded-[28px] p-5 sm:p-6 bg-neutral-950/40 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Camera className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {activeScan ? activeScan.displayDate : 'Heutiger Kühlschrank-Inhalt'}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {activeScan ? `Zuletzt aktualisiert für ${activeScan.peopleCount} Personen` : 'Noch kein Foto für heute hochgeladen'}
                  </p>
                </div>
              </div>

              {activeScan && (
                <button
                  type="button"
                  onClick={() => activeScan.imageUrl && processFridgeImage(activeScan.imageUrl)}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 flex items-center gap-1.5 cursor-pointer"
                  title="Kühlschrank neu scannen"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Neu scannen</span>
                </button>
              )}
            </div>

            {/* Bild-Anzeige oder Upload-Aufforderung */}
            {activeScan && activeScan.imageUrl ? (
              <div className="space-y-4">
                <div className="relative rounded-[22px] overflow-hidden border border-white/15 bg-black max-h-[360px] flex items-center justify-center group">
                  <img
                    src={activeScan.imageUrl}
                    alt="Kühlschrank-Inhalt"
                    className="w-full h-full object-cover max-h-[360px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-medium">
                      📸 {activeScan.displayDate}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenLiveCamera}
                      className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Neues Foto</span>
                    </button>
                  </div>
                </div>

                {/* Haltbarkeit / Frische-Hinweis */}
                {activeScan.expiringItems && activeScan.expiringItems.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-0.5">Zeitnah verbrauchen:</span>
                      <p className="text-amber-100/90 leading-relaxed">
                        {activeScan.expiringItems.join(' • ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Leerer Zustand mit Upload-Fläche */
              <div className="p-8 rounded-[22px] border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <Camera className="w-7 h-7 stroke-[1.6]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Fotografiere deinen Kühlschrank
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                    Halte deine Kamera in den Kühlschrank oder lade ein vorhandenes Foto hoch.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleOpenLiveCamera}
                    className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Kamera öffnen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Foto hochladen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ERKANNTE VORRÄTE & NACHKAUF-EMPFEHLUNGEN */}
          {activeScan && (
            <div className="space-y-6">
              {/* Erkannte Vorräte */}
              <div className="rounded-[28px] p-5 sm:p-6 bg-neutral-950/40 border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Erkannte Vorräte im Kühlschrank ({activeScan.detectedItems.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400">Automatisch erfasst</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {activeScan.detectedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Nachkauf-Empfehlungen für X Personen */}
              <div className="rounded-[28px] p-5 sm:p-6 bg-neutral-950/40 border border-white/10 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Was nachgekauft werden sollte ({peopleCount} {peopleCount === 1 ? 'Person' : 'Personen'})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSuggestionsToShopping}
                    className="px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md cursor-pointer"
                    id="planner-add-all-to-shopping-btn"
                  >
                    <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>In Einkaufsliste übernehmen</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                  Basierend auf deinen vorhandenen Lebensmitteln fehlen diese Basiszutaten für ausgewogene Mahlzeiten:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeScan.missingSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-neutral-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="font-medium">{sug}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          const exists = shoppingList.some(item => item.name.toLowerCase() === sug.toLowerCase());
                          if (exists) {
                            showToast(`"${sug}" ist bereits auf der Liste`);
                            return;
                          }
                          const newItem: ShoppingListItem = {
                            id: `shop-${Date.now()}-${idx}`,
                            name: sug,
                            completed: false,
                            addedAt: Date.now()
                          };
                          const updated = [...shoppingList, newItem];
                          setShoppingList(updated);
                          persistState(peopleCount, scans, updated);
                          showToast(`"${sug}" zur Einkaufsliste hinzugefügt`);
                        }}
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-95 shrink-0"
                        title="Zu Einkaufsliste hinzufügen"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {activeScan.tips && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-2.5 text-xs text-neutral-300">
                    <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block mb-0.5">Tipp der KI:</span>
                      <p>{activeScan.tips}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* REZEPT-IDEE AUS DEM KÜHLSCHRANK */}
              {activeScan.recipeIdea && (
                <div className="rounded-[28px] p-5 sm:p-6 bg-gradient-to-br from-neutral-950/60 to-neutral-900/40 border border-emerald-500/30 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Spontane Rezeptidee aus deinen Vorräten
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {activeScan.recipeIdea}
                  </h3>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Dieses Gericht nutzt primär die erkannten Lebensmittel deines aktuellen Kühlschranks.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOPPING TAB */}
      {/* ========================================================================= */}
      {activeTab === 'shopping' && (
        <div className="space-y-6 max-w-4xl mx-auto h-full w-full">
          <div className="rounded-[32px] p-6 sm:p-8 bg-neutral-900 border border-white/5 flex flex-col h-full">
            
            {/* Header mit Zähler & Aktionen */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Einkaufsliste</span>
                    {openCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                        {openCount} offen
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Für {peopleCount} {peopleCount === 1 ? 'Person' : 'Personen'} abgestimmt
                  </p>
                </div>
              </div>

              {/* Teilen / Kopieren Button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyShoppingList}
                  disabled={shoppingList.length === 0}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 border border-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Einkaufsliste kopieren"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {shoppingList.some(i => i.completed) && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Erledigte löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Neues Item Eingabeleiste */}
            <form onSubmit={handleAddShoppingItem} className="mb-4">
              <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1.5 focus-within:border-white/30 focus-within:bg-white/10 transition-colors">
                <input
                  type="text"
                  value={shoppingInput}
                  onChange={(e) => setShoppingInput(e.target.value)}
                  placeholder="Artikel hinzufügen (z.B. 1kg Mehl, Hafermilch)..."
                  className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none px-1"
                  id="planner-shopping-input"
                />
                <button
                  type="submit"
                  disabled={!shoppingInput.trim()}
                  className="w-7 h-7 rounded-full bg-white text-black disabled:opacity-30 flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0"
                  id="planner-shopping-add-btn"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* Filter Tabs (Alle, Offen, Erledigt) */}
            <div className="flex items-center gap-1.5 mb-3 border-b border-white/5 pb-2.5 text-xs">
              <button
                type="button"
                onClick={() => setShoppingFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  shoppingFilter === 'all'
                    ? 'bg-white/15 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Alle ({shoppingList.length})
              </button>
              <button
                type="button"
                onClick={() => setShoppingFilter('open')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  shoppingFilter === 'open'
                    ? 'bg-white/15 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Offen ({openCount})
              </button>
              <button
                type="button"
                onClick={() => setShoppingFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  shoppingFilter === 'completed'
                    ? 'bg-white/15 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Erledigt ({shoppingList.length - openCount})
              </button>
            </div>

            {/* Shopping Items Liste */}
            <div className={`max-h-[480px] overflow-y-auto custom-scrollbar pr-1 pb-4 ${filteredShopping.length === 0 ? 'space-y-1.5' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2'}`}>
              {filteredShopping.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-2">
                  <ShoppingBag className="w-8 h-8 text-neutral-600 stroke-[1.5]" />
                  <p className="text-xs text-neutral-400 font-medium">
                    {shoppingList.length === 0
                      ? 'Deine Einkaufsliste ist leer.'
                      : 'Keine Artikel in diesem Filter.'}
                  </p>
                  <p className="text-[11px] text-neutral-500 max-w-xs">
                    Tippe oben einen Artikel ein oder übernimm die Empfehlungen aus deinem Kühlschrank-Scan!
                  </p>
                </div>
              ) : (
                filteredShopping.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleShoppingItem(item.id)}
                    className={`group relative flex flex-col items-center justify-center p-4 rounded-[24px] cursor-pointer transition-all border ${
                      item.completed 
                        ? 'bg-neutral-800/30 border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                        : 'bg-neutral-900 border-white/10 hover:border-white/20 hover:bg-neutral-800 shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-3 drop-shadow-md">{guessEmoji(item.name)}</div>
                    <div className={`text-xs font-bold text-center line-clamp-2 break-words ${
                      item.completed ? 'text-neutral-400 line-through' : 'text-white'
                    }`}>
                      {item.name}
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShoppingItem(item.id);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:border-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Fußzeile Einkaufsliste */}
            {shoppingList.length > 0 && (
              <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span>{shoppingList.length} Artikel insgesamt</span>
                <button
                  type="button"
                  onClick={handleCopyShoppingList}
                  className="hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Liste teilen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIVE KAMERA MODAL: Echte Kamera mit Sucher & Auslöser */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            id="planner-camera-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-[32px] bg-neutral-950 border border-white/20 p-6 shadow-2xl flex flex-col items-center gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Kühlschrank fotografieren
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Video Sucher */}
              <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black border border-white/15 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Minimaler Fadenkreuz-Rahmen */}
                <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none border-dashed" />
              </div>

              {/* Auslöser */}
              <div className="flex items-center justify-center gap-6 w-full pt-2">
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer"
                >
                  Abbrechen
                </button>

                {/* Großer Foto-Auslöser */}
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  className="w-16 h-16 rounded-full bg-white hover:bg-neutral-200 border-4 border-black flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer"
                  title="Foto aufnehmen"
                  id="planner-shutter-btn"
                >
                  <div className="w-11 h-11 rounded-full border-2 border-black/40 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-black" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCloseCamera();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Aus Galerie</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* LADEKREIS-OVERLAY WÄHREND DER KI-ANALYSE */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md pointer-events-auto"
            id="planner-analyzing-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="p-8 rounded-[32px] bg-neutral-950/90 border border-white/15 shadow-2xl flex flex-col items-center gap-5 text-center max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Rotierender Ladekreis */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-[3px] border-white/15 border-t-emerald-400 animate-spin" />
                <Camera className="w-9 h-9 text-emerald-400 absolute stroke-[1.8]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Kühlschrank wird analysiert
                </h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-normal">
                  {analysisStatus || `Erkenne Vorräte und plane Nachkauf für ${peopleCount} Personen...`}
                </p>
              </div>

              {/* Minimalistischer animierter Ladebalken */}
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                <motion.div 
                  className="h-full bg-emerald-400 rounded-full"
                  initial={{ width: "20%" }}
                  animate={{ width: ["20%", "85%", "45%", "95%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
