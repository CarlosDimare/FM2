import React from 'react';
import { Club, Fixture } from '../../types';
import { world } from '../../services/worldManager';
import { getFlagUrl } from '../../data/static';
import { FMButton } from '../FMUI';
import { Flag } from 'lucide-react';

interface NationalHomeViewProps {
  selectedNationalTeamId: string;
  nextFixture: Fixture | null;
  setView: (view: string) => void;
}

export const NationalHomeView: React.FC<NationalHomeViewProps> = ({
  selectedNationalTeamId,
  nextFixture,
  setView,
}) => {
  const nationalTeam = world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId);
  const nationalFixture = nextFixture && (nextFixture.homeTeamId === selectedNationalTeamId || nextFixture.awayTeamId === selectedNationalTeamId) ? nextFixture : null;

  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white/10/10 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <img src={getFlagUrl(nationalTeam?.country || selectedNationalTeamId)} alt={nationalTeam?.name || selectedNationalTeamId} className="w-12 h-8 object-cover rounded-sm border border-white/10" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Cargo internacional activo</p>
            <h2 className="text-2xl font-black uppercase italic text-white">{nationalTeam?.name || selectedNationalTeamId}</h2>
            <p className="text-[10px] text-white/50">Convocatorias, once inicial y planteamiento táctico bajo tu responsabilidad.</p>
          </div>
        </div>
        <div className="bg-white/10/10 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-sm">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-4">Próximo compromiso</h3>
          {nationalFixture ? (
            <div className="flex items-center justify-between gap-3 text-sm font-black uppercase">
              <span className="text-white/80">{world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === nationalFixture.homeTeamId)?.name || nationalFixture.homeTeamId}</span>
              <span className="text-white/30">VS</span>
              <span className="text-white/80">{world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === nationalFixture.awayTeamId)?.name || nationalFixture.awayTeamId}</span>
            </div>
          ) : (
            <p className="text-xs text-white/30 italic">No hay un partido internacional próximo.</p>
          )}
          <FMButton onClick={() => setView(`NT_${selectedNationalTeamId}`)} className="mt-5"><Flag size={14} /> Gestionar selección</FMButton>
        </div>
      </div>
    </div>
  );
};
