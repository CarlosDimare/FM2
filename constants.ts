
import { Position } from "./types";

export const POSITIONS = [Position.GK, Position.DC, Position.MC, Position.ST];

export const NATIONS = [
  "Argentina", "Brasil", "Uruguay", "Chile", "Colombia", "Perú", "Ecuador", "Paraguay", "Bolivia", "Venezuela",
  "España", "Inglaterra", "Francia", "Alemania", "Italia", "Portugal", "Países Bajos", "Bélgica",
  "México", "USA", "Japón", "Croacia", "Suiza", "Dinamarca", "Suecia", "Noruega", "Polonia", "Austria",
  "Turquía", "Rusia", "Ucrania", "Grecia", "Arabia Saudita",
  "Egipto", "Marruecos", "Sudáfrica", "Nigeria", "Ghana",
  "Corea del Sur", "China", "Australia"
];

export const GAME_SPEED_MS = 200; // ms per match minute simulation

export const ATTRIBUTE_COLORS = {
  LOW: "text-slate-600",    // 1-9 Deep Gray
  AVG: "text-blue-800",     // 10-15 Navy Blue
  HIGH: "text-orange-700",  // 16-20 Burnt Orange/Amber for better light visibility
};

export const getAttributeColor = (value: number) => {
  if (value >= 16) return ATTRIBUTE_COLORS.HIGH;
  if (value >= 10) return ATTRIBUTE_COLORS.AVG;
  return ATTRIBUTE_COLORS.LOW;
};

// ──────────────────────────────────────────────────────────────────────────────
// NAVIGATION THEMES — Colores, gradientes y identidad visual por pantalla
// ──────────────────────────────────────────────────────────────────────────────

export interface ScreenTheme {
  /** Color base del departamento (Tailwind class) */
  color: string;
  /** Color hex para gradientes inline */
  hex: string;
  /** Gradiente de fondo para la pantalla */
  gradient: string;
  /** Color del texto sobre el gradiente */
  textColor: string;
  /** Color del borde */
  borderColor: string;
  /** Color tenue para badges/chips */
  softBg: string;
  /** Ícono temático Unicode */
  emoji: string;
  /** Descripción de la escena (para documentación) */
  scene?: string;
  /** Patrón SVG inline para textura de fondo */
  texture?: string;
  /** Opacidad del overlay oscuro (0-100, default 15) */
  overlayOpacity?: number;
}

