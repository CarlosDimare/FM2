import React from 'react';
import { world } from '../../services/worldManager';
import { useGameStore } from '../../stores/gameStore';
import { getFlagUrl } from '../../data/static';
import { ChevronLeft } from 'lucide-react';

interface SetupLeagueViewProps {
  selectedCountry: string;
  onSelectLeague: (league: any) => void;
  onBack: () => void;
}

export const SetupLeagueView: React.FC<SetupLeagueViewProps> = ({ selectedCountry, onSelectLeague, onBack }) => {
  const leagues = world.competitions.filter(c => c.type === 'LEAGUE' && c.country === selectedCountry);

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-4xl w-full bg-white/10 rounded-sm p-4 sm:p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onBack} className="text-[10px] text-white/50 hover:text-white/90 font-bold mb-4 flex items-center gap-1">
          <ChevronLeft size={12} /> Volver a países
        </button>
        <div className="flex items-center gap-3 mb-6">
          {selectedCountry && <img src={getFlagUrl(selectedCountry)} alt={selectedCountry} className="w-8 h-6 rounded-sm border border-white/10" />}
          <h2 className="text-2xl font-black text-white/90 uppercase tracking-tight italic">{selectedCountry}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leagues.map(league => {
            const clubCount = world.getClubsByLeague(league.id).length;
            return (
              <button key={league.id} onClick={() => onSelectLeague(league)}
                className="p-5 bg-white/10/5 hover:bg-[#e2eae2] border border-white/10 rounded-sm text-left transition-all shadow-sm flex flex-col">
                <h3 className="text-base font-black text-white/90 mb-1 italic uppercase truncate">{league.name}</h3>
                <p className="text-[9px] text-white/50">{clubCount} equipo{clubCount !== 1 ? 's' : ''}</p>
              </button>
            );
          })}
        </div>
        {leagues.length === 0 && (
          <p className="text-sm text-white/50 text-center py-8">No hay ligas disponibles para este país.</p>
        )}
      </div>
    </div>
  );
};
