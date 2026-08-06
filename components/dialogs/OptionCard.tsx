import React from 'react';
import { Star, Check } from 'lucide-react';

export interface OptionCardData {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  efectos: string[];
}

interface OptionCardProps extends OptionCardData {
  recomendada?: boolean;
  justificacion?: string;
  seleccionada: boolean;
  color?: string; // clase tailwind del borde seleccionado
  onClick: () => void;
}

/**
 * Tarjeta de opción de los diálogos (spec §5.3 TarjetaOpcion).
 * - recomendada → borde dorado #FFD700 + badge ⭐
 * - seleccionada → borde del color del equipo
 */
export const OptionCard: React.FC<OptionCardProps> = ({
  id, icono, titulo, descripcion, efectos, recomendada, justificacion, seleccionada, color = 'border-[#3a4a3a]', onClick,
}) => {
  const border = recomendada
    ? 'border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,0.25)]'
    : seleccionada
      ? `${color} shadow-md`
      : 'border-[#a0b0a0]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionada}
      className={`relative flex-1 min-w-[180px] text-left p-4 rounded-sm border-2 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${border}`}
    >
      {recomendada && (
        <span className="absolute -top-2.5 right-2 flex items-center gap-1 bg-[#FFD700] text-slate-900 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-md">
          <Star size={9} className="fill-slate-900" /> Recomendado
        </span>
      )}
      <div className="text-2xl mb-1.5">{icono}</div>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-900">{titulo}</p>
      <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-snug">{descripcion}</p>
      <ul className="mt-2 space-y-1">
        {efectos.map((ef, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[9px] font-bold text-slate-600 leading-snug">
            <Check size={9} className="text-green-700 shrink-0 mt-0.5" /> {ef}
          </li>
        ))}
      </ul>
      {justificacion && (
        <p className="mt-2 pt-2 border-t border-[#a0b0a0]/40 text-[9px] italic font-bold text-slate-600 leading-snug">
          ⭐ {justificacion}
        </p>
      )}
      {seleccionada && (
        <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#3a4a3a] text-white flex items-center justify-center">
          <Check size={10} />
        </span>
      )}
    </button>
  );
};
