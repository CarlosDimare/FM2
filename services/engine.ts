
import { Player, Club, MatchEvent, PlayerMatchStats, Zone, Position, TacticalReport, TacticSettings, TransitionPhase, MatchState, BallState } from '../types';
import { randomInt } from './utils';
import { world } from './worldManager';
import { sendInjuryNotification } from './notifications';

export const SLOT_CONFIG: Record<number, { line: 'GK' | 'SW' | 'DEF' | 'DM' | 'MID' | 'AM' | 'ATT', side?: 'LEFT' | 'RIGHT' | 'CENTER', abbr: string }> = {
  0: { line: 'GK', side: 'CENTER', abbr: 'POR' },
  31: { line: 'SW', side: 'CENTER', abbr: 'LIB' },
  1: { line: 'DEF', side: 'LEFT', abbr: 'DFI' }, 2: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 3: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 4: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 5: { line: 'DEF', side: 'RIGHT', abbr: 'DFD' },
  6: { line: 'DM', side: 'LEFT', abbr: 'CRI' }, 7: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 8: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 9: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 10: { line: 'DM', side: 'RIGHT', abbr: 'CRD' },
  11: { line: 'MID', side: 'LEFT', abbr: 'MI' }, 12: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 13: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 14: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 15: { line: 'MID', side: 'RIGHT', abbr: 'MD' },
  16: { line: 'AM', side: 'LEFT', abbr: 'MPI' }, 17: { line: 'AM', side: 'CENTER', abbr: 'MPC' }, 18: { line: 'AM', side: 'RIGHT', abbr: 'MPD' }, 19: { line: 'AM', side: 'CENTER', abbr: 'MPC' }, 20: { line: 'AM', side: 'CENTER', abbr: 'MPC' },
  26: { line: 'ATT', side: 'CENTER', abbr: 'DLC' }, 27: { line: 'ATT', side: 'LEFT', abbr: 'EXT' }, 28: { line: 'ATT', side: 'RIGHT', abbr: 'EXT' }, 29: { line: 'ATT', side: 'CENTER', abbr: 'DLC' }, 30: { line: 'ATT', side: 'CENTER', abbr: 'DLC' },
};

const BASE_COORDS: Record<number, { x: number, y: number }> = {
    0: { x: 30, y: 500 }, 
    31: { x: 80, y: 500 }, 
    1: { x: 150, y: 150 }, 2: { x: 150, y: 350 }, 3: { x: 150, y: 500 }, 4: { x: 150, y: 650 }, 5: { x: 150, y: 850 }, 
    6: { x: 300, y: 200 }, 7: { x: 300, y: 400 }, 8: { x: 300, y: 500 }, 9: { x: 300, y: 600 }, 10: { x: 300, y: 800 }, 
    11: { x: 500, y: 100 }, 12: { x: 500, y: 400 }, 13: { x: 500, y: 500 }, 14: { x: 500, y: 600 }, 15: { x: 500, y: 900 }, 
    16: { x: 700, y: 150 }, 17: { x: 700, y: 500 }, 18: { x: 700, y: 850 }, 19: { x: 700, y: 400 }, 20: { x: 700, y: 600 }, 
    26: { x: 850, y: 500 }, 27: { x: 850, y: 200 }, 28: { x: 850, y: 800 }, 29: { x: 850, y: 400 }, 30: { x: 850, y: 600 }, 
};

export class ProfileNarrativeEngine {
  static getPersonalityLabel(player: Player): string {
    const i = player.stats.internal;
    if (i.decision >= 16 && i.polivalencia >= 14) return "Modelo de Profesionalidad";
    if (i.agresividad >= 17) return "Volátil";
    if (i.polivalencia >= 15) return "Líder Nato";
    if (i.decision >= 17) return "Muy Determinado";
    return "Equilibrado";
  }

  static generateHeadline(player: Player): string {
    const i = player.stats.internal;
    if (player.fitness < 60) return "Fisicamente al limite, necesita descanso urgente.";
    if (player.morale < 35) return "Desmotivado y con la cabeza fuera del equipo.";
    if (player.positions[0] === Position.GK) {
       if (i.anticipacion >= 16) return "Un seguro bajo palos con reflejos felinos.";
       if (i.decision >= 16) return "Especialista en salir triunfante de los mano a mano.";
       return "Portero solvente que aporta seguridad a la zaga.";
    }
    if (i.disparo >= 16 && i.decision >= 15) return "Un depredador del area que rara vez falla ante el gol.";
    if (i.velocidad >= 17) return "Un velocista capaz de castigar cualquier defensa adelantada.";
    if (i.pase >= 16 && i.vision >= 15) return "Un cerebro privilegiado capaz de ver huecos imposibles.";
    if (i.control >= 16 && i.vision >= 16) return "Un virtuoso del balon que deleita con su calidad tecnica.";
    if (i.anticipacion >= 16 && i.agresividad >= 16) return "Un baluarte defensivo practicamente inexpugnable.";
    if (i.fuerza >= 16 && i.disparo >= 14) return "Un coloso del aire dominante en ambas areas.";
    if (i.posicionamiento >= 16 && i.anticipacion >= 16) return "Lee el juego de maravilla y siempre esta en el lugar justo.";
    if (i.decision >= 18 && i.resistencia >= 17) return "Un guerrero incansable que lucha cada balon como si fuera el ultimo.";
    if (i.polivalencia >= 17) return "El gran capitan que guia al grupo con autoridad y ejemplo.";
    if (player.currentAbility > 150) return "Un futbolista de clase mundial que marca diferencias.";
    if (player.currentAbility > 120) return "Un jugador de gran nivel plenamente consolidado.";
    return "Un profesional centrado en cumplir con su labor diaria.";
  }
}

export class MatchSimulator {
  private static buildupPhase: Record<string, number> = {};

