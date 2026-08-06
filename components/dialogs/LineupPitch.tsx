import React, { useMemo, useState } from 'react';
import { Player, Position, POSITION_FULL_NAMES } from '../../types';
import { world } from '../../services/worldManager';
import { LineupPlayerAdvice } from '../../services/staffAdviceService';

// Mismas coordenadas (t/l %) que TacticsView para que el once coincida con la pizarra
const SLOT_COORDS: Record<number, { t: number; l: number }> = {
  0: { t: 90, l: 50 },
  31: { t: 82.5, l: 50 },
  1: { t: 75, l: 8 }, 2: { t: 75, l: 29 }, 3: { t: 75, l: 50 }, 4: { t: 75, l: 71 }, 5: { t: 75, l: 92 },
  9: { t: 62, l: 8 }, 6: { t: 62, l: 29 }, 8: { t: 62, l: 50 }, 7: { t: 62, l: 71 }, 10: { t: 62, l: 92 },
  11: { t: 45, l: 8 }, 12: { t: 45, l: 29 }, 13: { t: 45, l: 50 }, 14: { t: 45, l: 71 }, 15: { t: 45, l: 92 },
  16: { t: 28, l: 8 }, 19: { t: 28, l: 29 }, 17: { t: 28, l: 50 }, 20: { t: 28, l: 71 }, 18: { t: 28, l: 92 },
  27: { t: 12, l: 8 }, 29: { t: 12, l: 29 }, 26: { t: 12, l: 50 }, 30: { t: 12, l: 71 }, 28: { t: 12, l: 92 },
};

const getDorsal = (p: Player, allPlayers: Player[]): number => {
  const isGK = p.positions.includes(Position.GK);
  const idx = allPlayers.indexOf(p);
  return isGK ? 1 : (idx >= 0 ? idx + 2 : 2);
};

interface LineupPitchProps {
  clubId: string;
  clubColor: string;
  xi: LineupPlayerAdvice[];
  banquillo: { playerId: string; razon: string }[];
}

export const LineupPitch: React.FC<LineupPitchProps> = ({ clubId, clubColor, xi, banquillo }) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [benchHoverId, setBenchHoverId] = useState<string | null>(null);

  const players = useMemo(() => world.getPlayersByClub(clubId), [clubId]);

  const byId = (id: string) => players.find(p => p.id === id);
  const hovered = hoverId ? byId(hoverId) : null;
  const hoveredAdvice = hoverId ? xi.find(x => x.playerId === hoverId) : null;
  const benchHovered = benchHoverId ? byId(benchHoverId) : null;
  const benchRazon = benchHoverId ? banquillo.find(b => b.playerId === benchHoverId)?.razon : null;

  const activeTooltip = hovered ? {
    p: hovered,
    razones: hoveredAdvice?.razones || [],
    razonExtra: null as string | null,
  } : benchHovered ? {
    p: benchHovered,
    razones: [],
    razonExtra: benchRazon || null,
  } : null;

  return (
    <div className="space-y-3 animate-fade-up">
      {/* Cancha */}
      <div className="relative w-full max-w-[420px] mx-auto aspect-[3/4] rounded-sm overflow-visible shadow-2xl bg-[#1e3a29] border-[3px] border-white/30 ring-4 ring-[#a0b0a0]/30">
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
          <g stroke="white" strokeWidth="2" fill="none">
            <rect x="5%" y="5%" width="90%" height="90%" />
            <line x1="5%" y1="50%" x2="95%" y2="50%" />
            <circle cx="50%" cy="50%" r="15%" />
            <rect x="25%" y="5%" width="50%" height="15%" />
            <rect x="25%" y="80%" width="50%" height="15%" />
          </g>
        </svg>

        {xi.map(({ playerId, slot }) => {
          const p = byId(playerId);
          const coords = SLOT_COORDS[slot];
          if (!p || !coords) return null;
          const isHover = hoverId === playerId;
          return (
            <button
              key={playerId}
              type="button"
              onMouseEnter={() => setHoverId(playerId)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(playerId)}
              onBlur={() => setHoverId(null)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none"
              style={{ top: `${coords.t}%`, left: `${coords.l}%` }}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex flex-col items-center justify-center font-black text-[11px] sm:text-sm shadow-lg transition-all cursor-pointer hover:scale-110 ${isHover ? 'ring-4 ring-yellow-400 scale-110' : ''} ${p.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : `${clubColor} text-white border-white/60`}`}
              >
                {getDorsal(p, players)}
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-1 py-px bg-black/70 text-white text-[6px] sm:text-[7px] font-black uppercase rounded-sm whitespace-nowrap">
                {p.name.split(' ').slice(-1)[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tooltip / detalle del jugador (hover o tap en banquillo) */}
      <div className="min-h-[54px] mx-auto max-w-[420px]">
        {activeTooltip ? (
          <div className="bg-white border border-[#a0b0a0] rounded-sm shadow-md px-3 py-2 animate-fade-up">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase text-slate-900 truncate">
                {activeTooltip.p.name} <span className="text-slate-400 font-bold">· {POSITION_FULL_NAMES[activeTooltip.p.positions[0]] || activeTooltip.p.positions[0]}</span>
              </p>
              <span className="text-[9px] font-black text-slate-600 shrink-0">CA {(activeTooltip.p.currentAbility / 20).toFixed(1)}</span>
            </div>
            {activeTooltip.razones.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {activeTooltip.razones.map((r, i) => (
                  <li key={i} className="text-[9px] font-bold text-slate-600">{r}</li>
                ))}
              </ul>
            )}
            {activeTooltip.razonExtra && (
              <p className="mt-1 text-[9px] font-bold italic text-slate-500">💡 {activeTooltip.razonExtra}</p>
            )}
          </div>
        ) : (
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center pt-3">
            Pasa el cursor sobre un jugador para ver por qué es titular
          </p>
        )}
      </div>

      {/* Banquillo */}
      {banquillo.length > 0 && (
        <div className="bg-black/5 border border-[#a0b0a0]/60 rounded-sm p-3 mx-auto max-w-[420px]">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-2">Banquillo y ausencias</p>
          <div className="flex flex-wrap gap-2">
            {banquillo.map(({ playerId, razon }) => {
              const p = byId(playerId);
              if (!p) return null;
              const isHover = benchHoverId === playerId;
              return (
                <button
                  key={playerId}
                  type="button"
                  onMouseEnter={() => setBenchHoverId(playerId)}
                  onMouseLeave={() => setBenchHoverId(null)}
                  onFocus={() => setBenchHoverId(playerId)}
                  onBlur={() => setBenchHoverId(null)}
                  title={razon}
                  className={`flex flex-col items-center gap-0.5 transition-all hover:scale-105 focus:outline-none ${isHover ? 'ring-2 ring-yellow-400 rounded-full' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-[10px] shadow-sm ${p.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-slate-200 border-slate-400 text-slate-700'}`}>
                    {getDorsal(p, players)}
                  </div>
                  <span className="text-[6px] font-black uppercase text-slate-700 max-w-[60px] truncate">{p.name.split(' ').slice(-1)[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
