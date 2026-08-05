
import React, { useState, useMemo } from 'react';
import { Player, ScoutingReport } from '../types';
import { world } from '../services/worldManager';
import { notifyAll } from '../stores/worldStore';
import { FMBox, FMButton, FMEmptyState } from './FMUI';
import { Binoculars, User, Star, TrendingUp, ArrowDown, Eye, Crosshair, Search, BookmarkPlus, BookmarkCheck, ListPlus } from 'lucide-react';
import { getFlagUrl } from '../data/static';

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
  const [showShortlist, setShowShortlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const club = world.getClub(clubId);

  const reports = useMemo(() => {
    const all = world.getScoutingReports(clubId, 200);
    let filtered = showUnreadOnly ? all.filter(r => !r.isRead) : all;
    if (showShortlist && club) {
      const shortlisted = new Set(club.shortlistedPlayerIds);
      filtered = filtered.filter(r => shortlisted.has(r.playerId));
    }
    return filtered;
  }, [clubId, showUnreadOnly, showShortlist, world.scoutingReports.length, club?.shortlistedPlayerIds.length]);

  const shortlistedPlayers = useMemo(() => {
    if (!club) return [];
    return club.shortlistedPlayerIds.map(id => world.players.find(p => p.id === id)).filter(Boolean) as Player[];
  }, [club?.shortlistedPlayerIds]);

  const markRead = (reportId: string) => {
    const r = world.scoutingReports.find(sr => sr.id === reportId);
    if (r) { r.isRead = true; notifyAll(); }
  };

  const scoutPlayer = (playerId: string) => {
    world.generateScoutingReport(playerId, clubId, new Date(), clubId);
    notifyAll();
  };

  const toggleShortlist = (playerId: string) => {
    if (!club) return;
    const idx = club.shortlistedPlayerIds.indexOf(playerId);
    if (idx >= 0) club.shortlistedPlayerIds.splice(idx, 1);
    else club.shortlistedPlayerIds.push(playerId);
    notifyAll();
  };

  const isShortlisted = (playerId: string) => club?.shortlistedPlayerIds.includes(playerId);

  const handleSearch = () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const alreadyReported = new Set(world.scoutingReports.filter(r => r.clubId === clubId).map(r => r.playerId));
    const results = world.players.filter(p =>
      p.clubId !== clubId &&
      p.name.toLowerCase().includes(q) &&
      (p.age > 16)
    ).slice(0, 20);
    setSearchResults(results);
  };

  const renderReportCard = (report: ScoutingReport) => {
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
              <button onClick={(e) => { e.stopPropagation(); toggleShortlist(player.id); }}
                      className="ml-auto shrink-0" title={isShortlisted(player.id) ? "Quitar de seguimiento" : "Agregar a seguimiento"}>
                {isShortlisted(player.id) ? <BookmarkCheck size={14} className="text-blue-600" /> : <BookmarkPlus size={14} className="text-slate-400" />}
              </button>
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
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
          <Binoculars size={22} /> Scouting
        </h2>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
          {reports.length} informes · Presupuesto: ${(club?.finances.scoutingBudget || 0).toLocaleString()}
        </p>
      </header>

      <div className="flex gap-2 shrink-0">
        <FMButton variant={!showUnreadOnly && !showShortlist ? 'primary' : 'secondary'}
          onClick={() => { setShowUnreadOnly(false); setShowShortlist(false); }}
          className="flex-1 text-[10px]">
          Todos ({world.getScoutingReports(clubId).length})
        </FMButton>
        <FMButton variant={showUnreadOnly ? 'primary' : 'secondary'}
          onClick={() => { setShowUnreadOnly(true); setShowShortlist(false); }}
          className="flex-1 text-[10px]">
          No leídos ({world.getScoutingReports(clubId).filter(r => !r.isRead).length})
        </FMButton>
        <FMButton variant={showShortlist ? 'primary' : 'secondary'}
          onClick={() => { setShowShortlist(true); setShowUnreadOnly(false); }}
          className="flex-1 text-[10px]">
          <BookmarkCheck size={12} /> Seguimiento ({shortlistedPlayers.length})
        </FMButton>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 shrink-0">
        <div className="flex-1 flex items-center bg-white border border-slate-300 rounded-sm px-2">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar jugador para informe..."
            className="flex-1 py-2 px-2 text-xs font-bold text-slate-800 bg-transparent outline-none" />
        </div>
        <FMButton onClick={handleSearch} className="text-[10px] shrink-0"><Search size={14} /> Buscar</FMButton>
      </div>

      {searchResults.length > 0 && (
        <div className="shrink-0 max-h-40 overflow-y-auto bg-white border border-blue-300 rounded-sm shadow-lg">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 border-b border-slate-200">Resultados de búsqueda</div>
          {searchResults.map(p => {
            const hasReport = world.scoutingReports.some(r => r.playerId === p.id && r.clubId === clubId);
            return (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 border-b border-slate-100 last:border-0">
                <img src={getFlagUrl(p.nationality)} alt="" className="w-3 h-2 object-cover rounded-[1px]" />
                <span className="flex-1 text-[10px] font-bold truncate">{p.name}</span>
                <span className="text-[8px] text-slate-500">{p.positions[0]} · {p.age}a · {p.currentAbility}CA</span>
                {hasReport ? (
                  <span className="text-[8px] text-green-700 font-bold">✓ Informado</span>
                ) : (
                  <button onClick={() => scoutPlayer(p.id)}
                    className="text-[8px] bg-[#3a4a3a] text-white px-2 py-0.5 rounded-sm font-bold hover:bg-[#2a3a2a]">
                    Informe
                  </button>
                )}
                <button onClick={() => toggleShortlist(p.id)}
                  className="shrink-0" title={isShortlisted(p.id) ? "Quitar" : "Seguimiento"}>
                  {isShortlisted(p.id) ? <BookmarkCheck size={14} className="text-blue-600" /> : <BookmarkPlus size={14} className="text-slate-400" />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scroll space-y-2">
        {reports.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <FMEmptyState
              icon={<Binoculars size={28} />}
              title="Sin informes de scouting"
              subtitle="Los ojeadores generarán informes automáticamente con el paso del tiempo. Usa el buscador para pedir un informe de un jugador concreto."
            />
          </div>
        )}
        {reports.map(renderReportCard)}
      </div>

      <div className="shrink-0 space-y-2">
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
