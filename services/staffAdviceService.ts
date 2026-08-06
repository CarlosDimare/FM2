import { Player, Club, Position, Tactic, TacticSettings, SquadType, TrainingSchedule } from '../types';
import { world } from './worldManager';
import { SLOT_CONFIG } from './engine';
import { notifyPlayers, notifyTactics, notifyOffers } from '../stores/worldStore';
import { randomInt } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
//  Pilar D · Fase 1 — Ayudante de Campo
//  Lógica de recomendación (capa "backend"). La UI solo consume estos datos.
//  Los textos salen de pools predefinidos; nada de IA.
// ─────────────────────────────────────────────────────────────────────────────

export type TacticArchetype = 'CONSERVATIVE' | 'BALANCED' | 'RISKY';

export interface TacticAdviceOption {
  id: TacticArchetype;
  icono: string;
  titulo: string;
  descripcion: string;
  efectos: string[];
  preset: Partial<TacticSettings>;
}

export interface TacticAdvice {
  textoPrincipal: string;
  opciones: TacticAdviceOption[];
  recomendacion: TacticArchetype;
  justificacion: string;
}

export interface LineupPlayerAdvice {
  playerId: string;
  slot: number;
  razones: string[];
}

export interface LineupAdvice {
  textoPaso2: string;
  xi: LineupPlayerAdvice[];
  banquillo: { playerId: string; razon: string }[];
  resumen: string;
}

// ── Líneas de posición (misma geometría que TacticsView) ────────────────────
const POS_TO_LINE: Record<string, string> = {
  [Position.GK]: 'GK',
  [Position.SW]: 'SW',
  [Position.DC]: 'DEF', [Position.DR]: 'DEF', [Position.DL]: 'DEF',
  [Position.DM]: 'DM', [Position.DMR]: 'DM', [Position.DML]: 'DM',
  [Position.MC]: 'MID', [Position.MR]: 'MID', [Position.ML]: 'MID',
  [Position.AM]: 'AM', [Position.AMR]: 'AM', [Position.AML]: 'AM',
  [Position.ST]: 'ATT', [Position.STR]: 'ATT', [Position.STL]: 'ATT',
};

const LINE_NEIGHBORS: Record<string, string[]> = {
  GK: ['DEF'],
  SW: ['DEF'],
  DEF: ['SW', 'DM'],
  DM: ['DEF', 'MID'],
  MID: ['DM', 'AM'],
  AM: ['MID', 'ATT'],
  ATT: ['AM'],
};

export function getPlayerLine(p: Player): string {
  const line = POS_TO_LINE[p.positions[0]];
  if (line) return line;
  return 'MID';
}

function lineFit(p: Player, line: string): number {
  const pLine = getPlayerLine(p);
  if (line === pLine) return 20;
  if (p.secondaryPositions && p.secondaryPositions.some(sp => POS_TO_LINE[sp] === line)) return 15;
  if ((LINE_NEIGHBORS[line] || []).includes(pLine)) return 9;
  if ((LINE_NEIGHBORS[pLine] || []).includes(line)) return 9;
  return 3;
}

function slotFit(p: Player, slot: number): number {
  const meta = SLOT_CONFIG[slot];
  if (!meta) return 0;
  return lineFit(p, meta.line) + p.currentAbility / 20;
}

// ── Personaje ────────────────────────────────────────────────────────────────
export function getAssistantStaff(clubId: string) {
  return world.getStaffByClub(clubId).find(s => s.role === 'ASSISTANT_MANAGER') || null;
}

