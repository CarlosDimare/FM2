
import React from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerCompareModalProps {
  playerA: Player;
  playerB: Player;
  onClose: () => void;
}

const StatBar: React.FC<{ label: string; valA: number; valB: number; max?: number; higherBetter?: boolean }> = ({ label, valA, valB, max = 20, higherBetter = true }) => {
  const pctA = Math.min(100, (valA / max) * 100);
  const pctB = Math.min(100, (valB / max) * 100);
  const aWins = higherBetter ? valA > valB : valA < valB;
  const bWins = higherBetter ? valB > valA : valB > valA;
  const tie = valA === valB;

  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-[#a0b0a0]/30 last:border-0">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black w-20 ${aWins ? 'text-green-700' : 'text-slate-700'}`}>{valA}</span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex-1 text-center">{label}</span>
        <span className={`text-[10px] font-black w-20 text-right ${bWins ? 'text-green-700' : 'text-slate-700'}`}>{valB}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className="flex-1 bg-slate-200 rounded-full overflow-hidden flex justify-end">
          <div className={`h-full rounded-full transition-all ${aWins ? 'bg-green-600' : tie ? 'bg-slate-400' : 'bg-slate-300'}`} style={{ width: `${pctA}%` }} />
        </div>
        <div className="flex-1 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${bWins ? 'bg-green-600' : tie ? 'bg-slate-400' : 'bg-slate-300'}`} style={{ width: `${pctB}%` }} />
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; valA: string; valB: string; highlight?: boolean }> = ({ label, valA, valB, highlight }) => (
  <div className="flex items-center py-1 border-b border-[#a0b0a0]/20 last:border-0">
    <span className={`text-[10px] font-bold w-1/2 text-center ${highlight && valA !== valB ? 'text-green-700' : 'text-slate-700'}`}>{valA}</span>
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest w-full text-center">{label}</span>
    <span className={`text-[10px] font-bold w-1/2 text-center ${highlight && valB !== valA ? 'text-green-700' : 'text-slate-700'}`}>{valB}</span>
  </div>
);

export const PlayerCompareModal: React.FC<PlayerCompareModalProps> = ({ playerA, playerB, onClose }) => {
  const clubA = world.getClub(playerA.clubId);
  const clubB = world.getClub(playerB.clubId);

  const getAvgRating = (p: Player) => p.seasonStats.appearances > 0 ? (p.seasonStats.totalRating / p.seasonStats.appearances).toFixed(2) : '0.00';
  const getFormAvg = (p: Player) => p.formRatings.length > 0 ? (p.formRatings.reduce((a, b) => a + b, 0) / p.formRatings.length).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2" onClick={onClose}>
      <div className="bg-white rounded-sm border border-[#a0b0a0] shadow-2xl w-full max-w-[520px] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-[#a0b0a0] bg-[#e8ece8]">
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Comparar Jugadores</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-sm"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {/* Player Headers */}
          <div className="flex gap-3 mb-3">
            {[playerA, playerB].map((p, idx) => {
              const club = idx === 0 ? clubA : clubB;
              return (
                <div key={p.id} className="flex-1 text-center p-2 bg-[#f0f4f0] rounded-sm border border-[#a0b0a0]">
                  <div className={`w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-black text-sm ${club?.primaryColor || 'bg-slate-500'}`}>
                    {p.name.substring(0, 1)}
                  </div>
                  <p className="text-[10px] font-black text-slate-900 uppercase truncate">{p.name}</p>
                  <p className="text-[8px] text-slate-500">{club?.shortName || 'Libre'} · {p.age} años</p>
                  <p className="text-[8px] font-black text-[#3a4a3a]">{p.positions.join(', ')}</p>
                </div>
              );
            })}
          </div>

          {/* Ability Comparison */}
          <div className="mb-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Habilidad</p>
            <StatBar label="CA" valA={playerA.currentAbility} valB={playerB.currentAbility} max={20} />
            <StatBar label="PA" valA={playerA.potentialAbility} valB={playerB.potentialAbility} max={20} />
            <StatBar label="Reputación" valA={playerA.reputation} valB={playerB.reputation} max={100} />
          </div>

          {/* Physical & Mental */}
          <div className="mb-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Físico / Mental</p>
            <StatBar label="Moral" valA={playerA.morale} valB={playerB.morale} max={100} />
            <StatBar label="Fitness" valA={playerA.fitness} valB={playerB.fitness} max={100} />
            <StatBar label="Liderazgo" valA={playerA.leadership} valB={playerB.leadership} max={20} />
            <StatBar label="Consistencia" valA={playerA.consistency} valB={playerB.consistency} max={20} />
            <StatBar label="Temperamento" valA={playerA.bigMatchTemperament} valB={playerB.bigMatchTemperament} max={20} />
          </div>

          {/* Season Stats */}
          <div className="mb-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Estadísticas Temporada</p>
            <InfoRow label="PJ" valA={`${playerA.seasonStats.appearances}`} valB={`${playerB.seasonStats.appearances}`} />
            <InfoRow label="Goles" valA={`${playerA.seasonStats.goals}`} valB={`${playerB.seasonStats.goals}`} highlight />
            <InfoRow label="Asist." valA={`${playerA.seasonStats.assists}`} valB={`${playerB.seasonStats.assists}`} highlight />
            <InfoRow label="Rating" valA={getAvgRating(playerA)} valB={getAvgRating(playerB)} highlight />
            <InfoRow label="Forma" valA={getFormAvg(playerA)} valB={getFormAvg(playerB)} />
          </div>

          {/* Contract */}
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Contrato</p>
            <InfoRow label="Valor" valA={`£${playerA.value.toLocaleString()}`} valB={`£${playerB.value.toLocaleString()}`} />
            <InfoRow label="Salario" valA={`£${playerA.salary.toLocaleString()}/mes`} valB={`£${playerB.salary.toLocaleString()}/mes`} />
          </div>
        </div>
      </div>
    </div>
  );
};
