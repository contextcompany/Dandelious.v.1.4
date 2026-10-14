import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import {
  Network,
  Brain,
  Search,
  Plus,
  Trash2,
  Edit3,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  Check,
  Tag,
  User,
  Cpu,
  Heart,
  FolderGit2,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Filter,
  Eye,
  Sliders,
  Share2,
  Download,
  Info,
  Layers,
  ArrowUpRight,
  MessageSquare
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
  loadMemoryTopics,
  saveMemoryTopics,
  addOrUpdateMemoryTopic,
  deleteMemoryTopic,
  MemoryTopic,
  CATEGORY_CONFIG
} from '../lib/memoryGraphService';
import { DandeliousLogo } from './DandeliousLogo';
import { playSound } from '../utils/sound';

interface KnowledgeBaseDashboardProps {
  onBackToChat?: () => void;
  onNewChatWithPrompt?: (prompt: string) => void;
  enableSoundEffects?: boolean;
}

const CATEGORY_ICONS: Record<MemoryCategory, React.ComponentType<{ className?: string }>> = {
  person: User,
  technology: Cpu,
  preference: Heart,
  project: FolderGit2,
  fact: Tag,
  topic: BookOpen
};

const CATEGORY_COLORS: Record<MemoryCategory, { stroke: string; fill: string; text: string; glow: string }> = {
  person: { stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.15)', text: '#93c5fd', glow: 'rgba(96, 165, 250, 0.4)' },
  technology: { stroke: '#C5DC57', fill: 'rgba(197, 220, 87, 0.18)', text: '#d4ec67', glow: 'rgba(197, 220, 87, 0.5)' },
  preference: { stroke: '#f472b6', fill: 'rgba(244, 114, 182, 0.15)', text: '#fbcfe8', glow: 'rgba(244, 114, 182, 0.4)' },
  project: { stroke: '#fbbf24', fill: 'rgba(251, 191, 36, 0.15)', text: '#fde68a', glow: 'rgba(251, 191, 36, 0.4)' },
  fact: { stroke: '#a78bfa', fill: 'rgba(167, 139, 250, 0.15)', text: '#ddd6fe', glow: 'rgba(167, 139, 250, 0.4)' },
  topic: { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.15)', text: '#a7f3d0', glow: 'rgba(52, 211, 153, 0.4)' }
};

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  category: MemoryCategory;
  description?: string;
  confidence?: number;
  sourceChatTitle?: string;
  createdAt: number;
  updatedAt: number;
  radius: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: D3Node | string;
  target: D3Node | string;
  relation: string;
  strength?: number;
}

