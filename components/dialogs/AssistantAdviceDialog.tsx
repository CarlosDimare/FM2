import React, { useMemo } from 'react';
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

/**
 * Diálogo del Ayudante de Campo — flujo de 2 pasos (spec §2):
 *  Paso 1: consejo táctico (3 arquetipos + recomendación con justificación)
 *  Paso 2: anuncio del XI (cancha 2D + razones + banquillo) → ¡Al partido!
 */
export const AssistantAdviceDialog: React.FC<AssistantAdviceDialogProps> = ({ onStartMatch }) => {
  const { dialog, paso, seleccion, data, setPaso, seleccionar, cerrar } = useDialogueStore();
  const nextFixture = useGameStore(s => s.nextFixture);
  const currentDate = useGameStore(s => s.currentDate);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [club?.id, opponent?.id],
  );

  const lineup = useMemo(
    () => (club ? generateLineupAdvice(club) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [club?.id, paso],
  );

  if (dialog !== 'ASSISTANT' || !club || !advice || !lineup) return null;

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

  const handleConfirmarPaso1 = () => {
    const tactics = world.getTactics();
    const tactic = (data?.tacticId && tactics.find(t => t.id === data.tacticId)) || tactics[0];
    if (!tactic) return;
    const arch = (seleccion as TacticArchetype) || advice.recomendacion;
    applyTacticPreset(tactic, arch);
    recordEffects(`Aplicó el plan táctico ${arch}.`);
    setPaso(2);
  };

  const handleConfirmarPaso2 = () => {
    applyLineup(club.id, lineup.xi);
    recordEffects('Confirmó el once inicial para el próximo partido.');
    cerrar();
    onStartMatch?.();
  };

  const footerPaso1 = (
    <>
      <FMButton variant="primary" onClick={handleConfirmarPaso1} className="px-6 py-2.5 text-[10px]">
        Confirmar táctica
      </FMButton>
      <FMButton variant="secondary" onClick={cerrar} className="px-6 py-2.5 text-[10px]">
        Volver
      </FMButton>
    </>
  );

  const footerPaso2 = (
    <>
      <FMButton variant="primary" onClick={handleConfirmarPaso2} className="px-6 py-2.5 text-[10px]">
        ¡Al partido!
      </FMButton>
      <FMButton variant="secondary" onClick={() => setPaso(1)} className="px-6 py-2.5 text-[10px]">
        Volver al consejo
      </FMButton>
    </>
  );

  return (
    <CharacterDialog
      nombre={assistantName}
      cargo="Segundo Entrenador · Ayudante de Campo"
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={cerrar}
      footer={paso === 1 ? footerPaso1 : footerPaso2}
    >
      {paso === 1 ? (
        <div className="space-y-4">
          <SpeechBubble
            texto={advice.textoPrincipal}
            subtitulo="Informe basado en el estado de ambos planteles"
            iniciales={iniciales}
            clubColor={clubPrimary}
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
                seleccionada={seleccion === op.id}
                color={clubBorder}
                onClick={() => seleccionar(op.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble
            texto={lineup.textoPaso2}
            subtitulo={lineup.resumen}
            iniciales={iniciales}
            clubColor={clubPrimary}
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
