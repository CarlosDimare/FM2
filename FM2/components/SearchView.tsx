import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { Search, SlidersHorizontal, User } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

interface SearchViewProps {
  onSelectPlayer: (player: Player) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectPlayer }) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [minAge, setMinAge] = useState<number>(15);
  const [maxAge, setMaxAge] = useState<number>(45);
  const [minAbility, setMinAbility] = useState<number>(0);

  const results = useMemo(() => {
    if (search.length < 3 && posFilter === 'ALL') return [];
    return world.players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesPos = posFilter === 'ALL' || p.positions.some(pos => pos.includes(posFilter));
      const matchesAge = p.age >= minAge && p.age <= maxAge;
      const matchesAbility = p.currentAbility >= minAbility;
      return matchesSearch && matchesPos && matchesAge && matchesAbility;
    }).sort((a,b) => b.currentAbility - a.currentAbility).slice(0, 200);
  }, [search, posFilter, minAge, maxAge, minAbility]);

  const avgForm = (p: Player): number => {
    if (!p.formRatings || p.formRatings.length === 0) return 0;
    return p.formRatings.reduce((a,b) => a+b, 0) / p.formRatings.length;
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="shrink-0">
         <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Buscador de Jugadores</h2>
         <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Base de datos global de jugadores.</p>
      </header>

      <FMBox title="Filtros de Búsqueda" className="shrink-0 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-1">
            <div className="col-span-1 lg:col-span-2">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nombre del Jugador</label>
               <input 
                  type="text" 
                  className="w-full bg-white border border-[#a0b0a0] rounded-sm px-3 py-1.5 text-[11px] font-bold text-slate-900 outline-none focus:border-[#3a4a3a]" 
                  placeholder="Introduce al menos 3 letras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div>
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Posición</label>
               <select 
                  className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none cursor-pointer"
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
               >
                   <option value="ALL">Cualquiera</option>
                   <option value="GK">Portero</option>
                   <option value="DC">Defensa Central</option>
                   <option value="DL">Lateral Izquierdo</option>
                   <option value="DR">Lateral Derecho</option>
                   <option value="DM">Mediocentro Def.</option>
                   <option value="MC">Centrocampista</option>
                   <option value="MR">Interior Der.</option>
                   <option value="ML">Interior Izq.</option>
                   <option value="AM">Mediapunta</option>
                   <option value="AML">Extremo Izq.</option>
                   <option value="AMR">Extremo Der.</option>
                   <option value="ST">Delantero</option>
               </select>
            </div>
             <div className="flex gap-2">
                <div className="flex-1">
                   <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Edad Min</label>
                   <input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none" />
                </div>
                <div className="flex-1">
                   <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Edad Max</label>
                   <input type="number" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none" />
                </div>
             </div>
             <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">CA Mínimo</label>
                <select className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none cursor-pointer" value={minAbility} onChange={e => setMinAbility(Number(e.target.value))}>
                  <option value="0">Cualquiera</option>
                  <option value="50">≥ 50</option>
                  <option value="80">≥ 80</option>
                  <option value="100">≥ 100</option>
                  <option value="120">≥ 120</option>
                  <option value="140">≥ 140</option>
                  <option value="160">≥ 160</option>
                  <option value="180">≥ 180</option>
                </select>
             </div>
         </div>
      </FMBox>

      <FMBox title={`Resultados de Búsqueda (${results.length})`} className="flex-1" noPadding>
        <div className="flex flex-col h-full">
          <div className="flex text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 border-b border-slate-400 px-3 py-2 shrink-0">
            <div className="flex-1">Jugador</div>
            <div className="w-[120px]">Club</div>
            <div className="w-[40px] text-center">Edad</div>
            <div className="w-[50px] text-right">Forma</div>
            <div className="w-[80px] text-right">Valor</div>
          </div>
          <div ref={parentRef} className="flex-1 overflow-y-auto custom-scroll">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map(virtualItem => {
                const p = results[virtualItem.index];
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlayer(p)}
                    className={`flex items-center px-3 py-2 cursor-pointer transition-colors text-[11px] absolute top-0 left-0 w-full ${
                      virtualItem.index % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'
                    } hover:bg-[#ccd9cc]`}
                    style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 truncate">{p.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{p.positions[0]}</span>
                    </div>
                    <div className="w-[120px] text-slate-700 text-[10px] italic truncate px-2">
                      {world.getClub(p.clubId)?.name || 'Agente Libre'}
                    </div>
                    <div className="w-[40px] text-center font-bold">{p.age}</div>
                    <div className="w-[50px] text-right font-bold text-[10px]">
                      {avgForm(p) > 0 ? (
                        <span className={avgForm(p) >= 7.5 ? 'text-green-600' : avgForm(p) >= 6.5 ? 'text-blue-600' : avgForm(p) >= 5 ? 'text-amber-600' : 'text-red-600'}>
                          {avgForm(p).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </div>
                    <div className="w-[80px] text-right font-bold text-slate-900">
                      £{(p.value / 1000000).toFixed(1)}M
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {results.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
            {search.length < 3 && posFilter === 'ALL' ? 'Introduce al menos 3 caracteres para buscar.' : 'No se han encontrado resultados.'}
          </div>
        )}
      </FMBox>
    </div>
  );
};