export const KnowledgeBaseDashboard: React.FC<KnowledgeBaseDashboardProps> = ({
  onBackToChat,
  onNewChatWithPrompt,
  enableSoundEffects = true
}) => {
  const [graphData, setGraphData] = useState<MemoryGraphData>(loadMemoryGraph);
  const [topics, setTopics] = useState<MemoryTopic[]>(loadMemoryTopics);
  const [activeTab, setActiveTab] = useState<'network' | 'matrix' | 'topics'>('network');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Node for Detail Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Modals & Forms
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [isExtractorOpen, setIsExtractorOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Node Form State
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeCategory, setNodeCategory] = useState<MemoryCategory>('technology');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeTargetId, setNodeTargetId] = useState('');
  const [nodeRelation, setNodeRelation] = useState('verbunden mit');

  // Edge Form State
  const [edgeSourceId, setEdgeSourceId] = useState('');
  const [edgeTargetId, setEdgeTargetId] = useState('');
  const [edgeRelationText, setEdgeRelationText] = useState('verbunden mit');

  // Topic Form State
  const [topicTitle, setTopicTitle] = useState('');
  const [topicContent, setTopicContent] = useState('');

  // Extractor Test State
  const [extractorText, setExtractorText] = useState('');
  const [extractorResult, setExtractorResult] = useState<{ addedNodes: number; addedEdges: number } | null>(null);

  // Canvas / SVG Graph Refs
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Real-time synchronization with custom events
  useEffect(() => {
    const handleGraphUpdate = (e: CustomEvent<MemoryGraphData>) => {
      if (e.detail) setGraphData(e.detail);
    };
    const handleTopicsUpdate = (e: CustomEvent<MemoryTopic[]>) => {
      if (e.detail) setTopics(e.detail);
    };

    window.addEventListener('saphire_memory_graph_updated' as any, handleGraphUpdate);
    window.addEventListener('saphire_memory_topics_updated' as any, handleTopicsUpdate);

    return () => {
      window.removeEventListener('saphire_memory_graph_updated' as any, handleGraphUpdate);
      window.removeEventListener('saphire_memory_topics_updated' as any, handleTopicsUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered nodes & edges
  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter(n => {
      const matchCat = selectedCategory === 'all' || n.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [graphData.nodes, selectedCategory, searchQuery]);

  const selectedNode = useMemo(() => {
    return graphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [graphData.nodes, selectedNodeId]);

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return graphData.edges.filter(e => e.source === selectedNodeId || e.target === selectedNodeId);
  }, [graphData.edges, selectedNodeId]);

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighborIds = new Set<string>();
    connectedEdges.forEach(e => {
      if (e.source === selectedNodeId) neighborIds.add(e.target);
      if (e.target === selectedNodeId) neighborIds.add(e.source);
    });
    return graphData.nodes.filter(n => neighborIds.has(n.id));
  }, [connectedEdges, graphData.nodes, selectedNodeId]);

  // D3 Force-Directed Simulation Setup
  useEffect(() => {
    if (activeTab !== 'network' || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Clear previous elements
    svg.selectAll('*').remove();

    // Setup defs (markers, glow filters)
    const defs = svg.append('defs');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(255, 255, 255, 0.4)');

    // Arrow marker selected
    defs.append('marker')
      .attr('id', 'arrowhead-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#C5DC57');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'node-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Main graph group
    const g = svg.append('g').attr('class', 'graph-container');

    // Setup Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Prepare Node and Link Data
    const nodeMap = new Map<string, D3Node>();
    const d3Nodes: D3Node[] = graphData.nodes.map(n => {
      const isFiltered = filteredNodes.some(fn => fn.id === n.id);
      const radius = isFiltered ? 18 + (n.confidence * 4) : 12;
      const nodeObj: D3Node = {
        ...n,
        radius
      };
      nodeMap.set(n.id, nodeObj);
      return nodeObj;
    });

    const d3Links: D3Link[] = graphData.edges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map(e => ({
        id: e.id,
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        relation: e.relation || 'verbunden mit',
        strength: e.strength ?? 0.8
      }));

    // If graph is empty, show welcoming prompt
    if (d3Nodes.length === 0) {
      const emptyGroup = g.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      emptyGroup.append('circle')
        .attr('r', 60)
        .attr('fill', 'rgba(197, 220, 87, 0.08)')
        .attr('stroke', 'rgba(197, 220, 87, 0.3)')
        .attr('stroke-dasharray', '4 4');
      emptyGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 5)
        .attr('fill', '#C5DC57')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text('Wissensbasis ist leer');
      emptyGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 28)
        .attr('fill', 'rgba(255, 255, 255, 0.5)')
        .attr('font-size', '11px')
        .text('Füge Knoten hinzu oder chatte mit Dandelious');
      return;
    }

    // Force Simulation
    const simulation = d3.forceSimulation<D3Node, D3Link>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id(d => d.id).distance(120).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('collide', d3.forceCollide<D3Node>().radius(d => d.radius + 28).iterations(2));

    simulationRef.current = simulation;

    // Links Layer
    const linkGroup = g.append('g').attr('class', 'links');
    const links = linkGroup.selectAll<SVGLineElement, D3Link>('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        const isConnected = selectedNodeId && 
          ((typeof d.source === 'object' ? d.source.id : d.source) === selectedNodeId || 
           (typeof d.target === 'object' ? d.target.id : d.target) === selectedNodeId);
        return isConnected ? '#C5DC57' : 'rgba(255, 255, 255, 0.15)';
      })
      .attr('stroke-width', d => {
        const isConnected = selectedNodeId && 
          ((typeof d.source === 'object' ? d.source.id : d.source) === selectedNodeId || 
           (typeof d.target === 'object' ? d.target.id : d.target) === selectedNodeId);
        return isConnected ? 2.2 : 1.2;
      })
      .attr('stroke-dasharray', d => d.relation.toLowerCase().includes('abgeleitet') ? '3 3' : 'none')
      .attr('marker-end', d => {
        const isConnected = selectedNodeId && 
          ((typeof d.source === 'object' ? d.source.id : d.source) === selectedNodeId || 
           (typeof d.target === 'object' ? d.target.id : d.target) === selectedNodeId);
        return isConnected ? 'url(#arrowhead-active)' : 'url(#arrowhead)';
      });

    // Link Labels Layer
    const linkLabelGroup = g.append('g').attr('class', 'link-labels');
    const linkLabels = linkLabelGroup.selectAll<SVGTextElement, D3Link>('text')
      .data(d3Links)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .attr('font-size', '9px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('fill', d => {
        const isConnected = selectedNodeId && 
          ((typeof d.source === 'object' ? d.source.id : d.source) === selectedNodeId || 
           (typeof d.target === 'object' ? d.target.id : d.target) === selectedNodeId);
        return isConnected ? '#d4ec67' : 'rgba(255, 255, 255, 0.35)';
      })
      .text(d => d.relation);

    // Nodes Layer
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeContainers = nodeGroup.selectAll<SVGGElement, D3Node>('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Outer Aura Ring for Confidence / High Importance
    nodeContainers.append('circle')
      .attr('r', d => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', d => CATEGORY_COLORS[d.category]?.stroke || '#C5DC57')
      .attr('stroke-opacity', d => selectedNodeId === d.id ? 0.8 : hoveredNodeId === d.id ? 0.5 : 0.15)
      .attr('stroke-width', d => selectedNodeId === d.id ? 2 : 1)
      .attr('stroke-dasharray', d => d.confidence < 0.8 ? '3 3' : 'none');

    // Main Circle
    nodeContainers.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (selectedNodeId === d.id) return '#C5DC57';
        return CATEGORY_COLORS[d.category]?.fill || 'rgba(255, 255, 255, 0.1)';
      })
      .attr('stroke', d => {
        if (selectedNodeId === d.id) return '#ffffff';
        return CATEGORY_COLORS[d.category]?.stroke || 'rgba(255, 255, 255, 0.3)';
      })
      .attr('stroke-width', d => selectedNodeId === d.id ? 2.5 : 1.5)
      .attr('filter', d => selectedNodeId === d.id || hoveredNodeId === d.id ? 'url(#node-glow)' : 'none');

    // Node Center Icon / Letter
    nodeContainers.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => `${Math.max(10, d.radius * 0.7)}px`)
      .attr('font-weight', '700')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('fill', d => selectedNodeId === d.id ? '#0e1603' : '#ffffff')
      .text(d => d.label.charAt(0).toUpperCase());

    // Node Label Text Below
    nodeContainers.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 14)
      .attr('font-size', '11px')
      .attr('font-weight', d => selectedNodeId === d.id ? '700' : '500')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('fill', d => {
        if (selectedNodeId === d.id) return '#C5DC57';
        if (hoveredNodeId === d.id) return '#ffffff';
        return 'rgba(255, 255, 255, 0.85)';
      })
      .text(d => d.label.length > 18 ? d.label.slice(0, 16) + '...' : d.label);

    // Category Subtitle
    nodeContainers.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', d => d.radius + 26)
      .attr('font-size', '9px')
      .attr('font-weight', '500')
      .attr('fill', d => CATEGORY_COLORS[d.category]?.text || 'rgba(255, 255, 255, 0.4)')
      .text(d => CATEGORY_CONFIG[d.category]?.label || d.category);

    // Event Listeners
    nodeContainers
      .on('click', (event, d) => {
        event.stopPropagation();
        playSound('click', enableSoundEffects);
        setSelectedNodeId(prev => prev === d.id ? null : d.id);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    svg.on('click', () => {
      setSelectedNodeId(null);
    });

    // Simulation Ticks
    simulation.on('tick', () => {
      links
        .attr('x1', d => (d.source as D3Node).x || 0)
        .attr('y1', d => (d.source as D3Node).y || 0)
        .attr('x2', d => (d.target as D3Node).x || 0)
        .attr('y2', d => (d.target as D3Node).y || 0);

      linkLabels
        .attr('x', d => (((d.source as D3Node).x || 0) + ((d.target as D3Node).x || 0)) / 2)
        .attr('y', d => (((d.source as D3Node).y || 0) + ((d.target as D3Node).y || 0)) / 2);

      nodeContainers
        .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, filteredNodes, selectedNodeId, hoveredNodeId, activeTab, enableSoundEffects]);

  // Zoom Controls Handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Add Node Action
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeLabel.trim()) return;

    const { newNode } = addMemoryNode({
      label: nodeLabel.trim(),
      category: nodeCategory,
      description: nodeDescription.trim() || undefined,
      confidence: 0.95
    }, nodeTargetId ? { targetNodeId: nodeTargetId, relation: nodeRelation.trim() || 'verbunden mit' } : undefined);

    setGraphData(loadMemoryGraph());
    setIsAddNodeOpen(false);
    setNodeLabel('');
    setNodeDescription('');
    setNodeTargetId('');
    setSelectedNodeId(newNode.id);
    playSound('pop', enableSoundEffects);
    showToast(`Knoten "${newNode.label}" erfolgreich erstellt`);
  };

  // Add Edge Action
  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId) return;

    addMemoryEdge(edgeSourceId, edgeTargetId, edgeRelationText.trim() || 'verbunden mit');
    setGraphData(loadMemoryGraph());
    setIsAddEdgeOpen(false);
    setEdgeSourceId('');
    setEdgeTargetId('');
    playSound('pop', enableSoundEffects);
    showToast('Verbindung erfolgreich hinzugefügt');
  };

  // Delete Node Action
  const handleDeleteNode = (id: string) => {
    deleteMemoryNode(id);
    setGraphData(loadMemoryGraph());
    if (selectedNodeId === id) setSelectedNodeId(null);
    playSound('click', enableSoundEffects);
    showToast('Knoten aus Wissensbasis gelöscht');
  };

  // Delete Edge Action
  const handleDeleteEdge = (edgeId: string) => {
    deleteMemoryEdge(edgeId);
    setGraphData(loadMemoryGraph());
    playSound('click', enableSoundEffects);
    showToast('Verbindung gelöscht');
  };

  // Save Topic Action
  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicContent.trim()) return;

    addOrUpdateMemoryTopic(topicTitle.trim(), topicContent.trim());
    setTopics(loadMemoryTopics());
    setIsAddTopicOpen(false);
    setTopicTitle('');
    setTopicContent('');
    playSound('pop', enableSoundEffects);
    showToast('Wissens-Thema gespeichert');
  };

  // Extractor Simulator Test
  const handleRunExtractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractorText.trim()) return;

    const res = extractMemoriesFromText(extractorText.trim(), 'Knowledge Extractor Test');
    setExtractorResult(res);
    setGraphData(loadMemoryGraph());
    setTopics(loadMemoryTopics());
    playSound('chime', enableSoundEffects);
    showToast(`Extraktion abgeschlossen: +${res.addedNodes} Knoten, +${res.addedEdges} Kanten`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#05070d] text-neutral-100 font-['Plus_Jakarta_Sans'] overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 h-16 border-b border-white/10 bg-neutral-950/40 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#C5DC57]/15 border border-[#C5DC57]/30 flex items-center justify-center text-[#C5DC57] shadow-sm">
            <Network className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Dandelious Knowledge Base
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#C5DC57]/15 text-[#d4ec67] border border-[#C5DC57]/25 text-[10px] font-mono font-bold tracking-wider uppercase">
                GRAPH v1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Interaktives semantisches Gedächtnisnetzwerk & Beziehungsmatrix
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-white/[0.05] p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => {
                playSound('click', enableSoundEffects);
                setActiveTab('network');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-[#C5DC57] text-[#0e1603] shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Netzwerk-Graph
            </button>
            <button
              onClick={() => {
                playSound('click', enableSoundEffects);
                setActiveTab('matrix');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#C5DC57] text-[#0e1603] shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Kategorien-Matrix
            </button>
            <button
              onClick={() => {
                playSound('click', enableSoundEffects);
                setActiveTab('topics');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'topics'
                  ? 'bg-[#C5DC57] text-[#0e1603] shadow-md'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              Themen & Notizen
            </button>
          </div>

          <button
            onClick={() => {
              playSound('click', enableSoundEffects);
              setIsAddNodeOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#C5DC57] hover:bg-[#b5cc48] text-[#0e1603] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Knoten hinzufügen</span>
          </button>

          <button
            onClick={() => {
              playSound('click', enableSoundEffects);
              setIsExtractorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs transition-all backdrop-blur-md cursor-pointer"
            title="KI-Wissens-Extraktor testen"
          >
            <Sparkles className="w-4 h-4 text-lime-400" />
            <span className="hidden md:inline">Auto-Extraktion</span>
          </button>

          {onBackToChat && (
            <button
              onClick={() => {
                playSound('click', enableSoundEffects);
                onBackToChat();
              }}
              className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Zum Chat
            </button>
          )}
        </div>
      </header>

      {/* Sub-header / Filter & Stats Bar */}
      <div className="shrink-0 border-b border-white/10 bg-neutral-950/20 backdrop-blur-md px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Search & Category Pills */}
        <div className="flex items-center flex-wrap gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Knoten oder Relation suchen..."
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-[#C5DC57]/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <button
              onClick={() => {
                playSound('click', enableSoundEffects);
                setSelectedCategory('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              Alle ({graphData.nodes.length})
            </button>

            {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map((cat) => {
              const count = graphData.nodes.filter(n => n.category === cat).length;
              const Icon = CATEGORY_ICONS[cat];
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    playSound('click', enableSoundEffects);
                    setSelectedCategory(cat);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#C5DC57]/20 text-[#d4ec67] border border-[#C5DC57]/30 font-semibold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{CATEGORY_CONFIG[cat]?.label}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Graph Summary Metrics */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C5DC57] animate-pulse" />
            <span className="text-white font-semibold font-mono">{graphData.nodes.length}</span>
            <span>Knoten</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-white font-semibold font-mono">{graphData.edges.length}</span>
            <span>Relationen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-white font-semibold font-mono">{topics.length}</span>
            <span>Themen</span>
          </div>
        </div>
      </div>

      {/* Main Canvas / Matrix / Topics Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Tab 1: Network Graph */}
        {activeTab === 'network' && (
          <div ref={containerRef} className="relative w-full h-full bg-[#030509]">
            {/* SVG Force Network */}
            <svg
              ref={svgRef}
              className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
            />

            {/* Floating Zoom & Canvas Controls */}
            <div className="absolute left-6 bottom-6 flex flex-col gap-2 z-10">
              <div className="flex flex-col bg-neutral-950/60 backdrop-blur-xl border border-white/15 rounded-2xl p-1 shadow-2xl">
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Vergrößern (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Verkleinern (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-full h-[1px] bg-white/10 my-0.5" />
                <button
                  onClick={handleResetZoom}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Ansicht zentrieren"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  setIsAddEdgeOpen(true);
                }}
                className="p-2.5 rounded-2xl bg-neutral-950/60 hover:bg-white/10 backdrop-blur-xl border border-white/15 text-neutral-200 hover:text-white shadow-2xl flex items-center justify-center cursor-pointer transition-colors"
                title="Relation zwischen zwei Knoten verbinden"
              >
                <LinkIcon className="w-4 h-4 text-lime-400" />
              </button>
            </div>

            {/* Slide-out Node Inspector Drawer */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, x: 280, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 280, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                  className="absolute right-6 top-6 bottom-6 w-80 sm:w-96 bg-neutral-950/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl z-20 flex flex-col justify-between overflow-y-auto"
                >
                  <div className="space-y-4">
                    {/* Drawer Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-inner"
                          style={{
                            backgroundColor: CATEGORY_COLORS[selectedNode.category]?.fill || 'rgba(197, 220, 87, 0.2)',
                            color: CATEGORY_COLORS[selectedNode.category]?.stroke || '#C5DC57',
                            border: `1px solid ${CATEGORY_COLORS[selectedNode.category]?.stroke || '#C5DC57'}`
                          }}
                        >
                          {selectedNode.label.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white leading-tight">
                            {selectedNode.label}
                          </h3>
                          <span
                            className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: CATEGORY_COLORS[selectedNode.category]?.fill || 'rgba(255, 255, 255, 0.1)',
                              color: CATEGORY_COLORS[selectedNode.category]?.text || '#d4ec67'
                            }}
                          >
                            {CATEGORY_CONFIG[selectedNode.category]?.label || selectedNode.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedNodeId(null)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description */}
                    <div className="p-3.5 bg-white/[0.04] rounded-2xl border border-white/10 space-y-1">
                      <span className="text-[11px] font-medium text-neutral-400">Beschreibung / Kontext:</span>
                      <p className="text-xs text-neutral-200 leading-relaxed">
                        {selectedNode.description || 'Keine spezifische Detailbeschreibung hinterlegt.'}
                      </p>
                    </div>

                    {/* Confidence & Metadata */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/10">
                        <span className="text-[10px] text-neutral-400 block">KI-Konfidenz</span>
                        <span className="text-sm font-bold text-[#C5DC57] font-mono">
                          {Math.round((selectedNode.confidence ?? 0.95) * 100)}%
                        </span>
                      </div>
                      <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/10">
                        <span className="text-[10px] text-neutral-400 block">Erfasst am</span>
                        <span className="text-xs font-medium text-neutral-300 font-mono">
                          {new Date(selectedNode.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>

                    {/* Connected Nodes & Links */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5 text-lime-400" />
                          <span>Verbundene Relationen ({connectedEdges.length})</span>
                        </span>
                        <button
                          onClick={() => {
                            setEdgeSourceId(selectedNode.id);
                            setIsAddEdgeOpen(true);
                          }}
                          className="text-[11px] text-lime-400 hover:text-lime-300 font-medium cursor-pointer"
                        >
                          + Verbinden
                        </button>
                      </div>

                      {connectedEdges.length === 0 ? (
                        <p className="text-xs text-neutral-500 italic p-3 bg-white/[0.02] rounded-xl border border-white/5">
                          Keine direkten Verbindungen zu anderen Knoten.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {connectedEdges.map(edge => {
                            const isOutgoing = edge.source === selectedNode.id;
                            const otherId = isOutgoing ? edge.target : edge.source;
                            const otherNode = graphData.nodes.find(n => n.id === otherId);

                            return (
                              <div
                                key={edge.id}
                                className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs group/edge"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isOutgoing ? 'text-lime-400' : 'text-blue-400'}`} />
                                  <div className="truncate">
                                    <span className="text-neutral-400 text-[11px] italic mr-1.5">{edge.relation}:</span>
                                    <button
                                      onClick={() => setSelectedNodeId(otherId)}
                                      className="font-bold text-white hover:text-lime-300 underline-offset-2 hover:underline cursor-pointer"
                                    >
                                      {otherNode?.label || otherId}
                                    </button>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteEdge(edge.id)}
                                  className="text-neutral-500 hover:text-red-400 opacity-0 group-hover/edge:opacity-100 transition-opacity p-1 cursor-pointer"
                                  title="Relation trennen"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inspector Footer Actions */}
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    {onNewChatWithPrompt && (
                      <button
                        onClick={() => {
                          playSound('click', enableSoundEffects);
                          onNewChatWithPrompt(`Erzähle mir alles, was du über "${selectedNode.label}" (${selectedNode.description || ''}) in meiner Wissensbasis weißt.`);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#C5DC57] hover:bg-[#b5cc48] text-[#0e1603] font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Im Chat analysieren</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Knoten entfernen</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tab 2: Category Matrix View */}
        {activeTab === 'matrix' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map(cat => {
                const catNodes = graphData.nodes.filter(n => n.category === cat);
                const Icon = CATEGORY_ICONS[cat];
                const conf = CATEGORY_CONFIG[cat];

                return (
                  <div
                    key={cat}
                    className="p-5 rounded-3xl bg-neutral-950/40 backdrop-blur-xl border border-white/10 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: CATEGORY_COLORS[cat].fill, color: CATEGORY_COLORS[cat].stroke }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-sm text-white">{conf.label}</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          {catNodes.length}
                        </span>
                      </div>

                      <div className="space-y-2 pt-3">
                        {catNodes.length === 0 ? (
                          <p className="text-xs text-neutral-500 italic py-4 text-center">
                            Keine Einträge in dieser Kategorie.
                          </p>
                        ) : (
                          catNodes.map(node => (
                            <div
                              key={node.id}
                              onClick={() => {
                                setSelectedNodeId(node.id);
                                setActiveTab('network');
                              }}
                              className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-white group-hover:text-lime-300">
                                  {node.label}
                                </span>
                                <span className="text-[10px] text-[#C5DC57] font-mono">
                                  {Math.round((node.confidence ?? 0.9) * 100)}%
                                </span>
                              </div>
                              {node.description && (
                                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                                  {node.description}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setNodeCategory(cat);
                        setIsAddNodeOpen(true);
                      }}
                      className="w-full mt-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white font-medium transition-all cursor-pointer text-center"
                    >
                      + Eintrag hinzufügen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Topics & Notes */}
        {activeTab === 'topics' && (
          <div className="w-full h-full overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Strukturierte Wissensthemen</h2>
                <p className="text-xs text-neutral-400">
                  Zusammenfassungen und fortlaufend gepflegter Kontext für personalisierte Antworten.
                </p>
              </div>
              <button
                onClick={() => {
                  playSound('click', enableSoundEffects);
                  setIsAddTopicOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#C5DC57] text-[#0e1603] font-bold text-xs shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Thema hinzufügen</span>
              </button>
            </div>

            {topics.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-neutral-950/30 border border-white/10 space-y-3">
                <BookOpen className="w-10 h-10 text-neutral-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">Noch keine Wissensthemen gespeichert</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Beim Chatten mit Dandelious werden automatisch relevante Vorlieben, Projekte und Fakten als Themen strukturiert.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map(topic => (
                  <div
                    key={topic.id}
                    className="p-5 rounded-3xl bg-neutral-950/40 backdrop-blur-xl border border-white/10 space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <h4 className="font-bold text-sm text-white">{topic.title}</h4>
                        <button
                          onClick={() => {
                            deleteMemoryTopic(topic.id);
                            setTopics(loadMemoryTopics());
                            playSound('click', enableSoundEffects);
                            showToast('Thema entfernt');
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {topic.content}
                      </p>
                    </div>

                    <div className="text-[10px] text-neutral-400 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span>Zuletzt aktualisiert</span>
                      <span className="font-mono">{new Date(topic.updatedAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Add Node Form */}
      <AnimatePresence>
        {isAddNodeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#10121a] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-lime-400 stroke-[2.5]" />
                  <span>Neuen Wissensknoten erstellen</span>
                </h3>
                <button
                  onClick={() => setIsAddNodeOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Name / Begriff des Knotens *
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    placeholder="z.B. Python, Vincent, Next.js, Projekt Arc..."
                    className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={nodeCategory}
                    onChange={(e) => setNodeCategory(e.target.value as MemoryCategory)}
                    className="w-full bg-[#181a24] border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as MemoryCategory[]).map(cat => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat]?.label} ({cat})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Beschreibung / Kontext (optional)
                  </label>
                  <textarea
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    rows={2}
                    placeholder="Zusätzliche Fakten, Vorlieben oder Beschreibungen..."
                    className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400 resize-none"
                  />
                </div>

                {graphData.nodes.length > 0 && (
                  <div className="p-3 bg-white/[0.03] rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-300 block">
                      Sofort mit bestehendem Knoten verbinden (optional)
                    </span>
                    <select
                      value={nodeTargetId}
                      onChange={(e) => setNodeTargetId(e.target.value)}
                      className="w-full bg-[#181a24] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">Keine direkte Verbindung</option>
                      {graphData.nodes.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.label} ({CATEGORY_CONFIG[n.category]?.label || n.category})
                        </option>
                      ))}
                    </select>

                    {nodeTargetId && (
                      <input
                        type="text"
                        value={nodeRelation}
                        onChange={(e) => setNodeRelation(e.target.value)}
                        placeholder="Beziehungsart (z.B. nutzt, arbeitet an, mag...)"
                        className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddNodeOpen(false)}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#C5DC57] text-[#0e1603] font-bold text-xs shadow-md hover:bg-[#b5cc48] cursor-pointer"
                  >
                    Knoten anlegen
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Connect Edge Form */}
      <AnimatePresence>
        {isAddEdgeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#10121a] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-lime-400 stroke-[2.5]" />
                  <span>Relation zwischen Knoten erstellen</span>
                </h3>
                <button
                  onClick={() => setIsAddEdgeOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEdge} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Ausgangsknoten (Quelle) *
                  </label>
                  <select
                    required
                    value={edgeSourceId}
                    onChange={(e) => setEdgeSourceId(e.target.value)}
                    className="w-full bg-[#181a24] border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="">Ausgangsknoten wählen...</option>
                    {graphData.nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({CATEGORY_CONFIG[n.category]?.label || n.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Zielknoten *
                  </label>
                  <select
                    required
                    value={edgeTargetId}
                    onChange={(e) => setEdgeTargetId(e.target.value)}
                    className="w-full bg-[#181a24] border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  >
                    <option value="">Zielknoten wählen...</option>
                    {graphData.nodes.filter(n => n.id !== edgeSourceId).map(n => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({CATEGORY_CONFIG[n.category]?.label || n.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Beziehung / Relation
                  </label>
                  <input
                    type="text"
                    required
                    value={edgeRelationText}
                    onChange={(e) => setEdgeRelationText(e.target.value)}
                    placeholder="z.B. nutzt, arbeitet an, entwickelt, bevorzugt..."
                    className="w-full bg-white/[0.06] border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddEdgeOpen(false)}
                    className="px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#C5DC57] text-[#0e1603] font-bold text-xs shadow-md hover:bg-[#b5cc48] cursor-pointer"
                  >
                    Verbinden
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AI Memory Extractor Simulator */}
      <AnimatePresence>
        {isExtractorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#10121a] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lime-400" />
                  <span>Automatische Wissensextraktion testen</span>
                </h3>
                <button
                  onClick={() => setIsExtractorOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                Gib einen beliebigen Text oder Prompt ein. Dandelious scannt automatisch nach Entitäten, Personen, Tech-Stacks und Vorlieben und aktualisiert den Graph in Echtzeit.
              </p>

              <form onSubmit={handleRunExtractor} className="space-y-3">
                <textarea
                  value={extractorText}
                  onChange={(e) => setExtractorText(e.target.value)}
                  rows={4}
                  placeholder="z.B. Ich heiße Vincent, wohne in Berlin und entwickle gerade ein großes KI-Projekt mit TypeScript, Next.js und Drizzle ORM."
                  className="w-full bg-white/[0.06] border border-white/15 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-lime-400 resize-none"
                />

                {extractorResult && (
                  <div className="p-3 bg-lime-500/10 border border-lime-500/20 rounded-2xl text-xs text-lime-300 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Extraktion erfolgreich
                    </span>
                    <p className="text-[11px] text-neutral-300">
                      Hinzugefügte Knoten: <strong className="text-white font-mono">{extractorResult.addedNodes}</strong> | 
                      Aktualisierte Themen: <strong className="text-white font-mono">Aktiv</strong>
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExtractorText("Merke dir: Meine Lieblingsfarbe ist Limettengrün und ich nutze täglich React, Tailwind und Gemini 3.7 Flash.");
                    }}
                    className="text-[11px] text-lime-400 hover:text-lime-300 underline-offset-2 hover:underline cursor-pointer"
                  >
                    Beispiel einfügen
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsExtractorOpen(false)}
                      className="px-4 py-2 rounded-2xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Schließen
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-2xl bg-[#C5DC57] text-[#0e1603] font-bold text-xs shadow-md hover:bg-[#b5cc48] cursor-pointer"
                    >
                      Extrahieren & Speichern
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-neutral-900/90 text-white text-xs font-semibold border border-white/20 shadow-2xl backdrop-blur-xl z-50 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
