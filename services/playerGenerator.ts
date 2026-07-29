import { Player, Position, PlayerStats, Attribute } from '../types';
import { generateUUID, randomInt } from './utils';
import { NATIONS } from '../constants';
import { REGEN_DB, NAMES_DB } from '../data/static';

type DocPosition = 'POR' | 'DEF' | 'LAT' | 'PIV' | 'MC' | 'EXT' | 'DEL';
type InternalAttr = keyof PlayerStats['internal'];

function clamp(v: number, min = 1, max = 20): Attribute {
  return Math.max(min, Math.min(max, Math.round(v))) as Attribute;
}

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

const INTERNAL_RANGES: Record<DocPosition, Record<InternalAttr, [number, number]>> = {
  POR: {
    velocidad: [10, 14], resistencia: [12, 16], fuerza: [14, 18],
    control: [12, 16], pase: [10, 14], regate: [6, 10], disparo: [6, 10],
    anticipacion: [14, 18], decision: [12, 16], posicionamiento: [14, 18],
    vision: [8, 12], agresividad: [8, 12], polivalencia: [4, 8]
  },
  DEF: {
    velocidad: [12, 16], resistencia: [14, 18], fuerza: [16, 20],
    control: [10, 14], pase: [12, 16], regate: [8, 12], disparo: [8, 12],
    anticipacion: [16, 20], decision: [14, 18], posicionamiento: [16, 20],
    vision: [10, 14], agresividad: [14, 18], polivalencia: [6, 10]
  },
  LAT: {
    velocidad: [14, 18], resistencia: [14, 18], fuerza: [12, 16],
    control: [12, 16], pase: [14, 18], regate: [12, 16], disparo: [8, 12],
    anticipacion: [14, 18], decision: [12, 16], posicionamiento: [14, 18],
    vision: [12, 16], agresividad: [12, 16], polivalencia: [10, 14]
  },
  PIV: {
    velocidad: [12, 16], resistencia: [14, 18], fuerza: [14, 18],
    control: [14, 18], pase: [14, 18], regate: [8, 12], disparo: [10, 14],
    anticipacion: [14, 18], decision: [14, 18], posicionamiento: [14, 18],
    vision: [12, 16], agresividad: [14, 18], polivalencia: [8, 12]
  },
  MC: {
    velocidad: [12, 16], resistencia: [14, 18], fuerza: [12, 16],
    control: [14, 18], pase: [16, 20], regate: [12, 16], disparo: [12, 16],
    anticipacion: [12, 16], decision: [16, 20], posicionamiento: [14, 18],
    vision: [16, 20], agresividad: [10, 14], polivalencia: [10, 14]
  },
  EXT: {
    velocidad: [16, 20], resistencia: [14, 18], fuerza: [10, 14],
    control: [16, 20], pase: [12, 16], regate: [16, 20], disparo: [14, 18],
    anticipacion: [10, 14], decision: [12, 16], posicionamiento: [14, 18],
    vision: [12, 16], agresividad: [8, 12], polivalencia: [10, 14]
  },
  DEL: {
    velocidad: [14, 18], resistencia: [14, 18], fuerza: [14, 18],
    control: [14, 18], pase: [12, 16], regate: [14, 18], disparo: [16, 20],
    anticipacion: [10, 14], decision: [14, 18], posicionamiento: [16, 20],
    vision: [12, 16], agresividad: [10, 14], polivalencia: [6, 10]
  }
};

const HEIGHT_WEIGHT: Record<DocPosition, [number, number, number, number]> = {
  POR: [185, 198, 80, 90],
  DEF: [182, 195, 78, 88],
  LAT: [170, 183, 70, 80],
  PIV: [178, 188, 75, 85],
  MC: [175, 185, 70, 80],
  EXT: [168, 180, 65, 75],
  DEL: [175, 190, 72, 85]
};

