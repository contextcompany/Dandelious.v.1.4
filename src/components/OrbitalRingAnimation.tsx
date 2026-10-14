import React from 'react';
import { motion } from 'motion/react';

interface OrbitalRingProps {
  size?: number;
  icon?: React.ReactNode;
  badgeText?: string;
  className?: string;
}

export const OrbitalRingAnimation: React.FC<OrbitalRingProps> = ({
  size = 180,
  icon,
  badgeText = 'BETA',
  className = ''
}) => {
  // Generate orbital dots at angles
  const dotCount = 9;
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (i / dotCount) * 2 * Math.PI;
    const r = (size / 2) - 18; // radius of orbit
    const x = (size / 2) + r * Math.cos(angle);
    const y = (size / 2) + r * Math.sin(angle);
    return { id: i, x, y, angle };
  });

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Container for the rotating rings and particles */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Continuous rotating outer arc (like in IMG_1159) */}
        <motion.svg
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Main rotating arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) - 18}
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${size * 0.75} ${size * 0.85}`}
            className="opacity-95"
          />

          {/* Secondary faint dashed guide ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) - 18}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </motion.svg>

        {/* Counter-rotating orbital dots constellation */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
          className="absolute inset-0 pointer-events-none"
        >
          {dots.map((dot, idx) => (
            <motion.div
              key={dot.id}
              animate={{
                scale: [0.8, 1.4, 0.8],
                opacity: [0.35, 1, 0.35],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                delay: idx * 0.25,
                ease: "easeInOut",
              }}
              style={{
                position: 'absolute',
                left: dot.x - 3.5,
                top: dot.y - 3.5,
                width: 7,
                height: 7,
              }}
              className="rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            />
          ))}
        </motion.div>

        {/* Inner Center Icon / Smiling Avatar Face (exactly like in IMG_1159) */}
        <motion.div 
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center text-white select-none"
        >
          {icon ? (
            icon
          ) : (
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              {/* Eyes */}
              <circle cx="23" cy="25" r="3.2" fill="white" />
              <circle cx="41" cy="25" r="3.2" fill="white" />
              {/* Smiling Mouth */}
              <path
                d="M21 34C21 34 25.5 42 32 42C38.5 42 43 34 43 34H21Z"
                fill="none"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.div>
      </div>

      {/* Beta / Status Pill Badge under circle */}
      {badgeText && (
        <motion.div 
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-3 py-0.5 rounded-full bg-[#2c2c2e] border border-white/10 text-[11px] font-semibold tracking-wider text-neutral-300 uppercase shadow-xs"
        >
          {badgeText}
        </motion.div>
      )}
    </div>
  );
};
