import React, { useMemo, useEffect } from 'react';
import { world } from '../../services/worldManager';
import { generateUUID } from '../../services/utils';
import { useGameStore } from '../../stores/gameStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import {
  generateFitnessReport, applyFitnessPlan, getFitnessCoach,
  FitnessPlanArchetype,
} from '../../services/staffAdviceService';
import { CharacterDialog } from './CharacterDialog';
import { SpeechBubble } from './SpeechBubble';
import { OptionCard } from './OptionCard';
import { FitnessPanel } from './FitnessPanel';
import { FMButton } from '../FMUI';

export const FitnessCoachDialog: React.FC = () => {
  const { kind, phase, selection, result, data, select, setResult, setClosingPhrase, close, advance } = useDialogueStore();
  const currentDate = useGameStore(s => s.currentDate);

  useEffect(() => {
    if (kind === 'FITNESS' && phase === 'opening') {
      const timer = setTimeout(() => advance(), 250);
      return () => clearTimeout(timer);
    }
  }, [kind, phase, advance]);

  const clubId = data?.clubId;
  const club = clubId ? world.getClub(clubId) : undefined;

  const coach = clubId ? getFitnessCoach(clubId) : null;
  const coachName = coach?.name || 'El Preparador Físico';
  const iniciales = coachName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const clubPrimary = club?.primaryColor || 'bg-[#3a4a3a]';
  const clubBorder = club?.primaryColor ? club.primaryColor.replace('bg-', 'border-') : 'border-[#3a4a3a]';

  const report = useMemo(
    () => (club ? generateFitnessReport(club) : null),
    [club?.id],
  );

  if (kind !== 'FITNESS' || !club || !report) return null;

  const recordEffects = (accion: string) => {
    if (!currentDate) return;
    world.addInboxMessage('SQUAD', 'Plan del preparador físico', `${coachName}: ${accion}`, currentDate, coach?.id);
    world.recordInteraction({
      id: generateUUID(),
      date: currentDate,
      channel: 'COACH_STAFF',
      actorId: 'COACH',
      targetId: coach?.id || club.id,
      type: 'FITNESS_PLAN',
      tone: 'MODERATE',
      result: 'POSITIVE',
      moraleChange: 0,
      tensionChange: 0,
      description: accion,
    });
  };

  const handleAplicar = () => {
    const plan = (selection as FitnessPlanArchetype) || report.recomendacion;
    const count = applyFitnessPlan(club.id, plan);
    const planLabel = report.opciones.find(o => o.id === plan)?.titulo || plan;
    recordEffects(`Aplicó el plan «${planLabel}» para ${count} jugadores.`);
    const reaccion = plan === 'RECUPERACION'
      ? 'Bien, Jefe. Bajamos la carga: el equipo llegará más fresco al próximo partido.'
      : plan === 'RENDIMIENTO'
        ? '¡A por ello! Subimos la intensidad. Exigiré más en cada sesión.'
        : 'Entendido, mantenemos el ritmo actual. Seguiré vigilando las cargas.';
    setResult(reaccion);
  };

  const handleConfirmarResultado = () => {
    setClosingPhrase('Plan aplicado. Ajusto las sesiones y aviso si algo cambia.');
  };

  const footerDecision = (
    <>
      <FMButton variant="primary" onClick={handleAplicar} className="px-6 py-2.5 text-[10px]">
        Aplicar plan
      </FMButton>
      <FMButton variant="secondary" onClick={close} className="px-6 py-2.5 text-[10px]">
        Cancelar
      </FMButton>
    </>
  );

  const footerResultado = (
    <>
      <FMButton variant="primary" onClick={handleConfirmarResultado} className="px-8 py-2.5 text-[10px]">
        Listo
      </FMButton>
    </>
  );

  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => close(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, close]);

  return (
    <CharacterDialog
      nombre={coachName}
      cargo="Preparador Físico"
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={close}
      footer={phase === 'closing' ? null : (phase === 'result' || result ? footerResultado : footerDecision)}
    >
      {phase === 'closing' ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={useDialogueStore.getState().closingPhrase || ''} />
          <p className="text-[9px] italic font-bold text-slate-500 uppercase tracking-widest px-1">
            Los cambios quedaron aplicados al plan de entrenamiento del plantel.
          </p>
        </div>
      ) : result ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={result} />
          <p className="text-[9px] italic font-bold text-slate-500 uppercase tracking-widest px-1">
            Los cambios quedaron aplicados al plan de entrenamiento del plantel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble
            texto={report.textoPrincipal}
            subtitulo={`Recomendado: ${report.opciones.find(o => o.id === report.recomendacion)?.titulo}`}
          />
          <FitnessPanel report={report} />
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {report.opciones.map(op => (
              <OptionCard
                key={op.id}
                id={op.id}
                icono={op.icono}
                titulo={op.titulo}
                descripcion={op.descripcion}
                efectos={op.efectos}
                recomendada={op.id === report.recomendacion}
                justificacion={op.id === report.recomendacion ? report.justificacion : undefined}
                seleccionada={selection === op.id}
                color={clubBorder}
                onClick={() => select(op.id)}
              />
            ))}
          </div>
        </div>
      )}
    </CharacterDialog>
  );
};
