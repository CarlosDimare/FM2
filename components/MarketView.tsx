
import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { Search, Filter, DollarSign, Clock, ArrowRightLeft } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

interface MarketViewProps {
  onSelectPlayer: (player: Player) => void;
  userClubId: string;
  currentDate: Date;
}

export const MarketView: React.FC<MarketViewProps> = ({ onSelectPlayer, userClubId, currentDate }) => {
  const [filter, setFilter] = useState<'ALL' | 'TRANSFERABLE' | 'LOANABLE' | 'FREE'>('ALL');
  const [search, setSearch] = useState('');

  const marketPlayers = useMemo(() => {
    if (filter === 'FREE') {
      return world.players.filter(p => p.clubId === 'FREE_AGENT' && p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a,b) => b.currentAbility - a.currentAbility);
    }
    return world.players.filter(p => {
      const isListed = p.transferStatus !== 'NONE';
      const matchesFilter = filter === 'ALL' || p.transferStatus === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return isListed && matchesFilter && matchesSearch;
    }).sort((a,b) => b.currentAbility - a.currentAbility);
  }, [filter, search]);

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 overflow-hidden">
      <header className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
           <div>
              <h2 className="text-xl md:text-2xl font-black text-white/90 uppercase italic tracking-tighter">Mercado Mundial</h2>
              <p className="text-white/60 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic">Buscando el próximo refuerzo estrella.</p>
           </div>
           
            <div className="flex bg-white/10/10 p-0.5 rounded-sm border border-white/10 shadow-sm w-full md:w-auto">
               {[
                 { id: 'ALL', label: 'Todos' },
                 { id: 'TRANSFERABLE', label: 'Transf.' },
                 { id: 'LOANABLE', label: 'Cedibles' },
                 { id: 'FREE', label: 'Libres' }
               ].map(f => (
                 <button 
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`flex-1 md:px-6 py-1.5 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest ${filter === f.id ? 'bg-white/25 text-white shadow-sm' : 'text-white/70 hover:bg-white/10'}`}
                 >
                    {f.label}
                 </button>
              ))}
           </div>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={14} />
           <input 
              type="text" 
              placeholder="Introduce nombre del jugador..." 
              className="w-full bg-white/10 border border-white/10 rounded-sm pl-9 pr-4 py-2 text-white focus:border-[#3a4a3a] outline-none font-bold text-[11px] tracking-wide placeholder:text-white/40 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </header>

      <FMBox title={`Resultados del Mercado (${marketPlayers.length})`} className="flex-1" noPadding>
         <FMTable 
            headers={['Jugador', 'Club', 'Estado', 'Valor']}
            colWidths={['auto', 'auto', '80px', '80px']}
         >
            {marketPlayers.map((p, idx) => (
               <tr 
                  key={p.id} 
                  onClick={() => onSelectPlayer(p)}
                  className={`
                    cursor-pointer transition-colors
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-white/5'}
                    hover:bg-white/10
                  `}
               >
                  <FMTableCell>
                     <div className="flex flex-col">
                        <span className="font-bold text-white/90 text-[11px]">{p.name}</span>
                        <span className="text-[9px] text-white/50 font-bold uppercase">{p.positions[0]}</span>
                     </div>
                  </FMTableCell>
                  <FMTableCell className="text-white/70 text-[10px] italic">
                     {filter === 'FREE' ? <span className="text-white/40">Sin club</span> : world.getClub(p.clubId)?.name}
                  </FMTableCell>
                  <FMTableCell className="text-center">
                     {filter === 'FREE' ? (
                        <span className="px-1.5 py-0.5 rounded-[1px] text-[8px] font-bold uppercase tracking-tighter border bg-white/10/5 text-white/60 border-white/10">LIBRE</span>
                     ) : (
                        <span className={`px-1.5 py-0.5 rounded-[1px] text-[8px] font-bold uppercase tracking-tighter border ${p.transferStatus === 'TRANSFERABLE' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-500/10 text-blue-700 border-blue-200'}`}>
                           {p.transferStatus === 'TRANSFERABLE' ? 'TRN' : 'CED'}
                        </span>
                     )}
                  </FMTableCell>
                  <FMTableCell className="text-right font-bold text-white/90" isNumber>
                     £{(p.value / 1000000).toFixed(1)}M
                  </FMTableCell>
               </tr>
            ))}
         </FMTable>
         {marketPlayers.length === 0 && (
            <div className="p-20 text-center text-white/40 italic uppercase font-bold tracking-widest text-[10px]">No se encontraron registros activos</div>
         )}
      </FMBox>
    </div>
  );
};
