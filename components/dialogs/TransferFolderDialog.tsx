import React, { useMemo, useState } from 'react';
import { world } from '../../services/worldManager';
import { generateUUID } from '../../services/utils';
import { useGameStore } from '../../stores/gameStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import {
  compileTransferFolder, sendOffers, getSportingDirector,
} from '../../services/staffAdviceService';
import { CharacterDialog } from './CharacterDialog';
import { SpeechBubble } from './SpeechBubble';
import { TransferFolderTable } from './TransferFolderTable';
import { FMButton } from '../FMUI';

/**
 * Diálogo del Director Deportivo — Carpeta de Refuerzos (spec §4):
 *  lista de candidatos con semáforo 🟢🟡🔴 + informe del director +
 *  envío de ofertas por lote con validación de presupuesto.
 */
export const TransferFolderDialog: React.FC = () => {
  const { dialog, resultado, data, setResultado, cerrar } = useDialogueStore();
  const currentDate = useGameStore(s => s.currentDate);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());

  const clubId = data?.clubId;
  const club = clubId ? world.getClub(clubId) : undefined;

  const director = clubId ? getSportingDirector(clubId) : null;
  const directorName = director?.name || 'El Director Deportivo';
  const iniciales = directorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const clubPrimary = club?.primaryColor || 'bg-[#3a4a3a]';

  const folder = useMemo(
    () => (club ? compileTransferFolder(club, director) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [club?.id],
  );

  if (dialog !== 'TRANSFERS' || !club || !folder) return null;

  const costeSeleccion = useMemo(() => {
    let total = 0;
    folder.candidatos.forEach(c => { if (seleccionados.has(c.playerId)) total += c.value; });
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionados, folder]);

  const toggle = (playerId: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId); else next.add(playerId);
      return next;
    });
  };

  const recordEffects = (accion: string) => {
    if (!currentDate) return;
    world.addInboxMessage('MARKET', 'Carpeta de refuerzos', `${directorName}: ${accion}`, currentDate, director?.id);
    world.recordInteraction({
      id: generateUUID(),
      date: currentDate,
      channel: 'COACH_STAFF',
      actorId: 'COACH',
      targetId: director?.id || club.id,
      type: 'TRANSFER_FOLDER',
      tone: 'MODERATE',
      result: 'POSITIVE',
      moraleChange: 0,
      tensionChange: 0,
      description: accion,
    });
  };

  const handleEnviar = () => {
    if (!currentDate) return;
    const count = sendOffers(club.id, [...seleccionados], currentDate);
    if (count === 0) {
      setResultado('El lote supera el presupuesto disponible. Reduce la selección o vende antes de intentarlo de nuevo, Jefe.');
      return;
    }
    recordEffects(`Envió ${count} ofertas de la carpeta de refuerzos.`);
    setResultado(`Ofertas enviadas (${count}). Ahora toca esperar la respuesta de los clubes en el centro de fichajes.`);
  };

  const footerDecision = (
    <>
      <FMButton
        variant="primary"
        onClick={handleEnviar}
        disabled={seleccionados.size === 0 || costeSeleccion > folder.presupuesto}
        className="px-6 py-2.5 text-[10px]"
      >
        Enviar ofertas ({seleccionados.size})
      </FMButton>
      <FMButton variant="secondary" onClick={() => { setSeleccionados(new Set()); cerrar(); }} className="px-6 py-2.5 text-[10px]">
        Descartar todo
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
      nombre={directorName}
      cargo="Director Deportivo"
      iniciales={iniciales}
      clubColor={clubPrimary}
      onClose={cerrar}
      footer={resultado ? footerResultado : footerDecision}
    >
      {resultado ? (
        <div className="space-y-4 pt-2 animate-fade-up">
          <SpeechBubble texto={resultado} iniciales={iniciales} clubColor={clubPrimary} />
          <p className="text-[9px] italic font-bold text-slate-500 uppercase tracking-widest px-1">
            Las ofertas quedaron registradas en el centro de fichajes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <SpeechBubble
            texto={`Jefe, aquí tienes la carpeta de refuerzos. Presupuesto disponible: £${(folder.presupuesto / 1000000).toFixed(1)}M. Marca a los que quieras y envío las ofertas.`}
            iniciales={iniciales}
            clubColor={clubPrimary}
          />

          <TransferFolderTable candidatos={folder.candidatos} seleccionados={seleccionados} onToggle={toggle} />

          {/* Informe del director deportivo */}
          <div className="bg-white border border-[#a0b0a0] rounded-sm p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              📄 Informe del director deportivo
            </p>
            <p className="text-[10px] italic font-bold text-slate-700 leading-relaxed">"{folder.textoInforme}"</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pasa el cursor sobre el semáforo para ver la razón de cada jugador</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-[8px] font-black uppercase px-2 py-1 rounded-sm border bg-green-100 text-green-800 border-green-400">Aprobados: {folder.resumen.aprobados}</span>
              <span className="text-[8px] font-black uppercase px-2 py-1 rounded-sm border bg-amber-100 text-amber-800 border-amber-400">En duda: {folder.resumen.enDuda}</span>
              <span className="text-[8px] font-black uppercase px-2 py-1 rounded-sm border bg-red-100 text-red-800 border-red-400">Rechazados: {folder.resumen.rechazados}</span>
            </div>
            {seleccionados.size > 0 && (
              <div className={`mt-3 pt-3 border-t border-[#a0b0a0]/40 flex justify-between items-center ${costeSeleccion > folder.presupuesto ? 'text-red-700' : 'text-slate-700'}`}>
                <span className="text-[9px] font-black uppercase tracking-widest">Coste de seleccionados</span>
                <span className="text-[11px] font-black">£{(costeSeleccion / 1000000).toFixed(1)}M</span>
              </div>
            )}
            {costeSeleccion > folder.presupuesto && (
              <p className="mt-2 text-[9px] font-black uppercase text-red-700 bg-red-50 border border-red-300 rounded-sm px-2 py-1.5">
                ⚠️ El coste supera el presupuesto: el envío será rechazado por el director.
              </p>
            )}
          </div>
        </div>
      )}
    </CharacterDialog>
  );
};
