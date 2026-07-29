import React, { useState, useMemo } from 'react';
import { Player, Staff, Club } from '../types';
import { world } from '../services/worldManager';
import { DialogueSystem } from '../services/dialogueSystem';
import { FMBox, FMButton } from './FMUI';
import { Users, MessageSquare, AlertTriangle, Heart, Swords, Briefcase, Building2, X, DollarSign, Dumbbell } from 'lucide-react';

interface PeopleHubProps {
  userClub: Club;
  currentDate: Date;
}

type Tab = 'PLAYERS' | 'STAFF' | 'RELATIONSHIPS' | 'BOARD';

export const PeopleHub: React.FC<PeopleHubProps> = ({ userClub, currentDate }) => {
  const [tab, setTab] = useState<Tab>('PLAYERS');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [interactionType, setInteractionType] = useState<string | null>(null);
  const [interactionTone, setInteractionTone] = useState<'MILD' | 'MODERATE' | 'AGGRESSIVE'>('MILD');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const players = world.getPlayersByClub(userClub.id).filter(p => p.squad === 'SENIOR');
  const staff = world.getStaffByClub(userClub.id);
  const coach = staff.find(s => s.role === 'HEAD_COACH');

  const recentInteractions = useMemo(() => {
    return world.interactionLog
      .filter(i => i.actorId === 'COACH' || i.targetId === 'COACH')
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  }, [world.interactionLog.length]);

  const handlePlayerInteraction = (player: Player, type: string) => {
    const result = DialogueSystem.resolveCoachPlayerInteraction(player, type as any, interactionTone, currentDate);
    setLastResult(result.text);
    setInteractionType(null);
  };

  const handleStaffInteraction = (staffMember: Staff, type: string) => {
    const result = DialogueSystem.resolveCoachStaffInteraction(staffMember, type as any, interactionTone, currentDate);
    setLastResult(result.text);
    setInteractionType(null);
  };

  const handleBoardInteraction = (topic: string) => {
    const result = DialogueSystem.resolveBoardInteraction(userClub.id, topic as any, interactionTone, currentDate);
    setLastResult(result.text);
    setInteractionType(null);
  };

  const getRelationshipLabel = (rel: { trust: number; respect: number; tension: number } | undefined) => {
    if (!rel) return 'Neutral';
    if (rel.tension >= 70) return 'Conflicto';
    if (rel.tension >= 40) return 'Tensión';
    if (rel.trust >= 70) return 'Confianza';
    if (rel.trust >= 50) return 'Buena';
    return 'Neutral';
  };

  const getRelationshipColor = (rel: { trust: number; respect: number; tension: number } | undefined) => {
    if (!rel) return 'text-slate-500';
    if (rel.tension >= 70) return 'text-red-600';
    if (rel.tension >= 40) return 'text-amber-600';
    if (rel.trust >= 70) return 'text-green-600';
    return 'text-slate-500';
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-y-auto pb-14">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
          <Users size={22} /> Centro de Personas
        </h2>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
          Gestiona relaciones, tensiones y comunicación con jugadores, staff y directiva.
        </p>
      </header>

      <div className="flex gap-2 border-b border-slate-300">
        {(['PLAYERS', 'STAFF', 'RELATIONSHIPS', 'BOARD'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'PLAYERS' ? 'Jugadores' : t === 'STAFF' ? 'Cuerpo Técnico' : t === 'RELATIONSHIPS' ? 'Relaciones' : 'Directiva'}
          </button>
        ))}
      </div>

      {tab === 'PLAYERS' && (
        <div className="space-y-2">
          {players.map(player => {
            const rel = world.getRelationship('COACH', player.id);
            const moraleColor = player.morale >= 70 ? 'text-green-700' : player.morale >= 40 ? 'text-amber-600' : 'text-red-600';
            return (
              <div key={player.id} className="bg-white border border-slate-300 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-black text-slate-900 text-sm">{player.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Moral: <span className={moraleColor}>{Math.round(player.morale)}%</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-500">Relación</div>
                    <div className={`text-[10px] font-black ${getRelationshipColor(rel)}`}>{getRelationshipLabel(rel)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FMButton onClick={() => { setSelectedPlayer(player); setInteractionType(null); }} className="text-[10px]">Hablar</FMButton>
                  <FMButton onClick={() => { setSelectedPlayer(player); setInteractionType('dialog'); }} className="text-[10px]" variant="secondary">Charlar</FMButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'STAFF' && (
        <div className="space-y-2">
          {staff.map(member => {
            const rel = world.getRelationship('COACH', member.id);
            return (
              <div key={member.id} className="bg-white border border-slate-300 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-black text-slate-900 text-sm">{member.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-slate-500">Relación</div>
                    <div className={`text-[10px] font-black ${getRelationshipColor(rel)}`}>{getRelationshipLabel(rel)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FMButton onClick={() => { setSelectedStaff(member); setInteractionType(null); }} className="text-[10px]">Hablar</FMButton>
                  <FMButton onClick={() => { setSelectedStaff(member); setInteractionType('dialog'); }} className="text-[10px]" variant="secondary">Charlar</FMButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'RELATIONSHIPS' && (
        <FMBox title="Red de Relaciones">
          <div className="space-y-2">
            {recentInteractions.map(interaction => (
              <div key={interaction.id} className="bg-white border border-slate-200 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-black uppercase text-slate-500">
                    {interaction.channel === 'COACH_PLAYER' ? 'DT ↔ Jugador' : interaction.channel === 'COACH_STAFF' ? 'DT ↔ Staff' : 'DT ↔ Directiva'}
                  </div>
                  <div className={`text-[10px] font-black ${interaction.result === 'POSITIVE' ? 'text-green-600' : interaction.result === 'NEGATIVE' ? 'text-red-600' : 'text-slate-500'}`}>
                    {interaction.result === 'POSITIVE' ? 'Positivo' : interaction.result === 'NEGATIVE' ? 'Negativo' : 'Neutral'}
                  </div>
                </div>
                <div className="text-[11px] text-slate-700">{interaction.description}</div>
                <div className="text-[9px] text-slate-400 mt-1">{interaction.date.toLocaleDateString()}</div>
              </div>
            ))}
            {recentInteractions.length === 0 && (
              <div className="text-center text-slate-400 text-[10px] italic">Sin interacciones recientes</div>
            )}
          </div>
        </FMBox>
      )}

      {tab === 'BOARD' && (
        <FMBox title="Relación con la Directiva">
          <div className="space-y-3">
            <div className="bg-white border border-slate-300 p-4 rounded-sm">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confianza de la directiva</div>
              <div className="h-4 bg-slate-300 rounded-sm overflow-hidden border border-slate-400">
                <div
                  className={`h-full transition-all ${userClub.boardConfidence >= 70 ? 'bg-green-500' : userClub.boardConfidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${userClub.boardConfidence}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-black text-slate-700 mt-1">{Math.round(userClub.boardConfidence)}%</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FMButton onClick={() => { setInteractionType('BUDGET_REQUEST'); }} className="text-[10px]">
                <DollarSign size={12} /> Presupuesto
              </FMButton>
              <FMButton onClick={() => { setInteractionType('FACILITY_IMPROVEMENT'); }} className="text-[10px]" variant="secondary">
                <Building2 size={12} /> Instalaciones
              </FMButton>
              <FMButton onClick={() => { setInteractionType('CONTRACT_EXTENSION'); }} className="text-[10px]" variant="secondary">
                <Briefcase size={12} /> Contrato
              </FMButton>
              <FMButton onClick={() => { setInteractionType('TACTICAL_AUTONOMY'); }} className="text-[10px]" variant="secondary">
                <MessageSquare size={12} /> Autonomía
              </FMButton>
            </div>
          </div>
        </FMBox>
      )}

      {interactionType === 'dialog' && selectedPlayer && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase italic">Interacción con {selectedPlayer.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Elige el tono de la charla</p>
              </div>
              <button onClick={() => setInteractionType(null)} className="opacity-70 hover:opacity-100"><X size={20} /></button>
            </header>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['MILD', 'MODERATE', 'AGGRESSIVE'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => setInteractionTone(tone)}
                    className={`py-2 px-3 rounded-sm border-2 font-black text-[10px] uppercase transition-all ${
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {tone === 'MILD' ? 'Suave' : tone === 'MODERATE' ? 'Moderado' : 'Agresivo'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'PRAISE_FORM')} className="w-full text-[10px]">
                  <Heart size={12} /> Elogiar rendimiento
                </FMButton>
                <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'CRITICIZE_FORM')} className="w-full text-[10px]" variant="secondary">
                  <AlertTriangle size={12} /> Criticar rendimiento
                </FMButton>
                <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'DEMAND_MORE')} className="w-full text-[10px]" variant="secondary">
                  <Swords size={12} /> Exigir más
                </FMButton>
                <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'SET_CAPTAIN')} className="w-full text-[10px]" variant="secondary">
                  <Briefcase size={12} /> Asignar capitanía
                </FMButton>
                <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'THREATEN_TRANSFER')} className="w-full text-[10px]" variant="danger">
                  <AlertTriangle size={12} /> Amenazar con traspaso
                </FMButton>
              </div>
              {lastResult && <div className="text-[11px] text-slate-700 bg-slate-100 p-3 rounded-sm border border-slate-200">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}

      {interactionType === 'dialog' && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase italic">Interacción con {selectedStaff.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{selectedStaff.role}</p>
              </div>
              <button onClick={() => setInteractionType(null)} className="opacity-70 hover:opacity-100"><X size={20} /></button>
            </header>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['MILD', 'MODERATE', 'AGGRESSIVE'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => setInteractionTone(tone)}
                    className={`py-2 px-3 rounded-sm border-2 font-black text-[10px] uppercase transition-all ${
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {tone === 'MILD' ? 'Suave' : tone === 'MODERATE' ? 'Moderado' : 'Agresivo'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <FMButton onClick={() => handleStaffInteraction(selectedStaff, 'ASSIGN_TRAINING')} className="w-full text-[10px]">
                  <Dumbbell size={12} /> Asignar entrenamiento
                </FMButton>
                <FMButton onClick={() => handleStaffInteraction(selectedStaff, 'REPRIMAND')} className="w-full text-[10px]" variant="secondary">
                  <AlertTriangle size={12} /> Amonestar
                </FMButton>
                <FMButton onClick={() => handleStaffInteraction(selectedStaff, 'PROMISE_RESOURCES')} className="w-full text-[10px]" variant="secondary">
                  <Building2 size={12} /> Prometer recursos
                </FMButton>
                <FMButton onClick={() => handleStaffInteraction(selectedStaff, 'SCOUTING_FOCUS')} className="w-full text-[10px]" variant="secondary">
                  <MessageSquare size={12} /> Enfocar scouting
                </FMButton>
              </div>
              {lastResult && <div className="text-[11px] text-slate-700 bg-slate-100 p-3 rounded-sm border border-slate-200">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}

      {interactionType && ['BUDGET_REQUEST', 'FACILITY_IMPROVEMENT', 'CONTRACT_EXTENSION', 'TACTICAL_AUTONOMY'].includes(interactionType) && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
            <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase italic">Proponer a la Directiva</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Elige el tono de la propuesta</p>
              </div>
              <button onClick={() => setInteractionType(null)} className="opacity-70 hover:opacity-100"><X size={20} /></button>
            </header>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['MILD', 'MODERATE', 'AGGRESSIVE'] as const).map(tone => (
                  <button
                    key={tone}
                    onClick={() => setInteractionTone(tone)}
                    className={`py-2 px-3 rounded-sm border-2 font-black text-[10px] uppercase transition-all ${
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {tone === 'MILD' ? 'Suave' : tone === 'MODERATE' ? 'Moderado' : 'Agresivo'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <FMButton onClick={() => handleBoardInteraction(interactionType)} className="w-full text-[10px]">
                  <Building2 size={12} /> Enviar propuesta
                </FMButton>
              </div>
              {lastResult && <div className="text-[11px] text-slate-700 bg-slate-100 p-3 rounded-sm border border-slate-200">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
