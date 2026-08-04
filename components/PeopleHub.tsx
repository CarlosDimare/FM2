import React, { useState, useMemo } from 'react';
import { Player, Staff, Club, ManagerNetworkEntry, PressStatementTopic } from '../types';
import { world } from '../services/worldManager';
import { DialogueSystem } from '../services/dialogueSystem';
import { FMBox, FMButton } from './FMUI';
import { useUserStore } from '../stores/userStore';
import { Users, MessageSquare, AlertTriangle, Heart, Swords, Briefcase, Building2, X, DollarSign, Dumbbell, Newspaper, Radio, Handshake } from 'lucide-react';

interface PeopleHubProps {
  userClub?: Club;
  currentDate: Date;
}

type Tab = 'PLAYERS' | 'STAFF' | 'RELATIONSHIPS' | 'BOARD' | 'PRESS' | 'MANAGERS';

export const PeopleHub: React.FC<PeopleHubProps> = ({ userClub, currentDate }) => {
  const [tab, setTab] = useState<Tab>('PLAYERS');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedManager, setSelectedManager] = useState<ManagerNetworkEntry | null>(null);
  const [interactionType, setInteractionType] = useState<string | null>(null);
  const [interactionTone, setInteractionTone] = useState<'MILD' | 'MODERATE' | 'AGGRESSIVE'>('MILD');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const { selectedNationalTeamId } = useUserStore();
  const isNationalOnly = !userClub;

  // En modo club se listan los jugadores del primer equipo; en modo selección, la convocatoria controlada.
  const players: Player[] = userClub
    ? world.getPlayersByClub(userClub.id).filter(p => p.squad === 'SENIOR')
    : (() => {
        const nt = world.nationalTeamManager;
        if (!nt || !selectedNationalTeamId) return [];
        const ids = nt.isControlled(selectedNationalTeamId)
          ? nt.getControlledSquadIds(selectedNationalTeamId)
          : (nt.nationalTeams?.find((t: any) => t.id === selectedNationalTeamId)?.playerIds || []);
        return ids
          .map(pid => world.players.find(p => p.id === pid))
          .filter((p): p is Player => Boolean(p));
      })();
  const staff: Staff[] = userClub ? world.getStaffByClub(userClub.id) : [];
  const coach = staff.find(s => s.role === 'HEAD_COACH');
  const tabs: Tab[] = userClub
    ? ['PLAYERS', 'STAFF', 'RELATIONSHIPS', 'PRESS', 'MANAGERS', 'BOARD']
    : ['PLAYERS', 'RELATIONSHIPS', 'PRESS', 'MANAGERS'];

  const managerNetwork = useMemo(() => world.getManagerNetwork(userClub?.id), [world.staff.length, userClub?.id]);
  const latestNews = useMemo(() => world.getAllNews(12), [world.mediaNews.length]);

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

  const handlePressStatement = (topic: PressStatementTopic) => {
    const result = DialogueSystem.resolvePressStatement(topic, interactionTone, currentDate);
    setLastResult(result.text);
  };

  const handleManagerContact = (entry: ManagerNetworkEntry) => {
    const manager = world.getStaff(entry.managerId);
    if (!manager) return;
    const result = DialogueSystem.resolveManagerContact(manager, interactionTone, currentDate);
    setLastResult(result.text);
    setSelectedManager(entry);
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
    if (!rel) return 'text-white/50';
    if (rel.tension >= 70) return 'text-red-600';
    if (rel.tension >= 40) return 'text-amber-600';
    if (rel.trust >= 70) return 'text-green-600';
    return 'text-white/50';
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 overflow-y-auto pb-14">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-white/90 uppercase italic tracking-tighter flex items-center gap-2">
          <Users size={22} /> Centro de Personas
        </h2>
        <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest">
          {isNationalOnly ? 'Gestiona relaciones y comunicación con tus convocados internacionales.' : 'Gestiona relaciones, tensiones y comunicación con jugadores, staff y directiva.'}
        </p>
      </header>

      <div className="flex gap-2 border-b border-white/20">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === t ? 'border-slate-900 text-white/90' : 'border-transparent text-white/50 hover:text-white/70'
            }`}
          >
            {t === 'PLAYERS' ? 'Jugadores' : t === 'STAFF' ? 'Cuerpo Técnico' : t === 'RELATIONSHIPS' ? 'Relaciones' : t === 'PRESS' ? 'Prensa' : t === 'MANAGERS' ? 'Red de DT' : 'Directiva'}
          </button>
        ))}
      </div>

      {tab === 'PLAYERS' && (
        <div className="space-y-2">
          {players.length === 0 && <div className="text-center text-white/40 text-[10px] italic py-8">Sin jugadores disponibles.</div>}
          {players.map(player => {
            const rel = world.getRelationship('COACH', player.id);
            const moraleColor = player.morale >= 70 ? 'text-green-400' : player.morale >= 40 ? 'text-amber-600' : 'text-red-600';
            return (
              <div key={player.id} className="bg-white/10/10 border border-white/20 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-black text-white/90 text-sm">{player.name}</div>
                    <div className="text-[10px] text-white/50 font-bold uppercase">Moral: <span className={moraleColor}>{Math.round(player.morale)}%</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-white/50">Relación</div>
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

      {tab === 'STAFF' && userClub && (
        <div className="space-y-2">
          {staff.map(member => {
            const rel = world.getRelationship('COACH', member.id);
            return (
              <div key={member.id} className="bg-white/10/10 border border-white/20 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-black text-white/90 text-sm">{member.name}</div>
                    <div className="text-[10px] text-white/50 font-bold uppercase">{member.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase text-white/50">Relación</div>
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

      {tab === 'PRESS' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <FMBox title="Sala de Prensa">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {([['EXPECTATIONS', 'Expectativas'], ['RIVAL', 'Rival'], ['SQUAD_CONFIDENCE', 'Vestuario'], ['TRANSFER_RUMOUR', 'Rumores']] as const).map(([topic, label]) => (
                <FMButton key={topic} onClick={() => handlePressStatement(topic)} className="text-[10px]" variant={topic === 'EXPECTATIONS' ? 'primary' : 'secondary'}>
                  <Radio size={12} /> {label}
                </FMButton>
              ))}
            </div>
            <div className="space-y-2">
              {latestNews.map(news => (
                <div key={news.id} className="bg-white/10/10 border border-white/10 p-3 rounded-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-[9px] font-black uppercase text-white/50">{news.type} · {news.category}</span>
                    <span className="text-[9px] text-white/40">{new Date(news.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] font-black text-white/90 mt-1">{news.headline}</div>
                  <div className="text-[10px] text-white/60 mt-1">{news.subheadline}</div>
                </div>
              ))}
              {latestNews.length === 0 && <div className="text-center text-white/40 text-[10px] italic py-8">Todavía no hay noticias de prensa.</div>}
            </div>
          </FMBox>
          <FMBox title="Tono público">
            <div className="space-y-2">
              {(['MILD', 'MODERATE', 'AGGRESSIVE'] as const).map(tone => (
                <button key={tone} onClick={() => setInteractionTone(tone)} className={`w-full py-2 border-2 text-[10px] font-black uppercase ${interactionTone === tone ? 'bg-white/30 text-white border-white/30' : 'bg-white border-white/20 text-white/60'}`}>
                  {tone === 'MILD' ? 'Sereno' : tone === 'MODERATE' ? 'Profesional' : 'Desafiante'}
                </button>
              ))}
              {lastResult && <div className="mt-3 bg-white/10/10 border border-white/10 p-3 text-[10px] text-white/70">{lastResult}</div>}
            </div>
          </FMBox>
        </div>
      )}

      {tab === 'MANAGERS' && (
        <div className="space-y-3">
          <FMBox title="Red de Entrenadores">
            <p className="text-[10px] text-white/50 mb-3">Construye reputación, alianzas y rivalidades con los técnicos de tu entorno.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {managerNetwork.map(manager => (
                <div key={manager.managerId} className="bg-white/10/10 border border-white/20 p-3 rounded-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-white/90 text-sm">{manager.managerName}</div>
                      <div className="text-[10px] text-white/50 font-bold uppercase">{manager.clubName} · {manager.country}</div>
                      <div className="text-[9px] text-white/50 uppercase mt-1">Reputación {Math.round(manager.reputation)} · Relación {getRelationshipLabel(manager.relationship)}</div>
                    </div>
                    <Handshake size={18} className={getRelationshipColor(manager.relationship)} />
                  </div>
                  <FMButton onClick={() => handleManagerContact(manager)} className="text-[10px] mt-3" variant="secondary"><Handshake size={12} /> Contactar</FMButton>
                </div>
              ))}
              {managerNetwork.length === 0 && <div className="text-center text-white/40 text-[10px] italic py-8">No hay otros entrenadores disponibles todavía.</div>}
            </div>
          </FMBox>
          {selectedManager && lastResult && <div className="bg-white/10/10 border-2 border-white/15 p-4 text-[11px] text-white/70"><b>{selectedManager.managerName}:</b> {lastResult}</div>}
        </div>
      )}

      {tab === 'RELATIONSHIPS' && (
        <FMBox title="Red de Relaciones">
          <div className="space-y-2">
            {recentInteractions.map(interaction => (
              <div key={interaction.id} className="bg-white/10/10 border border-white/10 p-3 rounded-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-black uppercase text-white/50">
                    {interaction.channel === 'COACH_PLAYER' ? 'DT ↔ Jugador' : interaction.channel === 'COACH_STAFF' ? 'DT ↔ Staff' : 'DT ↔ Directiva'}
                  </div>
                  <div className={`text-[10px] font-black ${interaction.result === 'POSITIVE' ? 'text-green-600' : interaction.result === 'NEGATIVE' ? 'text-red-600' : 'text-white/50'}`}>
                    {interaction.result === 'POSITIVE' ? 'Positivo' : interaction.result === 'NEGATIVE' ? 'Negativo' : 'Neutral'}
                  </div>
                </div>
                <div className="text-[11px] text-white/70">{interaction.description}</div>
                <div className="text-[9px] text-white/40 mt-1">{interaction.date.toLocaleDateString()}</div>
              </div>
            ))}
            {recentInteractions.length === 0 && (
              <div className="text-center text-white/40 text-[10px] italic">Sin interacciones recientes</div>
            )}
          </div>
        </FMBox>
      )}

      {tab === 'BOARD' && userClub && (
        <FMBox title="Relación con la Directiva">
          <div className="space-y-3">
            <div className="bg-white/10/10 border border-white/20 p-4 rounded-sm">
              <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Confianza de la directiva</div>
              <div className="h-4 bg-white/10/15 rounded-sm overflow-hidden border border-white/15">
                <div
                  className={`h-full transition-all ${userClub.boardConfidence >= 70 ? 'bg-green-500' : userClub.boardConfidence >= 40 ? 'bg-amber-500/100' : 'bg-red-500'}`}
                  style={{ width: `${userClub.boardConfidence}%` }}
                />
              </div>
              <div className="text-right text-[10px] font-black text-white/70 mt-1">{Math.round(userClub.boardConfidence)}%</div>
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
          <div className="bg-white/10 w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
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
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-white/20 hover:border-white/15'
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
                {!isNationalOnly && <FMButton onClick={() => handlePlayerInteraction(selectedPlayer, 'THREATEN_TRANSFER')} className="w-full text-[10px]" variant="danger">
                  <AlertTriangle size={12} /> Amenazar con traspaso
                </FMButton>}
              </div>
              {lastResult && <div className="text-[11px] text-white/70 bg-white/10/10 p-3 rounded-sm border border-white/10">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}

      {interactionType === 'dialog' && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white/10 w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
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
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-white/20 hover:border-white/15'
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
              {lastResult && <div className="text-[11px] text-white/70 bg-white/10/10 p-3 rounded-sm border border-white/10">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}

      {interactionType && ['BUDGET_REQUEST', 'FACILITY_IMPROVEMENT', 'CONTRACT_EXTENSION', 'TACTICAL_AUTONOMY'].includes(interactionType) && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white/10 w-full max-w-lg rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
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
                      interactionTone === tone ? 'border-slate-900 bg-slate-900 text-white' : 'border-white/20 hover:border-white/15'
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
              {lastResult && <div className="text-[11px] text-white/70 bg-white/10/10 p-3 rounded-sm border border-white/10">{lastResult}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