// ── Fuerzas por línea ────────────────────────────────────────────────────────
function lineStrength(players: Player[], lines: string[]): number {
  const vals = lines.map(line => {
    const cands = players.filter(p => getPlayerLine(p) === line && !p.injury);
    if (cands.length === 0) return null;
    return cands.sort((a, b) => b.currentAbility - a.currentAbility)[0].currentAbility;
  }).filter((v): v is number => v !== null);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const ATT_LINES = ['ATT', 'AM'];
const DEF_LINES = ['GK', 'SW', 'DEF', 'DM'];

const avgTeam = (players: Player[], key: 'fitness' | 'morale') =>
  players.length ? players.reduce((s, p) => s + (p[key] || 0), 0) / players.length : 100;

const avgForm = (p: Player) => {
  const last = p.formRatings.slice(-3);
  if (last.length === 0) return 6;
  return last.reduce((a, b) => a + b, 0) / last.length;
};

// ── Presets de arquetipo (diff sobre el esquema actual) ─────────────────────
const ARCHETYPE_PRESETS: Record<TacticArchetype, Partial<TacticSettings>> = {
  CONSERVATIVE: {
    mentality: 5, creativeFreedom: 5, passingStyle: 6, tempo: 5, width: 7,
    closingDown: 6, timeWasting: 15, defensiveLine: 5, tackling: 8,
    marking: 'ZONAL', counterAttack: true,
  },
  BALANCED: {},
  RISKY: {
    mentality: 16, creativeFreedom: 15, passingStyle: 14, tempo: 16, width: 15,
    closingDown: 16, timeWasting: 2, defensiveLine: 16, tackling: 14,
    marking: 'MAN', counterAttack: false,
  },
};

const ARCHETYPE_META: Record<TacticArchetype, { icono: string; titulo: string; descripcion: string; efectos: string[] }> = {
  CONSERVATIVE: {
    icono: '🛡️',
    titulo: 'Conservador',
    descripcion: 'Cerrar filas y golpear de contra.',
    efectos: ['Cierra líneas y protege el área', 'Contraataque como arma principal', 'Menos presión y línea defensiva baja'],
  },
  BALANCED: {
    icono: '⚖️',
    titulo: 'Equilibrado',
    descripcion: 'Mantener la estructura actual.',
    efectos: ['Sin cambios radicales', 'Juego posicional', 'Presión y línea en valores medios'],
  },
  RISKY: {
    icono: '⚡',
    titulo: 'Arriesgado',
    descripcion: 'Presión total y juego vertical.',
    efectos: ['Presión alta y línea adelantada', 'Juego directo hacia el área', 'Riesgo en transiciones defensivas'],
  },
};

const POOLS = {
  consejo: [
    'Jefe, he analizado al rival. Te recomiendo un plan claro:',
    'Mira, he estudiado sus partidos. Esto es lo que yo haría:',
    'Buenas noticias, Jefe: tengo el informe listo. Mi consejo es este:',
  ],
  justConservador: [
    'Su ataque ({oppAtt}) supera a nuestra defensa ({myDef}). Mejor asegurar y golpear de contra.',
    'El rival manda en ataque y llegamos algo justos de físico. Cerremos filas.',
  ],
  justRiesgo: [
    'Nuestro ataque ({myAtt}) es claramente superior a su defensa ({oppDef}). Vamos a por ellos.',
    'Tienen una defensa endeble. Presionemos arriba desde el primer minuto.',
  ],
  justEquilibrado: [
    'Las fuerzas están parejas (ataque {myAtt} vs {oppAtt}). Mantengamos la estructura.',
    'No hay diferencias claras entre ambos. Juego posicional, sin experimentos.',
  ],
  xiListo: [
    'Este es nuestro 11. He puesto a {star} porque está en su mejor momento.',
    'Once confirmado. Confío en {star} para marcar la diferencia hoy.',
  ],
  resultado: [
    'Táctica y once aplicados. Buena decisión, Jefe.',
    'Hecho. El equipo está listo para salir a por el partido.',
  ],
};

// ── API pública ──────────────────────────────────────────────────────────────
export function generateTacticAdvice(club: Club, opponent?: Club): TacticAdvice {
  const myPlayers = world.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
  const myStarters = myPlayers.filter(p => p.isStarter && p.tacticalPosition !== undefined);
  const used = myStarters.length >= 11 ? myStarters : myPlayers;

  const myAtt = lineStrength(used, ATT_LINES);
  const myDef = lineStrength(used, DEF_LINES);
  const avgFit = avgTeam(myPlayers, 'fitness');
  const avgMorale = avgTeam(myPlayers, 'morale');

  const oppPlayers = opponent ? world.getPlayersByClub(opponent.id).filter(p => p.squad === 'SENIOR') : [];
  const oppAtt = opponent ? lineStrength(oppPlayers, ATT_LINES) : 0;
  const oppDef = opponent ? lineStrength(oppPlayers, DEF_LINES) : 0;

  let recomendacion: TacticArchetype = 'BALANCED';
  if (!opponent) {
    if (avgFit < 70) recomendacion = 'CONSERVATIVE';
    else if (avgFit >= 85 && avgMorale >= 70) recomendacion = 'RISKY';
  } else if (oppAtt > myDef + 25) {
    recomendacion = 'CONSERVATIVE';
  } else if (myAtt > oppDef + 25) {
    recomendacion = 'RISKY';
  } else if (myAtt > oppAtt + 10) {
    recomendacion = 'RISKY';
  } else if (oppAtt > myAtt + 10) {
    recomendacion = 'CONSERVATIVE';
  }

  let justificacion = '';
  if (recomendacion === 'CONSERVATIVE') {
    const decisivo = oppAtt > myDef + 25
      ? 'Su ataque ({oppAtt}) supera a nuestra defensa ({myDef}). Mejor asegurar y golpear de contra.'
      : POOLS.justConservador[randomInt(0, POOLS.justConservador.length - 1)];
    justificacion = decisivo.replace('{oppAtt}', oppAtt.toFixed(0)).replace('{myDef}', myDef.toFixed(0));
  } else if (recomendacion === 'RISKY') {
    const decisivo = myAtt > oppDef + 25
      ? 'Nuestro ataque ({myAtt}) es claramente superior a su defensa ({oppDef}). Vamos a por ellos.'
      : POOLS.justRiesgo[randomInt(0, POOLS.justRiesgo.length - 1)];
    justificacion = decisivo.replace('{myAtt}', myAtt.toFixed(0)).replace('{oppDef}', oppDef.toFixed(0));
  } else {
    justificacion = POOLS.justEquilibrado[randomInt(0, POOLS.justEquilibrado.length - 1)]
      .replace('{myAtt}', myAtt.toFixed(0))
      .replace('{oppAtt}', oppAtt.toFixed(0));
  }

  const opciones: TacticAdviceOption[] = (['CONSERVATIVE', 'BALANCED', 'RISKY'] as TacticArchetype[]).map(id => ({
    id,
    ...ARCHETYPE_META[id],
    preset: ARCHETYPE_PRESETS[id],
  }));

  return {
    textoPrincipal: POOLS.consejo[randomInt(0, POOLS.consejo.length - 1)],
    opciones,
    recomendacion,
    justificacion,
  };
}

export function applyTacticPreset(tactic: Tactic, archetype: TacticArchetype) {
  tactic.settings = { ...tactic.settings, ...ARCHETYPE_PRESETS[archetype] };
  notifyTactics();
}

// ── XI con razones ───────────────────────────────────────────────────────────
function playerReasons(p: Player): string[] {
  const reasons: string[] = [];
  const f = avgForm(p);
  if (f >= 7) reasons.push(`⚡ En racha (media ${f.toFixed(1)})`);
  if (p.fitness >= 90) reasons.push('💪 Gran forma física');
  if ((p.tacticalFamiliarity || 0) >= 75) reasons.push('🔗 Alta afinidad táctica');
  const line = getPlayerLine(p);
  const s = p.stats.internal;
  if (line === 'ATT' && s.disparo >= 16) reasons.push('🎯 Mejor definición del plantel');
  if ((line === 'MID' || line === 'AM') && s.vision >= 15) reasons.push('🧠 Visión de juego privilegiada');
  if (line === 'DEF' && s.anticipacion >= 16) reasons.push('🛡️ Anticipación defensiva superior');
  if (line === 'GK' && s.control >= 15) reasons.push('🧤 Seguridad bajo palos');
  if (reasons.length === 0) reasons.push('📊 Rendimiento sólido y regular');
  return reasons.slice(0, 3);
}

export function generateLineupAdvice(club: Club, squad: SquadType = 'SENIOR'): LineupAdvice {
  const players = world.getPlayersByClub(club.id).filter(p => p.squad === squad);
  const tactic = world.getTactics()[0];
  const slots = tactic?.positions || [0, 3, 2, 1, 5, 8, 12, 13, 14, 17, 26];
  const healthy = players.filter(p => !p.injury && (!p.suspension || p.suspension.matchesLeft === 0));

  const starters = healthy.filter(p => p.isStarter && p.tacticalPosition !== undefined);
  const xi: LineupPlayerAdvice[] = starters.map(p => ({
    playerId: p.id,
    slot: p.tacticalPosition as number,
    razones: playerReasons(p),
  }));

  // Rellenar huecos si hay menos de 11
  const usedSlots = new Set(xi.map(x => x.slot));
  const usedIds = new Set(xi.map(x => x.playerId));
  const pool = healthy.filter(p => !usedIds.has(p.id));
  for (const slot of slots) {
    if (xi.length >= 11) break;
    if (usedSlots.has(slot)) continue;
    const best = [...pool].sort((a, b) => slotFit(b, slot) - slotFit(a, slot))[0];
    if (!best) continue;
    xi.push({ playerId: best.id, slot, razones: ['🆕 Mejor opción disponible para el puesto'] });
    usedSlots.add(slot);
    pool.splice(pool.indexOf(best), 1);
  }

  // Banquillo con razón
  const banquillo: { playerId: string; razon: string }[] = [];
  players.forEach(p => {
    if (p.injury) banquillo.push({ playerId: p.id, razon: `🚑 Lesión (${p.injury.daysLeft} días)` });
    else if (p.suspension && p.suspension.matchesLeft > 0) banquillo.push({ playerId: p.id, razon: '🟥 Sancionado' });
  });
  const rest = healthy.filter(p => !usedIds.has(p.id)).sort((a, b) => b.currentAbility - a.currentAbility);
  rest.slice(0, 6).forEach(p => {
    let razon = '🔄 Rotación / opción de cambio';
    if ((p.tacticalFamiliarity || 0) < 45) razon = '🔻 Baja afinidad táctica';
    else if (p.fitness < 70) razon = '😮‍💨 Necesita recuperar condición';
    banquillo.push({ playerId: p.id, razon });
  });

  // Estrella del once (en racha + buen físico)
  const star = xi
    .map(x => ({ x, p: world.getPlayer(x.playerId) }))
    .filter(({ p }) => p && avgForm(p) >= 6.8 && p!.fitness >= 80)
    .sort((a, b) => (b.p!.fitness + avgForm(b.p!) * 2) - (a.p!.fitness + avgForm(a.p!) * 2))[0];
  const starName = star?.p?.name || (world.getPlayer(xi[0]?.playerId || '')?.name) || 'nuestro once';

  const textoPaso2 = POOLS.xiListo[randomInt(0, POOLS.xiListo.length - 1)].replace('{star}', starName.split(' ').slice(-1)[0]);
  const resumen = `Once confirmado: ${xi.length} titulares · ${banquillo.length} jugadores fuera del campo inicial.`;

  return { textoPaso2, xi, banquillo, resumen };
}

export function applyLineup(clubId: string, xi: LineupPlayerAdvice[], squad: SquadType = 'SENIOR') {
  const players = world.getPlayersByClub(clubId).filter(p => p.squad === squad);
  players.forEach(p => { p.isStarter = false; p.tacticalPosition = undefined; });
  xi.forEach(({ playerId, slot }) => {
    const p = world.getPlayer(playerId);
    if (p) { p.isStarter = true; p.tacticalPosition = slot; }
  });
  notifyPlayers();
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pilar D · Fase 2 — Preparador Físico
//  Carga de entrenamiento + riesgo de lesión + planes semanales.
//  Reutiliza la heurística de lifecycleManager (totalIntensity, fitness < 60).
// ─────────────────────────────────────────────────────────────────────────────

export type FitnessPlanArchetype = 'RENDIMIENTO' | 'EQUILIBRIO' | 'RECUPERACION';

export interface FitnessPlanOption {
  id: FitnessPlanArchetype;
  icono: string;
  titulo: string;
  descripcion: string;
  efectos: string[];
}

export interface PlayerRiskEntry {
  playerId: string;
  carga: number;     // intensidad normalizada 0-100
  riesgo: number;    // score de riesgo 0-100
  fitness: number;
}

export interface FitnessReport {
  textoPrincipal: string;
  cargaMedia: number;     // 0-100 (intensidad media del plan semanal)
  riesgoLesion: number;   // 0-100 (f(media fitness, carga, injuryProneness))
  fitnessMedia: number;
  jugadoresRiesgo: PlayerRiskEntry[];
  opciones: FitnessPlanOption[];
  recomendacion: FitnessPlanArchetype;
  justificacion: string;
}

const DEFAULT_SCHEDULE = { STRENGTH: 8, AEROBIC: 8, TACTICAL: 8, BALL_CONTROL: 8, DEFENDING: 8, ATTACKING: 8, SHOOTING: 8, SET_PIECES: 4 };
const SCHEDULE_KEYS = Object.keys(DEFAULT_SCHEDULE) as (keyof typeof DEFAULT_SCHEDULE)[];

/** Intensidad total (0-140) del horario individual → carga normalizada 0-100 */
export function playerLoad(p: Player): number {
  const schedule = p.trainingSchedule || DEFAULT_SCHEDULE;
  const total = Object.values(schedule).reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round((total / 140) * 100));
}

function playerRisk(p: Player): number {
  const carga = playerLoad(p);
  let score = 0;
  if (p.fitness < 60) score += (60 - p.fitness) * 1.2;
  else if (p.fitness < 75) score += (75 - p.fitness) * 0.4;
  if (carga > 70) score += (carga - 70) * 0.5;
  score += (p.injuryProneness || 0) * 100 * 0.6;
  if (p.injury) score += 25;
  return Math.min(100, Math.round(score));
}

const FITNESS_PLAN_META: Record<FitnessPlanArchetype, { icono: string; titulo: string; descripcion: string; efectos: string[] }> = {
  RENDIMIENTO: {
    icono: '🚀',
    titulo: 'Rendimiento',
    descripcion: 'Subir la carga para maximizar el desarrollo.',
    efectos: ['+30% intensidad en las sesiones', 'Mayor progreso de atributos', 'Sube el riesgo de lesión por fatiga'],
  },
  EQUILIBRIO: {
    icono: '⚖️',
    titulo: 'Equilibrio',
    descripcion: 'Mantener la carga actual del plantel.',
    efectos: ['Sin cambios en la intensidad', 'Ritmo estable de recuperación', 'Riesgo de lesión sin variación'],
  },
  RECUPERACION: {
    icono: '🧘',
    titulo: 'Recuperación',
    descripcion: 'Bajar la carga para recuperar físicos.',
    efectos: ['-30% intensidad en las sesiones', 'Recuperación inmediata de condición', 'Reduce el riesgo de lesión por fatiga'],
  },
};

const FITNESS_POOLS = {
  alerta: [
    'Jefe, he revisado las cargas del plantel. Te sugiero ajustar el plan para no perder a {nombres}.',
    'Ojo, Jefe: el equipo acumula fatiga. Mi recomendación es regular la intensidad esta semana.',
    'Informe físico listo. La carga general no está al nivel que me gustaría: merece la pena ajustar.',
  ],
  buenEstado: [
    'Buenas noticias, Jefe: el plantel está en plena forma. Podemos apretar un poco más el acelerador.',
    'Todos están frescos. Si queremos sacar rendimiento extra, es el momento.',
  ],
  justRecuperacion: [
    'La media de condición es baja y el riesgo de lesión está por las nubes. Mejor proteger al equipo.',
    'Con {n} jugadores en rojo, lo responsable es bajar la carga esta semana.',
  ],
  justRendimiento: [
    'El equipo está en plena forma: podemos elevar la intensidad sin miedo a lesiones.',
    'Físicamente estamos al 100%. Aprovechemos para desarrollar a los más jóvenes.',
  ],
  justEquilibrado: [
    'Las cargas están en un punto razonable. No toco nada esta semana.',
    'Riesgo controlado y condición aceptable. Mantengamos el ritmo.',
  ],
  resultado: [
    'Plan aplicado. Ajusto las sesiones y aviso si algo cambia.',
    'Hecho, Jefe. El equipo seguirá mi plan esta semana.',
  ],
};

export function getFitnessCoach(clubId: string) {
  return world.getStaffByClub(clubId).find(s => s.role === 'FITNESS_COACH') || null;
}

export function generateFitnessReport(club: Club): FitnessReport {
  const players = world.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
  const withSchedule = players.map(p => ({ p, carga: playerLoad(p), riesgo: playerRisk(p) }));

  const cargaMedia = withSchedule.length
    ? Math.round(withSchedule.reduce((s, e) => s + e.carga, 0) / withSchedule.length)
    : 0;
  const fitnessMedia = players.length
    ? Math.round(players.reduce((s, p) => s + p.fitness, 0) / players.length)
    : 100;
  const riesgoLesion = withSchedule.length
    ? Math.min(100, Math.round(withSchedule.reduce((s, e) => s + e.riesgo, 0) / withSchedule.length))
    : 0;

  const jugadoresRiesgo = withSchedule
    .filter(e => e.riesgo >= 30)
    .sort((a, b) => b.riesgo - a.riesgo)
    .slice(0, 8)
    .map(e => ({ playerId: e.p.id, carga: e.carga, riesgo: e.riesgo, fitness: Math.round(e.p.fitness) }));

  // Recomendación: riesgo alto → RECUPERACION · plantel fresco → RENDIMIENTO · resto → EQUILIBRIO
  let recomendacion: FitnessPlanArchetype = 'EQUILIBRIO';
  if (riesgoLesion > 55 || jugadoresRiesgo.length >= 3) recomendacion = 'RECUPERACION';
  else if (fitnessMedia >= 78 && cargaMedia < 60) recomendacion = 'RENDIMIENTO';

  let textoPrincipal: string;
  if (jugadoresRiesgo.length > 0) {
    const names = jugadoresRiesgo.slice(0, 2).map(e => {
      const p = world.getPlayer(e.playerId);
      return p ? p.name.split(' ').slice(-1)[0] : 'un jugador';
    }).join(' y ');
    textoPrincipal = FITNESS_POOLS.alerta[0]
      .replace('{nombres}', names || 'varios jugadores')
      .replace('{n}', String(jugadoresRiesgo.length));
  } else if (fitnessMedia >= 80) {
    textoPrincipal = FITNESS_POOLS.buenEstado[randomInt(0, FITNESS_POOLS.buenEstado.length - 1)];
  } else {
    textoPrincipal = FITNESS_POOLS.alerta[randomInt(1, FITNESS_POOLS.alerta.length - 1)];
  }

  const justificaciones: Record<FitnessPlanArchetype, string> = {
    RECUPERACION: FITNESS_POOLS.justRecuperacion[recomendacion === 'RECUPERACION' ? 0 : 1]
      .replace('{n}', String(Math.max(1, jugadoresRiesgo.length))),
    RENDIMIENTO: FITNESS_POOLS.justRendimiento[randomInt(0, FITNESS_POOLS.justRendimiento.length - 1)],
    EQUILIBRIO: FITNESS_POOLS.justEquilibrado[randomInt(0, FITNESS_POOLS.justEquilibrado.length - 1)],
  };

  const opciones: FitnessPlanOption[] = (['RENDIMIENTO', 'EQUILIBRIO', 'RECUPERACION'] as FitnessPlanArchetype[]).map(id => ({
    id,
    ...FITNESS_PLAN_META[id],
  }));

  return {
    textoPrincipal,
    cargaMedia,
    riesgoLesion,
    fitnessMedia,
    jugadoresRiesgo,
    opciones,
    recomendacion,
    justificacion: justificaciones[recomendacion],
  };
}

/**
 * Aplica el plan elegido: ajusta el trainingSchedule de cada jugador senior
 * (el mismo dato que lee lifecycleManager para fatiga/desarrollo) y aplica
 * un efecto inmediato de condición física.
 */
export function applyFitnessPlan(clubId: string, plan: FitnessPlanArchetype, squad: SquadType = 'SENIOR') {
  const players = world.getPlayersByClub(clubId).filter(p => p.squad === squad);
  const factor = plan === 'RENDIMIENTO' ? 1.3 : plan === 'RECUPERACION' ? 0.7 : 1;
  const fitnessDelta = plan === 'RENDIMIENTO' ? -5 : plan === 'RECUPERACION' ? 8 : 0;

  players.forEach(p => {
    if (factor !== 1) {
      const base = p.trainingSchedule || { ...DEFAULT_SCHEDULE };
      const next: Record<string, number> = {};
      SCHEDULE_KEYS.forEach(k => {
        const v = Math.round((base[k] ?? DEFAULT_SCHEDULE[k]) * factor);
        next[k] = Math.max(2, Math.min(20, v));
      });
      p.trainingSchedule = next as unknown as TrainingSchedule;
    }
    if (fitnessDelta !== 0) {
      p.fitness = Math.max(10, Math.min(100, p.fitness + fitnessDelta));
    }
  });

  notifyPlayers();
  return players.length;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Pilar D · Fase 3 — Carpeta de Refuerzos (Director Deportivo)
//  Candidatos curados (informes de scouting + posiciones débiles) con semáforo
//  de viabilidad 🟢🟡🔴 contra el presupuesto, y envío de ofertas por lote.
// ─────────────────────────────────────────────────────────────────────────────

export type TransferViability = 'VIABLE' | 'NEGOTIABLE' | 'INVIABLE';

export interface TransferCandidate {
  playerId: string;
  position: Position;
  value: number;
  viabilidad: TransferViability;
  razon: string;
}

export interface TransferFolder {
  textoInforme: string;
  presupuesto: number;
  candidatos: TransferCandidate[];
  resumen: { aprobados: number; enDuda: number; rechazados: number };
}

export function getSportingDirector(clubId: string) {
  return world.getStaffByClub(clubId).find(s => s.role === 'SPORTING_DIRECTOR') || null;
}

/** Valor estimado que el club podría recaudar vendiendo jugadores transferibles. */
function estimatedSaleValue(clubId: string): number {
  return world.getPlayersByClub(clubId)
    .filter(p => p.transferStatus === 'TRANSFERABLE' || p.isTransferListed)
    .reduce((s, p) => s + Math.round(p.value * 0.6), 0);
}

function computeViability(value: number, presupuesto: number, ventas: number): { viabilidad: TransferViability; razon: string } {
  if (value <= presupuesto) return { viabilidad: 'VIABLE', razon: 'Dentro de presupuesto' };
  if (value <= presupuesto + ventas) {
    return { viabilidad: 'NEGOTIABLE', razon: `Requiere vender antes (faltan £${((value - presupuesto) / 1000).toFixed(0)}K)` };
  }
  return { viabilidad: 'INVIABLE', razon: `Fuera de presupuesto (faltan £${((value - presupuesto) / 1000).toFixed(0)}K)` };
}

const weakPositions = (clubId: string): Position[] => {
  const senior = world.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR' && !p.injury);
  const weak: Position[] = [];
  if (senior.filter(p => p.positions.includes(Position.GK)).length < 2) weak.push(Position.GK);
  if (senior.filter(p => ['SW', 'DC', 'DR', 'DL'].some(pos => p.positions.includes(pos as Position))).length < 5) {
    weak.push(Position.DC); weak.push(Position.DR);
  }
  if (senior.filter(p => ['DM', 'MC', 'ML', 'MR', 'AM'].some(pos => p.positions.includes(pos as Position))).length < 4) weak.push(Position.MC);
  if (senior.filter(p => p.positions.includes(Position.ST)).length < 2) weak.push(Position.ST);
  return weak;
};

const TRANSFER_POOLS = {
  informe: [
    'He revisado la carpeta con mi equipo. Hay {aprobados} refuerzos asequibles y {duda} requieren un esfuerzo extra. {rechazados} quedan descartados por presupuesto.',
    'Mi recomendación es clara: prioriza a los jugadores marcados en verde. Los amarillos obligan a vender antes, y los rojos no caben en el presupuesto.',
    'La carpeta está lista. Confío en {aprobados} de estos perfiles para reforzar las zonas débiles del plantel.',
  ],
  sinCandidatos: [
    'La carpeta está vacía, Jefe. No hay perfiles informados que encajen con nuestro presupuesto por ahora. Activa el scouting en las posiciones débiles.',
    'Aún no tengo informes concluyentes. Pedí a los ojeadores priorizar nuestras posiciones más débiles.',
  ],
  resultado: [
    'Ofertas enviadas. Ahora toca esperar la respuesta de los clubes.',
    'Hecho, Jefe. Envié {n} ofertas y ajusté el presupuesto en consecuencia.',
  ],
};

/**
 * Compila la carpeta de refuerzos: jugadores con ScoutingReport del club
 * (mundo coherente) + objetivos por posición débil si hay pocos informes.
 * Viabilidad: value <= presupuesto → 🟢 · <= presupuesto + ventas estimadas → 🟡 · resto 🔴.
 * El judgingAbility del director deportivo afina la selección de candidatos.
 */
export function compileTransferFolder(club: Club, director?: { attributes: { judgingAbility: number } } | null): TransferFolder {
  const presupuesto = club.finances.transferBudget;
  // Director con mejor ojo → rango de CA objetivo más preciso; con peor ojo → más disperso.
  const judging = director?.attributes?.judgingAbility ?? 10;
  const rangeMult = Math.max(0.7, Math.min(1.4, 1.6 - judging * 0.05));
  const reportedIds = new Set(world.getScoutingReports(club.id, 50).map(r => r.playerId));

  // 1) Informados (con informe de scouting)
  const candidates: TransferCandidate[] = [];
  reportedIds.forEach(pid => {
    if (candidates.length >= 8) return;
    const p = world.getPlayer(pid);
    if (!p || p.clubId === club.id || p.clubId === 'FREE_AGENT') return;
    if (candidates.some(c => c.playerId === pid)) return;
    const ventas = estimatedSaleValue(club.id);
    const { viabilidad, razon } = computeViability(p.value, presupuesto, ventas);
    candidates.push({ playerId: pid, position: p.positions[0], value: p.value, viabilidad, razon });
  });

  // 2) Rellenar con posiciones débiles (mismo criterio que la IA de compras)
  if (candidates.length < 6) {
    const weak = weakPositions(club.id);
    const used = new Set(candidates.map(c => c.playerId));
    for (const pos of weak) {
      if (candidates.length >= 8) break;
      const targetCA = club.reputation / 100;
      const pool = world.players.filter(p =>
        p.clubId !== club.id && p.clubId !== 'FREE_AGENT' &&
        p.positions.includes(pos) &&
        !used.has(p.id) &&
        p.squad === 'SENIOR' &&
        Math.abs(p.currentAbility - targetCA) < 25 * rangeMult
      ).sort((a, b) => Math.abs(a.currentAbility - targetCA) - Math.abs(b.currentAbility - targetCA));
      const target = pool[0];
      if (!target) continue;
      const ventas = estimatedSaleValue(club.id);
      const { viabilidad, razon } = computeViability(target.value, presupuesto, ventas);
      candidates.push({ playerId: target.id, position: target.positions[0], value: target.value, viabilidad, razon });
      used.add(target.id);
    }
  }

  const resumen = {
    aprobados: candidates.filter(c => c.viabilidad === 'VIABLE').length,
    enDuda: candidates.filter(c => c.viabilidad === 'NEGOTIABLE').length,
    rechazados: candidates.filter(c => c.viabilidad === 'INVIABLE').length,
  };

  const textoInforme = candidates.length === 0
    ? TRANSFER_POOLS.sinCandidatos[randomInt(0, TRANSFER_POOLS.sinCandidatos.length - 1)]
    : TRANSFER_POOLS.informe[randomInt(0, TRANSFER_POOLS.informe.length - 1)]
        .replace('{aprobados}', String(resumen.aprobados))
        .replace('{duda}', String(resumen.enDuda))
        .replace('{rechazados}', String(resumen.rechazados));

  return { textoInforme, presupuesto, candidatos: candidates, resumen };
}

/**
 * Envía ofertas por lote con validación acumulada contra el presupuesto.
 * El coste total (≈valor de cada jugador) no puede exceder el presupuesto;
 * el descuento real se aplica al completar cada traspaso (patrón del juego).
 * Devuelve el número de ofertas realmente creadas.
 */
export function sendOffers(clubId: string, playerIds: string[], date: Date): number {
  const club = world.getClub(clubId);
  if (!club) return 0;
  const amounts: { pid: string; amount: number }[] = [];
  let total = 0;
  playerIds.forEach(pid => {
    const p = world.getPlayer(pid);
    if (!p || p.clubId === clubId || p.clubId === 'FREE_AGENT') return;
    const amount = Math.round(p.value); // monto determinista = valor de mercado (coherente con el coste mostrado)
    amounts.push({ pid, amount });
    total += amount;
  });
  // Validación acumulada: si el lote excede el presupuesto, no se envía nada.
  if (total > club.finances.transferBudget) return 0;
  amounts.forEach(({ pid, amount }) => world.makeTransferOffer(pid, clubId, amount, 'PURCHASE', date, 100));
  if (amounts.length > 0) notifyOffers();
  return amounts.length;
}
