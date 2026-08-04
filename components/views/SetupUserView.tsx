import React from 'react';
import { Club, RealManager } from '../../types';
import { world } from '../../services/worldManager';
import { FMButton } from '../FMUI';
import { ChevronRight, User, HardDrive, Trash2, X } from 'lucide-react';
import { SaveMetadata } from '../../services/saveLoadService';

interface SetupUserViewProps {
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: string;
  userBirthDate: Date;
  hasSave: boolean;
  isLoadModalOpen: boolean;
  availableSaves: SaveMetadata[];
  onUserNameChange: (v: string) => void;
  onUserSurnameChange: (v: string) => void;
  onUserNationalityChange: (v: string) => void;
  onUserOriginChange: (v: string) => void;
  onUserBirthDateChange: (v: Date) => void;
  onNext: () => void;
  onExistingManager: () => void;
  onLoad: () => void;
  onCloseLoadModal: () => void;
  onLoadGame: (id: string) => void;
  onDeleteSave: (id: string, e: React.MouseEvent) => void;
}

export const SetupUserView: React.FC<SetupUserViewProps> = ({
  userName, userSurname, userNationality, userOrigin, userBirthDate,
  hasSave, isLoadModalOpen, availableSaves,
  onUserNameChange, onUserSurnameChange, onUserNationalityChange,
  onUserOriginChange, onUserBirthDateChange,
  onNext, onExistingManager, onLoad, onCloseLoadModal, onLoadGame, onDeleteSave,
}) => {
  return (
    <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-400 to-slate-500 opacity-50 pointer-events-none"></div>

      {/* Load modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-overlay-in">
          <div className="bg-white/10/10 w-full max-lg rounded-sm border-2 border-slate-500 shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/15 pb-2">
              <h2 className="text-xl font-black text-white/90 uppercase italic">Cargar Partida</h2>
              <button onClick={onCloseLoadModal}><X size={20} className="text-white/60 hover:text-red-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll">
              {availableSaves.length === 0 ? (
                <p className="text-center text-white/50 italic py-10 font-bold uppercase text-xs">No hay partidas guardadas.</p>
              ) : (
                availableSaves.map(save => (
                  <div key={save.id} className="bg-white/10/10 border border-white/20 p-3 rounded-sm hover:border-blue-500 hover:shadow-md transition-all group flex justify-between items-center cursor-pointer" onClick={() => onLoadGame(save.id)}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white/90 uppercase text-xs truncate group-hover:text-blue-700">{save.label}</h4>
                      <div className="flex gap-3 mt-1 text-[10px] text-white/50 font-bold uppercase tracking-wide">
                        <span>{save.teamName}</span><span>•</span><span>{new Date(save.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={(e) => onDeleteSave(save.id, e)} className="p-2 text-white/40 hover:text-red-600 transition-colors" title="Borrar Partida"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white/10/10 rounded-sm p-8 border border-slate-600 shadow-2xl z-10">
        <h1 className="text-3xl font-black text-white mb-6 italic uppercase border-b-4 border-slate-950 pb-2">Perfil del Manager</h1>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-white/60 uppercase block mb-1 tracking-widest">Nombre</label>
            <input type="text" className="w-full bg-white/10/10 border border-slate-500 rounded-sm px-4 py-3 text-white font-bold text-sm outline-none focus:border-slate-800" value={userName} onChange={(e) => onUserNameChange(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-white/60 uppercase block mb-1 tracking-widest">Apellido</label>
            <input type="text" className="w-full bg-white/10/10 border border-slate-500 rounded-sm px-4 py-3 text-white font-bold text-sm outline-none focus:border-slate-800" value={userSurname} onChange={(e) => onUserSurnameChange(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-white/60 uppercase block mb-1 tracking-widest">Nacionalidad</label>
            <select className="w-full bg-white/10/10 border border-slate-500 rounded-sm px-4 py-3 text-white font-bold text-sm outline-none focus:border-slate-800" value={userNationality} onChange={(e) => onUserNationalityChange(e.target.value)}>
              <option value="Argentina">Argentina</option>
              <option value="España">España</option>
              <option value="Brasil">Brasil</option>
              <option value="Inglaterra">Inglaterra</option>
              <option value="Italia">Italia</option>
              <option value="Alemania">Alemania</option>
              <option value="Francia">Francia</option>
              <option value="Portugal">Portugal</option>
              <option value="Países Bajos">Países Bajos</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Chile">Chile</option>
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="EE. UU.">EE. UU.</option>
              <option value="Japón">Japón</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-white/60 uppercase block mb-1 tracking-widest">Origen</label>
            <select className="w-full bg-white/10/10 border border-slate-500 rounded-sm px-4 py-3 text-white font-bold text-sm outline-none focus:border-slate-800" value={userOrigin} onChange={(e) => onUserOriginChange(e.target.value)}>
              <option value="EX_PLAYER">Exjugador</option>
              <option value="YOUTH_COACH">Categorías inferiores</option>
              <option value="JOURNALIST">Periodista / Analista</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-white/60 uppercase block mb-1 tracking-widest">Fecha de nacimiento</label>
            <input type="date" className="w-full bg-white/10/10 border border-slate-500 rounded-sm px-4 py-3 text-white font-bold text-sm outline-none focus:border-slate-800" value={userBirthDate.toISOString().split('T')[0]} onChange={(e) => onUserBirthDateChange(new Date(e.target.value))} />
          </div>
          <FMButton onClick={onNext} className="w-full py-4 mt-4">
            CREAR MI MANAGER <ChevronRight size={14} />
          </FMButton>
          <FMButton onClick={onExistingManager} variant="secondary" className="w-full py-3 mt-2 text-xs border-2 border-white/15">
            <User size={14} /> ELEGIR MANAGER EXISTENTE
          </FMButton>
          {hasSave && (
            <FMButton onClick={onLoad} variant="secondary" className="w-full py-3 mt-2 text-xs border-2 border-white/15">
              <HardDrive size={14} /> CARGAR PARTIDA
            </FMButton>
          )}
        </div>
      </div>
    </div>
  );
};
