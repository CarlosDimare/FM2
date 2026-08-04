
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

   const getRowClass = (index: number) => {
      if (currentLeagueId === 'L_ARG_1') {
         if (index < 5) return 'border-l-[3px] border-l-green-600'; // Libertadores
         if (index >= 5 && index < 10) return 'border-l-[3px] border-l-blue-600'; // Sudamericana
         if (entries.length > 2 && index >= entries.length - 2) return 'border-l-[3px] border-l-red-600'; // Relegation
      } else if (currentLeagueId === 'L_ARG_2') {
         if (index < 2) return 'border-l-[3px] border-l-green-600'; // Promotion
      }
      return 'border-l-[3px] border-l-transparent';
   };

   const getStatusLabel = (index: number) => {
      if (currentLeagueId === 'L_ARG_1') {
         if (index < 5) return <span className="text-[7px] bg-green-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">Lib</span>;
         if (index >= 5 && index < 10) return <span className="text-[7px] bg-blue-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">Sud</span>;
         if (entries.length > 2 && index >= entries.length - 2) return <span className="text-[7px] bg-red-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">Des</span>;
      } else if (currentLeagueId === 'L_ARG_2') {
         if (index < 2) return <span className="text-[7px] bg-green-600 text-white px-1 rounded-[1px] uppercase tracking-tighter">Asc</span>;
      }
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
                 <div className="flex bg-white/10/10 rounded-sm p-0.5 border border-white/10 shadow-sm">
                     {['SENIOR', 'RESERVE', 'U20'].map(t => (
                         <button key={t} onClick={() => onSquadTypeChange(t as any)} className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-[1px] ${currentSquadType === t ? 'bg-white/25 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}>{t}</button>
                     ))}
                 </div>
             )}
             {allLeagues && onLeagueChange && (
                 <div className="flex bg-white/10/10 rounded-sm p-0.5 border border-white/10 overflow-x-auto scrollbar-hide shadow-sm max-w-full">
                     {allLeagues.map(l => (
                         <button key={l.id} onClick={() => onLeagueChange(l.id)} className={`px-2 py-1 text-[9px] font-bold whitespace-nowrap transition-all rounded-[1px] uppercase ${currentLeagueId === l.id ? 'bg-white/25 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}>{l.name}</button>
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
                                     ${e.clubId === userClubId ? 'bg-blue-500/10' : i % 2 === 0 ? 'bg-white' : 'bg-white/5'}
                                     hover:bg-white/10
                                     ${getRowClass(i)}
                                 `}>
                                     <FMTableCell className="text-center font-bold text-white/50">
                                     <div className="flex items-center justify-center gap-1">
                                         {i + 1} {getStatusLabel(i)}
                                     </div>
                                     </FMTableCell>
                                     <FMTableCell className={`font-bold truncate max-w-[120px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.played}</FMTableCell>
                                     <FMTableCell className="text-center text-green-400" isNumber>{e.won}</FMTableCell>
                                     <FMTableCell className="text-center text-white/50" isNumber>{e.drawn}</FMTableCell>
                                     <FMTableCell className="text-center text-red-400" isNumber>{e.lost}</FMTableCell>
                                     <FMTableCell className="text-center font-black bg-white/10/10/50" isNumber>{e.points}</FMTableCell>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={7} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">No se han encontrado datos</td></tr>
                             )}
                         </FMTable>
                     </div>
                     <div className="hidden lg:block h-full">
                         <FMTable headers={headers} colWidths={colWidths}>
                             {entries.length > 0 ? entries.map((e, i) => (
                                 <tr key={e.clubId} className={`
                                     transition-colors
                                     ${e.clubId === userClubId ? 'bg-blue-500/10' : i % 2 === 0 ? 'bg-white' : 'bg-white/5'}
                                     hover:bg-white/10
                                     ${getRowClass(i)}
                                 `}>
                                     <FMTableCell className="text-center font-bold text-white/50">
                                     <div className="flex items-center justify-center gap-1">
                                         {i + 1} {getStatusLabel(i)}
                                     </div>
                                     </FMTableCell>
                                     <FMTableCell className={`font-bold truncate max-w-[120px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.played}</FMTableCell>
                                     <FMTableCell className="text-center text-green-400" isNumber>{e.won}</FMTableCell>
                                     <FMTableCell className="text-center text-white/50" isNumber>{e.drawn}</FMTableCell>
                                     <FMTableCell className="text-center text-red-400" isNumber>{e.lost}</FMTableCell>
                                     <FMTableCell className="text-center" isNumber>{e.gd}</FMTableCell>
                                     <FMTableCell className="text-center font-black bg-white/10/10/50" isNumber>{e.points}</FMTableCell>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={8} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">No se han encontrado datos</td></tr>
                             )}
                         </FMTable>
                     </div>
                    <div className="md:hidden h-full">
                        <FMTable headers={mobileHeaders} colWidths={mobileColWidths}>
                            {entries.length > 0 ? entries.map((e, i) => (
                                <tr key={e.clubId} className={`
                                    transition-colors
                                    ${e.clubId === userClubId ? 'bg-blue-500/10' : i % 2 === 0 ? 'bg-white' : 'bg-white/5'}
                                    hover:bg-white/10
                                    ${getRowClass(i)}
                                `}>
                                    <FMTableCell className="text-center font-bold text-white/50 text-[9px]">
                                        {i + 1}
                                    </FMTableCell>
                                    <FMTableCell className={`font-bold truncate text-[10px] ${e.clubId === userClubId ? 'text-blue-800' : 'text-[#1a1a1a]'}`}>{e.clubName}</FMTableCell>
                                    <FMTableCell className="text-center text-[10px]" isNumber>{e.played}</FMTableCell>
                                    <FMTableCell className="text-center font-black bg-white/10/10/50 text-[10px]" isNumber>{e.points}</FMTableCell>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">Sin datos</td></tr>
                            )}
                        </FMTable>
                    </div>
                 </FMBox>
             </div>

             <div className="h-full flex flex-col min-h-0">
                 <FMBox title="Estadísticas del Torneo" className="h-full flex flex-col overflow-hidden" noPadding>
                    <div className="flex bg-white/10/10 p-0.5 border-b border-white/10 shrink-0">
                       {([['SCORERS', 'Goleadores'], ['ASSISTS', 'Asistencias'], ['BEST_XI', 'Mejor XI']] as const).map(([key, label]) => (
                          <button key={key} onClick={() => setStatsTab(key)} className={`flex-1 px-2 py-1.5 text-[8px] font-black uppercase transition-all rounded-[1px] ${statsTab === key ? 'bg-white/25 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}>{label}</button>
                       ))}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                       {statsTab === 'SCORERS' && (
                          <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['35px', 'auto', '45px']}>
                             {topScorers.filter(p => getCompGoals(p) > 0).map((p, i) => (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-white/5'} hover:bg-white/10`}>
                                   <FMTableCell className="text-center text-white/40 font-bold">{i + 1}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[100px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-green-400" isNumber>{getCompGoals(p)}</FMTableCell>
                                </tr>
                             ))}
                             {topScorers.every(p => getCompGoals(p) === 0) && (
                                <tr><td colSpan={3} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">Sin goles registrados</td></tr>
                             )}
                          </FMTable>
                       )}
                       {statsTab === 'ASSISTS' && (
                          <FMTable headers={['#', 'Nombre', 'Asist.']} colWidths={['35px', 'auto', '45px']}>
                             {topAssisters.filter(p => getCompAssists(p) > 0).map((p, i) => (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-white/5'} hover:bg-white/10`}>
                                   <FMTableCell className="text-center text-white/40 font-bold">{i + 1}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[100px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-blue-700" isNumber>{getCompAssists(p)}</FMTableCell>
                                </tr>
                             ))}
                             {topAssisters.every(p => getCompAssists(p) === 0) && (
                                <tr><td colSpan={3} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">Sin asistencias registradas</td></tr>
                             )}
                          </FMTable>
                       )}
                       {statsTab === 'BEST_XI' && (
                          <FMTable headers={['Pos', 'Nombre', 'Club', 'Rating']} colWidths={['40px', 'auto', 'auto', '50px']}>
                             {bestXI.map((p, i) => {
                                const club = world.getClub(p.clubId);
                                return (
                                <tr key={p.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-white/5'} hover:bg-white/10`}>
                                   <FMTableCell className="text-center font-black text-[#3a4a3a]">{p.positions[0]}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[80px] font-bold">{p.name}</FMTableCell>
                                   <FMTableCell className="truncate max-w-[70px] text-[9px] text-white/50">{club?.shortName || '-'}</FMTableCell>
                                   <FMTableCell className="text-center font-black text-green-400" isNumber>{getCompRating(p).toFixed(2)}</FMTableCell>
                                </tr>
                                );
                             })}
                             {bestXI.length === 0 && (
                                <tr><td colSpan={4} className="p-4 text-center text-white/40 italic text-[10px] uppercase font-bold">Sin datos de rating</td></tr>
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
