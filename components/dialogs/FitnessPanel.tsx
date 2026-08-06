import React from 'react';
import { world } from '../../services/worldManager';
import { FitnessReport } from '../../services/staffAdviceService';

const barColor = (v: number) => (v > 80 ? 'bg-red-600' : v > 60 ? 'bg-amber-500' : 'bg-green-600');

interface MetricBarProps {
  label: string;
  value: number;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{label}</span>
      <span className={`text-[10px] font-black ${value > 80 ? 'text-red-700' : value > 60 ? 'text-amber-700' : 'text-green-700'}`}>
        {value}%
      </span>
    </div>
    <div className="h-2 bg-[#e0e0e0] rounded-[2px] overflow-hidden border border-slate-300">
      <div
        className={`h-full ${barColor(value)} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
      />
    </div>
  </div>
);

interface FitnessPanelProps {
  report: FitnessReport;
}

/**
 * Panel de estado del plantel del Preparador Físico (spec §3.1):
 * barras de Carga media / Riesgo de lesión + jugadores en rojo con su %.
 */
export const FitnessPanel: React.FC<FitnessPanelProps> = ({ report }) => (
  <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4 space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <MetricBar label="Carga media" value={report.cargaMedia} />
      <MetricBar label="Riesgo de lesión" value={report.riesgoLesion} />
    </div>

    <div className="flex items-center justify-between px-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
        ⚠️ Condición media del plantel
      </span>
      <span className={`text-[11px] font-black ${report.fitnessMedia > 75 ? 'text-green-700' : report.fitnessMedia > 60 ? 'text-amber-700' : 'text-red-700'}`}>
        {report.fitnessMedia}%
      </span>
    </div>

    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5 px-1">
        {report.jugadoresRiesgo.length > 0 ? '🚨 Jugadores en riesgo:' : '✅ Ningún jugador en zona de riesgo'}
      </p>
      {report.jugadoresRiesgo.length > 0 && (
        <ul className="space-y-1">
          {report.jugadoresRiesgo.map(j => {
            const p = world.getPlayer(j.playerId);
            return (
              <li key={j.playerId} className="flex justify-between items-center px-2 py-1.5 bg-white border border-[#a0b0a0]/50 rounded-sm">
                <span className="text-[10px] font-bold text-slate-800 truncate">
                  {p?.name || 'Jugador'}
                  <span className="text-[8px] text-slate-500 ml-1.5 uppercase">{p?.positions[0] || ''}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase text-slate-500">Carga {j.carga}%</span>
                  <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-black ${j.riesgo > 80 ? 'bg-red-600 text-white' : j.riesgo > 60 ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
                    {j.riesgo}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </div>
);
