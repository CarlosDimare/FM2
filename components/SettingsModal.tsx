import React, { useState } from 'react';
import { world } from '../services/worldManager';
import { X, Settings, PauseCircle, PlayCircle, Save, HelpCircle, Gauge, Bell, Database } from 'lucide-react';
import { FMButton } from './FMUI';
import { resetOnboarding } from './OnboardingTour';
import { useUIStore } from '../stores/uiStore';
import { isNotificationEnabled, requestNotificationPermission } from '../services/notifications';

interface SettingsModalProps {
  onClose: () => void;
}

const SPEEDS = [1, 2, 4];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [pauseAtHalftime, setPauseAtHalftime] = useState(world.matchSettings.pauseAtHalftime);
  const [speed, setSpeed] = useState(world.matchSettings.speedMultiplier || 1);
  const [notificationsOn, setNotificationsOn] = useState(isNotificationEnabled());
  const isAutoSaveEnabled = useUIStore(s => s.isAutoSaveEnabled);
  const setIsAutoSaveEnabled = useUIStore(s => s.setIsAutoSaveEnabled);

  const handleToggleNotifications = async () => {
    if (notificationsOn) {
      localStorage.setItem('fm_arg_notifications_enabled', 'false');
      setNotificationsOn(false);
    } else {
      const ok = await requestNotificationPermission();
      setNotificationsOn(ok);
    }
  };

  const handleSave = () => {
    world.matchSettings.pauseAtHalftime = pauseAtHalftime;
    world.matchSettings.speedMultiplier = speed;
    onClose();
  };

  const handleReplayTutorial = () => {
    resetOnboarding();
    onClose();
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-200 w-full max-w-sm rounded-sm border-2 border-slate-500 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="p-4 bg-slate-300 border-b border-slate-400 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <Settings size={20} className="text-slate-700" />
             <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Configuración</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto custom-scroll">
           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-1">Simulación de Partido</h4>

              <div className="flex flex-col gap-2">
                 <label className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PauseCircle size={18} className={pauseAtHalftime ? "text-blue-600" : "text-slate-400"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 uppercase">Pausar en el Entretiempo</span>
                          <span className="text-[9px] text-slate-500 font-medium">Detener la simulación al minuto 45.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pauseAtHalftime ? 'border-blue-600' : 'border-slate-400'}`}>
                       {pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={pauseAtHalftime} onChange={() => setPauseAtHalftime(true)} className="hidden" />
                 </label>

                 <label className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PlayCircle size={18} className={!pauseAtHalftime ? "text-blue-600" : "text-slate-400"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 uppercase">Simulación Continua</span>
                          <span className="text-[9px] text-slate-500 font-medium">Avanzar hasta el final sin pausas.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!pauseAtHalftime ? 'border-blue-600' : 'border-slate-400'}`}>
                       {!pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={!pauseAtHalftime} onChange={() => setPauseAtHalftime(false)} className="hidden" />
                 </label>
              </div>

              <div>
                 <div className="flex items-center gap-1.5 mb-1.5">
                    <Gauge size={13} className="text-slate-500" />
                    <span className="text-[9px] font-black uppercase text-slate-600">Velocidad del partido en vivo</span>
                 </div>
                 <div className="flex bg-white border border-slate-300 rounded-sm overflow-hidden">
                    {SPEEDS.map(s => (
                       <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`flex-1 py-2 text-[10px] font-black uppercase transition-all ${speed === s ? 'bg-[#3a4a3a] text-white shadow-inner' : 'text-slate-600 hover:bg-slate-100'}`}
                       >
                          {s}x
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-1">Notificaciones y Guardado</h4>

              <button
                 onClick={handleToggleNotifications}
                 className="w-full flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors text-left"
              >
                 <div className="flex items-center gap-3">
                    <Bell size={18} className={notificationsOn ? "text-blue-600" : "text-slate-400"} />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-slate-900 uppercase">Notificaciones del navegador</span>
                       <span className="text-[9px] text-slate-500 font-medium">{notificationsOn ? 'Activadas — recibirás avisos de partidos, lesiones y traspasos.' : 'Desactivadas — pulsa para activar y pedir permiso.'}</span>
                    </div>
                 </div>
                 <div className={`w-9 h-5 rounded-full border flex items-center px-0.5 shrink-0 transition-colors ${notificationsOn ? 'bg-emerald-600 border-emerald-700 justify-end' : 'bg-slate-300 border-slate-400 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                 </div>
              </button>

              <label className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors group">
                 <div className="flex items-center gap-3">
                    <Database size={18} className={isAutoSaveEnabled ? "text-blue-600" : "text-slate-400"} />
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-slate-900 uppercase">Guardado automático</span>
                       <span className="text-[9px] text-slate-500 font-medium">Guarda al final de cada día simulado.</span>
                    </div>
                 </div>
                 <div className={`w-9 h-5 rounded-full border flex items-center px-0.5 shrink-0 transition-colors ${isAutoSaveEnabled ? 'bg-emerald-600 border-emerald-700 justify-end' : 'bg-slate-300 border-slate-400 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                 </div>
                 <input type="checkbox" checked={isAutoSaveEnabled} onChange={e => setIsAutoSaveEnabled(e.target.checked)} className="hidden" />
              </label>
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
