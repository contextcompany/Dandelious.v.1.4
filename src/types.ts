export type GemmaModelId = 
  | 'dandelious-lite' 
  | 'dandelious-fast' 
  | 'dandelious-plus' 
  | 'dandelious-pro' 
  | 'dandelious-ultra' 
  | 'gemini-3.7-flash' 
  | 'gemini-3.6-flash' 
  | 'gemma-2-2b-it' 
  | 'gemma-2-9b-it' 
  | 'gemma-2-27b-it' 
  | string;

export interface ModelOption {
  id: GemmaModelId;
  name: string;
  badge: string;
  description: string;
  contextWindow: string;
  isSLM: boolean;
  recommendedFor: string;
  tierRequired?: SubscriptionTier;
}

export interface MessageMetrics {
  tokensPerSec: number;
  totalTokens: number;
  latencyMs: number;
  firstTokenMs: number;
  engineThread: string;
}

export interface MessageImage {
  url: string;
  name?: string;
  mimeType?: string;
}

export interface DeepResearchData {
  title: string;
  topic?: string;
  status: 'draft' | 'running' | 'completed';
  sources?: string[];
  subtasks?: string[];
  estimatedMinutes?: number;
  reportContent?: string;
}

export interface ImageGenEmbedData {
  type: 'image_gen_unavailable';
  originalPrompt?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metrics?: MessageMetrics;
  modelUsed?: string;
  isStreaming?: boolean;
  error?: boolean;
  images?: MessageImage[];
  deepResearchData?: DeepResearchData;
  imageGenEmbed?: ImageGenEmbedData;
  isPinned?: boolean;
  autoRouting?: {
    provider: 'gemini' | 'openai';
    modelName: string;
    reason: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: GemmaModelId;
  messages: Message[];
  isPinned?: boolean;
  tags?: string[];
  isGroup?: boolean;
  projectId?: string;
  projectName?: string;
  groupData?: {
    inviteCode?: string;
    context?: string;
    customKnowledge?: string;
    members?: any[];
  groupMessages?: any[];
    permissions?: any;
  };
}

export interface EngineStats {
  engineName: string;
  version: string;
  status: 'online' | 'busy' | 'offline';
  loadPercentage: number;
  memoryUsage: string;
  activeThreads: number;
  activeSessions: number;
  totalTokensProcessed: number;
  inferenceBackend: string;
  averageSpeedTps: number;
}

export type SubscriptionTier = 'Kostenlos' | 'Plus' | 'Pro' | 'Ultra' | 'Extreme' | 'Expanded' | 'Unlimited';

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  content: string;
  type?: 'text' | 'image';
  mimeType?: string;
}

export interface RpModule {
  id: string;
  title: string;
  symbol: string;
  iconName?: string;
  htmlContent: string;
  active: boolean;
  description?: string;
}

export interface RpSettings {
  enabled: boolean;
  activeModuleId?: string | null;
  modules: RpModule[];
}

export interface EngineSettings {
  model: GemmaModelId;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemInstruction: string;
  customApiKey: string;
  apiKey?: string;
  selectedAiProvider?: 'auto' | 'gemini' | 'openai' | 'claude' | 'grok' | 'copilot';
  enableAutoRouting?: boolean;
  appMode?: 'auto' | 'webapp' | 'web';
  openaiApiKey?: string;
  claudeApiKey?: string;
  grokApiKey?: string;
  copilotApiKey?: string;
  enableStream: boolean;
  glassBlurIntensity: 'low' | 'medium' | 'high' | 'ultra';
  ambientGlow: boolean;
  externalApiPort: number;
  externalApiEnabled: boolean;
  autoTitleChats: boolean;
  userTier?: SubscriptionTier;
  subscriptionActivatedAt?: number;
  subscriptionExpiresAt?: number;
  usedCodes?: string[];
  appLanguage?: string;
  userNickname?: string;
  userOccupation?: string;
  userAbout?: string;
  customInstructionsDetail?: string;
  enableSoundEffects?: boolean;
  enableVibration?: boolean;
  hapticFeedback?: boolean;
  enhancedAnswers?: boolean;
  librarySearch?: boolean;
  fastAnswers?: boolean;
  enableWorkspace?: boolean;
  autoAudioResponse?: boolean;
  isProTierUnlocked?: boolean;
  enableMemories?: boolean;
  autoSpellCheck?: boolean;
  autoIntelligenceSwitch?: boolean;
  autoComplete?: boolean;
  popularSearches?: boolean;
  webSearchAuto?: boolean;
  soundEffects?: boolean;
  webSearchPlugin?: boolean;
  codeInterpreterPlugin?: boolean;
  toneStyle?: string;
  warmthLevel?: string;
  enthusiasmLevel?: string;
  headingsListsLevel?: string;
  emojiLevel?: string;
  rpEnabled?: boolean;
  rpModules?: RpModule[];
  activeRpModuleId?: string | null;
  vaultCredits?: number;
  osTarget?: 'auto' | 'ios' | 'ipados' | 'macos' | 'android' | 'windows' | 'linux';
  theme?: 'dark' | 'light' | 'system';
  fontScale?: 'small' | 'standard' | 'large';
  boldMode?: boolean;
  fontFamily?: 'jakarta' | 'jetbrains';
  useCases?: string[];
  responseStyle?: 'precise' | 'structured' | 'conversational';
  saveChatHistoryLocally?: boolean;
  anonymousMode?: boolean;
  dailyMode?: 'auto_execute' | 'safe_stream';
  visualFeedback?: 'aurora' | 'minimalist';
  autoScrollDuringGeneration?: boolean;
  enterKeyBehavior?: 'send' | 'newline';
  showLineNumbersInCode?: boolean;
  instantCopyCode?: boolean;
  searchGroundingEnabled?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
  autoBackupIntervalDays?: number;
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  enableShards?: boolean;
  shardsCount?: number;
  streakDays?: number;
  lastDailyVisitTimestamp?: number;
  highestStreak?: number;
}

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  content: string;
  updatedAt?: number;
}

