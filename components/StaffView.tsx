
import React, { useState } from 'react';
import { Staff, Club, STAFF_ATTRIBUTE_LABELS } from '../types';
import { world } from '../services/worldManager';
import { notifyClubs, useWorldStore } from '../stores/worldStore';
import { getAttributeColor } from '../constants';
import { getFlagUrl } from '../data/static';
import { X, Activity, Calendar, History, Wallet, BookOpen, Trophy, Star, Shield, Zap, Target, Swords, MapPin, Users, ClipboardList, Dumbbell, Mic, MessageCircle, GraduationCap, Binoculars } from 'lucide-react';
import { FMBox, FMTable, FMTableCell } from './FMUI';

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

const getRoleShort = (role: string) => {
  switch(role) {
    case 'HEAD_COACH': return 'DT';
    case 'ASSISTANT_MANAGER': return 'AYDT';
    case 'PHYSIO': return 'FISIO';
    case 'FITNESS_COACH': return 'PF';
    case 'RESERVE_MANAGER': return 'RESERVA';
    case 'YOUTH_MANAGER': return 'SUB-20';
    case 'SCOUT': return 'OJEADOR';
    default: return role;
  }
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
  club?: Club;
}

export const StaffView: React.FC<StaffViewProps> = ({ staff, club }) => {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'DELEGACION'>('PERSONAL');
  const clubs = useWorldStore(s => s.clubs);
  const liveClub = clubs.find(c => c.id === club?.id) || club;

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

  const DELEGABLE_TASKS: { key: 'trainingDelegatedTo' | 'pressDelegatedTo' | 'talksDelegatedTo' | 'reserveDelegatedTo' | 'u20DelegatedTo' | 'scoutingDelegatedTo'; label: string; icon: React.ReactNode; desc: string; suggestedRoles: string[] }[] = [
    { key: 'trainingDelegatedTo', label: 'Entrenamiento', icon: <Dumbbell size={14} />, desc: 'Planificar y dirigir las sesiones de entrenamiento del primer equipo.', suggestedRoles: ['ASSISTANT_MANAGER', 'FITNESS_COACH', 'HEAD_COACH'] },
    { key: 'pressDelegatedTo', label: 'Conferencia de Prensa', icon: <Mic size={14} />, desc: 'Atender a los medios antes y después de cada partido.', suggestedRoles: ['ASSISTANT_MANAGER', 'HEAD_COACH'] },
    { key: 'talksDelegatedTo', label: 'Charlas de Equipo', icon: <MessageCircle size={14} />, desc: 'Dar la charla técnica y la motivacional en el descanso.', suggestedRoles: ['ASSISTANT_MANAGER', 'HEAD_COACH'] },
    { key: 'reserveDelegatedTo', label: 'Dirección del Equipo Reserva', icon: <Users size={14} />, desc: 'Gestionar partidos, formación y decisiones del equipo reserva.', suggestedRoles: ['RESERVE_MANAGER', 'ASSISTANT_MANAGER'] },
    { key: 'u20DelegatedTo', label: 'Dirección de Sub-20', icon: <GraduationCap size={14} />, desc: 'Gestionar partidos, formación y decisiones de los juveniles.', suggestedRoles: ['YOUTH_MANAGER', 'ASSISTANT_MANAGER'] },
    { key: 'scoutingDelegatedTo', label: 'Scouting', icon: <Binoculars size={14} />, desc: 'Solicitar informes y seguir a los jugadores objetivo.', suggestedRoles: ['SCOUT', 'ASSISTANT_MANAGER'] },
  ];

  const setDelegation = (key: string, staffId: string | undefined) => {
    if (!liveClub) return;
    if (staffId) liveClub[key as 'trainingDelegatedTo'] = staffId;
    else delete liveClub[key as 'trainingDelegatedTo'];
    notifyClubs();
  };

  const getDelegatedName = (staffId?: string) => {
    if (!staffId) return null;
    return staff.find(s => s.id === staffId)?.name || null;
  };

  const getDelegationBadges = (s: Staff) => {
    if (!liveClub) return [];
    return [
      liveClub.trainingDelegatedTo === s.id && 'Entreno',
      liveClub.pressDelegatedTo === s.id && 'Prensa',
      liveClub.talksDelegatedTo === s.id && 'Charlas',
      liveClub.reserveDelegatedTo === s.id && 'Reserva',
      liveClub.u20DelegatedTo === s.id && 'Sub-20',
      liveClub.scoutingDelegatedTo === s.id && 'Scouting',
    ].filter(Boolean) as string[];
  };

  const renderDelegationTab = () => (
    <div className="flex-1 overflow-y-auto custom-scroll pb-24">
      {!liveClub ? (
        <div className="p-12 text-center text-slate-500 font-black uppercase text-[10px] tracking-widest">Selecciona un club para gestionar delegaciones</div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="bg-[#e8ece8] border border-[#a0b0a0] rounded-sm p-3 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
              <ClipboardList size={14} /> Delegación de Tareas
            </p>
            <p className="text-[9px] text-slate-500 mt-1">Asigna responsabilidades a tu cuerpo técnico para ocuparte solo de lo que importa. Tareas sin delegar quedan a tu cargo.</p>
          </div>
          {DELEGABLE_TASKS.map(task => {
            const delegatedId = liveClub[task.key];
            const delegatedName = getDelegatedName(delegatedId);
            const candidates = staff.filter(s => task.suggestedRoles.includes(s.role));
            return (
              <div key={task.key} className="bg-white border border-[#a0b0a0] rounded-sm shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#a0b0a0] bg-[#f2f7f2]">
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border ${delegatedId ? 'bg-green-100 border-green-400 text-green-800' : 'bg-slate-200 border-slate-400 text-slate-600'}`}>
                    {task.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-900">{task.label}</p>
                    <p className="text-[9px] text-slate-500 leading-snug mt-0.5">{task.desc}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-sm border shrink-0 ${delegatedId ? 'bg-green-50 text-green-800 border-green-300' : 'bg-amber-50 text-amber-800 border-amber-300'}`}>
                    {delegatedId ? 'Delegada' : 'A tu cargo'}
                  </span>
                </div>
                <div className="px-4 py-3">
                  {delegatedId && (
                    <div className="mb-2 px-3 py-2 bg-green-50 border border-green-300 rounded-sm text-[10px] font-black uppercase tracking-wide text-green-900 flex items-center justify-between">
                      <span>A cargo de: {delegatedName}</span>
                      <button onClick={() => setDelegation(task.key, undefined)} className="text-green-900 underline">Retirar</button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setDelegation(task.key, undefined)}
                      className={`px-3 py-2 text-[9px] font-black uppercase rounded-sm border transition-all ${!delegatedId ? 'bg-[#3a4a3a] text-white border-[#2a3a2a] shadow-md' : 'bg-white text-slate-600 border-[#a0b0a0] hover:bg-[#f2f7f2]'}`}>
                      Tú
                    </button>
                    {candidates.map(s => (
                      <button key={s.id} onClick={() => setDelegation(task.key, s.id)}
                        className={`px-3 py-2 text-[9px] font-black uppercase rounded-sm border transition-all ${delegatedId === s.id ? 'bg-green-700 text-white border-green-900 shadow-md' : 'bg-white text-slate-700 border-[#a0b0a0] hover:border-[#3a4a3a] hover:bg-[#f2f7f2]'}`}>
                        {s.name}
                      </button>
                    ))}
                    {candidates.length === 0 && (
                      <span className="text-[9px] text-slate-400 italic">No hay empleados aptos para esta tarea.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#d4dcd4]" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <header className="mb-4 border-b border-[#a0b0a0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Cuerpo Técnico</h2>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Los empleados que hacen funcionar al club.</p>
        </div>
        <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] self-start sm:self-auto shadow-sm">
          <button onClick={() => setActiveTab('PERSONAL')} className={`px-4 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all flex items-center gap-1.5 ${activeTab === 'PERSONAL' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>
            <Users size={12} /> Personal
          </button>
          <button onClick={() => setActiveTab('DELEGACION')} className={`px-4 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all flex items-center gap-1.5 ${activeTab === 'DELEGACION' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>
            <ClipboardList size={12} /> Delegación
          </button>
        </div>
      </header>

      {activeTab === 'PERSONAL' ? (
      <div className="flex-1 min-h-0 pb-24">
        <FMBox title={`Cuerpo Técnico (${sortedStaff.length})`} className="h-full" noPadding>
          {/* Desktop Table View */}
          <div className="hidden md:block h-full overflow-hidden">
            <FMTable
              headers={['Rol', 'Nombre', 'Edad', 'Nacionalidad', 'Rep', 'Sueldo', 'Delegaciones']}
              colWidths={['70px', 'auto', '40px', '90px', '40px', '70px', '150px']}
            >
              {sortedStaff.map((s, idx) => {
                const badges = getDelegationBadges(s);
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStaff(s)}
                    className={`
                      cursor-pointer transition-colors border-b border-[#e0e0e0]
                      ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                      hover:bg-[#ccd9cc]
                      ${s.role === 'HEAD_COACH' ? 'font-bold' : ''}
                    `}
                  >
                    <FMTableCell className="text-center text-slate-700 font-bold">{getRoleShort(s.role)}</FMTableCell>
                    <FMTableCell className="text-slate-900">
                      <div className="flex items-center min-w-0">
                        <img src={getFlagUrl(s.nationality)} alt={s.nationality} className="w-4 h-3 object-cover shadow-sm rounded-[1px] mr-2 shrink-0 border border-slate-300" />
                        <span className="truncate">{s.name}</span>
                        {s.role === 'HEAD_COACH' && s.reputation && (
                          <span className="ml-2 flex items-center gap-0.5 text-amber-700 shrink-0"><Star size={10} className="fill-amber-500" /> {s.reputation}</span>
                        )}
                      </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>{s.age}</FMTableCell>
                    <FMTableCell className="text-slate-500 text-[10px]">{s.nationality}</FMTableCell>
                    <FMTableCell className="text-center font-bold" isNumber>{s.reputation ?? '-'}</FMTableCell>
                    <FMTableCell className="text-right font-bold" isNumber>£{(s.salary / 1000).toFixed(0)}k</FMTableCell>
                    <FMTableCell>
                      <div className="flex flex-wrap gap-1">
                        {badges.length > 0 ? badges.map(b => (
                          <span key={b} className="px-1.5 py-0.5 bg-green-100 border border-green-400 rounded-sm text-green-800 text-[8px] font-black uppercase whitespace-nowrap">{b}</span>
                        )) : <span className="text-slate-300 text-[9px]">—</span>}
                      </div>
                    </FMTableCell>
                  </tr>
                );
              })}
            </FMTable>
          </div>

          {/* Mobile Table View */}
          <div className="md:hidden h-full overflow-hidden">
            <FMTable
              headers={['Rol', 'Nombre', 'Edad', 'Delegaciones']}
              colWidths={['56px', 'auto', '36px', '120px']}
            >
              {sortedStaff.map((s, idx) => {
                const badges = getDelegationBadges(s);
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStaff(s)}
                    className={`
                      cursor-pointer transition-colors border-b border-[#e0e0e0]
                      ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                      hover:bg-[#ccd9cc]
                      ${s.role === 'HEAD_COACH' ? 'font-bold' : ''}
                    `}
                  >
                    <FMTableCell className="text-center text-slate-700 font-bold text-[9px] px-1">{getRoleShort(s.role)}</FMTableCell>
                    <FMTableCell className="text-slate-900 px-2">
                      <div className="flex items-center min-w-0">
                        <img src={getFlagUrl(s.nationality)} alt={s.nationality} className="w-3 h-2 object-cover shadow-sm rounded-[1px] mr-1.5 shrink-0 border border-slate-300" />
                        <span className="truncate max-w-[110px] text-[10px]">{s.name}</span>
                        {s.role === 'HEAD_COACH' && s.reputation && (
                          <span className="ml-1.5 flex items-center gap-0.5 text-amber-700 shrink-0"><Star size={9} className="fill-amber-500" /> {s.reputation}</span>
                        )}
                      </div>
                    </FMTableCell>
                    <FMTableCell className="text-center font-bold text-[10px]" isNumber>{s.age}</FMTableCell>
                    <FMTableCell>
                      <div className="flex flex-wrap gap-1">
                        {badges.length > 0 ? badges.map(b => (
                          <span key={b} className="px-1 py-0.5 bg-green-100 border border-green-400 rounded-sm text-green-800 text-[7px] font-black uppercase whitespace-nowrap">{b}</span>
                        )) : <span className="text-slate-300 text-[9px]">—</span>}
                      </div>
                    </FMTableCell>
                  </tr>
                );
              })}
            </FMTable>
          </div>
        </FMBox>
      </div>
      ) : renderDelegationTab()}

      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden animate-zoom-in">
            {(() => {
               const club = world.getClub(selectedStaff.clubId);
               const headerClasses = club ? `${club.primaryColor} ${club.secondaryColor}` : 'bg-[#3a4a3a] text-white';
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
                              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wide group-hover:text-slate-900">{STAFF_ATTRIBUTE_LABELS[key] || key}</span>
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
