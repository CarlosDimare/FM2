
import React, { useState, useMemo } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position, SquadType, DialogueTone, POSITION_FULL_NAMES, PlayerHistoryEntry, PLAYER_PERSONALITY_LABELS, PLAYER_PERSONALITY_DESC } from '../types';
import { world } from '../services/worldManager';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Map, FileText, History, Minus, ShieldAlert, ArrowRightLeft, UserX, UserPlus, Users, MessageCircle, AlertCircle, Info, Award, ShieldAlert as DisciplineIcon, Shield, User, Star, ChevronLeft, ChevronRight, Cake, Ruler, Weight, UserCircle } from 'lucide-react';
import { FMTable, FMTableCell, FMButton, FMBox } from './FMUI';
import { getFlagUrl } from '../data/static';
import { getPlayerTag } from '../services/playerGenerator';
import { useNavStore } from '../stores/navStore';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  userClubId?: string;
  currentDate: Date;
}

// Coordenadas para el mapa de posiciones
const POSITION_COORDS: Record<string, { x: number, y: number }> = {
  'P': { x: 50, y: 90 },
  'DFC': { x: 50, y: 75 },
  'LD': { x: 85, y: 75 },
  'LI': { x: 15, y: 75 },
  'MCD': { x: 50, y: 60 },
  'MC': { x: 50, y: 45 },
  'MD': { x: 85, y: 45 },
  'MI': { x: 15, y: 45 },
  'MPC': { x: 50, y: 30 },
  'ED': { x: 85, y: 20 },
  'EI': { x: 15, y: 20 },
  'DC': { x: 50, y: 15 },
};

const getKeyAttributes = (pos: Position): string[] => {
  switch (pos) {
    case Position.GK: return ['anticipacion', 'velocidad', 'fuerza', 'decision'];
    case Position.DC: return ['anticipacion', 'fuerza', 'posicionamiento', 'agresividad'];
    case Position.DR: case Position.DL: return ['velocidad', 'resistencia', 'pase', 'anticipacion'];
    case Position.DM: return ['anticipacion', 'fuerza', 'pase', 'posicionamiento'];
    case Position.MC: return ['pase', 'vision', 'control', 'decision'];
    case Position.AM: return ['regate', 'vision', 'control', 'velocidad'];
    case Position.ST: return ['disparo', 'velocidad', 'posicionamiento', 'control'];
    default: return ['pase', 'decision', 'resistencia'];
  }
};

const getPlayerTagLabel = (player: Player): string => {
  return getPlayerTag(player);
};

const VISIBLE_INTERNAL_MAP: Record<string, string[]> = {
  fisico: ['velocidad', 'resistencia', 'fuerza'],
  mental: ['anticipacion', 'decision', 'posicionamiento', 'vision'],
  tecnica: ['control', 'pase', 'regate', 'disparo'],
  agresividad: ['agresividad'],
  polivalencia: ['polivalencia'],
};

