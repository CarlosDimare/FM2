import React, { useState } from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { notifyAll } from '../stores/worldStore';
import { FMBox, FMButton } from './FMUI';
import { Building2, Award, DollarSign, Users, ArrowUp, Target, TrendingUp, ShieldCheck, Briefcase, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';

interface BoardViewProps {
  userClub: Club;
  currentDate: Date;
}

const OBJECTIVE_LABELS: Record<string, string> = {
  WIN_LEAGUE: 'Ganar la Liga',
  TOP_4: 'Top 4 (europa)',
  WIN_CUP: 'Ganar la Copa',
  CUP_SEMIS: 'Semifinal de Copa',
  TOP_HALF: 'Mitad superior',
  AVOID_RELEGATION: 'Evitar el descenso',
};

const OBJECTIVE_DESC: Record<string, string> = {
  WIN_LEAGUE: 'La directiva exige el título liguero. Presión máxima.',
  TOP_4: 'Clasificar a competición europea por liga.',
  WIN_CUP: 'Levantar el trofeo de la copa nacional.',
  CUP_SEMIS: 'Alcanzar al menos las semifinales de la copa.',
  TOP_HALF: 'Terminar en la mitad superior de la tabla.',
  AVOID_RELEGATION: 'Asegurar la permanencia en la categoría.',
};

type MeetingTopic = { id: string; label: string; icon: React.ReactNode };

const MEETING_TOPICS: MeetingTopic[] = [
  { id: 'FORM', label: 'Valoración de la plantilla', icon: <Users size={13} /> },
  { id: 'OBJECTIVE', label: 'Debatir el objetivo', icon: <Target size={13} /> },
  { id: 'SUPPORT', label: 'Pedir respaldo del proyecto', icon: <ShieldCheck size={13} /> },
  { id: 'FUTURE', label: 'Plan a largo plazo', icon: <TrendingUp size={13} /> },
];

export const BoardView: React.FC<BoardViewProps> = ({ userClub, currentDate }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [objectiveDraft, setObjectiveDraft] = useState<string>(userClub.seasonObjective || 'TOP_HALF');
  const [meetingLog, setMeetingLog] = useState<{ topic: string; response: string; tone: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' }[]>([]);
  const [showFacilities, setShowFacilities] = useState(false);
  const [showMeetings, setShowMeetings] = useState(false);

  const refreshClub = () => notifyAll();

  const handleUpgrade = (facility: 'training' | 'youth') => {
    const result = world.requestFacilityUpgrade(userClub.id, facility, currentDate);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    refreshClub();
  };

  const handleBudgetRequest = () => {
    const result = world.requestBudgetIncrease(userClub.id, currentDate);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    refreshClub();
  };

  const handleObjectiveSubmit = () => {
    const result = world.setSeasonObjective(userClub.id, objectiveDraft as NonNullable<Club['seasonObjective']>, currentDate);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    refreshClub();
  };

  const handleMeeting = (topic: MeetingTopic) => {
    const confidence = userClub.boardConfidence;
    const tone: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = confidence >= 70 ? 'POSITIVE' : confidence >= 40 ? 'NEUTRAL' : 'NEGATIVE';
    let response = '';
    switch (topic.id) {
      case 'FORM':
        response = tone === 'POSITIVE'
          ? 'La junta confía en la calidad de la plantilla que has construido y te respaldará en el mercado de invierno si lo necesitas.'
          : tone === 'NEUTRAL'
          ? 'La junta considera que la plantilla es competente, pero pide más consistencia en los resultados antes de aprobar nuevas inversiones.'
          : 'La directiva cuestiona la competitividad de la plantilla actual y duda de que pueda cumplir los mínimos exigidos.';
        break;
      case 'OBJECTIVE':
        response = tone === 'POSITIVE'
          ? 'La junta acepta debatir el objetivo contigo: valora tu lectura del equipo y la situación de la tabla.'
          : tone === 'NEUTRAL'
          ? 'La directiva escucha tu propuesta de objetivo, aunque matiza que los recursos disponibles son los que son.'
          : 'La junta rechaza de plano revisar el objetivo: exigen cumplir lo pactado antes de hablar de cambios.';
        break;
      case 'SUPPORT':
        response = tone === 'POSITIVE'
          ? 'Te ratifican como el hombre del proyecto y prometen blindarte ante los rumores de la prensa.'
          : tone === 'NEUTRAL'
          ? 'Confirman su apoyo, siempre que los resultados acompañen a corto plazo.'
          : 'Dejan claro que el respaldo no es incondicional: necesitan ver resultados inmediatos.';
        break;
      case 'FUTURE':
        response = tone === 'POSITIVE'
          ? 'La junta comparte tu visión de crecimiento: apuestan por un proyecto de 3 años con refuerzos progresivos.'
          : tone === 'NEUTRAL'
          ? 'Hablan de un plan de estabilidad: sin grandes sobresaltos ni grandes inversiones.'
          : 'La directiva solo piensa en el corto plazo: tu continuidad depende de la próxima jornada.';
        break;
    }
    setMeetingLog(prev => [{ topic: topic.label, response, tone }, ...prev].slice(0, 6));
    setFeedback(null);
  };

  const trainingCost = Math.round((userClub.trainingFacilities + 1) * (userClub.trainingFacilities + 1) * 50000);
  const youthCost = Math.round((userClub.youthFacilities + 1) * (userClub.youthFacilities + 1) * 50000);
  const requestedAmount = Math.round(userClub.finances.transferBudget * 0.3);

  const confidenceColor = userClub.boardConfidence >= 70 ? 'text-green-600' : userClub.boardConfidence >= 40 ? 'text-amber-600' : 'text-red-600';
  const profile = world.managerProfile;

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-y-auto pb-14">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
          <Award size={22} /> Directiva
        </h2>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
          Presenta tus propuestas a la junta directiva de {userClub.name}.
        </p>
      </header>

      <FMBox title="Confianza de la directiva">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Nivel actual</span>
            <span className={`font-black text-lg ${confidenceColor}`}>{Math.round(userClub.boardConfidence)}%</span>
          </div>
          <div className="h-4 bg-slate-300 rounded-sm overflow-hidden border border-slate-400">
            <div
              className={`h-full transition-all ${userClub.boardConfidence >= 70 ? 'bg-green-500' : userClub.boardConfidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${userClub.boardConfidence}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 italic">
            {userClub.boardConfidence >= 70 ? 'Te tienen en alta estima. Probablemente aceptaran tus peticiones.' :
             userClub.boardConfidence >= 40 ? 'Estabilidad normal. Algunas peticiones seran aprobadas.' :
             'La confianza es baja. Las propuestas podrian ser rechazadas.'}
          </div>
        </div>
      </FMBox>

      <FMBox title="Objetivo de temporada" headerRight={
        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-sm border bg-white/60 border-[#a0b0a0] text-slate-600">{OBJECTIVE_LABELS[userClub.seasonObjective || 'TOP_HALF'] || 'Sin definir'}</span>
      }>
        <div className="space-y-2">
          <p className="text-[9px] text-slate-600 italic">La directiva evalúa tus resultados contra este objetivo. Proponer cambios afecta la confianza: pedir más tensa la relación, pedir menos la alivia.</p>
          <select
            value={objectiveDraft}
            onChange={(e) => setObjectiveDraft(e.target.value)}
            className="w-full bg-white border border-[#a0b0a0] rounded-sm px-3 py-2 text-[11px] font-black uppercase text-slate-800 outline-none focus:border-[#3a4a3a]"
          >
            {Object.entries(OBJECTIVE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <p className="text-[9px] text-slate-500 italic">{OBJECTIVE_DESC[objectiveDraft]}</p>
          <FMButton onClick={handleObjectiveSubmit} className="w-full text-[10px]">
            <Target size={12} /> Presentar propuesta a la junta
          </FMButton>
        </div>
      </FMBox>

      <FMBox title="Saldo y finanzas">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="bg-white border border-slate-300 p-3 rounded-sm">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo</div>
            <div className="font-black text-slate-900">${userClub.finances.balance.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-slate-300 p-3 rounded-sm">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Presupuesto Fichajes</div>
            <div className="font-black text-green-700">${userClub.finances.transferBudget.toLocaleString()}</div>
          </div>
        </div>
      </FMBox>

      <FMBox title="Mejoras de Instalaciones">
        <div className="space-y-2">
          <button onClick={() => setShowFacilities(!showFacilities)} className="w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">
            {showFacilities ? 'Ocultar' : 'Mostrar'} instalaciones
            {showFacilities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showFacilities && (
            <>
              <div className="bg-white border border-slate-300 p-3 rounded-sm flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase flex items-center gap-2 mb-1">
                    <Building2 size={14} /> Entrenamiento
                  </div>
                  <div className="text-[9px] text-slate-600">Nivel actual: <b>{userClub.trainingFacilities}/20</b></div>
                  <div className="text-[9px] text-slate-600">Costo proximo nivel: <b>${trainingCost.toLocaleString()}</b></div>
                </div>
                <FMButton onClick={() => handleUpgrade('training')} disabled={userClub.trainingFacilities >= 20 || userClub.finances.balance < trainingCost} className="text-[10px] shrink-0">
                  <ArrowUp size={12} /> Mejorar
                </FMButton>
              </div>
              <div className="bg-white border border-slate-300 p-3 rounded-sm flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase flex items-center gap-2 mb-1">
                    <Users size={14} /> Juveniles
                  </div>
                  <div className="text-[9px] text-slate-600">Nivel actual: <b>{userClub.youthFacilities}/20</b></div>
                  <div className="text-[9px] text-slate-600">Costo proximo nivel: <b>${youthCost.toLocaleString()}</b></div>
                </div>
                <FMButton onClick={() => handleUpgrade('youth')} disabled={userClub.youthFacilities >= 20 || userClub.finances.balance < youthCost} className="text-[10px] shrink-0">
                  <ArrowUp size={12} /> Mejorar
                </FMButton>
              </div>
            </>
          )}
        </div>
      </FMBox>

      <FMBox title="Aumento de Presupuesto de Fichajes">
        <div className="bg-white border border-slate-300 p-3 rounded-sm">
          <div className="text-[10px] mb-2">Pide a la junta un aumento del 30% del presupuesto de fichajes actual</div>
          <div className="text-[9px] text-slate-600 mb-3">Aumento solicitado: <b>${requestedAmount.toLocaleString()}</b></div>
          <FMButton onClick={handleBudgetRequest} className="w-full text-[10px]" variant="primary">
            <DollarSign size={12} /> Solicitar aumento (${requestedAmount.toLocaleString()})
          </FMButton>
        </div>
      </FMBox>

      <FMBox title="Reunión con la directiva">
        <div className="space-y-2">
          <button onClick={() => setShowMeetings(!showMeetings)} className="w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">
            {showMeetings ? 'Ocultar' : 'Mostrar'} reuniones
            {showMeetings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showMeetings && (
            <>
              <p className="text-[9px] text-slate-600 italic">Concierta una reunión y elige el tema del día. La respuesta de la junta depende de la confianza y la reputación del club.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {MEETING_TOPICS.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => handleMeeting(topic)}
                    className="flex items-center gap-2 bg-white border border-[#a0b0a0] hover:border-[#3a4a3a] hover:bg-[#f2f7f2] rounded-sm px-3 py-2 text-[9px] font-black uppercase text-slate-700 transition-all text-left"
                  >
                    <span className="text-[#3a4a3a]">{topic.icon}</span> {topic.label}
                  </button>
                ))}
              </div>
              {meetingLog.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {meetingLog.map((entry, i) => (
                    <div key={i} className={`border-l-4 rounded-sm px-3 py-2 text-[10px] font-bold ${entry.tone === 'POSITIVE' ? 'border-green-500 bg-green-50 text-green-900' : entry.tone === 'NEUTRAL' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-red-500 bg-red-50 text-red-900'}`}>
                      <div className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-0.5">Acta · {entry.topic}</div>
                      {entry.response}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </FMBox>

      <FMBox title="Tu cargo en el club">
        <div className="bg-white border border-slate-300 p-3 rounded-sm flex items-center gap-3">
          <div className="p-2.5 bg-[#e8ece8] border border-[#a0b0a0] rounded-sm text-[#3a4a3a]">
            <Briefcase size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase text-slate-900">{profile?.currentClubName || userClub.name}</div>
            <div className="text-[9px] text-slate-600 font-bold">Entrenador · Temporada {profile?.seasonInClub || 1} en el club</div>
            <div className="text-[8px] text-slate-500 italic">La junta revisa tu continuidad al final de cada temporada según objetivos cumplidos.</div>
          </div>
          <Megaphone size={16} className="text-slate-300 shrink-0" />
        </div>
      </FMBox>

      {feedback && (
        <div className={`p-3 rounded-sm border ${feedback.type === 'success' ? 'bg-green-100 border-green-400 text-green-900' : 'bg-red-100 border-red-400 text-red-900'} text-xs font-bold`}>
          {feedback.message}
        </div>
      )}

    </div>
  );
};
