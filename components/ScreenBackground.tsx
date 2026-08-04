import React from 'react';

/**
 * ScreenBackground — Ultra-subtle atmospheric layer.
 * 
 * Sits BEHIND the existing FM Industrial Steel background (bg-[#d4dcd4]).
 * Adds a barely-perceptible vignette + subtle gradient that gives depth
 * without touching the core color palette.
 * 
 * This is NOT a replacement for the original background — it's a complement.
 */
export const ScreenBackground: React.FC<{
  children: React.ReactNode;
  view?: string;
  className?: string;
}> = ({ children, view, className = '' }) => {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Layer 1: Subtle radial vignette — barely visible */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
        }}
      />
      {/* Content — always on top */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

/**
 * ScreenHeader — Optional themed header bar for screens.
 * Uses the original FM color system (bg-[#3a4a3a], border-[#a0b0a0]).
 */
export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, emoji, action }) => {
  return (
    <div className="bg-[#3a4a3a] border-b border-[#2a3a2a] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {emoji && <span className="text-lg">{emoji}</span>}
        <div>
          <h2 className="text-white font-black uppercase text-sm tracking-wide">{title}</h2>
          {subtitle && <p className="text-[9px] text-[#a0b0a0] uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};
