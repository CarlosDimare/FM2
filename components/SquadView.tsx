
import React, { useState, useMemo } from 'react';
import { Club, Player, POSITION_ORDER } from '../types';
import { FMBox, FMTable, FMTableCell } from './FMUI';
import { TrendingUp, TrendingDown, Minus, X, Search } from 'lucide-react';
import { getFlagUrl } from '../data/static';
import { getPlayerTag } from '../services/playerGenerator';
import { DialogueSystem } from '../services/dialogueSystem';
import { PlayerFormDots, PlayerStatusIcons } from './PlayerBadges';

type SortField = 'POS' | 'NAME' | 'AGE' | 'TREND' | 'SAL' | 'FIT' | 'MOR' | 'VAL';

interface SquadViewProps {
  players: Player[];
  onSelectPlayer: (p: Player) => void;
  onContextMenu?: (e: React.MouseEvent, p: Player) => void;
  customTitle?: string;
  currentDate: Date;
  club?: Club;
}

export const SquadView: React.FC<SquadViewProps> = ({ players, onSelectPlayer, onContextMenu, customTitle, currentDate, club }) => {
  const [sortField, setSortField] = useState<SortField>('POS');
  const [sortDesc, setSortDesc] = useState(false);
  const [showInjuries, setShowInjuries] = useState(true);
  const [search, setSearch] = useState('');
  const [salaryMode, setSalaryMode] = useState<'WEEKLY' | 'MONTHLY' | 'ANNUAL'>('WEEKLY');

  const injuredPlayers = useMemo(() => players.filter(p => p.injury), [players]);

  // player.salary se guarda como sueldo MENSUAL en todo el juego.
  const formatSalary = (s: number) => {
    const value = salaryMode === 'WEEKLY' ? s / 4.33 : salaryMode === 'MONTHLY' ? s : s * 12;
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toFixed(0)}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else { 
      setSortField(field); 
      setSortDesc(field === 'POS' || field === 'NAME' ? false : true); 
    }
  };

  const handleHeaderClick = (index: number) => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
          const mobileFields: SortField[] = ['POS', 'NAME', 'AGE', 'FIT', 'VAL'];
          if (mobileFields[index]) handleSort(mobileFields[index]);
      } else {
          const desktopFields: SortField[] = ['POS', 'NAME', 'AGE', 'TREND', 'SAL', 'FIT', 'MOR', 'VAL'];
          if (desktopFields[index - (index >= 4 ? 1 : 0)]) handleSort(desktopFields[index - (index >= 4 ? 1 : 0)]);
      }
  };

  const visiblePlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.name.toLowerCase().includes(q) || (p.positions[0] || '').toLowerCase().includes(q));
  }, [players, search]);

  const sortedPlayers = useMemo(() => [...visiblePlayers].sort((a, b) => {
    let res = 0;
    switch (sortField) {
      case 'STATUS': 
          res = (Number(b.isStarter) - Number(a.isStarter)); 
          break;
      case 'POS': 
          res = (POSITION_ORDER[a.positions[0]] ?? 99) - (POSITION_ORDER[b.positions[0]] ?? 99); 
          break;
      case 'NAME': 
          res = a.name.localeCompare(b.name); 
          break;
      case 'AGE': 
          res = a.age - b.age; 
          break;
      case 'TREND': 
          const getTrendVal = (t?: string) => t === 'RISING' ? 2 : t === 'DECLINING' ? 0 : 1;
          res = getTrendVal(a.developmentTrend) - getTrendVal(b.developmentTrend); 
          break;
      case 'SAL': 
          res = a.salary - b.salary; 
          break;
      case 'FIT': 
          res = a.fitness - b.fitness; 
          break;
      case 'MOR': 
          res = a.morale - b.morale; 
          break;
      case 'VAL': 
          res = a.value - b.value; 
          break;
    }
    return sortDesc ? -res : res;
  }), [visiblePlayers, sortField, sortDesc]);

  const renderTrend = (trend: string | undefined) => {
    if (trend === 'RISING') return <TrendingUp size={12} className="text-green-600 mx-auto" />;
    if (trend === 'DECLINING') return <TrendingDown size={12} className="text-red-600 mx-auto" />;
    return <Minus size={12} className="text-slate-300 mx-auto" />;
  };

  const desktopHeaders = ['Pos', 'Nombre', 'Edad', 'Etiqueta', 'Forma', 'Sueldo', 'Fis', 'Mor', 'Valor'];
  const tabletHeaders = ['Pos', 'Nombre', 'Edad', 'Prog', 'Forma', 'Sueldo', 'Fis', 'Valor'];
  const mobileHeaders = ['Pos', 'Nombre', 'Edad', 'Fis', 'Valor'];
  const desktopWidths = ['45px', 'auto', '35px', '80px', '60px', '75px', '40px', '40px', '85px'];
  const tabletWidths = ['45px', 'auto', '35px', '35px', '60px', '75px', '40px', '85px'];
  const mobileWidths = ['45px', 'auto', '35px', '40px', '80px'];

  return (
    <div className="p-2 h-full flex flex-col gap-2 bg-[#d4dcd4]">
      {injuredPlayers.length > 0 && showInjuries && (
        <div className="shrink-0 bg-red-50 border border-red-300 rounded-sm p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[10px] font-black text-red-800 uppercase tracking-wider flex items-center gap-1">
              <X size={12} className="text-red-600" /> Parte médico ({injuredPlayers.length})
            </h4>
            <button onClick={() => setShowInjuries(false)} className="text-[9px] text-slate-500 hover:text-slate-700 uppercase font-bold">Cerrar</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {injuredPlayers.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-white border border-red-200 rounded-sm px-2 py-1 text-[10px] cursor-pointer hover:bg-red-50" onClick={() => onSelectPlayer(p)}>
                <span className="font-bold text-slate-900 truncate max-w-[100px]">{p.name}</span>
                <span className="text-red-700">·</span>
                <span className="text-red-700 font-medium">{p.injury!.type}</span>
                <span className="text-red-600 font-black">{p.injury!.daysLeft}d</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="shrink-0 bg-blue-50 border border-blue-200 rounded-sm p-2 flex items-center gap-3">
        <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Min. Sub-21</span>
        <span className="text-xs font-bold text-blue-900">{Math.round(club?.u21MinutesThisSeason || 0)}</span>
        <span className="text-[9px] text-blue-600">/ 600 mínimos</span>
        <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((club?.u21MinutesThisSeason || 0) / 600) * 100)}%` }}></div>
        </div>
        {(club?.u21MinutesThisSeason || 0) >= 600 ? (
          <span className="text-[9px] font-bold text-green-700">✓</span>
        ) : (
          <span className="text-[9px] font-bold text-amber-600">⚠</span>
        )}
      </div>
      <div className="shrink-0 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
          <input
            type="text"
            placeholder="Buscar por nombre o posición..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#a0b0a0] rounded-sm pl-8 pr-3 py-1.5 text-[11px] font-bold text-slate-900 focus:border-[#3a4a3a] outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm self-start">
          {(['WEEKLY', 'MONTHLY', 'ANNUAL'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSalaryMode(mode)}
              className={`px-2.5 py-1 text-[8px] font-black rounded-[1px] uppercase tracking-widest transition-all ${salaryMode === mode ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
            >
              {mode === 'WEEKLY' ? 'Semanal' : mode === 'MONTHLY' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>
      </div>
      <FMBox title={customTitle || `Plantilla (${visiblePlayers.length})`} className="flex-1" noPadding>
        {/* Tablet Table View */}
        <div className="hidden md:block lg:hidden h-full overflow-hidden">
            <FMTable
                headers={tabletHeaders}
                colWidths={tabletWidths}
                onHeaderClick={handleHeaderClick}
            >
                {sortedPlayers.map((player, idx) => (
                    <tr
                    key={player.id}
                    onClick={() => onSelectPlayer(player)}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                    className={`
                        cursor-pointer transition-colors border-b border-[#e0e0e0]
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                        hover:bg-[#ccd9cc]
                        ${player.isStarter ? 'font-bold' : ''}
                    `}
                    >
                    <FMTableCell className="text-center text-slate-700 font-bold">{player.positions[0]}</FMTableCell>
                    <FMTableCell className="text-slate-900">
                        <div className="flex items-center min-w-0">
                            <img src={getFlagUrl(player.nationality)} alt={player.nationality} className="w-4 h-3 object-cover shadow-sm rounded-[1px] mr-2 shrink-0 border border-slate-300" />
                            <span className="truncate">{player.name}</span>
                            <PlayerStatusIcons player={player} />
                        </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>{player.age}</FMTableCell>
                    <FMTableCell className="text-center"><span className="text-[8px] font-black text-blue-700 uppercase">{getPlayerTag(player)}</span></FMTableCell>
                    <FMTableCell className="text-center"><PlayerFormDots ratings={player.formRatings} /></FMTableCell>
                    <FMTableCell className="text-right font-bold" isNumber>{formatSalary(player.salary)}</FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>
                        <span className={player.fitness < 70 ? 'text-red-600' : 'text-green-700'}>{Math.round(player.fitness)}%</span>
                    </FMTableCell>
                    <FMTableCell className="text-right font-black" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                    </tr>
                ))}
            </FMTable>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block h-full overflow-hidden">
            <FMTable
                headers={desktopHeaders}
                colWidths={desktopWidths}
                onHeaderClick={handleHeaderClick}
            >
                {sortedPlayers.map((player, idx) => (
                    <tr 
                    key={player.id} 
                    onClick={() => onSelectPlayer(player)}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                    className={`
                        cursor-pointer transition-colors border-b border-[#e0e0e0]
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                        hover:bg-[#ccd9cc]
                        ${player.isStarter ? 'font-bold' : ''}
                    `}
                    >
                    <FMTableCell className="text-center text-slate-700 font-bold">{player.positions[0]}</FMTableCell>
                    <FMTableCell className="text-slate-900">
                        <div className="flex items-center min-w-0">
                            <img src={getFlagUrl(player.nationality)} alt={player.nationality} className="w-4 h-3 object-cover shadow-sm rounded-[1px] mr-2 shrink-0 border border-slate-300" />
                            <span className="truncate">{player.name}</span>
                            <PlayerStatusIcons player={player} />
                        </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>{player.age}</FMTableCell>
                    <FMTableCell className="text-center"><span className="text-[8px] font-black text-blue-700 uppercase">{getPlayerTag(player)}</span></FMTableCell>
                    <FMTableCell className="text-center"><PlayerFormDots ratings={player.formRatings} /></FMTableCell>
                    <FMTableCell className="text-right font-bold" isNumber>{formatSalary(player.salary)}</FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>
                        <span className={player.fitness < 70 ? 'text-red-600' : 'text-green-700'}>{Math.round(player.fitness)}%</span>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>
                        <span className={player.morale < 40 ? 'text-red-600' : 'text-blue-700'}>{Math.round(player.morale)}%</span>
                    </FMTableCell>
                    <FMTableCell className="text-right font-black" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                    </tr>
                ))}
            </FMTable>
        </div>
        
        {/* Mobile Table View */}
        <div className="md:hidden h-full overflow-hidden">
            <FMTable 
                headers={mobileHeaders}
                colWidths={mobileWidths}
                onHeaderClick={handleHeaderClick}
            >
                {sortedPlayers.map((player, idx) => (
                    <tr 
                    key={player.id} 
                    onClick={() => onSelectPlayer(player)}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                    className={`
                        cursor-pointer transition-colors border-b border-[#e0e0e0]
                        ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                        hover:bg-[#ccd9cc]
                        ${player.isStarter ? 'font-bold shadow-[inset_4px_0_0_0_rgba(58,74,58,1)]' : ''}
                    `}
                    >
                    <FMTableCell className="text-center text-slate-700 font-bold text-[9px] px-1">{player.positions[0]}</FMTableCell>
                    <FMTableCell className="text-slate-900 px-2">
                        <div className="flex items-center min-w-0">
                            <img src={getFlagUrl(player.nationality)} alt={player.nationality} className="w-3 h-2 object-cover shadow-sm rounded-[1px] mr-1.5 shrink-0 border border-slate-300" />
                            <span className="truncate max-w-[100px] text-[10px]">{player.name}</span>
                            <PlayerStatusIcons player={player} />
                        </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold text-[10px]" isNumber>{player.age}</FMTableCell>
                    <FMTableCell className="text-center font-bold text-[10px]" isNumber>
                        <span className={player.fitness < 70 ? 'text-red-600' : 'text-green-700'}>{Math.round(player.fitness)}%</span>
                    </FMTableCell>
                    <FMTableCell className="text-right font-black text-[10px]" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                    </tr>
                ))}
            </FMTable>
        </div>
      </FMBox>
    </div>
  );
};
