import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player, Position, Club, TacticSettings, NationalTeamMatchOptions } from '../types';

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  name: 'Test Player',
  firstName: 'Test',
  lastName: 'Player',
  photo: undefined,
  age: 25,
  birthDate: new Date('1998-01-01'),
  height: 180,
  weight: 75,
  nationality: 'ES',
  positions: [Position.MC],
  secondaryPositions: [],
  primaryPosition: Position.MC,
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
  personality: 'PROFESSIONAL',
  leadership: 15,
  bigMatchTemperament: 12,
  tacticalFamiliarity: 80,
  consistency: 14,
  injury: false,
  suspension: undefined,
  transferStatus: 'NONE',
  contractExpiry: new Date('2028-06-30'),
  loanExpiry: undefined,
  transferRequestReason: undefined,
  playerTensions: undefined,
  pendingDialogue: undefined,
  isStarter: true,
  seasonStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0, averageRating: 0 },
  careerStats: { totalGoals: 0, totalAssists: 0, totalAppearances: 0, totalMinutes: 0, clubsPlayedFor: [] },
  relationshipWithManager: 0,
  attributes: {},
  currentAbility: 150,
  potentialAbility: 180,
  value: 10000000,
  salary: 50000,
  clubId: 'club1',
  squad: 'SENIOR',
  formRatings: [6, 7, 6],
  fitness: 85,
  morale: 70,
  reputation: 5000,
  loyalty: 50,
  negotiationAttempts: 0,
  isUnhappyWithContract: false,
  yellowCardsAccumulated: 0,
  injuryHistory: [],
  injuryProneness: 5,
  relationships: {},
  statsByCompetition: {},
  history: [],
  ...overrides,
});

const createClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'club1',
  name: 'Test Club',
  shortName: 'TST',
  leagueId: 'league1',
  country: 'ES',
  primaryColor: 'bg-blue-600',
  secondaryColor: 'text-blue-300',
  finances: {
    balance: 10000000,
    transferBudget: 5000000,
    wageBudget: 2000000,
    monthlyIncome: 500000,
    monthlyExpenses: 400000,
    scoutingBudget: 100000,
    monthlyHistory: [],
  },
  reputation: 5000,
  stadium: 'Test Stadium',
  stadiumCapacity: 30000,
  honours: [],
  trainingFacilities: 10,
  youthFacilities: 10,
  youthRecruitment: 10,
  scoutingRegion: 'ARG',
  qualifiedFor: null,
  trainingDelegatedTo: undefined,
  pressDelegatedTo: undefined,
  talksDelegatedTo: undefined,
  reserveDelegatedTo: undefined,
  u20DelegatedTo: undefined,
  scoutingDelegatedTo: undefined,
  boardConfidence: 80,
  shortlistedPlayerIds: [],
  u21MinutesThisSeason: 0,
  records: {
    allTimeTopScorer: { name: 'Test', goals: 100 },
    allTimeMostApps: { name: 'Test', apps: 300 },
  },
  teamCohesion: 70,
  ...overrides,
});

const mockWorld = {
  getPlayersByClub: vi.fn(() => []),
  getClub: vi.fn(() => createClub()),
  getPlayer: vi.fn(() => createPlayer()),
  getPlayersByNationalTeam: vi.fn(() => []),
  nationalTeamManager: {
    isControlled: vi.fn(() => false),
    getControlledSquadIds: vi.fn(() => []),
    getControlledLineup: vi.fn(() => []),
    getControlledCaptain: vi.fn(() => undefined),
    getControlledTactic: vi.fn(() => undefined),
    nationalTeams: [],
  },
};

vi.mock('../services/worldManager', () => ({
  world: mockWorld,
}));

