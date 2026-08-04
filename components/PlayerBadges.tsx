import React from 'react';
import { Player } from '../types';
import { X, MessageSquare } from 'lucide-react';

/**
 * Puntos de forma (últimos ratings) con la misma escala cromática en todas las vistas:
 * verde ≥8, verde claro ≥7, ámbar ≥6, naranja ≥5, rojo <5.
 */
export const PlayerFormDots: React.FC<{ ratings?: number[] }> = ({ ratings }) => {
  if (!ratings || ratings.length === 0) return null;
  return (
    <div className="flex gap-[2px] items-center justify-center">
      {ratings.map((r, i) => {
        let color = 'bg-white/15';
        if (r >= 8) color = 'bg-green-500';
        else if (r >= 7) color = 'bg-green-400';
        else if (r >= 6) color = 'bg-amber-400';
        else if (r >= 5) color = 'bg-orange-500';
        else color = 'bg-red-500';
        return <div key={i} className={`w-[6px] h-[6px] rounded-full ${color}`} title={`${r.toFixed(1)}`} />;
      })}
    </div>
  );
};

/**
 * Iconos de estado de jugador: TRN (transferible), lesión, suspensión y descontento.
 * Compartidos entre la plantilla de club y la convocatoria de la selección.
 */
export const PlayerStatusIcons: React.FC<{ player: Player }> = ({ player }) => {
  const icons = [];
  if (player.transferStatus !== 'NONE') {
    icons.push(
      <span key="trn" className="text-[8px] text-orange-700 font-black bg-orange-100 border border-orange-300 px-1 rounded-[1px] h-4 flex items-center">TRN</span>
    );
  }
  if (player.injury) {
    icons.push(
      <div key="inj" className="w-4 h-4 bg-white/10 border border-red-600 flex items-center justify-center rounded-[1px] shadow-sm">
        <X size={10} className="text-red-600 stroke-[4]" />
      </div>
    );
  }
  if (player.suspension && player.suspension.matchesLeft > 0) {
    icons.push(<div key="sus" className="w-3 h-4 bg-red-600 border border-red-800 rounded-[1px] shadow-sm"></div>);
  }
  if ((player.morale < 40 || player.fitness < 60) && player.clubId) {
    icons.push(
      <div key="unh" className="relative flex items-center justify-center">
        <MessageSquare size={16} className="text-white/70 fill-amber-400" />
        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white/90 mt-[-1px]">!!</span>
      </div>
    );
  }
  return icons.length > 0 ? <div className="flex gap-1.5 items-center ml-2 shrink-0">{icons}</div> : null;
};
