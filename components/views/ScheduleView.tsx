import React from 'react';
import { Club, Fixture, SquadType } from '../../types';
import { world } from '../../services/worldManager';

interface ScheduleViewProps {
  userClub: Club;
  squadType: SquadType;
  fixtures: Fixture[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ userClub, squadType, fixtures }) => {
  const squadFixtures = fixtures.filter(
    f => (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) && f.squadType === squadType
  );

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="text-xl font-black text-white mb-4 uppercase tracking-tighter border-b border-white/10 pb-2 italic">Calendario - {squadType}</h2>
      <div className="bg-white/10/10 backdrop-blur-md rounded-xl border border-white/10 overflow-y-auto shadow-md flex-1 p-2">
        {squadFixtures.map(f => {
          const home = world.getClub(f.homeTeamId);
          const away = world.getClub(f.awayTeamId);
          const isPenalty = f.penaltyHome !== undefined;
          const comp = world.competitions.find(c => c.id === f.competitionId);
          return (
            <div key={f.id} className="flex flex-col p-2 border-b border-white/10 hover:bg-white/5">
              <div className="flex items-center text-[11px]">
                <div className="w-20 text-white/50 font-mono font-bold">{f.date.toLocaleDateString()}</div>
                <div className="flex-1 text-right font-black text-white/90 pr-2 uppercase">{home?.name}</div>
                <div className={`w-20 text-center font-black bg-white/10/10 rounded px-1 border border-white/10 ${f.played ? 'text-white' : 'text-white/40'}`}>
                  {f.played ? (isPenalty ? `${f.homeScore}-${f.awayScore} (p)` : `${f.homeScore}-${f.awayScore}`) : 'v'}
                </div>
                <div className="flex-1 text-left font-black text-white/90 pl-2 uppercase">{away?.name}</div>
              </div>
              <div className="ml-20 text-[9px] font-black uppercase text-white/40 italic tracking-widest mt-1">{comp?.name || 'Amistoso'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
