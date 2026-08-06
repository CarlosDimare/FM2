import React, { useMemo } from 'react';
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

/**
 * Diálogo del Preparador Físico (spec §3):
 *  Paso 1: estado del plantel (carga/riesgo) + 3 planes de carga
 *  Resultado: reacción del PF tras aplicar el plan
 */
export const FitnessCoachDialog: React.FC = () => {
  const { dialog, seleccion, resultado, data, seleccionar, setResultado, cerrar } = useDialogueStore();
  const currentDate = useGameStore(s => s.currentDate);

  const clubId = data?.clubId;
  const club = clubId ? world.getClub(clubId) : undefined;

  const coach = clubId ? getFitnessCoach(clubId) : null;
  const coachName = coach?.name || 'El Preparador Físico';
  const iniciales = coachName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const clubPrimary = club?.primaryColor || 'bg-[#3a4a3a]';
  const clubBorder = club?.primaryColor ? club.primaryColor.replace('bg-', 'border-') : 'border-[#3a4a3a]';

  const report = useMemo(
    () => (club ? generateFitnessReport(club) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [club?.id],
  );

  if (dialog !== 'FITNESS' || !club || !report) return null;

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
    const plan = (seleccion as FitnessPlanArchetype) || report.recomendacion;
    const count = applyFitnessPlan(club.id, plan);
    const planLabel = report.opciones.find(o => o.id === plan)?.titulo || plan;
    recordEffects(`Aplicó el plan «${planLabel}» para ${count} jugadores.`);
    const reaccion = plan === 'RECUPERACION'
      ? 'Bien, Jefe. Bajamos la carga: el equipo llegará más fresco al próximo partido.'
      : plan === 'RENDIMIENTO'
        ? '¡A por ello! Subimos la intensidad. Exigiré más en cada sesión.'
        : 'Entendido, mantenemos el ritmo actual. Seguiré vigilando las cargas.';
    setResultado(reaccion);
  };

  const footerDecision = (
    <>
      <FMButton variant="primary" onClick={handleAplicar} className="px-6 py-2.5 text-[10px]">
        Aplicar plan
      </FMButton>
      <FMButton variant="secondary" onClick={cerrar} className="px-6 py-2.5 text-[10px]">
        Cancelar
      </FMButton>
    </>
  );

  const footerResultado = (
    <FMButton variant="primary" onClick={cerrar} className="px-8 py-2.5 text-[10px]">
      Listo
    </FMButton>
  );

  return (
    <CharacterDialog
      nombre={coachName}
      cargo="Preparador Físico"
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={cerrar}
      footer={resultado ? footerResultado : footerDecision}
    >
      {resultado ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble
            texto={resultado || ''}
            iniciales={iniciales}
            clubColor={clubPrimary}
          />
          <p className="text-[9px] italic font-bold text-slate-500 uppercase tracking-widest px-1">
            Los cambios quedaron aplicados al plan de entrenamiento del plantel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble
            texto={report.textoPrincipal}
            subtitulo={`Recomendado: ${report.opciones.find(o => o.id === report.recomendacion)?.titulo}`}
            iniciales={iniciales}
            clubColor={clubPrimary}
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
                seleccionada={seleccion === op.id}
                color={clubBorder}
                onClick={() => seleccionar(op.id)}
              />
            ))}
          </div>
        </div>
      )}
    </CharacterDialog>
  );
};
