import React, { useEffect } from 'react';
import { Club, Player } from '../types';
import { Play, Clipboard, ShieldCheck, AlertOctagon, Info, Settings } from 'lucide-react';
import { FMBox, FMButton } from './FMUI';
import { useDialogueStore } from '../stores/dialogueStore';
import { detectManagerInitiatedTriggers } from '../services/playerDialogueTriggers';
import { DialogueAvatar } from './dialogs/DialogueAvatar';
import { checkAssistantTrigger } from '../services/dialogueTriggers';

interface PreMatchViewProps {
  club: Club;
  opponent: Club;
  starters: Player[];
  onStart: () => void;
  onGoToTactics: () => void;
  nextFixture?: import('../types').Fixture;
}

export const PreMatchView: React.FC<PreMatchViewProps> = ({ club, opponent, starters, onStart, onGoToTactics, nextFixture }) => {
  const invalidStarters = starters.filter(p => p.injury || (p.suspension && p.suspension.matchesLeft > 0));
  const hasInvalidStarters = invalidStarters.length > 0;
  const isReady = starters.length === 11 && !hasInvalidStarters;

  const assistantTrigger = checkAssistantTrigger({
    currentView: 'PRE_MATCH',
    currentDate: new Date(),
    userClubId: club.id,
    nextFixture,
  });

  useEffect(() => {
    detectManagerInitiatedTriggers(club.id, 'PRE_MATCH');
  }, [club.id]);

  return (
    <div className="h-full flex flex-col bg-[#d4dcd4] overflow-hidden" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="flex-1 overflow-y-auto custom-scroll pb-32 md:pb-0">
         <div className="max-w-5xl mx-auto md:my-8 bg-white md:rounded-sm border-x md:border border-[#a0b0a0] shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <header className="p-4 sm:p-8 bg-[#e8ece8] border-b border-[#a0b0a0] flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl sm:text-3xl shadow-lg border-2 sm:border-4 border-white ${club.primaryColor} ${club.primaryColor === 'bg-white' ? 'text-slate-900 border-[#a0b0a0]' : ''}`}>{club.shortName}</div>
              <div className="text-3xl sm:text-5xl font-black text-slate-400 italic tracking-tighter">VS</div>
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl sm:text-3xl shadow-lg border-2 sm:border-4 border-white ${opponent.primaryColor} ${opponent.primaryColor === 'bg-white' ? 'text-slate-900 border-[#a0b0a0]' : ''}`}>{opponent.shortName}</div>
            </div>
            <div className="text-center sm:text-right">
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase italic tracking-tighter">La Previa</h2>
              <p className="text-slate-700 font-black text-[9px] sm:text-[11px] uppercase tracking-[0.2em] bg-white border border-[#a0b0a0] px-3 py-1 mt-1 rounded-sm">{club.stadium}</p>
            </div>
          </header>

          {/* Body Content */}
          <div className="p-4 sm:p-10 flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12 bg-white">
            
            {/* Squad List */}
            <div className="flex flex-col">
              <h3 className="text-slate-600 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2 border-b border-[#a0b0a0] pb-2">
                <Clipboard size={14}/> FORMACIÓN TITULAR
              </h3>
              <div className="space-y-1">
                {starters.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-[#a0b0a0] rounded-sm bg-[#f2f7f2] text-center text-slate-600 font-black italic uppercase tracking-widest text-[10px]">Alineación no definida</div>
                ) : (
                  starters.sort((a,b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0)).map(p => (
                    <div key={p.id} className={`flex items-center justify-between p-3 rounded-sm border-b transition-colors ${p.injury || p.suspension ? 'bg-red-50 border-red-200' : 'bg-[#f2f7f2] border-[#a0b0a0]'}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-sm bg-[#3a4a3a] flex items-center justify-center text-[9px] font-black text-white shrink-0">{p.positions[0]}</span>
                        <div className="flex flex-col">
                           <span className="text-slate-900 font-black uppercase text-xs italic">{p.name}</span>
                           {(p.injury || p.suspension) && <span className="text-[8px] text-red-700 font-black uppercase">No disponible</span>}
                        </div>
                      </div>
                      <span className="text-slate-900 font-black text-[10px]">{(p.currentAbility/20).toFixed(1)} ★</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tactical Info & Actions (Actions hidden on mobile, using sticky instead) */}
            <div className="flex flex-col gap-6">
              <div className="bg-[#f2f7f2] p-6 rounded-sm border border-[#a0b0a0]">
                <h4 className="text-slate-900 font-black mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest border-b border-[#a0b0a0] pb-2"><ShieldCheck size={16}/> Informe del Cuerpo Técnico</h4>
                <p className="text-slate-700 text-sm italic font-black leading-relaxed">"Todo listo, Jefe. El equipo tiene un promedio de {Math.round(starters.reduce((acc, p) => acc + p.fitness, 0) / (starters.length || 1))}% de condición física para hoy."</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#f2f7f2] p-4 rounded-sm border border-[#a0b0a0] text-center">
                    <span className="block text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Reputación Local</span>
                    <span className="text-3xl font-black text-slate-900 italic">{(club.reputation/2000).toFixed(1)}</span>
                 </div>
                 <div className="bg-[#f2f7f2] p-4 rounded-sm border border-[#a0b0a0] text-center">
                    <span className="block text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Reputación Rival</span>
                    <span className="text-3xl font-black text-slate-900 italic">{(opponent.reputation/2000).toFixed(1)}</span>
                 </div>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex flex-col gap-3 mt-auto pt-6 border-t border-[#a0b0a0]">
                <button 
                  onClick={onStart}
                  disabled={!isReady}
                  className={`w-full py-6 flex items-center justify-center gap-4 rounded-sm font-black uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 text-lg border-2 ${!isReady ? 'bg-[#bcc8bc] text-slate-500 border-[#a0b0a0] cursor-not-allowed' : 'bg-[#3a4a3a] hover:bg-[#2a3a2a] text-white border-[#2a3a2a]'}`}
                >
                  <Play size={20} fill="white" /> COMENZAR PARTIDO
                </button>
                <button 
                  onClick={onGoToTactics}
                  className="w-full py-3 text-slate-700 hover:text-slate-900 transition-colors text-[9px] font-black tracking-widest uppercase border border-[#a0b0a0] bg-[#e8ece8] rounded-sm hover:bg-[#d4dcd4]"
                >
                  Ajustar Tácticas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FOOTER */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#d4dcd4] to-[#e8ece8] border-t-4 border-[#3a4a3a] p-4 z-[120] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] flex flex-col gap-3">
         {!isReady && (
            <div className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest py-1 px-3 text-center rounded-sm">
               Alineación incompleta o no válida
            </div>
         )}
         <div className="flex gap-2">
            <button 
               onClick={onGoToTactics}
               className="flex-1 bg-white border-2 border-[#a0b0a0] py-4 rounded-sm text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
               <Settings size={14} /> TÁCTICAS
            </button>
            <button 
               onClick={onStart}
               disabled={!isReady}
               className={`flex-[2] py-4 rounded-sm font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all ${!isReady ? 'bg-[#bcc8bc] text-slate-500 cursor-not-allowed' : 'bg-[#3a4a3a] text-white active:scale-95'}`}
            >
               <Play size={14} fill="currentColor" /> COMENZAR
            </button>
          </div>
       </div>
       {club && (
         <DialogueAvatar
           clubColor={club.primaryColor}
           cargo="Ayudante de Campo"
           badge={assistantTrigger}
           onClick={() => useDialogueStore.getState().open('ASSISTANT', { clubId: club.id, opponentId: opponent.id, source: 'PRE_MATCH' })}
         />
       )}
     </div>
   );
};
