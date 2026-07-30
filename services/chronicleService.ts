import { Fixture, Player, PlayerMatchStats, Club, Chronicle } from '../types';
import { world } from './worldManager';
import { generateUUID } from './utils';

const HEADLINES_WIN = [
  "¡Victoria contundente!", "Triunfo que ilusiona", "Los tres puntos se quedan en casa",
  "¡Ganamos con autoridad!", "Victoria que da moral", "El equipo responde",
  "¡Vamos con todo!", "Triunfo merecido",
];

const HEADLINES_DRAW = [
  "Puntos que se escapan", "Empate que deja gusto amargo", "Un punto que no alcanza",
  "Empate sin brillo", "Se escapan los puntos", "Empate frustrante",
];

const HEADLINES_LOSS = [
  "Derrota que duele", "Noche para el olvido", "Golpe duro a la ilusión",
  "Derrota amarga", "El equipo se derrumba", "Mala noche en el campo",
];

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGoalDescription(scorer: Player, minute: number): string {
  const descs = [
    `${scorer.name} abrió el marcador en el minuto ${minute}`,
    `Golazo de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} define con clase en el minuto ${minute}`,
    `Tiro imparable de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} marca en el minuto ${minute}`,
    `Cabezazo certero de ${scorer.name} al minuto ${minute}`,
    `${scorer.name} fusila al arquero en el minuto ${minute}`,
  ];
  return pick(descs);
}

function getGoalCommentary(minute: number, scorerName: string, isUserClub: boolean): string {
  const early = minute <= 20;
  const late = minute >= 70;
  const mid = minute > 20 && minute < 70;

  if (early) {
    return pick([
      `Arranque fulminante: ${scorerName} golpea temprano y enciende las alarmas del rival.`,
      `Antes de los 20 minutos, ${scorerName} ya había puesto el 1-0. El partido se abrió de inmediato.`,
      `Gol madrugador de ${scorerName}. El encuentro tomó temperatura desde el vamos.`,
    ]);
  }
  if (late) {
    return pick([
      `En los minutos finales, ${scorerName} apareció para definir con jerarquía. Golpe letal sobre el cierre.`,
      `Sobre el final, cuando todo parecía resuelto, ${scorerName} liquidó el partido con un gol que desató la celebración.`,
      `Cierre de película: ${scorerName} anota en el tramo final y sella la historia.`,
    ]);
  }
  return pick([
    `Transcurrían ${minute} minutos cuando ${scorerName} encontró espacio y no perdonó.`,
    `En plena etapa de control del partido, ${scorerName} rompió la paridad.`,
    `Corría el minuto ${minute} y ${scorerName} ejecutó una jugada brillante para marcar.`,
  ]);
}

function getComment(scorer: Player, minute: number, isUserClub: boolean): string {
  return `${getGoalDescription(scorer, minute)}. ${getGoalCommentary(minute, scorer.name, isUserClub)}`;
}

function getAtmosphere(isWin: boolean, isDraw: boolean, isHome: boolean): string {
  if (isWin) {
    return isHome
      ? pick(["La afición celebró con euforia.", "El público aplaudió de pie.", "La hinchada cantó hasta el final.", "Ambiente festivo en las gradas."])
      : pick(["Los hinchas viajeros celebraron lejos de casa.", "La afición visitante se fue feliz.", "Victoria celebrada por la afición visitante."]);
  }
  if (isDraw) {
    return pick(["La afición mostró descontento.", "Silbidos mezclados con aplausos tibios.", "Los hinchas se fueron frustrados."]);
  }
  return isHome
    ? pick(["Silbidos ensordecedores.", "La afición abandonó en silencio.", "Malestar generalizado.", "Decepción en las gradas."])
    : pick(["La afición visitante no pudo celebrar.", "Los hinchas viajeros se marchan decepcionados."]);
}

