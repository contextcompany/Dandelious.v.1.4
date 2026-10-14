import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Bildansicht',
  onClose
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state on open/change
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 0.75);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleCopyLink = async () => {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      playSound('pop', true);
    } catch (err) {
      // Ignore
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    const filename = `${(title || 'dandelious-bild').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.jpg`;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSound('chime', true);
  };

  if (!isOpen || !imageUrl) return null;

  const displayTitle = title?.replace(/[*_#\[\]\(\)]/g, '').trim() || 'Großformat-Bildansicht';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col select-none overflow-hidden"
      >
        {/* Header Bar */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-3 max-w-[50%] sm:max-w-md">
            <span className="p-2 rounded-xl bg-white/10 text-white">
              <Maximize2 className="w-4 h-4" />
            </span>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">
                  {displayTitle}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-neutral-300 font-medium shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  MotionPicture
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {Math.round(scale * 100)}% Zoom • ESC zum Schließen
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
                className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                title="Verkleinern (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2.5 py-1 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom zurücksetzen (0)"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 3.5}
                className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                title="Vergrößern (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button */}
            {scale !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Ansicht zurücksetzen"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Bildlink kopieren"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="Bild herunterladen"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* External Link */}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="In neuem Tab öffnen"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white bg-white/15 hover:bg-white/25 rounded-xl border border-white/20 transition-all cursor-pointer ml-1"
              title="Schließen (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Viewport Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden ${
            scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          onClick={(e) => {
            // If clicking empty canvas, close
            if (e.target === containerRef.current) {
              onClose();
            }
          }}
        >
          {/* Skeleton Spinner */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <span className="text-xs">Bild in hoher Auflösung wird geladen...</span>
            </div>
          )}

          {/* Centered Large Image */}
          <motion.img
            src={imageUrl}
            alt={displayTitle}
            onLoad={() => setImageLoaded(true)}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className={`max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Bottom Bar Info */}
        <footer className="h-10 px-4 flex items-center justify-between border-t border-white/5 bg-black/40 text-[11px] text-neutral-400 shrink-0">
          <span className="truncate max-w-[70%]">{displayTitle}</span>
          <span className="text-neutral-500">Doppelklick oder Mausrad zum Zoomen</span>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