const VisibleAttrCard: React.FC<{
  label: string;
  value: number;
  isKey: boolean;
  expanded: boolean;
  onToggle: () => void;
  internals: Record<string, number>;
  internalKeys: string[];
}> = ({ label, value, isKey, expanded, onToggle, internals, internalKeys }) => {
  const pct = Math.round((value / 20) * 100);
  const barColor = value >= 16 ? 'bg-blue-700' : value >= 11 ? 'bg-blue-500/100' : value >= 7 ? 'bg-slate-400' : 'bg-white/15';
  const textColor = value >= 16 ? 'text-blue-900' : value >= 11 ? 'text-blue-700' : 'text-white/50';

  return (
    <div className={`border border-white/10 rounded-sm overflow-hidden transition-all ${expanded ? 'bg-white/10 shadow-md' : 'bg-white/10 hover:shadow-sm cursor-pointer'}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
        <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 ${isKey ? 'bg-blue-500/15 border border-blue-300' : 'bg-white/10 border border-white/10'}`}>
          <span className={`text-lg font-black ${textColor}`}>{value}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-white/70">{ATTRIBUTE_LABELS[label] || label}</span>
            <span className="text-[9px] font-bold text-white/40">{pct}%</span>
          </div>
          <div className="h-2 bg-white/10/10 rounded-full overflow-hidden border border-white/10">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {isKey && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
        <ChevronRight size={14} className={`text-white/40 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-white/10/50 bg-[#f8faf8] px-3 py-2 space-y-1.5">
          {internalKeys.map(ik => {
            const iv = internals[ik];
            const iPct = Math.round((iv / 20) * 100);
            const iBarColor = iv >= 16 ? 'bg-blue-700' : iv >= 11 ? 'bg-blue-500/100' : iv >= 7 ? 'bg-slate-400' : 'bg-white/15';
            const iTextColor = iv >= 16 ? 'text-blue-800' : iv >= 11 ? 'text-blue-400' : 'text-white/50';
            return (
              <div key={ik} className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/50 uppercase w-20 truncate">{ATTRIBUTE_LABELS[ik] || ik}</span>
                <div className="flex-1 h-1.5 bg-white/10/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${iBarColor}`} style={{ width: `${iPct}%` }} />
                </div>
                <span className={`text-[10px] font-black w-5 text-right ${iTextColor}`}>{iv}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, userClubId, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PERSONAL' | 'POSITIONS' | 'HISTORY' | 'CONTRACT' | 'INTERACTION'>('PROFILE');
  const [expandedVisible, setExpandedVisible] = useState<string | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  const { comparePlayerA, setComparePlayerA, setComparePlayerB } = useNavStore();
  
  // Dialogue state
  const [dialogueType, setDialogueType] = useState<DialogueType>('PRAISE_FORM');
  const [dialogueTone, setDialogueTone] = useState<DialogueTone>('MODERATE');
  const [dialogueResult, setDialogueResult] = useState<DialogueResult | null>(null);

  if (!player) return null;
  
  const club = world.getClub(player.clubId);
  const headline = ProfileNarrativeEngine.generateHeadline(player);
  const personality = ProfileNarrativeEngine.getPersonalityLabel(player);
  const isUserPlayer = player.clubId === userClubId;
  const keyAttributes = getKeyAttributes(player.positions[0]);

  const handleRescind = () => {
     if (confirm("¿Estás seguro de rescindir el contrato?")) {
        world.rescindContract(player.id, currentDate);
        onClose();
     }
  };

  const handleTalk = () => {
    const result = DialogueSystem.resolveCoachPlayerInteraction(player, dialogueType, dialogueTone, currentDate);
    setDialogueResult(result);
    player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
  };

  const clubBg = club ? club.primaryColor : 'bg-white';
  const clubText = club ? club.secondaryColor : 'text-blue-900';
  const isHeaderLight = clubBg === 'bg-white';

  const personalityLabel = player.personality
    ? (PLAYER_PERSONALITY_LABELS[player.personality] || ProfileNarrativeEngine.getPersonalityLabel(player))
    : ProfileNarrativeEngine.getPersonalityLabel(player);
  const personalityDesc = player.personality ? PLAYER_PERSONALITY_DESC[player.personality] : '';

  const personalMotive = ((player.morale < 40 || player.fitness < 60) && player.clubId);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-white/10/10 backdrop-blur-xl w-full h-full md:h-auto md:max-w-6xl md:rounded-sm shadow-2xl border border-white/10 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className={`${clubBg} p-3 md:p-4 border-b ${isHeaderLight ? 'border-white/10' : 'border-black/20'} flex items-start gap-3 md:gap-4 shrink-0 relative transition-colors duration-500`}>
             <div className="w-20 h-24 md:w-24 md:h-28 bg-white/10 border border-white/10 rounded-sm overflow-hidden flex items-center justify-center shrink-0 shadow-md relative">
                {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
                <div className="absolute bottom-1 right-1 w-4 h-3 md:w-5 md:h-4 shadow-sm border border-white">
                    <img src={getFlagUrl(player.nationality)} className="w-full h-full object-cover" />
                </div>
             </div>

             <div className="flex-1 flex flex-col gap-0.5 md:gap-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                    <h2 className={`text-xl md:text-3xl font-black ${clubText} uppercase italic tracking-tighter drop-shadow-sm truncate`} style={{ fontFamily: 'Verdana' }}>{player.name}</h2>
                    <div className="flex items-center gap-1">
                      <span className={`hidden md:inline text-xl font-bold opacity-40 ${clubText}`}> - </span>
                      <h3 className={`text-xs md:text-xl font-black ${clubText} uppercase italic tracking-tighter opacity-70 truncate`}>{club?.name || 'Agente Libre'}</h3>
                    </div>
                </div>

                <div className={`flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1 text-[8px] md:text-[10px] font-black uppercase tracking-tight ${isHeaderLight ? 'text-white/50' : 'text-white/60'}`} style={{ fontFamily: 'Verdana' }}>
                   <span className={`${isHeaderLight ? 'bg-white/10 text-white/80' : 'bg-black/20 text-white'} px-1.5 py-0.5 rounded-sm`}>{POSITION_FULL_NAMES[player.positions[0]] || player.positions[0]}</span>
                   <span>{player.nationality.toUpperCase()}</span>
                   <span>• {player.age} AÑOS</span>
                   <span className="hidden md:inline">• {player.height} CM</span>
                </div>

                <div className={`text-[9px] md:text-[12px] font-black italic uppercase mt-1 md:mt-2 px-2 py-1 md:px-3 md:py-1.5 rounded-sm inline-block self-start ${isHeaderLight ? 'bg-blue-500/10 text-blue-800 border border-blue-100' : 'bg-black/30 text-white border border-white/10 shadow-inner'}`}>
                   "{headline.toUpperCase()}"
                </div>

                <div className="flex items-center gap-2 mt-1 md:mt-2">
                    <span className={`text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase border ${isHeaderLight ? 'bg-blue-500/15 text-blue-800 border-blue-200' : 'bg-white/10 text-white border-white/20'}`}>{personalityLabel}</span>
                    <div className={`ml-auto px-1.5 py-0.5 rounded-sm border ${isHeaderLight ? 'bg-white/10 border-white/10' : 'bg-black/20 border-white/10'}`}>
                        <span className={`text-[7px] md:text-[9px] font-black uppercase ${isHeaderLight ? 'text-green-400' : 'text-green-400'}`}>LEAL</span>
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setComparePlayerA(player); }} className={`p-1 transition-colors ${isHeaderLight ? 'text-white/40 hover:text-blue-400' : 'text-white/40 hover:text-blue-400'}`} title="Comparar"><ArrowRightLeft size={16} /></button>
                <button onClick={onClose} className={`p-1 transition-colors ${isHeaderLight ? 'text-white/40 hover:text-red-600' : 'text-white/40 hover:text-white'}`}><X size={20} md:size={24} /></button>
             </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex bg-white/10/10 border-b border-white/10 divide-x divide-[#a0b0a0]/50 shrink-0 overflow-x-auto scrollbar-hide">
             {[
                { id: 'PROFILE', icon: Activity }, { id: 'PERSONAL', icon: Info }, { id: 'POSITIONS', icon: Map },
                { id: 'HISTORY', icon: History }, { id: 'CONTRACT', icon: FileText }, { id: 'INTERACTION', icon: MessageSquare }
             ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 transition-colors ${activeTab === t.id ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5 text-white/60'}`}>
                    <t.icon size={16} md:size={18} className="mx-auto" />
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-white/10/5 p-2 md:p-3 relative">
             {activeTab === 'PROFILE' && (
                <div className="h-full flex flex-col gap-2 overflow-hidden">
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden">
                      {/* VISIBLES - Main column */}
                      <div className="md:col-span-2 flex flex-col overflow-hidden">
                         <div className="px-2 py-1.5 mb-2 bg-gradient-to-r from-[#3a4a3a] to-[#2a3a2a] rounded-sm shrink-0">
                            <h3 className="text-white font-black text-[9px] uppercase tracking-widest">ATRIBUTOS VISIBLES</h3>
                         </div>
                         <div className="flex-1 overflow-y-auto custom-scroll space-y-1.5 pr-1">
                            {(['fisico', 'mental', 'tecnica', 'agresividad', 'polivalencia'] as const).map(k => (
                              <VisibleAttrCard
                                key={k}
                                label={k}
                                value={player.stats.visible[k]}
                                isKey={keyAttributes.includes(k)}
                                expanded={expandedVisible === k}
                                onToggle={() => setExpandedVisible(expandedVisible === k ? null : k)}
                                internals={player.stats.internal}
                                internalKeys={VISIBLE_INTERNAL_MAP[k]}
                              />
                            ))}
                         </div>
                      </div>

                      {/* ESTADO - Side column */}
                      <div className="flex flex-col gap-2 overflow-hidden">
                         <div className="bg-white/10/10 border border-white/10 shrink-0 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] px-2 py-1 border-b border-white/10"><span className="text-[#1a1a1a] font-black text-[7px] uppercase tracking-widest">ESTADO ACTUAL</span></div>
                            <div className="p-1 flex flex-col">
                                <div className="flex justify-between items-center px-1.5 py-1 hover:bg-white/5 transition-colors border-b border-black/5"><span className="text-[7px] font-black text-white/50 uppercase">Condición</span><span className="text-[10px] font-black text-green-400">{Math.round(player.fitness)}%</span></div>
                                <div className="flex justify-between items-center px-1.5 py-1 hover:bg-white/5 transition-colors border-b border-black/5"><span className="text-[7px] font-black text-white/50 uppercase">Moral</span><span className={`text-[10px] font-black ${player.morale > 80 ? 'text-green-400' : player.morale > 50 ? 'text-blue-700' : 'text-red-600'}`}>{player.morale > 80 ? 'MUY ALTA' : player.morale > 50 ? 'ALTA' : 'BAJA'}</span></div>
                                <div className="flex flex-col px-1.5 py-1">
                                  <div className="flex justify-between items-center"><span className="text-[7px] font-black text-white/50 uppercase">Lesión</span><span className={`text-[10px] font-black ${player.injury ? (player.injury.severity === 'SEVERE' || player.injury.severity === 'SERIOUS' ? 'text-red-400' : 'text-amber-600') : 'text-green-400'}`}>{player.injury ? `${player.injury.type} (~${player.injury.daysLeft}d)` : 'Ninguna'}</span></div>
                                  {player.injury && (
                                    <div className="mt-1 space-y-1">
                                      <div className="text-[8px] text-white/40">Progreso: {Math.round(player.injury.recoveryProgress)}% · Riesgo recaída: {Math.round(player.injury.relapseRisk)}%</div>
                                      <div className="w-full bg-white/10/10 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${player.injury.treatment === 'AGGRESSIVE' ? 'bg-amber-500/100' : 'bg-blue-500/100'}`} style={{ width: `${Math.round(player.injury.recoveryProgress)}%` }} />
                                      </div>
                                      <div className="flex gap-1">
                                        {player.injury.treatment === 'NONE' && (
                                          <>
                                            <button onClick={() => { world.setInjuryTreatment(player.id, 'CONSERVATIVE', currentDate); setDialogueResult({ text: 'Tratamiento conservador aplicado. Recuperación más lenta pero segura.', moraleChange: 0, reactionType: 'NEUTRAL' }); }} className="text-[7px] px-1.5 py-0.5 bg-blue-500/15 text-blue-800 rounded-sm font-bold">Conservador</button>
                                            <button onClick={() => { world.setInjuryTreatment(player.id, 'AGGRESSIVE', currentDate); setDialogueResult({ text: 'Tratamiento agresivo aplicado. Vuelve antes pero con riesgo.', moraleChange: 0, reactionType: 'NEUTRAL' }); }} className="text-[7px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-sm font-bold">Agresivo</button>
                                          </>
                                        )}
                                        {player.injury.treatment !== 'NONE' && (
                                          <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-sm ${player.injury.treatment === 'CONSERVATIVE' ? 'bg-blue-500/15 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {player.injury.treatment === 'CONSERVATIVE' ? '🛡️ Conservador' : '⚡ Agresivo'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </div>
                         </div>
                         <div className="bg-white/10/10 border border-white/10 shrink-0 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] px-2 py-1 border-b border-white/10"><span className="text-[#1a1a1a] font-black text-[7px] uppercase tracking-widest">ETIQUETA</span></div>
                            <div className="p-2 flex items-center justify-center">
                               <span className="text-[11px] font-black uppercase text-blue-800 bg-blue-500/10 border border-blue-200 px-3 py-1.5 rounded-sm">{getPlayerTagLabel(player)}</span>
                            </div>
                         </div>
                         <div className="bg-white/10/10 border border-white/10 shrink-0 shadow-sm overflow-hidden flex-1">
                            <div className="bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] px-2 py-1 border-b border-white/10"><span className="text-[#1a1a1a] font-black text-[7px] uppercase tracking-widest">ATTRIBUTOS INTERNOS</span></div>
                            <div className="p-1 overflow-y-auto custom-scroll max-h-48">
                               {(['velocidad', 'resistencia', 'fuerza', 'control', 'pase', 'regate', 'disparo', 'anticipacion', 'decision', 'posicionamiento', 'vision', 'agresividad', 'polivalencia'] as const).map(ik => {
                                  const iv = player.stats.internal[ik];
                                  const iPct = Math.round((iv / 20) * 100);
                                  const iBarColor = iv >= 16 ? 'bg-blue-700' : iv >= 11 ? 'bg-blue-500/100' : iv >= 7 ? 'bg-slate-400' : 'bg-white/15';
                                  return (
                                     <div key={ik} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-white/5">
                                        <span className="text-[7px] font-bold text-white/50 uppercase w-14 truncate">{ATTRIBUTE_LABELS[ik] || ik}</span>
                                        <div className="flex-1 h-1 bg-white/10/10 rounded-full overflow-hidden">
                                           <div className={`h-full rounded-full ${iBarColor}`} style={{ width: `${iPct}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-white/60 w-4 text-right">{iv}</span>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'PERSONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto p-2">
                   <FMBox title="Información Biográfica">
                      <div className="space-y-2 p-2 bg-white/10">
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-white/50"><Cake size={14}/> <span className="text-[10px] font-black uppercase">Nacimiento</span></div><span className="text-xs font-bold">{player.birthDate.toLocaleDateString()} ({player.age} años)</span></div>
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-white/50"><Ruler size={14}/> <span className="text-[10px] font-black uppercase">Altura</span></div><span className="text-xs font-bold">{player.height} cm</span></div>
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-white/50"><Weight size={14}/> <span className="text-[10px] font-black uppercase">Peso</span></div><span className="text-xs font-bold">{player.weight} kg</span></div>
                         <div className="flex flex-col border-b pb-2"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-white/50"><UserCircle size={14}/> <span className="text-[10px] font-black uppercase">Personalidad</span></div><span className="text-xs font-bold text-blue-800">{personalityLabel}</span></div>{personalityDesc && <p className="text-[9px] text-white/50 italic mt-1">{personalityDesc}</p>}</div>
                      </div>
                   </FMBox>
                   <FMBox title="Contrato e Importancia">
                      <div className="space-y-2 p-2 bg-white/10">
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-white/50 uppercase">Club Actual</span><span className="text-xs font-black">{club?.name || 'Agente Libre'}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-white/50 uppercase">Sueldo Mensual</span><span className="text-xs font-black text-blue-900">£{player.salary.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-white/50 uppercase">Vencimiento</span><span className="text-xs font-bold">{player.contractExpiry.toLocaleDateString()}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-white/50 uppercase">Valor Estimado</span><span className="text-xs font-black text-green-400">£{player.value.toLocaleString()}</span></div>
                        {player.releaseClause && <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-white/50 uppercase">Cláusula</span><span className="text-xs font-black text-amber-700">£{player.releaseClause.toLocaleString()}</span></div>}
                      </div>
                   </FMBox>
                </div>
             )}

             {activeTab === 'POSITIONS' && (
                <div className="flex flex-col items-center justify-center h-full p-2">
                   <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-xl bg-[#1e3a29] border-4 border-white/10 rounded-sm overflow-hidden">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
                         <g fill="none" stroke="white" strokeWidth="0.5">
                            <rect x="2" y="2" width="96" height="96" />
                            <line x1="2" y1="50" x2="98" y2="50" />
                            <circle cx="50" cy="50" r="10" />
                            <rect x="25" y="2" width="50" height="15" />
                            <rect x="25" y="83" width="50" height="15" />
                         </g>
                      </svg>
                      
                      {/* Marcadores de posiciones */}
                      {player.positions.map(pos => {
                        const coords = POSITION_COORDS[pos] || { x: 50, y: 50 };
                        return (
                          <div key={pos} className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
                            <div className="w-full h-full bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                            <span className="absolute -bottom-4 text-[7px] font-black text-white bg-black/60 px-1 rounded uppercase whitespace-nowrap">{pos}</span>
                          </div>
                        );
                      })}
                      {player.secondaryPositions?.map(pos => {
                        const coords = POSITION_COORDS[pos] || { x: 50, y: 50 };
                        return (
                          <div key={pos} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
                            <div className="w-full h-full bg-yellow-400 rounded-full border border-white opacity-80 shadow-md"></div>
                            <span className="absolute -bottom-3 text-[6px] font-black text-white bg-black/40 px-0.5 rounded uppercase whitespace-nowrap">{pos}</span>
                          </div>
                        );
                      })}
                   </div>
                   <div className="mt-4 flex gap-4 text-[8px] font-black uppercase">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Natural</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div> Eficaz</div>
                   </div>
                </div>
             )}

             {activeTab === 'HISTORY' && (
                <div className="h-full overflow-hidden p-2 flex flex-col">
                   {player.careerStats && player.careerStats.totalApps > 0 && (
                 <FMBox title="Carrera" className="flex-1">
                   <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                     <div><span className="font-black text-white/90 block">{player.careerStats.totalApps}</span><span className="text-white/50">Partidos</span></div>
                     <div><span className="font-black text-white/90 block">{player.careerStats.totalGoals}</span><span className="text-white/50">Goles</span></div>
                     <div><span className="font-black text-white/90 block">{player.careerStats.totalAssists}</span><span className="text-white/50">Asistencias</span></div>
                     <div><span className="font-black text-white/90 block">{player.careerStats.totalCleanSheets}</span><span className="text-white/50">Vallas Inv.</span></div>
                   </div>
                   {player.careerStats.clubsPlayedFor && player.careerStats.clubsPlayedFor.length > 1 && (
                     <div className="mt-2 text-[9px] text-white/50">Clubes: {player.careerStats.clubsPlayedFor.map(id => world.getClub(id)?.shortName || id).slice(0, 5).join(', ')}</div>
                   )}
                 </FMBox>
               )}
               <FMBox title="Historial del Jugador" className="flex-1 overflow-hidden" noPadding>
                      <FMTable headers={['Año', 'Club', 'Pj', 'Gls', 'Asi', 'Cal']} colWidths={['50px', 'auto', '30px', '30px', '30px', '40px']}>
                         {player.history && player.history.length > 0 ? player.history.sort((a,b) => b.year - a.year).map((h, i) => (
                           <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-white/5'}>
                              <FMTableCell className="font-mono text-white/50">{h.year}</FMTableCell>
                              <FMTableCell className="font-bold">{world.getClub(h.clubId)?.name || 'Desconocido'}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.appearances}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.goals}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.assists}</FMTableCell>
                              <FMTableCell className="text-center font-bold text-blue-800" isNumber>{(h.stats.totalRating / (h.stats.appearances || 1)).toFixed(2)}</FMTableCell>
                           </tr>
                         )) : (
                           <tr><td colSpan={6} className="p-12 text-center text-white/40 italic text-[10px] uppercase font-black">No hay historial previo registrado</td></tr>
                         )}
                      </FMTable>
                   </FMBox>
                </div>
             )}

             {activeTab === 'CONTRACT' && (
                <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 pt-4 w-full overflow-y-auto px-2">
                   <FMBox title="Detalles del Contrato">
                      <div className="p-3 md:p-4 bg-white/10 space-y-3 md:space-y-4">
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-white/40 uppercase">Valor estimado</span><span className="text-lg md:text-xl font-black text-white/90">£{player.value.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-white/40 uppercase">Sueldo mensual</span><span className="text-lg md:text-xl font-black text-blue-900">£{player.salary.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-white/40 uppercase">Vencimiento</span><span className="text-sm font-bold text-white/70">{player.contractExpiry.toLocaleDateString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-white/40 uppercase">Estado Transferencia</span><span className="text-xs font-black text-orange-600 uppercase">{player.transferStatus === 'TRANSFERABLE' ? 'Transferible' : player.transferStatus === 'LOANABLE' ? 'Cedible' : 'Indiscutible'}</span></div>
                      </div>
                   </FMBox>
                   {isUserPlayer && (
                      <div className="grid grid-cols-2 gap-2">
                         <FMButton variant="primary" onClick={() => setShowRenewalModal(true)}>Renovar Contrato</FMButton>
                         <FMButton variant="danger" onClick={handleRescind}>Rescindir</FMButton>
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'INTERACTION' && (
               <div className="h-full flex flex-col p-2 gap-4 overflow-y-auto">
                  {personalMotive && !dialogueResult && (
                    <div className="bg-amber-100 border border-amber-300 p-3 rounded-sm flex items-start gap-3 animate-fade-up">
                       <AlertCircle className="text-amber-600 shrink-0" size={18} />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-amber-700 uppercase">Petición del Jugador</p>
                          <p className="text-xs italic font-bold text-white/80 mt-1">"{personalMotive}"</p>
                          <div className="mt-3 flex gap-2">
                             <button onClick={() => setDialogueResult(DialogueSystem.resolveInitiatedMotive(player, 'PROMISE', currentDate))} className="text-[9px] bg-green-600 text-white px-3 py-1 font-black uppercase rounded-[1px] hover:bg-green-700 transition-colors">Hacer Promesa</button>
                             <button onClick={() => setDialogueResult(DialogueSystem.resolveInitiatedMotive(player, 'IGNORE', currentDate))} className="text-[9px] bg-slate-400 text-white px-3 py-1 font-black uppercase rounded-[1px] hover:bg-white/50 transition-colors">Ignorar</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {dialogueResult ? (
                    <div className="bg-white/10/10 border border-white/10 p-6 rounded-sm text-center flex flex-col items-center gap-4 animate-zoom-in">
                       <div className={`p-4 rounded-full border-4 ${dialogueResult.reactionType === 'POSITIVE' ? 'bg-green-500/15 border-green-500 text-green-600' : dialogueResult.reactionType === 'NEGATIVE' ? 'bg-red-100 border-red-500 text-red-600' : 'bg-white/10 border-white/15 text-white/60'}`}>
                          <MessageCircle size={48} />
                       </div>
                       <h4 className="text-xl font-black uppercase italic tracking-tighter text-[#1a1a1a]">Respuesta del Jugador</h4>
                       <p className="text-sm font-bold italic text-white/70 max-w-md">"{dialogueResult.text}"</p>
                       <div className="flex gap-2 items-center text-[10px] font-black">
                          <span className="text-white/50 uppercase">Cambio Moral:</span>
                          <span className={dialogueResult.moraleChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                             {dialogueResult.moraleChange >= 0 ? '+' : ''}{dialogueResult.moraleChange}
                          </span>
                       </div>
                       <FMButton variant="secondary" onClick={() => setDialogueResult(null)} className="mt-4 px-12">Finalizar Charla</FMButton>
                    </div>
                  ) : (
                    <FMBox title="Charlas con el Jugador">
                       <div className="p-4 space-y-6">
                          <div>
                             <label className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">Tema de Conversación</label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  { id: 'PRAISE_FORM', label: 'Elogiar Forma' },
                                  { id: 'CRITICIZE_FORM', label: 'Criticar Rendimiento' },
                                  { id: 'PRAISE_TRAINING', label: 'Elogiar Entreno' },
                                  { id: 'DEMAND_MORE', label: 'Exigir más Esfuerzo' },
                                  { id: 'WARN_CONDUCT', label: 'Advertir Disciplina' },
                                  ...(player.transferRequestReason ? [{ id: 'CONVINCE_TO_STAY' as const, label: 'Convencer que se Quede' }] : []),
                                ].map(opt => (
                                  <button key={opt.id} onClick={() => setDialogueType(opt.id as any)} className={`px-4 py-3 text-[10px] font-black uppercase rounded-[1px] border transition-all ${dialogueType === opt.id ? 'bg-white/25 text-white border-black' : 'bg-white/10 text-white/70 border-white/10'}`}>{opt.label}</button>
                                ))}
                             </div>
                          </div>

                          <div>
                             <label className="text-[9px] font-black text-white/50 uppercase tracking-widest block mb-2">Tono de Voz</label>
                             <div className="flex bg-white/10/10 p-0.5 rounded-sm border border-white/10 shadow-inner">
                                {['MILD', 'MODERATE', 'AGGRESSIVE'].map(t => (
                                  <button key={t} onClick={() => setDialogueTone(t as any)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all ${dialogueTone === t ? (t === 'AGGRESSIVE' ? 'bg-red-700 text-white' : 'bg-white/25 text-white') : 'text-white/70'}`}>{t === 'MILD' ? 'Tranquilo' : t === 'MODERATE' ? 'Directo' : 'Agresivo'}</button>
                                ))}
                             </div>
                          </div>

                          <div className="bg-white/10/10 p-4 border border-white/20 rounded-sm italic text-xs font-bold text-white/60">
                             " {DialogueSystem.getTopicOptions(dialogueType)[dialogueTone]} "
                          </div>

                          <FMButton onClick={handleTalk} className="w-full py-4 text-xs tracking-widest"><MessageCircle size={14}/> Iniciar Diálogo</FMButton>
                       </div>
                    </FMBox>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
      {showRenewalModal && <ContractNegotiationModal player={player} userClubId={userClubId} currentDate={currentDate} onClose={() => setShowRenewalModal(false)} onRenewed={() => setShowRenewalModal(false)} />}
    </>
  );
};