const TAG_RULES: { label: string; check: (i: PlayerStats['internal'], v: PlayerStats['visible'], age: number) => boolean }[] = [
  { label: 'Superclase', check: (_, v) => v.fisico >= 16 && v.mental >= 16 && v.tecnica >= 16 },
  { label: 'Cerebral', check: (_, v) => v.mental >= 17 && v.tecnica >= 15 },
  { label: 'Tanque', check: (_, v) => v.fisico >= 16 && v.agresividad >= 16 },
  { label: 'Explosivo', check: (_, v) => v.fisico >= 17 && v.tecnica >= 15 },
  { label: 'Técnico', check: (_, v) => v.tecnica >= 16 && v.mental >= 14 },
  { label: 'Comodín', check: (_, v) => v.fisico >= 14 && v.mental >= 14 && v.polivalencia >= 14 },
  { label: 'Atleta', check: (_, v) => v.fisico >= 15 && v.agresividad >= 14 },
  { label: 'Inteligente', check: (_, v) => v.mental >= 15 && v.agresividad >= 12 },
  { label: 'Joven promesa', check: (i, v, age) => age <= 21 && v.fisico <= 12 && v.mental <= 12 && v.tecnica <= 12 },
  { label: 'Veterano', check: (_, v, age) => age >= 32 && v.mental >= 15 },
  { label: 'Fichaje de relleno', check: (_, v, age) => v.fisico <= 10 && v.mental <= 10 && v.tecnica <= 10 && age >= 25 },
];

function getDocPosition(pos: Position): DocPosition {
  switch (pos) {
    case Position.GK: return 'POR';
    case Position.DC: case Position.SW: return 'DEF';
    case Position.DL: case Position.DR: case Position.DML: case Position.DMR: return 'LAT';
    case Position.DM: return 'PIV';
    case Position.MC: case Position.ML: case Position.MR: return 'MC';
    case Position.AM: case Position.AMR: case Position.AML: return 'EXT';
    case Position.ST: case Position.STR: case Position.STL: return 'DEL';
    default: return 'MC';
  }
}

function generateInternalAttrs(docPos: DocPosition, qualityFactor: number = 1): PlayerStats['internal'] {
  const ranges = INTERNAL_RANGES[docPos];
  const attrs = {} as PlayerStats['internal'];
  const attrKeys = Object.keys(ranges) as InternalAttr[];
  attrKeys.forEach(key => {
    const [lo, hi] = ranges[key];
    const mean = (lo + hi) / 2;
    const stdDev = (hi - lo) / 4;
    let raw = normalRandom(mean, stdDev) * qualityFactor;
    if (qualityFactor > 1) {
      raw = raw + (qualityFactor - 1) * 2;
    }
    attrs[key] = clamp(raw, lo - 2, hi + 2);
  });
  return attrs;
}

function calculateVisible(internal: PlayerStats['internal']): PlayerStats['visible'] {
  const fisico = Math.round((internal.velocidad + internal.resistencia + internal.fuerza) / 3);
  const mental = Math.round((internal.anticipacion + internal.decision + internal.posicionamiento + internal.vision) / 4);
  const tecnica = Math.round((internal.control + internal.pase + internal.regate + internal.disparo) / 4);
  return {
    fisico: clamp(fisico),
    mental: clamp(mental),
    tecnica: clamp(tecnica),
    agresividad: clamp(internal.agresividad),
    polivalencia: clamp(internal.polivalencia)
  };
}

function assignTag(internal: PlayerStats['internal'], visible: PlayerStats['visible'], age: number): string {
  for (const rule of TAG_RULES) {
    if (rule.check(internal, visible, age)) return rule.label;
  }
  const avg = (visible.fisico + visible.mental + visible.tecnica) / 3;
  if (avg >= 14) return 'Notable';
  if (avg >= 11) return 'Prometedor';
  return 'Corriente';
}

export interface GenerationOptions {
  qualityFactor?: number;
  minAge?: number;
  maxAge?: number;
}

