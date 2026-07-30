
export enum Position {
  GK = 'P',
  SW = 'LIB',
  DC = 'DFC',
  DR = 'LD',
  DL = 'LI',
  DMR = 'CD',
  DML = 'CI',
  DM = 'MCD',
  MC = 'MC',
  MR = 'MD',
  ML = 'MI',
  AM = 'MPC',
  AMR = 'ED',
  AML = 'EI',
  ST = 'DC',
  STR = 'WD',
  STL = 'WI'
}

export enum Zone {
  DEF_L = 'DEF_L', DEF_C = 'DEF_C', DEF_R = 'DEF_R',
  MID_L = 'MID_L', MID_C = 'MID_C', MID_R = 'MID_R',
  ATT_L = 'ATT_L', ATT_C = 'ATT_C', ATT_R = 'ATT_R',
  BOX = 'BOX'
}

export type TransitionPhase = 'ORGANIZED' | 'COUNTER' | 'DISORGANIZED';
export type BallState = 'KICKOFF' | 'IN_PLAY' | 'OUT_OF_BOUNDS' | 'CORNER' | 'FREE_KICK' | 'GOAL_CELEBRATION' | 'HALF_TIME' | 'FINISHED';

export type SquadType = 'SENIOR' | 'RESERVE' | 'U20';

export type Attribute = number; // 1-20

export interface PlayerStats {
    internal: {
      velocidad: Attribute;
      resistencia: Attribute;
      fuerza: Attribute;
      control: Attribute;
      pase: Attribute;
      regate: Attribute;
      disparo: Attribute;
      anticipacion: Attribute;
      decision: Attribute;
      posicionamiento: Attribute;
      vision: Attribute;
      agresividad: Attribute;
      polivalencia: Attribute;
    };
    visible: {
      fisico: Attribute;
      mental: Attribute;
      tecnica: Attribute;
      agresividad: Attribute;
      polivalencia: Attribute;
    };
  }

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  conceded: number;
  totalRating: number;
}

export interface PlayerHistoryEntry {
  year: number;
  clubId: string;
  stats: PlayerSeasonStats;
}

export interface ManagerHistory {
  totalGames: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  currentStreak: 'W' | 'D' | 'L' | null;
  streakCount: number;
  longestWinStreak: number;
  titles: string[];
  seasonsCompleted: number;
}

export interface Player {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  age: number;
  birthDate: Date;
  height: number;
  weight: number;
  nationality: string;
  positions: Position[];
  secondaryPositions: Position[];
  primaryPosition?: Position;
  stats: PlayerStats;
  seasonStats: PlayerSeasonStats;
  statsByCompetition: Record<string, PlayerSeasonStats>;
  history: PlayerHistoryEntry[];
  currentAbility: number;
  potentialAbility: number;
  reputation: number;
  fitness: number;
  morale: number;
  clubId: string;
  isStarter: boolean;
  tacticalPosition?: number;
  squad: SquadType;
  value: number;
  salary: number;
  transferStatus: 'NONE' | 'TRANSFERABLE' | 'LOANABLE';
  contractExpiry: Date;
  loyalty: number;
  negotiationAttempts: number;
  lastNegotiationDate?: Date;
  requestedSalary?: number;
  isUnhappyWithContract: boolean;
  leadership: number;
  consistency: number;
  bigMatchTemperament: number;
  releaseClause?: number;
  developmentTrend?: 'RISING' | 'DECLINING' | 'STABLE';
  yellowCardsAccumulated: number;
  injury?: { type: string; daysLeft: number };
  injuryHistory: { type: string; days: number; date: Date }[];
  injuryProneness: number;
  suspension?: { matchesLeft: number };
  loanDetails?: { originalClubId: string; wageShare: number; loanToBuy?: boolean };
  agent?: { name: string; commission: number };
  lastMotiveInteraction?: Date;
  trainingSchedule?: TrainingSchedule;
  formRatings: number[];
  tacticalFamiliarity: number;
  isTransferListed: boolean;
  relationships: Record<string, { trust: number; respect: number; tension: number }>;
}

