import React from 'react';

const VIEW_BACKGROUNDS: Record<string, string> = {
  HOME: 'radial-gradient(ellipse at 30% 20%, rgba(58,74,58,0.08) 0%, transparent 60%)',
  SENIOR_SQUAD: 'radial-gradient(ellipse at 70% 80%, rgba(58,74,58,0.06) 0%, transparent 50%)',
  SENIOR_TACTICS: 'radial-gradient(ellipse at 50% 50%, rgba(34,80,34,0.07) 0%, transparent 70%)',
  MARKET: 'radial-gradient(ellipse at 80% 20%, rgba(120,80,40,0.06) 0%, transparent 60%)',
  TRAINING: 'radial-gradient(ellipse at 20% 70%, rgba(58,74,58,0.06) 0%, transparent 50%)',
  INBOX: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,30,0.05) 0%, transparent 60%)',
  PRE_MATCH: 'radial-gradient(ellipse at 50% 50%, rgba(20,40,20,0.08) 0%, transparent 70%)',
  MATCH: 'radial-gradient(ellipse at 50% 50%, rgba(10,30,10,0.10) 0%, transparent 70%)',
  POST_MATCH_SUMMARY: 'radial-gradient(ellipse at 50% 30%, rgba(30,50,30,0.06) 0%, transparent 60%)',
  BOARD: 'radial-gradient(ellipse at 30% 20%, rgba(60,60,40,0.05) 0%, transparent 60%)',
  SCOUTING: 'radial-gradient(ellipse at 70% 70%, rgba(40,60,40,0.05) 0%, transparent 50%)',
  ECONOMY: 'radial-gradient(ellipse at 20% 30%, rgba(60,50,30,0.04) 0%, transparent 60%)',
};

export const ScreenBackground: React.FC<{
  children: React.ReactNode;
  view?: string;
  className?: string;
}> = ({ children, view, className = '' }) => {
  const bg = VIEW_BACKGROUNDS[view || ''] || 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(0,0,0,0.04) 100%)';

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: bg }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
