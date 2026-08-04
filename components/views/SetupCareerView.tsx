import React from 'react';
import { RealManager, CareerMode } from '../../types';
import { FMButton } from '../FMUI';
import { ChevronLeft, Briefcase } from 'lucide-react';

interface SetupCareerViewProps {
  userName: string;
  userSurname: string;
  selectedExistingManager: RealManager | null;
  onChooseMode: (mode: CareerMode) => void;
  onBack: () => void;
}

export const SetupCareerView: React.FC<SetupCareerViewProps> = ({
  userName, userSurname, selectedExistingManager, onChooseMode, onBack,
}) => {
  const selectedManagerLabel = selectedExistingManager ? `${selectedExistingManager.name} ${selectedExistingManager.surname}` : `${userName} ${userSurname}`;

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-3xl w-full bg-white/10 rounded-sm p-5 sm:p-10 border border-white/10 shadow-2xl">
        <button onClick={onBack} className="text-[10px] text-white/50 hover:text-white/90 font-bold mb-5 flex items-center gap-1">
          <ChevronLeft size={12} /> Volver
        </button>
        <div className="flex items-center gap-3 mb-2"><div className="bg-white/25 text-white rounded-sm p-2"><Briefcase size={18} /></div><div><h1 className="text-2xl sm:text-4xl font-black text-white/90 uppercase italic tracking-tight">Tu carrera</h1><p className="text-[10px] text-white/50 uppercase tracking-widest">{selectedManagerLabel}</p></div></div>
        <p className="text-xs text-white/60 mb-6">Elige qué responsabilidad quieres asumir al comenzar. Puedes dirigir un club, una selección nacional o ambos proyectos a la vez.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {([
            { mode: 'CLUB' as CareerMode, title: 'Solo club', text: 'Gestiona plantilla, fichajes, staff y competiciones de clubes.' },
            { mode: 'NATIONAL' as CareerMode, title: 'Solo selección', text: 'Convoca jugadores, define el once y dirige el calendario internacional.' },
            { mode: 'BOTH' as CareerMode, title: 'Club + selección', text: 'Una carrera dual con control formal de ambos equipos.' },
          ]).map(option => (
            <button key={option.mode} onClick={() => onChooseMode(option.mode)} className="text-left p-4 bg-white/10/5 hover:bg-[#e2eae2] border border-white/10 hover:border-l-4 hover:border-l-[#3a4a3a] rounded-sm transition-all">
              <div className="text-[10px] font-black uppercase text-[#3a4a3a] mb-2">{option.title}</div>
              <p className="text-[10px] leading-relaxed text-white/60">{option.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