export interface ClubRecords {
  biggestVictory: { opponent: string; goalsFor: number; goalsAgainst: number; date: Date; competition: string } | null;
  biggestDefeat: { opponent: string; goalsFor: number; goalsAgainst: number; date: Date; competition: string } | null;
  longestWinStreak: number;
  currentWinStreak: number;
  highestScoringMatch: { goalsTotal: number; opponent: string; date: Date } | null;
  bestPlayerSeason: { playerName: string; goals: number; season: string } | null;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  country: string;
  primaryColor: string;
  secondaryColor: string;
  finances: {
    balance: number;
    transferBudget: number;
    wageBudget: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    scoutingBudget: number;
    monthlyHistory: { month: string; income: number; expenses: number; balance: number }[];
  };
  reputation: number;
  stadium: string;
  stadiumCapacity: number;
  honours: { name: string; year: number }[];
  trainingFacilities: number;
  youthFacilities: number;
  youthRecruitment: number;
   scoutingRegion: 'ARG' | 'BRA' | 'URU' | 'CHL' | 'COL' | 'ECU' | 'PAR' | 'PER' | 'URY' | 'VEN' | 'BOL' | 'GLO';
  qualifiedFor?: string | null;
  trainingDelegatedTo?: string;
  boardConfidence: number;
  seasonObjective?: 'WIN_LEAGUE' | 'TOP_4' | 'TOP_HALF' | 'AVOID_RELEGATION' | 'WIN_CUP' | 'CUP_SEMIS';
  shortlistedPlayerIds: string[];
  u21MinutesThisSeason: number;
  records: ClubRecords;
}

export type CompetitionType = 'LEAGUE' | 'CUP' | 'CONTINENTAL_ELITE' | 'CONTINENTAL_SMALL' | 'GLOBAL';

export interface LeagueStanding {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  position: number;
}

export interface NationalTeam {
  id: string;
  name: string;
  country: string;
  confederation: 'CONMEBOL' | 'UEFA' | 'CAF' | 'CONCACAF' | 'AFC' | 'OFC';
  reputation: number;
  playerIds: string[];
  captainId?: string;
  formation: string;
}

