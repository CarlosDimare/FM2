
import React, { useState } from 'react';
import { world } from '../services/worldManager';
import { X, Settings, PauseCircle, PlayCircle, Save, HelpCircle } from 'lucide-react';
import { FMButton } from './FMUI';
import { resetOnboarding } from './OnboardingTour';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [pauseAtHalftime, setPauseAtHalftime] = useState(world.matchSettings.pauseAtHalftime);

  const handleSave = () => {
    world.matchSettings.pauseAtHalftime = pauseAtHalftime;
    onClose();
  };

  const handleReplayTutorial = () => {
    resetOnboarding();
    onClose();
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white/10/10 w-full max-w-sm rounded-sm border-2 border-slate-500 shadow-2xl overflow-hidden flex flex-col">
        <header className="p-4 bg-white/10/15 border-b border-white/15 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Settings size={20} className="text-white/70" />
             <h3 className="text-lg font-black text-white/90 uppercase italic tracking-tighter">Configuración</h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
           <div className="space-y-4">
              <h4 className="text-xs font-black text-white/50 uppercase tracking-widest border-b border-white/20 pb-1">Simulación de Partido</h4>
              
              <div className="flex flex-col gap-2">
                 <label className="flex items-center justify-between p-3 bg-white/15 border border-white/20 rounded-sm cursor-pointer hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PauseCircle size={18} className={pauseAtHalftime ? "text-blue-400" : "text-white/40"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white/90 uppercase">Pausar en el Entretiempo</span>
                          <span className="text-[9px] text-white/50 font-medium">Detener la simulación al minuto 45.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pauseAtHalftime ? 'border-blue-600' : 'border-white/15'}`}>
                       {pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={pauseAtHalftime} onChange={() => setPauseAtHalftime(true)} className="hidden" />
                 </label>

                 <label className="flex items-center justify-between p-3 bg-white/15 border border-white/20 rounded-sm cursor-pointer hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PlayCircle size={18} className={!pauseAtHalftime ? "text-blue-400" : "text-white/40"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white/90 uppercase">Simulación Continua</span>
                          <span className="text-[9px] text-white/50 font-medium">Avanzar hasta el final sin pausas.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!pauseAtHalftime ? 'border-blue-600' : 'border-white/15'}`}>
                       {!pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={!pauseAtHalftime} onChange={() => setPauseAtHalftime(false)} className="hidden" />
                 </label>
              </div>
           </div>

           <FMButton onClick={handleSave} className="w-full py-3">
              <Save size={14} /> Guardar Cambios
          </FMButton>
           <FMButton onClick={handleReplayTutorial} variant="secondary" className="w-full py-2">
              <HelpCircle size={14} /> Repetir Tutorial
          </FMButton>
       </div>
      </div>
    </div>
  );
};
