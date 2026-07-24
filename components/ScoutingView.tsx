
import React, { useState, useMemo } from 'react';
import { Player, ScoutingReport } from '../types';
import { world } from '../services/worldManager';
import { notifyAll } from '../stores/worldStore';
import { FMBox, FMButton } from './FMUI';
import { Binoculars, User, Star, TrendingUp, ArrowDown, Eye, Crosshair } from 'lucide-react';

interface ScoutingViewProps {
  clubId: string;
  onSelectPlayer: (player: Player) => void;
}

const ATTRIBUTE_TRANSLATIONS: Record<string, string> = {
  finishing: "Remate", passing: "Pase", tackling: "Entrada", dribbling: "Regate",
  marking: "Marcaje", heading: "Cabeceo", technique: "Técnica", firstTouch: "Primer toque",
  crossing: "Centro", longShots: "Tiro lejano", vision: "Visión", decisions: "Decisiones",
  composure: "Serenidad", determination: "Determinación", positioning: "Colocación",
  anticipation: "Anticipación", teamwork: "Trabajo equipo", workRate: "Sacrificio",
  leadership: "Liderazgo", bravery: "Valentía", aggression: "Agresividad",
  concentration: "Concentración", offTheBall: "Desmarque", flair: "Talento",
};

export const ScoutingView: React.FC<ScoutingViewProps> = ({ clubId, onSelectPlayer }) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const reports = useMemo(() => {
    const all = world.getScoutingReports(clubId, 100);
    return showUnreadOnly ? all.filter(r => !r.isRead) : all;
  }, [clubId, showUnreadOnly, world.scoutingReports.length]);

  const markRead = (reportId: string) => {
    const r = world.scoutingReports.find(sr => sr.id === reportId);
    if (r) { r.isRead = true; notifyAll(); }
  };

  const scoutPlayer = (playerId: string) => {
    world.generateScoutingReport(playerId, clubId, new Date(), clubId);
    notifyAll();
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
          <Binoculars size={22} /> Scouting
        </h2>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
          Informes de nuestros ojeadores. {reports.length} informes disponibles.
        </p>
      </header>

      <div className="flex gap-2 shrink-0">
        <FMButton
          variant={showUnreadOnly ? 'primary' : 'secondary'}
          onClick={() => setShowUnreadOnly(false)}
          className="flex-1 text-[10px]"
        >
          Todos ({world.getScoutingReports(clubId).length})
        </FMButton>
        <FMButton
          variant={showUnreadOnly ? 'secondary' : 'primary'}
          onClick={() => setShowUnreadOnly(true)}
          className="flex-1 text-[10px]"
        >
          No leídos ({world.getScoutingReports(clubId).filter(r => !r.isRead).length})
        </FMButton>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll space-y-2">
        {reports.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
            No hay informes de scouting. Los ojeadores generarán informes automáticamente con el paso del tiempo.
          </div>
        )}

        {reports.map(report => {
          const player = world.players.find(p => p.id === report.playerId);
          if (!player) return null;
          const club = world.getClub(player.clubId);

          return (
            <div key={report.id}
                 className={`border rounded-sm shadow-sm transition-colors ${report.isRead ? 'bg-white border-[#a0b0a0]' : 'bg-amber-50 border-amber-300'}`}
                 onClick={() => { markRead(report.id); onSelectPlayer(player); }}>
              <div className="p-3 flex items-start gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900 truncate">{player.name}</span>
                    {!report.isRead && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                  </div>
                  <div className="text-[9px] text-slate-500 font-bold">{player.positions[0]} · {player.age} años · {club?.name || 'Agente Libre'}</div>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px]">
                    <span className="flex items-center gap-1 font-black">
                      <Star size={12} className="text-amber-500" />
                      CA: {report.currentAbility}
                    </span>
                    <span className="flex items-center gap-1 font-black">
                      <TrendingUp size={12} className="text-green-600" />
                      PA: {report.potentialAbility}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-700 mt-1 italic">{report.summary}</div>
                  {report.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {report.strengths.map(s => (
                        <span key={s} className="text-[8px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-sm uppercase">
                          {ATTRIBUTE_TRANSLATIONS[s] || s}
                        </span>
                      ))}
                    </div>
                  )}
                  {report.weaknesses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {report.weaknesses.map(w => (
                        <span key={w} className="text-[8px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-sm uppercase">
                          {ATTRIBUTE_TRANSLATIONS[w] || w}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-[8px] text-slate-400 font-bold mt-1">
                    Personalidad: {report.personality} · {new Date(report.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0">
        <FMButton onClick={() => {
          const candidates = world.players.filter(p => p.clubId !== clubId && !world.scoutingReports.some(r => r.playerId === p.id && r.clubId === clubId));
          if (candidates.length > 0) {
            scoutPlayer(candidates[Math.floor(Math.random() * candidates.length)].id);
          }
        }} className="w-full text-[10px] flex items-center justify-center gap-2">
          <Crosshair size={14} /> Solicitar Informe Aleatorio
        </FMButton>
      </div>
    </div>
  );
};
