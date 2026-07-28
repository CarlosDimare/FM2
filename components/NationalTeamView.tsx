import React, { useState, useMemo } from 'react';
import { Player, Fixture, Club } from '../types';
import { world } from '../services/worldManager';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';
import { Trophy, Users, Calendar, Star, ChevronRight, Flag, Shield } from 'lucide-react';

const NATIONAL_TEAM_NAMES: Record<string, string> = {
  'ARG': 'Argentina', 'BRA': 'Brazil', 'URU': 'Uruguay', 'COL': 'Colombia', 'CHL': 'Chile',
  'ECU': 'Ecuador', 'PAR': 'Paraguay', 'PER': 'Peru', 'BOL': 'Bolivia', 'VEN': 'Venezuela',
  'FRA': 'France', 'ESP': 'Spain', 'ENG': 'England', 'DEU': 'Germany', 'ITA': 'Italy',
  'NLD': 'Netherlands', 'BEL': 'Belgium', 'PRT': 'Portugal', 'HRV': 'Croatia', 'CHE': 'Switzerland',
  'AUT': 'Austria', 'DNK': 'Denmark', 'SWE': 'Sweden', 'NOR': 'Norway', 'POL': 'Poland',
  'UKR': 'Ukraine', 'SRB': 'Serbia', 'TUR': 'Turkey', 'RUS': 'Russia',
  'MEX': 'Mexico', 'USA': 'USA', 'CAN': 'Canada',
  'JPN': 'Japan', 'KOR': 'South Korea', 'AUS': 'Australia', 'SAU': 'Saudi Arabia',
  'MAR': 'Morocco', 'SEN': 'Senegal', 'NGA': 'Nigeria', 'EGY': 'Egypt', 'GHA': 'Ghana',
  'CMR': 'Cameroon', 'CIV': 'Ivory Coast', 'TUN': 'Tunisia',
};

const COUNTRY_FLAGS: Record<string, string> = {
  'ARG': 'ar', 'BRA': 'br', 'URU': 'uy', 'COL': 'co', 'CHL': 'cl',
  'ECU': 'ec', 'PAR': 'py', 'PER': 'pe', 'BOL': 'bo', 'VEN': 've',
  'FRA': 'fr', 'ESP': 'es', 'ENG': 'gb-eng', 'DEU': 'de', 'ITA': 'it',
  'NLD': 'nl', 'BEL': 'be', 'PRT': 'pt', 'HRV': 'hr', 'CHE': 'ch',
  'AUT': 'at', 'DNK': 'dk', 'SWE': 'se', 'NOR': 'no', 'POL': 'pl',
  'UKR': 'ua', 'SRB': 'rs', 'TUR': 'tr', 'RUS': 'ru',
  'MEX': 'mx', 'USA': 'us', 'CAN': 'ca',
  'JPN': 'jp', 'KOR': 'kr', 'AUS': 'au', 'SAU': 'sa',
  'MAR': 'ma', 'SEN': 'sn', 'NGA': 'ng', 'EGY': 'eg', 'GHA': 'gh',
  'CMR': 'cm', 'CIV': 'ci', 'TUN': 'tn',
};

const getFlagUrl = (teamId: string) => {
  const code = COUNTRY_FLAGS[teamId] || 'un';
  return `https://flagcdn.com/w40/${code}.png`;
};

interface NationalTeamViewProps {
  teamId: string;
}

