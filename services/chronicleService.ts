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

function isUserWin(homeScore: number, awayScore: number, isHome: boolean): boolean {
  return isHome ? homeScore > awayScore : awayScore > homeScore;
}

function getGoalDescription(scorer: Player, minute: number): string {
  const descs = [
    `${scorer.name} abrió el marcador en el minuto ${minute}`,
    `Golazo de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} define con clase en el minuto ${minute}`,
    `Tiro imparable de ${scorer.name} en el minuto ${minute}`,
    `${scorer.name} marca en el minuto ${minute}`,
  ];
  return pick(descs);
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
  const win = isUserWin(homeScore, awayScore, isHome);
  const draw = homeScore === awayScore;

  const allIds = Object.keys(stats);
  let bestPlayer: Player | null = null;
  let bestRating = 0;
  allIds.forEach(pid => {
    const s = stats[pid];
    if (s && s.minutesPlayed > 30 && s.rating > bestRating) {
      bestRating = s.rating;
      bestPlayer = world.getPlayer(pid);
    }
  });

  const scorers: { player: Player; minute: number }[] = [];
  allIds.forEach(pid => {
    const s = stats[pid];
    if (s && s.goals > 0) {
      const p = world.getPlayer(pid);
      if (p) scorers.push({ player: p, minute: 30 + Math.floor(Math.random() * 60) });
    }
  });

  let headline: string;
  if (draw) headline = pick(HEADLINES_DRAW);
  else if (win) headline = pick(HEADLINES_WIN);
  else headline = pick(HEADLINES_LOSS);

  const parts: string[] = [];
  parts.push(`${userClubName} ${win ? 'vence' : draw ? 'empata' : 'cae'} ${homeScore}-${awayScore} contra ${opponentName}.`);

  if (scorers.length > 0) {
    const desc = scorers.slice(0, 3).map(s => getGoalDescription(s.player, s.minute));
    parts.push(desc.join('. ') + '.');
  }

  if (bestPlayer && bestRating >= 7.5) {
    parts.push(`${bestPlayer.name} fue el más destacado (${bestRating.toFixed(1)}).`);
  }

  parts.push(getAtmosphere(win, draw, isHome));

  if (win) {
    parts.push(pick(["El planteamiento táctico funcionó.", "Las decisiones del técnico dieron frutos.", "El equipo cumplió el plan."]));
  } else if (!draw) {
    parts.push(pick(["El equipo no encontró su ritmo.", "Las decisiones tácticas no funcionaron.", "El rival fue superior."]));
  }

  const chronicle: Chronicle = {
    id: generateUUID(),
    type: 'MATCH',
    date: new Date(fixture.date),
    title: headline,
    body: parts.join(' '),
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