export interface NationalTeamGroup {
  id: string;
  name: string;
  teams: string[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  type: CompetitionType;
  tier: number;
  continent: string;
  confederation: string;
  defaultPrizePool: number;
  squadRegistrationLimit?: number;
  u21Requirement?: number;
  continentalSlots?: number;
  seasonStartMonth?: number;
  seasonEndMonth?: number;
}

export type MatchStage = 'REGULAR' | 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface Fixture {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  squadType: SquadType;
  stage: MatchStage;
  groupId?: number;
  isNeutral?: boolean;
}

export interface TableEntry {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface PlayerTacticSettings {
  mentality: number;
  creativeFreedom: number;
  passingStyle: number;
  closingDown: number;
  tackling: number;
  forwardRuns: 'RARELY' | 'MIXED' | 'OFTEN';
  runWithBall: 'RARELY' | 'MIXED' | 'OFTEN';
  longShots: 'RARELY' | 'MIXED' | 'OFTEN';
  throughBalls: 'RARELY' | 'MIXED' | 'OFTEN';
  crossBall: 'RARELY' | 'MIXED' | 'OFTEN';
  marking: 'ZONAL' | 'MAN';
  tightMarking: boolean;
  holdUpBall: boolean;
}

export interface TacticSettings {
  mentality: number;
  creativeFreedom: number;
  passingStyle: number;
  tempo: number;
  width: number;
  closingDown: number;
  timeWasting: number;
  defensiveLine: number;
  tackling: number;
  focusPassing: 'LEFT' | 'RIGHT' | 'CENTER' | 'MIXED';
  marking: 'ZONAL' | 'MAN';
  targetManSupply: 'HEAD' | 'FEET' | 'SPACE' | 'MIXED';
  tightMarking: boolean;
  useTargetMan: boolean;
  usePlaymaker: boolean;
  playOffside: boolean;
  counterAttack: boolean;
  setPieces: {
    cornersLeft: string;
    cornersRight: string;
    freeKicksLeft: string;
    freeKicksRight: string;
    throwInsLeft: string;
    throwInsRight: string;
  };
}

export interface Tactic {
  id: string;
  name: string;
  positions: number[];
  arrows: Record<number, number>;
  settings: TacticSettings;
  individualSettings: Record<number, PlayerTacticSettings>;
}

export interface MatchEvent {
  minute: number;
  second?: number;
  type: 'GOAL' | 'CHANCE' | 'MISS' | 'YELLOW_CARD' | 'RED_CARD' | 'WHISTLE' | 'INJURY' | 'PASS' | 'TACKLE' | 'INTERCEPTION' | 'SAVE' | 'CORNER' | 'FREE_KICK' | 'KICKOFF' | 'SUBSTITUTION' | 'THROW_IN' | 'PENALTY' | 'OFFSIDE';
  text: string;
  teamId?: string;
  playerId?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  intensity: number;
  coordinates?: { x: number; y: number };
  isTechnical?: boolean;
}

export interface MatchState {
  isPlaying: boolean;
  minute: number;
  second: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
  homeStats: TeamMatchStats;
  awayStats: TeamMatchStats;
  playerStats: Record<string, PlayerMatchStats>;
  halftimeTriggered: boolean;
  possessionTeamId?: string;
  possessorId?: string | null;
  ballState: BallState;
  ballPosition: { x: number; y: number };
  homeSubsUsed: number;
  awaySubsUsed: number;
  homeActiveIds: string[];
  awayActiveIds: string[];
  homeBenchIds: string[];
  awayBenchIds: string[];
}

export interface TacticalReport {
  title: string;
  summary: string;
  keyStrength?: string;
  keyWeakness?: string;
  suggestion: string;
}

export interface TrainingSchedule {
  STRENGTH: number;
  AEROBIC: number;
  TACTICAL: number;
  BALL_CONTROL: number;
  DEFENDING: number;
  ATTACKING: number;
  SHOOTING: number;
  SET_PIECES: number;
}

export interface PlayerMatchStats {
  rating: number;
  goals: number;
  assists: number;
  condition: number;
  minutesPlayed: number;
  passesAttempted: number;
  passesCompleted: number;
  keyPasses: number;
  shots: number;
  shotsOnTarget: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  offsides: number;
  tacklesAttempted: number;
  tacklesCompleted: number;
  keyTackles: number;
  interceptions: number;
  shotsBlocked: number;
  headersAttempted: number;
  headersWon: number;
  keyHeaders: number;
  saves: number;
  conceded: number;
  foulsCommitted: number;
  foulsReceived: number;
  card?: 'YELLOW' | 'RED';
  participationPhrase?: string;
  sustainedInjury?: { type: string; days: number };
  severe?: boolean;
}

export interface TeamMatchStats {
  possession: number;
  possessionTime: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  corners: number;
  freeKicks: number;
  yellowCards: number;
  redCards: number;
}

export type StaffRole = 'HEAD_COACH' | 'ASSISTANT_MANAGER' | 'PHYSIO' | 'FITNESS_COACH' | 'RESERVE_MANAGER' | 'YOUTH_MANAGER' | 'SCOUT';

export interface StaffAttributes {
  coaching: number;
  judgingAbility: number;
  judgingPotential: number;
  tacticalKnowledge: number;
  adaptability: number;
  medical: number;
  physiotherapy: number;
  motivation: number;
  manManagement: number;
}

export interface StaffHistoryEntry {
  year: number;
  clubId: string;
  role: StaffRole;
}

export interface StaffPreviousClub {
  clubId: string;
  clubName: string;
  years: string;
  titles: string[];
}

export interface Staff {
  id: string;
  name: string;
  age: number;
  nationality: string;
  role: StaffRole;
  clubId: string;
  attributes: StaffAttributes;
  salary: number;
  contractExpiry: Date;
  history: StaffHistoryEntry[];
  personality?: string;
  morale?: number;
  reputation?: number;
  internationalReputation?: number;
  relationships?: Record<string, { trust: number; respect: number; tension: number }>;
  pressReputation?: number;
  boardRelationship?: number;
  biography?: string;
  preferredFormation?: string;
  tacticalStyle?: 'CONTROL' | 'ATTACK' | 'DEFENSE' | 'COUNTER' | 'BALANCED';
  pressIntensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  possessionVsCounter?: 'POSSESSION' | 'COUNTER' | 'BALANCED';
  playingStyle?: string;
  careerHonours?: string[];
  previousClubs?: StaffPreviousClub[];
}

export interface RealManager {
  id: string;
  name: string;
  surname: string;
  nationality: string;
  age: number;
  birthDate: Date;
  currentClubId: string | null;
  leagueId: string;
  attributes: StaffAttributes;
  personality: string;
  reputation: number;
  history: StaffHistoryEntry[];
  biography?: string;
  preferredFormation?: string;
  tacticalStyle?: 'CONTROL' | 'ATTACK' | 'DEFENSE' | 'COUNTER' | 'BALANCED';
  pressIntensity?: 'LOW' | 'MEDIUM' | 'HIGH';
  possessionVsCounter?: 'POSSESSION' | 'COUNTER' | 'BALANCED';
  playingStyle?: string;
  internationalReputation?: number;
  careerHonours?: string[];
  previousClubs?: StaffPreviousClub[];
}

export type MessageCategory = 'MARKET' | 'SQUAD' | 'STATEMENTS' | 'FINANCE' | 'COMPETITION' | 'SCOUTING' | 'PEOPLE';

export interface ScoutingReport {
  id: string;
  playerId: string;
  clubId: string;
  date: Date;
  currentAbility: number;
  potentialAbility: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  personality: string;
  isRead: boolean;
}

export interface InboxMessage {
  id: string;
  date: Date;
  category: MessageCategory;
  subject: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
}

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  amount: number;
  wageShare: number;
  type: 'PURCHASE' | 'LOAN' | 'LOAN_TO_BUY';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'COMPLETED';
  date: Date;
  responseDate: Date;
  isViewed: boolean;
  counterAmount?: number;
}

export interface MatchSettings {
  pauseAtHalftime: boolean;
  speedMultiplier: number;
}

export type DialogueTone = 'MILD' | 'MODERATE' | 'AGGRESSIVE';

export interface DialogueResult {
  text: string;
  moraleChange: number;
  reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  canReplica?: boolean;
}

export type TrainingCategory = keyof TrainingSchedule;

export type TacticalStyle = 'CONTROL' | 'ATTACK' | 'DEFENSE' | 'COUNTER';

export const ATTRIBUTE_LABELS: Record<string, string> = {
  velocidad: "Velocidad", resistencia: "Resistencia", fuerza: "Fuerza",
  control: "Control", pase: "Pase", regate: "Regate", disparo: "Disparo",
  anticipacion: "Anticipación", decision: "Decisión", posicionamiento: "Posicionamiento",
  vision: "Visión", agresividad: "Agresividad", polivalencia: "Polivalencia",
  fisico: "Físico", mental: "Mental", tecnica: "Técnica",
};

export const ATTRIBUTE_TOOLTIPS: Record<string, string> = {
  velocidad: "Ritmo y aceleración en carrera. Afecta regates, contragolpes y desmarques.",
  resistencia: "Capacidad de mantener el nivel físico durante 90 minutos.",
  fuerza: "Potencia en contacto, juego aéreo y protección de balón.",
  control: "Primer toque, recepción y orientación del balón.",
  pase: "Precisión en pase corto, largo y en profundidad.",
  regate: "Capacidad de desborde en 1vs1.",
  disparo: "Precisión de tiro a puerta con ambas piernas.",
  anticipacion: "Lectura de jugada e interceptación de pases.",
  decision: "Toma de decisiones bajo presión.",
  posicionamiento: "Colocación en el campo (ofensiva y defensiva).",
  vision: "Capacidad de ver y ejecutar pases inesperados.",
  agresividad: "Intensidad en presión y dureza en entradas.",
  polivalencia: "Capacidad de jugar en varias posiciones sin perder nivel.",
  fisico: "Capacidad atlética: ritmo, aguante y potencia.",
  mental: "Inteligencia de juego: lectura, elección y colocación.",
  tecnica: "Calidad con el balón: toque, precisión y desborde.",
};

export const POSITION_FULL_NAMES: Record<string, string> = {
  [Position.GK]: "Portero",
  [Position.SW]: "Libero",
  [Position.DC]: "Defensa Central",
  [Position.DR]: "Lateral Derecho",
  [Position.DL]: "Lateral Izquierdo",
  [Position.DM]: "Mediocentro Defensivo",
  [Position.MC]: "Mediocentro",
  [Position.MR]: "Interior Derecho",
  [Position.ML]: "Interior Izquierdo",
  [Position.AM]: "Mediapunta",
  [Position.AMR]: "Extremo Derecho",
  [Position.AML]: "Extremo Izquierdo",
  [Position.ST]: "Delantero Centro",
  [Position.STR]: "Delantero Derecho",
  [Position.STL]: "Delantero Izquierdo"
};

export const POSITION_ORDER: Record<string, number> = {
  'P': 0, 'LIB': 1, 'DFC': 2, 'LD': 3, 'LI': 4, 'CD': 6, 'CI': 7, 'MCD': 5, 'MC': 8, 'MD': 9, 'MI': 10, 'MPC': 11, 'ED': 12, 'EI': 13, 'DC': 14, 'WD': 15, 'WI': 16
};

export type DialogueType = 'PRAISE_FORM' | 'CRITICIZE_FORM' | 'PRAISE_TRAINING' | 'DEMAND_MORE' | 'WARN_CONDUCT' | 'SET_CAPTAIN' | 'CHANGE_POSITION' | 'INDIVIDUAL_TRAINING_FOCUS' | 'THREATEN_TRANSFER' | 'GRANT_CAPTANCY' | 'ASSIGN_TRAINING' | 'DELEGATE_MATCH' | 'REPRIMAND' | 'PROMISE_RESOURCES' | 'SCOUTING_FOCUS';

export type InteractionChannel = 'COACH_PLAYER' | 'COACH_STAFF' | 'COACH_MANAGER' | 'COACH_PRESS' | 'COACH_BOARD';

export interface InteractionLogEntry {
   id: string;
   date: Date;
   channel: InteractionChannel;
   actorId: string;
   targetId: string;
   type: DialogueType;
   tone: DialogueTone;
   result: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
   moraleChange: number;
   tensionChange: number;
   description: string;
 }
 
