import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Network,
  Plus,
  Trash2,
  Edit2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link as LinkIcon,
  Sparkles,
  Check,
  X,
  User,
  Cpu,
  Heart,
  FolderGit2,
  BookOpen,
  Tag,
  List,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  MemoryGraphData,
  MemoryNode,
  MemoryEdge,
  MemoryCategory
} from '../types';
import {
  loadMemoryGraph,
  saveMemoryGraph,
  addMemoryNode,
  updateMemoryNode,
  deleteMemoryNode,
  addMemoryEdge,
  deleteMemoryEdge,
  resetMemoryGraphToDefault,
  clearMemoryGraph,
  extractMemoriesFromText,
  CATEGORY_CONFIG
} from '../lib/memoryGraphService';

interface MemoryGraphMindmapProps {
  chatSessions?: any[];
  onOpenChat?: (chatId: string) => void;
}

const CATEGORY_ICONS: Record<MemoryCategory, React.ComponentType<{ className?: string }>> = {
  person: User,
  technology: Cpu,
  preference: Heart,
  project: FolderGit2,
  fact: Tag,
  topic: BookOpen
};

export const MemoryGraphMindmap: React.FC<MemoryGraphMindmapProps> = ({
  chatSessions = []
}) => {
  const [graph, setGraph] = useState<MemoryGraphData>(loadMemoryGraph);
  const [activeTab, setActiveTab] = useState<'mindmap' | 'list'>('mindmap');
  const [selectedCategoryId, setSelectedCategoryId] = useState<MemoryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected & Hovered Node
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Modals
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isAddEdgeModalOpen, setIsAddEdgeModalOpen] = useState(false);
  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form States - Add Node
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeCategory, setNewNodeCategory] = useState<MemoryCategory>('fact');
  const [newNodeDescription, setNewNodeDescription] = useState('');
  const [newNodeTargetId, setNewNodeTargetId] = useState('');
  const [newNodeRelation, setNewNodeRelation] = useState('');

  // Form States - Add Edge
  const [edgeSourceId, setEdgeSourceId] = useState('');
  const [edgeTargetId, setEdgeTargetId] = useState('');
  const [edgeRelation, setEdgeRelation] = useState('verbunden mit');

  // Form States - Edit Node
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('fact');
  const [editDescription, setEditDescription] = useState('');

  // Canvas Refs & Viewport Transforms
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const draggedNodeId = useRef<string | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Physical simulation state
  const simNodes = useRef<Array<MemoryNode & { x: number; y: number; vx: number; vy: number }>>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with storage events
  useEffect(() => {
    const handleStorageUpdate = (e: any) => {
      if (e.detail) {
        setGraph(e.detail);
      } else {
        setGraph(loadMemoryGraph());
      }
    };
    window.addEventListener('saphire_memory_graph_updated', handleStorageUpdate);
    return () => window.removeEventListener('saphire_memory_graph_updated', handleStorageUpdate);
  }, []);

  // Initialize simulation positions
  useEffect(() => {
    const radius = Math.min(200, 30 + graph.nodes.length * 18);
    simNodes.current = graph.nodes.map((n, i) => {
      const angle = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      return {
        ...n,
        x: n.x ?? Math.cos(angle) * radius,
        y: n.y ?? Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });
  }, [graph.nodes]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    return graph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [graph.nodes, selectedNodeId]);

  // Filtered nodes for list/search
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter(n => {
      const matchCat = selectedCategoryId === 'all' || n.category === selectedCategoryId;
      const matchQuery = !searchQuery.trim() || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [graph.nodes, selectedCategoryId, searchQuery]);

  // Node Relations helper
  const getNodeRelations = useCallback((nodeId: string) => {
    const outgoing = graph.edges
      .filter(e => e.source === nodeId)
      .map(e => ({
        edgeId: e.id,
        relation: e.relation,
        targetNode: graph.nodes.find(n => n.id === e.target),
        type: 'outgoing' as const
      }))
      .filter(item => item.targetNode);

    const incoming = graph.edges
      .filter(e => e.target === nodeId)
      .map(e => ({
        edgeId: e.id,
        relation: e.relation,
        sourceNode: graph.nodes.find(n => n.id === e.source),
        type: 'incoming' as const
      }))
      .filter(item => item.sourceNode);

    return { outgoing, incoming };
  }, [graph]);

  // Handle Delete Node
  const handleDeleteNode = (id: string, label?: string) => {
    const updated = deleteMemoryNode(id);
    setGraph(updated);
    if (selectedNodeId === id) setSelectedNodeId(null);
    showToast(`"${label || 'Fakt'}" gelöscht`);
  };

  // Handle Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    const updated = deleteMemoryEdge(edgeId);
    setGraph(updated);
    showToast('Verbindung gelöscht');
  };

  // Handle Auto-Scan from existing chat sessions
  const handleAutoScanChats = () => {
    if (!chatSessions || chatSessions.length === 0) {
      showToast('Keine Chats zum Scannen gefunden');
      return;
    }
    let totalAddedNodes = 0;
    let totalAddedEdges = 0;

    chatSessions.forEach(session => {
      if (session.messages && Array.isArray(session.messages)) {
        session.messages.forEach((m: any) => {
          if (m.role === 'user' && m.content) {
            const res = extractMemoriesFromText(m.content, session.title);
            totalAddedNodes += res.addedNodes;
            totalAddedEdges += res.addedEdges;
          }
        });
      }
    });

    const refreshed = loadMemoryGraph();
    setGraph(refreshed);

    if (totalAddedNodes > 0) {
      showToast(`${totalAddedNodes} neue Fakten gelernt & verknüpft.`);
    } else {
      showToast('Wissensnetzwerk ist bereits auf dem neuesten Stand.');
    }
  };

  // Canvas Force Simulation Loop (Monochrome Rendering)
  useEffect(() => {
    if (activeTab !== 'mindmap') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      // Center canvas + pan & zoom
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // Draw subtle background grid dots (Monochrome)
      const gridSize = 40;
      const startX = -width / (2 * zoom) - pan.x / zoom;
      const endX = width / (2 * zoom) - pan.x / zoom;
      const startY = -height / (2 * zoom) - pan.y / zoom;
      const endY = height / (2 * zoom) - pan.y / zoom;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let gx = Math.floor(startX / gridSize) * gridSize; gx < endX; gx += gridSize) {
        for (let gy = Math.floor(startY / gridSize) * gridSize; gy < endY; gy += gridSize) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Force Physics Step
      const nodes = simNodes.current;
      const edges = graph.edges;

      // 1. Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 300) {
            const force = (300 - dist) / dist * 0.4;
            if (draggedNodeId.current !== nodes[i].id) {
              nodes[i].vx -= dx * force * 0.05;
              nodes[i].vy -= dy * force * 0.05;
            }
            if (draggedNodeId.current !== nodes[j].id) {
              nodes[j].vx += dx * force * 0.05;
              nodes[j].vy += dy * force * 0.05;
            }
          }
        }
      }

      // 2. Spring Attraction along Edges
      edges.forEach(e => {
        const src = nodes.find(n => n.id === e.source);
        const tgt = nodes.find(n => n.id === e.target);
        if (src && tgt) {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 130;
          const force = (dist - targetDist) * 0.02;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (draggedNodeId.current !== src.id) {
            src.vx += fx;
            src.vy += fy;
          }
          if (draggedNodeId.current !== tgt.id) {
            tgt.vx -= fx;
            tgt.vy -= fy;
          }
        }
      });

      // 3. Center Gravity & Damping
      nodes.forEach(n => {
        if (draggedNodeId.current !== n.id) {
          n.vx -= n.x * 0.003;
          n.vy -= n.y * 0.003;

          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.82;
          n.vy *= 0.82;
        }
      });

      // DRAW EDGES (Monochrome Clean Lines & Badges)
      edges.forEach(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        const isHighlighted = selectedNodeId === src.id || selectedNodeId === tgt.id || hoveredNodeId === src.id || hoveredNodeId === tgt.id;
        const isDimmed = (selectedNodeId || hoveredNodeId) && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        ctx.strokeStyle = isHighlighted 
          ? 'rgba(255, 255, 255, 0.8)' 
          : isDimmed 
            ? 'rgba(255, 255, 255, 0.04)' 
            : 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();

        // Draw Relation Label Pill on edge midpoint
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;

        if (edge.relation && (!isDimmed || isHighlighted)) {
          ctx.font = '10px Plus Jakarta Sans, sans-serif';
          const textMetrics = ctx.measureText(edge.relation);
          const paddingX = 7;
          const boxWidth = textMetrics.width + paddingX * 2;
          const boxHeight = 16;

          ctx.fillStyle = isHighlighted ? '#242424' : '#141414';
          ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          ctx.roundRect(midX - boxWidth / 2, midY - boxHeight / 2, boxWidth, boxHeight, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isHighlighted ? '#ffffff' : '#888888';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.relation, midX, midY + 0.5);
        }
      });

      // DRAW NODES (Monochrome Capsular Pills)
      nodes.forEach(node => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const matchesCategory = selectedCategoryId === 'all' || node.category === selectedCategoryId;
        const matchesSearch = !searchQuery.trim() || node.label.toLowerCase().includes(searchQuery.toLowerCase());
        const isDimmed = (!matchesCategory || !matchesSearch) || ((selectedNodeId || hoveredNodeId) && !isSelected && !isHovered && !edges.some(e => (e.source === node.id && (e.target === selectedNodeId || e.target === hoveredNodeId)) || (e.target === node.id && (e.source === selectedNodeId || e.source === hoveredNodeId))));

        // Measure node dimensions
        ctx.font = isSelected ? '600 12px Plus Jakarta Sans, sans-serif' : '500 12px Plus Jakarta Sans, sans-serif';
        const labelMetrics = ctx.measureText(node.label);
        const nodeWidth = Math.max(64, labelMetrics.width + 30);
        const nodeHeight = 30;

        ctx.save();
        ctx.translate(node.x, node.y);

        if (isDimmed) {
          ctx.globalAlpha = 0.2;
        }

        // Node Background Body
        ctx.beginPath();
        ctx.roundRect(-nodeWidth / 2, -nodeHeight / 2, nodeWidth, nodeHeight, 15);
        ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#222222' : '#121212';
        ctx.fill();

        // Node Border
        ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.stroke();

        // Small Monochrome Indicator Dot
        ctx.beginPath();
        ctx.arc(-nodeWidth / 2 + 12, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#000000' : '#888888';
        ctx.fill();

        // Node Label Text
        ctx.fillStyle = isSelected ? '#000000' : '#e5e5e5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, -nodeWidth / 2 + 20, 0.5);

        ctx.restore();
      });

      ctx.restore();
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [activeTab, graph, zoom, pan, selectedNodeId, hoveredNodeId, selectedCategoryId, searchQuery]);

  // Handle Resize of canvas
  useEffect(() => {
    if (activeTab !== 'mindmap') return;
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  // Helper to find node under pointer
  const getNodeAtPoint = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Convert to world coordinates
    const worldX = (mouseX - rect.width / 2 - pan.x) / zoom;
    const worldY = (mouseY - rect.height / 2 - pan.y) / zoom;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    for (let i = simNodes.current.length - 1; i >= 0; i--) {
      const node = simNodes.current[i];
      ctx.font = '500 12px Plus Jakarta Sans, sans-serif';
      const labelMetrics = ctx.measureText(node.label);
      const nodeWidth = Math.max(64, labelMetrics.width + 30);
      const nodeHeight = 30;

      if (
        worldX >= node.x - nodeWidth / 2 &&
        worldX <= node.x + nodeWidth / 2 &&
        worldY >= node.y - nodeHeight / 2 &&
        worldY <= node.y + nodeHeight / 2
      ) {
        return node.id;
      }
    }
    return null;
  };

  // Pointer event handlers for canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const clickedNodeId = getNodeAtPoint(e.clientX, e.clientY);
    if (clickedNodeId) {
      draggedNodeId.current = clickedNodeId;
      setSelectedNodeId(clickedNodeId);
    } else {
      isDraggingCanvas.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hoveredId = getNodeAtPoint(e.clientX, e.clientY);
    setHoveredNodeId(hoveredId);

    if (draggedNodeId.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = (mouseX - rect.width / 2 - pan.x) / zoom;
      const worldY = (mouseY - rect.height / 2 - pan.y) / zoom;

      const node = simNodes.current.find(n => n.id === draggedNodeId.current);
      if (node) {
        node.x = worldX;
        node.y = worldY;
        node.vx = 0;
        node.vy = 0;
      }
    } else if (isDraggingCanvas.current) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    if (draggedNodeId.current) {
      const node = simNodes.current.find(n => n.id === draggedNodeId.current);
      if (node) {
        updateMemoryNode(node.id, { x: node.x, y: node.y });
      }
      draggedNodeId.current = null;
    }
    isDraggingCanvas.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2.2, Math.max(0.4, prev * zoomFactor)));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col h-full w-full font-['Plus_Jakarta_Sans'] text-neutral-100 select-none">
      {/* Toast Notification (Monochrome) */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-[#1c1c1c] border border-white/15 text-xs text-white shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & View Controls (Clean & Monochrome) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Wissensnetzwerk (Memory)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/10 text-neutral-300 border border-white/10">
                {graph.nodes.length} Fakten
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Dandelious merkt sich Fakten & Vorlieben automatisch oder du verwaltest sie manuell.
            </p>
          </div>
        </div>

        {/* Top Right Action Tools */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Segmented Tab Switcher: Mindmap vs Liste */}
          <div className="flex p-0.5 bg-[#141414] rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'mindmap'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mindmap</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddNodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Fakt hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar (Monochrome) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 py-3 border-b border-white/10">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              selectedCategoryId === 'all'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Alle ({graph.nodes.length})
          </button>
          {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map(catKey => {
            const count = graph.nodes.filter(n => n.category === catKey).length;
            const config = CATEGORY_CONFIG[catKey];
            const isSelected = selectedCategoryId === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryId(isSelected ? 'all' : catKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{config.label}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Scan Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full bg-[#121212] border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={handleAutoScanChats}
            title="Vorhandene Chats nach Fakten scannen"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-neutral-400" />
            <span className="hidden sm:inline">Chats scannen</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 min-h-[400px] overflow-hidden mt-3 bg-[#080808] rounded-2xl border border-white/10 flex flex-col">
        {activeTab === 'mindmap' ? (
          /* ========================================================================= */
          /* 1. VISUELLE MINDMAP (CANVAS FORCE GRAPH) - MONOCHROME                      */
          /* ========================================================================= */
          <div ref={containerRef} className="relative w-full h-full flex-1 overflow-hidden min-h-[400px]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            />

            {/* Floating Zoom & Connection Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
              <div className="flex flex-col bg-[#141414]/90 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
                <button
                  onClick={() => setZoom(prev => Math.min(2.2, prev * 1.15))}
                  className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Vergrößern"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-[1px] bg-white/10" />
                <button
                  onClick={() => setZoom(prev => Math.max(0.4, prev * 0.85))}
                  className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Verkleinern"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="h-[1px] bg-white/10" />
                <button
                  onClick={handleResetView}
                  className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Ansicht zentrieren"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsAddEdgeModalOpen(true)}
                className="p-2 bg-[#141414]/90 hover:bg-white/15 text-neutral-300 hover:text-white rounded-xl border border-white/10 shadow-xl transition-colors cursor-pointer flex items-center justify-center"
                title="Verbindung erstellen"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Info Hint */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212]/90 backdrop-blur-md border border-white/10 text-[11px] text-neutral-400 pointer-events-none">
              <span>Knoten anklicken zum Bearbeiten & Löschen • Ziehen zum Verschieben</span>
            </div>

            {/* Node Inspector Drawer when a node is selected */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: -15, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -15, scale: 0.96 }}
                  className="absolute top-3 left-3 z-30 w-72 max-w-[calc(100%-24px)] bg-[#141414]/95 backdrop-blur-xl rounded-2xl border border-white/15 p-4 shadow-2xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white tracking-tight">
                          {selectedNode.label}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300 font-medium">
                          {CATEGORY_CONFIG[selectedNode.category]?.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedNode.description && (
                    <p className="text-xs text-neutral-300 leading-relaxed bg-[#0c0c0c] p-2.5 rounded-xl border border-white/5">
                      {selectedNode.description}
                    </p>
                  )}

                  {/* Connected Relations List */}
                  {(() => {
                    const relations = getNodeRelations(selectedNode.id);
                    const hasRelations = relations.outgoing.length > 0 || relations.incoming.length > 0;
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
                          <span>Verbindungen</span>
                          <button
                            onClick={() => {
                              setEdgeSourceId(selectedNode.id);
                              setIsAddEdgeModalOpen(true);
                            }}
                            className="text-white hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Neu
                          </button>
                        </div>

                        {hasRelations ? (
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {relations.outgoing.map((rel, rIdx) => (
                              <div
                                key={`out-rel-${rel.edgeId || rIdx}-${rIdx}`}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 text-xs text-neutral-300 group"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-[10px] text-neutral-500 font-mono">→ {rel.relation}:</span>
                                  <span className="text-white font-medium truncate">{rel.targetNode?.label}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteEdge(rel.edgeId)}
                                  className="text-neutral-500 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Verbindung löschen"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {relations.incoming.map((rel, rIdx) => (
                              <div
                                key={`in-rel-${rel.edgeId || rIdx}-${rIdx}`}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 text-xs text-neutral-300 group"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-white font-medium truncate">{rel.sourceNode?.label}</span>
                                  <span className="text-[10px] text-neutral-500 font-mono">({rel.relation})</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteEdge(rel.edgeId)}
                                  className="text-neutral-500 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Verbindung löschen"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-neutral-500 italic">Keine Verknüpfungen.</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions: Edit & 1-Click Delete */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditLabel(selectedNode.label);
                        setEditCategory(selectedNode.category);
                        setEditDescription(selectedNode.description || '');
                        setIsEditNodeModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer border border-white/10"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Bearbeiten</span>
                    </button>

                    <button
                      onClick={() => handleDeleteNode(selectedNode.id, selectedNode.label)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-white/10"
                      title="1-Klick Löschen"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Löschen</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. STRUKTURIERTE LISTENANSICHT - AUFGERÄUMT & MONOCHROM                   */
          /* ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Brain className="w-8 h-8 text-neutral-600 mb-2" />
                <h4 className="text-sm font-medium text-neutral-300">Keine Fakten gefunden</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Füge einen Fakt hinzu oder scanne deine Chatverläufe.
                </p>
                <button
                  onClick={() => setIsAddNodeModalOpen(true)}
                  className="mt-3 px-3.5 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Neuen Fakt anlegen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredNodes.map(node => {
                  const catConfig = CATEGORY_CONFIG[node.category] || CATEGORY_CONFIG.fact;
                  const Icon = CATEGORY_ICONS[node.category] || Tag;
                  const relations = getNodeRelations(node.id);
                  const totalRelCount = relations.outgoing.length + relations.incoming.length;

                  return (
                    <div
                      key={node.id}
                      className="p-3 rounded-xl bg-[#121212] border border-white/10 hover:border-white/20 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white tracking-tight">
                              {node.label}
                            </div>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {catConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* 1-Click Delete & Edit Buttons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedNodeId(node.id);
                              setEditLabel(node.label);
                              setEditCategory(node.category);
                              setEditDescription(node.description || '');
                              setIsEditNodeModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Bearbeiten"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(node.id, node.label)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                            title="1-Klick Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {node.description && (
                        <p className="text-xs text-neutral-300 leading-relaxed bg-[#0a0a0a] p-2 rounded-lg border border-white/5">
                          {node.description}
                        </p>
                      )}

                      {totalRelCount > 0 && (
                        <div className="pt-1.5 border-t border-white/5 flex flex-wrap gap-1">
                          {relations.outgoing.map((rel, rIdx) => (
                            <span
                              key={`out-span-${rel.edgeId || rIdx}-${rIdx}`}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5 flex items-center gap-1"
                            >
                              <span className="text-neutral-500">→ {rel.relation}:</span>
                              <span className="text-white">{rel.targetNode?.label}</span>
                            </span>
                          ))}
                          {relations.incoming.map((rel, rIdx) => (
                            <span
                              key={`in-span-${rel.edgeId || rIdx}-${rIdx}`}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-neutral-300 border border-white/5 flex items-center gap-1"
                            >
                              <span className="text-white">{rel.sourceNode?.label}</span>
                              <span className="text-neutral-500">({rel.relation})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Utility Bar (Monochrome) */}
      <div className="flex items-center justify-between pt-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span>{graph.nodes.length} Entitäten</span>
          <span>•</span>
          <span>{graph.edges.length} Verbindungen</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Wissensnetzwerk auf Standard-Werte zurücksetzen?')) {
                const def = resetMemoryGraphToDefault();
                setGraph(def);
                showToast('Standard wiederhergestellt');
              }
            }}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Standard laden
          </button>
          <span>•</span>
          <button
            onClick={() => {
              if (confirm('Möchtest du wirklich alle gemerkten Fakten leeren?')) {
                const empty = clearMemoryGraph();
                setGraph(empty);
                setSelectedNodeId(null);
                showToast('Alle Fakten wurden gelöscht');
              }
            }}
            className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            Graph leeren
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NEUEN FAKT ANLEGEN (MONOCHROME)                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddNodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-[#141414] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-white" />
                  <h4 className="text-sm font-semibold text-white">Neuen Fakt anlegen</h4>
                </div>
                <button
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Name / Begriff *</label>
                  <input
                    type="text"
                    value={newNodeLabel}
                    onChange={e => setNewNodeLabel(e.target.value)}
                    placeholder="z. B. PostgreSQL, Sarah, Bevorzugt TypeScript"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Kategorie *</label>
                  <select
                    value={newNodeCategory}
                    onChange={e => setNewNodeCategory(e.target.value as MemoryCategory)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="person">Person</option>
                    <option value="technology">Technologie</option>
                    <option value="preference">Vorliebe</option>
                    <option value="project">Projekt</option>
                    <option value="fact">Fakt</option>
                    <option value="topic">Thema</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Beschreibung / Kontext (optional)</label>
                  <textarea
                    rows={2}
                    value={newNodeDescription}
                    onChange={e => setNewNodeDescription(e.target.value)}
                    placeholder="Ergänzende Details..."
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                {/* Optional Connection to existing node */}
                {graph.nodes.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
                      Optionale Verknüpfung
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newNodeTargetId}
                        onChange={e => setNewNodeTargetId(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        <option value="">Keine Verknüpfung</option>
                        {graph.nodes.map(n => (
                          <option key={n.id} value={n.id}>
                            {n.label} ({CATEGORY_CONFIG[n.category]?.label})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newNodeRelation}
                        onChange={e => setNewNodeRelation(e.target.value)}
                        placeholder="Relation (z. B. nutzt)"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (!newNodeLabel.trim()) {
                      alert('Bitte einen Begriff angeben.');
                      return;
                    }
                    const res = addMemoryNode(
                      {
                        label: newNodeLabel.trim(),
                        category: newNodeCategory,
                        description: newNodeDescription.trim() || undefined,
                        confidence: 1.0,
                        isCustom: true
                      },
                      newNodeTargetId ? { targetNodeId: newNodeTargetId, relation: newNodeRelation.trim() } : undefined
                    );
                    setGraph(res.graph);
                    setSelectedNodeId(res.newNode.id);
                    setNewNodeLabel('');
                    setNewNodeDescription('');
                    setNewNodeTargetId('');
                    setNewNodeRelation('');
                    setIsAddNodeModalOpen(false);
                    showToast(`"${newNodeLabel}" hinzugefügt`);
                  }}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: VERBINDUNG KNÜPFEN (MONOCHROME)                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddEdgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-[#141414] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-white" />
                  <h4 className="text-sm font-semibold text-white">Neue Verbindung erstellen</h4>
                </div>
                <button
                  onClick={() => setIsAddEdgeModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Ausgangspunkt *</label>
                  <select
                    value={edgeSourceId || (graph.nodes[0]?.id || '')}
                    onChange={e => setEdgeSourceId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    {graph.nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({CATEGORY_CONFIG[n.category]?.label})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Beziehung (Relation) *</label>
                  <input
                    type="text"
                    value={edgeRelation}
                    onChange={e => setEdgeRelation(e.target.value)}
                    placeholder="z. B. arbeitet an, nutzt, bevorzugt"
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Endpunkt *</label>
                  <select
                    value={edgeTargetId || (graph.nodes[1]?.id || '')}
                    onChange={e => setEdgeTargetId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    {graph.nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({CATEGORY_CONFIG[n.category]?.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddEdgeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    const src = edgeSourceId || graph.nodes[0]?.id;
                    const tgt = edgeTargetId || graph.nodes[1]?.id;
                    if (!src || !tgt || src === tgt) {
                      alert('Bitte zwei unterschiedliche Knoten auswählen.');
                      return;
                    }
                    const updated = addMemoryEdge(src, tgt, edgeRelation.trim());
                    setGraph(updated);
                    setIsAddEdgeModalOpen(false);
                    showToast('Verbindung erstellt');
                  }}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Verknüpfen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: FAKT BEARBEITEN (MONOCHROME)                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isEditNodeModalOpen && selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-[#141414] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-white" />
                  <h4 className="text-sm font-semibold text-white">Fakt bearbeiten</h4>
                </div>
                <button
                  onClick={() => setIsEditNodeModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Name / Begriff *</label>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Kategorie *</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as MemoryCategory)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 cursor-pointer"
                  >
                    <option value="person">Person</option>
                    <option value="technology">Technologie</option>
                    <option value="preference">Vorliebe</option>
                    <option value="project">Projekt</option>
                    <option value="fact">Fakt</option>
                    <option value="topic">Thema</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Beschreibung</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditNodeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    if (!editLabel.trim()) return;
                    const updated = updateMemoryNode(selectedNode.id, {
                      label: editLabel.trim(),
                      category: editCategory,
                      description: editDescription.trim() || undefined
                    });
                    setGraph(updated);
                    setIsEditNodeModalOpen(false);
                    showToast('Änderungen gespeichert');
                  }}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
