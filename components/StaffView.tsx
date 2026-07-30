
import React, { useState } from 'react';
import { Staff, ATTRIBUTE_LABELS } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor } from '../constants';
import { X, Briefcase, Activity, Calendar, History, Wallet, BookOpen, Trophy, Star, Shield, Zap, Target, Swords, MapPin } from 'lucide-react';
import { FMTable, FMTableCell } from './FMUI';

const TACTICAL_STYLE_LABELS: Record<string, string> = {
  CONTROL: 'Control',
  ATTACK: 'Ataque',
  DEFENSE: 'Defensa',
  COUNTER: 'Contraataque',
  BALANCED: 'Equilibrado',
};

const PRESS_LABELS: Record<string, string> = {
  LOW: 'Presión baja',
  MEDIUM: 'Presión media',
  HIGH: 'Presión alta',
};

const POSSESSION_LABELS: Record<string, string> = {
  POSSESSION: 'Posesión',
  COUNTER: 'Contraataque',
  BALANCED: 'Equilibrado',
};

const PERSONALITY_LABELS: Record<string, string> = {
  VISIONARY: 'Visionario',
  CALM: 'Calmado',
  PASSIONATE: 'Pasional',
  DISCIPLINARIAN: 'Disciplinado',
  LEADER: 'Líder',
};

function generateProfileText(staff: Staff): string {
  const parts: string[] = [];
  const attrs = staff.attributes;
  const maxAttr = Math.max(
    attrs.coaching, attrs.tacticalKnowledge, attrs.manManagement,
    attrs.motivation, attrs.judgingAbility, attrs.judgingPotential,
    attrs.adaptability, attrs.medical, attrs.physiotherapy
  );

  if (staff.biography) {
    parts.push(staff.biography);
  } else {
    if (attrs.coaching >= 15) parts.push('Destaca por su excepcional capacidad de entrenamiento.');
    else if (attrs.coaching >= 12) parts.push('Tiene un buen nivel de entrenamiento.');

    if (attrs.tacticalKnowledge >= 15) parts.push('Su conocimiento táctico es de primer nivel, prepara cada partido al detalle.');
    else if (attrs.tacticalKnowledge >= 10) parts.push('Maneja conceptos tácticos con solidez.');

    if (attrs.manManagement >= 15) parts.push('Excelente gestionando el vestuario y las relaciones con los jugadores.');
    else if (attrs.manManagement >= 10) parts.push('Sabe mantener la disciplina del grupo.');

    if (attrs.motivation >= 15) parts.push('Es un motivador nato que levanta el ánimo del equipo.');
    else if (attrs.motivation >= 10) parts.push('Sabe motivar al equipo en momentos clave.');

    if (attrs.judgingAbility >= 15) parts.push('Tiene un ojo clínico para detectar talento.');
    if (attrs.judgingPotential >= 15) parts.push('Especialista en evaluar el potencial de los jóvenes.');

    if (maxAttr <= 8) parts.push('Es un profesional de nivel medio que cumple con su rol.');
  }

  if (staff.preferredFormation) {
    parts.push(`Su sistema preferido es el ${staff.preferredFormation}.`);
  }

  if (staff.playingStyle) {
    parts.push(`Su estilo: ${staff.playingStyle}.`);
  }

  if (staff.personality) {
    const persona = ['Es un técnico', PERSONALITY_LABELS[staff.personality] || staff.personality];
    const flourish: Record<string, string> = {
      VISIONARY: 'con ideas innovadoras y vanguardistas.',
      CALM: 'que mantiene la calma ante cualquier situación.',
      PASSIONATE: 'que transmite energía y entusiasmo a sus equipos.',
      DISCIPLINARIAN: 'exigente y meticuloso con la disciplina táctica.',
      LEADER: 'un líder natural que inspira respeto y admiración.',
    };
    parts.push(`Es un técnico ${PERSONALITY_LABELS[staff.personality] || staff.personality}${flourish[staff.personality] ? `, ${flourish[staff.personality]}` : '.'}`);
  }

  return parts.join(' ');
}

interface StaffViewProps {
  staff: Staff[];
}