export function generateMatchChronicle(
  fixture: Fixture,
  homeScore: number,
  awayScore: number,
  stats: Record<string, PlayerMatchStats>,
  userClubId: string
): Chronicle | null {
  const homeClub = world.getClub(fixture.homeTeamId);
  const awayClub = world.getClub(fixture.awayTeamId);
  if (!homeClub || !awayClub) return null;

  const isHome = fixture.homeTeamId === userClubId;
  const userClubName = isHome ? homeClub.name : awayClub.name;
  const opponentName = isHome ? awayClub.name : homeClub.name;
  const userScore = isHome ? homeScore : awayScore;
  const oppScore = isHome ? awayScore : homeScore;
  const win = userScore > oppScore;
  const draw = userScore === oppScore;

  const allIds = Object.keys(stats);
  let bestPlayer: Player | null = null;
  let bestRating = 0;
  let worstPlayer: Player | null = null;
  let worstRating = 10;
  allIds.forEach(pid => {
    const s = stats[pid];
    if (s && s.minutesPlayed > 30) {
      if (s.rating > bestRating) {
        bestRating = s.rating;
        bestPlayer = world.getPlayer(pid);
      }
      if (s.rating < worstRating) {
        worstRating = s.rating;
        worstPlayer = world.getPlayer(pid);
      }
    }
  });

  const scorers: { player: Player; minute: number }[] = [];
  let totalShots = 0;
  let totalOnTarget = 0;
  allIds.forEach(pid => {
    const s = stats[pid];
    if (!s) return;
    totalShots += s.shots || 0;
    totalOnTarget += s.shotsOnTarget || 0;
    if (s.goals > 0) {
      const p = world.getPlayer(pid);
      if (p) scorers.push({ player: p, minute: 5 + Math.floor(Math.random() * 80) });
    }
  });

  // deduplicate scorers by id
  const seen = new Set<string>();
  const uniqueScorers = scorers.filter(s => {
    if (seen.has(s.player.id)) return false;
    seen.add(s.player.id);
    return true;
  });

  // Sort scorers by minute for chronological narrative
  uniqueScorers.sort((a, b) => a.minute - b.minute);

  let headline: string;
  if (draw) headline = pick(HEADLINES_DRAW);
  else if (win) headline = pick(HEADLINES_WIN);
  else headline = pick(HEADLINES_LOSS);

  // COLOFÓN (summary / lead paragraph -- the "copete")
  const scoreStr = `${userScore}-${oppScore}`;
  let summaryIntro: string;
  if (win) {
    summaryIntro = pick([
      `En una jornada vibrante, ${userClubName} superó a ${opponentName} por ${scoreStr} y sumó tres puntos clave.`,
      `${userClubName} se impuso con autoridad ante ${opponentName} con un marcador de ${scoreStr}.`,
      `Triunfo trabajado de ${userClubName} sobre ${opponentName}. El ${scoreStr} refleja lo visto en cancha.`,
    ]);
  } else if (draw) {
    summaryIntro = pick([
      `${userClubName} y ${opponentName} igualaron ${scoreStr} en un partido parejo que dejó sabor a poco.`,
      `Reparto de puntos entre ${userClubName} y ${opponentName}: ${scoreStr} fue el resultado final.`,
    ]);
  } else {
    summaryIntro = pick([
      `${userClubName} cayó derrotado ${scoreStr} frente a ${opponentName} en una tarde para el olvido.`,
      `Golpe duro para ${userClubName}: ${opponentName} se llevó la victoria por ${scoreStr}.`,
    ]);
  }

  // ====== DESARROLLO (narrative of the match) ======
  const devParts: string[] = [];
  devParts.push(summaryIntro);

  // First half narrative
  const firstHalfGoals = uniqueScorers.filter(s => s.minute <= 45);
  const secondHalfGoals = uniqueScorers.filter(s => s.minute > 45);

  if (firstHalfGoals.length > 0) {
    devParts.push(`El primer tiempo arrancó con intensidad.`);
    firstHalfGoals.forEach(s => {
      devParts.push(`${getGoalDescription(s.player, s.minute)}. ${getGoalCommentary(s.minute, s.player.name, true)}`);
    });
  } else if (userScore === 0 && oppScore === 0) {
    devParts.push(`El primer tiempo fue un estudio de cautela táctica. Ambos equipos se respetaron y las ocasiones de gol brillaron por su ausencia.`);
  } else {
    devParts.push(`Los primeros 45 minutos transcurrieron con dominio alternado, pero sin que ninguno lograra romper el cero en la primera etapa.`);
  }

  if (secondHalfGoals.length > 0) {
    devParts.push(`En el complemento, el encuentro ganó en emotividad.`);
    secondHalfGoals.forEach(s => {
      devParts.push(`${getComment(s.player, s.minute, true)}`);
    });
  } else if (draw) {
    devParts.push(`La segunda parte mantuvo la paridad. Ambos equipos intentaron pero las defensas prevalecieron.`);
  } else if (win) {
    devParts.push(`La segunda parte mostró a un equipo que supo manejar los tiempos y cerrar los espacios.`);
  } else {
    devParts.push(`En la segunda mitad, el equipo no encontró los caminos. El partido se complicó.`);
  }

  // Best player / MVP
  if (bestPlayer && bestRating >= 7.5) {
    devParts.push(`${bestPlayer.name} fue elegido la figura del partido con una calificación de ${bestRating.toFixed(1)}. ${bestPlayer.name} lideró cada avance y fue determinante.`);
  } else if (bestPlayer) {
    devParts.push(`${bestPlayer.name} fue el más regular del equipo (${bestRating.toFixed(1)}), aunque sin lograr desequilibrar.`);
  }

  if (worstPlayer && worstRating < 5.5) {
    devParts.push(`Lejos de su mejor nivel, ${worstPlayer.name} apenas alcanzó un ${worstRating.toFixed(1)}. Su rendimiento quedó en deuda.`);
  }

  // Collective statistics paragraph
  const accDesc = totalShots > 0
    ? `En total, el equipo acumuló ${totalShots} disparos (${totalOnTarget} a puerta).`
    : `El equipo no logró generar peligro en ataque.`;
  devParts.push(accDesc);

  if (userScore >= 3) {
    devParts.push('Fue una lluvia de goles que celebró la afición.');
  }

  // Tactical analysis
  if (win && userScore >= 3) {
    devParts.push(pick(['El plan táctico fue ejecutado a la perfección. Cada pieza encajó con precisión quirúrgica.', 'Desde el banco se tomaron decisiones estratégicas que inclinaron la balanza.']));
  } else if (win) {
    devParts.push(pick(['El equipo mostró disciplina táctica y supo aprovechar los momentos clave.', 'Las indicaciones desde el banco rindieron frutos: partido controlado y victoria merecida.']));
  } else if (draw) {
    devParts.push(pick(['Servirá lo rescatado, pero el equipo debe mostrar más contundencia.', 'Un punto que suma pero que no termina de convencer.']));
  } else {
    devParts.push(pick(['Una tarde gris: el equipo no encontró su juego y el rival se aprovechó.', 'Tocará revisar el esquema táctico: el plan nunca se vio en la cancha.']));
  }

  // Atmosphere / cierre
  devParts.push(getAtmosphere(win, draw, isHome));

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'MATCH',
    date: new Date(fixture.date),
    title: headline,
    body: devParts.join('\n\n'),
    fixtureId: fixture.id,
    clubId: userClubId,
  };

  world.chronicles.push(chronicle);
  return chronicle;
}

