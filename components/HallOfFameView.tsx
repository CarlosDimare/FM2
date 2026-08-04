import React from 'react';
import { world } from '../services/worldManager';
import { FMBox } from './FMUI';
import { Trophy, Star, Medal } from 'lucide-react';

interface HallOfFameViewProps {
  onBack: () => void;
}

export const HallOfFameView: React.FC<HallOfFameViewProps> = ({ onBack }) => {
  const entries = world.hallOfFame;

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={24} className="text-yellow-400" />
          <h2 className="text-xl font-black text-white/90 uppercase italic">Salón de la Fama</h2>
          <span className="text-[9px] text-white/50 font-bold ml-auto">{entries.length} miembros</span>
        </div>
        <FMBox>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-xs italic">
              <Star size={48} className="mx-auto mb-3 opacity-30" />
              Aún no hay entrenadores en el Salón de la Fama. ¡Sé el primero en dejar tu huella!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="bg-white/10/10 text-white sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Entrenador</th>
                    <th className="p-2 text-left hidden sm:table-cell">Nac.</th>
                    <th className="p-2 text-center">PJ</th>
                    <th className="p-2 text-center">G</th>
                    <th className="p-2 text-center">%</th>
                    <th className="p-2 text-center hidden md:table-cell">Títulos</th>
                    <th className="p-2 text-left hidden lg:table-cell">Clubes</th>
                    <th className="p-2 text-center hidden sm:table-cell">Era</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={entry.id} className={`border-t border-white/10 ${i < 3 ? 'bg-amber-500/10' : i % 2 === 0 ? 'bg-white' : 'bg-white/5'} hover:bg-blue-500/10`}>
                      <td className="p-2 font-black">
                        {i === 0 ? <Medal size={14} className="text-yellow-500" /> : i === 1 ? <Medal size={14} className="text-white/40" /> : i === 2 ? <Medal size={14} className="text-amber-700" /> : <span className="text-white/40">{i + 1}</span>}
                      </td>
                      <td className="p-2 font-black text-white/90">{entry.managerName}</td>
                      <td className="p-2 text-white/60 hidden sm:table-cell">{entry.nationality}</td>
                      <td className="p-2 text-center font-bold">{entry.totalGames}</td>
                      <td className="p-2 text-center font-bold text-green-400">{entry.totalWins}</td>
                      <td className="p-2 text-center font-black">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${entry.winRate >= 70 ? 'bg-green-500/15 text-green-300' : entry.winRate >= 60 ? 'bg-blue-500/15 text-blue-800' : 'bg-white/10 text-white/70'}`}>
                          {entry.winRate}%
                        </span>
                      </td>
                      <td className="p-2 text-center hidden md:table-cell text-yellow-700 font-bold">{entry.titles.length}</td>
                      <td className="p-2 text-white/60 hidden lg:table-cell">{entry.clubsManaged.slice(0, 3).join(', ')}{entry.clubsManaged.length > 3 ? '...' : ''}</td>
                      <td className="p-2 text-center text-white/50 hidden sm:table-cell">{entry.yearInducted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FMBox>
      </div>
    </div>
  );
};
