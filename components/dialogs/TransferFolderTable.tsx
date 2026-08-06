import React from 'react';
import { Check, Minus } from 'lucide-react';
import { world } from '../../services/worldManager';
import { TransferCandidate, TransferViability } from '../../services/staffAdviceService';

const VIABILIDAD_META: Record<TransferViability, { label: string; cls: string; dot: string }> = {
  VIABLE: { label: 'Asequible', cls: 'bg-green-100 text-green-800 border-green-400', dot: '🟢' },
  NEGOTIABLE: { label: 'Negociable', cls: 'bg-amber-100 text-amber-800 border-amber-400', dot: '🟡' },
  INVIABLE: { label: 'Inviable', cls: 'bg-red-100 text-red-800 border-red-400', dot: '🔴' },
};

interface TransferFolderTableProps {
  candidatos: TransferCandidate[];
  seleccionados: Set<string>;
  onToggle: (playerId: string) => void;
}

/**
 * Tabla de la Carpeta de Refuerzos (spec §4.1): jugador / posición / valor /
 * semáforo de viabilidad con razón al hover + selector.
 */
export const TransferFolderTable: React.FC<TransferFolderTableProps> = ({ candidatos, seleccionados, onToggle }) => {
  if (candidatos.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 italic uppercase font-bold tracking-widest text-[10px] bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm">
        Sin candidatos en la carpeta
      </div>
    );
  }

  return (
    <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#d3dcd3] border-b border-[#a0b0a0]">
            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600">Jugador</th>
            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600">Pos</th>
            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600 text-right">Valor</th>
            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600">Viabilidad</th>
            <th className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-600 text-center">Sel.</th>
          </tr>
        </thead>
        <tbody>
          {candidatos.map((c, idx) => {
            const p = world.getPlayer(c.playerId);
            const meta = VIABILIDAD_META[c.viabilidad];
            const seleccionado = seleccionados.has(c.playerId);
            return (
              <tr
                key={c.playerId}
                className={`border-b border-[#a0b0a0]/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e8ece8]/60'} ${seleccionado ? 'bg-green-50' : ''} hover:bg-[#ccd9cc]`}
              >
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[130px]">{p?.name || '—'}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">{world.getClub(p?.clubId || '')?.shortName || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-[10px] font-bold text-slate-700">{c.position}</td>
                <td className="px-3 py-2 text-right text-[10px] font-black text-slate-900">£{(c.value / 1000000).toFixed(1)}M</td>
                <td className="px-3 py-2">
                  <span
                    title={c.razon}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[8px] font-black uppercase tracking-tight cursor-help ${meta.cls}`}
                  >
                    {meta.dot} {meta.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onToggle(c.playerId)}
                    aria-pressed={seleccionado}
                    title={seleccionado ? 'Quitar de la selección' : 'Seleccionar'}
                    className={`w-5 h-5 inline-flex items-center justify-center rounded-sm border-2 transition-all ${seleccionado ? 'bg-[#3a4a3a] border-[#3a4a3a] text-white' : 'bg-white border-[#a0b0a0] text-transparent hover:border-[#3a4a3a]'}`}
                  >
                    {seleccionado ? <Check size={11} /> : <Minus size={11} />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