  private static attrMap: Record<string, string> = {
    'marking': 'anticipacion', 'tackling': 'anticipacion', 'heading': 'fuerza',
    'passing': 'pase', 'technique': 'control', 'firstTouch': 'control',
    'crossing': 'pase', 'dribbling': 'regate', 'finishing': 'disparo',
    'longShots': 'disparo', 'corners': 'pase', 'freeKickTaking': 'disparo',
    'penaltyTaking': 'disparo', 'longThrows': 'fuerza',
    'acceleration': 'velocidad', 'pace': 'velocidad', 'stamina': 'resistencia',
    'strength': 'fuerza', 'jumpingReach': 'fuerza', 'agility': 'velocidad',
    'balance': 'control', 'naturalFitness': 'resistencia',
    'anticipation': 'anticipacion', 'decisions': 'decision',
    'positioning': 'posicionamiento', 'vision': 'vision',
    'composure': 'decision', 'concentration': 'anticipacion',
    'determination': 'decision', 'flair': 'vision',
    'aggression': 'agresividad', 'bravery': 'agresividad',
    'workRate': 'resistencia', 'teamwork': 'polivalencia',
    'leadership': 'decision', 'offTheBall': 'posicionamiento',
    'professionalism': 'decision', 'loyalty': 'polivalencia',
    'pressure': 'decision', 'temperament': 'agresividad',
    'adaptability': 'polivalencia', 'sportsmanship': 'decision',
    'aerialReach': 'fuerza', 'commandOfArea': 'decision',
    'communication': 'decision', 'eccentricity': 'decision',
    'handling': 'control', 'kicking': 'pase', 'oneOnOnes': 'anticipacion',
    'reflexes': 'velocidad', 'rushingOut': 'decision',
    'punching': 'fuerza', 'throwing': 'pase',
  };

