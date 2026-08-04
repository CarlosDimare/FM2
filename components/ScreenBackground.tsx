import React, { useEffect, useState, useRef } from 'react';
import { getScreenTheme, ScreenTheme } from '../constants';

interface ScreenBackgroundProps {
  /** View ID to determine the theme */
  view: string;
  /** Children to render on top of the background */
  children: React.ReactNode;
  /** Optional: override the opacity of the dark overlay (0-100, default 40) */
  overlayOpacity?: number;
  /** Optional: hide the decorative emoji */
  hideEmoji?: boolean;
  /** Optional: custom className */
  className?: string;
}

/**
 * ScreenBackground — Aplica un fondo temático visual a cada pantalla.
 * Includes smooth crossfade transitions when switching between views.
 */
export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  view,
  children,
  overlayOpacity: overlayOpacityProp,
  hideEmoji = false,
  className = '',
}) => {
  const theme = getScreenTheme(view);
  const overlayOpacity = overlayOpacityProp ?? theme.overlayOpacity ?? 20;
  const prevViewRef = useRef(view);
  const [transitionKey, setTransitionKey] = useState(0);

  // Trigger re-animation when view changes
  useEffect(() => {
    if (prevViewRef.current !== view) {
      prevViewRef.current = view;
      setTransitionKey(k => k + 1);
    }
  }, [view]);

  return (
    <div className={`relative min-h-full overflow-hidden ${className}`}>
      {/* ─── Gradient background layer (crossfades) ─────────────────── */}
      <div
        key={`bg-${transitionKey}`}
        className="absolute inset-0 z-0 animate-bg-fadein"
        style={{ background: theme.gradient }}
      />

      {/* ─── SVG texture pattern (crossfades) ──────────────────────── */}
      {theme.texture && (
        <div
          key={`tex-${transitionKey}`}
          className="absolute inset-0 z-[1] pointer-events-none animate-tex-fadein"
          dangerouslySetInnerHTML={{ __html: theme.texture }}
        />
      )}

      {/* ─── Decorative emoji (large, faded) ────────────────────────── */}
      {!hideEmoji && (
        <div
          key={`emoji-${transitionKey}`}
          className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none overflow-hidden animate-emoji-entrance"
        >
          <span
            className="text-[200px] opacity-[0.04] select-none"
            style={{ filter: 'blur(2px)' }}
          >
            {theme.emoji}
          </span>
        </div>
      )}

      {/* ─── Dark overlay for readability ───────────────────────────── */}
      <div
        key={`ov-${transitionKey}`}
        className="absolute inset-0 z-[3] animate-overlay-fadein"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${overlayOpacity / 100 * 0.3}) 0%, rgba(0,0,0,${overlayOpacity / 100}) 100%)`,
        }}
      />

      {/* ─── Content (slides up slightly) ───────────────────────────── */}
      <div className="relative z-[4] h-full animate-content-entrance">
        {children}
      </div>
    </div>
  );
};

/**
 * ScreenHeader — Encabezado temático con emoji + título
 */
interface ScreenHeaderProps {
  view: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  view,
  title,
  subtitle,
  rightAction,
}) => {
  const theme = getScreenTheme(view);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{theme.emoji}</span>
        <div>
          <h1 className="text-sm font-black uppercase tracking-wider text-white leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-white/60 uppercase tracking-wider mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
};

/**
 * ThemedCard — Tarjeta con borde del color del tema
 */
interface ThemedCardProps {
  view: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  view,
  children,
  className = '',
  noPadding = false,
}) => {
  const theme = getScreenTheme(view);

  return (
    <div
      className={`rounded-lg border backdrop-blur-sm transition-colors duration-300 ${noPadding ? '' : 'p-4'} ${className}`}
      style={{
        background: `${theme.hex}15`,
        borderColor: `${theme.hex}30`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * DepartmentTile — Tile de departamento para el sheet "Más"
 */
interface DepartmentTileProps {
  emoji: string;
  label: string;
  hex: string;
  itemCount: number;
  onClick: () => void;
}

export const DepartmentTile: React.FC<DepartmentTileProps> = ({
  emoji,
  label,
  hex,
  itemCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="relative group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 active:scale-95 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${hex}22 0%, ${hex}44 100%)`,
        border: `1px solid ${hex}33`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${hex}33 0%, transparent 70%)` }}
      />
      <span className="text-2xl relative z-10">{emoji}</span>
      <span className="text-[10px] font-black uppercase tracking-wider text-white/90 relative z-10">
        {label}
      </span>
      <span
        className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: `${hex}44`, color: hex }}
      >
        {itemCount}
      </span>
    </button>
  );
};
