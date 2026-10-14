import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Sparkles, Maximize2 } from 'lucide-react';

interface SmartMarkdownImageProps {
  src?: string;
  alt?: string;
  onOpenViewer?: (url: string, title: string) => void;
}

export const SmartMarkdownImage: React.FC<SmartMarkdownImageProps> = ({
  src,
  alt = 'Internet-Bild',
  onOpenViewer
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || '');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const cleanAlt = alt?.replace(/[*_#\[\]\(\)]/g, '').trim() || 'Internet-Bild';

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setRetryCount(0);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  // Safety fallback: Ensure skeleton doesn't hang indefinitely if image completed or stalled
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        setIsLoading(false);
        setHasError(false);
      } else if (isLoading && retryCount === 0) {
        setRetryCount(1);
        if (currentSrc.includes('/api/image/render')) {
          setCurrentSrc(`/api/image/render?prompt=${encodeURIComponent(cleanAlt)}&t=${Date.now()}`);
        } else {
          setCurrentSrc(`/api/image/render?prompt=${encodeURIComponent(cleanAlt)}`);
        }
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [isLoading, retryCount, cleanAlt, currentSrc]);

  const handleError = () => {
    if (retryCount === 0) {
      setRetryCount(1);
      setCurrentSrc(`/api/image/render?prompt=${encodeURIComponent(cleanAlt)}&t=${Date.now()}`);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSrc) return;
    const a = document.createElement('a');
    a.href = currentSrc;
    a.download = `${cleanAlt.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCardClick = () => {
    if (onOpenViewer && currentSrc) {
      onOpenViewer(currentSrc, cleanAlt);
    }
  };

  if (!src && !currentSrc) return null;

  return (
    <span className="block my-3.5 rounded-2xl overflow-hidden border border-white/10 shadow-xl group relative bg-[#121215] max-w-2xl select-none">
      {/* Loading Skeleton */}
      {isLoading && (
        <span className="w-full h-64 bg-white/5 flex flex-col items-center justify-center gap-2 text-neutral-400">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs">MotionPicture Bild wird generiert...</span>
        </span>
      )}

      {/* Main Image Container */}
      {!hasError ? (
        <span
          className={`relative block overflow-hidden cursor-pointer ${isLoading ? 'hidden' : 'block'}`}
          onClick={handleCardClick}
        >
          <img
            ref={imgRef}
            src={currentSrc}
            alt={cleanAlt}
            onError={handleError}
            onLoad={handleLoad}
            className="w-full max-h-[500px] object-contain rounded-t-2xl bg-[#0c0c0e] transition-all duration-300 group-hover:scale-[1.01]"
            referrerPolicy="no-referrer"
            loading="eager"
          />

          {/* MotionPicture Badge */}
          {!isLoading && (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white/95 flex items-center gap-1.5 shadow-lg select-none">
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400/20" />
              <span>MotionPicture</span>
            </span>
          )}

          {/* Quick Hover Overlay */}
          {!isLoading && (
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5 pointer-events-none">
              <span className="text-xs text-white/95 font-medium truncate max-w-[65%] drop-shadow-md">
                {cleanAlt}
              </span>
              <span className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/25 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Großformat / Vollbild öffnen"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Großansicht
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 text-xs transition-colors cursor-pointer"
                  title="Bild herunterladen"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </span>
            </span>
          )}
        </span>
      ) : (
        /* Error State with Reload Trigger */
        <span className="p-5 flex flex-col items-center justify-center gap-3 text-center bg-[#15151a]">
          <span className="text-xs text-neutral-400">
            Bild konnte nicht direkt geladen werden: <span className="text-neutral-200 font-medium">{cleanAlt}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setRetryCount(0);
              setCurrentSrc(`/api/image/render?prompt=${encodeURIComponent(cleanAlt)}&t=${Date.now()}`);
              setHasError(false);
              setIsLoading(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Bild mit MotionPicture neu generieren
          </button>
        </span>
      )}

      {/* Preload img element while skeleton is visible to ensure browser fetches stream */}
      {isLoading && !hasError && (
        <img
          src={currentSrc}
          alt={cleanAlt}
          onError={handleError}
          onLoad={handleLoad}
          className="w-px h-px opacity-0 absolute pointer-events-none"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Footer Info Bar */}
      {!isLoading && !hasError && (
        <span
          onClick={handleCardClick}
          className="p-2.5 text-xs text-neutral-400 bg-[#16161a] border-t border-white/5 flex items-center justify-between cursor-pointer hover:bg-[#1c1c22] transition-colors"
        >
          <span className="flex items-center gap-2 truncate max-w-[65%]">
            <span className="text-neutral-300 font-medium truncate">{cleanAlt}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              MotionPicture
            </span>
            <span className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Großansicht
            </span>
          </span>
        </span>
      )}
    </span>
  );
};