export function generateMonthlyChronicle(
  clubId: string,
  date: Date,
  results: { won: number; drawn: number; lost: number }
): Chronicle | null {
  const club = world.getClub(clubId);
  if (!club) return null;

  const total = results.won + results.drawn + results.lost;
  if (total === 0) return null;

  const monthName = MONTH_NAMES[date.getMonth()];

  let balance: string;
  if (results.won >= 4) balance = 'excelente';
  else if (results.won >= 3 && results.lost <= 1) balance = 'positivo';
  else if (results.won >= 2 && results.lost >= 2) balance = 'de altibajos';
  else if (results.won >= 1 && results.lost >= 3) balance = 'negativo';
  else balance = 'para olvidar';

  const squad = world.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR' && p.formRatings && p.formRatings.length > 0);
  let bestP: Player | null = null;
  let worstP: Player | null = null;
  let bestAvg = 0;
  let worstAvg = 10;
  squad.forEach(p => {
    const avg = p.formRatings.reduce((a, b) => a + b, 0) / p.formRatings.length;
    if (avg > bestAvg) { bestAvg = avg; bestP = p; }
    if (avg < worstAvg && p.formRatings.length >= 2) { worstAvg = avg; worstP = p; }
  });

  const parts: string[] = [];
  parts.push(`${monthName} fue un mes ${balance} para el equipo.`);
  parts.push(`${results.won} victoria${results.won !== 1 ? 's' : ''}, ${results.drawn} empate${results.drawn !== 1 ? 's' : ''} y ${results.lost} derrota${results.lost !== 1 ? 's' : ''}.`);

  if (bestP) parts.push(`${bestP.name} fue el mejor del mes (${bestAvg.toFixed(1)} de promedio).`);
  if (worstP && worstAvg < 6.5) parts.push(`${worstP.name} necesita mejorar (${worstAvg.toFixed(1)} de promedio).`);

  parts.push(pick(["La directiva respalda al entrenador.", "La directiva vigila los resultados.", "La presión crece con cada partido."]));

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'MONTHLY',
    date: new Date(date),
    title: `Informe: ${monthName} ${date.getFullYear()}`,
    body: parts.join(' '),
    clubId,
    month: date.getMonth(),
    year: date.getFullYear(),
  };

  world.chronicles.push(chronicle);
  return chronicle;
}

