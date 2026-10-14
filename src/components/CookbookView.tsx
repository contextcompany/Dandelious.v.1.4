import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  HelpCircle,
  Plus,
  Trash2,
  X,
  Clock,
  Users,
  ChefHat,
  Lightbulb,
  Tag,
  Flame,
  Check,
  Info,
  Search,
  ChevronRight,
  Utensils,
} from 'lucide-react';
import { Recipe, RecipeIngredient, SaphireProject } from '../types';
import { playSound } from '../utils/sound';

export interface CookbookViewProps {
  project: SaphireProject;
  onUpdateProject?: (updated: SaphireProject) => void;
  onBackToProjects?: () => void;
  onToggleSidebar?: () => void;
  onOpenHelp?: () => void;
  isMobile?: boolean;
  soundEnabled?: boolean;
  initialCategory?: string;
}

const CATEGORIES = [
  'Hauptgerichte',
  'Frühstück',
  'Backen & Kuchen',
  'Suppen & Eintöpfe',
  'Salate',
  'Snacks',
  'Desserts',
  'Getränke',
] as const;

const DIFFICULTIES: Array<'Einfach' | 'Mittel' | 'Anspruchsvoll'> = [
  'Einfach',
  'Mittel',
  'Anspruchsvoll',
];

const PRESET_TAGS = [
  'Vegetarisch',
  'Vegan',
  'Glutenfrei',
  'Low Carb',
  'Schnell & Einfach',
  'High Protein',
  'Meal Prep',
];

