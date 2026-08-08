import React, { useEffect } from 'react';
import { Club, Player, PlayerMatchStats, Chronicle } from '../types';
import { world } from '../services/worldManager';
import { FMButton } from './FMUI';
import { Trophy, Star, Target, Shield, AlertTriangle, ChevronRight } from 'lucide-react';
import { detectManagerInitiatedTriggers } from '../services/playerDialogueTriggers';

interface PostMatchSummaryViewProps {
  homeTeam: Club;
  awayTeam: Club;
  homeScore: number;
  awayScore: number;
  stats: Record<string, PlayerMatchStats>;
  chronicle: Chronicle | null;
  userClubId: string;
  onContinue: () => void;
}

export const PostMatchSummaryView: React.FC<PostMatchSummaryViewProps> = ({
  homeTeam, awayTeam, homeScore, awayScore, stats, chronicle, userClubId, onContinue,
}) => {
  useEffect(() => {
    detectManagerInitiatedTriggers(userClubId, 'POST_MATCH');
  }, [userClubId]);

  // Get all players who participated
  const allPlayerIds = Object.keys(stats);
  const allPlayers = allPlayerIds.map(id => world.getPlayer(id)).filter(Boolean) as Player[];

  // Home and away players
  const homePlayers = allPlayers.filter(p => p.clubId === homeTeam.id);
  const awayPlayers = allPlayers.filter(p => p.clubId === awayTeam.id);

  // Scorers
  const scorers = Object.entries(stats)
    .filter(([_, s]) => (s as PlayerMatchStats).goals && (s as PlayerMatchStats).goals > 0)
    .map(([pid, s]) => ({ player: world.getPlayer(pid), goals: (s as PlayerMatchStats).goals }))
    .filter(e => e.player) as { player: Player; goals: number }[];

  // Man of the Match (highest rated)
  const MOTM = [...allPlayers]
    .sort((a, b) => (stats[b.id]?.rating || 0) - (stats[a.id]?.rating || 0))[0];

  // Cards
  const yellows = Object.entries(stats)
    .filter(([_, s]) => (s as PlayerMatchStats).card === 'YELLOW')
    .map(([pid]) => world.getPlayer(pid))
    .filter(Boolean) as Player[];

  const reds = Object.entries(stats)
    .filter(([_, s]) => (s as PlayerMatchStats).card === 'RED')
    .map(([pid]) => world.getPlayer(pid))
    .filter(Boolean) as Player[];

  // Assists
  const assists = Object.entries(stats)
    .filter(([_, s]) => (s as PlayerMatchStats).assists && (s as PlayerMatchStats).assists > 0)
    .map(([pid, s]) => ({ player: world.getPlayer(pid), assists: (s as PlayerMatchStats).assists }))
    .filter(e => e.player) as { player: Player; assists: number }[];

  // Stats
  const homeStats = homePlayers.reduce((acc, p) => {
    const s = stats[p.id];
    if (s) {
      acc.shots += s.shots || 0;
      acc.onTarget += s.shotsOnTarget || 0;
      acc.possession += s.possession || 0;
      acc.passes += s.passes || 0;
      acc.fouls += s.fouls || 0;
    }
    return acc;
  }, { shots: 0, onTarget: 0, possession: 0, passes: 0, fouls: 0 });

  const awayStats = awayPlayers.reduce((acc, p) => {
    const s = stats[p.id];
    if (s) {
      acc.shots += s.shots || 0;
      acc.onTarget += s.shotsOnTarget || 0;
      acc.possession += s.possession || 0;
      acc.passes += s.passes || 0;
      acc.fouls += s.fouls || 0;
    }
    return acc;
  }, { shots: 0, onTarget: 0, possession: 0, passes: 0, fouls: 0 });

  const isUserHome = homeTeam.id === userClubId;
  const userResult = isUserHome
    ? (homeScore > awayScore ? 'win' : homeScore < awayScore ? 'loss' : 'draw')
    : (awayScore > homeScore ? 'win' : awayScore < homeScore ? 'loss' : 'draw');

  const resultColor = userResult === 'win' ? 'text-green-700' : userResult === 'loss' ? 'text-red-700' : 'text-slate-600';
  const resultText = userResult === 'win' ? '¡Victoria!' : userResult === 'loss' ? 'Derrota' : 'Empate';

  return (
    <div className="h-full flex flex-col bg-[#d4dcd4] overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="flex-1 overflow-y-auto custom-scroll pb-32 md:pb-0">
        <div className="max-w-4xl mx-auto md:my-8 bg-white md:rounded-sm border-x md:border border-[#a0b0a0] shadow-2xl overflow-hidden">

          {/* Score Header */}
          <div className="bg-[#3a4a3a] p-6 sm:p-8 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Resultado Final</p>
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-black text-xl sm:text-2xl ${homeTeam.primaryColor}`}>{homeTeam.shortName}</div>
                <p className="font-black text-white text-xs uppercase">{homeTeam.name}</p>
              </div>
              <div className="text-center">
                <p className="text-5xl sm:text-7xl font-black text-white tracking-tighter">{homeScore} - {awayScore}</p>
                <p className={`text-sm font-black uppercase mt-2 ${resultColor}`}>{resultText}</p>
              </div>
              <div className="text-center">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-black text-xl sm:text-2xl ${awayTeam.primaryColor}`}>{awayTeam.shortName}</div>
                <p className="font-black text-white text-xs uppercase">{awayTeam.name}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-8 space-y-6">

            {/* Scorers */}
            {scorers.length > 0 && (
              <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target size={14} /> Goles
                </h3>
                <div className="space-y-1">
                  {scorers.map(({ player, goals }, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#a0b0a0]/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚽</span>
                        <span className="font-black text-slate-900 text-xs">{player.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{goals} {goals > 1 ? 'goles' : 'gol'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assists */}
            {assists.length > 0 && (
              <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ChevronRight size={14} /> Asistencias
                </h3>
                <div className="space-y-1">
                  {assists.map(({ player, assists: a }, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#a0b0a0]/30 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{player.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{a} {a > 1 ? 'asistencias' : 'asistencia'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Man of the Match */}
            {MOTM && (
              <div className="bg-[#3a4a3a] border border-[#2a3a2a] rounded-sm p-4 text-center">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                  <Star size={14} className="text-yellow-400" fill="currentColor" /> Hombre del Partido
                </h3>
                <p className="text-lg font-black text-white uppercase">{MOTM.name}</p>
                <p className="text-[10px] text-slate-300 font-bold">
                  Nota: {stats[MOTM.id]?.rating?.toFixed(1) || '-'} · 
                  {stats[MOTM.id]?.goals ? ` ${stats[MOTM.id]?.goals} gol${(stats[MOTM.id]?.goals || 0) > 1 ? 'es' : ''}` : ''}
                  {stats[MOTM.id]?.assists ? ` ${stats[MOTM.id]?.assists} asistencia${(stats[MOTM.id]?.assists || 0) > 1 ? 's' : ''}` : ''}
                </p>
              </div>
            )}

            {/* Match Stats */}
            <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={14} /> Estadísticas del Partido
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Tiros', home: homeStats.shots, away: awayStats.shots },
                  { label: 'Tiros al arco', home: homeStats.onTarget, away: awayStats.onTarget },
                  { label: 'Pases', home: homeStats.passes, away: awayStats.passes },
                  { label: 'Faltas', home: homeStats.fouls, away: awayStats.fouls },
                ].map((stat, i) => {
                  const total = (stat.home || 0) + (stat.away || 0);
                  const homePct = total > 0 ? ((stat.home || 0) / total) * 100 : 50;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-black text-slate-600 mb-1">
                        <span>{stat.home || 0}</span>
                        <span className="uppercase">{stat.label}</span>
                        <span>{stat.away || 0}</span>
                      </div>
                      <div className="flex h-2 rounded-sm overflow-hidden bg-slate-300">
                        <div className="bg-[#3a4a3a] transition-all" style={{ width: `${homePct}%` }} />
                        <div className="bg-slate-500 transition-all" style={{ width: `${100 - homePct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cards */}
            {(yellows.length > 0 || reds.length > 0) && (
              <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Tarjetas
                </h3>
                <div className="space-y-1">
                  {yellows.map((p, i) => (
                    <div key={`y-${i}`} className="flex items-center gap-2 py-1">
                      <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
                      <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{p.clubId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName}</span>
                    </div>
                  ))}
                  {reds.map((p, i) => (
                    <div key={`r-${i}`} className="flex items-center gap-2 py-1">
                      <div className="w-3 h-4 bg-red-600 rounded-sm" />
                      <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{p.clubId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chronicle */}
            {chronicle && (
              <div className="bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm p-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  📰 Crónica del Partido
                </h3>
                <p className="text-xs font-black text-slate-900 mb-2 italic">{chronicle.title}</p>
                <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {chronicle.body}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="pt-4">
              <FMButton onClick={onContinue} className="w-full py-4">
                Continuar <ChevronRight size={14} />
              </FMButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
