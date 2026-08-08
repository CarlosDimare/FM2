import React, { useMemo, useEffect, useState } from 'react';
import { world } from '../../services/worldManager';
import { generateUUID } from '../../services/utils';
import { useGameStore } from '../../stores/gameStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import {
  generateTacticAdvice, applyTacticPreset, generateLineupAdvice, applyLineup,
  getAssistantStaff, TacticArchetype,
} from '../../services/staffAdviceService';
import { CharacterDialog } from './CharacterDialog';
import { SpeechBubble } from './SpeechBubble';
import { OptionCard } from './OptionCard';
import { LineupPitch } from './LineupPitch';
import { FMButton } from '../FMUI';

interface AssistantAdviceDialogProps {
  onStartMatch?: () => void;
}

export const AssistantAdviceDialog: React.FC<AssistantAdviceDialogProps> = ({ onStartMatch }) => {
  const { kind, phase, selection, data, advance, select, close, setClosingPhrase } = useDialogueStore();
  const [localPaso, setLocalPaso] = useState(1);
  const nextFixture = useGameStore(s => s.nextFixture);
  const currentDate = useGameStore(s => s.currentDate);

  useEffect(() => {
    if (kind === 'ASSISTANT' && phase === 'opening') {
      const timer = setTimeout(() => advance(), 250);
      return () => clearTimeout(timer);
    }
  }, [kind, phase, advance]);

  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => {
        close();
        onStartMatch?.();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [phase, close, onStartMatch]);

  const handleConfirmarPaso1 = () => {
    const tactics = world.getTactics();
    const tactic = (data?.tacticId && tactics.find(t => t.id === data.tacticId)) || tactics[0];
    if (!tactic) return;
    const arch = (selection as TacticArchetype) || advice.recomendacion;
    applyTacticPreset(tactic, arch);
    recordEffects(`Aplicó el plan táctico ${arch}.`);
    setLocalPaso(2);
  };

  const clubId = data?.clubId;
  const club = clubId ? world.getClub(clubId) : undefined;
  const opponentId = data?.opponentId || (nextFixture && clubId
    ? (nextFixture.homeTeamId === clubId ? nextFixture.awayTeamId : nextFixture.homeTeamId)
    : undefined);
  const opponent = opponentId ? world.getClub(opponentId) : undefined;

  const assistant = clubId ? getAssistantStaff(clubId) : null;
  const assistantName = assistant?.name || 'El Asistente';
  const iniciales = assistantName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const clubPrimary = club?.primaryColor || 'bg-[#3a4a3a]';
  const clubBorder = club?.primaryColor ? club.primaryColor.replace('bg-', 'border-') : 'border-[#3a4a3a]';

  const advice = useMemo(
    () => (club ? generateTacticAdvice(club, opponent) : null),
    [club?.id, opponent?.id],
  );

  const lineup = useMemo(
    () => (club ? generateLineupAdvice(club) : null),
    [club?.id, localPaso],
  );

  if (kind !== 'ASSISTANT' || !club || !advice || !lineup) return null;

  const recordEffects = (accion: string) => {
    if (!currentDate) return;
    world.addInboxMessage('SQUAD', 'Consejo del ayudante', `${assistantName}: ${accion}`, currentDate, assistant?.id);
    world.recordInteraction({
      id: generateUUID(),
      date: currentDate,
      channel: 'COACH_STAFF',
      actorId: 'COACH',
      targetId: assistant?.id || club.id,
      type: 'TACTICAL_ADVICE',
      tone: 'MODERATE',
      result: 'POSITIVE',
      moraleChange: 0,
      tensionChange: 0,
      description: accion,
    });
  };

  const handleAceptarOnce = () => {
    applyLineup(club.id, lineup.xi);
    recordEffects('Confirmó el once inicial para el próximo partido.');
    const arch = (selection as TacticArchetype) || advice.recomendacion;
    setClosingPhrase(arch === 'CONSERVATIVE' ? 'Dale, vamos con Conservador. Cerramos filas y esperamos el momento.'
      : arch === 'RISKY' ? 'Dale, vamos con Arriesgado. A por todas desde el primer minuto.'
      : 'Dale, vamos con Equilibrado. Nos vemos en la cancha.');
  };

  const handleAceptarYPartido = () => {
    handleAceptarOnce();
    onStartMatch?.();
  };

  const handleVolverConsejo = () => {
    setLocalPaso(1);
  };

  const footerPaso1 = (
    <>
      <FMButton variant="primary" onClick={handleConfirmarPaso1} className="px-6 py-2.5 text-[10px]">
        Confirmar táctica
      </FMButton>
      <FMButton variant="secondary" onClick={close} className="px-6 py-2.5 text-[10px]">
        Volver
      </FMButton>
    </>
  );

  const footerPaso2 = (
    <>
      <FMButton variant="primary" onClick={handleAceptarOnce} className="px-6 py-2.5 text-[10px]">
        Aceptar once
      </FMButton>
      {onStartMatch ? (
        <FMButton variant="secondary" onClick={handleAceptarYPartido} className="px-6 py-2.5 text-[10px]">
          Aceptar e ir al partido
        </FMButton>
      ) : (
        <FMButton variant="secondary" onClick={handleVolverConsejo} className="px-6 py-2.5 text-[10px]">
          Volver al consejo
        </FMButton>
      )}
    </>
  );

  const quickReplies = localPaso === 1 ? [
    { texto: '¿Por qué no la Arriesgada?', onClick: () => {} },
  ] : undefined;

  return (
    <CharacterDialog
      nombre={assistantName}
      cargo="Segundo Entrenador · Ayudante de Campo"
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={close}
      footer={phase === 'closing' ? null : (localPaso === 1 ? footerPaso1 : footerPaso2)}
      quickReplies={quickReplies}
    >
      {phase === 'closing' ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={useDialogueStore.getState().closingPhrase || ''} />
          <p className="text-[9px] italic font-bold text-slate-500 uppercase tracking-widest px-1">
            Los cambios quedaron aplicados al plan táctico del plantel.
          </p>
        </div>
      ) : localPaso === 1 ? (
        <div className="space-y-4">
          <SpeechBubble
            texto={advice.textoPrincipal}
            subtitulo="Informe basado en el estado de ambos planteles"
          />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {advice.opciones.map(op => (
              <OptionCard
                key={op.id}
                id={op.id}
                icono={op.icono}
                titulo={op.titulo}
                descripcion={op.descripcion}
                efectos={op.efectos}
                recomendada={op.id === advice.recomendacion}
                justificacion={op.id === advice.recomendacion ? advice.justificacion : undefined}
                seleccionada={selection === op.id}
                color={clubBorder}
                onClick={() => { select(op.id); }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble
            texto={lineup.textoPaso2}
            subtitulo={lineup.resumen}
          />
          <LineupPitch
            clubId={club.id}
            clubColor={clubPrimary}
            xi={lineup.xi}
            banquillo={lineup.banquillo}
          />
        </div>
      )}
    </CharacterDialog>
  );
};
