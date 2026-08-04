import React from 'react';
import { RealManager } from '../../types';
import { world } from '../../services/worldManager';
import { FMButton, FMModal } from '../FMUI';
import { ChevronLeft, User, Trash2 } from 'lucide-react';
import { getFlagUrl } from '../../data/static';
import { ALL_REAL_MANAGERS, MANAGER_DATABASE_META } from '../../data/managerDatabase';

const AttrBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const pct = Math.min(100, Math.max(0, (value / 20) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-white/60 uppercase w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10/10 rounded-sm overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-black text-white/90 w-6 text-right">{value}</span>
    </div>
  );
};

interface SetupExistingManagerViewProps {
  showConflictModal: boolean;
  managerToConfirm: RealManager | null;
  managerSearch: string;
  managerCountryFilter: string;
  managerResultLimit: number;
  onManagerSearchChange: (v: string) => void;
  onManagerCountryFilterChange: (v: string) => void;
  onManagerResultLimitChange: (v: number) => void;
  onSelectManager: (m: RealManager) => void;
  onTakeClub: () => void;
  onFireAndTakeFree: () => void;
  onCloseConflict: () => void;
  onBack: () => void;
}

export const SetupExistingManagerView: React.FC<SetupExistingManagerViewProps> = ({
  showConflictModal, managerToConfirm, managerSearch, managerCountryFilter, managerResultLimit,
  onManagerSearchChange, onManagerCountryFilterChange, onManagerResultLimitChange,
  onSelectManager, onTakeClub, onFireAndTakeFree, onCloseConflict, onBack,
}) => {
  const clubName = (clubId: string | null): string => {
    if (!clubId) return 'Desempleado';
    const club = world.getClub(clubId);
    return club ? club.name : 'Desconocido';
  };

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      {showConflictModal && managerToConfirm && (
        <FMModal isOpen={showConflictModal} onClose={onCloseConflict} title="Conflicto de Manager" size="lg">
          <p className="text-sm text-white/70 mb-4">
            El manager <span className="font-bold">{managerToConfirm.name} {managerToConfirm.surname}</span> actualmente dirige al <span className="font-bold">{clubName(managerToConfirm.currentClubId)}</span>.
            ¿Qué acción deseas tomar?
          </p>
          <div className="flex justify-around gap-4 mt-6">
            <FMButton onClick={onTakeClub} className="flex-1 py-3">
              <User size={14} /> Tomar el control de {clubName(managerToConfirm.currentClubId)}
            </FMButton>
            <FMButton onClick={onFireAndTakeFree} variant="danger" className="flex-1 py-3">
              <Trash2 size={14} /> Despedirlo y tomar el club libre
            </FMButton>
          </div>
          <div className="mt-4 text-xs text-white/50 italic text-center">
            Advertencia: Despedir un manager puede tener consecuencias en la reputación del club y la relación con la directiva.
          </div>
        </FMModal>
      )}

      <div className="max-w-5xl w-full bg-white/10 rounded-sm p-4 sm:p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onBack} className="text-[10px] text-white/50 hover:text-white/90 font-bold mb-4 flex items-center gap-1">
          <ChevronLeft size={12} /> Volver
        </button>
        <h1 className="text-3xl sm:text-5xl font-black text-white/90 mb-2 tracking-tighter italic uppercase text-center">Elegir Manager</h1>
        <p className="text-[10px] text-white/50 font-bold uppercase text-center tracking-[0.3em] mb-2">Busca en toda la base disponible · {ALL_REAL_MANAGERS.length.toLocaleString()} perfiles cargados</p>
        <p className="text-[9px] text-white/40 font-bold uppercase text-center tracking-widest mb-4">{MANAGER_DATABASE_META.curatedCount} perfiles curados · {MANAGER_DATABASE_META.importedCount.toLocaleString()} importados desde Wikidata{MANAGER_DATABASE_META.importedComplete ? '' : ' · snapshot parcial'}</p>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-2 mb-5">
          <input
            value={managerSearch}
            onChange={e => onManagerSearchChange(e.target.value)}
            placeholder="Buscar por nombre, apellido, nacionalidad o club..."
            className="bg-white/10/5 border border-white/10 rounded-sm px-3 py-2.5 text-xs font-bold text-white/90 outline-none focus:border-[#3a4a3a]"
          />
          <select value={managerCountryFilter} onChange={e => onManagerCountryFilterChange(e.target.value)} className="bg-white/10/5 border border-white/10 rounded-sm px-3 py-2.5 text-xs font-bold text-white/90 outline-none">
            <option value="ALL">Todas las nacionalidades</option>
            {Array.from(new Set(ALL_REAL_MANAGERS.map(m => m.nationality))).sort().map(country => <option key={country} value={country}>{country}</option>)}
          </select>
        </div>

        {(() => {
          const query = managerSearch.trim().toLocaleLowerCase();
          const filteredManagers = ALL_REAL_MANAGERS.filter(m => {
            const club = m.currentClubId ? clubName(m.currentClubId) : '';
            const haystack = `${m.name} ${m.surname} ${m.nationality} ${club} ${m.personality} ${m.dataSource || ''}`.toLocaleLowerCase();
            return (!query || haystack.includes(query)) && (managerCountryFilter === 'ALL' || m.nationality === managerCountryFilter);
          });
          const visibleManagers = [...filteredManagers]
            .sort((a, b) => b.reputation - a.reputation)
            .slice(0, managerResultLimit);
          return (
            <>
              <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase text-white/50">
                <span>{filteredManagers.length.toLocaleString()} resultado{filteredManagers.length !== 1 ? 's' : ''}</span>
                <span>Mostrando {Math.min(managerResultLimit, filteredManagers.length).toLocaleString()} · Orden: reputación</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleManagers.map(m => (
                  <button key={m.id} onClick={() => onSelectManager(m)} className="p-4 bg-white/10/5 hover:bg-[#e2eae2] border border-white/10 hover:border-l-4 hover:border-l-[#3a4a3a] rounded-sm text-left transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img src={getFlagUrl(m.nationality)} alt={m.nationality} className="w-5 h-4 rounded-sm object-cover border border-white/10 shrink-0" />
                        <div className="min-w-0"><p className="font-black text-white/90 text-xs uppercase truncate">{m.name} {m.surname}</p><p className="text-[9px] text-white/50 font-bold">{m.age} años · {m.personality}</p></div>
                      </div>
                      <div className="text-right shrink-0"><p className="text-base font-black text-[#3a4a3a]">{m.reputation}</p><p className="text-[8px] text-white/50 uppercase font-bold">Rep</p></div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${m.currentClubId ? 'bg-white/25 text-white' : 'bg-white/15 text-white/70'}`}>{m.currentClubId ? clubName(m.currentClubId) : 'Desempleado'}</span>
                    {m.dataSource === 'WIKIDATA' && <span className="ml-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 border border-sky-200">Wikidata · datos básicos</span>}
                    <div className="space-y-1 mt-3"><AttrBar label="Dir." value={m.attributes.coaching} color="bg-white/25" /><AttrBar label="Tác." value={m.attributes.tacticalKnowledge} color="bg-[#4a5a4a]" /><AttrBar label="Gest." value={m.attributes.manManagement} color="bg-[#5a6a5a]" /><AttrBar label="Mot." value={m.attributes.motivation} color="bg-[#6a7a6a]" /></div>
                  </button>
                ))}
              </div>
              {filteredManagers.length > managerResultLimit && (
                <button onClick={() => onManagerResultLimitChange(managerResultLimit + 120)} className="mt-4 w-full py-2 bg-[#e2eae2] hover:bg-white/10 border border-white/10 rounded-sm text-[10px] font-black uppercase text-white/70 transition-colors">
                  Cargar más · quedan {(filteredManagers.length - managerResultLimit).toLocaleString()}
                </button>
              )}
              {filteredManagers.length === 0 && <p className="text-center text-white/50 italic py-10">No hay managers que coincidan con la búsqueda.</p>}
            </>
          );
        })()}
      </div>
    </div>
  );
};
