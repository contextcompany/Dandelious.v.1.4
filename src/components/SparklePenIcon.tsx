import React from 'react';

export const SparklePenIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Circular ring with dotted orbital particles */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="1.5 3.2"
        strokeLinecap="round"
        className="opacity-70"
      />
      {/* Diagonal Stylus / Pen inside ring */}
      <path
        d="M15.2 6.8l2 2-7.2 7.2H8v-2l7.2-7.2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8l2 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};
