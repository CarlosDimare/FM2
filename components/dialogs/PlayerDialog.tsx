import React, { useMemo, useEffect, useState } from 'react';
import { world } from '../../services/worldManager';
import { generateUUID } from '../../services/utils';
import { useGameStore } from '../../stores/gameStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { Player, PLAYER_PERSONALITY_LABELS } from '../../types';
import { CharacterDialog } from './CharacterDialog';
import { SpeechBubble } from './SpeechBubble';
import { ProgressiveOptions } from './ProgressiveOptions';
import { FMButton } from '../FMUI';
import { Heart, Frown, Meh } from 'lucide-react';

type ManagerTone = 'EMPATICO' | 'FIRME' | 'DISTANTE';

const TONE_META: Record<ManagerTone, { label: string; icon: React.ReactNode }> = {
  EMPATICO: { label: 'Empático', icon: <Heart size={14} /> },
  FIRME: { label: 'Firme', icon: <Meh size={14} /> },
  DISTANTE: { label: 'Distante', icon: <Frown size={14} /> },
};

export const PlayerDialog: React.FC = () => {
  const { kind, phase, selection, result, data, advance, select, setResult, setClosingPhrase, setPlayerRelationship, close } = useDialogueStore();
  const currentDate = useGameStore(s => s.currentDate);
  const [localMood, setLocalMood] = useState<'neutral' | 'up' | 'down'>('neutral');

  const player = useMemo(() => {
    if (!data?.playerId) return null;
    return world.getPlayer(data.playerId);
  }, [data?.playerId]);

  const club = data?.clubId ? world.getClub(data.clubId) : null;
  const clubPrimary = club?.primaryColor || 'bg-[#3a4a3a]';
  const iniciales = player?.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'PL';

  const motive = data?.context || 'GENERAL';

  const openingText = useMemo(() => {
    if (!player) return 'Jefe, quería charlar un rato.';
    const personality = player.personality || 'PROFESSIONAL';
    const name = player.name.split(' ').slice(-1)[0];
    switch (motive) {
      case 'MINUTES_DISCONTENT':
        if (personality === 'VOLATILE') return `${name}, no estoy contento. No me estás dando las oportunidades que merezco.`;
        if (personality === 'LEADER') return `Jefe, veo que no estoy teniendo los minutos que espero. Podemos hablar de mi rol en el equipo?`;
        if (personality === 'LAZY') return `Jefe, no me quejo, pero... los minutos ayudan.`;
        if (personality === 'AMBITIOUS') return `Necesito jugar más para mostrar lo que valgo. En este club debería tener más protagonismo.`;
        return `Siento que no estoy teniendo suficientes oportunidades en el campo.`;
      case 'CONTRACT_EXPIRING':
        if (personality === 'VOLATILE') return `Mi contrato se acaba y no veo que me renueven. No me gusta la situación.`;
        if (personality === 'MERCENARY') return `Señor, mi contrato vence pronto. Creo que es momento de hablar de números.`;
        if (personality === 'LOYAL') return `Me gustaría renovar. Aquí estoy bien y quiero seguir.`;
        return `Mi contrato está por vencer y me gustaría hablar de mi futuro en el club.`;
      case 'TRANSFER_RUMOR':
        if (personality === 'VOLATILE') return `Los rumores me tienen nervioso. No sé si cuento con la confianza del cuerpo técnico.`;
        if (personality === 'AMBITIOUS') return `Se habla de interés de otros clubes. Si hay una oportunidad de crecer, deberíamos considerarla.`;
        return `He visto rumores sobre mi futuro. Me gustaría saber qué piensa el club.`;
      case 'DRESSING_ROOM_CONFLICT':
        if (personality === 'VOLATILE') return `No estoy de acuerdo con algunas decisiones del grupo. No me siento cómodo.`;
        if (personality === 'LEADER') return `Hay tensiones en el vestuario que están afectando al equipo. Podemos solucionarlo?`;
        return `Hay algo en el vestuario que no está bien. Necesito hablar de ello.`;
      case 'PRE_MATCH_CHAT':
        if (personality === 'VOLATILE') return `Jefe, hoy salimos a quemar todo. Necesito que lo sepa.`;
        if (personality === 'LEADER') return `El equipo está concentrado. Quería darle un poco de tranquilidad antes del partido.`;
        if (personality === 'LAZY') return `Bueno, ya es hora de salir a la cancha.`;
        return `Jefe, listo para el partido. Quería saludarlo antes de salir.`;
      case 'POST_MATCH_WARNING':
        if (personality === 'VOLATILE') return `No me salieron las cosas, pero no me repita lo mismo dos veces.`;
        if (personality === 'LEADER') return `Asumo mi parte. Hoy no estuve a la altura y lo sabe el grupo entero.`;
        if (personality === 'LAZY') return `Tuve un mal día. No fue mi mejor partido, lo reconozco.`;
        return `Mi rendimiento no fue el esperado. Asumo mi responsabilidad y prometo trabajar para revertirlo.`;
      case 'POST_MATCH_PRAISE':
        if (personality === 'VOLATILE') return `Hoy fui imparable. Que no se me suba a la cabeza, pero estoy en llamas.`;
        if (personality === 'LEADER') return `Fue un buen partido del equipo. Me motiva ver que el grupo está respondiendo.`;
        if (personality === 'MERCENARY') return `Buen rendimiento. Espero que esto se refleje en lo que viene.`;
        return `Gracias por confiar en mí. Hoy salió todo bien, pero no me voy a conformar.`;
      case 'CONTRACT_RENEWAL':
        if (personality === 'VOLATILE') return `No me deje con la duda. Si cuenta conmigo, dígamelo ya.`;
        if (personality === 'LOYAL') return `Me gusta estar aquí. Pero necesito saber si mi futuro está en este club.`;
        if (personality === 'MERCENARY') return `Señor, mi contrato está en un punto clave. Hablemos de números y años.`;
        if (personality === 'LEADER') return `Quiero seguir siendo referente. Si el proyecto me incluye, cerremos el acuerdo.`;
        return `Mi contrato está en un punto donde deberíamos hablar de mi futuro aquí.`;
      default:
        return `Jefe, quería charlar un rato.`;
    }
  }, [player?.personality, motive, player?.name]);

  const options = useMemo(() => {
    return [
      { id: 'EMPATICO' as ManagerTone, label: 'Empático', ...TONE_META.EMPATICO },
      { id: 'FIRME' as ManagerTone, label: 'Firme', ...TONE_META.FIRME },
      { id: 'DISTANTE' as ManagerTone, label: 'Distante', ...TONE_META.DISTANTE },
    ];
  }, []);

  const handleSelect = (tone: ManagerTone) => {
    select(tone);
    let relationshipDelta = 0;
    let moraleChange = 0;
    let reactionText = '';

    const personality = player?.personality || 'PROFESSIONAL';

    if (tone === 'EMPATICO') {
      if (personality === 'VOLATILE') { relationshipDelta = 0.15; moraleChange = 10; reactionText = 'Te escucha con atención. Aprecia que le des espacio para expresarse.'; }
      else if (personality === 'LEADER') { relationshipDelta = 0.1; moraleChange = 5; reactionText = 'Valora el tono conciliador. Está dispuesto a mediar con el resto del plantel.'; }
      else if (personality === 'LAZY') { relationshipDelta = 0.05; moraleChange = 2; reactionText = 'Asiente sin mucho entusiasmo, pero agradece que no le exijas más.'; }
      else if (personality === 'LOYAL') { relationshipDelta = 0.1; moraleChange = 8; reactionText = 'Se siente respaldado por el club. Refuerza su compromiso.'; }
      else if (personality === 'MERCENARY') { relationshipDelta = 0; moraleChange = 3; reactionText = 'Escucha pero evalúa si esto le conviene. No se muestra emocionado.'; }
      else if (personality === 'AMBITIOUS') { relationshipDelta = 0.08; moraleChange = 5; reactionText = 'Agradece el gesto, pero quiere ver hechos concretos.'; }
      else { relationshipDelta = 0.08; moraleChange = 5; reactionText = 'Valora el acercamiento y promete responder en el campo.'; }
    } else if (tone === 'FIRME') {
      if (personality === 'VOLATILE') { relationshipDelta = -0.2; moraleChange = -15; reactionText = 'La firmeza lo hace estallar. Se siente atacado y baja la moral.'; }
      else if (personality === 'LEADER') { relationshipDelta = -0.05; moraleChange = -2; reactionText = 'Acepta la postura firme como parte del liderazgo. No está feliz, pero lo entiende.'; }
      else if (personality === 'LAZY') { relationshipDelta = 0.1; moraleChange = 3; reactionText = 'La exigencia lo despierta. Responde bien a la mano dura.'; }
      else if (personality === 'LOYAL') { relationshipDelta = -0.1; moraleChange = -5; reactionText = 'La dureza lo sorprende, pero por lealtad acepta la decisión.'; }
      else if (personality === 'MERCENARY') { relationshipDelta = -0.15; moraleChange = -10; reactionText = 'La firmeza sin recompensa lo hace replantearse su futuro aquí.'; }
      else if (personality === 'AMBITIOUS') { relationshipDelta = -0.05; moraleChange = 2; reactionText = 'Si la firmeza viene con un plan de crecimiento, lo acepta.'; }
      else { relationshipDelta = 0; moraleChange = 0; reactionText = 'Acepta la postura del DT sin mostrar emociones.'; }
    } else {
      if (personality === 'VOLATILE') { relationshipDelta = -0.3; moraleChange = -20; reactionText = 'El distanciamiento lo hace explotar. Se siente abandonado.'; }
      else if (personality === 'LEADER') { relationshipDelta = -0.15; moraleChange = -8; reactionText = 'No le gusta la frialdad. Puede afectar su liderazgo en el vestuario.'; }
      else if (personality === 'LAZY') { relationshipDelta = 0; moraleChange = 0; reactionText = 'No le molesta. Sigue con lo suyo sin cambiar nada.'; }
      else if (personality === 'LOYAL') { relationshipDelta = -0.2; moraleChange = -10; reactionText = 'El trato frío lo lastima. Su lealtad empieza a flaquear.'; }
      else if (personality === 'MERCENARY') { relationshipDelta = -0.1; moraleChange = -5; reactionText = 'Se aleja. Evalúa opciones en el mercado.'; }
      else if (personality === 'AMBITIOUS') { relationshipDelta = -0.2; moraleChange = -12; reactionText = 'El desinterés lo hace buscar otros proyectos.'; }
      else { relationshipDelta = -0.1; moraleChange = -5; reactionText = 'Se retira pensando que no le estás dando la importancia debida.'; }
    }

    const newRelationship = Math.max(-1, Math.min(1, (useDialogueStore.getState().playerRelationship || 0) + relationshipDelta));
    setPlayerRelationship(newRelationship);

    if (currentDate && player) {
      world.addInboxMessage('SQUAD', `Charlando con ${player.name}`, reactionText, currentDate, player.id);
      world.recordInteraction({
        id: generateUUID(),
        date: currentDate,
        channel: 'COACH_PLAYER',
        actorId: 'COACH',
        targetId: player.id,
        type: 'TACTICAL_ADVICE',
        tone: 'MODERATE',
        result: moraleChange >= 0 ? 'POSITIVE' : 'NEGATIVE',
        moraleChange,
        tensionChange: Math.abs(relationshipDelta) * 50,
        description: reactionText,
      });
      world.adjustRelationship('COACH', player.id, relationshipDelta * 50, relationshipDelta * 30, Math.abs(relationshipDelta) * 30);
      player.morale = Math.max(0, Math.min(100, (player.morale || 50) + moraleChange));
    }

    setResult(reactionText);
    setLocalMood(moraleChange >= 0 ? 'up' : 'down');
  };

  const handleConfirmar = () => {
    const phrases: Record<string, string> = {
      EMPATICO: `Seguimos hablando, ${player?.name.split(' ').slice(-1)[0]}. Cuenta conmigo.`,
      FIRME: `Queda claro. Ahora a demostrarlo en el campo.`,
      DISTANTE: `Ok, lo tengo en cuenta.`,
    };
    setClosingPhrase(phrases[selection as ManagerTone] || 'Ok.');
  };

  const footerOptions = options.map(op => (
    <FMButton
      key={op.id}
      variant={selection === op.id ? 'primary' : 'secondary'}
      onClick={() => handleSelect(op.id)}
      className="px-4 py-2.5 text-[10px] flex items-center gap-2"
    >
      {op.icon} {op.label}
    </FMButton>
  ));

  const footerResult = (
    <FMButton variant="primary" onClick={handleConfirmar} className="px-8 py-2.5 text-[10px]">
      Listo
    </FMButton>
  );

  useEffect(() => {
    if (kind === 'PLAYER_DIALOG' && phase === 'opening') {
      const timer = setTimeout(() => advance(), 250);
      return () => clearTimeout(timer);
    }
  }, [kind, phase, advance]);

  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => close(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, close]);

  if (kind !== 'PLAYER_DIALOG' || !player) return null;

  const cargo = PLAYER_PERSONALITY_LABELS[player.personality || 'PROFESSIONAL'];

  return (
    <CharacterDialog
      nombre={player.name}
      cargo={cargo}
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={close}
      footer={phase === 'closing' ? null : (result ? footerResult : footerOptions)}
      quickReplies={[]}
    >
      {phase === 'closing' ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={useDialogueStore.getState().closingPhrase || ''} />
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase">
            <span className="text-slate-500">Relación:</span>
            <span className={localMood === 'up' ? 'text-green-600' : localMood === 'down' ? 'text-red-600' : 'text-slate-700'}>
              {localMood === 'up' ? '↑ Mejora' : localMood === 'down' ? '↓ Baja' : '—'}
            </span>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={result} />
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase">
            <span className="text-slate-500">Relación:</span>
            <span className={localMood === 'up' ? 'text-green-600' : localMood === 'down' ? 'text-red-600' : 'text-slate-700'}>
              {localMood === 'up' ? '↑ Mejora' : localMood === 'down' ? '↓ Baja' : '—'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble texto={openingText} />
          <ProgressiveOptions
            opciones={options.map(op => ({
              id: op.id,
              icono: op.icon as string,
              titulo: op.label,
              descripcion: '',
              efectos: [],
            }))}
            seleccionada={selection}
            onSelect={(id) => handleSelect(id as ManagerTone)}
          />
        </div>
      )}
    </CharacterDialog>
  );
};