  private static getEffectiveAttribute(p: Player, stats: Record<string, PlayerMatchStats>, _category: string, attr: string): number {
    const mapped = MatchSimulator.attrMap[attr] || attr;
    const base = (p.stats.internal as any)[mapped] ?? 10;
    const condition = stats[p.id]?.condition || 100;
    const leadershipBonus = p.leadership > 14 ? (p.leadership - 14) * 0.002 : 0;
    const moraleMult = 0.95 + (p.morale / 1000) + leadershipBonus;
    const fatigueMult = 1 - ((100 - condition) / 100 * 0.2);
    let formMult = 1;
    if (p.formRatings.length > 0) {
      const avgForm = p.formRatings.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, p.formRatings.length);
      formMult = 0.92 + (avgForm / 30);
    }
    const familiarityMult = 0.85 + (p.tacticalFamiliarity / 100) * 0.3;
    const consistencyMult = 0.95 + (p.consistency / 20) * 0.1;
    return Math.max(1, Math.round(base * moraleMult * fatigueMult * formMult * familiarityMult * consistencyMult));
  }

  private static calculatePressure(actor: Player, defPlayers: Player[], ballX: number, ballY: number, actorStats: Record<string, PlayerMatchStats>, isHomeActor: boolean, closingDown: number = 10): number {
    let totalPressure = 0;
    const pressureRadius = 100 + closingDown * 5;
    defPlayers.forEach(def => {
      const coords = this.getPlayerCoords(def, !isHomeActor, ballX); 
      const dist = Math.sqrt(Math.pow(coords.x - ballX, 2) + Math.pow(coords.y - ballY, 2));
      
      if (dist < pressureRadius) {
        const marking = this.getEffectiveAttribute(def, actorStats, 'technical', 'marking');
        const pos = this.getEffectiveAttribute(def, actorStats, 'mental', 'positioning');
        totalPressure += (marking * 0.5 + pos * 0.5) * (1 - dist / pressureRadius);
      }
    });
    return totalPressure / 5; 
  }

  private static getZoneLabel(x: number, y: number, isHomePossession: boolean): string {
      const attX = isHomePossession ? x : 1000 - x;
      const attY = isHomePossession ? y : 1000 - y; 
      let zoneX = "";
      if (attX < 250) zoneX = "Defensa";
      else if (attX < 550) zoneX = "Campo Propio";
      else if (attX < 800) zoneX = "Medio Campo";
      else if (attX < 950) zoneX = "3/4 de Cancha";
      else zoneX = "Área Rival";
      let zoneY = "";
      if (attY < 150) zoneY = "Izq";
      else if (attY > 850) zoneY = "Der";
      else zoneY = "Centro";
      if (attX > 880 && attY > 250 && attY < 750) return "Área Chica/Penal";
      return `${zoneX} ${zoneY}`;
  }

  private static getPlayerLabel(p: Player, club?: Club): string {
      const tacticalPos = p.tacticalPosition ?? -1;
      const abbr = tacticalPos >= 0 ? (SLOT_CONFIG[tacticalPos]?.abbr || 'JUG') : 'JUG';
      const shortName = p.name.split(' ').pop(); 
      const teamTag = club ? `${club.shortName} ` : "";
      return `${teamTag}(${abbr}) ${shortName}`;
  }

  private static getRandomPassVerb(zone: string, isForward: boolean): string {
      const forwardVerbs = ["filtra pase a", "habilita a", "busca en profundidad a", "lanza para", "conecta con"];
      const neutralVerbs = ["toca para", "combina con", "cede el balón a", "encuentra a", "juega con", "abre hacia"];
      const backwardVerbs = ["retrasa para", "asegura con", "descarga en", "vuelve a empezar con"];
      const pool = isForward ? forwardVerbs : (zone.includes("Defensa") ? backwardVerbs : neutralVerbs);
      return pool[randomInt(0, pool.length - 1)];
  }

  private static getPlayerCoords(p: Player, isHomeTeam: boolean, ballX: number): { x: number, y: number } {
      const base = BASE_COORDS[p.tacticalPosition || 0] || { x: 500, y: 500 };
      let x = base.x; let y = base.y;
      if (!isHomeTeam) { x = 1000 - x; y = 1000 - y; }
      const isGK = SLOT_CONFIG[p.tacticalPosition || 0]?.line === 'GK';
      if (isGK) {
          const gkShift = (ballX - (isHomeTeam ? 0 : 1000)) * 0.05; 
          x += gkShift;
      } else {
          const xOffset = (ballX - x) * 0.45;
          x += xOffset;
      }
      return { x, y };
  }

  private static getProximityWeight(p: Player, ballX: number, ballY: number, isHomeTeam: boolean): number {
      const coords = this.getPlayerCoords(p, isHomeTeam, ballX);
      const dist = Math.sqrt(Math.pow(coords.x - ballX, 2) + Math.pow(coords.y - ballY, 2));
      if (dist < 40) return 1.2;
      if (dist < 100) return 1.0;
      if (dist < 250) return 0.6;
      return 0.01;
  }

  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, goals: 0, assists: 0, condition: 100, minutesPlayed: 0,
        passesAttempted: 0, passesCompleted: 0, keyPasses: 0,
        shots: 0, shotsOnTarget: 0, dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0,
        tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0,
        interceptions: 0, shotsBlocked: 0, headersAttempted: 0, headersWon: 0, keyHeaders: 0,
        saves: 0, conceded: 0, foulsCommitted: 0, foulsReceived: 0, participationPhrase: ""
      };
    });
    return stats;
  }

  static initMatchState(
    homeTeamId: string, awayTeamId: string,
    homePlayers: Player[], awayPlayers: Player[]
  ): MatchState {
    const homeActiveIds = homePlayers.filter(p => p.isStarter).map(p => p.id);
    const awayActiveIds = awayPlayers.filter(p => p.isStarter).map(p => p.id);
    const homeBenchIds = homePlayers.filter(p => !p.isStarter).map(p => p.id);
    const awayBenchIds = awayPlayers.filter(p => !p.isStarter).map(p => p.id);

    return {
      isPlaying: false,
      minute: 0, second: 0,
      homeScore: 0, awayScore: 0,
      events: [],
      homeTeamId, awayTeamId,
      homeStats: { possession: 50, possessionTime: 0, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, freeKicks: 0, yellowCards: 0, redCards: 0 },
      awayStats: { possession: 50, possessionTime: 0, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0, freeKicks: 0, yellowCards: 0, redCards: 0 },
      playerStats: MatchSimulator.initMatchStats([...homePlayers, ...awayPlayers]),
      halftimeTriggered: false,
      ballState: 'KICKOFF',
      ballPosition: { x: 500, y: 500 },
      homeSubsUsed: 0, awaySubsUsed: 0,
      homeActiveIds, awayActiveIds,
      homeBenchIds, awayBenchIds,
    };
  }

  static performSubstitution(
    state: MatchState,
    teamIsHome: boolean,
    playerOffId: string,
    playerOnId: string,
    allHomePlayers: Player[],
    allAwayPlayers: Player[],
    homeTeam: Club, awayTeam: Club
  ): MatchState {
    const newState: MatchState = {
      ...state,
      homeStats: { ...state.homeStats },
      awayStats: { ...state.awayStats },
      playerStats: { ...state.playerStats },
      ballPosition: { ...state.ballPosition },
      events: [...state.events],
      homeActiveIds: [...state.homeActiveIds],
      awayActiveIds: [...state.awayActiveIds],
      homeBenchIds: [...state.homeBenchIds],
      awayBenchIds: [...state.awayBenchIds],
    };

    const club = teamIsHome ? homeTeam : awayTeam;
    const pOff = (teamIsHome ? allHomePlayers : allAwayPlayers).find(p => p.id === playerOffId);
    const pOn = (teamIsHome ? allHomePlayers : allAwayPlayers).find(p => p.id === playerOnId);
    const pOffName = pOff ? pOff.name.split(' ').pop() : '???';
    const pOnName = pOn ? pOn.name.split(' ').pop() : '???';

    if (teamIsHome) {
      newState.homeActiveIds = newState.homeActiveIds.filter(id => id !== playerOffId);
      newState.homeActiveIds.push(playerOnId);
      newState.homeBenchIds = newState.homeBenchIds.filter(id => id !== playerOnId);
      newState.homeBenchIds.push(playerOffId);
      newState.homeSubsUsed++;
    } else {
      newState.awayActiveIds = newState.awayActiveIds.filter(id => id !== playerOffId);
      newState.awayActiveIds.push(playerOnId);
      newState.awayBenchIds = newState.awayBenchIds.filter(id => id !== playerOnId);
      newState.awayBenchIds.push(playerOffId);
      newState.awaySubsUsed++;
    }

    if (pOn) {
      newState.playerStats[playerOnId] = {
        rating: 6.0, goals: 0, assists: 0, condition: 90, minutesPlayed: 0,
        passesAttempted: 0, passesCompleted: 0, keyPasses: 0,
        shots: 0, shotsOnTarget: 0, dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0,
        tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0,
        interceptions: 0, shotsBlocked: 0, headersAttempted: 0, headersWon: 0, keyHeaders: 0,
        saves: 0, conceded: 0, foulsCommitted: 0, foulsReceived: 0, participationPhrase: ""
      };
    }

    newState.events.push({
      minute: state.minute, second: state.second,
      type: 'SUBSTITUTION',
      text: `Cambio en ${club.shortName}: entra ${pOnName} por ${pOffName}.`,
      teamId: club.id,
      importance: 'MEDIUM', intensity: 2,
    });

    return newState;
  }

  static simulateStep(
    state: MatchState,
    homeTeam: Club, awayTeam: Club,
    allHomePlayers: Player[], allAwayPlayers: Player[],
    homeTacticSettings?: TacticSettings,
    awayTacticSettings?: TacticSettings
  ): { nextState: MatchState, slowMotion: boolean } {
    
    const newState: MatchState = { 
        ...state,
        homeStats: { ...state.homeStats },
        awayStats: { ...state.awayStats },
        playerStats: { ...state.playerStats },
        ballPosition: { ...state.ballPosition },
        events: [...state.events],
        homeActiveIds: [...state.homeActiveIds],
        awayActiveIds: [...state.awayActiveIds],
        homeBenchIds: [...state.homeBenchIds],
        awayBenchIds: [...state.awayBenchIds],
    };

    let timeConsumed = 0;
    let slowMotion = false;

    const generateRandomTactic = (base?: TacticSettings): TacticSettings | undefined => {
      if (!base) return undefined;
      return {
        ...base,
        mentality: Math.max(1, Math.min(20, base.mentality + Math.floor(Math.random() * 9) - 4)),
        tempo: Math.max(1, Math.min(20, (base.tempo || 10) + Math.floor(Math.random() * 9) - 4)),
        closingDown: Math.max(1, Math.min(20, (base.closingDown || 10) + Math.floor(Math.random() * 9) - 4)),
        passingStyle: Math.max(1, Math.min(20, (base.passingStyle || 10) + Math.floor(Math.random() * 9) - 4)),
        width: Math.max(1, Math.min(20, (base.width || 10) + Math.floor(Math.random() * 9) - 4)),
      };
    };

    const homeTactic = homeTacticSettings;
    const awayTactic = awayTacticSettings || generateRandomTactic(homeTacticSettings);

    const getPlayerById = (id: string) => allHomePlayers.find(p => p.id === id) || allAwayPlayers.find(p => p.id === id);
    const activeHome = newState.homeActiveIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    const activeAway = newState.awayActiveIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    const homeBench = newState.homeBenchIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    const awayBench = newState.awayBenchIds.map(id => getPlayerById(id)).filter(Boolean) as Player[];
    
    const activeOnPitch = [...activeHome, ...activeAway];
    const actor = activeOnPitch.find(p => p.id === newState.possessorId);
    const isHomeActor = actor ? actor.clubId === homeTeam.id : (newState.possessionTeamId === homeTeam.id);
    const attPlayers = isHomeActor ? activeHome : activeAway;
    const defPlayers = isHomeActor ? activeAway : activeHome;
    const currentTeamStats = isHomeActor ? newState.homeStats : newState.awayStats;
    const actorClub = isHomeActor ? homeTeam : awayTeam;
    const defClub = isHomeActor ? awayTeam : homeTeam;
    
    const tactic = isHomeActor ? homeTactic : awayTactic;
    
    const ballX = newState.ballPosition.x;
    const ballY = newState.ballPosition.y;

    const distToGoal = isHomeActor ? (1000 - ballX) : (ballX - 0);
    const isBallInAttackingThird = distToGoal < 300;
    const currentZone = this.getZoneLabel(ballX, ballY, isHomeActor);

    if (newState.ballState === 'KICKOFF') {
        const teamId = (newState.homeScore + newState.awayScore === 0) ? (randomInt(0, 1) === 0 ? homeTeam.id : awayTeam.id) : (isHomeActor ? awayTeam.id : homeTeam.id);
        newState.possessionTeamId = teamId;
        newState.ballPosition = { x: 500, y: 500 };
        newState.ballState = 'IN_PLAY';
        const kTeam = teamId === homeTeam.id ? homeTeam : awayTeam;
        newState.events.push({ minute: state.minute, second: state.second, type: 'KICKOFF', text: `Inicio de juego. Mueve ${kTeam.name}.`, importance: 'MEDIUM', intensity: 2 });
        timeConsumed = 8;
    } 
    else if (newState.ballState === 'OUT_OF_BOUNDS') {
        newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: "Reanudación del juego.", importance: 'LOW', intensity: 1 });
        newState.ballState = 'IN_PLAY';
        const validReceivers = attPlayers.filter(p => p && SLOT_CONFIG[p.tacticalPosition || 0]?.line !== 'GK');
        const target = validReceivers.length > 0 ? validReceivers[randomInt(0, validReceivers.length-1)] : attPlayers[0];
        if (target) newState.possessorId = target.id;
        timeConsumed = 20;
    }
    else if (newState.ballState === 'CORNER') {
        slowMotion = true;
        const cornerAttTeamId = newState.possessionTeamId || actorClub.id;
        const cornerOffTeam = cornerAttTeamId === homeTeam.id ? homeTeam : awayTeam;
        const cornerDefTeam = cornerAttTeamId === homeTeam.id ? awayTeam : homeTeam;
        const cornerAttPlayers = cornerAttTeamId === homeTeam.id ? activeHome : activeAway;
        const cornerDefPlayers = cornerAttTeamId === homeTeam.id ? activeAway : activeHome;
        const cornerTeamStats = cornerAttTeamId === homeTeam.id ? newState.homeStats : newState.awayStats;
        cornerTeamStats.corners++;
        const cornerTaker = cornerAttPlayers.filter(p => p.stats.internal.pase >= 10).sort((a,b) => b.stats.internal.pase - a.stats.internal.pase)[0] || cornerAttPlayers[0];
        const headingTargets = cornerAttPlayers.filter(p => p.stats.internal.fuerza >= 10).sort((a,b) => (b.stats.internal.fuerza + b.stats.internal.fuerza) - (a.stats.internal.fuerza + a.stats.internal.fuerza));
        const attacker = headingTargets.length > 0 ? headingTargets[randomInt(0, Math.min(2, headingTargets.length-1))] : cornerAttPlayers[0];
        const defHeader = cornerDefPlayers.filter(p => p.stats.internal.fuerza >= 10).sort((a,b) => b.stats.internal.fuerza - a.stats.internal.fuerza)[0] || cornerDefPlayers[0];

        const cornerQuality = this.getEffectiveAttribute(cornerTaker, newState.playerStats, 'technical', 'corners') + (Math.random() * 6 - 3);
        const attackHeader = this.getEffectiveAttribute(attacker, newState.playerStats, 'technical', 'heading') + this.getEffectiveAttribute(attacker, newState.playerStats, 'physical', 'jumpingReach') * 0.5;
        const defHeaderQuality = this.getEffectiveAttribute(defHeader, newState.playerStats, 'technical', 'heading') + this.getEffectiveAttribute(defHeader, newState.playerStats, 'mental', 'positioning') * 0.4;

        if (cornerQuality + attackHeader > defHeaderQuality + 8 && Math.random() < 0.15) {
            const gk = cornerDefPlayers.find(p => p.positions.includes(Position.GK)) || cornerDefPlayers[0];
            this.scoreGoal(newState, attacker, gk, newState.possessionTeamId === homeTeam.id, "Gol de cabeza", `${this.getPlayerLabel(attacker, cornerOffTeam)} gana en el salto y bate al portero de cabeza.`, cornerOffTeam);
        } else {
            newState.events.push({ minute: state.minute, second: state.second, type: 'CORNER', text: `${this.getPlayerLabel(cornerTaker, cornerOffTeam)} lanza el córner. ${cornerQuality > 10 ? 'Buen centro al área.' : 'El centro no encuentra destinatario.'}`, teamId: cornerOffTeam.id, importance: 'MEDIUM', intensity: 2 });
            newState.ballState = 'IN_PLAY';
            const clearTarget = cornerDefPlayers.filter(p => SLOT_CONFIG[p.tacticalPosition || 0]?.line !== 'GK');
            if (clearTarget.length > 0) newState.possessorId = clearTarget[randomInt(0, clearTarget.length-1)]?.id || null;
            else newState.possessorId = cornerDefPlayers[0]?.id || null;
        }
        timeConsumed = 20;
    }
    else if (newState.ballState === 'FREE_KICK') {
        slowMotion = true;
        const fkOffTeam = newState.possessionTeamId === homeTeam.id ? homeTeam : awayTeam;
        const fkDefTeam = newState.possessionTeamId === homeTeam.id ? awayTeam : homeTeam;
        const fkAttPlayers = newState.possessionTeamId === homeTeam.id ? activeHome : activeAway;
        const fkDefPlayers = newState.possessionTeamId === homeTeam.id ? activeAway : activeHome;
        const kickTaker = fkAttPlayers.filter(p => p.stats.internal.disparo >= 10).sort((a,b) => b.stats.internal.disparo - a.stats.internal.disparo)[0] || fkAttPlayers[0];
        const fkSkill = this.getEffectiveAttribute(kickTaker, newState.playerStats, 'technical', 'freeKickTaking');
        const technique = this.getEffectiveAttribute(kickTaker, newState.playerStats, 'technical', 'technique');
        const gk = fkDefPlayers.find(p => p.positions.includes(Position.GK)) || fkDefPlayers[0];
        const reflexes = this.getEffectiveAttribute(gk, newState.playerStats, 'goalkeeping', 'reflexes');

        const fkQuality = (fkSkill * 0.7 + technique * 0.3) + (Math.random() * 8 - 4);
        const saveQuality = reflexes * (0.8 + Math.random() * 0.4);

        if (fkQuality > saveQuality + 5 && Math.random() < 0.12) {
            this.scoreGoal(newState, kickTaker, gk, newState.possessionTeamId === homeTeam.id, "Gol de tiro libre", `${this.getPlayerLabel(kickTaker, fkOffTeam)} clava la falta en la escuadra. ¡Golazo!`, fkOffTeam);
        } else if (fkQuality > saveQuality - 1) {
            newState.playerStats[gk.id].saves++;
            newState.events.push({ minute: state.minute, second: state.second, type: 'SAVE', text: `${this.getPlayerLabel(gk, fkDefTeam)} desvía el tiro libre de ${this.getPlayerLabel(kickTaker, fkOffTeam)}.`, teamId: gk.clubId, importance: 'HIGH', intensity: 4 });
            newState.possessorId = gk.id;
            newState.ballState = 'IN_PLAY';
        } else {
            const missTexts = ["Tiro libre directo desviado", "La barrera despeja", "Se fue por encima del larguero"];
            newState.events.push({ minute: state.minute, second: state.second, type: 'FREE_KICK', text: `${missTexts[randomInt(0, 2)]} de ${this.getPlayerLabel(kickTaker, fkOffTeam)}.`, teamId: fkOffTeam.id, importance: 'MEDIUM', intensity: 2 });
            newState.ballState = 'OUT_OF_BOUNDS';
            newState.possessorId = null;
        }
        timeConsumed = 25;
    }
    else if (newState.ballState === 'IN_PLAY') {
        if (!actor) {
            const available = activeOnPitch.filter(Boolean);
            const winner = available.map(p => ({ 
                player: p, 
                score: (this.getEffectiveAttribute(p, newState.playerStats, 'mental', 'anticipation') + 
                        this.getEffectiveAttribute(p, newState.playerStats, 'physical', 'acceleration') * 0.5) * 
                        (0.6 + Math.random()) * this.getProximityWeight(p, ballX, ballY, p.clubId === homeTeam.id) 
            })).sort((a,b) => b.score - a.score)[0].player;
            
            newState.possessorId = winner.id; 
            newState.possessionTeamId = winner.clubId;
            timeConsumed = 10;
        } else {
            const decisions = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'decisions');
            const flair = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'flair');
            const actorRole = SLOT_CONFIG[actor.tacticalPosition || 0]?.line;
            const isActorGK = actorRole === 'GK';
            
            let action: 'SHOOT' | 'DRIBBLE' | 'PASS' | 'CLEAR' = 'PASS';
            const rollDecision = Math.random() * 20;

            const mentality = tactic?.mentality ?? 10;
            const shootThreshold = distToGoal < (160 + mentality * 3) && rollDecision < (decisions * (0.4 + mentality * 0.025));
            const dribbleThreshold = distToGoal < (250 + mentality * 2) && rollDecision < (flair * (0.25 + mentality * 0.015));

            if (isBallInAttackingThird && !isActorGK) {
                if (shootThreshold) action = 'SHOOT';
                else if (dribbleThreshold) action = 'DRIBBLE';
            } else if (distToGoal > 800 && (rollDecision > 16 || isActorGK)) {
                action = 'CLEAR';
            }

            const closingDown = tactic?.closingDown ?? 10;
            const widthSetting = tactic?.width ?? 10;
            const pressure = this.calculatePressure(actor, defPlayers, ballX, ballY, newState.playerStats, isHomeActor, closingDown);
            const composure = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'composure');
            const pressurePenalty = Math.max(0, (pressure - (composure * 0.8)) / 4); 

            const nearbyDefData = defPlayers.map(p => ({ 
                player: p, 
                dist: Math.sqrt(Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).x - ballX, 2) + Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).y - ballY, 2)) 
            })).sort((a,b) => a.dist - b.dist)[0];
            const nearbyDef = nearbyDefData.player;

            if (action === 'SHOOT') {
                slowMotion = true;
                const finishing = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'finishing');
                const technique = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'technique');
                
                const shootBonus = (mentality - 10) * 0.3;
                const shootingQuality = (finishing * 0.7 + technique * 0.3) - (pressurePenalty * 2.2) + (Math.random() * 8 - 4) + shootBonus;
                
                const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
                const reflexes = this.getEffectiveAttribute(gk, newState.playerStats, 'goalkeeping', 'reflexes');
                const positionGk = this.getEffectiveAttribute(gk, newState.playerStats, 'mental', 'positioning');
                const saveQuality = (reflexes * 0.8 + positionGk * 0.2) * (0.9 + Math.random() * 0.4);

                newState.playerStats[actor.id].shots++;
                currentTeamStats.shots++; 

                if (shootingQuality > saveQuality + 4.2) {
                    currentTeamStats.shotsOnTarget++;
                    const goalTexts = ["Remate inapelable.", "Ajustado al palo.", "Fusiló al portero.", "Cabezazo magistral.", "Definición de crack.", "No pudo hacer nada el arquero."];
                    this.scoreGoal(newState, actor, gk, isHomeActor, "Gol", goalTexts[randomInt(0, goalTexts.length-1)], actorClub);
                } else if (shootingQuality > saveQuality - 1) {
                    currentTeamStats.shotsOnTarget++;
                    newState.playerStats[gk.id].saves++;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'SAVE', text: `${this.getPlayerLabel(gk, defClub)} evita el tanto de ${this.getPlayerLabel(actor, actorClub)}.`, teamId: gk.clubId, importance: 'HIGH', intensity: 4 });
                    newState.possessorId = gk.id;
                } else {
                    const missTexts = ["Disparo desviado", "Se le fue a las nubes", "Remate fuera", "Impactó en el lateral de la red"];
                    newState.events.push({ minute: state.minute, second: state.second, type: 'MISS', text: `${missTexts[randomInt(0, missTexts.length-1)]} de ${this.getPlayerLabel(actor, actorClub)}.`, teamId: actor.clubId, importance: 'MEDIUM', intensity: 2 });
                    if (isBallInAttackingThird && Math.random() < 0.7) {
                      newState.ballState = 'CORNER';
                      newState.possessionTeamId = actor.clubId;
                      newState.possessorId = null;
                    } else {
                      newState.ballState = 'OUT_OF_BOUNDS'; newState.possessorId = null;
                    }
                }
                timeConsumed = 30;
            } 
            else if (action === 'DRIBBLE') {
                const dribbling = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'dribbling');
                const technique = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'technique');
                const tackling = this.getEffectiveAttribute(nearbyDef, newState.playerStats, 'technical', 'tackling');
                
                const dribbleDifficulty = (isBallInAttackingThird ? 1.3 : 1.0) + (pressure / 25);

                if ((dribbling * 0.5 + technique * 0.5) - (pressurePenalty * 1.5) > (tackling * dribbleDifficulty)) {
                    newState.playerStats[actor.id].dribblesCompleted++;
                    this.moveBall(newState, isHomeActor, 120, 40, widthSetting);
                    newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} supera la marca de ${this.getPlayerLabel(nearbyDef, defClub)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 2 });
                } else {
                    newState.possessorId = nearbyDef.id;
                    newState.playerStats[nearbyDef.id].tacklesCompleted++;
                    const foulRoll = Math.random();
                    const tacklingAttr = this.getEffectiveAttribute(nearbyDef, newState.playerStats, 'technical', 'tackling');
                    const aggression = this.getEffectiveAttribute(nearbyDef, newState.playerStats, 'mental', 'aggression');
                    const foulProb = Math.max(0.05, 0.3 - tacklingAttr * 0.015 + aggression * 0.02);

                    newState.playerStats[nearbyDef.id].foulsCommitted++;
                    newState.playerStats[actor.id].foulsReceived++;
                    currentTeamStats.fouls++;

                    if (foulRoll < foulProb) {
                        this.processFoul(newState, nearbyDef, actor, state.minute, state.second, isHomeActor ? homeTeam : awayTeam, isHomeActor ? awayTeam : homeTeam, tacklingAttr, aggression, ballX);
                        timeConsumed = 25;
                    } else {
                        newState.events.push({ minute: state.minute, second: state.second, type: 'TACKLE', text: `${this.getPlayerLabel(nearbyDef, defClub)} le quita limpiamente el balón a ${this.getPlayerLabel(actor, actorClub)}.`, teamId: nearbyDef.clubId, importance: 'MEDIUM', intensity: 3 });
                        timeConsumed = 15;
                    }

                    this.checkInjury(newState, nearbyDef, actor, state.minute, state.second, isHomeActor ? homeTeam : awayTeam);
                }
            }
            else if (action === 'CLEAR') {
                this.moveBall(newState, isHomeActor, 400, 180, widthSetting);
                const clearMsgs = ["revienta el balón", "despeja el peligro", "aleja la pelota", "manda el balón arriba"];
                newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} ${clearMsgs[randomInt(0,3)]}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                newState.possessorId = null;
                timeConsumed = 12;
            }
            else { 
                const passing = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'passing');
                const vision = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'vision');
                const firstTouch = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'firstTouch');
                
                if (firstTouch < 10 && Math.random() < 0.1) {
                    const failMsgs = ["Mal control", "Control defectuoso", "El balón se le escapa"];
                    newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `${failMsgs[randomInt(0,2)]} de ${this.getPlayerLabel(actor, actorClub)}. Pierde la posesión.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                    newState.possessorId = nearbyDef.id;
                } else {
                    const passingStyle = tactic?.passingStyle ?? 10;
                    const directnessPenalty = (passingStyle - 10) * 0.15;
                    const passQuality = (passing * 0.7 + vision * 0.3) - (pressurePenalty * 1.2) - directnessPenalty;
                    let possibleReceivers = attPlayers.filter(p => p.id !== actor.id);
                    
                    const target = possibleReceivers.length > 0 ? possibleReceivers[randomInt(0, possibleReceivers.length-1)] : null;
                    const passBaseDifficulty = (isBallInAttackingThird ? 11 : 6) + Math.random() * 5; 
                    
                    if (target && passQuality > passBaseDifficulty) {
                        newState.playerStats[actor.id].passesAttempted++;
                        newState.playerStats[actor.id].passesCompleted++;
                        newState.possessorId = target.id;
                        this.moveBall(newState, isHomeActor, 110, 45, widthSetting);
                        if (isBallInAttackingThird || Math.random() > 0.75) {
                             newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} ${this.getRandomPassVerb(currentZone, isBallInAttackingThird)} ${this.getPlayerLabel(target, actorClub)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                        }
                    } else {
                        newState.playerStats[actor.id].passesAttempted++;
                        newState.possessorId = nearbyDef.id;
                        const interceptMsgs = ["interceptado por", "cortado por", "que regala a", "se queda corto ante"];
                        newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `Pase impreciso de ${this.getPlayerLabel(actor, actorClub)} ${interceptMsgs[randomInt(0,3)]} ${this.getPlayerLabel(nearbyDef, defClub)}.`, teamId: nearbyDef.clubId, importance: 'LOW', intensity: 1 });
                        if (tactic?.counterAttack) {
                          this.moveBall(newState, !isHomeActor, 150, 30, widthSetting);
                        }
                    }
                }
                const tempo = tactic?.tempo ?? 10;
                timeConsumed = Math.round(15 * (1.4 - tempo * 0.025));
            }
        }
    }

    const tempoMult = tactic?.tempo ? (1.25 - (tactic.tempo / 40)) : 1;
    activeOnPitch.forEach(p => {
        if (!p) return;
        const stats = newState.playerStats[p.id];
        if (stats && timeConsumed > 0) {
            stats.minutesPlayed += (timeConsumed / 60);
            const stamina = p.stats.internal.resistencia;
            const fatigueRate = 0.007 * (1.6 - stamina / 20) * tempoMult;
            stats.condition = Math.max(1, stats.condition - (timeConsumed * fatigueRate)); 
            this.updateRating(p, stats);
        }
    });

    if (newState.possessionTeamId) {
        if (newState.possessionTeamId === homeTeam.id) newState.homeStats.possessionTime += timeConsumed;
        else newState.awayStats.possessionTime += timeConsumed;
        const total = newState.homeStats.possessionTime + newState.awayStats.possessionTime;
        if (total > 0) { newState.homeStats.possession = Math.round((newState.homeStats.possessionTime / total) * 100); newState.awayStats.possession = 100 - newState.homeStats.possession; }
    }

    newState.second += timeConsumed;
    while (newState.second >= 60) { newState.second -= 60; newState.minute += 1; }

    if (newState.minute >= 45 && !newState.halftimeTriggered) { newState.isPlaying = false; newState.halftimeTriggered = true; newState.ballState = 'KICKOFF'; newState.events.push({ minute: 45, second: 0, type: 'WHISTLE', text: "DESCANSO", importance: 'MEDIUM', intensity: 2 }); }
    if (newState.minute >= 90) { newState.isPlaying = false; newState.ballState = 'FINISHED'; newState.events.push({ minute: 90, second: 0, type: 'WHISTLE', text: "FINAL DEL PARTIDO", importance: 'HIGH', intensity: 5 }); }

    return { nextState: newState, slowMotion };
  }

  private static processFoul(
    state: MatchState, fouler: Player, fouled: Player,
    minute: number, second: number,
    foulerClub: Club, fouledClub: Club,
    tackling: number, aggression: number,
    ballX: number
  ) {
    const severity = (20 - tackling) * 0.3 + aggression * 0.4 + Math.random() * 3;
    const isDangerZone = ballX > 750;

    let cardType: 'YELLOW' | 'RED' | null = null;
    let cardText = "";

    if (severity > 12 || (severity > 8 && isDangerZone)) {
      cardType = 'RED';
      cardText = `¡Tarjeta ROJA para ${this.getPlayerLabel(fouler, foulerClub)}! ${fouled ? this.getPlayerLabel(fouled, fouledClub) : 'El rival'} queda tendido.`;
      state.events.push({ minute, second, type: 'RED_CARD', text: cardText, teamId: fouler.clubId, playerId: fouler.id, importance: 'HIGH', intensity: 5 });
      state.playerStats[fouler.id].card = 'RED';
      state.playerStats[fouler.id].rating -= 2;
      fouler.suspension = { matchesLeft: 2 + (fouler.yellowCardsAccumulated >= 10 ? 1 : 0) };
      const teamStat = state[fouler.clubId === state.homeTeamId ? 'homeStats' : 'awayStats'];
      teamStat.redCards++;
    } else if (severity > 6 || (severity > 4 && isDangerZone)) {
      cardType = 'YELLOW';
      cardText = `Tarjeta AMARILLA para ${this.getPlayerLabel(fouler, foulerClub)}.`;
      state.events.push({ minute, second, type: 'YELLOW_CARD', text: cardText, teamId: fouler.clubId, playerId: fouler.id, importance: 'MEDIUM', intensity: 3 });
      state.playerStats[fouler.id].card = 'YELLOW';
      state.playerStats[fouler.id].rating -= 0.5;
      const teamStat = state[fouler.clubId === state.homeTeamId ? 'homeStats' : 'awayStats'];
      teamStat.yellowCards++;
      fouler.yellowCardsAccumulated++;

      if (fouler.yellowCardsAccumulated % 5 === 0) {
        fouler.suspension = { matchesLeft: 1 };
        state.events.push({ minute, second, type: 'YELLOW_CARD', text: `${this.getPlayerLabel(fouler, foulerClub)} acumula tarjetas y se perderá el próximo partido por suspensión.`, teamId: fouler.clubId, playerId: fouler.id, importance: 'MEDIUM', intensity: 2, isTechnical: true });
      }
    } else {
      const foulTexts = ["Falta clara", "Infracción", "Barrida peligrosa", "Entrada fuerte"];
      state.events.push({ minute, second, type: 'TACKLE', text: `${foulTexts[randomInt(0, 3)]} de ${this.getPlayerLabel(fouler, foulerClub)} sobre ${this.getPlayerLabel(fouled, fouledClub)}.`, teamId: fouler.clubId, importance: 'MEDIUM', intensity: 3 });
    }

    if (cardType === 'RED') {
      if (fouler.clubId === state.homeTeamId) {
        state.homeActiveIds = state.homeActiveIds.filter(id => id !== fouler.id);
      } else {
        state.awayActiveIds = state.awayActiveIds.filter(id => id !== fouler.id);
      }
      state.events.push({
        minute, second, type: 'SUBSTITUTION',
        text: `${foulerClub.shortName} se queda con 10 jugadores por la expulsión.`,
        teamId: fouler.clubId, importance: 'HIGH', intensity: 4
      });
    }

    state.ballState = (isDangerZone && ballX > 750) ? 'FREE_KICK' : 'OUT_OF_BOUNDS';
    state.possessorId = null;
    if (state.ballState === 'FREE_KICK') {
      state.possessionTeamId = fouledClub.id === state.homeTeamId ? state.homeTeamId : state.awayTeamId;
    }
  }

  private static checkInjury(
    state: MatchState, tackler: Player, ballCarrier: Player,
    minute: number, second: number, tacklerClub: Club
  ) {
    const bravery = this.getEffectiveAttribute(ballCarrier, state.playerStats, 'mental', 'bravery');
    const injuryProne = ballCarrier.injuryProneness || 0;
    const injuryChance = Math.max(0.005, 0.06 - bravery * 0.003 + injuryProne);

    if (Math.random() < injuryChance) {
      let days = randomInt(3, Math.round(7 + (20 - bravery) * 0.5));
      let injuryTypes = ["Distensión muscular", "Esguince de tobillo", "Golpe", "Sobrecarga", "Contractura"];
      const severeRoll = Math.random();
      if (severeRoll < 0.06) {
        days = randomInt(35, 90);
        injuryTypes = ["Rotura de ligamentos", "Fractura", "Rotura fibrilar grave", "Lesión grave de rodilla"];
      } else if (severeRoll < 0.18) {
        days = randomInt(20, 35);
        injuryTypes = ["Rotura fibrilar", "Esguince grave", "Lesión muscular"];
      }
      const injuryType = injuryTypes[randomInt(0, injuryTypes.length - 1)];

      state.playerStats[ballCarrier.id].sustainedInjury = { type: injuryType, days };
      state.playerStats[ballCarrier.id].severe = days > 30;
      state.events.push({
        minute, second, type: 'INJURY',
        text: `Se lesiona ${this.getPlayerLabel(ballCarrier, tacklerClub)}. ${injuryType}. Estará ${days} días de baja.`,
        teamId: ballCarrier.clubId, playerId: ballCarrier.id,
        importance: 'HIGH', intensity: 4
      });
    }
  }

  static processMatchInjuries(stats: Record<string, PlayerMatchStats>) {
    Object.entries(stats).forEach(([playerId, stat]) => {
      if (stat.sustainedInjury) {
        const player = world.players.find(p => p.id === playerId);
        if (player) {
          player.injury = { type: stat.sustainedInjury.type, daysLeft: stat.sustainedInjury.days };
          player.injuryHistory = player.injuryHistory || [];
          player.injuryHistory.push({
            type: stat.sustainedInjury.type,
            days: stat.sustainedInjury.days,
            date: new Date()
          });
          if (player.injuryHistory.length > 20) player.injuryHistory.shift();
          const recentCount = player.injuryHistory.length;
          const natFit = player.stats.internal.resistencia;
          player.injuryProneness = Math.max(0.005, Math.min(0.2, (recentCount * 0.015) + ((20 - natFit) * 0.015)));

if (stat.sustainedInjury.days > 30) {
             const club = world.getClub(player.clubId);
             if (club && club.id) {
               world.addInboxMessage(
                 'SQUAD',
                 `Lesión grave: ${player.name}`,
                 `Malas noticias: ${player.name} sufre ${stat.sustainedInjury.type} y estará de baja ${stat.sustainedInjury.days} días. Se perderá gran parte de la temporada.`,
                 new Date(),
                 player.id
               );
               sendInjuryNotification(player.name, stat.sustainedInjury.type, stat.sustainedInjury.days);
             }
           }
        }
      }
      if (stat.card === 'RED') {
        const player = world.players.find(p => p.id === playerId);
        if (player) {
          player.suspension = { matchesLeft: player.suspension?.matchesLeft || 1 };
        }
      }
    });
  }

  static finalizeSeasonStats(hS: Player[], aS: Player[], mS: Record<string, PlayerMatchStats>, h: number, a: number, cId: string) {
      const isCupMatch = ['UCL', 'UEL', 'UECL', 'COPA', 'EURO', 'AFCON', 'WC_Q', 'WC_FINAL', 'WCC'].includes(cId);
      const proc = (ps: Player[], ga: number) => ps.forEach(p => {
          const s = mS[p.id]; if(!s || s.minutesPlayed <= 0.1) return;
          if (isCupMatch && p.bigMatchTemperament > 14) {
            s.rating = Math.min(10, s.rating + (p.bigMatchTemperament - 14) * 0.15);
          }
          p.seasonStats.appearances++; p.seasonStats.goals += s.goals; p.seasonStats.assists += s.assists; p.seasonStats.conceded += ga; p.seasonStats.totalRating += s.rating;
          if(!p.statsByCompetition[cId]) p.statsByCompetition[cId] = { appearances:0, goals:0, assists:0, cleanSheets:0, conceded:0, totalRating:0 };
          const cs = p.statsByCompetition[cId]; cs.appearances++; cs.goals += s.goals; cs.assists += s.assists; cs.conceded += ga; cs.totalRating += s.rating;
          p.formRatings.push(s.rating);
          if (p.formRatings.length > 5) p.formRatings.shift();
      });
      proc(hS, a); proc(aS, h);
  }

  private static scoreGoal(state: MatchState, scorer: Player, gk: Player, isHome: boolean, title: string, desc: string, club: Club) {
      state.playerStats[scorer.id].goals++;
      state.playerStats[gk.id].conceded++;
      if (isHome) state.homeScore++; else state.awayScore++;
      state.events.push({ minute: state.minute, second: state.second, type: 'GOAL', text: `¡GOL de ${this.getPlayerLabel(scorer, club)}! ${desc}`, teamId: scorer.clubId, playerId: scorer.id, importance: 'HIGH', intensity: 5 });
      state.ballState = 'KICKOFF';
      state.possessorId = null;
  }

  private static moveBall(state: MatchState, isHome: boolean, dx: number, dy: number, width: number = 10) {
      const dir = isHome ? 1 : -1;
      const widthFactor = 0.5 + (width / 20);
      state.ballPosition.x = Math.max(5, Math.min(995, state.ballPosition.x + (dx * dir)));
      state.ballPosition.y = Math.max(5, Math.min(995, state.ballPosition.y + randomInt(-Math.round(dy * widthFactor), Math.round(dy * widthFactor))));
  }

  private static updateRating(p: Player, s: PlayerMatchStats) {
      if (s.minutesPlayed < 5) { s.rating = 6.0; return; }
      let score = 6.0;
      score += (s.goals || 0) * 1.6; score += (s.assists || 0) * 1.0; score += (s.saves || 0) * 0.5; score -= (s.conceded || 0) * 0.7;
      score += (s.tacklesCompleted || 0) * 0.2; score += (s.interceptions || 0) * 0.15;
      score -= (s.passesAttempted - s.passesCompleted) * 0.04;
      s.rating = Math.max(1, Math.min(10, score));
  }

   static simulateQuickMatch(homeId: string, awayId: string, squadType: string): { homeScore: number, awayScore: number, stats: Record<string, PlayerMatchStats> } {
       const hS = world.getPlayersByClub(homeId).filter(p => p.squad === squadType);
       const aS = world.getPlayersByClub(awayId).filter(p => p.squad === squadType);
       const hRep = world.getClub(homeId)?.reputation || 5000;
       const aRep = world.getClub(awayId)?.reputation || 5000;
       let hScore = 0, aScore = 0;
       const bias = (hRep - aRep) / 2500; 
       for(let i=0; i<3; i++) { 
         if (Math.random() + (bias * 0.05) > 0.93) hScore++; 
         if (Math.random() - (bias * 0.05) > 0.94) aScore++; 
       }
       const stats = this.initMatchStats([...hS, ...aS]);
       return { homeScore: hScore, awayScore: aScore, stats };
   }

   static simulateNationalTeamMatch(homeTeamId: string, awayTeamId: string): { homeScore: number, awayScore: number } {
       const homePlayers = world.getPlayersByNationalTeam(homeTeamId);
       const awayPlayers = world.getPlayersByNationalTeam(awayTeamId);

       const homeRep = world.nationalTeamManager?.nationalTeams.find((t: any) => t.id === homeTeamId)?.reputation || 7000;
       const awayRep = world.nationalTeamManager?.nationalTeams.find((t: any) => t.id === awayTeamId)?.reputation || 7000;

       const homeAvg = homePlayers.length > 0
          ? homePlayers.reduce((sum, p) => sum + p.currentAbility, 0) / homePlayers.length
          : 100;
       const awayAvg = awayPlayers.length > 0
          ? awayPlayers.reduce((sum, p) => sum + p.currentAbility, 0) / awayPlayers.length
          : 100;

       let homeScore = 0, awayScore = 0;
       const repBias = (homeRep - awayRep) / 2000;
       const abilityBias = (homeAvg - awayAvg) / 50;

       // Simulate ~90 minutes (3 phases)
       for (let i = 0; i < 3; i++) {
          if (Math.random() + repBias * 0.03 + abilityBias * 0.02 > 0.92) homeScore++;
          if (Math.random() - repBias * 0.03 - abilityBias * 0.02 > 0.93) awayScore++;
       }

       return { homeScore, awayScore };
   }
}
