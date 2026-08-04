import React from 'react';
import { Club, Player } from '../../types';
import { world } from '../../services/worldManager';
import { SquadView } from '../SquadView';
import { ArrowLeft } from 'lucide-react';

interface ExternalClubViewProps {
  viewExternalClub: Club;
  currentDate: Date;
  onSelectPlayer: (player: Player | null) => void;
  onBack: () => void;
}

export const ExternalClubView: React.FC<ExternalClubViewProps> = ({
  viewExternalClub,
  currentDate,
  onSelectPlayer,
  onBack,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-white/10/10 border-b border-white/10 flex justify-between items-center shadow-sm">
        <h3 className="font-black uppercase text-white/90 text-xs flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${viewExternalClub.primaryColor} border flex items-center justify-center text-[8px] text-white shadow-sm`}>
            {viewExternalClub.shortName.substring(0, 2)}
          </div>
          {viewExternalClub.name} - PLANTILLA
        </h3>          <button onClick={onBack} className="text-[10px] font-bold uppercase bg-white/10/10 border border-white/10 px-3 py-1 rounded-lg hover:bg-white/20 flex items-center gap-1 shadow-sm text-white/80">
          <ArrowLeft size={10} /> Volver
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <SquadView
          players={world.getPlayersByClub(viewExternalClub.id).filter((p: any) => p.squad === 'SENIOR')}
          onSelectPlayer={onSelectPlayer}
          customTitle={`PLANTILLA - ${viewExternalClub.name}`}
          currentDate={currentDate}
          club={viewExternalClub}
        />
      </div>
    </div>
  );
};
