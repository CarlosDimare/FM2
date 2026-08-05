import React, { useState } from 'react';
import { world } from '../services/worldManager';
import { FMBox, FMTable, FMTableCell, FMEmptyState } from './FMUI';
import { BookMarked, Trophy, ChevronLeft, ChevronRight, Goal, Zap, Star } from 'lucide-react';

interface SeasonHistoryViewProps {
  onBack: () => void;
}

export const SeasonHistoryView: React.FC<SeasonHistoryViewProps> = ({ onBack }) => {
  const records = [...(world.seasonHistory || [])].sort((a, b) => b.year - a.year);
  const [activeIdx, setActiveIdx] = useState(0);

  if (records.length === 0) {
    return (
      <div className="p-4 sm:p-8 h-full overflow-y-auto bg-[#d4dcd4]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <BookMarked size={24} className="text-amber-700" />
            <h2 className="text-xl font-black text-slate-900 uppercase italic">Libro de Temporadas</h2>
          </div>
          <FMBox>
            <FMEmptyState
              icon={<BookMarked size={28} />}
              title="Aún no hay temporadas completadas"
              subtitle="Termina una temporada y aquí quedará registrado el historial de campeones, goleadores y tablas finales de todas las ligas."
              action={<button onClick={onBack} className="text-[10px] font-black uppercase text-slate-600 hover:text-slate-900 underline">Volver al inicio</button>}
            />
          </FMBox>
        </div>
      </div>
    );
  }

  const active = records[Math.min(activeIdx, records.length - 1)];

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto bg-[#d4dcd4]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <BookMarked size={24} className="text-amber-700" />
          <h2 className="text-xl font-black text-slate-900 uppercase italic">Libro de Temporadas</h2>
          <span className="text-[9px] text-slate-500 font-bold ml-auto">{records.length} temporada{records.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Selector de año */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveIdx(Math.min(records.length - 1, activeIdx + 1))}
            disabled={activeIdx >= records.length - 1}
            className="p-1.5 rounded-sm border border-[#a0b0a0] bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default transition-colors"
            aria-label="Temporada anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide justify-center">
            {records.map((r, i) => (
              <button
                key={r.year}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase transition-all border ${i === activeIdx ? 'bg-[#3a4a3a] text-white border-[#3a4a3a] shadow-sm' : 'bg-white text-slate-600 border-[#a0b0a0] hover:bg-slate-100'}`}
              >
                {r.year}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
            disabled={activeIdx <= 0}
            className="p-1.5 rounded-sm border border-[#a0b0a0] bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-default transition-colors"
            aria-label="Temporada siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mb-4 bg-[#e8ece8] border border-[#a0b0a0] rounded-sm p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <Trophy size={16} className="text-amber-700 shrink-0" />
          <div className="text-[10px] font-bold text-slate-700">
            <span className="font-black text-slate-900 uppercase">Temporada {active.year}</span>
            <span className="mx-2 text-slate-400">·</span>
            <span>Dirigida por <b>{active.userManagerName}</b></span>
            {active.userClubName && <span className="mx-2 text-slate-400">·</span>}
            {active.userClubName && <span>{active.userClubName}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {active.competitions.map(comp => (
            <FMBox key={comp.compId} title={comp.compName}>
              <div className="flex items-center justify-between px-1 pb-2 border-b border-[#d4ddd4] mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-amber-600" />
                  <span className="text-[11px] font-black uppercase text-slate-900">{comp.championName}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-[9px] font-bold text-slate-600">
                <div className="flex items-center gap-2 px-1">
                  <Goal size={11} className="text-green-700 shrink-0" />
                  <span className="uppercase tracking-wide text-slate-400 w-16 shrink-0">Goleador</span>
                  <span className="truncate">{comp.topScorer.name} <span className="text-slate-400">({comp.topScorer.value})</span></span>
                </div>
                <div className="flex items-center gap-2 px-1">
                  <Zap size={11} className="text-blue-700 shrink-0" />
                  <span className="uppercase tracking-wide text-slate-400 w-16 shrink-0">Asistente</span>
                  <span className="truncate">{comp.topAssists.name} <span className="text-slate-400">({comp.topAssists.value})</span></span>
                </div>
              </div>
            </FMBox>
          ))}
          {active.competitions.length === 0 && (
            <div className="md:col-span-2 text-center py-10 text-slate-400 italic text-[10px] uppercase font-bold">
              Sin competiciones finalizadas registradas
            </div>
          )}
        </div>

        {/* Tablas finales de ligas */}
        {active.finalTables && Object.keys(active.finalTables).length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-amber-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Tablas finales de ligas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(active.finalTables).map(([compId, rows]) => {
                const comp = world.competitions.find(c => c.id === compId);
                const typedRows = (rows || []) as { clubName: string; points: number }[];
                return (
                  <FMBox key={compId} title={`${comp?.name || compId} · Top 6`} noPadding>
                    <FMTable headers={['Pos', 'Club', 'Pts']} colWidths={['35px', 'auto', '40px']}>
                      {typedRows.map((row, i) => (
                        <tr key={`${compId}-${i}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} ${i === 0 ? 'font-black' : ''}`}>
                          <FMTableCell className="text-center font-bold text-slate-500">{i + 1}</FMTableCell>
                          <FMTableCell className="truncate font-bold">{row.clubName}</FMTableCell>
                          <FMTableCell className="text-center font-black text-slate-800" isNumber>{row.points}</FMTableCell>
                        </tr>
                      ))}
                    </FMTable>
                  </FMBox>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