export const NationalTeamView: React.FC<NationalTeamViewProps> = ({ teamId }) => {
  const [activeTab, setActiveTab] = useState<'SQUAD' | 'FIXTURES' | 'STATS'>('SQUAD');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const { setView, setSelectedPlayer } = useUIStore();
  const { fixtures } = useGameStore();

  const teamName = NATIONAL_TEAM_NAMES[teamId] || teamId;
  const flagUrl = getFlagUrl(teamId);

  // Get players for this national team
  const squadPlayers = useMemo(() => {
    if (!world.nationalTeamManager) return [];
    const team = world.nationalTeamManager.nationalTeams.find((t: any) => t.id === teamId);
    if (!team) return [];
    return team.playerIds
      .map((pid: string) => world.players.find(p => p.id === pid))
      .filter(Boolean)
      .sort((a: Player, b: Player) => {
        const aOverall = (a.stats.visible.fisico + a.stats.visible.mental + a.stats.visible.tecnica) / 3;
        const bOverall = (b.stats.visible.fisico + b.stats.visible.mental + b.stats.visible.tecnica) / 3;
        return bOverall - aOverall;
      });
  }, [teamId, world.players.length]);

  // Get fixtures for this national team
  const teamFixtures = useMemo(() => {
    return fixtures
      .filter(f => f.homeTeamId === teamId || f.awayTeamId === teamId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [fixtures, teamId]);

  // Filter by position
  const filteredPlayers = useMemo(() => {
    if (selectedPosition === 'ALL') return squadPlayers;
    const posMap: Record<string, string[]> = {
      'GK': ['P'],
      'DEF': ['DFC', 'LD', 'LI', 'LIB'],
      'MID': ['MC', 'MD', 'MI', 'MCD', 'MPC'],
      'ATT': ['DC', 'ED', 'EI', 'WD', 'WI'],
    };
    const positions = posMap[selectedPosition] || [];
    return squadPlayers.filter(p => positions.includes(p.primaryPosition));
  }, [squadPlayers, selectedPosition]);

  const getPositionLabel = (pos: string): string => {
    const labels: Record<string, string> = {
      'P': 'GK', 'DFC': 'DF', 'LD': 'DF', 'LI': 'DF', 'LIB': 'DF',
      'MC': 'MC', 'MD': 'MC', 'MI': 'MC', 'MCD': 'MC', 'MPC': 'MC',
      'DC': 'DL', 'ED': 'DL', 'EI': 'DL', 'WD': 'DL', 'WI': 'DL',
    };
    return labels[pos] || pos;
  };

  const getStatsByPosition = (pos: string) => {
    const players = squadPlayers.filter(p => getPositionLabel(p.primaryPosition) === pos);
    return players.length;
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 bg-[#e8ece8] border border-[#a0b0a0] p-3 rounded-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white border border-[#a0b0a0] rounded-sm flex items-center justify-center shadow-inner overflow-hidden">
            <img src={flagUrl} alt={teamName} className="w-10 h-7 object-cover" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>{teamName}</h2>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Selección Nacional • {squadPlayers.length} jugadores</p>
          </div>
        </div>

        <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] w-full md:w-auto shadow-sm">
          {[
            { id: 'SQUAD', icon: Users, label: 'Plantilla' },
            { id: 'FIXTURES', icon: Calendar, label: 'Partidos' },
            { id: 'STATS', icon: Star, label: 'Estad.' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:px-6 py-1.5 rounded-[1px] transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight ${activeTab === tab.id ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-[#1a2a1a] hover:bg-[#ccd9cc]'}`}
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'SQUAD' && (
          <div className="h-full flex flex-col gap-2">
            {/* Position Filter */}
            <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] overflow-x-auto scrollbar-hide shrink-0 shadow-sm">
              {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(pos => (
                <button 
                  key={pos}
                  onClick={() => setSelectedPosition(pos)}
                  className={`px-4 py-1.5 rounded-[1px] text-[9px] font-bold uppercase whitespace-nowrap transition-colors ${selectedPosition === pos ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                  style={{ fontFamily: 'Verdana, sans-serif' }}
                >
                  {pos === 'ALL' ? 'Todos' : pos} ({pos === 'ALL' ? squadPlayers.length : getStatsByPosition(pos)})
                </button>
              ))}
            </div>

            {/* Squad List */}
            <div className="flex-1 overflow-y-auto custom-scroll">
              <FMBox title="Convocatoria" className="h-full" noPadding>
                <table className="w-full border-collapse">
                  <thead className="bg-[#e8ece8] sticky top-0 z-10">
                    <tr className="text-[9px] font-bold uppercase text-slate-600 tracking-wider" style={{ fontFamily: 'Verdana, sans-serif' }}>
                      <th className="text-left px-3 py-2">#</th>
                      <th className="text-left px-3 py-2">Jugador</th>
                      <th className="text-center px-3 py-2">Pos</th>
                      <th className="text-center px-3 py-2 hidden md:table-cell">Edad</th>
                      <th className="text-center px-3 py-2 hidden md:table-cell">Club</th>
                      <th className="text-center px-3 py-2">OVR</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {filteredPlayers.map((player, idx) => {
                      const club = world.getClub(player.clubId);
                      const overall = Math.round((player.stats.visible.fisico + player.stats.visible.mental + player.stats.visible.tecnica) / 3);
                      
                      return (
                        <tr 
                          key={player.id} 
                          className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors cursor-pointer`}
                          onClick={() => { setSelectedPlayer(player); setView('PLAYER'); }}
                        >
                          <td className="px-3 py-2 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-bold truncate max-w-[150px]">{player.name}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase">{player.nationality}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-[1px] text-[8px] font-bold uppercase ${
                              getPositionLabel(player.primaryPosition) === 'GK' ? 'bg-yellow-200 text-yellow-900' :
                              getPositionLabel(player.primaryPosition) === 'DF' ? 'bg-blue-200 text-blue-900' :
                              getPositionLabel(player.primaryPosition) === 'MC' ? 'bg-green-200 text-green-900' :
                              'bg-red-200 text-red-900'
                            }`}>
                              {getPositionLabel(player.primaryPosition)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center hidden md:table-cell">{player.age}</td>
                          <td className="px-3 py-2 text-center hidden md:table-cell">
                            <span className="text-[9px] text-slate-600 font-bold">{club?.shortName || '-'}</span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-black ${overall >= 80 ? 'text-green-700' : overall >= 70 ? 'text-blue-700' : overall >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                              {overall}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic text-[10px] uppercase font-bold">No hay jugadores en esta posición</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </FMBox>
            </div>
          </div>
        )}

        {activeTab === 'FIXTURES' && (
          <FMBox title="Calendario de Partidos" className="h-full" noPadding>
            <div className="h-full overflow-y-auto custom-scroll bg-white">
              {teamFixtures.length === 0 ? (
                <div className="p-20 text-slate-400 text-center italic text-[10px] uppercase font-bold tracking-widest">No hay partidos programados</div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {teamFixtures.map((f, idx) => {
                      const homeName = NATIONAL_TEAM_NAMES[f.homeTeamId] || f.homeTeamId;
                      const awayName = NATIONAL_TEAM_NAMES[f.awayTeamId] || f.awayTeamId;
                      const isHome = f.homeTeamId === teamId;
                      const compName = world.competitions.find(c => c.id === f.competitionId)?.name || f.competitionId;
                      
                      return (
                        <tr key={f.id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                          <td className="px-3 py-3 text-slate-500 font-mono text-[10px] w-24">
                            <div className="flex flex-col">
                              <span>{f.date.toLocaleDateString()}</span>
                              <span className="text-[8px] text-slate-400 uppercase">{compName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className={`font-bold ${isHome ? 'text-blue-800' : ''}`}>{homeName}</span>
                          </td>
                          <td className="px-3 py-3 text-center w-16">
                            <div className="bg-[#bcc8bc] border border-[#a0b0a0] rounded-sm py-1 font-black text-[10px] shadow-inner text-[#1a1a1a]">
                              {f.played ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <span className={`font-bold ${!isHome ? 'text-blue-800' : ''}`}>{awayName}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </FMBox>
        )}

        {activeTab === 'STATS' && (
          <div className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3 custom-scroll">
            <FMBox title="Más Goles" noPadding>
              <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['30px', 'auto', '40px']}>
                {squadPlayers
                  .filter(p => p.goals > 0)
                  .sort((a, b) => b.goals - a.goals)
                  .slice(0, 10)
                  .map((p, i) => (
                    <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                      <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                      <FMTableCell>
                        <div className="flex flex-col">
                          <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                        </div>
                      </FMTableCell>
                      <FMTableCell className="text-center font-black text-green-700" isNumber>{p.goals}</FMTableCell>
                    </tr>
                  ))}
                {squadPlayers.filter(p => p.goals > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
              </FMTable>
            </FMBox>

            <FMBox title="Más Asistencias" noPadding>
              <FMTable headers={['#', 'Nombre', 'Asist']} colWidths={['30px', 'auto', '40px']}>
                {squadPlayers
                  .filter(p => p.assists > 0)
                  .sort((a, b) => b.assists - a.assists)
                  .slice(0, 10)
                  .map((p, i) => (
                    <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                      <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                      <FMTableCell>
                        <div className="flex flex-col">
                          <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                        </div>
                      </FMTableCell>
                      <FMTableCell className="text-center font-black text-blue-700" isNumber>{p.assists}</FMTableCell>
                    </tr>
                  ))}
                {squadPlayers.filter(p => p.assists > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
              </FMTable>
            </FMBox>

            <FMBox title="Mejor Valoración" noPadding>
              <FMTable headers={['#', 'Nombre', 'Media']} colWidths={['30px', 'auto', '40px']}>
                {squadPlayers
                  .filter(p => p.matchesPlayed > 0)
                  .sort((a, b) => (b.goals + b.assists) / b.matchesPlayed - (a.goals + a.assists) / a.matchesPlayed)
                  .slice(0, 10)
                  .map((p, i) => {
                    const avg = ((p.goals + p.assists) / p.matchesPlayed).toFixed(1);
                    return (
                      <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                        <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                        <FMTableCell>
                          <div className="flex flex-col">
                            <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                          </div>
                        </FMTableCell>
                        <FMTableCell className="text-center font-black text-amber-700" isNumber>{avg}</FMTableCell>
                      </tr>
                    );
                  })}
                {squadPlayers.filter(p => p.matchesPlayed > 0).length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
              </FMTable>
            </FMBox>
          </div>
        )}
      </div>
    </div>
  );
};