export const StaffView: React.FC<StaffViewProps> = ({ staff }) => {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'HEAD_COACH': return 'Director Técnico';
      case 'ASSISTANT_MANAGER': return 'Segundo Entrenador';
      case 'PHYSIO': return 'Fisioterapeuta';
      case 'FITNESS_COACH': return 'Preparador Físico';
      case 'RESERVE_MANAGER': return 'E. Reserva';
      case 'YOUTH_MANAGER': return 'E. Juveniles';
      case 'SCOUT': return 'Ojeador';
      default: return role;
    }
  };

  // Sort staff to show Head Coach first
  const sortedStaff = [...staff].sort((a, b) => {
     if (a.role === 'HEAD_COACH') return -1;
     if (b.role === 'HEAD_COACH') return 1;
     return 0;
  });

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-slate-300">
      <header className="mb-6 border-b border-slate-400 pb-4">
        <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Cuerpo Técnico</h2>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Los empleados que hacen funcionar al club.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-20 custom-scroll">
        {sortedStaff.map(s => (
          <div 
            key={s.id} 
            onClick={() => setSelectedStaff(s)}
            className={`p-6 rounded-sm border transition-all cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md ${s.role === 'HEAD_COACH' ? 'bg-blue-100 border-blue-400 hover:bg-blue-50 hover:border-blue-600' : 'bg-slate-200 border-slate-400 hover:border-slate-600 hover:bg-slate-100'}`}
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 ${s.role === 'HEAD_COACH' ? 'text-blue-900' : 'text-slate-900'}`}>
               <Briefcase size={64} />
            </div>
            <h3 className="text-lg font-black text-slate-950 mb-1 uppercase italic">{s.name}</h3>
            <p className={`${s.role === 'HEAD_COACH' ? 'text-blue-800 text-xs' : 'text-blue-700 text-[10px]'} font-black uppercase mb-4 tracking-widest`}>{getRoleLabel(s.role)}</p>
            <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase">
               <span>{s.nationality}</span>
               <span>{s.age} años</span>
            </div>
          </div>
        ))}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden animate-zoom-in">
            {(() => {
               const club = world.getClub(selectedStaff.clubId);
               const headerClasses = club ? `${club.primaryColor} ${club.secondaryColor}` : 'bg-slate-900 text-white';
               const borderColor = club && club.primaryColor === 'bg-white' ? 'border-slate-300' : 'border-black/20';
               
               return (
                  <header className={`${headerClasses} p-6 border-b ${borderColor} flex justify-between items-start`}>
                     <div>
                        <h3 className="text-2xl font-black truncate uppercase italic tracking-tighter">{selectedStaff.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{getRoleLabel(selectedStaff.role)}</p>
                        <div className="flex gap-3 mt-3 text-[10px] font-black uppercase tracking-tight opacity-90">
                           <span>{selectedStaff.nationality}</span>
                           <span>•</span>
                           <span>{selectedStaff.age} AÑOS</span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedStaff(null)} className="opacity-70 hover:opacity-100 transition-colors">
                        <X size={24} />
                     </button>
                  </header>
               );
            })()}
            
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
               {/* Perfil / Biografía */}
               <div>
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                   <BookOpen size={14} /> Perfil
                 </h4>
                 <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                   <p className="text-sm text-slate-700 leading-relaxed">
                     {generateProfileText(selectedStaff)}
                   </p>
                 </div>
               </div>

               {/* Perfil Táctico */}
               {(selectedStaff.preferredFormation || selectedStaff.tacticalStyle || selectedStaff.playingStyle) && (
                 <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                     <Shield size={14} /> Perfil Táctico
                   </h4>
                   <div className="bg-white rounded-sm border border-slate-200 shadow-sm">
                     {selectedStaff.preferredFormation && (
                       <div className="flex justify-between items-center p-3 border-b border-slate-100">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Formación Preferida</span>
                         <span className="text-sm text-slate-900 font-black">{selectedStaff.preferredFormation}</span>
                       </div>
                     )}
                     {selectedStaff.tacticalStyle && (
                       <div className="flex justify-between items-center p-3 border-b border-slate-100">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1"><Swords size={12} /> Estilo Táctico</span>
                         <span className="text-sm text-slate-900 font-black">{TACTICAL_STYLE_LABELS[selectedStaff.tacticalStyle] || selectedStaff.tacticalStyle}</span>
                       </div>
                     )}
                     {selectedStaff.pressIntensity && (
                       <div className="flex justify-between items-center p-3 border-b border-slate-100">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1"><Zap size={10} /> Intensidad de Presión</span>
                         <span className="text-sm text-slate-900 font-black">{PRESS_LABELS[selectedStaff.pressIntensity] || selectedStaff.pressIntensity}</span>
                       </div>
                     )}
                     {selectedStaff.possessionVsCounter && (
                       <div className="flex justify-between items-center p-3">
                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1"><Shield size={10} /> Enfoque</span>
                         <span className="text-sm text-slate-900 font-black">{POSSESSION_LABELS[selectedStaff.possessionVsCounter] || selectedStaff.possessionVsCounter}</span>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attributes Column */}
                  <div>
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                        <Activity size={14} /> Atributos Clave
                     </h4>
                     <div className="space-y-1 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                        {Object.entries(selectedStaff.attributes).map(([key, val]) => (
                           <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 group">
                              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wide group-hover:text-slate-900">{ATTRIBUTE_LABELS[key] || key}</span>
                              <span className={`font-black text-xs ${getAttributeColor(val as number)} bg-slate-50 px-2 py-0.5 rounded-sm min-w-[24px] text-center`}>{val as number}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Contract & History Column */}
                  <div className="space-y-6">
                     {/* Reputación y Relaciones */}
                     {(selectedStaff.reputation || selectedStaff.internationalReputation || selectedStaff.boardRelationship != null) && (
                       <div>
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                           <Star size={14} /> Reputación
                         </h4>
                         <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-3">
                           {selectedStaff.reputation && (
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] text-slate-500 font-bold uppercase">Reputación Nacional</span>
                               <span className="text-slate-900 font-black text-sm">{selectedStaff.reputation}/100</span>
                             </div>
                           )}
                           {selectedStaff.internationalReputation && (
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] text-slate-500 font-bold uppercase">Reputación Internacional</span>
                               <span className="text-slate-900 font-black text-sm">{selectedStaff.internationalReputation}/100</span>
                             </div>
                           )}
                           {selectedStaff.boardRelationship != null && (
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] text-slate-500 font-bold uppercase">Relación con Directiva</span>
                               <span className="text-slate-900 font-black text-sm">{selectedStaff.boardRelationship}/100</span>
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                     <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                           <Wallet size={14} /> Contrato
                        </h4>
                        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Sueldo</span>
                              <span className="text-slate-900 font-black text-sm">£{selectedStaff.salary.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Expira</span>
                              <span className="text-slate-900 font-black text-sm">{selectedStaff.contractExpiry ? selectedStaff.contractExpiry.toLocaleDateString() : 'N/A'}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 min-h-0 flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                           <History size={14} /> Historial
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex-1">
                           <FMTable headers={['Año', 'Club', 'Rol']} colWidths={['50px', 'auto', 'auto']}>
                              {selectedStaff.history && selectedStaff.history.length > 0 ? (
                                 selectedStaff.history.map((h, i) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                       <FMTableCell className="text-slate-500 font-mono">{h.year}</FMTableCell>
                                       <FMTableCell className="text-slate-900 font-bold">{world.getClub(h.clubId)?.name || 'Desconocido'}</FMTableCell>
                                       <FMTableCell className="text-slate-500 text-[9px] uppercase">{getRoleLabel(h.role)}</FMTableCell>
                                    </tr>
                                 ))
                              ) : (
                                 <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px]">Sin historial previo</td></tr>
                              )}
                           </FMTable>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Palmarés */}
               {selectedStaff.careerHonours && selectedStaff.careerHonours.length > 0 && (
                 <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                     <Trophy size={14} /> Palmarés
                   </h4>
                   <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                     <div className="flex flex-wrap gap-2">
                       {selectedStaff.careerHonours.map((honour, i) => (
                         <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-sm text-amber-900 font-bold text-[11px] uppercase tracking-wide">
                           {honour}
                         </span>
                       ))}
                     </div>
                   </div>
                 </div>
               )}

               {/* Clubes Anteriores */}
               {selectedStaff.previousClubs && selectedStaff.previousClubs.length > 0 && (
                 <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                     <MapPin size={14} /> Clubes Anteriores
                   </h4>
                   <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                     {selectedStaff.previousClubs.map((prev, i) => (
                       <div key={i} className="p-4 border-b border-slate-100 last:border-0">
                         <div className="flex justify-between items-start">
                           <div>
                             <span className="text-slate-900 font-black text-sm">{prev.clubName}</span>
                             <span className="text-slate-500 text-[10px] ml-2">{prev.years}</span>
                           </div>
                         </div>
                         {prev.titles.length > 0 && (
                           <div className="flex flex-wrap gap-1 mt-2">
                             {prev.titles.map((t, j) => (
                               <span key={j} className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-sm text-amber-800 font-bold text-[9px]">
                                 {t}
                               </span>
                             ))}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
