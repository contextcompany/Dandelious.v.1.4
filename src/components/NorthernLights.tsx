import React from 'react';
import { motion } from 'motion/react';

/**
 * Northern Lights (Nordlichter / Aurora Borealis) Aura
 * Specially crafted to sit directly underneath the MotionPicture Card.
 * The rest of the workspace remains pitch black (#000000), while this aura
 * casts vivid, shimmering emerald-green, teal, and violet polar light curtains
 * radiating from directly behind and under the card.
 */
export const NorthernLights: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`absolute -inset-10 sm:-inset-16 md:-inset-24 pointer-events-none select-none -z-10 overflow-visible flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep Polar Glow Foundation (Emerald, Cyan, Violet) */}
      <motion.div
        animate={{
          scale: [0.96, 1.04, 0.98, 1.02, 0.96],
          opacity: [0.75, 0.95, 0.8, 0.9, 0.75],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-[60px]"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 55%, rgba(124, 58, 237, 0.45) 0%, rgba(88, 28, 135, 0.42) 35%, rgba(147, 51, 234, 0.32) 60%, rgba(76, 29, 149, 0.2) 75%, transparent 92%)',
          filter: 'blur(55px)',
        }}
      />

      {/* 2. Undulating Vibrant Aurora Ribbon Layer (Bottom & Underneath Emphasis) */}
      <motion.div
        animate={{
          x: [-18, 20, -12, 16, -18],
          y: [10, -14, 8, -10, 10],
          scale: [1, 1.08, 0.97, 1.05, 1],
          opacity: [0.65, 0.88, 0.7, 0.92, 0.65],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-6 -inset-x-8 h-[75%] rounded-[60px]"
        style={{
          background:
            'radial-gradient(ellipse 90% 65% at 50% 85%, rgba(109, 40, 217, 0.55) 0%, rgba(76, 29, 149, 0.5) 40%, rgba(168, 85, 247, 0.35) 70%, transparent 90%)',
          filter: 'blur(45px)',
        }}
      />

      {/* 3. Violet & Deep Dandelious Counter-Wave */}
      <motion.div
        animate={{
          x: [15, -15, 10, -20, 15],
          y: [-8, 12, -10, 6, -8],
          scale: [1.03, 0.96, 1.05, 0.98, 1.03],
          opacity: [0.5, 0.8, 0.6, 0.85, 0.5],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-6 -inset-x-6 h-[70%] rounded-[60px]"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 20%, rgba(139, 92, 246, 0.45) 0%, rgba(88, 28, 135, 0.4) 45%, rgba(16, 185, 129, 0.2) 70%, transparent 88%)',
          filter: 'blur(50px)',
        }}
      />

      {/* 4. Organic SVG Northern Lights Curtains (Flowing Polar Ribbons) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.path
          animate={{
            d: [
              'M 50,450 Q 200,380 400,430 T 750,400 L 750,550 Q 550,520 400,560 T 50,530 Z',
              'M 50,420 Q 250,460 400,390 T 750,440 L 750,560 Q 600,500 400,540 T 50,560 Z',
              'M 50,460 Q 220,400 400,440 T 750,390 L 750,540 Q 580,530 400,550 T 50,540 Z',
              'M 50,450 Q 200,380 400,430 T 750,400 L 750,550 Q 550,520 400,560 T 50,530 Z',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          fill="url(#cardAuroraCurtain1)"
          filter="url(#cardAuroraBlur)"
          opacity="0.85"
        />

        <motion.path
          animate={{
            d: [
              'M 80,180 Q 260,240 400,190 T 720,230 L 720,380 Q 540,320 400,360 T 80,330 Z',
              'M 80,210 Q 220,170 400,220 T 720,180 L 720,360 Q 580,350 400,330 T 80,350 Z',
              'M 80,180 Q 260,240 400,190 T 720,230 L 720,380 Q 540,320 400,360 T 80,330 Z',
            ],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          fill="url(#cardAuroraCurtain2)"
          filter="url(#cardAuroraBlur)"
          opacity="0.7"
        />

        <defs>
          <linearGradient id="cardAuroraCurtain1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C5DC57" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#84a323" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#a3c932" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="cardAuroraCurtain2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d2eb63" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#96be28" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#415a0c" stopOpacity="0.7" />
          </linearGradient>

          <filter id="cardAuroraBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="28" result="blur" />
          </filter>
        </defs>
      </svg>

      {/* 5. Shimmering Polar Starlets directly within the Aurora Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-[12%] w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" style={{ animationDuration: '3.2s' }} />
        <div className="absolute top-[28%] right-[14%] w-1 h-1 rounded-full bg-cyan-200 animate-pulse" style={{ animationDuration: '4.1s' }} />
        <div className="absolute bottom-[22%] left-[18%] w-1.5 h-1.5 rounded-full bg-lime-200 animate-pulse" style={{ animationDuration: '3.8s' }} />
        <div className="absolute bottom-[16%] right-[22%] w-1 h-1 rounded-full bg-emerald-100 animate-pulse" style={{ animationDuration: '2.9s' }} />
        <div className="absolute top-[65%] left-[8%] w-1 h-1 rounded-full bg-white animate-pulse" style={{ animationDuration: '4.8s' }} />
        <div className="absolute top-[35%] right-[9%] w-1 h-1 rounded-full bg-cyan-300 animate-pulse" style={{ animationDuration: '3.5s' }} />
      </div>
    </div>
  );
};
