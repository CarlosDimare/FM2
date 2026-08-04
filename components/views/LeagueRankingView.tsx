import React from 'react';
import { world } from '../../services/worldManager';

export const LeagueRankingView: React.FC = () => {
  const tierColors: Record<string, string> = {
    ELITE: 'bg-yellow-100 text-yellow-800',
    PRESTIGE: 'bg-white/10 text-white/70',
    DEVELOPING: 'bg-amber-100 text-amber-800',
    EMERGING: 'bg-white/10 text-white/60',
    LOCAL: 'bg-white/5 text-white/50',
  };

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-black text-white/90 uppercase italic mb-4">🌍 Ranking Mundial de Ligas</h2>
        <div className="bg-white/10/10 backdrop-blur-md border border-white/10 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-white/10/10 text-white/80">
              <tr>
                <th className="p-2 text-left w-8">#</th>
                <th className="p-2 text-left">Liga</th>
                <th className="p-2 text-left">País</th>
                <th className="p-2 text-center">Rep.</th>
                <th className="p-2 text-center">Tier</th>
                <th className="p-2 text-right">Prize Pool</th>
              </tr>
            </thead>
            <tbody>
              {world.competitions
                .filter(c => c.type === 'LEAGUE')
                .sort((a, b) => (b.dynamicReputation || 0) - (a.dynamicReputation || 0))
                .map((league, i) => {
                  const tier = world.getLeagueTier(league.dynamicReputation || 30);
                  return (
                    <tr key={league.id} className={`border-t border-white/10 ${i % 2 === 0 ? 'bg-white/5' : 'bg-white/10'} hover:bg-white/15`}>
                      <td className="p-2 font-black text-white/40">{i + 1}</td>
                      <td className="p-2 font-black text-white/90">{league.name}</td>
                      <td className="p-2 text-white/60">{league.country}</td>
                      <td className="p-2 text-center font-black">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] ${(league.dynamicReputation || 0) >= 80 ? 'bg-green-500/15 text-green-300' : (league.dynamicReputation || 0) >= 60 ? 'bg-blue-500/15 text-blue-800' : 'bg-white/10 text-white/70'}`}>
                          {league.dynamicReputation || '—'}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${tierColors[tier] || ''}`}>{tier}</span>
                      </td>
                      <td className="p-2 text-right text-white/60">${(league.defaultPrizePool || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
