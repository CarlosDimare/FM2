import React from 'react';
import { RealManager, CareerMode } from '../../types';
import { world } from '../../services/worldManager';
import { getFlagUrl } from '../../data/static';
import { ChevronLeft, Flag } from 'lucide-react';

interface SetupNationalTeamViewProps {
  careerMode: CareerMode;
  selectedNationalTeamId: string | null;
  selectedExistingManager: RealManager | null;
  onSelectTeam: (teamId: string) => void;
  onBack: () => void;
}

export const SetupNationalTeamView: React.FC<SetupNationalTeamViewProps> = ({
  careerMode, selectedNationalTeamId, selectedExistingManager, onSelectTeam, onBack,
}) => {
  const nationalTeams = world.nationalTeamManager?.nationalTeams || [];

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-5xl w-full bg-white/10 rounded-sm p-4 sm:p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onBack} className="text-[10px] text-white/50 hover:text-white/90 font-bold mb-4 flex items-center gap-1"><ChevronLeft size={12} /> Volver al tipo de carrera</button>
        <div className="flex items-center justify-between gap-3 mb-5"><div><h1 className="text-2xl sm:text-4xl font-black text-white/90 uppercase italic tracking-tight">Elegir selección</h1><p className="text-[10px] text-white/50 uppercase tracking-widest">{careerMode === 'BOTH' ? 'Primero la selección, después el club' : 'Tu equipo nacional'}</p></div><Flag size={22} /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {nationalTeams.map((team: any) => {
            const eligible = world.nationalTeamManager?.getEligiblePlayers(team.id, world.players, world.clubs).length || 0;
            const selected = selectedNationalTeamId === team.id;
            return (
              <button key={team.id} onClick={() => onSelectTeam(team.id)} className={`p-4 text-left rounded-sm border transition-all ${selected ? 'border-[#3a4a3a] bg-[#e2eae2] border-l-4' : 'border-white/10 bg-white/10/5 hover:bg-[#e2eae2] hover:border-l-4 hover:border-l-[#3a4a3a]'}`}>
                <div className="flex items-center gap-2 mb-2"><img src={getFlagUrl(team.country)} alt={team.country} className="w-7 h-5 object-cover rounded-sm border border-white/10" /><span className="text-[9px] font-black text-white/40">{team.id}</span></div>
                <p className="font-black text-white/90 uppercase text-xs truncate">{team.name}</p>
                <p className="text-[9px] text-white/50 mt-1">{team.confederation} · {eligible} elegibles</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
