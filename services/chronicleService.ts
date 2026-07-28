import { Fixture, Player, PlayerMatchStats, Club } from '../types';
import { world } from './worldManager';
import { generateUUID } from './utils';

export type ChronicleType = 'MATCH' | 'MONTHLY' | 'CAREER';

export interface Chronicle {
  id: string;
  type: ChronicleType;
  date: Date;
  title: string;
  body: string;
  fixtureId?: string;
  clubId?: string;
  month?: number;
  year?: number;
}

const HEADLINES_WIN = [
  "¡Victoria contundente!",
  "Triunfo que ilusiona",
  "Los tres puntos se quedan en casa",
  "¡Ganamos con autoridad!",
  "Victoria que da moral",
  "El equipo responde",
  "¡Vamos con todo!",
  "Triunfo merecido",
];

const HEADLINES_DRAW = [
  "Puntos perdidos en casa",
  "Empate que deja gusto amargo",
  "Un punto que no alcanza",
  "Empate sin brillo",
  "Se escapan los puntos",
  "Empate frustrante",
];

const HEADLINES_LOSS = [
  "Derrota que duele",
  "Noche para el olvido",
  "Golpe duro a la ilusión",
  "Derrota amarga",
  "El equipo se derrumba",
  "Mala noche en el campo",
  "Derrota que abreHeridas",
];

