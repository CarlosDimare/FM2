import React, { useEffect, useState } from 'react';

export interface ProgressiveOptionData {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  efectos: string[];
}

interface ProgressiveOptionsProps {
  opciones: ProgressiveOptionData[];
  seleccionada: string | null;
  delayMs?: number;
  color?: string;
  onSelect: (id: string) => void;
  renderExtra?: (op: ProgressiveOptionData) => React.ReactNode;
}

export const ProgressiveOptions: React.FC<ProgressiveOptionsProps> = ({
  opciones, seleccionada, delayMs = 180, color = 'border-[#3a4a3a]', onSelect, renderExtra,
}) => {
  const [visible, setVisible] = useState<Set<number>>(new Set());

  useEffect(() => {
    setVisible(new Set());
    opciones.forEach((_, i) => {
      const timer = setTimeout(() => {
        setVisible(prev => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
      }, 300 + i * delayMs);
      return () => clearTimeout(timer);
    });
  }, [opciones, delayMs]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-2">
      {opciones.map((op, i) => (
        <div
          key={op.id}
          className={`flex-1 min-w-[180px] text-left p-4 rounded-sm border-2 bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer animate-fade-up ${seleccionada === op.id ? `${color} shadow-md` : 'border-[#a0b0a0]'}`}
          style={{ animationDelay: visible.has(i) ? `${i * delayMs}ms` : '9999ms', opacity: visible.has(i) ? 1 : 0 }}
          onClick={() => onSelect(op.id)}
        >
          <div className="text-2xl mb-1.5">{op.icono}</div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-900">{op.titulo}</p>
          <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-snug">{op.descripcion}</p>
          <ul className="mt-2 space-y-1">
            {op.efectos.map((ef, j) => (
              <li key={j} className="flex items-start gap-1.5 text-[9px] font-bold text-slate-600 leading-snug">
                <span className="text-green-700 shrink-0 mt-0.5">✓</span> {ef}
              </li>
            ))}
          </ul>
          {renderExtra && renderExtra(op)}
          {seleccionada === op.id && (
            <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#3a4a3a] text-white flex items-center justify-center">
              <span className="text-white text-[10px] font-black">✓</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