export interface ArcPollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface ArcPoll {
  id: string;
  question: string;
  options: ArcPollOption[];
  createdBy: string;
  createdByName: string;
  createdAt: number;
  isOpen: boolean;
}

export interface ArcTask {
  id: string;
  title: string;
  assignee?: string;
  completed: boolean;
  createdBy: string;
  createdAt: number;
}

export interface ArcDecision {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

export interface ArcCanvasNote {
  id: string;
  text: string;
  color: string;
  createdBy: string;
  createdAt: number;
}

export interface ArcRoom {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
  participantCount?: number;
  aiEnabled?: boolean;
  aiMode?: 'mention' | 'always' | 'disabled' | 'manual';
  isLocked?: boolean;
  rpEnabled?: boolean;
  rpModules?: RpModule[];
  activeRpModuleId?: string | null;
  activeArtifact?: ArtifactData | null;
  rpSharedState?: Record<string, any>;
  customPrompt?: string;
  pinnedMessageIds?: string[];
  polls?: ArcPoll[];
  tasks?: ArcTask[];
  decisions?: ArcDecision[];
  canvasNotes?: ArcCanvasNote[];
}

export interface ArcMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderType: 'user' | 'ai' | 'system';
  content: string;
  createdAt: number;
  reactions?: Record<string, string[]>;
  isAiStreaming?: boolean;
  audioUrl?: string;
  codeSnippet?: { language: string; code: string; title?: string };
  pollData?: ArcPoll;
  taskData?: ArcTask;
  decisionData?: ArcDecision;
  noteData?: ArcCanvasNote;
}

export interface APIIntegrationSnippet {
  language: string;
  title: string;
  code: string;
}

export type AppViewType = 'chat' | 'dice' | 'image' | 'music' | 'video' | 'code' | 'mediathek' | 'projects' | 'knowledge' | string;

export interface ProjectSource {
  id: string;
  name: string;
  type: 'file' | 'note' | 'mediathek' | 'link' | 'chat' | 'project' | 'cookbook';
  content: string;
  size?: string;
  mimeType?: string;
  uploadedAt: number;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  portions?: number | string;
  difficulty?: 'Einfach' | 'Mittel' | 'Anspruchsvoll';
  category?: 'Backen & Kuchen' | 'Hauptgerichte' | 'Suppen & Eintöpfe' | 'Salate' | 'Desserts' | 'Frühstück' | 'Snacks' | string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount?: string;
  category?: string;
  completed: boolean;
  addedAt: number;
}

export interface FridgeScanEntry {
  id: string;
  date: string; // e.g. "2026-09-12"
  displayDate: string; // e.g. "Heute, 12. Sept."
  timestamp: number;
  imageUrl?: string;
  detectedItems: string[];
  missingSuggestions: string[];
  expiringItems?: string[];
  tips?: string;
  recipeIdea?: string;
  peopleCount: number;
}

export interface PlannerState {
  peopleCount: number;
  scans: FridgeScanEntry[];
  shoppingList: ShoppingListItem[];
  lastUpdated?: number;
}

export interface SaphireProject {
  id: string;
  name: string;
  type?: 'project' | 'cookbook' | 'planner';
  recipes?: Recipe[];
  plannerState?: PlannerState;
  icon?: string;
  description?: string;
  instructions?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  createdByName?: string;
  isShared?: boolean;
  isPublished?: boolean;
  isPrivateShared?: boolean;
  sharedWith?: string[];
  sources: ProjectSource[];
  chatIds: string[];
  category?: string;
  color?: string;
  isPinned?: boolean;
}

export interface GeneratedMusicTrack {
  id: string;
  title: string;
  prompt: string;
  genre?: string;
  mood?: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview' | string;
  duration: number; // in seconds
  audioUrl: string;
  lyrics?: string;
  createdAt: number;
  imageUrl?: string;
}

export type MemoryCategory = 'person' | 'preference' | 'technology' | 'project' | 'fact' | 'topic';

export interface MemoryNode {
  id: string;
  label: string;
  category: MemoryCategory;
  description?: string;
  confidence?: number;
  sourceChatTitle?: string;
  createdAt: number;
  updatedAt: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isCustom?: boolean;
}

export interface MemoryEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  strength?: number;
  createdAt?: number;
}

export interface MemoryGraphData {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  lastUpdated: number;
  version: number;
}