export const SCREEN_THEMES: Record<string, ScreenTheme> = {
  // ── CAPA 1 — Núcleo ──────────────────────────────────────────────────────
  HOME: {
    color: 'bg-amber-600',
    hex: '#D97706',
    gradient: 'linear-gradient(160deg, #1a0f00 0%, #78350f 25%, #D97706 55%, #f59e0b 80%, #fbbf24 100%)',
    textColor: 'text-amber-50',
    borderColor: 'border-amber-500/40',
    softBg: 'bg-amber-500/15',
    emoji: '🏠',
    overlayOpacity: 10,
    scene: 'Estadio al atardecer, visto desde el palco',
    texture: '<svg width="100%" height="100%"><defs><pattern id="h" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="1.5" fill="rgba(255,255,255,0.03)"/></pattern></defs><rect width="100%" height="100%" fill="url(#h)"/></svg>',
  },
  SENIOR_SQUAD: {
    color: 'bg-green-600',
    hex: '#16A34A',
    gradient: 'linear-gradient(160deg, #022c22 0%, #064e3b 30%, #16A34A 60%, #22c55e 100%)',
    textColor: 'text-green-50',
    borderColor: 'border-green-500/40',
    softBg: 'bg-green-500/15',
    emoji: '👕',
    scene: 'Vestuario con camisetas colgadas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="v" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="40" fill="rgba(255,255,255,0.02)"/></pattern></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>',
  },
  SENIOR_TACTICS: {
    color: 'bg-emerald-800',
    hex: '#065F46',
    gradient: 'linear-gradient(145deg, #022c22 0%, #064e3b 20%, #065F46 50%, #047857 80%, #059669 100%)',
    textColor: 'text-emerald-50',
    borderColor: 'border-emerald-500/40',
    softBg: 'bg-emerald-500/15',
    emoji: '📋',
    scene: 'Pizarra táctica con fichas magnéticas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>',
  },
  PRE_MATCH: {
    color: 'bg-red-700',
    hex: '#B91C1C',
    gradient: 'linear-gradient(150deg, #1a0505 0%, #450a0a 25%, #7f1d1d 50%, #B91C1C 75%, #dc2626 100%)',
    textColor: 'text-red-50',
    borderColor: 'border-red-500/40',
    softBg: 'bg-red-500/15',
    emoji: '🧢',
    overlayOpacity: 22,
    scene: 'Túnel de vestuarios, jugadores saliendo',
    texture: '<svg width="100%" height="100%"><defs><pattern id="t" width="80" height="80" patternUnits="userSpaceOnUse"><line x1="0" y1="80" x2="80" y2="0" stroke="rgba(255,255,255,0.02)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#t)"/></svg>',
  },
  MATCH: {
    color: 'bg-red-700',
    hex: '#B91C1C',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1c1917 15%, #450a0a 35%, #7f1d1d 55%, #B91C1C 75%, #dc2626 100%)',
    textColor: 'text-red-50',
    borderColor: 'border-red-500/40',
    softBg: 'bg-red-500/15',
    emoji: '⚽',
    overlayOpacity: 25,
    scene: 'Campo desde cámara de TV, luces de estadio de noche',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="ml" cx="50%" cy="30%" r="60%"><stop offset="0%" stop-color="rgba(255,255,200,0.04)"/><stop offset="100%" stop-color="rgba(255,255,200,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#ml)"/></svg>',
  },

  // ── CAPA 2 — Departamentos dentro de "Más" ───────────────────────────────
  MARKET: {
    color: 'bg-yellow-600',
    hex: '#CA8A04',
    gradient: 'linear-gradient(155deg, #1c1300 0%, #422006 25%, #854d0e 50%, #CA8A04 75%, #eab308 100%)',
    textColor: 'text-yellow-50',
    borderColor: 'border-yellow-500/40',
    softBg: 'bg-yellow-500/15',
    emoji: '💰',
    scene: 'Oficina de fichajes, contratos sobre escritorio',
    texture: '<svg width="100%" height="100%"><defs><pattern id="d" width="30" height="30" patternUnits="userSpaceOnUse"><rect x="10" y="10" width="10" height="1" fill="rgba(255,255,255,0.02)"/></pattern></defs><rect width="100%" height="100%" fill="url(#d)"/></svg>',
  },
  COMPETITIONS: {
    color: 'bg-violet-600',
    hex: '#7C3AED',
    gradient: 'linear-gradient(150deg, #0f0520 0%, #2e1065 25%, #5b21b6 50%, #7C3AED 75%, #8b5cf6 100%)',
    textColor: 'text-violet-50',
    borderColor: 'border-violet-500/40',
    softBg: 'bg-violet-500/15',
    emoji: '🏆',
    scene: 'Trofeo iluminado sobre pedestal',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="cp" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.05)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#cp)"/></svg>',
  },
  NATIONAL: {
    color: 'bg-teal-600',
    hex: '#0D9488',
    gradient: 'linear-gradient(155deg, #021c1c 0%, #042f2e 25%, #0D9488 55%, #14b8a6 80%, #2dd4bf 100%)',
    textColor: 'text-teal-50',
    borderColor: 'border-teal-500/40',
    softBg: 'bg-teal-500/15',
    emoji: '🚩',
    scene: 'Estadio internacional, bandera desenfocada ondeando',
    texture: '<svg width="100%" height="100%"><defs><pattern id="f" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 30 Q15 25 30 30 Q45 35 60 30" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>',
  },
  SCOUTING: {
    color: 'bg-cyan-600',
    hex: '#0891B2',
    gradient: 'linear-gradient(150deg, #021c22 0%, #083344 25%, #0e7490 50%, #0891B2 75%, #22d3ee 100%)',
    textColor: 'text-cyan-50',
    borderColor: 'border-cyan-500/40',
    softBg: 'bg-cyan-500/15',
    emoji: '🔭',
    scene: 'Grada vacía de cantera, luz de mañana',
    texture: '<svg width="100%" height="100%"><defs><pattern id="s" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="8" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#s)"/></svg>',
  },
  PRESS: {
    color: 'bg-stone-500',
    hex: '#78716C',
    gradient: 'linear-gradient(155deg, #0c0a09 0%, #1c1917 20%, #44403c 50%, #78716C 80%, #a8a29e 100%)',
    textColor: 'text-stone-50',
    borderColor: 'border-stone-500/40',
    softBg: 'bg-stone-500/15',
    emoji: '📰',
    scene: 'Kiosco de periódicos, portadas colgadas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="nw" width="100%" height="3" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="100%" height="1" fill="rgba(255,255,255,0.01)"/></pattern></defs><rect width="100%" height="100%" fill="url(#nw)"/></svg>',
  },
  MANAGEMENT: {
    color: 'bg-slate-700',
    hex: '#334155',
    gradient: 'linear-gradient(150deg, #020617 0%, #0f172a 25%, #1e293b 50%, #334155 75%, #475569 100%)',
    textColor: 'text-slate-50',
    borderColor: 'border-slate-500/40',
    softBg: 'bg-slate-500/15',
    emoji: '📊',
    scene: 'Oficina con gráficos en pared de vidrio',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ch" width="50" height="50" patternUnits="userSpaceOnUse"><line x1="0" y1="50" x2="50" y2="50" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/><line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ch)"/></svg>',
  },
  PROFILE: {
    color: 'bg-amber-800',
    hex: '#92400E',
    gradient: 'linear-gradient(155deg, #1c0a00 0%, #451a03 25%, #78350f 50%, #92400E 75%, #b45309 100%)',
    textColor: 'text-amber-50',
    borderColor: 'border-amber-500/40',
    softBg: 'bg-amber-500/15',
    emoji: '🏅',
    scene: 'Pared de trofeos y fotos enmarcadas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="pf" width="60" height="60" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="20" height="15" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#pf)"/></svg>',
  },

  // ── CAPA 2 — Hijos de tabs fijos ──────────────────────────────────────────
  RESERVE_SQUAD: {
    color: 'bg-lime-600',
    hex: '#4D7C0F',
    gradient: 'linear-gradient(155deg, #0a1a00 0%, #1a2e05 25%, #3f6212 50%, #4D7C0F 75%, #65a30d 100%)',
    textColor: 'text-lime-50',
    borderColor: 'border-lime-500/40',
    softBg: 'bg-lime-500/15',
    emoji: '👕',
    scene: 'Vestuario secundario, luz fría',
    texture: '<svg width="100%" height="100%"><defs><pattern id="rv" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="40" height="40" fill="none" stroke="rgba(200,230,200,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#rv)"/></svg>',
  },
  U20_SQUAD: {
    color: 'bg-lime-500',
    hex: '#65A30D',
    gradient: 'linear-gradient(150deg, #0a1a00 0%, #1a2e05 20%, #3f6212 40%, #65A30D 65%, #84cc16 100%)',
    textColor: 'text-lime-50',
    borderColor: 'border-lime-400/40',
    softBg: 'bg-lime-400/15',
    emoji: '🌱',
    scene: 'Campo de entrenamiento juvenil, mañana',
    texture: '<svg width="100%" height="100%"><defs><pattern id="y2" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1" fill="rgba(200,255,200,0.02)"/></pattern></defs><rect width="100%" height="100%" fill="url(#y2)"/></svg>',
  },
  PRESS_CONFERENCE_PRE: {
    color: 'bg-blue-900',
    hex: '#1E3A8A',
    gradient: 'linear-gradient(155deg, #0a0f1a 0%, #172554 25%, #1e3a5f 50%, #1E3A8A 75%, #2563eb 100%)',
    textColor: 'text-blue-50',
    borderColor: 'border-blue-500/40',
    softBg: 'bg-blue-500/15',
    emoji: '🎤',
    overlayOpacity: 20,
    scene: 'Sala de conferencias, logos de patrocinadores, flashes',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="fl" cx="30%" cy="20%" r="40%"><stop offset="0%" stop-color="rgba(255,255,255,0.06)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#fl)"/></svg>',
  },
  PRESS_CONFERENCE_POST: {
    color: 'bg-blue-800',
    hex: '#1E40AF',
    gradient: 'linear-gradient(150deg, #0a0f1a 0%, #172554 20%, #1e3a8a 45%, #1E40AF 70%, #3b82f6 100%)',
    textColor: 'text-blue-50',
    borderColor: 'border-blue-400/40',
    softBg: 'bg-blue-400/15',
    emoji: '🎤',
    scene: 'Sala de conferencias post-partido',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="fl2" cx="70%" cy="25%" r="35%"><stop offset="0%" stop-color="rgba(255,255,255,0.05)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#fl2)"/></svg>',
  },
  RESERVE_TACTICS: {
    color: 'bg-lime-700',
    hex: '#4D7C0F',
    gradient: 'linear-gradient(155deg, #0a1a00 0%, #1a2e05 25%, #3f6212 50%, #4D7C0F 75%, #65a30d 100%)',
    textColor: 'text-lime-50',
    borderColor: 'border-lime-500/40',
    softBg: 'bg-lime-500/15',
    emoji: '📋',
    scene: 'Pizarra táctica reservas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="rt" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="20" height="20" fill="none" stroke="rgba(200,230,200,0.012)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#rt)"/></svg>',
  },
  U20_TACTICS: {
    color: 'bg-lime-600',
    hex: '#65A30D',
    gradient: 'linear-gradient(150deg, #0a1a00 0%, #1a2e05 20%, #3f6212 40%, #65A30D 65%, #84cc16 100%)',
    textColor: 'text-lime-50',
    borderColor: 'border-lime-400/40',
    softBg: 'bg-lime-400/15',
    emoji: '📋',
    scene: 'Pizarra táctica juvenil',
    texture: '<svg width="100%" height="100%"><defs><pattern id="yt" width="20" height="20" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="20" height="20" fill="none" stroke="rgba(200,255,200,0.012)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#yt)"/></svg>',
  },
  CHRONICLES: {
    color: 'bg-stone-600',
    hex: '#57534e',
    gradient: 'linear-gradient(155deg, #0c0a09 0%, #1c1917 20%, #292524 40%, #57534e 70%, #78716C 100%)',
    textColor: 'text-stone-50',
    borderColor: 'border-stone-500/40',
    softBg: 'bg-stone-500/15',
    emoji: '📖',
    scene: 'Página de diario escrita a mano, luz de lámpara',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ln" width="100%" height="24" patternUnits="userSpaceOnUse"><line x1="0" y1="23" x2="100%" y2="23" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ln)"/></svg>',
  },
  MANAGER_PROFILE: {
    color: 'bg-amber-800',
    hex: '#92400E',
    gradient: 'linear-gradient(155deg, #1c0a00 0%, #451a03 25%, #78350f 50%, #92400E 75%, #b45309 100%)',
    textColor: 'text-amber-50',
    borderColor: 'border-amber-500/40',
    softBg: 'bg-amber-500/15',
    emoji: '🏅',
    scene: 'Pared de trofeos y fotos enmarcadas del manager',
    texture: '<svg width="100%" height="100%"><defs><pattern id="mp" width="60" height="60" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="20" height="15" fill="none" stroke="rgba(255,200,100,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#mp)"/></svg>',
  },
  INBOX: {
    color: 'bg-stone-600',
    hex: '#57534e',
    gradient: 'linear-gradient(155deg, #0c0a09 0%, #1c1917 20%, #292524 40%, #57534e 70%, #78716C 100%)',
    textColor: 'text-stone-50',
    borderColor: 'border-stone-500/40',
    softBg: 'bg-stone-500/15',
    emoji: '📥',
    scene: 'Escritorio del manager con papeles apilados',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ix" width="50" height="50" patternUnits="userSpaceOnUse"><rect x="5" y="20" width="30" height="1" fill="rgba(255,255,255,0.015)"/><rect x="5" y="25" width="20" height="1" fill="rgba(255,255,255,0.01)"/></pattern></defs><rect width="100%" height="100%" fill="url(#ix)"/></svg>',
  },
  MEDIA: {
    color: 'bg-stone-500',
    hex: '#78716C',
    gradient: 'linear-gradient(155deg, #0c0a09 0%, #1c1917 20%, #44403c 45%, #78716C 75%, #a8a29e 100%)',
    textColor: 'text-stone-50',
    borderColor: 'border-stone-500/40',
    softBg: 'bg-stone-500/15',
    emoji: '📰',
    scene: 'Kiosco de periódicos, portadas colgadas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="md" width="100%" height="3" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="100%" height="1" fill="rgba(255,255,255,0.012)"/></pattern></defs><rect width="100%" height="100%" fill="url(#md)"/></svg>',
  },

  // ── NUEVAS PANTALLAS — Escenarios adicionales ─────────────────────────────
  SEARCH: {
    color: 'bg-indigo-600',
    hex: '#4F46E5',
    gradient: 'linear-gradient(150deg, #0f0520 0%, #1e1b4b 25%, #3730a3 50%, #4F46E5 75%, #6366f1 100%)',
    textColor: 'text-indigo-50',
    borderColor: 'border-indigo-500/40',
    softBg: 'bg-indigo-500/15',
    emoji: '🔎',
    scene: 'Sala de video-análisis con pantallas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="sr" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="30" height="20" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="0.5" rx="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#sr)"/></svg>',
  },
  NEGOTIATIONS: {
    color: 'bg-emerald-600',
    hex: '#059669',
    gradient: 'linear-gradient(155deg, #022c22 0%, #064e3b 25%, #047857 50%, #059669 75%, #10b981 100%)',
    textColor: 'text-emerald-50',
    borderColor: 'border-emerald-500/40',
    softBg: 'bg-emerald-500/15',
    emoji: '🤝',
    scene: 'Escritorio con contrato y bolígrafo',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ng" width="60" height="60" patternUnits="userSpaceOnUse"><line x1="10" y1="30" x2="50" y2="30" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/><line x1="30" y1="10" x2="30" y2="50" stroke="rgba(255,255,255,0.01)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ng)"/></svg>',
  },
  ECONOMY: {
    color: 'bg-emerald-700',
    hex: '#047857',
    gradient: 'linear-gradient(150deg, #022c22 0%, #064e3b 25%, #047857 50%, #059669 75%, #34d399 100%)',
    textColor: 'text-emerald-50',
    borderColor: 'border-emerald-500/40',
    softBg: 'bg-emerald-500/15',
    emoji: '💹',
    scene: 'Oficina de contabilidad, hojas de cálculo',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ec" width="50" height="50" patternUnits="userSpaceOnUse"><line x1="0" y1="50" x2="50" y2="50" stroke="rgba(255,255,255,0.012)" stroke-width="0.5"/><line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.008)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ec)"/></svg>',
  },
  TRAINING: {
    color: 'bg-green-700',
    hex: '#15803d',
    gradient: 'linear-gradient(155deg, #052e16 0%, #14532d 25%, #15803d 50%, #16a34a 75%, #22c55e 100%)',
    textColor: 'text-green-50',
    borderColor: 'border-green-500/40',
    softBg: 'bg-green-500/15',
    emoji: '🏃',
    scene: 'Jugadores entrenando en el campo, conos y balones',
    texture: '<svg width="100%" height="100%"><defs><pattern id="tr" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2" fill="rgba(255,255,255,0.015)"/></pattern></defs><rect width="100%" height="100%" fill="url(#tr)"/></svg>',
  },
  STAFF: {
    color: 'bg-slate-600',
    hex: '#475569',
    gradient: 'linear-gradient(150deg, #020617 0%, #0f172a 25%, #1e293b 50%, #475569 75%, #64748b 100%)',
    textColor: 'text-slate-50',
    borderColor: 'border-slate-500/40',
    softBg: 'bg-slate-500/15',
    emoji: '🎓',
    scene: 'Sala de cuerpo técnico, pizarra de nombres',
    texture: '<svg width="100%" height="100%"><defs><pattern id="sf" width="50" height="50" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="40" height="1" fill="rgba(255,255,255,0.015)"/><rect x="5" y="10" width="30" height="1" fill="rgba(255,255,255,0.01)"/><rect x="5" y="15" width="35" height="1" fill="rgba(255,255,255,0.01)"/></pattern></defs><rect width="100%" height="100%" fill="url(#sf)"/></svg>',
  },
  BOARD: {
    color: 'bg-indigo-700',
    hex: '#4338ca',
    gradient: 'linear-gradient(155deg, #0f0520 0%, #1e1b4b 25%, #312e81 50%, #4338ca 75%, #6366f1 100%)',
    textColor: 'text-indigo-50',
    borderColor: 'border-indigo-500/40',
    softBg: 'bg-indigo-500/15',
    emoji: '🏛️',
    scene: 'Sala de juntas, mesa larga y ventanales',
    texture: '<svg width="100%" height="100%"><defs><pattern id="bd" width="80" height="80" patternUnits="userSpaceOnUse"><rect x="10" y="10" width="60" height="40" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5" rx="2"/></pattern></defs><rect width="100%" height="100%" fill="url(#bd)"/></svg>',
  },
  TABLE: {
    color: 'bg-blue-700',
    hex: '#1d4ed8',
    gradient: 'linear-gradient(150deg, #0a0f1a 0%, #172554 25%, #1e40af 50%, #1d4ed8 75%, #3b82f6 100%)',
    textColor: 'text-blue-50',
    borderColor: 'border-blue-500/40',
    softBg: 'bg-blue-500/15',
    emoji: '📊',
    scene: 'Marcador electrónico de estadio',
    texture: '<svg width="100%" height="100%"><defs><pattern id="tb" width="100%" height="2" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="100%" height="1" fill="rgba(255,255,255,0.015)"/></pattern></defs><rect width="100%" height="100%" fill="url(#tb)"/></svg>',
  },
  CLUBS_LIST: {
    color: 'bg-sky-600',
    hex: '#0284c7',
    gradient: 'linear-gradient(155deg, #021c22 0%, #0c4a6e 25%, #0369a1 50%, #0284c7 75%, #38bdf8 100%)',
    textColor: 'text-sky-50',
    borderColor: 'border-sky-500/40',
    softBg: 'bg-sky-500/15',
    emoji: '🗺️',
    scene: 'Mapa de estadios del mundo',
    texture: '<svg width="100%" height="100%"><defs><pattern id="cl" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="15" fill="none" stroke="rgba(255,255,255,0.012)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#cl)"/></svg>',
  },
  EXTERNAL_CLUB: {
    color: 'bg-sky-700',
    hex: '#0369a1',
    gradient: 'linear-gradient(150deg, #021c22 0%, #0c4a6e 20%, #0369a1 45%, #0284c7 70%, #0ea5e9 100%)',
    textColor: 'text-sky-50',
    borderColor: 'border-sky-400/40',
    softBg: 'bg-sky-400/15',
    emoji: '🏟️',
    scene: 'Estadio rival con sus colores',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ec2" width="40" height="40" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="30" height="30" fill="none" stroke="rgba(255,255,255,0.012)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ec2)"/></svg>',
  },
  LEAGUE_RANKING: {
    color: 'bg-purple-600',
    hex: '#9333ea',
    gradient: 'linear-gradient(155deg, #0f0520 0%, #3b0764 25%, #7e22ce 50%, #9333ea 75%, #a855f7 100%)',
    textColor: 'text-purple-50',
    borderColor: 'border-purple-500/40',
    softBg: 'bg-purple-500/15',
    emoji: '🌍',
    scene: 'Vista aérea de varios estadios del mundo',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="lr" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="rgba(255,255,255,0.04)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#lr)"/></svg>',
  },
  CLUB_REPORT: {
    color: 'bg-teal-700',
    hex: '#0f766e',
    gradient: 'linear-gradient(150deg, #021c1c 0%, #042f2e 20%, #0f766e 50%, #14b8a6 80%, #2dd4bf 100%)',
    textColor: 'text-teal-50',
    borderColor: 'border-teal-500/40',
    softBg: 'bg-teal-500/15',
    emoji: '📈',
    scene: 'Oficina con gráficos en pared de vidrio',
    texture: '<svg width="100%" height="100%"><defs><pattern id="cr" width="50" height="50" patternUnits="userSpaceOnUse"><line x1="0" y1="50" x2="50" y2="50" stroke="rgba(255,255,255,0.012)" stroke-width="0.5"/><line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.008)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#cr)"/></svg>',
  },
  PEOPLE_HUB: {
    color: 'bg-rose-600',
    hex: '#e11d48',
    gradient: 'linear-gradient(155deg, #1a0510 0%, #4c0519 25%, #9f1239 50%, #e11d48 75%, #fb7185 100%)',
    textColor: 'text-rose-50',
    borderColor: 'border-rose-500/40',
    softBg: 'bg-rose-500/15',
    emoji: '🧑‍🤝‍🧑',
    scene: 'Sala de recepción / lounge de agentes',
    texture: '<svg width="100%" height="100%"><defs><pattern id="ph" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="12" cy="20" r="3" fill="none" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/><circle cx="28" cy="20" r="3" fill="none" stroke="rgba(255,255,255,0.01)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#ph)"/></svg>',
  },
  SEASON_SUMMARY: {
    color: 'bg-amber-600',
    hex: '#D97706',
    gradient: 'linear-gradient(155deg, #1a0f00 0%, #78350f 25%, #b45309 50%, #D97706 75%, #f59e0b 100%)',
    textColor: 'text-amber-50',
    borderColor: 'border-amber-500/40',
    softBg: 'bg-amber-500/15',
    emoji: '🏆',
    scene: 'Vestuario celebrando (o vacío si hubo mal resultado)',
    texture: '<svg width="100%" height="100%"><defs><radialGradient id="ss" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="rgba(255,255,200,0.05)"/><stop offset="100%" stop-color="rgba(255,255,200,0)"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#ss)"/></svg>',
  },
  SCHEDULE: {
    color: 'bg-sky-700',
    hex: '#0369a1',
    gradient: 'linear-gradient(155deg, #021c22 0%, #0c4a6e 25%, #0369a1 50%, #0284c7 75%, #38bdf8 100%)',
    textColor: 'text-sky-50',
    borderColor: 'border-sky-500/40',
    softBg: 'bg-sky-500/15',
    emoji: '📅',
    scene: 'Túnel con pizarra de próximos rivales',
    texture: '<svg width="100%" height="100%"><defs><pattern id="sc" width="100%" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="19" x2="100%" y2="19" stroke="rgba(255,255,255,0.015)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#sc)"/></svg>',
  },
  SETTINGS: {
    color: 'bg-slate-600',
    hex: '#475569',
    gradient: 'linear-gradient(150deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    textColor: 'text-slate-50',
    borderColor: 'border-slate-500/40',
    softBg: 'bg-slate-500/15',
    emoji: '⚙️',
    scene: 'Fondo neutro, sin escenario',
  },
  VACATION: {
    color: 'bg-orange-500',
    hex: '#f97316',
    gradient: 'linear-gradient(155deg, #431407 0%, #7c2d12 25%, #c2410c 50%, #f97316 75%, #fb923c 100%)',
    textColor: 'text-orange-50',
    borderColor: 'border-orange-500/40',
    softBg: 'bg-orange-500/15',
    emoji: '🏖️',
    scene: 'Playa o paisaje relajado, tono cálido',
    texture: '<svg width="100%" height="100%"><defs><pattern id="vc" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 40 Q15 35 30 40 Q45 45 60 40" fill="none" stroke="rgba(255,255,200,0.02)" stroke-width="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#vc)"/></svg>',
  },
  SAVE: {
    color: 'bg-stone-600',
    hex: '#57534e',
    gradient: 'linear-gradient(155deg, #0c0a09 0%, #1c1917 25%, #44403c 50%, #57534e 75%, #78716C 100%)',
    textColor: 'text-stone-50',
    borderColor: 'border-stone-500/40',
    softBg: 'bg-stone-500/15',
    emoji: '💾',
    scene: 'Escritorio con carpetas archivadas',
    texture: '<svg width="100%" height="100%"><defs><pattern id="sv" width="50" height="50" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="40" height="8" fill="none" stroke="rgba(255,255,255,0.012)" stroke-width="0.5" rx="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#sv)"/></svg>',
  },
};