export function generatePlayer(
  clubId: string,
  primaryPos: Position,
  nationality: string,
  name: string,
  age: number,
  options?: GenerationOptions
): Player {
  const qf = options?.qualityFactor ?? 1;
  const docPos = getDocPosition(primaryPos);
  const internal = generateInternalAttrs(docPos, qf);
  const visible = calculateVisible(internal);
  const tag = assignTag(internal, visible, age);
  const [hLo, hHi, wLo, wHi] = HEIGHT_WEIGHT[docPos];
  const height = randomInt(hLo, hHi);
  const weight = randomInt(wLo, wHi);
  const overall = Math.round((visible.fisico + visible.mental + visible.tecnica + visible.agresividad + visible.polivalencia) / 5 * 10);
  const ca = Math.max(40, Math.min(200, overall * 2 + randomInt(-10, 10)));
  const pa = Math.min(200, ca + randomInt(0, 40));
  const birthDate = new Date(2008 - age, randomInt(0, 11), randomInt(1, 28));
  const value = Math.round(ca * ca * 2000);
  const salary = Math.round(ca * 2000 / 12);

  return {
    id: generateUUID(),
    name,
    age,
    birthDate,
    height,
    weight,
    nationality,
    positions: [primaryPos],
    secondaryPositions: [],
    stats: { internal, visible },
    seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 },
    statsByCompetition: {},
    history: [],
    currentAbility: ca,
    potentialAbility: pa,
    reputation: ca * 40,
    fitness: 100,
    morale: 100,
    clubId,
    isStarter: false,
    squad: 'SENIOR',
    value,
    salary,
    transferStatus: 'NONE',
    contractExpiry: new Date(2010, 5, 30),
    loyalty: randomInt(10, 20),
    negotiationAttempts: 0,
    isUnhappyWithContract: false,
    leadership: randomInt(5, 20),
    consistency: randomInt(5, 20),
    bigMatchTemperament: randomInt(5, 20),
    releaseClause: Math.round(value * 3),
    yellowCardsAccumulated: 0,
    formRatings: [],
    tacticalFamiliarity: 50,
    isTransferListed: false,
    injuryHistory: [],
    injuryProneness: Math.max(0.01, (20 - internal.resistencia) * 0.02),
    relationships: {},
    agent: age >= 22 && Math.random() < 0.15 ? { name: `Agente ${name.split(' ').pop()}`, commission: Math.round(5 + Math.random() * 10) } : undefined,
  };
}

export function generateRandomPlayer(
  clubId: string,
  primaryPos: Position,
  minAge = 16,
  maxAge = 36,
  baseYear = 2008
): Player {
  const club = { country: "Argentina" };
  let nat = Math.random() < 0.9 ? "Argentina" : NATIONS[randomInt(0, NATIONS.length - 1)];
  const normalizeKey = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let firstName = "", lastName = "";
  const regenData = REGEN_DB[normalizeKey(nat)];
  if (regenData) {
    firstName = regenData.nombres[randomInt(0, regenData.nombres.length - 1)];
    lastName = regenData.apellidos[randomInt(0, regenData.apellidos.length - 1)];
  } else {
    firstName = NAMES_DB.firstNames[randomInt(0, NAMES_DB.firstNames.length - 1)];
    lastName = NAMES_DB.lastNames[randomInt(0, NAMES_DB.lastNames.length - 1)];
  }
  const age = randomInt(minAge, maxAge);
  const docPos = getDocPosition(primaryPos);
  const ranges = INTERNAL_RANGES[docPos];
  const avgRange = Object.values(ranges).reduce((s, [lo, hi]) => s + (lo + hi) / 2, 0) / 13;
  const qualityFactor = 0.5 + (avgRange / 20) * randomInt(5, 10) / 10;
  return generatePlayer(clubId, primaryPos, nat, `${firstName} ${lastName}`, age, { qualityFactor, minAge, maxAge });
}

export function getPlayerTag(player: Player): string {
  return assignTag(player.stats.internal, player.stats.visible, player.age);
}
