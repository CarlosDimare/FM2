import React from 'react';
import { Club, Fixture, PlayerMatchStats } from '../../types';
import { Mail, Globe, Trophy, User, ChevronRight } from 'lucide-react';
import { world } from '../../services/worldManager';
import { useGameStore } from '../../stores/gameStore';

interface HomeViewProps {
  userClub: Club;
  currentDate: Date;
  nextFixture: Fixture | null;
  fixtures: Fixture[];
  setView: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ userClub, currentDate, nextFixture, fixtures, setView }) => {
  const managerHistory = useGameStore(s => s.managerHistory);
  const managerReputation = useGameStore(s => s.managerReputation);

  return (
    <div className="p-4 space-y-4 overflow-y-auto pb-14">
      {/* ─── Home Header with themed background ─────────────────── */}
      <div className="relative rounded-xl overflow-hidden border border-amber-500/30">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #78350f 0%, #D97706 40%, #f59e0b 100%)' }} />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-200/70">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <h1 className="text-xl font-black uppercase tracking-wide text-white mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{userClub?.name || 'Inicio'}</h1>
            </div>
            <span className="text-3xl">🏠</span>
          </div>
          {/* Quick alerts */}
          {world.inbox && world.inbox.filter(m => !m.isRead).length > 0 && (
            <div className="flex items-center gap-2 bg-white/10/10 rounded-lg px-3 py-2">
              <Mail size={14} className="text-amber-300" />
              <span className="text-[10px] font-bold text-amber-100">{world.inbox.filter(m => !m.isRead).length} notificaciones sin leer</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div id="home-next-match" className="lg:col-span-2 bg-white/10/10 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white"><Globe size={120} /></div>
          <h3 className="text-white/80 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-white/10 pb-1">Próximo Encuentro</h3>
          {nextFixture ? (
            <div className="flex items-center justify-center gap-8 py-4 relative z-10">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center text-white font-black text-xl ${userClub.primaryColor} ${userClub.primaryColor === 'bg-white' ? 'text-white border border-white/15' : 'text-white'}`}>{userClub.shortName}</div>
                <p className="font-black text-white text-xs">{userClub.name}</p>
              </div>
              <div className="text-4xl font-black text-white/40 italic">VS</div>
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center font-black text-xl ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor} ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor === 'bg-white' ? 'text-white border border-white/15' : 'text-white'}`}>
                  {world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.shortName}
                </div>
                <p className="font-black text-white text-xs">{world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.name}</p>
              </div>
            </div>
          ) : <p className="text-center text-white/50 italic py-10">No hay partidos próximos.</p>}
          <div className="mt-4 text-center text-white/60 font-mono text-[10px] uppercase tracking-widest">{nextFixture?.date.toLocaleDateString()}</div>
        </div>
        <div className="bg-white/10/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-sm flex flex-col">
          <h3 className="text-white/80 font-black uppercase text-[11px] tracking-wider mb-2 border-b border-white/10 pb-1 flex items-center gap-2"><Trophy size={14} /> Competiciones</h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {world.competitions.filter(c => {
              if (c.id === userClub.leagueId) return true;
              if (c.type !== 'LEAGUE') return fixtures.some(f => f.competitionId === c.id && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id));
              return false;
            }).map(comp => {
              let statusText = "";
              if (comp.type === 'LEAGUE') {
                const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
                const rank = table.findIndex(e => e.clubId === userClub.id) + 1;
                statusText = rank > 0 ? `${rank}º Clasificado` : '-';
              } else statusText = "En curso";
              return (
                <div key={comp.id} className="flex justify-between items-center p-2 bg-white/10/5 rounded-lg border-l-4 border-white/20">
                  <span className="text-[10px] font-black text-white/70 uppercase truncate max-w-[100px]">{comp.name}</span>
                  <span className="text-[10px] font-bold text-white/90 uppercase">{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {managerHistory.totalGames > 0 && (
        <div className="bg-white/10/10 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm">
          <h3 className="text-white/80 font-black uppercase text-[10px] tracking-wider mb-2 border-b border-white/10 pb-1 flex items-center gap-1.5">
            <User size={12} /> Mi Historíal · Reputación: {managerReputation}/100 · {managerReputation >= 90 ? 'Leyenda' : managerReputation >= 75 ? 'Estrella' : managerReputation >= 60 ? 'Respetado' : managerReputation >= 40 ? 'Promedio' : managerReputation >= 25 ? 'Novato' : 'Desconocido'}
          </h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase text-white/60">
            <span>PJ: {managerHistory.totalGames}</span>
            <span className="text-green-400">G: {managerHistory.totalWins}</span>
            <span className="text-white/50">E: {managerHistory.totalDraws}</span>
            <span className="text-red-400">P: {managerHistory.totalLosses}</span>
            <span>GF: {managerHistory.goalsFor}</span>
            <span>GC: {managerHistory.goalsAgainst}</span>
            {managerHistory.currentStreak && (
              <span className={`${managerHistory.currentStreak === 'W' ? 'text-green-600' : managerHistory.currentStreak === 'L' ? 'text-red-600' : 'text-white/50'}`}>
                {managerHistory.currentStreak === 'W' ? 'Racha: ' : managerHistory.currentStreak === 'L' ? 'Racha: ' : 'Racha: '}{managerHistory.streakCount}
              </span>
            )}
            {managerHistory.titles.length > 0 && (
              <span className="text-yellow-400">Títulos: {managerHistory.titles.length}</span>
            )}
          </div>
        </div>
      )}

      <div id="header-inbox" className="bg-white/10/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-sm">
        <h3 className="text-white/80 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-white/10 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2"><Mail size={14} /> Últimas Noticias</div>
          <button onClick={() => setView('INBOX')} className="text-[9px] text-amber-300 hover:underline flex items-center">Ver todo <ChevronRight size={10} /> </button>
        </h3>
        <div className="space-y-2">
          {world.inbox.slice(0, 3).map((msg) => (
            <div key={msg.id} className="p-3 bg-white/10/5 border-l-4 border-white/20 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setView('INBOX')}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${msg.category === 'MARKET' ? 'bg-blue-600' : msg.category === 'SQUAD' ? 'bg-green-600' : 'bg-slate-600'}`}>{msg.category}</span>
                <span className="text-[9px] text-white/50 font-mono">{msg.date.toLocaleDateString()}</span>
              </div>
              <h4 className="text-xs font-black text-white/90 uppercase truncate">{msg.subject}</h4>
              <p className="text-[10px] text-white/50 truncate italic">{msg.body}</p>
            </div>
          ))}
          {world.inbox.length === 0 && <p className="text-center text-white/30 italic text-xs py-4">No hay noticias recientes.</p>}
        </div>
      </div>
    </div>
  );
};