describe('MatchSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initMatchStats', () => {
    it('creates stats para todos los jugadores', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const players = [
        createPlayer({ id: 'p1' }),
        createPlayer({ id: 'p2' }),
        createPlayer({ id: 'p3' }),
      ];
      const stats = MatchSimulator.initMatchStats(players);
      expect(Object.keys(stats)).toHaveLength(3);
      expect(stats['p1'].rating).toBe(6.0);
      expect(stats['p1'].goals).toBe(0);
      expect(stats['p1'].minutesPlayed).toBe(0);
    });

    it('inicializa valores por defecto correctos', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const players = [createPlayer({ id: 'p1' })];
      const stats = MatchSimulator.initMatchStats(players);
      const s = stats['p1'];
      expect(s.passesAttempted).toBe(0);
      expect(s.shots).toBe(0);
      expect(s.foulsCommitted).toBe(0);
      expect(s.condition).toBe(100);
    });
  });

  describe('initMatchState', () => {
    it('inicializa el estado con valores por defecto', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const homePlayers = [createPlayer({ id: 'h1', isStarter: true }), createPlayer({ id: 'h2', isStarter: false })];
      const awayPlayers = [createPlayer({ id: 'a1', isStarter: true }), createPlayer({ id: 'a2', isStarter: false })];
      const state = MatchSimulator.initMatchState('home', 'away', homePlayers, awayPlayers);

      expect(state.homeTeamId).toBe('home');
      expect(state.awayTeamId).toBe('away');
      expect(state.homeScore).toBe(0);
      expect(state.awayScore).toBe(0);
      expect(state.minute).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.homeActiveIds).toEqual(['h1']);
      expect(state.awayActiveIds).toEqual(['a1']);
      expect(state.homeBenchIds).toEqual(['h2']);
      expect(state.awayBenchIds).toEqual(['a2']);
      expect(state.homeSubsUsed).toBe(0);
      expect(state.awaySubsUsed).toBe(0);
    });
  });

  describe('performSubstitution', () => {
    it('cambia jugadores correctamente en local', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const homePlayers = [
        createPlayer({ id: 'h1', isStarter: true }),
        createPlayer({ id: 'h2', isStarter: false }),
      ];
      const awayPlayers = [createPlayer({ id: 'a1', isStarter: true })];
      const state = MatchSimulator.initMatchState('home', 'away', homePlayers, awayPlayers);
      const homeClub = createClub({ id: 'home', shortName: 'HOME' });
      const awayClub = createClub({ id: 'away', shortName: 'AWAY' });

      const newState = MatchSimulator.performSubstitution(state, true, 'h1', 'h2', homePlayers, awayPlayers, homeClub, awayClub);

      expect(newState.homeActiveIds).not.toContain('h1');
      expect(newState.homeActiveIds).toContain('h2');
      expect(newState.homeBenchIds).toContain('h1');
      expect(newState.homeBenchIds).not.toContain('h2');
      expect(newState.homeSubsUsed).toBe(1);
      expect(newState.events).toHaveLength(1);
      expect(newState.events[0].type).toBe('SUBSTITUTION');
      expect(newState.playerStats['h2'].condition).toBe(90);
    });

    it('no altera estado del rival', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const homePlayers = [createPlayer({ id: 'h1', isStarter: true }), createPlayer({ id: 'h2', isStarter: false })];
      const awayPlayers = [createPlayer({ id: 'a1', isStarter: true }), createPlayer({ id: 'a2', isStarter: false })];
      const state = MatchSimulator.initMatchState('home', 'away', homePlayers, awayPlayers);
      const homeClub = createClub({ id: 'home' });
      const awayClub = createClub({ id: 'away' });

      const newState = MatchSimulator.performSubstitution(state, true, 'h1', 'h2', homePlayers, awayPlayers, homeClub, awayClub);

      expect(newState.awayActiveIds).toEqual(['a1']);
      expect(newState.awayBenchIds).toEqual(['a2']);
      expect(newState.awaySubsUsed).toBe(0);
    });
  });

  describe('adjustTacticsDynamically', () => {
    const baseTactic: TacticSettings = {
      mentality: 10,
      tempo: 10,
      defensiveLine: 10,
      closingDown: 10,
      timeWasting: 5,
      passingStyle: 10,
      width: 10,
      counterAttack: false,
      creativeFreedom: 10,
      focusPassing: 'MIXED',
      crossBall: 'MIXED',
      throughBalls: 'MIXED',
      longShots: 'MIXED',
      setPieces: {},
    };

    it('aplica modo desesperado cuando va perdiendo por 2', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const adj = MatchSimulator.adjustTacticsDynamically(baseTactic, true, 0, 2, 60);
      expect(adj?.mentality).toBeGreaterThan(baseTactic.mentality);
      expect(adj?.tempo).toBeGreaterThan(baseTactic.tempo);
      expect(adj?.timeWasting).toBeLessThan(baseTactic.timeWasting);
    });

    it('protege ventaja ajustando tiempo y linea defensiva', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const adj = MatchSimulator.adjustTacticsDynamically(baseTactic, true, 1, 0, 80);
      expect(adj?.mentality).toBeLessThan(baseTactic.mentality);
      expect(adj?.timeWasting).toBeGreaterThan(baseTactic.timeWasting);
      expect(adj?.defensiveLine).toBeLessThan(baseTactic.defensiveLine);
    });

    it('no muta la tactica original', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const original = { ...baseTactic };
      MatchSimulator.adjustTacticsDynamically(baseTactic, true, 0, 2, 60);
      expect(baseTactic.mentality).toBe(original.mentality);
    });

    it('retorna undefined si no hay tactica base', async () => {
      const { MatchSimulator } = await import('../services/engine');
      expect(MatchSimulator.adjustTacticsDynamically(undefined, true, 0, 2, 60)).toBeUndefined();
    });
  });

  describe('selectBestXI', () => {
    it('selecciona exactamente 11 jugadores', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const players = Array.from({ length: 22 }, (_, i) =>
        createPlayer({ id: `p${i}`, currentAbility: 100 + i, positions: [Position.MC] })
      );
      const xi = MatchSimulator.selectBestXI(players);
      expect(xi).toHaveLength(11);
    });

    it('respeta limite de 11 cuando hay menos jugadores', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const players = [createPlayer({ id: 'p1' }), createPlayer({ id: 'p2' })];
      const xi = MatchSimulator.selectBestXI(players);
      expect(xi).toHaveLength(2);
    });
  });

  describe('distributeStats', () => {
    it('distribuye el total correctamente', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const players = [
        createPlayer({ id: 'p1' }),
        createPlayer({ id: 'p2' }),
      ];
      const result = MatchSimulator.distributeStats(players, 10, 'passing', 0);
      const sum = Object.values(result).reduce((a, b) => a + b, 0);
      expect(sum).toBe(10);
    });

    it('retorna objeto vacio si no hay jugadores', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const result = MatchSimulator.distributeStats([], 10, 'passing', 0);
      expect(result).toEqual({});
    });
  });

  describe('simulateLightMatch', () => {
    it('produce un marcador no negativo', async () => {
      const { MatchSimulator } = await import('../services/engine');
      mockWorld.getPlayersByClub.mockReturnValue([
        createPlayer({ id: 'h1', currentAbility: 150 }),
        createPlayer({ id: 'h2', currentAbility: 140 }),
      ]);
      mockWorld.getClub.mockReturnValue(createClub({ id: 'home', reputation: 6000 }));

      const result = MatchSimulator.simulateLightMatch('home', 'away', 'SENIOR');
      expect(result.homeScore).toBeGreaterThanOrEqual(0);
      expect(result.awayScore).toBeGreaterThanOrEqual(0);
      expect(typeof result.stats).toBe('object');
      expect(Array.isArray(result.events)).toBe(true);
    });
  });

  describe('simulateQuickMatch', () => {
    it('produce resultado con stats y eventos', async () => {
      const { MatchSimulator } = await import('../services/engine');
      mockWorld.getPlayersByClub.mockImplementation((clubId: string) => {
        if (clubId === 'home') return [createPlayer({ id: 'h1', currentAbility: 160, positions: [Position.GK] }), createPlayer({ id: 'h2', currentAbility: 150, positions: [Position.DC] })];
        return [createPlayer({ id: 'a1', currentAbility: 140, positions: [Position.GK] }), createPlayer({ id: 'a2', currentAbility: 130, positions: [Position.DC] })];
      });
      mockWorld.getClub.mockReturnValue(createClub({ id: 'home', reputation: 7000 }));

      const result = MatchSimulator.simulateQuickMatch('home', 'away', 'SENIOR');
      expect(typeof result.homeScore).toBe('number');
      expect(typeof result.awayScore).toBe('number');
      expect(Object.keys(result.stats).length).toBeGreaterThan(0);
      expect(Array.isArray(result.events)).toBe(true);
    });
  });

  describe('simulateNationalTeamMatch', () => {
    it('produce resultado para selecciones', async () => {
      const { MatchSimulator } = await import('../services/engine');
      mockWorld.nationalTeamManager = {
        isControlled: vi.fn(() => false),
        getControlledSquadIds: vi.fn(() => []),
        getControlledLineup: vi.fn(() => []),
        getControlledCaptain: vi.fn(() => undefined),
        getControlledTactic: vi.fn(() => undefined),
        nationalTeams: [
          { id: 'nt-home', reputation: 7500 },
          { id: 'nt-away', reputation: 6500 },
        ],
      };
      mockWorld.getPlayersByNationalTeam.mockImplementation((teamId: string) => {
        if (teamId === 'nt-home') return [createPlayer({ id: 'nh1', currentAbility: 160, positions: [Position.GK] })];
        return [createPlayer({ id: 'na1', currentAbility: 140, positions: [Position.GK] })];
      });

      const result = MatchSimulator.simulateNationalTeamMatch('nt-home', 'nt-away');
      expect(typeof result.homeScore).toBe('number');
      expect(typeof result.awayScore).toBe('number');
      expect(Object.keys(result.stats).length).toBeGreaterThan(0);
    });
  });

  describe('finalizeSeasonStats', () => {
    it('acumula estadisticas de temporada correctamente', async () => {
      const { MatchSimulator } = await import('../services/engine');
      const player = createPlayer({
        id: 'p1',
        seasonStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0, averageRating: 0, conceded: 0, cleanSheets: 0, totalRating: 0 },
        careerStats: { totalApps: 0, totalGoals: 0, totalAssists: 0, totalCleanSheets: 0, clubsPlayedFor: [] },
        formRatings: [],
      });
      const matchStats = {
        [player.id]: {
          rating: 7.5,
          goals: 2,
          assists: 1,
          condition: 100,
          minutesPlayed: 90,
          passesAttempted: 40,
          passesCompleted: 35,
          keyPasses: 2,
          shots: 4,
          shotsOnTarget: 3,
          dribblesAttempted: 3,
          dribblesCompleted: 2,
          offsides: 0,
          tacklesAttempted: 2,
          tacklesCompleted: 1,
          keyTackles: 0,
          interceptions: 1,
          shotsBlocked: 0,
          headersAttempted: 1,
          headersWon: 0,
          keyHeaders: 0,
          saves: 0,
          conceded: 0,
          foulsCommitted: 1,
          foulsReceived: 2,
          participationPhrase: '',
        },
      };

      MatchSimulator.finalizeSeasonStats([player], [], matchStats, 2, 1, 'liga1');

      expect(player.seasonStats.appearances).toBe(1);
      expect(player.seasonStats.goals).toBe(2);
      expect(player.seasonStats.assists).toBe(1);
      expect(player.careerStats.totalGoals).toBe(2);
      expect(player.careerStats.totalApps).toBe(1);
      expect(player.formRatings).toHaveLength(1);
      expect(player.formRatings[0]).toBeCloseTo(7.5, 1);
    });
  });

  describe('getPersonalityLabel', () => {
    it('funciona igual que ProfileNarrativeEngine', async () => {
      const { ProfileNarrativeEngine } = await import('../services/engine');
      const player = createPlayer({
        stats: {
          ...createPlayer().stats,
          internal: { decision: 14, anticipacion: 13, posicionamiento: 12, vision: 15, control: 13, disparo: 10, velocidad: 14, resistencia: 12, fuerza: 11, agresividad: 8, polivalencia: 13, pase: 15, regate: 14 },
        },
      });
      const label = ProfileNarrativeEngine.getPersonalityLabel(player);
      expect(label).toBe('Equilibrado');
    });
  });
});
