import { MemoryGraphData, MemoryNode, MemoryEdge, MemoryCategory } from '../types';
import { auth, db, doc, setDoc } from './firebase';

export interface MemoryTopic {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const STORAGE_KEY = 'saphire_memory_graph_v1';
const TOPICS_STORAGE_KEY = 'saphire_memory_topics_v1';

export const DEFAULT_MEMORY_TOPICS: MemoryTopic[] = [];

// Helper to push memory data to Firestore for authenticated users
function pushToFirestoreIfLoggedIn(topics?: MemoryTopic[], graph?: MemoryGraphData) {
  try {
    if (typeof window === 'undefined' || !auth?.currentUser) return;
    const user = auth.currentUser;
    const currentTopics = topics || loadMemoryTopics();
    const currentGraph = graph || loadMemoryGraph();
    const memDocRef = doc(db, 'users', user.uid, 'settings', 'memories');
    setDoc(memDocRef, {
      topics: currentTopics,
      graph: currentGraph,
      updatedAt: Date.now()
    }, { merge: true }).catch((err) => {
      console.warn('[MemoryGraph] Firestore sync error:', err);
    });
  } catch (e) {
    console.warn('[MemoryGraph] Firestore sync exception:', e);
  }
}

export function syncMemoriesFromCloud(topics: MemoryTopic[], graph?: MemoryGraphData) {
  if (typeof window === 'undefined') return;
  try {
    if (Array.isArray(topics)) {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
      window.dispatchEvent(new CustomEvent('saphire_memory_topics_updated', { detail: topics }));
    }
    if (graph && Array.isArray(graph.nodes)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
      window.dispatchEvent(new CustomEvent('saphire_memory_graph_updated', { detail: graph }));
    }
  } catch (e) {
    console.error('Failed to sync memories from cloud:', e);
  }
}

export function loadMemoryTopics(): MemoryTopic[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load memory topics:', e);
    return [];
  }
}

export function saveMemoryTopics(topics: MemoryTopic[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
    window.dispatchEvent(new CustomEvent('saphire_memory_topics_updated', { detail: topics }));
    pushToFirestoreIfLoggedIn(topics);
  } catch (e) {
    console.error('Failed to save memory topics:', e);
  }
}