export const CookbookView: React.FC<CookbookViewProps> = ({
  project,
  onUpdateProject,
  onBackToProjects,
  onToggleSidebar,
  onOpenHelp,
  isMobile: isMobileProp = false,
  soundEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'create'>('recipes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);

  // Responsive device check for 2 distinct scales (Handy vs. PC)
  const [isHandy, setIsHandy] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 || isMobileProp : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsHandy(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Floating Fadeable Close X Button scroll behavior (matching SettingsModal)
  const [showPopupClose, setShowPopupClose] = useState(true);
  const lastScrollY = useRef(0);

  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    if (currentY > 40 && currentY > lastScrollY.current + 5) {
      setShowPopupClose(false);
    } else if (currentY < lastScrollY.current - 5 || currentY <= 40) {
      setShowPopupClose(true);
    }
    lastScrollY.current = currentY;
  };

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>(() => project.recipes || []);

  // Search Prompt State
  const [searchPromptInput, setSearchPromptInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStepText, setSearchStepText] = useState('Google-Suche wird initialisiert...');
  const [searchProgress, setSearchProgress] = useState(12);

  // Form State for manual recipe creation
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Hauptgerichte');
  const [difficulty, setDifficulty] = useState<'Einfach' | 'Mittel' | 'Anspruchsvoll'>('Einfach');
  const [portions, setPortions] = useState('2');
  const [prepTime, setPrepTime] = useState('15');
  const [cookTime, setCookTime] = useState('25');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { id: 'ing-1', amount: '200', unit: 'g', name: '' },
    { id: 'ing-2', amount: '1', unit: 'EL', name: '' },
  ]);
  const [instructions, setInstructions] = useState<string[]>([
    '',
    '',
  ]);
  const [tips, setTips] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Hauptgerichte');
    setDifficulty('Einfach');
    setPortions('2');
    setPrepTime('15');
    setCookTime('25');
    setIngredients([
      { id: `ing-${Date.now()}-1`, amount: '', unit: '', name: '' },
      { id: `ing-${Date.now()}-2`, amount: '', unit: '', name: '' },
    ]);
    setInstructions(['', '']);
    setTips('');
    setSelectedTags([]);
    setCustomTagInput('');
    setShowPopupClose(true);
  };

  const handleOpenCreateModal = () => {
    playSound('click', soundEnabled);
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    playSound('click', soundEnabled);
    setIsCreateModalOpen(false);
    setActiveTab('recipes');
  };

  const handleOpenSearchModal = () => {
    playSound('click', soundEnabled);
    setSearchPromptInput('');
    setIsSearchModalOpen(true);
  };

  const handleCloseSearchModal = () => {
    playSound('click', soundEnabled);
    setIsSearchModalOpen(false);
  };

  // Ingredient Helpers
  const handleAddIngredient = () => {
    playSound('click', soundEnabled);
    setIngredients((prev) => [
      ...prev,
      { id: `ing-${Date.now()}-${Math.random()}`, amount: '', unit: '', name: '' },
    ]);
  };

  const handleUpdateIngredient = (
    id: string,
    field: keyof RecipeIngredient,
    value: string
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const handleRemoveIngredient = (id: string) => {
    playSound('pop', soundEnabled);
    setIngredients((prev) => (prev.length > 1 ? prev.filter((ing) => ing.id !== id) : prev));
  };

  // Step Helpers
  const handleAddInstruction = () => {
    playSound('click', soundEnabled);
    setInstructions((prev) => [...prev, '']);
  };

  const handleUpdateInstruction = (index: number, text: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleRemoveInstruction = (index: number) => {
    playSound('pop', soundEnabled);
    setInstructions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  // Tag Helpers
  const handleToggleTag = (tag: string) => {
    playSound('click', soundEnabled);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    const clean = customTagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      playSound('click', soundEnabled);
      setSelectedTags((prev) => [...prev, clean]);
      setCustomTagInput('');
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop', soundEnabled);
    const updated = recipes.filter((r) => r.id !== id);
    setRecipes(updated);
    if (selectedRecipeDetail?.id === id) {
      setSelectedRecipeDetail(null);
    }
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        recipes: updated,
      });
    }
  };

  // Save Recipe manually from create popup
  const handleSaveRecipe = () => {
    if (!title.trim()) return;

    playSound('chime', soundEnabled);

    const validIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    const validInstructions = instructions.filter((step) => step.trim().length > 0);

    const newRecipe: Recipe = {
      id: `recipe-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      difficulty,
      portions: portions.trim() ? `${portions.trim()} Portionen` : undefined,
      prepTime: prepTime.trim() ? `${prepTime.trim()} Min.` : undefined,
      cookTime: cookTime.trim() ? `${cookTime.trim()} Min.` : undefined,
      ingredients: validIngredients.length > 0 ? validIngredients : [{ id: 'ing-1', name: 'Zutaten nach Wunsch' }],
      instructions: validInstructions.length > 0 ? validInstructions : ['Nach eigenem Rezept zubereiten.'],
      notes: tips.trim() || undefined,
      tags: selectedTags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedList = [newRecipe, ...recipes];
    setRecipes(updatedList);

    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        recipes: updatedList,
      });
    }

    setIsCreateModalOpen(false);
    setActiveTab('recipes');
  };

  // Handle Recipe Search Execution (triggered by swipe or enter)
  const handleExecuteSearch = async (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery || isSearching) return;

    setIsSearchModalOpen(false);
    playSound('send', soundEnabled);
    setIsSearching(true);

    const stages: Array<{ text: string; pct: number }> = [
      { text: 'Google-Suche wird initialisiert...', pct: 14 },
      { text: `Rezepte & Food-Blogs für „${cleanQuery}“ werden durchsucht...`, pct: 32 },
      { text: 'Webseiten werden auf beste Bewertungen & Relevanz geprüft...', pct: 48 },
      { text: 'Zutatenliste und exakte Mengenangaben werden extrahiert...', pct: 65 },
      { text: 'Zubereitungsschritte, Garzeiten & Temperaturen werden strukturiert...', pct: 81 },
      { text: 'Küchentipps & Nährwertangaben werden aufbereitet...', pct: 92 },
      { text: 'Rezept wird formatiert und im Kochbuch gespeichert...', pct: 98 },
    ];

    setSearchStepText(stages[0].text);
    setSearchProgress(stages[0].pct);

    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setSearchStepText(stages[stageIdx].text);
        setSearchProgress(stages[stageIdx].pct);
      }
    }, 1800);

    // Continuous fine-grained progress tick
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev < 98) {
          return prev + 1;
        }
        return prev;
      });
    }, 300);

    try {
      const fetchPromise = fetch('/api/cookbook/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
          portions: 4,
        }),
      }).then((r) => r.json());

      const minAnimationPromise = new Promise((resolve) => setTimeout(resolve, 3600));

      const [data] = await Promise.all([fetchPromise, minAnimationPromise]);
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      setSearchProgress(100);

      if (data?.success && data?.recipe) {
        const raw = data.recipe;
        const newRecipe: Recipe = {
          id: `recipe-google-${Date.now()}`,
          title: raw.title || cleanQuery,
          description: raw.description || undefined,
          category: raw.category || 'Hauptgerichte',
          difficulty: raw.difficulty || 'Einfach',
          portions: raw.portions ? `${raw.portions} Portionen` : '4 Portionen',
          prepTime: raw.prepTime || '15 Min.',
          cookTime: raw.cookTime || '25 Min.',
          ingredients: Array.isArray(raw.ingredients) && raw.ingredients.length > 0
            ? raw.ingredients.map((ing: any, i: number) => ({
                id: `ing-${Date.now()}-${i}`,
                name: ing.name || String(ing),
                amount: ing.amount || '',
                unit: ing.unit || '',
              }))
            : [{ id: 'ing-1', name: 'Zutaten aus Web-Rezept' }],
          instructions: Array.isArray(raw.instructions) && raw.instructions.length > 0
            ? raw.instructions
            : ['Nach Online-Anleitung zubereiten.'],
          notes: raw.notes || raw.sourceUrl ? `Quelle: ${raw.sourceUrl || 'Google Web'}` : undefined,
          tags: Array.isArray(raw.tags) ? raw.tags : ['Google Suche'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updated = [newRecipe, ...recipes];
        setRecipes(updated);
        if (onUpdateProject) {
          onUpdateProject({
            ...project,
            recipes: updated,
          });
        }
        setSearchPromptInput('');
        playSound('chime', soundEnabled);
        setSelectedRecipeDetail(newRecipe);
      }
    } catch (err) {
      console.error('Fehler bei Google Rezept-Suche:', err);
    } finally {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-neutral-100 font-['Plus_Jakarta_Sans'] overflow-y-auto overflow-x-hidden w-full max-w-full min-w-0 select-none relative">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-md pl-2.5 sm:pl-3.5 pr-2.5 sm:pr-3.5 h-16 flex items-center justify-between w-full max-w-full shrink-0 relative">
        {/* Oben Links: Seitenleistenknopf */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onToggleSidebar?.();
          }}
          className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
          title="Menü"
        >
          <span className="w-4 h-[2px] bg-white rounded-full" />
          <span className="w-4 h-[2px] bg-white rounded-full" />
        </button>

        {/* In der Mitte: „Rezepte“ und der Knopf „Erstellen“ */}
        <LayoutGroup id="cookbook-header-tabs">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-neutral-950/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setActiveTab('recipes');
              }}
              className={`relative px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                activeTab === 'recipes' ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
              }`}
            >
              {activeTab === 'recipes' && (
                <motion.div
                  layoutId="cookbookHeaderTabPill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              Rezepte
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                handleOpenCreateModal();
              }}
              className={`relative px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                activeTab === 'create' ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
              }`}
            >
              {activeTab === 'create' && (
                <motion.div
                  layoutId="cookbookHeaderTabPill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              Erstellen
            </button>
          </div>
        </LayoutGroup>

        {/* Oben Rechts: Knopf mit dem Fragezeichen */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onOpenHelp?.();
          }}
          className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
          title="Hilfe & Anleitung"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>
      </header>

      {/* Main Content Area: Recipes List (Styled like Mediathek Items: light-grey rounded rows) */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 pb-28 min-w-0">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 sm:py-32 px-4 select-none">
            <div className="w-16 h-16 rounded-3xl bg-[#242426] border border-white/10 flex items-center justify-center mb-4 shadow-xl text-neutral-300">
              <ChefHat className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Dein Kochbuch ist noch leer
            </h3>
            <p className="text-xs sm:text-sm text-[#8e8e93] max-w-xs sm:max-w-sm mt-1.5 leading-relaxed">
              Tippe unten auf „Rezept suchen“ für echte Online-Rezepte oder erstelle oben über „Erstellen“ dein eigenes Rezept.
            </p>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {recipes.map((r, rIdx) => (
              <motion.div
                key={r.id ? `cookbook-recipe-${r.id}-${rIdx}` : `cookbook-idx-${rIdx}`}
                whileHover={{ scale: 1.015, x: 2, backgroundColor: '#2c2c2e' }}
                whileTap={{ scale: 0.985 }}
                onClick={() => {
                  playSound('click', soundEnabled);
                  setSelectedRecipeDetail(r);
                }}
                className="bg-[#242426] rounded-full px-5 py-3.5 flex items-center justify-between transition-all group shadow-sm w-full overflow-hidden cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
                  <Utensils className="w-5 h-5 text-neutral-300 stroke-[1.8] group-hover:text-white transition-colors shrink-0" />
                  <span className="text-[15px] font-normal text-white truncate">{r.title}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {r.prepTime && (
                    <span className="text-xs text-[#8e8e93]">
                      {r.prepTime}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteRecipe(r.id, e)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#8e8e93] hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                    title="Rezept löschen"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.8]" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-[#8e8e93] stroke-[2] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Button: "Rezept suchen" (Pure White button with high clickability, no green) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-[max(env(safe-area-inset-bottom,18px),18px)] z-30 pointer-events-none flex items-center justify-center">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenSearchModal}
          className="pointer-events-auto bg-white hover:bg-neutral-200 active:bg-neutral-300 text-black font-semibold text-[15px] px-7 py-3.5 rounded-full flex items-center justify-center gap-2.5 shadow-[0_12px_35px_rgba(255,255,255,0.22)] transition-all cursor-pointer select-none"
        >
          <Search className="w-4 h-4 stroke-[2.5] text-black" />
          <span>Rezept suchen</span>
        </motion.button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REZEPT SUCHEN (WIE PROJEKT ERSTELLEN MIT SWIPE-TO-CONFIRM, NO GREEN) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
              isHandy ? 'p-0 bg-black' : 'p-3 sm:p-6 bg-black/80 backdrop-blur-md'
            }`}
          >
            {!isHandy && (
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={handleCloseSearchModal}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full bg-[#000000] text-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans'] ${
                isHandy
                  ? 'h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none'
                  : 'max-w-[540px] sm:max-w-[580px] max-h-[92vh] h-[640px] rounded-[32px] sm:rounded-[36px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)]'
              }`}
            >
              {/* Header Top Left Close Button */}
              <div className={`px-5 sm:px-6 flex items-center justify-between shrink-0 ${
                isHandy ? 'pt-[max(env(safe-area-inset-top,0px),16px)] pb-2' : 'pt-5 pb-3'
              }`}>
                <button
                  type="button"
                  onClick={handleCloseSearchModal}
                  className="w-8 h-8 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  title="Schließen"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Main Center Content */}
              <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 max-w-lg mx-auto w-full z-10 -mt-8 text-center space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Rezept suchen
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8e8e93] leading-relaxed max-w-sm mx-auto">
                    Gib dein Wunschgericht ein und wische das Feld nach rechts, um im Web nach echten Rezepten zu suchen.
                  </p>
                </div>

                {/* Swipeable Pill Container (No green, pure white elements) */}
                <div className="w-full relative">
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 240 }}
                    dragElastic={0.25}
                    dragSnapToOrigin={!isSearching}
                    onDragEnd={(_e, info) => {
                      if ((info.offset.x > 35 || info.velocity.x > 80) && searchPromptInput.trim()) {
                        handleExecuteSearch(searchPromptInput);
                      }
                    }}
                    className="w-full rounded-full bg-[#242426] hover:bg-[#2c2c2e] text-white shadow-2xl flex items-center px-4 py-3.5 relative select-none touch-none border border-white/10 cursor-grab active:cursor-grabbing transition-all"
                  >
                    {/* Left Search Icon inside pill */}
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 mr-3 pointer-events-none">
                      <Search className="w-4 h-4 stroke-[2.5]" />
                    </div>

                    {/* Text input for Prompt */}
                    <input
                      type="text"
                      value={searchPromptInput}
                      onChange={(e) => setSearchPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (searchPromptInput.trim()) {
                            handleExecuteSearch(searchPromptInput);
                          }
                        }
                      }}
                      placeholder="z.B. Schokokeks ohne Zucker..."
                      autoFocus
                      className="flex-1 bg-transparent text-white placeholder:text-[#8e8e93] font-medium text-[15px] sm:text-[16px] outline-none min-w-0 pr-2"
                    />

                    {/* Right Swipe Arrow Indicator */}
                    <div
                      onClick={() => {
                        if (searchPromptInput.trim()) {
                          handleExecuteSearch(searchPromptInput);
                        }
                      }}
                      className={`flex items-center gap-1 shrink-0 select-none pl-2 pr-1 transition-colors ${
                        searchPromptInput.trim() ? 'cursor-pointer text-white hover:scale-110' : 'cursor-default text-neutral-600'
                      }`}
                      title="Nach rechts wischen zum Suchen"
                    >
                      <ChevronRight className="w-5 h-5 animate-pulse stroke-[2.5]" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Bottom spacing */}
              <div className="h-6 w-full shrink-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* GOOGLE SEARCH LIVE STATUS OVERLAY WITH ACCURATE PROGRESS & PERCENTAGE     */}
      {/* NO spinning circle - light grey percentage - animated 3 white wave dots  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none"
          >
            {/* Live Changing Text with Motion Blur & Slide Transitions */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full min-h-[90px] justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={searchStepText}
                  initial={{ opacity: 0, y: -22, filter: 'blur(8px)', color: '#ffffff' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)', color: '#ffffff' }}
                  exit={{ opacity: 0, y: 22, filter: 'blur(8px)', color: '#8e8e93' }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg sm:text-2xl font-bold tracking-tight px-4 leading-relaxed"
                >
                  {searchStepText}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Light Grey Percentage Display (Hellgraue Prozentanzeige) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs sm:text-sm font-mono font-medium text-[#8e8e93] tracking-widest mt-3.5 select-none"
            >
              {searchProgress}%
            </motion.div>

            {/* 3 Animated Wave Dots under the text and percentage (pure white with glow) */}
            <div className="relative z-10 flex items-center justify-center gap-2.5 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -9, 0],
                    opacity: [0.35, 1, 0.35],
                    scale: [0.85, 1.25, 0.85],
                  }}
                  transition={{
                    duration: 1.15,
                    repeat: Infinity,
                    delay: i * 0.22,
                    ease: 'easeInOut',
                  }}
                  className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* POPUP: REZEPT DETAILS ANSEHEN (MEDIENTHEK / NUTZUNGSLIMITS POPUP STYLE)   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRecipeDetail && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
              isHandy ? 'p-0 bg-black' : 'p-3 sm:p-6 bg-black/80 backdrop-blur-md'
            }`}
          >
            {!isHandy && (
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setSelectedRecipeDetail(null)}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full bg-[#000000] text-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans'] ${
                isHandy
                  ? 'h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none'
                  : 'max-w-[540px] sm:max-w-[580px] max-h-[92vh] h-[780px] rounded-[32px] sm:rounded-[36px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)]'
              }`}
            >
              {/* Close Button Top Left */}
              <button
                type="button"
                onClick={() => setSelectedRecipeDetail(null)}
                className="absolute top-5 left-5 z-30 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg bg-[#1c1c1e]/85 backdrop-blur-md hover:bg-[#2c2c2e] text-neutral-300 hover:text-white border border-white/10"
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Scrollable Recipe Details */}
              <div
                className={`flex-1 overflow-y-auto px-5 sm:px-6 pt-16 space-y-4 no-scrollbar bg-[#000000] ${
                  isHandy ? 'pb-[max(env(safe-area-inset-bottom,0px),28px)]' : 'pb-8'
                }`}
              >
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#3a3a3c] text-neutral-200">
                      {selectedRecipeDetail.category || 'Rezept'}
                    </span>
                    {selectedRecipeDetail.difficulty && (
                      <span className="text-[11px] text-[#8e8e93]">
                        • {selectedRecipeDetail.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {selectedRecipeDetail.title}
                  </h3>
                  {selectedRecipeDetail.description && (
                    <p className="text-xs sm:text-[13px] text-[#8e8e93] leading-relaxed">
                      {selectedRecipeDetail.description}
                    </p>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-[#1c1c1e] rounded-2xl p-3.5 border border-white/5">
                  <div className="text-center">
                    <span className="text-[10px] text-[#8e8e93] block">Portionen</span>
                    <span className="text-xs font-semibold text-white">
                      {selectedRecipeDetail.portions || '4'}
                    </span>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <span className="text-[10px] text-[#8e8e93] block">Vorbereitung</span>
                    <span className="text-xs font-semibold text-white">
                      {selectedRecipeDetail.prepTime || '-'}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-[#8e8e93] block">Kochzeit</span>
                    <span className="text-xs font-semibold text-white">
                      {selectedRecipeDetail.cookTime || '-'}
                    </span>
                  </div>
                </div>

                {/* Ingredients Box */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md">
                  <span className="text-sm font-medium text-white">Zutaten</span>
                  <div className="space-y-2">
                    {selectedRecipeDetail.ingredients.map((ing, i) => (
                      <div
                        key={`ing-detail-${ing.id || i}-${i}`}
                        className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 text-xs"
                      >
                        <span className="text-neutral-200">{ing.name}</span>
                        <span className="text-neutral-400 font-medium">
                          {ing.amount} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md">
                  <span className="text-sm font-medium text-white">Zubereitungsschritte</span>
                  <div className="space-y-3">
                    {selectedRecipeDetail.instructions.map((step, idx) => (
                      <div key={`inst-detail-${idx}`} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-[#121214] text-neutral-300 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed flex-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips Box */}
                {selectedRecipeDetail.notes && (
                  <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 space-y-1.5 border border-white/5 shadow-md">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Tipp & Hinweis</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {selectedRecipeDetail.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* POPUP: REZEPT ERSTELLEN (IDENTISCH ZU EINSTELLUNGEN / NUTZUNGSLIMITS POPUP) */}
      {/* 2 SCALES: HANDY (FULLSCREEN 100DVH) VS PC (ROUNDED DESKTOP CARD)          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center select-none ${
              isHandy ? 'p-0 bg-black' : 'p-3 sm:p-6 bg-black/80 backdrop-blur-md'
            }`}
          >
            {!isHandy && (
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={handleCloseCreateModal}
              />
            )}

            <motion.div
              key="cookbook-create-popup"
              initial={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isHandy ? 1 : 0.94, y: isHandy ? 20 : 10 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative z-10 w-full bg-[#000000] text-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans'] ${
                isHandy
                  ? 'h-full min-h-[100dvh] max-h-screen rounded-none border-0 shadow-none'
                  : 'max-w-[520px] sm:max-w-[550px] max-h-[92vh] h-[780px] rounded-[32px] sm:rounded-[36px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.98)]'
              }`}
            >
              {/* Floating Fadeable Close X Button */}
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className={`absolute top-5 left-5 z-30 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 ease-out bg-[#1c1c1e]/85 backdrop-blur-md hover:bg-[#2c2c2e] text-neutral-300 hover:text-white border border-white/10 ${
                  showPopupClose
                    ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
                    : 'opacity-0 scale-75 -translate-y-2 blur-[2px] pointer-events-none'
                }`}
                title="Schließen"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Top Right Save Icon Checkmark */}
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={!title.trim()}
                className={`absolute top-5 right-5 z-30 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-300 ease-out ${
                  title.trim()
                    ? 'bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                    : 'bg-[#1c1c1e] text-neutral-600 opacity-40 pointer-events-none border border-white/5'
                } ${
                  showPopupClose
                    ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
                    : 'opacity-0 scale-75 -translate-y-2 blur-[2px] pointer-events-none'
                }`}
                title="Rezept speichern"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>

              {/* Scrollable Popup Body */}
              <div
                onScroll={handlePopupScroll}
                className={`flex-1 overflow-y-auto px-4 sm:px-6 pt-16 space-y-4 no-scrollbar bg-[#000000] w-full max-w-full min-w-0 overflow-x-hidden ${
                  isHandy ? 'pb-[max(env(safe-area-inset-bottom,0px),28px)]' : 'pb-8'
                }`}
              >
                {/* Header Title Section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Rezept erstellen
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#3a3a3c] text-neutral-200 tracking-wider">
                      KOCHBUCH
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-[#8e8e93] leading-relaxed">
                    Trage alle Zutaten, Zubereitungsschritte und persönliche Kochtipps ein, um dein Rezept im Kochbuch festzuhalten.
                  </p>
                </div>

                {/* Grouped Container 1: Titel & Beschreibung */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <span>Rezeptdetails</span>
                    <Info className="w-3.5 h-3.5 text-[#8e8e93]" />
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-[#8e8e93] uppercase tracking-wider block mb-1">
                        Titel des Gerichts *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="z.B. Saftige Schoko-Cookies ohne Zucker"
                        className="w-full rounded-xl bg-[#121214] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-[#8e8e93] focus:outline-none focus:border-white transition-colors"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#8e8e93] uppercase tracking-wider block mb-1">
                        Kurzbeschreibung
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ein einfaches Rezept für köstliche Schoko-Cookies..."
                        rows={2}
                        className="w-full rounded-xl bg-[#121214] border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-[#8e8e93] focus:outline-none focus:border-white/20 resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Grouped Container 2: Kategorie & Schwierigkeit */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Kategorie & Niveau</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#8e8e93] uppercase tracking-wider block mb-1">
                        Kategorie
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl bg-[#121214] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} className="bg-[#1c1c1e] text-white">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-[#8e8e93] uppercase tracking-wider block mb-1">
                        Schwierigkeitsgrad
                      </label>
                      <div className="bg-[#121214] p-1 rounded-xl flex items-center border border-white/5">
                        {DIFFICULTIES.map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => {
                              playSound('click', soundEnabled);
                              setDifficulty(diff);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              difficulty === diff
                                ? 'bg-white text-black font-semibold shadow-sm'
                                : 'text-[#8e8e93] hover:text-white'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grouped Container 3: Portionen, Vorbereitung, Kochzeit */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <span className="text-sm font-medium text-white">Zeit & Portionen</span>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] sm:text-[11px] text-[#8e8e93] flex items-center gap-1 truncate">
                        <Users className="w-3 h-3 text-[#8e8e93] shrink-0" />
                        Portionen
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={portions}
                        onChange={(e) => setPortions(e.target.value)}
                        placeholder="2"
                        className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] sm:text-[11px] text-[#8e8e93] flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-[#8e8e93] shrink-0" />
                        Vorbereitung
                      </label>
                      <div className="relative w-full min-w-0">
                        <input
                          type="number"
                          min="0"
                          value={prepTime}
                          onChange={(e) => setPrepTime(e.target.value)}
                          placeholder="15"
                          className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-2 py-2 pr-5 text-xs text-white text-center focus:outline-none focus:border-white/30"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[#8e8e93] pointer-events-none">
                          m
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <label className="text-[10px] sm:text-[11px] text-[#8e8e93] flex items-center gap-1 truncate">
                        <Flame className="w-3 h-3 text-[#8e8e93] shrink-0" />
                        Kochzeit
                      </label>
                      <div className="relative w-full min-w-0">
                        <input
                          type="number"
                          min="0"
                          value={cookTime}
                          onChange={(e) => setCookTime(e.target.value)}
                          placeholder="25"
                          className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-2 py-2 pr-5 text-xs text-white text-center focus:outline-none focus:border-white/30"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[#8e8e93] pointer-events-none">
                          m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grouped Container 4: Zutatenliste */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                      <span>Zutaten</span>
                      <span className="text-xs text-[#8e8e93]">({ingredients.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Zutat
                    </button>
                  </div>

                  <div className="space-y-2 w-full min-w-0">
                    {ingredients.map((ing, idx) => (
                      <div
                        key={ing.id ? `ing-field-${ing.id}-${idx}` : `ing-idx-${idx}`}
                        className="grid grid-cols-[50px_60px_1fr_32px] sm:grid-cols-[68px_80px_1fr_36px] gap-1.5 items-center w-full min-w-0"
                      >
                        <input
                          type="text"
                          value={ing.amount || ''}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'amount', e.target.value)}
                          placeholder="Menge"
                          className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-1.5 py-2 text-xs text-white text-center focus:outline-none focus:border-white/30"
                        />
                        <input
                          type="text"
                          value={ing.unit || ''}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                          placeholder="Einheit"
                          className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-1.5 py-2 text-xs text-white text-center focus:outline-none focus:border-white/30"
                        />
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                          placeholder={`Zutat ${idx + 1}`}
                          className="w-full min-w-0 rounded-xl bg-[#121214] border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="w-8 h-8 rounded-xl bg-[#121214] hover:bg-rose-500/20 text-[#8e8e93] hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Entfernen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grouped Container 5: Kochschritte */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                      <span>Zubereitungsschritte</span>
                      <span className="text-xs text-[#8e8e93]">({instructions.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInstruction}
                      className="text-xs font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Schritt
                    </button>
                  </div>

                  <div className="space-y-2.5 w-full min-w-0">
                    {instructions.map((step, idx) => (
                      <div key={`inst-field-${idx}`} className="flex items-start gap-1.5 sm:gap-2 w-full min-w-0">
                        <div className="w-5 h-5 rounded-full bg-[#121214] text-neutral-300 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-2 border border-white/10">
                          {idx + 1}
                        </div>
                        <textarea
                          value={step}
                          onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                          placeholder={`Schritt ${idx + 1} beschreiben...`}
                          rows={2}
                          className="flex-1 min-w-0 rounded-xl bg-[#121214] border border-white/10 p-2.5 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveInstruction(idx)}
                          className="w-8 h-8 rounded-xl bg-[#121214] hover:bg-rose-500/20 text-[#8e8e93] hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-1"
                          title="Entfernen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grouped Container 6: Tipps & Notizen */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-2 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tipps & Empfehlungen</span>
                  </div>
                  <textarea
                    value={tips}
                    onChange={(e) => setTips(e.target.value)}
                    placeholder="Geheimzutaten, Haltbarkeit oder passende Beilagen..."
                    rows={2}
                    className="w-full rounded-xl bg-[#121214] border border-white/10 p-3 text-xs text-white placeholder-[#8e8e93] focus:outline-none focus:border-white/20 resize-none"
                  />
                </div>

                {/* Grouped Container 7: Tags */}
                <div className="bg-[#1c1c1e] sm:bg-[#202022] rounded-2xl p-4 sm:p-5 space-y-3 border border-white/5 shadow-md w-full min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                    <Tag className="w-3.5 h-3.5 text-[#8e8e93]" />
                    <span>Stichwörter & Tags</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag, tIdx) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={`preset-tag-${tag}-${tIdx}`}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black font-semibold shadow-sm'
                              : 'bg-[#121214] hover:bg-white/10 text-[#8e8e93] hover:text-white border border-white/5'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1 w-full min-w-0">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={handleAddCustomTag}
                      placeholder="Eigener Tag..."
                      className="flex-1 min-w-0 rounded-xl bg-[#121214] border border-white/10 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      disabled={!customTagInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-medium text-white transition-colors cursor-pointer shrink-0"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>

                {/* Bottom Save Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveRecipe}
                    disabled={!title.trim()}
                    className="w-full py-3.5 rounded-full font-bold text-sm bg-white hover:bg-neutral-200 disabled:opacity-35 text-black flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Rezept im Kochbuch speichern</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