/** Obtener el tema para una vista, con fallback a neutro */
export const getScreenTheme = (view: string): ScreenTheme => {
  // Mapear vistas de selección nacional al tema de selección
  if (view.startsWith('NT_')) return SCREEN_THEMES.NATIONAL;
  // Mapear vistas de competiciones
  if (view.startsWith('COMP_')) return SCREEN_THEMES.COMPETITIONS;
  // Mapear vistas de plantel
  if (view.endsWith('_SQUAD')) {
    if (view.startsWith('RESERVE')) return SCREEN_THEMES.RESERVE_SQUAD;
    if (view.startsWith('U20')) return SCREEN_THEMES.U20_SQUAD;
    return SCREEN_THEMES.SENIOR_SQUAD;
  }
  // Mapear vistas de táctica
  if (view.endsWith('_TACTICS')) {
    if (view.startsWith('RESERVE')) return SCREEN_THEMES.RESERVE_TACTICS;
    if (view.startsWith('U20')) return SCREEN_THEMES.U20_TACTICS;
    return SCREEN_THEMES.SENIOR_TACTICS;
  }
  return SCREEN_THEMES[view] || {
    color: 'bg-slate-600',
    hex: '#475569',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
    textColor: 'text-slate-50',
    borderColor: 'border-slate-500/40',
    softBg: 'bg-slate-500/15',
    emoji: '📄',
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// DEPARTAMENTOS — Estructura del sheet "Más"
// ──────────────────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  label: string;
  emoji: string;
  color: string;     // Tailwind bg class
  hex: string;       // Color hex
  /** Sub-items que agrupa */
  items: { id: string; label: string; icon?: string }[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'DEPT_MARKET',
    label: 'Mercado',
    emoji: '💰',
    color: 'bg-yellow-600',
    hex: '#CA8A04',
    items: [
      { id: 'MARKET', label: 'Mercado', icon: '💰' },
      { id: 'SEARCH', label: 'Buscador', icon: '🔍' },
      { id: 'NEGOTIATIONS', label: 'Negociaciones', icon: '🤝' },
      { id: 'CLUBS_LIST', label: 'Clubes', icon: '🏟️' },
    ],
  },
  {
    id: 'DEPT_COMPETITIONS',
    label: 'Competiciones',
    emoji: '🏆',
    color: 'bg-violet-600',
    hex: '#7C3AED',
    items: [
      { id: 'TABLE', label: 'Clasificación', icon: '📊' },
      { id: 'LEAGUE_RANKING', label: 'Ranking Ligas', icon: '📈' },
      { id: 'TOURNAMENT_HUB', label: 'Torneos', icon: '🏆' },
      { id: 'CLUB_REPORT', label: 'Informe Club', icon: '📋' },
    ],
  },
  {
    id: 'DEPT_SCOUTING',
    label: 'Scouting',
    emoji: '🔍',
    color: 'bg-cyan-600',
    hex: '#0891B2',
    items: [
      { id: 'SCOUTING', label: 'Informes', icon: '🔍' },
    ],
  },
  {
    id: 'DEPT_PRESS',
    label: 'Prensa',
    emoji: '📰',
    color: 'bg-stone-500',
    hex: '#78716C',
    items: [
      { id: 'INBOX', label: 'Buzón', icon: '📬' },
      { id: 'MEDIA', label: 'Medios', icon: '📺' },
      { id: 'CHRONICLES', label: 'Crónicas', icon: '📖' },
    ],
  },
  {
    id: 'DEPT_MANAGEMENT',
    label: 'Gestión',
    emoji: '📊',
    color: 'bg-slate-700',
    hex: '#334155',
    items: [
      { id: 'ECONOMY', label: 'Economía', icon: '💰' },
      { id: 'STAFF', label: 'Staff', icon: '👔' },
      { id: 'TRAINING', label: 'Entrenamiento', icon: '🏋️' },
      { id: 'BOARD', label: 'Directiva', icon: '🏛️' },
    ],
  },
  {
    id: 'DEPT_PROFILE',
    label: 'Perfil',
    emoji: '🏅',
    color: 'bg-amber-800',
    hex: '#92400E',
    items: [
      { id: 'MANAGER_PROFILE', label: 'Mi Perfil', icon: '👤' },
      { id: 'HALL_OF_FAME', label: 'Salón de la Fama', icon: '🏅' },
    ],
  },
];

/** Departamento condicional para selección nacional */
export const DEPT_NATIONAL: Department = {
  id: 'DEPT_NATIONAL',
  label: 'Selección',
  emoji: '🚩',
  color: 'bg-teal-600',
  hex: '#0D9488',
  items: [
    { id: 'NT_PLATEL', label: 'Plantel', icon: '👕' },
    { id: 'NT_TACTICA', label: 'Táctica', icon: '📋' },
    { id: 'NT_CALENDARIO', label: 'Calendario', icon: '📅' },
    { id: 'NT_STATS', label: 'Estadísticas', icon: '📊' },
  ],
};
