
import React, { useState, useMemo } from 'react';
import { TableEntry, Competition, SquadType, Player, Fixture, Position } from '../types';
import { world } from '../services/worldManager';
import { FMBox, FMButton, FMTable, FMTableCell } from './FMUI';

interface LeagueTableProps {
   entries: TableEntry[];
   userClubId: string;
   allLeagues?: Competition[];
   currentLeagueId?: string;
   onLeagueChange?: (id: string) => void;
   currentSquadType?: SquadType;
   onSquadTypeChange?: (squad: SquadType) => void;
   fixtures?: Fixture[];
}

export const LeagueTable: React.FC<LeagueTableProps> = ({ 
   entries, userClubId, allLeagues, currentLeagueId, onLeagueChange, currentSquadType = 'SENIOR', onSquadTypeChange
}) => {
   const [statsTab, setStatsTab] = useState<'SCORERS' | 'ASSISTS' | 'BEST_XI'>('SCORERS');
   
   const leaguePlayers = useMemo(() => {
      if (!currentLeagueId) return [];
      const participatingClubIds = new Set<string>();
      world.clubs.forEach(c => { if (c.leagueId === currentLeagueId) participatingClubIds.add(c.id); });
      const compPlayers = world.players.filter(p => {
         const club = world.getClub(p.clubId);
         return (club?.leagueId === currentLeagueId || participatingClubIds.has(p.clubId)) && p.squad === currentSquadType;
      });
      return compPlayers.length > 0 ? compPlayers : world.players.filter(p => p.squad === currentSquadType);
   }, [currentLeagueId, currentSquadType]);

   const getCompGoals = (p: Player) => {
      if (!currentLeagueId || !p.statsByCompetition[currentLeagueId]) return 0;
      return p.statsByCompetition[currentLeagueId].goals;
   };

    const topScorers = useMemo(() => {
       return [...leaguePlayers].sort((a, b) => getCompGoals(b) - getCompGoals(a)).slice(0, 20);
    }, [leaguePlayers, currentLeagueId]);

    const getCompAssists = (p: Player) => {
       if (!currentLeagueId || !p.statsByCompetition[currentLeagueId]) return 0;
       return p.statsByCompetition[currentLeagueId].assists;
    };

    const topAssisters = useMemo(() => {
       return [...leaguePlayers].sort((a, b) => getCompAssists(b) - getCompAssists(a)).slice(0, 20);
    }, [leaguePlayers, currentLeagueId]);

    const getCompRating = (p: Player) => {
       if (!currentLeagueId || !p.statsByCompetition[currentLeagueId]) return 0;
       const s = p.statsByCompetition[currentLeagueId];
       return s.appearances > 0 ? s.totalRating / s.appearances : 0;
    };

    const bestXI = useMemo(() => {
       const posMap: Record<string, Position[]> = {
          GK: [Position.GK],
          DF: [Position.DC, Position.DL, Position.DR, Position.SW],
          MF: [Position.DM, Position.MC, Position.ML, Position.MR, Position.AM, Position.AML, Position.AMR],
          FW: [Position.ST, Position.STR, Position.STL],
       };
       const best: Player[] = [];
       Object.entries(posMap).forEach(([, positions]) => {
          const eligible = leaguePlayers.filter(p => p.positions.some(pos => positions.includes(pos)) && getCompRating(p) > 0);
          if (eligible.length > 0) {
             const top = eligible.sort((a, b) => getCompRating(b) - getCompRating(a))[0];
             if (!best.find(bp => bp.id === top.id)) best.push(top);
          }
       });
       return best.sort((a, b) => {
          const order = [Position.GK, Position.DC, Position.DL, Position.DR, Position.DM, Position.MC, Position.ML, Position.MR, Position.AM, Position.AML, Position.AMR, Position.ST, Position.STR, Position.STL];
          return order.indexOf(a.positions[0]) - order.indexOf(b.positions[0]);
       }).slice(0, 11);
    }, [leaguePlayers, currentLeagueId]);

   // Zonas de la tabla dinámicas según la liga (confederación + tier), no hardcodeadas.
   const zoneConfig = useMemo(() => {
      const comp = world.competitions.find(c => c.id === currentLeagueId);
      const conf = comp?.confederation || '';
      const tier = comp?.tier || 1;
      const total = entries.length;
      const relegation = Math.max(2, Math.min(4, Math.round(total * 0.12)));
      if (tier === 2) {
         return { primary: 0, secondary: 0, relegation: 0, promotion: 2, primaryLabel: '', secondaryLabel: '', promotionLabel: 'Asc' };
      }
      if (conf === 'CONMEBOL') {
         return { primary: 5, secondary: 5, relegation, promotion: 0, primaryLabel: 'Lib', secondaryLabel: 'Sud' };
      }
      if (conf === 'UEFA') {
         return { primary: 4, secondary: 2, relegation, promotion: 0, primaryLabel: 'UCL', secondaryLabel: 'UEL' };
      }
      if (conf === 'AFC') {
         return { primary: 4, secondary: 0, relegation, promotion: 0, primaryLabel: 'AFC', secondaryLabel: '' };
      }
      if (conf === 'CAF') {
         return { primary: 3, secondary: 0, relegation, promotion: 0, primaryLabel: 'CAF', secondaryLabel: '' };
      }
      if (conf === 'CONCACAF') {
         return { primary: 4, secondary: 0, relegation, promotion: 0, primaryLabel: 'CCL', secondaryLabel: '' };
      }
      return { primary: 3, secondary: 0, relegation, promotion: 0, primaryLabel: 'Cont', secondaryLabel: '' };
   }, [currentLeagueId, entries.length]);

   const getRowClass = (index: number) => {
      const { primary, secondary, relegation, promotion } = zoneConfig;
      if (primary > 0 && index < primary) return 'border-l-[3px] border-l-green-600';
      if (secondary > 0 && index >= primary && index < primary + secondary) return 'border-l-[3px] border-l-blue-600';
      if (promotion > 0 && index < promotion) return 'border-l-[3px] border-l-green-600';
      if (relegation > 0 && entries.length > 2 && index >= entries.length - relegation) return 'border-l-[3px] border-l-red-600';
      return 'border-l-[3px] border-l-transparent';
   };

   const getStatusLabel = (index: number) => {
      const { primary, secondary, relegation, promotion, primaryLabel, secondaryLabel, promotionLabel } = zoneConfig;
      if (primary > 0 && index < primary && primaryLabel) return <span className="text-[7px] bg-green-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">{primaryLabel}</span>;
      if (secondary > 0 && index >= primary && index < primary + secondary && secondaryLabel) return <span className="text-[7px] bg-blue-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">{secondaryLabel}</span>;
      if (promotion > 0 && index < promotion && promotionLabel) return <span className="text-[7px] bg-green-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">{promotionLabel}</span>;
      if (relegation > 0 && entries.length > 2 && index >= entries.length - relegation) return <span className="text-[7px] bg-red-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">Des</span>;
      return null;
   };

    // Responsive logic
    const headers = ['Pos', 'Club', 'PJ', 'G', 'E', 'P', 'DG', 'Pts'];
    const colWidths = ['45px', 'auto', '30px', '30px', '30px', '30px', '30px', '45px'];
    const tabletHeaders = ['Pos', 'Club', 'PJ', 'G', 'E', 'P', 'Pts'];
    const tabletColWidths = ['40px', 'auto', '30px', '30px', '30px', '30px', '40px'];
    const mobileHeaders = ['Pos', 'Club', 'PJ', 'Pts'];
    const mobileColWidths = ['40px', 'auto', '30px', '40px'];

   return (
      <div className="flex flex-col h-full gap-3 p-0 overflow-hidden">
         {/* Controls */}
         <div className="flex flex-wrap gap-2 shrink-0">
             {onSquadTypeChange && (
                 <div className="flex bg-[#bcc8bc] rounded-sm p-0.5 border border-[#a0b0a0] shadow-sm">
                     {['SENIOR', 'RESERVE', 'U20'].map(t => (
                         <button key={t} onClick={() => onSquadTypeChange(t as any)} className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-[1px] ${currentSquadType === t ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}>{t}</button>
                     ))}
                 </div>
             )}
             {allLeagues && onLeagueChange && (
                 <div className="flex bg-[#bcc8bc] rounded-sm p-0.5 border border-[#a0b0a0] overflow-x-auto scrollbar-hide shadow-sm max-w-full">
                     {allLeagues.map(l => (
                         <button key={l.id} onClick={() => onLeagueChange(l.id)} className={`px-2 py-1 text-[9px] font-bold whitespace-nowrap transition-all rounded-[1px] uppercase ${currentLeagueId === l.id ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}>{l.name}</button>
                     ))}
                 </div>
             )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
             <div className="lg:col-span-2 h-full flex flex-col min-h-0">
                 <FMBox title="Clasificación de Liga" className="h-full flex flex-col overflow-hidden" noPadding>
                     <div className="hidden md:block lg:hidden h-full">
                         <FMTable headers={tabletHeaders} colWidths={tabletColWidths}>
                             {entries.length > 0 ? entries.map((e, i) => (
                                 <tr key={e.clubId} className={`
                                     transition-colors
                                     ${e.clubId === userClubId ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                                     hover:bg-[#ccd9cc]
                                     ${getRowClass(i)}
                                 `}>
                                     <FMTableCell className="text-center font-bold text-slate-500">
                                     <div className="flex items-center justify-center gap-1">
                                         {i + 1} {getStatusLabel(i)}
                                     </div>
                                     </FMTableCell>
                                     <FMTableCell className={`font-bold truncate max-w-[120px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.played}</FMTableCell>
                                     <FMTableCell className="text-center text-green-700" isNumber>{e.won}</FMTableCell>
                                     <FMTableCell className="text-center text-slate-500" isNumber>{e.drawn}</FMTableCell>
                                     <FMTableCell className="text-center text-red-700" isNumber>{e.lost}</FMTableCell>
                                     <FMTableCell className="text-center font-black bg-slate-100/50" isNumber>{e.points}</FMTableCell>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={7} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">No se han encontrado datos</td></tr>
                             )}
                         </FMTable>
                     </div>
                     <div className="hidden lg:block h-full">
                         <FMTable headers={headers} colWidths={colWidths}>
                             {entries.length > 0 ? entries.map((e, i) => (
                                 <tr key={e.clubId} className={`
                                     transition-colors
                                     ${e.clubId === userClubId ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                                     hover:bg-[#ccd9cc]
                                     ${getRowClass(i)}
                                 `}>
                                     <FMTableCell className="text-center font-bold text-slate-500">
                                     <div className="flex items-center justify-center gap-1">
                                         {i + 1} {getStatusLabel(i)}
                                     </div>
                                     </FMTableCell>
                                     <FMTableCell className={`font-bold truncate max-w-[120px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.played}</FMTableCell>
                                     <FMTableCell className="text-center text-green-700" isNumber>{e.won}</FMTableCell>
                                     <FMTableCell className="text-center text-slate-500" isNumber>{e.drawn}</FMTableCell>
                                     <FMTableCell className="text-center text-red-700" isNumber>{e.lost}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.gd}</FMTableCell>
                                     <FMTableCell className="text-center font-black bg-slate-100/50" isNumber>{e.points}</FMTableCell>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={8} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">No se han encontrado datos</td></tr>
                             )}
                         </FMTable>
                     </div>
                    <div className="md:hidden h-full">
                        <FMTable headers={mobileHeaders} colWidths={mobileColWidths}>
                            {entries.length > 0 ? entries.map((e, i) => (
                                <tr key={e.clubId} className={`
                                    transition-colors
                                    ${e.clubId === userClubId ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                                    hover:bg-[#ccd9cc]
                                    ${getRowClass(i)}
                                `}>
                                    <FMTableCell className="text-center font-bold text-slate-500 text-[9px]">
                                        {i + 1}
                                    </FMTableCell>
                                    <FMTableCell className={`font-bold truncate text-[10px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                    <FMTableCell className="text-center text-[10px]" isNumber>{e.played}</FMTableCell>
                                    <FMTableCell className="text-center font-black bg-slate-100/50 text-[10px]" isNumber>{e.points}</FMTableCell>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>
                            )}
                        </FMTable>
                    </div>
                 </FMBox>
             </div>

             <div className="h-full flex flex-col min-h-0">
                 <FMBox title="Estadísticas del Torneo" className="h-full flex flex-col overflow-hidden" noPadding>
                    <div className="flex bg-[#bcc8bc] p-0.5 border-b border-[#a0b0a0] shrink-0">
                       {([['SCORERS', 'Goleadores'], ['ASSISTS', 'Asistencias'], ['BEST_XI', 'Mejor XI']] as const).map(([key, label]) => (
                          <button key={key} onClick={() => setStatsTab(key)} className={`flex-1 px-2 py-1.5 text-[8px] font-black uppercase transition-all rounded-[1px] ${statsTab === key ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}>{label}</button>
                       ))}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                       {statsTab === 'SCORERS' && (
                          <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['35px', 'auto', '45px']}>
                             {topScorers.filter(p => getCompGoals(p) > 0).map((p, i) => (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc]`}>
                                   <FMTableCell className="text-center text-slate-400 font-bold">{i + 1}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[100px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-green-700" isNumber>{getCompGoals(p)}</FMTableCell>
                                </tr>
                             ))}
                             {topScorers.every(p => getCompGoals(p) === 0) && (
                                <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin goles registrados</td></tr>
                             )}
                          </FMTable>
                       )}
                       {statsTab === 'ASSISTS' && (
                          <FMTable headers={['#', 'Nombre', 'Asist.']} colWidths={['35px', 'auto', '45px']}>
                             {topAssisters.filter(p => getCompAssists(p) > 0).map((p, i) => (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc]`}>
                                   <FMTableCell className="text-center text-slate-400 font-bold">{i + 1}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[100px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-blue-700" isNumber>{getCompAssists(p)}</FMTableCell>
                                </tr>
                             ))}
                             {topAssisters.every(p => getCompAssists(p) === 0) && (
                                <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin asistencias registradas</td></tr>
                             )}
                          </FMTable>
                       )}
                       {statsTab === 'BEST_XI' && (
                          <FMTable headers={['Pos', 'Nombre', 'Club', 'Rating']} colWidths={['40px', 'auto', 'auto', '50px']}>
                             {bestXI.map((p, i) => {
                                const club = world.getClub(p.clubId);
                                return (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc]`}>
                                   <FMTableCell className="text-center font-black text-[#3a4a3a]">{p.positions[0]}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[80px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[70px] text-[9px] text-slate-500">{club?.shortName || '-'}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-green-700" isNumber>{getCompRating(p).toFixed(2)}</FMTableCell>
                                </tr>
                                );
                             })}
                             {bestXI.length === 0 && (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos de rating</td></tr>
                             )}
                          </FMTable>
                       )}
                    </div>
                 </FMBox>
             </div>
         </div>
      </div>
   );
}