const RESULT_CALIFIERS = {
  THRASHING: ['golea', 'destruye', 'aplasta', 'machaca'],
  NARROW: ['supera', 'vence por minim differences', 'se impone ajustadamente'],
  COMEBACK: ['remonta y vence', 'da la vuelta al marcador'],
  LATE_WIN: ['gana en el último instante', 'se lleva la victoria en la muerte'],
  DRAWS_HIGH: ['empata en un vibrante partido', 'comparte puntos en un gran choque'],
  DRAWS_LOW: ['empata en un duelo sin goles', 'no pasa del empate en un partido aburrido'],
  LOSS_HEAVY: ['sufre una goleada', 'es superado con claridad'],
  LOSS_NARROW: ['cae ajustadamente', 'pierde por la mínima'],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getResultType(homeScore: number, awayScore: number, isHome: boolean): string {
  const diff = isHome ? homeScore - awayScore : awayScore - homeScore;
  const totalGoals = homeScore + awayScore;
  if (diff >= 3) return 'THRASHING';
  if (diff === 1 && totalGoals >= 4) return 'LATE_WIN';
  if (diff === 1) return 'NARROW';
  if (diff === 0 && totalGoals >= 4) return 'DRAWS_HIGH';
  if (diff === 0) return 'DRAWS_LOW';
  if (diff <= -3) return 'LOSS_HEAVY';
  return 'LOSS_NARROW';
}

function getGoalDescription(scorer: Player, minute: number, club: Club): string {
  const pos = scorer.positions[0];
  const posName = pos === 'P' ? 'el portero' : pos === 'DC' || pos === 'DFC' ? 'el zaguero central' : pos === 'MC' ? 'el mediocampista' : pos === 'ED' || pos === 'EI' ? 'el extremo' : pos === 'DC' ? 'el delantero' : 'el jugador';
  const descriptions = [
    `${posName} ${scorer.name} abrió el marcador en el minuto ${minute}`,
    `Golazo de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} define con clase en el minuto ${minute}`,
    `Tiro imparable de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} marca en el minuto ${minute} tras una jugada coral`,
  ];
  return pick(descriptions);
}

function getKeyEventDescription(events: { type: string; text: string; minute: number }[]): string | null {
  const importantEvents = events.filter(e => e.type === 'RED_CARD' || e.type === 'INJURY');
  if (importantEvents.length > 0) {
    return importantEvents[0].text;
  }
  return null;
}

function getMatchAtmosphere(resultType: string, isHome: boolean): string {
  if (isHome) {
    if (resultType.startsWith('WIN') || resultType === 'NARROW' || resultType === 'THRASHING') {
      return pick([
        "La afición celebró con euforia la victoria.",
        "El público aplaudió de pie al final del encuentro.",
        "La hinchada cantó hasta el último minuto.",
        "Ambiente festivo en las gradas.",
      ]);
    } else if (resultType === 'DRAWS_LOW' || resultType === 'DRAWS_HIGH') {
      return pick([
        "La afición mostró su descontento al final del partido.",
        "Los hinchas no pudieron ocultar su frustración.",
        "Silbidos mezclados con algunos aplausos tibios.",
      ]);
    } else {
      return pick([
        "Silbidos ensordecedores en el estadio.",
        "La afición abandonó las gradas en silencio.",
        "Malestar generalizado entre los hinchas.",
        "El público mostró su decepción al finalizar el encuentro.",
      ]);
    }
  } else {
    if (resultType.startsWith('WIN') || resultType === 'NARROW' || resultType === 'THRASHING') {
      return pick([
        "Los hinchas viajeros celebraron la victoria lejos de casa.",
        "La afición visitante celebró con euforia en las gradas.",
        "Victoria extra para la hinchada que viajó.",
      ]);
    } else {
      return pick([
        "La afición visitante no pudo celebrar.",
        "Los hinchas viajeros se marchan decepcionados.",
      ]);
    }
  }
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
  const opponentClubName = isHome ? awayClub.name : homeClub.name;
  const isUserWin = (isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore);
  const isDraw = homeScore === awayScore;

  // Find best player
  const allPlayerIds = Object.keys(stats);
  let bestPlayerId = allPlayerIds[0];
  let bestRating = 0;
  allPlayerIds.forEach(pid => {
    if (stats[pid].rating > bestRating && stats[pid].minutesPlayed > 30) {
      bestRating = stats[pid].rating;
      bestPlayerId = pid;
    }
  });
  const bestPlayer = world.getPlayer(bestPlayerId);

  // Find goals
  const goalEvents: { playerId: string; minute: number }[] = [];
  allPlayerIds.forEach(pid => {
    if (stats[pid].goals > 0) {
      goalEvents.push({ playerId: pid, minute: 45 + Math.floor(Math.random() * 45) });
    }
  });

  // Result type
  const resultType = getResultType(homeScore, awayScore, isHome);

  // Build headline
  let headline: string;
  if (isDraw) {
    headline = pick(HEADLINES_DRAW);
  } else if (isUserWin) {
    headline = pick(HEADLINES_WIN);
  } else {
    headline = pick(HEADLINES_LOSS);
  }

  // Build body
  let bodyParts: string[] = [];

  // Opening
  const scoreText = `${homeScore} - ${awayScore}`;
  bodyParts.push(`${userClubName} ${isUserWin ? 'vence' : isDraw ? 'empata' : 'cae'} ${scoreText} contra ${opponentClubName}.`);

  // Goal descriptions
  if (goalEvents.length > 0) {
    const goalDescs = goalEvents.slice(0, 3).map(ge => {
      const player = world.getPlayer(ge.playerId);
      if (player) {
        return getGoalDescription(player, ge.minute, player.clubId === userClubId ? homeClub : awayClub);
      }
      return null;
    }).filter(Boolean);
    if (goalDescs.length > 0) {
      bodyParts.push(goalDescs.join('. ') + '.');
    }
  }

  // Key event
  const keyEvent = getKeyEventDescription([]);
  if (keyEvent) {
    bodyParts.push(keyEvent);
  }

  // Best player
  if (bestPlayer && bestRating >= 7.5) {
    bodyParts.push(`${bestPlayer.name} fue el más destacado con una calificación de ${bestRating.toFixed(1)}.`);
  }

  // Atmosphere
  bodyParts.push(getMatchAtmosphere(resultType, isHome));

  // Tactical note
  if (isUserWin) {
    bodyParts.push(pick([
      "El planteamiento táctico funcionó a la perfección.",
      "Las decisiones del técnico dieron sus frutos.",
      "El equipo cumplió el plan de juego a la perfección.",
    ]));
  } else if (!isDraw && !isUserWin) {
    bodyParts.push(pick([
      "El equipo no encontró su ritmo en el campo.",
      "Las decisiones tácticas no funcionaron como se esperaba.",
      "El rival fue superior en casi todos los aspectos del juego.",
    ]));
  }

  const body = bodyParts.join(' ');

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'MATCH',
    date: new Date(fixture.date),
    title: headline,
    body,
    fixtureId: fixture.id,
    clubId: userClubId,
  };

  world.chronicles.push(chronicle);
  return chronicle;
}

