

import { Player, Staff, DialogueType, DialogueResult, DialogueTone, InteractionLogEntry, InteractionChannel } from "../types";
import { randomInt, generateUUID } from "./utils";
import { world } from "./worldManager";

export class DialogueSystem {
  static getTopicOptions(type: DialogueType): Record<DialogueTone, string> {
    switch (type) {
      case 'PRAISE_FORM':
        return {
          MILD: "Estoy muy contento con tu nivel últimamente, sigue así.",
          MODERATE: "Has estado jugando muy bien, eres una pieza clave.",
          AGGRESSIVE: "¡Increíble nivel! Sigue aplastando rivales de esta forma."
        };
      case 'CRITICIZE_FORM':
        return {
          MILD: "Siento que tu nivel ha bajado un poco, sé que puedes dar más.",
          MODERATE: "Tu rendimiento no es el adecuado para este club, debes mejorar.",
          AGGRESSIVE: "¡Tu forma es vergonzosa! O mejoras ya o te vas al banco."
        };
      case 'PRAISE_TRAINING':
        return {
          MILD: "Me gusta cómo te estás esforzando en los entrenos.",
          MODERATE: "Estás entrenando de maravilla, eso se nota en el campo.",
          AGGRESSIVE: "¡Nadie entrena con tu intensidad! Eres un ejemplo absoluto."
        };
      case 'WARN_CONDUCT':
        return {
          MILD: "Me gustaría que cuidaras un poco más tu disciplina fuera del campo.",
          MODERATE: "No toleraré más faltas de disciplina, compórtate.",
          AGGRESSIVE: "¡Tu comportamiento es inaceptable! Un desplante más y estarás fuera."
        };
      case 'DEMAND_MORE':
        return {
          MILD: "Confío en ti, pero necesito ver algo más de esfuerzo.",
          MODERATE: "Tienes talento de sobra, exígete más a ti mismo.",
          AGGRESSIVE: "¡Basta de caminar! Necesito que dejes la vida en cada pelota."
        };
      case 'SET_CAPTAIN':
        return {
          MILD: "Quiero que lleves el brazalete en los próximos partidos.",
          MODERATE: "Eres el líder que necesitamos. A partir de hoy, capitán.",
          AGGRESSIVE: "¡No me defraudes! El brazalete es tuyo, pero quiero ver garra."
        };
      case 'CHANGE_POSITION':
        return {
          MILD: "Voy a probarte en otra posición para potenciar al grupo.",
          MODERATE: "Esta posición te queda mejor por tus atributos.",
          AGGRESSIVE: "Juegas donde yo diga. No hay discusión."
        };
      case 'INDIVIDUAL_TRAINING_FOCUS':
        return {
          MILD: "Vamos a enfocarnos en un aspecto puntual de tu juego.",
          MODERATE: "Trabajaremos intensamente en tu punto más débil.",
          AGGRESSIVE: "Entrena como si no tuvieras otra opción. Sin excusas."
        };
      case 'THREATEN_TRANSFER':
        return {
          MILD: "Si la cosa no funciona, podría buscar un destino diferente para ti.",
          MODERATE: "Estás en la lista de transferibles si no cambias.",
          AGGRESSIVE: "¡Empieza a buscar club! Aquí no te queremos más."
        };
      case 'GRANT_CAPTANCY':
        return {
          MILD: "Sigue siendo el referente del grupo como eres.",
          MODERATE: "Te confirmo como capitán indiscutido.",
          AGGRESSIVE: "Ya eres el jefe. Asegúrate de que los demás lo sientan."
        };
      case 'ASSIGN_TRAINING':
        return {
          MILD: "Quedas al frente de la preparación física esta semana.",
          MODERATE: "Voy a delegarte el control de la carga de entrenamiento.",
          AGGRESSIVE: "Tú diriges el entrenamiento y sin errores."
        };
      case 'DELEGATE_MATCH':
        return {
          MILD: "Puedes llevar la conducción táctica del próximo partido.",
          MODERATE: "Confío en tu lectura del partido desde la banda.",
          AGGRESSIVE: "Si sale mal, la responsabilidad es tuya."
        };
      case 'REPRIMAND':
        return {
          MILD: "Lo que hiciste no me gustó. No vuelva a pasar.",
          MODERATE: "Tu decisión afectó al grupo. Reflexiona.",
          AGGRESSIVE: "Fuiste un problema. Te estoy advirtiendo formalmente."
        };
      case 'PROMISE_RESOURCES':
        return {
          MILD: "Intentaré mejorar los recursos del plantel.",
          MODERATE: "Hablaré con la directiva por más presupuesto para el equipo.",
          AGGRESSIVE: "Exigiré refuerzos ya mismo. No me falles."
        };
      case 'SCOUTING_FOCUS':
        return {
          MILD: "Enfoca los informes en juveniles de tu región.",
          MODERATE: "Quiero informes completos de las joyas de tu zona.",
          AGGRESSIVE: "Traé nombres concretos de prospectos esta semana."
        };
      case 'PRESS_STATEMENT':
        return {
          MILD: "Transmitiré calma y confianza antes del próximo partido.",
          MODERATE: "El equipo está preparado y esperamos competir al máximo.",
          AGGRESSIVE: "Que hablen en el campo: vamos a por todas."
        };
      case 'CONTACT_MANAGER':
        return {
          MILD: "Me gustaría intercambiar impresiones sobre fútbol y táctica.",
          MODERATE: "Te propongo mantener una relación profesional y directa.",
          AGGRESSIVE: "Nos veremos en el campo; que quede claro quién manda."
        };
      case 'CONVINCE_TO_STAY':
        return {
          MILD: "Entiendo tus motivos. Hablemos y busquemos una solución juntos.",
          MODERATE: "Eres importante para este proyecto. No quiero perderte.",
          AGGRESSIVE: "Tienes contrato y te necesito aquí. No hay discusión."
        };
    }
  }