 export interface MediaNews {
   id: string;
   date: Date;
   type: 'HEADLINE' | 'FEATURE' | 'RUMOR' | 'CRITICISM' | 'PRAISE';
   category: 'MATCH' | 'TRANSFER' | 'INJURY' | 'BOARD' | 'GENERAL';
   headline: string;
   subheadline: string;
   body: string;
   clubId?: string;
   competitionId?: string;
   playerId?: string;
   isUserClubNews: boolean;
   read: boolean;
 }

export interface ReputationalBuff {
  id: string;
  source: string;
  type: string;
  value: number;
  expiresAt: Date;
}

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

export type ManagerOrigin = 'EX_PLAYER' | 'YOUTH_COACH' | 'JOURNALIST';
export type RelationshipState = 'ANGRY' | 'WORRIED' | 'CALM' | 'HAPPY';

export interface ClubHistoryEntry {
  clubId: string;
  clubName: string;
  startDate: Date;
  endDate?: Date;
  seasons: number;
  titles: string[];
}

export interface ManagerProfile {
  name: string;
  surname: string;
  fullName: string;
  nationality: string;
  birthDate: Date;
  careerStartDate: Date;
  origin: ManagerOrigin;
  photo?: string;

  currentClubId: string;
  currentClubName: string;
  seasonInClub: number;
  yearsInClub: number;

  totalGames: number;
  totalWins: number;
  totalDraws: number;
  totalLosses: number;
  goalsFor: number;
  goalsAgainst: number;
  titles: string[];
  youthDebuts: number;
  mostUsedPlayer: string;
  biggestSale: { player: string; amount: number } | null;

  currentObjective: string;
  boardRelationship: RelationshipState;
  pressRelationship: RelationshipState;
  fansRelationship: RelationshipState;

  clubHistory: ClubHistoryEntry[];
  legacy: string;
}
