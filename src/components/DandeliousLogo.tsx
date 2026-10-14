import React from "react";
import { DANDELIOUS_LOGO_DATA_URL } from "../assets/logoDataUrl";

interface DandeliousIconProps {
  className?: string;
  size?: number | string;
  variant?: "full" | "flower-only" | "badge";
  alt?: string;
}

/**
 * Official Dandelious Icon & Logo Component
 * Uses 1-to-1 the exact dandelion artwork uploaded by the user:
 * - Clean light lime/chartreuse background
 * - Pure ivory silhouette dandelion bloom
 */
export const DandeliousLogo: React.FC<DandeliousIconProps> = ({
  className = "w-10 h-10",
  variant = "badge",
  alt = "Dandelious"
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-[18px] shadow-[0_4px_20px_rgba(197,220,87,0.35)] shrink-0 ${className}`}
      title={alt}
    >
      <img
        src={DANDELIOUS_LOGO_DATA_URL}
        alt={alt}
        className="w-full h-full object-cover object-center select-none pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};

export const DandeliousFlowerSvg: React.FC<{ className?: string; fill?: string }> = ({
  className = "w-full h-full",
}) => {
  return (
    <img
      src={DANDELIOUS_LOGO_DATA_URL}
      alt="Dandelious"
      className={`${className} object-cover object-center select-none pointer-events-none`}
      loading="eager"
    />
  );
};

export default DandeliousLogo;