export function generateMonthlyChronicle(
  clubId: string,
  currentDate: Date,
  recentResults: { won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number }
): Chronicle | null {
  const club = world.getClub(clubId);
  if (!club) return null;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = monthNames[currentDate.getMonth()];
  const total = recentResults.won + recentResults.drawn + recentResults.lost;

  if (total === 0) return null;

  // Balance qualifier
  let balance: string;
  if (recentResults.won >= 4) balance = 'excelente';
  else if (recentResults.won >= 3 && recentResults.lost <= 1) balance = 'positivo';
  else if (recentResults.won >= 2 && recentResults.lost >= 2) balance = 'de altibajos';
  else if (recentResults.won >= 1 && recentResults.lost >= 3) balance = 'negativo';
  else balance = 'para olvidar';

  // Find best/worst player this month
  const squad = world.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR' && p.formRatings.length > 0);
  let bestPlayer: Player | null = null;
  let worstPlayer: Player | null = null;
  let bestAvg = 0;
  let worstAvg = 10;

  squad.forEach(p => {
    const avg = p.formRatings.reduce((a, b) => a + b, 0) / p.formRatings.length;
    if (avg > bestAvg) { bestAvg = avg; bestPlayer = p; }
    if (avg < worstAvg && p.formRatings.length >= 2) { worstAvg = avg; worstPlayer = p; }
  });

  // Streak
  const managerHistory = useGameStore.getState().managerHistory;
  let streakText = '';
  if (managerHistory.currentStreak === 'W' && managerHistory.streakCount >= 3) {
    streakText = `El equipo encadena ${managerHistory.streakCount} victorias consecutivas.`;
  } else if (managerHistory.currentStreak === 'L' && managerHistory.streakCount >= 3) {
    streakText = `El equipo ha caído en sus últimos ${managerHistory.streakCount} partidos.`;
  } else if (managerHistory.currentStreak === 'D' && managerHistory.streakCount >= 2) {
    streakText = `El equipo ha empatado sus últimos ${managerHistory.streakCount} compromisos.`;
  } else {
    streakText = 'El equipo busca estabilidad en sus resultados.';
  }

  // Board confidence
  const boardText = pick([
    "La directiva respalda al entrenador.",
    "La directiva vigila de cerca los resultados.",
    "La presión de la directiva crece con cada partido.",
  ]);

  // Build body
  let bodyParts: string[] = [];
  bodyParts.push(`${monthName} fue un mes ${balance} para el equipo.`);
  bodyParts.push(`${recentResults.won} victoria${recentResults.won !== 1 ? 's' : ''}, ${recentResults.drawn} empate${recentResults.drawn !== 1 ? 's' : ''} y ${recentResults.lost} derrota${recentResults.lost !== 1 ? 's' : ''}.`);
  bodyParts.push(streakText);

  if (bestPlayer) {
    bodyParts.push(`${bestPlayer!.name} fue el mejor del mes con ${bestAvg.toFixed(1)} de promedio.`);
  }
  if (worstPlayer && worstAvg < 6.5) {
    bodyParts.push(`${worstPlayer!.name} necesita mejorar su rendimiento (${worstAvg.toFixed(1)} de promedio).`);
  }

  bodyParts.push(boardText);

  // Next month preview
  const upcomingFixtures = world.getAllFixtures?.().filter(f =>
    !f.played && f.date > currentDate && f.date.getMonth() === currentDate.getMonth() + 1
  ).length || 0;
  if (upcomingFixtures > 0) {
    bodyParts.push(`El próximo mes trae ${upcomingFixtures} partidos pendientes.`);
  }

  const body = bodyParts.join(' ');

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'MONTHLY',
    date: new Date(currentDate),
    title: `Informe: ${monthName} ${currentDate.getFullYear()}`,
    body,
    clubId,
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  };

  world.chronicles.push(chronicle);
  return chronicle;
}

