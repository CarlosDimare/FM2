import { describe, it, expect } from 'vitest';
import { ProfileNarrativeEngine } from '../services/engine';
import { Player, Position } from '../types';

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Test Player',
  positions: [Position.MC],
  nationality: 'ES',
  age: 25,
  currentAbility: 150,
  potentialAbility: 180,
  value: 10000000,
  salary: 50000,
  contractExpiry: new Date('2028-06-30'),
  clubId: 'club1',
  squad: 'SENIOR',
  isStarter: true,
  formRatings: [6, 7, 6],
  fitness: 85,
  morale: 70,
  primaryPosition: Position.MC,
  personality: 'PROFESSIONAL',
  leadership: 15,
  bigMatchTemperament: 12,
  tacticalFamiliarity: 80,
  consistency: 14,
  injury: false,
  suspension: undefined,
  transferStatus: 'NONE',
  loanExpiry: undefined,
  transferRequestReason: undefined,
  playerTensions: undefined,
  pendingDialogue: undefined,
  seasonStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0, averageRating: 0 },
  careerStats: { totalGoals: 0, totalAssists: 0, totalAppearances: 0, totalMinutes: 0 },
  relationshipWithManager: 0,
  attributes: {},
  stats: {
    technical: { passing: 15, finishing: 10, technique: 12, dribbling: 14, crossing: 8, firstTouch: 13, longShots: 9, corners: 7, freeKickTaking: 6, penaltyTaking: 5, longThrows: 4 },
    mental: { decisions: 14, anticipation: 13, positioning: 12, vision: 15, composure: 13, concentration: 14, determination: 16, flair: 11, aggression: 8, bravery: 10, workRate: 12, teamwork: 13, leadership: 15, offTheBall: 14, pressure: 12, temperament: 9, adaptability: 11, sportsmanship: 10 },
    physical: { pace: 14, acceleration: 15, stamina: 13, strength: 12, jumpingReach: 10, agility: 14, balance: 13, naturalFitness: 12 },
    internal: { decision: 14, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 8, polivalencia: 13, pase: 15, regate: 14 },
    goalkeeper: { handling: 1, kicking: 1, reflexes: 1, oneOnOnes: 1, punching: 1, rushingOut: 1, throwing: 1, commandOfArea: 1, communication: 1, eccentricity: 1 },
    setPieces: { corners: 7, freeKickTaking: 6, penaltyTaking: 5, longThrows: 4 },
    aerial: { heading: 10, jumpingReach: 10 },
    tactical: { marking: 10, tackling: 12, creativity: 14 },
    personality: { professionalism: 14, loyalty: 12, temperament: 9, sportsmanship: 10 },
  },
  ...overrides,
});

describe('ProfileNarrativeEngine', () => {
  it('returns correct personality label for balanced player', () => {
    const player = createPlayer({
      stats: {
        ...createPlayer().stats,
        internal: { decision: 14, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 8, polivalencia: 13, pase: 15, regate: 14 },
      },
    });
    expect(ProfileNarrativeEngine.getPersonalityLabel(player)).toBe('Equilibrado');
  });

  it('returns Modelo de Profesionalidad for high decision and versatility', () => {
    const player = createPlayer({
      stats: {
        ...createPlayer().stats,
        internal: { decision: 17, anticipacion: 15, posicionamiento: 14, vision: 16, control: 15, disparo: 12, velocidad: 15, resistencia: 14, fuerza: 12, agresividad: 8, polivalencia: 16, pase: 16, regate: 15 },
      },
    });
    expect(ProfileNarrativeEngine.getPersonalityLabel(player)).toBe('Modelo de Profesionalidad');
  });

  it('returns Volatil for high aggression', () => {
    const player = createPlayer({
      stats: {
        ...createPlayer().stats,
        internal: { decision: 14, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 18, polivalencia: 13, pase: 15, regate: 14 },
      },
    });
    expect(ProfileNarrativeEngine.getPersonalityLabel(player)).toBe('Volátil');
  });

  it('returns Lider Nato for high versatility', () => {
    const player = createPlayer({
      stats: {
        ...createPlayer().stats,
        internal: { decision: 14, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 8, polivalencia: 16, pase: 15, regate: 14 },
      },
    });
    expect(ProfileNarrativeEngine.getPersonalityLabel(player)).toBe('Líder Nato');
  });

  it('returns Muy Determinado for high decision', () => {
    const player = createPlayer({
      stats: {
        ...createPlayer().stats,
        internal: { decision: 18, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 8, polivalencia: 13, pase: 15, regate: 14 },
      },
    });
    expect(ProfileNarrativeEngine.getPersonalityLabel(player)).toBe('Muy Determinado');
  });

  it('returns correct headline for low fitness', () => {
    const player = createPlayer({ fitness: 50 });
    expect(ProfileNarrativeEngine.generateHeadline(player)).toBe('Fisicamente al limite, necesita descanso urgente.');
  });

  it('returns correct headline for low morale', () => {
    const player = createPlayer({ morale: 30 });
    expect(ProfileNarrativeEngine.generateHeadline(player)).toBe('Desmotivado y con la cabeza fuera del equipo.');
  });

  it('returns correct headline for high finishing and decision', () => {
    const player = createPlayer({
      positions: [Position.FW],
      stats: {
        ...createPlayer().stats,
        internal: { decision: 16, anticipacion: 15, posicionamiento: 14, vision: 15, control: 15, disparo: 17, velocidad: 15, resistencia: 14, fuerza: 11, agresividad: 8, polivalencia: 13, pase: 15, regate: 16 },
      },
    });
    expect(ProfileNarrativeEngine.generateHeadline(player)).toBe('Un depredador del area que rara vez falla ante el gol.');
  });
});