export function addOrUpdateMemoryTopic(title: string, content: string, topicId?: string): MemoryTopic[] {
  const current = loadMemoryTopics();
  const now = Date.now();
  if (topicId) {
    const idx = current.findIndex(t => t.id === topicId);
    if (idx !== -1) {
      current[idx] = { ...current[idx], title, content, updatedAt: now };
      saveMemoryTopics(current);
      return current;
    }
  }

  // Check if topic with same title exists
  const existingIdx = current.findIndex(t => t.title.toLowerCase().trim() === title.toLowerCase().trim());
  if (existingIdx !== -1) {
    current[existingIdx] = { ...current[existingIdx], content, updatedAt: now };
  } else {
    current.push({
      id: `topic_${now}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      content,
      updatedAt: now
    });
  }
  saveMemoryTopics(current);
  return current;
}

export function deleteMemoryTopic(topicId: string): MemoryTopic[] {
  const current = loadMemoryTopics();
  const filtered = current.filter(t => t.id !== topicId);
  saveMemoryTopics(filtered);
  return filtered;
}

export function clearAllMemoryTopics(): MemoryTopic[] {
  saveMemoryTopics([]);
  return [];
}

export function resetMemoryTopicsToDefault(): MemoryTopic[] {
  saveMemoryTopics(DEFAULT_MEMORY_TOPICS);
  return DEFAULT_MEMORY_TOPICS;
}


export const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string; bg: string; border: string; glow: string }> = {
  person: {
    label: 'Personen',
    color: '#f3f4f6',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  },
  technology: {
    label: 'Technologien',
    color: '#e5e7eb',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  },
  preference: {
    label: 'Vorlieben',
    color: '#e5e7eb',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  },
  project: {
    label: 'Projekte',
    color: '#f3f4f6',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  },
  fact: {
    label: 'Fakten',
    color: '#e5e7eb',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  },
  topic: {
    label: 'Themen',
    color: '#e5e7eb',
    bg: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.25)'
  }
};

export function getDefaultMemoryGraph(): MemoryGraphData {
  return {
    nodes: [],
    edges: [],
    lastUpdated: Date.now(),
    version: 1
  };
}

export function loadMemoryGraph(): MemoryGraphData {
  if (typeof window === 'undefined') return getDefaultMemoryGraph();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultMemoryGraph();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return getDefaultMemoryGraph();
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load memory graph from storage:', e);
    return getDefaultMemoryGraph();
  }
}

export function saveMemoryGraph(data: MemoryGraphData): void {
  if (typeof window === 'undefined') return;
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('saphire_memory_graph_updated', { detail: data }));
    pushToFirestoreIfLoggedIn(undefined, data);
  } catch (e) {
    console.error('Failed to save memory graph to storage:', e);
  }
}

export function addMemoryNode(
  nodeData: Omit<MemoryNode, 'id' | 'createdAt' | 'updatedAt'>,
  initialEdge?: { targetNodeId: string; relation: string }
): { graph: MemoryGraphData; newNode: MemoryNode } {
  const current = loadMemoryGraph();
  const now = Date.now();
  const id = `node_${now}_${Math.random().toString(36).substr(2, 6)}`;
  
  const newNode: MemoryNode = {
    ...nodeData,
    id,
    createdAt: now,
    updatedAt: now,
    confidence: nodeData.confidence ?? 0.95
  };

  current.nodes.push(newNode);

  if (initialEdge && initialEdge.targetNodeId) {
    const edgeId = `edge_${now}_${Math.random().toString(36).substr(2, 6)}`;
    current.edges.push({
      id: edgeId,
      source: id,
      target: initialEdge.targetNodeId,
      relation: initialEdge.relation || 'verbunden mit',
      strength: 0.9
    });
  }

  saveMemoryGraph(current);
  return { graph: current, newNode };
}

export function updateMemoryNode(id: string, updates: Partial<MemoryNode>): MemoryGraphData {
  const current = loadMemoryGraph();
  const idx = current.nodes.findIndex(n => n.id === id);
  if (idx !== -1) {
    current.nodes[idx] = {
      ...current.nodes[idx],
      ...updates,
      updatedAt: Date.now()
    };
    saveMemoryGraph(current);
  }
  return current;
}

export function deleteMemoryNode(id: string): MemoryGraphData {
  const current = loadMemoryGraph();
  current.nodes = current.nodes.filter(n => n.id !== id);
  current.edges = current.edges.filter(e => e.source !== id && e.target !== id);
  saveMemoryGraph(current);
  return current;
}

export function addMemoryEdge(source: string, target: string, relation: string): MemoryGraphData {
  const current = loadMemoryGraph();
  // Check if edge already exists
  const exists = current.edges.some(e => e.source === source && e.target === target && e.relation.toLowerCase() === relation.toLowerCase());
  if (!exists && source !== target) {
    const edgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    current.edges.push({
      id: edgeId,
      source,
      target,
      relation: relation.trim() || 'verbunden mit',
      strength: 1,
      createdAt: Date.now()
    });
    saveMemoryGraph(current);
  }
  return current;
}

export function deleteMemoryEdge(edgeId: string): MemoryGraphData {
  const current = loadMemoryGraph();
  current.edges = current.edges.filter(e => e.id !== edgeId);
  saveMemoryGraph(current);
  return current;
}

export function resetMemoryGraphToDefault(): MemoryGraphData {
  const def = getDefaultMemoryGraph();
  saveMemoryGraph(def);
  return def;
}

export function clearMemoryGraph(): MemoryGraphData {
  const empty: MemoryGraphData = {
    nodes: [],
    edges: [],
    lastUpdated: Date.now(),
    version: 1
  };
  saveMemoryGraph(empty);
  return empty;
}

/**
 * Automatically scans user messages or text for memorable entities & facts
 */
export function extractMemoriesFromText(text: string, sourceTitle?: string): { addedNodes: number; addedEdges: number } {
  if (!text || text.length < 4) return { addedNodes: 0, addedEdges: 0 };
  const current = loadMemoryGraph();
  const now = Date.now();
  let addedNodes = 0;
  let addedEdges = 0;

  const trimmed = text.trim();

  // Helper to add or update a graph node
  const registerNode = (label: string, category: MemoryCategory, description: string, confidence = 0.9): string => {
    const existing = current.nodes.find(n => n.label.toLowerCase() === label.toLowerCase() && n.category === category);
    if (existing) {
      existing.updatedAt = now;
      existing.description = description;
      return existing.id;
    }
    const id = `node_auto_${now}_${Math.random().toString(36).substr(2, 5)}`;
    current.nodes.push({
      id,
      label,
      category,
      description,
      confidence,
      sourceChatTitle: sourceTitle,
      createdAt: now,
      updatedAt: now
    });
    addedNodes++;
    return id;
  };

  // 1. Explicit Memory Directives (e.g. "Merke dir: ...", "Merk dir, dass ...", "Erinnere dich an ...", "Notiere dir ...", "Remember that ...")
  const explicitDirectiveRegex = /(?:merke dir|merk dir|erinnere dich an|erinnere dich daran|notiere dir|notier dir|schreib dir auf|speichere dir|bitte merken|merk dir bitte|merke dir bitte|behalte im kopf|remember that|please remember|take note that)(?:\s*[:,-]?\s*)(.+)/i;
  const explicitMatch = trimmed.match(explicitDirectiveRegex);
  if (explicitMatch && explicitMatch[1]) {
    let fact = explicitMatch[1].trim();
    // Strip leading "dass " or "das " or trailing punctuation
    fact = fact.replace(/^(?:dass|das)\s+/i, '').replace(/^[.,:;\s]+/, '');
    if (fact.length >= 3) {
      const cleanWords = fact.split(/\s+/).slice(0, 4).join(' ');
      const topicTitle = `Notiz: ${cleanWords.charAt(0).toUpperCase() + cleanWords.slice(1)}`;
      addOrUpdateMemoryTopic(topicTitle, fact);
      registerNode(cleanWords, 'topic', `Direkt gemerkte Notiz: "${fact}"`, 0.98);
    }
  }

  // 2. Name & Identity
  const nameMatch = trimmed.match(/(?:mein name ist|ich heiße|ich nenne mich)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim();
    registerNode(name, 'person', `Nutzername: ${name}`, 0.99);
    addOrUpdateMemoryTopic('Name & Identität', `Dein Name ist ${name}.`);
  }

  // 3. Location / Residence
  const locationMatch = trimmed.match(/(?:ich wohne in|ich lebe in|mein wohnort ist|ich komme aus)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/i);
  if (locationMatch && locationMatch[1]) {
    const loc = locationMatch[1].trim();
    registerNode(loc, 'topic', `Wohnort: ${loc}`, 0.95);
    addOrUpdateMemoryTopic('Wohnort & Herkunft', `Du wohnst bzw. lebst in ${loc}.`);
  }

  // 4. Profession / Occupation / Studies
  const jobMatch = trimmed.match(/(?:ich arbeite als|mein beruf ist|ich bin beruflich|mein job ist|ich studiere|ich mache eine ausbildung als)\s+([^.!?,\n]{3,50})/i);
  if (jobMatch && jobMatch[1]) {
    const job = jobMatch[1].trim();
    registerNode(job, 'topic', `Berufliche Tätigkeit: ${job}`, 0.92);
    addOrUpdateMemoryTopic('Beruf & Ausbildung', `Deine Tätigkeit: ${job}.`);
  }

  // 5. Age & Birthday
  const ageMatch = trimmed.match(/(?:ich bin\s+(\d{1,2})\s+jahre alt|mein geburtstag ist\s+(?:am\s+)?([^.!?,\n]{3,30}))/i);
  if (ageMatch) {
    const detail = ageMatch[1] ? `${ageMatch[1]} Jahre alt` : ageMatch[2];
    registerNode(detail, 'topic', `Alter / Geburtstag: ${detail}`, 0.95);
    addOrUpdateMemoryTopic('Alter & Geburtstag', `Angabe zu Alter / Geburtstag: ${detail}.`);
  }

  // 6. Preferences & Likes ("Ich mag...", "Ich liebe...", "Meine Lieblings...", "Ich bevorzuge...")
  const favMatch = trimmed.match(/(?:meine lieblings(?:farbe|musik|band|serie|sportart|essen|film|automarke))\s+ist\s+([^.!?,\n]{2,40})/i);
  if (favMatch && favMatch[1]) {
    const fav = favMatch[1].trim();
    registerNode(fav, 'preference', `Lieblingsangabe: ${fav}`, 0.9);
    addOrUpdateMemoryTopic('Vorlieben & Geschmack', `Eine deiner Lieblingsangaben: ${fav}.`);
  }

  const prefMatch = trimmed.match(/(?:ich bevorzuge|ich mag|ich liebe|ich esse gerne|wichtig ist mir|bitte immer|ich trinke gerne)\s+([^.!?,\n]{3,40})/i);
  if (prefMatch && prefMatch[1]) {
    const prefText = prefMatch[1].trim();
    registerNode(prefText, 'preference', `Erkannte Präferenz: "${prefText}"`, 0.88);
    addOrUpdateMemoryTopic('Vorlieben & Interessen', `Du bevorzugst bzw. magst: ${prefText}.`);
  }

  // 7. Pets & Companions
  const petMatch = trimmed.match(/(?:ich habe einen hund|ich habe eine katze|mein hund|meine katze|mein haustier)\s*(?:namens|heißt)?\s*([^.!?,\n]{2,30})/i);
  if (petMatch && petMatch[1]) {
    const pet = petMatch[1].trim();
    registerNode(pet, 'topic', `Haustier: ${pet}`, 0.9);
    addOrUpdateMemoryTopic('Haustiere & Begleiter', `Du hast ein Haustier: ${pet}.`);
  }

  // 8. Projects
  const projMatch = trimmed.match(/(?:mein projekt heißt|ich baue gerade|ich entwickle|ich arbeite an einem projekt namens)\s+([^.!?,\n]{3,50})/i);
  if (projMatch && projMatch[1]) {
    const proj = projMatch[1].trim();
    registerNode(proj, 'topic', `Projekt: ${proj}`, 0.9);
    addOrUpdateMemoryTopic('Aktuelle Projekte', `Du arbeitest an folgendem Projekt: ${proj}.`);
  }

  // 9. Tech stack / Tools
  const techKeywords = ['react', 'vue', 'angular', 'svelte', 'typescript', 'javascript', 'python', 'rust', 'golang', 'docker', 'kubernetes', 'postgresql', 'mongodb', 'tailwind', 'nextjs', 'fastapi', 'django', 'pytorch', 'tensorflow', 'gemini', 'firebase', 'drizzle', 'vite', 'linux', 'macos', 'windows', 'c++', 'c#', 'node.js', 'express'];
  const matchedTechs: string[] = [];
  techKeywords.forEach(k => {
    if (new RegExp(`\\b${k.replace('.', '\\.')}\\b`, 'i').test(trimmed)) {
      const properLabel = k.charAt(0).toUpperCase() + k.slice(1);
      matchedTechs.push(properLabel);
      registerNode(properLabel, 'technology', `Technologie / Werkzeug`, 0.9);
    }
  });

  if (matchedTechs.length > 0) {
    const allTechNodes = current.nodes.filter(n => n.category === 'technology');
    const techSummary = `Du nutzt und interessierst dich für Technologien wie: ${allTechNodes.map(t => t.label).join(', ')}.`;
    addOrUpdateMemoryTopic('Technologie & Werkzeuge', techSummary);
  }

  if (addedNodes > 0 || addedEdges > 0) {
    saveMemoryGraph(current);
  }

  return { addedNodes, addedEdges };
}

/**
 * Formats the Memory Graph into an ultra-concise, structured text block for LLM System Prompt injection
 */
export function formatMemoryGraphForAIContext(): string {
  const topics = loadMemoryTopics();
  const graph = loadMemoryGraph();

  let context = `\n\n[HINTERGRUND-KONTEXT & PERSÖNLICHE ERINNERUNGEN]\n(Hinterlegtes Hintergrundwissen über den Nutzer für präzisere Antworten. WICHTIGE ANWEISUNG: Nutze dieses Wissen diskret im Hintergrund. Gehe NICHT ungefragt in jeder Antwort darauf ein und erwähne es NICHT künstlich, sondern beziehe dich NUR DANN explizit darauf, wenn die Anfrage des Nutzers direkt und spezifisch danach fragt oder das Thema unmittelbar darauf abzielt):\n`;

  if (topics && topics.length > 0) {
    topics.forEach(t => {
      context += `### ${t.title}:\n${t.content}\n\n`;
    });
  }

  if (graph.nodes && graph.nodes.length > 0) {
    const nodeMap = new Map<string, MemoryNode>();
    graph.nodes.forEach(n => nodeMap.set(n.id, n));

    const categorized: Record<string, string[]> = {};
    graph.nodes.forEach(n => {
      const catLabel = CATEGORY_CONFIG[n.category]?.label || n.category;
      if (!categorized[catLabel]) categorized[catLabel] = [];
      const desc = n.description ? ` (${n.description})` : '';
      categorized[catLabel].push(`${n.label}${desc}`);
    });

    for (const [cat, items] of Object.entries(categorized)) {
      context += `* ${cat}: ${items.join('; ')}\n`;
    }
  }

  return context.trim() ? context : '';
}