export function generateCareerChronicle(
  managerName: string,
  clubId: string,
  seasons: number,
  stats: {
    totalGames: number;
    totalWins: number;
    totalDraws: number;
    totalLosses: number;
    titles: string[];
    youthDebuts: number;
  }
): Chronicle | null {
  const club = world.getClub(clubId);
  if (!club) return null;

  const startYear = 2026;
  const endYear = startYear + seasons;

  let balance: string;
  const winRate = stats.totalGames > 0 ? stats.totalWins / stats.totalGames : 0;
  if (stats.titles.length >= 3) balance = 'extraordinaria';
  else if (stats.titles.length >= 1) balance = 'exitosa';
  else if (winRate >= 0.5) balance = 'sólida';
  else if (winRate >= 0.35) balance = 'irregular';
  else balance = 'complicada';

  // Achievements
  const achievements: string[] = [];
  if (stats.titles.length > 0) {
    achievements.push(stats.titles.length === 1 ? `1 título: ${stats.titles[0]}` : `${stats.titles.length} títulos: ${stats.titles.join(', ')}`);
  }
  if (stats.youthDebuts > 0) {
    achievements.push(`${stats.youthDebuts} jugador${stats.youthDebuts > 1 ? 'es' : ''} de la cantera debutaron con él`);
  }

  // Legacy
  const legacyTexts = [
    "Dejó una huella imborrable en la historia del club.",
    "La afición lo recordará como un líder nato.",
    "Su pasión por el club se reflejó en cada partido.",
    "Construyó un equipo con identidad y carácter.",
    "Su legado trasciende los resultados en el campo.",
  ];

  // Future
  const futureTexts = [
    `Ahora ${managerName} busca nuevos desafíos.`,
    `${managerName} deja el banquillo pero su nombre ya suena para futuros proyectos.`,
    `La aventura de ${managerName} en ${club.name} ha llegado a su fin.`,
    `${managerName} se despide, pero su legado permanece.`,
  ];

  // Praise
  const praiseTexts = [
    "La prensa lo recuerda como un técnico meticuloso y exigente.",
    "Los medios lo describen como un hombre de confianza en el vestuario.",
    "La prensa destacó su capacidad para sacar lo mejor de cada jugador.",
    "Los periodistas coinciden: fue un eterno optimista en los momentos difíciles.",
  ];

  let bodyParts: string[] = [];
  bodyParts.push(`El entrenador ${managerName} cierra su etapa en ${club.name} después de ${seasons} temporada${seasons > 1 ? 's' : ''}.`);
  bodyParts.push(`Llegó en ${startYear} y se va con una carrera ${balance}.`);
  bodyParts.push(`En total disputó ${stats.totalGames} partidos: ${stats.totalWins} victorias, ${stats.totalDraws} empates y ${stats.totalLosses} derrotas.`);

  if (achievements.length > 0) {
    bodyParts.push(`Entre sus logros: ${achievements.join('. ')}.`);
  }

  bodyParts.push(pick(legacyTexts));
  bodyParts.push(pick(praiseTexts));
  bodyParts.push(pick(futureTexts));

  const body = bodyParts.join(' ');

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'CAREER',
    date: new Date(currentDate),
    title: `El adiós de ${managerName}`,
    body,
    clubId,
  };

  world.chronicles.push(chronicle);
  return chronicle;
}

import { useGameStore } from '../stores/gameStore';

function getCurrentDate(): Date {
  return useGameStore.getState().currentDate;
}
