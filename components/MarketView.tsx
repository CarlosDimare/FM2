
import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { useDialogueStore } from '../stores/dialogueStore';
import { Search, ArrowDownUp, HandCoins, FolderOpen } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';
import { TransferOfferModal } from './TransferOfferModal';

interface MarketViewProps {
  onSelectPlayer: (player: Player) => void;
  userClubId: string;
  currentDate: Date;
}

export const MarketView: React.FC<MarketViewProps> = ({ onSelectPlayer, userClubId, currentDate }) => {
  const [filter, setFilter] = useState<'ALL' | 'TRANSFERABLE' | 'LOANABLE' | 'FREE'>('ALL');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'CA' | 'VALUE' | 'SALARY' | 'AGE' | 'NAME'>('CA');
  const [sortDesc, setSortDesc] = useState(true);
  const [offerPlayer, setOfferPlayer] = useState<Player | null>(null);

  const doSort = (a: Player, b: Player) => {
    let res = 0;
    switch (sortKey) {
      case 'NAME': res = a.name.localeCompare(b.name); break;
      case 'VALUE': res = a.value - b.value; break;
      case 'SALARY': res = a.salary - b.salary; break;
      case 'AGE': res = a.age - b.age; break;
      default: res = a.currentAbility - b.currentAbility;
    }
    return sortDesc ? -res : res;
  };

  const marketPlayers = useMemo(() => {
    if (filter === 'FREE') {
      return world.players.filter(p => p.clubId === 'FREE_AGENT' && p.name.toLowerCase().includes(search.toLowerCase()))
        .sort(doSort);
    }
    return world.players.filter(p => {
      const isListed = p.transferStatus !== 'NONE';
      const matchesFilter = filter === 'ALL' || p.transferStatus === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return isListed && matchesFilter && matchesSearch;
    }).sort(doSort);
  }, [filter, search, sortKey, sortDesc]);

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
           <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Mercado Mundial</h2>
              <p className="text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic">Buscando el próximo refuerzo estrella.</p>
           </div>
           
            <div className="flex flex-col gap-1.5 items-stretch md:items-end">
               <FMButton onClick={() => useDialogueStore.getState().open('TRANSFERS', { clubId: userClubId, source: 'MARKET' })} className="w-full md:w-auto">
                 <FolderOpen size={13} /> Carpeta de refuerzos
               </FMButton>
               <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm w-full md:w-auto">
                  {[
                    { id: 'ALL', label: 'Todos' },
                    { id: 'TRANSFERABLE', label: 'Transf.' },
                    { id: 'LOANABLE', label: 'Cedibles' },
                    { id: 'FREE', label: 'Libres' }
                  ].map(f => (
                    <button 
                       key={f.id}
                       onClick={() => setFilter(f.id as any)}
                       className={`flex-1 md:px-6 py-1.5 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest ${filter === f.id ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                    >
                       {f.label}
                    </button>
                 ))}
              </div>
            </div>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
           <input 
              type="text" 
              placeholder="Introduce nombre del jugador..." 
              className="w-full bg-white border border-[#a0b0a0] rounded-sm pl-9 pr-4 py-2 text-slate-950 focus:border-[#3a4a3a] outline-none font-bold text-[11px] tracking-wide placeholder:text-slate-400 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-600">Ordenar por:</label>
          <div className="flex gap-1.5 w-full sm:w-auto">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="flex-1 sm:flex-none bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[9px] font-black uppercase text-slate-800 outline-none focus:border-[#3a4a3a]"
            >
              <option value="CA">Habilidad (CA)</option>
              <option value="VALUE">Valor de mercado</option>
              <option value="SALARY">Sueldo</option>
              <option value="AGE">Edad</option>
              <option value="NAME">Nombre</option>
            </select>
            <button
              onClick={() => setSortDesc(!sortDesc)}
              className={`px-2.5 py-1.5 rounded-sm border text-[9px] font-black uppercase flex items-center gap-1 transition-all ${sortDesc ? 'bg-[#3a4a3a] text-white border-[#3a4a3a]' : 'bg-white text-slate-700 border-[#a0b0a0] hover:bg-[#ccd9cc]'}`}
              title={sortDesc ? 'Descendente' : 'Ascendente'}
            >
              <ArrowDownUp size={12} /> {sortDesc ? 'Mayor → Menor' : 'Menor → Mayor'}
            </button>
          </div>
        </div>
      </header>

      <FMBox title={`Resultados del Mercado (${marketPlayers.length})`} className="flex-1" noPadding>
         <FMTable 
            headers={['Jugador', 'Club', 'Estado', 'Valor', 'Acción']}
            colWidths={['auto', 'auto', '80px', '80px', '70px']}
         >
            {marketPlayers.map((p, idx) => (
               <tr 
                  key={p.id} 
                  onClick={() => onSelectPlayer(p)}
                  className={`
                    cursor-pointer transition-colors
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                    hover:bg-[#ccd9cc]
                  `}
               >
                  <FMTableCell>
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-[11px]">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{p.positions[0]}</span>
                     </div>
                  </FMTableCell>
                  <FMTableCell className="text-slate-700 text-[10px] italic">
                     {filter === 'FREE' ? <span className="text-slate-400">Sin club</span> : world.getClub(p.clubId)?.name}
                  </FMTableCell>
                  <FMTableCell className="text-center">
                     {filter === 'FREE' ? (
                        <span className="px-1.5 py-0.5 rounded-[1px] text-[8px] font-bold uppercase tracking-tighter border bg-slate-50 text-slate-600 border-slate-200">LIBRE</span>
                     ) : (
                        <span className={`px-1.5 py-0.5 rounded-[1px] text-[8px] font-bold uppercase tracking-tighter border ${p.transferStatus === 'TRANSFERABLE' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                           {p.transferStatus === 'TRANSFERABLE' ? 'TRN' : 'CED'}
                        </span>
                     )}
                  </FMTableCell>
                  <FMTableCell className="text-right font-bold text-slate-900" isNumber>
                     £{(p.value / 1000000).toFixed(1)}M
                  </FMTableCell>
                  <FMTableCell className="text-center">
                    {filter !== 'FREE' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setOfferPlayer(p); }}
                        className="px-2 py-1 rounded-[1px] text-[8px] font-black uppercase tracking-tight border bg-[#3a4a3a] text-white border-[#1a2a1a] hover:brightness-110 transition-all flex items-center gap-1"
                        title={`Hacer oferta por ${p.name}`}
                      >
                        <HandCoins size={11} /> Ofertar
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-400 italic font-bold uppercase">Agente libre</span>
                    )}
                  </FMTableCell>
               </tr>
            ))}
         </FMTable>
         {marketPlayers.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic uppercase font-bold tracking-widest text-[10px]">No se encontraron registros activos</div>
         )}
      </FMBox>

      {offerPlayer && (
        <TransferOfferModal
          player={offerPlayer}
          userClubId={userClubId}
          currentDate={currentDate}
          onClose={() => setOfferPlayer(null)}
          onOfferMade={() => setOfferPlayer(null)}
        />
      )}
    </div>
  );
};