export function generateCareerChronicle(
  managerName: string,
  clubId: string,
  seasons: number,
  stats: { totalGames: number; totalWins: number; totalDraws: number; totalLosses: number; titles: string[]; youthDebuts: number },
  endDate: Date
): Chronicle | null {
  const club = world.getClub(clubId);
  if (!club) return null;

  const winRate = stats.totalGames > 0 ? stats.totalWins / stats.totalGames : 0;
  let balance: string;
  if (stats.titles.length >= 3) balance = 'extraordinaria';
  else if (stats.titles.length >= 1) balance = 'exitosa';
  else if (winRate >= 0.5) balance = 'sólida';
  else if (winRate >= 0.35) balance = 'irregular';
  else balance = 'complicada';

  const parts: string[] = [];
  parts.push(`El entrenador ${managerName} cierra su etapa en ${club.name} después de ${seasons} temporada${seasons > 1 ? 's' : ''}.`);
  parts.push(`Se va con una carrera ${balance}.`);
  parts.push(`En total disputó ${stats.totalGames} partidos: ${stats.totalWins} victorias, ${stats.totalDraws} empates y ${stats.totalLosses} derrotas.`);

  if (stats.titles.length > 0) {
    parts.push(`Títulos: ${stats.titles.join(', ')}.`);
  }
  if (stats.youthDebuts > 0) {
    parts.push(`Hizo debutar a ${stats.youthDebuts} jugador${stats.youthDebuts > 1 ? 'es' : ''} de la cantera.`);
  }

  parts.push(pick([
    "Dejó una huella imborrable en la historia del club.",
    "La afición lo recordará como un líder nato.",
    "Construyó un equipo con identidad y carácter.",
    "Su legado trasciende los resultados.",
  ]));

  parts.push(pick([
    "La prensa lo recuerda como un técnico meticuloso y exigente.",
    "Los medios lo describen como un hombre de confianza.",
    "Destacó por sacar lo mejor de cada jugador.",
  ]));

  parts.push(pick([
    `Ahora ${managerName} busca nuevos desafíos.`,
    `${managerName} se despide, pero su legado permanece.`,
    `Su nombre ya suena para futuros proyectos.`,
  ]));

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'CAREER',
    date: new Date(endDate),
    title: `El adiós de ${managerName}`,
    body: parts.join(' '),
    clubId,
  };

  world.chronicles.push(chronicle);
  return chronicle;
}
