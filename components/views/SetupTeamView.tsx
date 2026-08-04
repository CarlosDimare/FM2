import React from 'react';
import { Club, RealManager, CareerMode } from '../../types';
import { world } from '../../services/worldManager';
import { getFlagUrl } from '../../data/static';
import { ChevronLeft } from 'lucide-react';

interface SetupTeamViewProps {
  selectedLeague: any;
  selectedCountry: string;
  selectedExistingManager: RealManager | null;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  currentDate: Date;
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: string;
  userBirthDate: Date;
  onSelectClub: (club: Club) => void;
  onBack: () => void;
}

export const SetupTeamView: React.FC<SetupTeamViewProps> = ({
  selectedLeague, selectedCountry, selectedExistingManager,
  selectedNationalTeamId, careerMode, currentDate,
  userName, userSurname, userNationality, userOrigin, userBirthDate,
  onSelectClub, onBack,
}) => {
  const leagueClubs = world.getClubsByLeague(selectedLeague.id);
  const isExistingManager = !!selectedExistingManager;

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-6xl w-full bg-white/10 rounded-sm p-4 sm:p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onBack} className="text-[10px] text-white/50 hover:text-white/90 font-bold mb-4 flex items-center gap-1">
          <ChevronLeft size={12} /> Volver a ligas de {selectedCountry}
        </button>
        {isExistingManager && (
          <div className="mb-4 p-3 bg-white/10/5 border border-white/10 rounded-sm flex items-center gap-3">
            <img src={getFlagUrl(selectedExistingManager.nationality)} alt={selectedExistingManager.nationality} className="w-6 h-4 rounded-sm border border-white/10" />
            <div className="flex-1">
              <p className="text-[9px] text-white/50 uppercase font-bold tracking-widest">Manager</p>
              <p className="text-xs font-black text-white/90 uppercase">{selectedExistingManager.name} {selectedExistingManager.surname} <span className="text-white/50 font-bold ml-2">Rep: {selectedExistingManager.reputation}</span></p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 mb-6">
          {selectedCountry && <img src={getFlagUrl(selectedCountry)} alt={selectedCountry} className="w-8 h-6 rounded-sm border border-white/10" />}
          <h2 className="text-xl sm:text-2xl font-black text-white/90 uppercase tracking-tight italic">{selectedLeague.name}</h2>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {leagueClubs.map(c => (
              <button key={c.id} onClick={() => onSelectClub(c)} className="p-4 bg-white/10/5 hover:bg-[#e2eae2] border border-white/10 rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-[#3a4a3a]">
                <div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-white/10`}></div>
                <p className="font-black text-white/90 truncate text-[11px] uppercase group-hover:text-[#3a4a3a]">{c.name}</p>
                <p className="text-[9px] text-white/50 mt-1">Reputación: {Math.round(c.reputation / 10)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