  static resolveCoachPlayerInteraction(player: Player, type: DialogueType, tone: DialogueTone, currentDate?: Date): DialogueResult {
    const mental = player.stats.internal;
    let moraleChange = 0;
    let text = "";
    let reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    let canReplica = false;
    let tensionChange = 0;

    switch (type) {
      case 'PRAISE_FORM':
        moraleChange = tone === 'AGGRESSIVE' ? (mental.decision >= 15 ? 5 : 15) : 8;
        reactionType = moraleChange >= 8 ? 'POSITIVE' : 'NEUTRAL';
        text = tone === 'AGGRESSIVE' && mental.decision < 15
          ? "¡Se siente el rey del mundo! Tu elogio le ha dado una confianza ciega."
          : `${player.name} agradece tus palabras y dice que seguirá trabajando duro.`;
        break;
      case 'CRITICIZE_FORM':
        if (tone === 'AGGRESSIVE') {
          if (mental.agresividad <= 6) {
            text = "¡Estalla de furia! Te dice que no tienes ni idea de fútbol y se siente insultado.";
            moraleChange = -25;
            reactionType = 'NEGATIVE';
            canReplica = true;
            tensionChange = 15;
          } else if (mental.decision >= 17) {
            text = "Te mira con rabia contenida, pero asiente. Parece que lo has pinchado en el orgullo.";
            moraleChange = 5;
            reactionType = 'POSITIVE';
            tensionChange = 5;
          } else {
            text = "Se hunde por completo. Tu agresividad lo ha dejado sin confianza.";
            moraleChange = -15;
            reactionType = 'NEGATIVE';
            tensionChange = 10;
          }
        } else if (tone === 'MILD') {
          text = mental.decision >= 12
            ? "Reconoce que no está en su mejor momento y promete esforzarse más."
            : "Te ignora con indiferencia. No cree que sus problemas sean tan graves.";
          moraleChange = mental.decision >= 12 ? 5 : 0;
          reactionType = moraleChange > 0 ? 'POSITIVE' : 'NEUTRAL';
        } else {
          text = "Acepta la crítica profesionalmente, aunque se le nota algo dolido.";
          moraleChange = -5;
          reactionType = 'NEUTRAL';
        }
        break;
      case 'DEMAND_MORE':
        if (tone === 'AGGRESSIVE') {
          if (mental.decision >= 15) {
            text = "Acepta el desafío con una mirada desafiante. Está listo para la guerra.";
            moraleChange = 12;
            reactionType = 'POSITIVE';
          } else {
            text = "La presión extrema le está afectando negativamente. Se le ve muy tenso.";
            moraleChange = -12;
            reactionType = 'NEGATIVE';
            tensionChange = 12;
          }
        } else {
          text = "Asiente ante tu petición, aunque no parece haber un cambio radical en su actitud.";
          moraleChange = 2;
          reactionType = 'NEUTRAL';
        }
        break;
      case 'SET_CAPTAIN':
      case 'GRANT_CAPTANCY':
        moraleChange = tone === 'AGGRESSIVE' ? 12 : 8;
        reactionType = 'POSITIVE';
        text = tone === 'AGGRESSIVE'
          ? "Acepta el brazalete con decisión. El equipo sentirá el cambio."
          : "Agradece la confianza y promete representar al club con orgullo.";
        break;
      case 'CHANGE_POSITION':
        moraleChange = tone === 'AGGRESSIVE' ? -5 : 0;
        reactionType = moraleChange < 0 ? 'NEGATIVE' : 'NEUTRAL';
        text = tone === 'AGGRESSIVE'
          ? "No le gusta el cambio, pero acepta sin dejar de mirarte con desconfianza."
          : "Acepta el reto de la nueva posición sin entusiasmo.";
        tensionChange = tone === 'AGGRESSIVE' ? 8 : 3;
        break;
      case 'THREATEN_TRANSFER':
        moraleChange = tone === 'AGGRESSIVE' ? -20 : -10;
        reactionType = 'NEGATIVE';
        text = tone === 'AGGRESSIVE'
          ? "Se va enfadado. Ya está buscando opciones fuera."
          : "Se marcha preocupado, pero no quiere mostrar debilidad.";
        tensionChange = tone === 'AGGRESSIVE' ? 20 : 10;
        break;
      case 'CONVINCE_TO_STAY':
        if (tone === 'AGGRESSIVE') {
          moraleChange = -15;
          reactionType = 'NEGATIVE';
          text = "No acepta imposiciones. Se siente atrapado y su descontento crece.";
          tensionChange = 15;
        } else if (player.loyalty >= 14 || player.personality === 'LOYAL' || player.personality === 'PROFESSIONAL') {
          moraleChange = 12;
          reactionType = 'POSITIVE';
          text = "Aprecia que valores su permanencia. Retira su pedido de traspaso y se compromete a darlo todo.";
          player.transferRequestReason = undefined;
          player.isTransferListed = false;
          player.transferStatus = 'NONE';
        } else if (tone === 'MILD' && player.personality === 'AMBITIOUS') {
          moraleChange = 5;
          reactionType = 'POSITIVE';
          text = "Acepta quedarse... por ahora. Pero deja claro que espera ver progreso en el proyecto.";
          player.transferRequestReason = undefined;
          player.isTransferListed = false;
          player.transferStatus = 'NONE';
        } else {
          moraleChange = 2;
          reactionType = 'NEUTRAL';
          text = "Escucha tus argumentos pero no retira su pedido. Queda en stand-by.";
        }
        break;
      case 'INDIVIDUAL_TRAINING_FOCUS':
        moraleChange = 3;
        reactionType = 'POSITIVE';
        text = "Valora que personalices su preparación y promete aplicar lo trabajado.";
        break;
      default:
        text = "El jugador escucha tus palabras y reacciona de forma medida.";
        moraleChange = 2;
        reactionType = 'NEUTRAL';
    }

    if (currentDate) {
      world.addInboxMessage('STATEMENTS', `Reacción de ${player.name}`, `${player.name} ha reaccionado a tu charla: "${text}"`, currentDate, player.id);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_PLAYER', actorId: 'COACH', targetId: player.id,
        type, tone, result: reactionType, moraleChange, tensionChange, description: text
      });
      world.adjustRelationship('COACH', player.id, reactionType === 'POSITIVE' ? 3 : reactionType === 'NEGATIVE' ? -3 : 0, reactionType === 'POSITIVE' ? 1 : 0, tensionChange);
    }

    return { text, moraleChange, reactionType, canReplica };
  }

  static resolveCoachStaffInteraction(staff: Staff, type: DialogueType, tone: DialogueTone, currentDate?: Date): DialogueResult {
    let moraleChange = 0;
    let text = "";
    let reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    let tensionChange = 0;

    switch (type) {
      case 'ASSIGN_TRAINING':
        moraleChange = tone === 'AGGRESSIVE' ? 4 : 6;
        reactionType = 'POSITIVE';
        text = tone === 'AGGRESSIVE'
          ? "Acepta la responsabilidad, aunque nota la presión."
          : "Agradece la confianza y planea una sesión exigente.";
        break;
      case 'REPRIMAND':
        moraleChange = tone === 'AGGRESSIVE' ? -10 : -5;
        reactionType = 'NEGATIVE';
        text = tone === 'AGGRESSIVE'
          ? "Resiente la amonestación y su clima laboral baja."
          : "Asume el error y promete mejorar.";
        tensionChange = tone === 'AGGRESSIVE' ? 12 : 5;
        break;
      case 'PROMISE_RESOURCES':
        moraleChange = 3;
        reactionType = 'POSITIVE';
        text = "Cree en tu palabra y prepara un plan de apoyo.";
        break;
      case 'SCOUTING_FOCUS':
        moraleChange = 2;
        reactionType = 'POSITIVE';
        text = "Envía una lista de prospectos priorizados por su región.";
        break;
      case 'DELEGATE_MATCH':
        moraleChange = tone === 'AGGRESSIVE' ? -2 : 4;
        reactionType = moraleChange >= 0 ? 'POSITIVE' : 'NEGATIVE';
        text = tone === 'AGGRESSIVE'
          ? "Acepta el reto bajo presión y menciona que la táctica es responsabilidad del DT."
          : "Asume el reto y promete comunicar cada cambio.";
        tensionChange = tone === 'AGGRESSIVE' ? 4 : -2;
        break;
      default:
        text = "El miembro del staff valida tu instrucción.";
        moraleChange = 1;
        reactionType = 'NEUTRAL';
    }

    if (currentDate) {
      world.addInboxMessage('STATEMENTS', `Interacción con ${staff.name}`, `${staff.name} responde: "${text}"`, currentDate, staff.id);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_STAFF', actorId: 'COACH', targetId: staff.id,
        type, tone, result: reactionType, moraleChange, tensionChange, description: text
      });
      world.adjustRelationship('COACH', staff.id, reactionType === 'POSITIVE' ? 2 : reactionType === 'NEGATIVE' ? -2 : 0, reactionType === 'POSITIVE' ? 1 : 0, tensionChange);
    }

    return { text, moraleChange, reactionType };
  }

  static resolvePressStatement(topic: string, tone: DialogueTone, currentDate?: Date): DialogueResult {
    const topicText: Record<string, string> = {
      EXPECTATIONS: 'las expectativas del próximo partido',
      RIVAL: 'el respeto por el rival',
      SQUAD_CONFIDENCE: 'la confianza en el vestuario',
      TRANSFER_RUMOUR: 'los rumores del mercado',
    };
    const moraleChange = tone === 'AGGRESSIVE' ? 2 : tone === 'MILD' ? 1 : 0;
    const text = `${this.getTopicOptions('PRESS_STATEMENT')[tone]} El mensaje se centra en ${topicText[topic] || 'la actualidad del equipo'}.`;
    if (currentDate) {
      world.addInboxMessage('STATEMENTS', 'Declaración ante la prensa', text, currentDate);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_PRESS', actorId: 'COACH', targetId: 'PRESS',
        type: 'PRESS_STATEMENT', tone, result: moraleChange > 0 ? 'POSITIVE' : 'NEUTRAL', moraleChange, tensionChange: 0, description: text
      });
      world.addReputationalBuff('COACH', `PRESS_${topic}`, tone === 'AGGRESSIVE' ? 3 : 1, 14, currentDate);
      if (world.managerProfile) {
        world.managerProfile.pressRelationship = tone === 'AGGRESSIVE' ? 'HAPPY' : 'CALM';
      }
    }
    return { text, moraleChange, reactionType: moraleChange > 0 ? 'POSITIVE' : 'NEUTRAL' };
  }

  static resolveManagerContact(target: Staff, tone: DialogueTone, currentDate?: Date): DialogueResult {
    const targetClub = world.getClub(target.clubId);
    const text = `${target.name} (${targetClub?.name || 'club desconocido'}) recibe tu contacto. ${this.getTopicOptions('CONTACT_MANAGER')[tone]}`;
    const relation = world.getRelationship('COACH', target.id);
    const tensionChange = tone === 'AGGRESSIVE' ? 8 : tone === 'MILD' ? -2 : 1;
    const result = tone === 'AGGRESSIVE' ? 'NEGATIVE' : tone === 'MILD' ? 'POSITIVE' : 'NEUTRAL';
    if (currentDate) {
      world.adjustRelationship('COACH', target.id, result === 'POSITIVE' ? 3 : 0, result === 'POSITIVE' ? 2 : 0, tensionChange);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_MANAGER', actorId: 'COACH', targetId: target.id,
        type: 'CONTACT_MANAGER', tone, result, moraleChange: 0, tensionChange, description: text
      });
      world.addInboxMessage('PEOPLE', 'Contacto con otro entrenador', text, currentDate, target.id);
    }
    return { text, moraleChange: 0, reactionType: result };
  }

  static checkManagerMotives(manager: Staff, currentDate: Date): string | null {
    if (!manager.morale) return null;
    if (manager.morale < 40) return "No me siento valorado en el proyecto. Necesito más respaldo.";
    if ((manager.pressReputation || 50) < 30) return "La prensa me cuestiona y no veo apoyo de la directiva.";
    return null;
  }

  static resolveInitiatedMotive(targetId: string, action: 'PROMISE' | 'IGNORE', currentDate: Date): DialogueResult {
    if (action === 'PROMISE') {
      const target = world.getPlayer(targetId) || world.getStaff(targetId);
      if (target && 'morale' in target && target.morale !== undefined) {
        target.morale = Math.min(100, (target.morale || 70) + 10);
      }
      return {
        text: "La persona se siente escuchada y agradece tu disposición.",
        moraleChange: 10,
        reactionType: 'POSITIVE'
      };
    } else {
      const target = world.getPlayer(targetId) || world.getStaff(targetId);
      if (target && 'morale' in target && target.morale !== undefined) {
        target.morale = Math.max(0, (target.morale || 70) - 15);
      }
      return {
        text: "Se marcha visiblemente molesto por tu falta de empatía.",
        moraleChange: -15,
        reactionType: 'NEGATIVE'
      };
    }
  }

  static resolveBoardInteraction(clubId: string, topic: string, tone: DialogueTone, currentDate?: Date): DialogueResult {
    const club = world.getClub(clubId);
    if (!club) return { text: "No se pudo procesar la solicitud.", moraleChange: 0, reactionType: 'NEUTRAL' };

    const confidence = club.boardConfidence || 50;
    let moraleChange = 0;
    let tensionChange = 0;
    let text = "";
    let reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';

    if (topic === 'BUDGET_REQUEST') {
      const chance = (confidence / 100) * 0.7 + (club.reputation / 10000) * 0.3;
      if (Math.random() < chance) {
        const increase = 0.2 + Math.random() * 0.2;
        club.finances.transferBudget = Math.round(club.finances.transferBudget * (1 + increase));
        text = `La directiva aprobó un aumento del ${(increase * 100).toFixed(0)}% en tu presupuesto de fichajes.`;
        reactionType = 'POSITIVE';
        moraleChange = 8;
      } else {
        text = "La directiva rechazó tu solicitud de presupuesto. Necesitan más resultados?";
        reactionType = 'NEGATIVE';
        moraleChange = -5;
        tensionChange = 10;
        club.boardConfidence = Math.max(0, club.boardConfidence - 3);
      }
    } else if (topic === 'FACILITY_IMPROVEMENT') {
      const chance = (confidence / 100) * 0.6 + (club.reputation / 10000) * 0.4;
      if (Math.random() < chance) {
        const improvement = Math.random() > 0.5 ? 'trainingFacilities' : 'youthFacilities';
        club[improvement] = Math.min(20, club[improvement] + 1);
        text = `La directiva aprobó una mejora en ${improvement === 'trainingFacilities' ? 'las instalaciones de entrenamiento' : 'la cantera'}.`;
        reactionType = 'POSITIVE';
        moraleChange = 6;
      } else {
        text = "La directiva no ve viable una mejora de instalaciones en este momento.";
        reactionType = 'NEGATIVE';
        moraleChange = -3;
        tensionChange = 5;
        club.boardConfidence = Math.max(0, club.boardConfidence - 2);
      }
    } else if (topic === 'CONTRACT_EXTENSION') {
      const manager = world.getStaffByClub(clubId).find(s => s.role === 'HEAD_COACH');
      if (manager && manager.contractExpiry) {
        const yearsLeft = (manager.contractExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsLeft < 1 && confidence > 60) {
          manager.contractExpiry = new Date(currentDate?.getFullYear() || 2008, 5, 30);
          text = "La directiva renovó tu contrato como DT del club.";
          reactionType = 'POSITIVE';
          moraleChange = 10;
          world.adjustRelationship('COACH', 'BOARD_' + clubId, 5, 5, -5);
        } else {
          text = "La directiva prefiere esperar para evaluar tu renovación.";
          reactionType = 'NEUTRAL';
          moraleChange = -2;
          club.boardConfidence = Math.max(0, club.boardConfidence - 1);
        }
      }
    } else if (topic === 'TACTICAL_AUTONOMY') {
      const autonomyChance = confidence / 100;
      if (Math.random() < autonomyChance) {
        text = "La directiva te dio autonomía táctica total. Puedes gestionar el estilo de juego sin interferencias.";
        reactionType = 'POSITIVE';
        moraleChange = 5;
        world.adjustRelationship('COACH', 'BOARD_' + clubId, 3, 3, -3);
      } else {
        text = "La directiva quiere supervisar más las decisiones tácticas.";
        reactionType = 'NEGATIVE';
        moraleChange = -4;
        tensionChange = 8;
        club.boardConfidence = Math.max(0, club.boardConfidence - 2);
      }
    }

    if (currentDate) {
      world.addInboxMessage('STATEMENTS', `Directiva: ${topic}`, text, currentDate, clubId);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_BOARD', actorId: 'COACH', targetId: 'BOARD_' + clubId,
        type: 'PROMISE_RESOURCES', tone, result: reactionType, moraleChange, tensionChange, description: text
      });
    }

    return { text, moraleChange, reactionType };
  }

  static generateTensionEvent(playerId: string, currentDate: Date): InteractionLogEntry | null {
    const player = world.getPlayer(playerId);
    if (!player) return null;

    const rel = world.getRelationship('COACH', playerId);
    const tension = rel?.tension || 0;

    if (tension >= 70) {
      const eventType = Math.random() > 0.5 ? 'TRANSFER_REQUEST' : 'PUBLIC_CRITICISM';
      const text = eventType === 'TRANSFER_REQUEST'
        ? `${player.name} ha solicitado formalmente ser transferido por tensión con el cuerpo técnico.`
        : `${player.name} criticó públicamente al DT en una entrevista.`;

      world.addInboxMessage('STATEMENTS', 'Tensión en el plantel', text, currentDate, playerId);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_PLAYER', actorId: playerId, targetId: 'COACH',
        type: 'CRITICIZE_FORM', tone: 'AGGRESSIVE', result: 'NEGATIVE', moraleChange: -10, tensionChange: -10, description: text
      });
      return {
        id: generateUUID(), date: currentDate, channel: 'COACH_PLAYER', actorId: playerId, targetId: 'COACH',
        type: 'CRITICIZE_FORM', tone: 'AGGRESSIVE', result: 'NEGATIVE', moraleChange: -10, tensionChange: -10, description: text
      };
    }

    return null;
  }

  static generateStaffConflict(clubId: string, currentDate: Date): InteractionLogEntry | null {
    const staffList = world.getStaffByClub(clubId).filter(s => s.role !== 'PHYSIO');
    if (staffList.length < 2) return null;

    const s1 = staffList[randomInt(0, staffList.length - 1)];
    const s2 = staffList[randomInt(0, staffList.length - 1)];
    if (s1.id === s2.id) return null;

    const rel = world.getRelationship(s1.id, s2.id);
    const tension = rel?.tension || 0;

    if (tension >= 65) {
      const text = `Tensión entre ${s1.name} y ${s2.name}: no comparten la misma visión táctica.`;
      world.addInboxMessage('STATEMENTS', 'Conflicto en el staff', text, currentDate, clubId);
      world.recordInteraction({
        id: generateUUID(), date: currentDate, channel: 'COACH_STAFF', actorId: s1.id, targetId: s2.id,
        type: 'REPRIMAND', tone: 'MODERATE', result: 'NEGATIVE', moraleChange: -5, tensionChange: -5, description: text
      });
      return {
        id: generateUUID(), date: currentDate, channel: 'COACH_STAFF', actorId: s1.id, targetId: s2.id,
        type: 'REPRIMAND', tone: 'MODERATE', result: 'NEGATIVE', moraleChange: -5, tensionChange: -5, description: text
      };
    }

    return null;
  }

  static processMonthlyRelationshipDecay(currentDate: Date) {
    world.decayRelationships();
    world.players.forEach(player => {
      if (Math.random() < 0.05) {
        this.generateTensionEvent(player.id, currentDate);
      }
    });
    const uniqueClubs = new Set(world.clubs.map(c => c.id));
    uniqueClubs.forEach(clubId => {
      if (Math.random() < 0.08) {
        this.generateStaffConflict(clubId, currentDate);
      }
    });
  }
}
