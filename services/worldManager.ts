
import { Player, Club, Competition, Position, PlayerStats, PlayerMatchStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, TransferOffer, InboxMessage, MessageCategory, MediaNews, NotificationPriority, NewsSection, TacticalStyle, TacticSettings, MatchSettings, ScoutingReport, InteractionLogEntry, ReputationalBuff, Chronicle, ManagerProfile, ManagerOrigin, ClubHistoryEntry, RelationshipState, RealManager, ManagerNetworkEntry, PlayerPersonality, SeasonRecord, PLAYER_PERSONALITY_LABELS, PLAYER_PERSONALITY_DESC } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";
import { TACTIC_PRESETS, NAMES_DB, REGEN_DB, STAFF_NAMES, POS_DEFINITIONS, ARG_PRIMERA, ARG_NACIONAL, CONT_CLUBS, CONT_CLUBS_TIER2, WORLD_BOSSES, BRA_SERIE_A, BRA_SERIE_B, ESP_LA_LIGA, ITA_SERIE_A, DEU_BUNDESLIGA, FRA_LIGUE_1, PRT_LIGA, NLD_EREDIVISIE, MEX_LIGA_MX, USA_MLS, JPN_J1, ENG_PREMIER, CHI_PRIMERA, COL_LIGA, URY_PRIMERA, ECU_LIGA_PRO, PRY_DIVISION, BOL_DIVISION, VEN_LIGA, PER_LIGA1, PRY_DIVISION_B, DEU_2_BUNDESLIGA, FRA_LIGUE_2, ITA_SERIE_B, ENG_CHAMPIONSHIP, JPN_J2, KOR_K_LEAGUE, CHN_SUPER_LEAGUE, AUS_A_LEAGUE, EGY_PREMIER, MAR_BOTOLA, RSA_PSL, RealClubDef } from "../data/static";
import { REAL_PLAYERS_DB, RealPlayerDef } from "../data/realPlayers";
import { SLOT_CONFIG } from "./engine";
import { sendTransferNotification, sendInboxNotification, sendInjuryNotification } from "./notifications";
import { generatePlayer, generateRandomPlayer, getPlayerTag } from "./playerGenerator";
import { useGameStore } from "../stores/gameStore";
import { loadConvertedClubs, loadConvertedPlayers, loadConvertedLeagues } from "../data/convertedDataLoader";

// ─── Perfil táctico de los entrenadores generados ───────────────────────────
const COACH_STYLES = ['CONTROL', 'ATTACK', 'DEFENSE', 'COUNTER', 'BALANCED'] as const;
const COACH_FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-1-4-1', '4-4-1-1', '4-2-2-2'];
const COACH_PLAYING_STYLE: Record<string, string> = {
  CONTROL: 'Posesión y paciencia',
  ATTACK: 'Fútbol ofensivo y vertical',
  DEFENSE: 'Bloque bajo y orden defensivo',
  COUNTER: 'Contraataque veloz',
  BALANCED: 'Estilo equilibrado',
};

export class WorldManager {
  players: Player[] = [];
  clubs: Club[] = [];
  competitions: Competition[] = [];
  staff: Staff[] = [];
  tactics: Tactic[] = TACTIC_PRESETS.map(t => ({ ...t, settings: { ...t.settings } }));
  offers: TransferOffer[] = [];
  inbox: InboxMessage[] = [];
  mediaNews: MediaNews[] = [];
  matchSettings: MatchSettings = {
     pauseAtHalftime: true,
     speedMultiplier: 1
  };
  scoutingReports: ScoutingReport[] = [];
  interactionLog: InteractionLogEntry[] = [];
  activeReputationalBuffs: ReputationalBuff[] = [];
  relationshipWeb: Record<string, Record<string, { trust: number; respect: number; tension: number }>> = {};
  nationalTeamManager: any = null;
  chronicles: Chronicle[] = [];
  managerProfile: ManagerProfile | null = null;
  hallOfFame: import('../types').HallOfFameEntry[] = [];
  /** Libro de temporadas: archivo histórico consultable, un registro por temporada completada. */
  seasonHistory: SeasonRecord[] = [];

  // Caching for performance
  private clubByIdCache: Map<string, Club> = new Map();
  /** Índice persistente clubId → jugadores (reconstruido solo cuando algo muta) */
  private playersByClubIndex: Map<string, Player[]> | null = null;
  private playerByIdIndex: Map<string, Player> | null = null;
  private playersIndexDirty = true;
  private indexedPlayersCount = 0;

  constructor() { this.initWorld(); }

   initWorld() {
      this.seasonHistory = [];
      // Base competitions (only W_CLUB)
      this.competitions = [
        { id: "W_CLUB", name: "Mundial de Clubes", country: "Global", type: 'GLOBAL', tier: 1, continent: "Global", confederation: "FIFA", defaultPrizePool: 5000000 },
      ];

      // Load all clubs and players from open-football-database
      // This is called asynchronously after world is constructed
      this.loadConvertedData().catch(err => console.error('Failed to load converted data:', err));
    }

   // ─── Load from open-football-database converted data ──────────────────────
   async loadConvertedData() {
      const [CONVERTED_CLUBS, CONVERTED_PLAYERS, CONVERTED_LEAGUES] = await Promise.all([
        loadConvertedClubs(),
        loadConvertedPlayers(),
        loadConvertedLeagues(),
      ]);

      const posMap: Record<string, Position> = {
        'P': Position.GK, 'DFC': Position.DC, 'LIB': Position.SW,
        'LD': Position.DR, 'LI': Position.DL, 'CD': Position.DMR, 'CI': Position.DML,
        'MCD': Position.DM, 'MC': Position.MC, 'MD': Position.MR, 'MI': Position.ML,
        'MPC': Position.AM, 'ED': Position.AMR, 'EI': Position.AML,
        'DC': Position.ST, 'WD': Position.STR, 'WI': Position.STL
      };

      // 1. Load competitions from converted leagues
      for (const lg of CONVERTED_LEAGUES) {
         const continent = this.getContinentForCountry(lg.country);
         const confederation = this.getConfederationForContinent(continent);
         const isCrossYear = ['Inglaterra', 'España', 'Italia', 'Alemania', 'Francia', 'Portugal', 'Países Bajos', 'Bélgica'].includes(lg.country);
         this.competitions.push({
            id: lg.id,
            name: lg.name,
            country: lg.country,
            type: 'LEAGUE',
            tier: lg.tier,
            continent,
            confederation,
            defaultPrizePool: this.calculatePrizePool(lg.reputation, lg.tier),
            squadRegistrationLimit: 25,
            u21Requirement: 3,
            seasonStartMonth: isCrossYear ? 7 : 0,
            seasonEndMonth: isCrossYear ? 4 : 11,
         });
      }

      // 2. Add continental + global competitions
      this.addContinentalCompetitions();

      // 3. Load clubs
      for (const c of CONVERTED_CLUBS) {
         const club: Club = {
            id: String(c.id),
            name: c.name,
            shortName: c.shortName,
            leagueId: c.competitionId,
            country: c.country,
            primaryColor: this.hexToTailwind(c.primaryColor),
            secondaryColor: this.hexToTailwind(c.secondaryColor),
             finances: {
                balance: c.reputation * 2500,
                transferBudget: c.reputation * 800,
                wageBudget: c.reputation * 80,
                monthlyIncome: c.reputation * 200,
                monthlyExpenses: 0,
                scoutingBudget: c.reputation * 100,
                monthlyHistory: [],
             },
            reputation: c.reputation,
            stadium: `${c.name} Stadium`,
            stadiumCapacity: c.reputation >= 8000 ? 50000 : c.reputation >= 7000 ? 30000 : c.reputation >= 6000 ? 20000 : c.reputation >= 5000 ? 12000 : 8000,
            honours: this.generateRandomHonours(),
            trainingFacilities: Math.min(20, Math.floor(c.reputation / 500) + randomInt(-2, 2)),
            youthFacilities: Math.min(20, Math.floor(c.reputation / 55) + randomInt(-3, 3)),
            youthRecruitment: Math.min(20, Math.floor(c.reputation / 60) + randomInt(-2, 2)),
            scoutingRegion: (["ARG", "BRA", "URU", "CHL", "COL", "ECU", "PAR", "PER", "URY", "VEN", "BOL", "GLO"] as const)[randomInt(0, 11)],
            boardConfidence: 65 + randomInt(0, 25),
            seasonObjective: c.reputation > 4000 ? 'TOP_4' : c.reputation > 2500 ? 'TOP_HALF' : 'AVOID_RELEGATION',
            shortlistedPlayerIds: [],
            u21MinutesThisSeason: 0,
            records: { biggestVictory: null, biggestDefeat: null, longestWinStreak: 0, currentWinStreak: 0, highestScoringMatch: null, bestPlayerSeason: null },
         };
         this.clubs.push(club);
      }

      // 4. Load players (batch create for performance, deduplicate by ID)
      const seenPlayerIds = new Set<string>();
      for (const p of CONVERTED_PLAYERS) {
         if (seenPlayerIds.has(p.id)) continue;
         seenPlayerIds.add(p.id);
         const club = this.clubs.find(c => c.id === p.clubId);
         if (!club) continue;

         const primaryPos = posMap[p.primaryPosition] || Position.MC;
         const allPositions = p.positions.map((pp: string) => posMap[pp] || Position.MC).filter((pp: Position) => pp);

         const player: Player = {
            id: p.id,
            name: p.name,
            firstName: p.firstName,
            lastName: p.lastName,
            age: p.age,
            nationality: p.nationality,
            clubId: club.id,
            // Distribución por edades: el plantel se reparte entre SENIOR (23+), RESERVA (20-22) y SUB-20 (<=19)
            squad: p.age >= 23 ? 'SENIOR' : p.age >= 20 ? 'RESERVE' : 'U20',
            positions: allPositions,
            primaryPosition: primaryPos,
            stats: {
               internal: {
                  velocidad: p.stats.internal.velocidad || 10,
                  resistencia: p.stats.internal.resistencia || 10,
                  fuerza: p.stats.internal.fuerza || 10,
                  control: p.stats.internal.control || 10,
                  pase: p.stats.internal.pase || 10,
                  regate: p.stats.internal.regate || 10,
                  disparo: p.stats.internal.disparo || 10,
                  anticipacion: p.stats.internal.anticipacion || 10,
                  decision: p.stats.internal.decision || 10,
                  posicionamiento: p.stats.internal.posicionamiento || 10,
                  vision: p.stats.internal.vision || 10,
                  agresividad: p.stats.internal.agresividad || 10,
                  polivalencia: p.stats.internal.polivalencia || 10,
               },
               visible: {
                  fisico: p.stats.visible.fisico || 10,
                  mental: p.stats.visible.mental || 10,
                  tecnica: p.stats.visible.tecnica || 10,
                  agresividad: p.stats.visible.agresividad || 10,
                  polivalencia: p.stats.visible.polivalencia || 10,
               },
            },
            currentAbility: p.ca,
            potentialAbility: p.pa,
            value: p.value,
            salary: p.salary,
            contractExpiry: new Date(p.contractExpiry),
            fitness: 85 + randomInt(0, 15),
            morale: 60 + randomInt(0, 30),
            injury: null,
            developmentTrend: 'STABLE',
            history: [],
            relationships: {},
            secondaryPositions: [],
            isStarter: false,
            loyalty: randomInt(10, 20),
            negotiationAttempts: 0,
            isUnhappyWithContract: false,
            yellowCardsAccumulated: 0,
            injuryHistory: [],
            injuryProneness: randomInt(1, 15),
            isTransferListed: false,
            transferStatus: 'NONE',
            releaseClause: p.value * 1.5,
            height: p.height,
            weight: p.weight,
            birthDate: new Date(p.birthDate),
            reputation: p.ca * 45,
            formRatings: [],
            tacticalFamiliarity: 50,
            leadership: randomInt(5, 20),
            consistency: randomInt(5, 20),
            bigMatchTemperament: randomInt(5, 20),
            seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 },
            careerStats: { totalApps: 0, totalGoals: 0, totalAssists: 0, totalCleanSheets: 0, clubsPlayedFor: [club.id] },
            statsByCompetition: {},
            personality: this.assignPlayerPersonality(randomInt(5, 20), randomInt(5, 20), p.stats.internal.agresividad || 10, p.stats.internal.decision || 10, p.stats.internal.vision || 10),
         };
         this.players.push(player);
      }

      // 5. Completar planteles de TODOS los clubes (SENIOR/RESERVA/SUB-20):
      //    antes se saltaba para clubes con >=14 jugadores y dejaba RESERVA/SUB-20 vacíos.
      for (const club of this.clubs) {
         this.generateSquadsForClub(club.id);
         this.generateStaffForClub(club.id);
         this.updateClubMonthlyExpenses(club.id);
      }

      // 6. Set transfer status
      this.players.forEach(p => {
         if (!p.relationships) p.relationships = {};
         if (Math.random() < 0.08) {
            if (p.age < 22 && p.currentAbility < 120 && p.potentialAbility > 140) p.transferStatus = 'LOANABLE';
            else if (p.age > 28) p.transferStatus = 'TRANSFERABLE';
         }
      });

      // 7. Assign players to national teams
      const { NationalTeamManager } = await import('./nationalTeamManager');
      this.nationalTeamManager = new NationalTeamManager();
      this.nationalTeamManager.assignPlayersToNationalTeams(this.players, this.clubs);

      console.log(`[WorldManager] Loaded ${this.clubs.length} clubs, ${this.players.length} players, ${this.competitions.length} competitions`);
   }

   private getContinentForCountry(country: string): string {
      const map: Record<string, string> = {
         'Argentina': 'América del Sur', 'Brasil': 'América del Sur', 'Uruguay': 'América del Sur',
         'Chile': 'América del Sur', 'Colombia': 'América del Sur', 'Paraguay': 'América del Sur',
         'Perú': 'América del Sur', 'Venezuela': 'América del Sur', 'Bolivia': 'América del Sur',
         'Ecuador': 'América del Sur',
         'Inglaterra': 'Europa', 'España': 'Europa', 'Italia': 'Europa', 'Alemania': 'Europa',
         'Francia': 'Europa', 'Portugal': 'Europa', 'Países Bajos': 'Europa', 'Bélgica': 'Europa',
         'Turquía': 'Europa', 'Rusia': 'Europa', 'Croacia': 'Europa', 'Grecia': 'Europa',
         'Austria': 'Europa', 'Suiza': 'Europa', 'Dinamarca': 'Europa', 'Suecia': 'Europa',
         'Noruega': 'Europa', 'Polonia': 'Europa', 'Ucrania': 'Europa',
         'USA': 'América del Norte', 'México': 'América del Norte',
         'Japón': 'Asia', 'Arabia Saudita': 'Asia',
         'Egipto': 'África', 'Marruecos': 'África', 'Sudáfrica': 'África',
         'Nigeria': 'África', 'Ghana': 'África', 'Camerún': 'África',
         'Costa de Marfil': 'África', 'Túnez': 'África', 'Senegal': 'África',
         'Corea del Sur': 'Asia', 'China': 'Asia', 'Australia': 'Oceanía',
      };
      return map[country] || 'Europa';
   }

   private getConfederationForContinent(continent: string): string {
      const map: Record<string, string> = {
         'América del Sur': 'CONMEBOL', 'Europa': 'UEFA', 'América del Norte': 'CONCACAF',
         'Asia': 'AFC', 'África': 'CAF', 'Global': 'FIFA',
      };
      return map[continent] || 'UEFA';
   }

   private calculatePrizePool(reputation: number, tier: number): number {
      if (tier === 1) return Math.max(1000000, reputation * 1500);
      return Math.max(500000, reputation * 800);
   }

   private hexToTailwind(hex: string): string {
      if (!hex || !hex.startsWith('#')) return 'bg-slate-500';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      if (r > 200 && g < 100 && b < 100) return 'bg-red-600';
      if (r > 200 && g > 200 && b < 100) return 'bg-yellow-400';
      if (r < 100 && g < 100 && b > 200) return 'bg-blue-800';
      if (r < 100 && g > 150 && b < 100) return 'bg-green-600';
      if (r > 200 && g > 200 && b > 200) return 'bg-white';
      if (r < 100 && g < 100 && b < 100) return 'bg-black';
      if (r > 150 && g < 100 && b < 100) return 'bg-red-700';
      if (r < 100 && g > 150 && b > 200) return 'bg-sky-500';
      return 'bg-slate-500';
}

  private addContinentalCompetitions() {
      // UEFA Champions League
      this.competitions.push(
         { id: 'UCL', name: 'UEFA Champions League', country: 'Europa', type: 'CONTINENTAL_ELITE', tier: 1, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 20000000, squadRegistrationLimit: 25, seasonStartMonth: 7, seasonEndMonth: 4 },
         { id: 'UEL', name: 'UEFA Europa League', country: 'Europa', type: 'CONTINENTAL_SMALL', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 8000000, squadRegistrationLimit: 25, seasonStartMonth: 7, seasonEndMonth: 4 },
         { id: 'UECL', name: 'UEFA Conference League', country: 'Europa', type: 'CONTINENTAL_SMALL', tier: 3, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 4000000, squadRegistrationLimit: 25, seasonStartMonth: 7, seasonEndMonth: 4 },
      );
       // Copa Libertadores + Sudamericana already exist in base
       // FIFA World Cup
       this.competitions.push(
          { id: 'WC_Q', name: 'Clasificación Mundial', country: 'Global', type: 'GLOBAL', tier: 1, continent: 'Global', confederation: 'FIFA', defaultPrizePool: 0, seasonStartMonth: 0, seasonEndMonth: 11 },
       );

       // National team competitions
       this.competitions.push(
          { id: 'COPA', name: 'Copa América', country: 'América del Sur', type: 'CONTINENTAL_ELITE', tier: 1, continent: 'América del Sur', confederation: 'CONMEBOL', defaultPrizePool: 10000000, seasonStartMonth: 5, seasonEndMonth: 7 },
          { id: 'EURO', name: 'UEFA Euro', country: 'Europa', type: 'CONTINENTAL_ELITE', tier: 1, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 15000000, seasonStartMonth: 5, seasonEndMonth: 7 },
          { id: 'AFCON', name: 'Africa Cup of Nations', country: 'África', type: 'CONTINENTAL_ELITE', tier: 1, continent: 'África', confederation: 'CAF', defaultPrizePool: 5000000, seasonStartMonth: 0, seasonEndMonth: 1 },
          { id: 'FRIENDLY', name: 'Amistosos de Pretemporada', country: 'Global', type: 'FRIENDLY', tier: 0, continent: 'Global', confederation: 'FIFA', defaultPrizePool: 0 },
       );

       // Domestic cups
       this.competitions.push(
          { id: 'COPA_REY', name: 'Copa del Rey', country: 'España', type: 'CUP', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 3000000, seasonStartMonth: 7, seasonEndMonth: 4 },
          { id: 'FA_CUP', name: 'FA Cup', country: 'Inglaterra', type: 'CUP', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 3500000, seasonStartMonth: 7, seasonEndMonth: 4 },
          { id: 'DFB_POKAL', name: 'DFB Pokal', country: 'Alemania', type: 'CUP', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 2500000, seasonStartMonth: 7, seasonEndMonth: 4 },
          { id: 'COPA_ITALIA', name: 'Coppa Italia', country: 'Italia', type: 'CUP', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 2500000, seasonStartMonth: 7, seasonEndMonth: 4 },
          { id: 'COPA_FRANCE', name: 'Coupe de France', country: 'Francia', type: 'CUP', tier: 2, continent: 'Europa', confederation: 'UEFA', defaultPrizePool: 2000000 },
          { id: 'COPA_LIB', name: 'Copa Libertadores', country: 'Sudamérica', type: 'CONTINENTAL_ELITE', tier: 1, continent: 'América del Sur', confederation: 'CONMEBOL', defaultPrizePool: 8000000 },
          { id: 'COPA_SUD', name: 'Copa Sudamericana', country: 'Sudamérica', type: 'CONTINENTAL_SMALL', tier: 2, continent: 'América del Sur', confederation: 'CONMEBOL', defaultPrizePool: 3000000 },
       );
       // AFC leagues (generated dynamically from static data)
       this.competitions.push(
          { id: 'L_KOR_1', name: 'K League 1', country: 'Corea del Sur', type: 'LEAGUE', tier: 1, continent: 'Asia', confederation: 'AFC', defaultPrizePool: 1500000, seasonStartMonth: 1, seasonEndMonth: 10 },
          { id: 'L_CHN_1', name: 'Chinese Super League', country: 'China', type: 'LEAGUE', tier: 1, continent: 'Asia', confederation: 'AFC', defaultPrizePool: 2000000, seasonStartMonth: 2, seasonEndMonth: 10 },
          { id: 'L_AUS_1', name: 'A-League', country: 'Australia', type: 'LEAGUE', tier: 1, continent: 'Oceanía', confederation: 'AFC', defaultPrizePool: 800000, seasonStartMonth: 9, seasonEndMonth: 4 },
       );
       try { this.loadRealClubs(KOR_K_LEAGUE, 'L_KOR_1'); } catch (e) { console.warn('[WorldManager] Failed to load K League 1:', e); }
       try { this.loadRealClubs(CHN_SUPER_LEAGUE, 'L_CHN_1'); } catch (e) { console.warn('[WorldManager] Failed to load Chinese Super League:', e); }
       try { this.loadRealClubs(AUS_A_LEAGUE, 'L_AUS_1'); } catch (e) { console.warn('[WorldManager] Failed to load A-League:', e); }
       // CAF leagues
       this.competitions.push(
          { id: 'L_EGY_1', name: 'Egyptian Premier League', country: 'Egipto', type: 'LEAGUE', tier: 1, continent: 'África', confederation: 'CAF', defaultPrizePool: 1000000, seasonStartMonth: 8, seasonEndMonth: 4 },
          { id: 'L_MAR_1', name: 'Botola Pro', country: 'Marruecos', type: 'LEAGUE', tier: 1, continent: 'África', confederation: 'CAF', defaultPrizePool: 800000, seasonStartMonth: 8, seasonEndMonth: 5 },
          { id: 'L_RSA_1', name: 'DStv Premiership', country: 'Sudáfrica', type: 'LEAGUE', tier: 1, continent: 'África', confederation: 'CAF', defaultPrizePool: 900000, seasonStartMonth: 7, seasonEndMonth: 4 },
       );
       try { this.loadRealClubs(EGY_PREMIER, 'L_EGY_1'); } catch (e) { console.warn('[WorldManager] Failed to load Egyptian PL:', e); }
       try { this.loadRealClubs(MAR_BOTOLA, 'L_MAR_1'); } catch (e) { console.warn('[WorldManager] Failed to load Botola Pro:', e); }
       try { this.loadRealClubs(RSA_PSL, 'L_RSA_1'); } catch (e) { console.warn('[WorldManager] Failed to load DStv Premiership:', e); }
       // Init team cohesion for all clubs
       this.clubs.forEach(c => { if (!c.teamCohesion) c.teamCohesion = 40 + randomInt(0, 30); });
       // Init dynamic reputations for all leagues
       this.competitions.filter(c => c.type === 'LEAGUE').forEach(c => {
         if (!c.dynamicReputation) c.dynamicReputation = this.getBaseLeagueRep(c);
         c.marketMultiplier = 0.5 + (c.dynamicReputation / 100) * 1.5;
       });
    }

  loadRealClubs(definitions: RealClubDef[], leagueId: string) {
     definitions.forEach(def => {
        const club: Club = {
           id: generateUUID(),
           name: def.name,
           shortName: def.short,
           leagueId: leagueId,
           country: def.country,
           primaryColor: def.pCol,
           secondaryColor: def.sCol,
             finances: {
                balance: def.rep * 2500,
                transferBudget: def.rep * 800,
                wageBudget: def.rep * 80,
                monthlyIncome: def.rep * 200,
                monthlyExpenses: 0,
                scoutingBudget: def.rep * 100,
                monthlyHistory: []
             },
            reputation: def.rep,
            stadium: def.stadium,
            stadiumCapacity: def.rep >= 8000 ? 50000 : def.rep >= 7000 ? 30000 : def.rep >= 6000 ? 20000 : def.rep >= 5000 ? 12000 : 8000,
            honours: this.generateRandomHonours(),
             trainingFacilities: Math.min(20, Math.floor(def.rep / 500) + randomInt(-2, 2)),
             youthFacilities: Math.min(20, Math.floor(def.rep / 55) + randomInt(-3, 3)),
             youthRecruitment: Math.min(20, Math.floor(def.rep / 60) + randomInt(-2, 2)),
              scoutingRegion: (["ARG", "BRA", "URU", "CHL", "COL", "ECU", "PAR", "PER", "URY", "VEN", "BOL", "GLO"] as const)[randomInt(0, 11)],
             boardConfidence: 65 + randomInt(0, 25),
              seasonObjective: def.rep > 4000 ? 'TOP_4' : def.rep > 2500 ? 'TOP_HALF' : 'AVOID_RELEGATION',
              shortlistedPlayerIds: [],
              u21MinutesThisSeason: 0,
              records: { biggestVictory: null, biggestDefeat: null, longestWinStreak: 0, currentWinStreak: 0, highestScoringMatch: null, bestPlayerSeason: null },
             teamCohesion: 40 + randomInt(0, 30),
          };
        this.clubs.push(club);
        this.injectRealPlayers(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
     });
  }

  /** Recompute team cohesion based on squad stability and player relationships */
  computeTeamCohesion(clubId: string) {
    const club = this.getClub(clubId);
    if (!club) return;
    const squad = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
    if (squad.length < 11) { club.teamCohesion = Math.max(10, (club.teamCohesion || 50) - 5); return; }
    // Factors: avg tactical familiarity, squad stability, cross-player relationships
    const avgFamiliarity = squad.reduce((s, p) => s + (p.tacticalFamiliarity || 50), 0) / squad.length;
    const stabilityBonus = Math.min(20, squad.filter(p => p.history && p.history.length > 0).length);
    club.teamCohesion = Math.max(0, Math.min(100, Math.round(avgFamiliarity * 0.6 + stabilityBonus * 0.4 + randomInt(-3, 3))));
  }

getClub(id: string) {
    const cached = this.clubByIdCache.get(id);
    if (cached) return cached;
    const club = this.clubs.find(c => c.id === id);
    if (club) this.clubByIdCache.set(id, club);
    return club;
  }
  private ensurePlayerIndices() {
    if (!this.playersIndexDirty && this.indexedPlayersCount === this.players.length) return;
    const byClub = new Map<string, Player[]>();
    const byId = new Map<string, Player>();
    for (const p of this.players) {
      byId.set(p.id, p);
      const arr = byClub.get(p.clubId);
      if (arr) arr.push(p); else byClub.set(p.clubId, [p]);
    }
    this.playersByClubIndex = byClub;
    this.playerByIdIndex = byId;
    this.playersIndexDirty = false;
    this.indexedPlayersCount = this.players.length;
  }

  /** Invalidate player indices after bulk mutations (e.g. loading a save). */
  markPlayersDirty() { this.playersIndexDirty = true; }

  getPlayer(id: string) {
    this.ensurePlayerIndices();
    return this.playerByIdIndex!.get(id);
  }
  /** Devuelve la misma instancia del array (bucket del índice): los callers NO deben mutarlo in-place. */
  getPlayersByClub(clubId: string) {
    this.ensurePlayerIndices();
    return this.playersByClubIndex!.get(clubId) || [];
  }
  /** Pre-fetch squads for multiple clubs at once — reduces O(n×m) to O(m) for fixture loops */
  preFetchSquads(clubIds: string[]): Map<string, Player[]> {
    const map = new Map<string, Player[]>();
    const uniqueIds = [...new Set(clubIds)];
    uniqueIds.forEach(id => map.set(id, this.getPlayersByClub(id)));
    return map;
  }
getStaffByClub(clubId: string) { return this.staff.filter(s => s.clubId === clubId); }
  getStaff(id: string) { return this.staff.find(s => s.id === id); }
  getManagerNetwork(userClubId?: string): ManagerNetworkEntry[] {
    return this.staff
      .filter(s => s.role === 'HEAD_COACH' && s.clubId && s.clubId !== userClubId)
      .map(manager => {
        const club = this.getClub(manager.clubId);
        const relationship = this.getRelationship('COACH', manager.id);
        return {
          managerId: manager.id,
          managerName: manager.name,
          clubId: manager.clubId,
          clubName: club?.name || 'Club desconocido',
          country: club?.country || manager.nationality,
          reputation: manager.reputation || 50,
          tacticalStyle: manager.tacticalStyle,
          relationship: { ...relationship },
        };
      })
      .sort((a, b) => b.reputation - a.reputation);
  }
  getLeagues() { return this.competitions.filter(c => c.type === 'LEAGUE'); }
  getTactics() { return this.tactics; }

  private invalidateClubCache(clubId: string) {
    this.clubByIdCache.delete(clubId);
    // Un jugador cambió de club (traspaso/cesión/contrato) → reconstruir índices de forma perezosa
    this.playersIndexDirty = true;
  }

   getPlayersByNationalTeam(teamId: string): Player[] {
      if (!this.nationalTeamManager) return [];
      const team = this.nationalTeamManager.nationalTeams.find((t: any) => t.id === teamId);
      if (!team) return [];
      return team.playerIds.map((pid: string) => this.getPlayer(pid)).filter(Boolean);
   }

   ensureRelationship(personA: string, personB: string) {
     if (!this.relationshipWeb[personA]) this.relationshipWeb[personA] = {};
     if (!this.relationshipWeb[personB]) this.relationshipWeb[personB] = {};
     if (!this.relationshipWeb[personA][personB]) this.relationshipWeb[personA][personB] = { trust: 50, respect: 50, tension: 0 };
     if (!this.relationshipWeb[personB][personA]) this.relationshipWeb[personB][personA] = { trust: 50, respect: 50, tension: 0 };
   }

   adjustRelationship(personA: string, personB: string, trust = 0, respect = 0, tension = 0) {
     this.ensureRelationship(personA, personB);
     const rel = this.relationshipWeb[personA][personB];
     rel.trust = Math.max(0, Math.min(100, rel.trust + trust));
     rel.respect = Math.max(0, Math.min(100, rel.respect + respect));
     rel.tension = Math.max(0, Math.min(100, rel.tension + tension));
   }

   getRelationship(personA: string, personB: string) {
     this.ensureRelationship(personA, personB);
     return this.relationshipWeb[personA][personB];
   }

   recordInteraction(entry: InteractionLogEntry) {
     this.interactionLog.push(entry);
     if (this.interactionLog.length > 300) this.interactionLog.shift();
   }

   addReputationalBuff(source: string, type: string, value: number, days = 30, date = new Date()) {
     this.activeReputationalBuffs.push({ id: generateUUID(), source, type, value, expiresAt: new Date(date.getTime() + days * 24 * 60 * 60 * 1000) });
   }

   getActiveBuffsFor(entityId: string) {
     const now = new Date();
     return this.activeReputationalBuffs.filter(b => b.source === entityId && b.expiresAt >= now);
   }

   decayRelationships() {
     Object.keys(this.relationshipWeb).forEach(a => {
       Object.keys(this.relationshipWeb[a]).forEach(b => {
         const rel = this.relationshipWeb[a][b];
         rel.trust = Math.max(0, rel.trust - 0.1);
         rel.respect = Math.max(0, rel.respect - 0.05);
         rel.tension = Math.max(0, rel.tension - 0.15);
       });
     });
   }

  updateClubMonthlyExpenses(clubId: string) {
    const club = this.getClub(clubId);
    if (!club) return;
    const players = this.getPlayersByClub(clubId);
    const staff = this.getStaffByClub(clubId);
    const totalSalaries = players.reduce((sum, p) => sum + p.salary, 0) + staff.reduce((sum, s) => sum + s.salary, 0);
    club.finances.monthlyExpenses = totalSalaries + (club.reputation * 10);
  }

  generateRandomHonours() {
    const honours = [];
    const possible = ["Liga Profesional", "Copa Argentina", "Supercopa", "Copa Libertadores", "Copa Sudamericana"];
    const count = randomInt(0, 5);
    for (let i = 0; i < count; i++) {
      honours.push({ name: possible[randomInt(0, possible.length - 1)], year: randomInt(1970, 2007) });
    }
    return honours.sort((a,b) => b.year - a.year);
  }

  injectRealPlayers(club: Club) {
     const dbPlayers = REAL_PLAYERS_DB.filter(p => p.clubShort === club.shortName);
     dbPlayers.forEach(def => {
        const player = this.createRealPlayer(club.id, def);
        this.players.push(player);
     });
  }

  createRealPlayer(clubId: string, def: RealPlayerDef): Player {
     const posMap: Record<string, Position> = {
        'GK': Position.GK, 'DC': Position.DC, 'DL': Position.DL, 'DR': Position.DR,
        'DM': Position.DM, 'MC': Position.MC, 'ML': Position.ML, 'MR': Position.MR,
        'AMC': Position.AM, 'AML': Position.AML, 'AMR': Position.AMR, 'ST': Position.ST,
        'WD': Position.STR, 'WI': Position.STL, 'P': Position.GK, 'DFC': Position.DC,
        'LD': Position.DR, 'LI': Position.DL
     };
     
     const primaryPos = posMap[def.position] || Position.MC;
     const age = def.age;
     const nationality = def.nationality || "Argentina";
     const qualityFactor = Math.max(0.5, Math.min(1.5, def.ca / 150));
     const player = generatePlayer(clubId, primaryPos, nationality, def.name, age, { qualityFactor, minAge: age, maxAge: age });
     player.photo = def.photo;
     player.currentAbility = def.ca;
     player.potentialAbility = def.pa;
     player.reputation = def.ca * 45;
     player.value = Math.round(def.ca * def.ca * 2500);
     player.salary = Math.round(def.ca * 2500 / 10) * 10;      player.developmentTrend = 'STABLE';
      player.personality = this.assignPlayerPersonality(player.leadership, player.loyalty, player.stats.internal.agresividad, player.stats.internal.decision, player.stats.internal.vision);
      return player;
   }

   generateSquadsForClub(clubId: string) {
    const squads: SquadType[] = ['SENIOR', 'RESERVE', 'U20'];
    squads.forEach(squadType => {
      const size = squadType === 'SENIOR' ? 24 : squadType === 'RESERVE' ? 20 : 18;
      const existing = this.getPlayersByClub(clubId).filter(p => p.squad === squadType);
      const needed = Math.max(0, size - existing.length);
      if (needed === 0) return;

      const squadStructure = [
          ...Array(Math.floor(needed*0.1)).fill('GK'), ...Array(Math.floor(needed*0.3)).fill('DEF'), 
          ...Array(Math.floor(needed*0.2)).fill('DM'), ...Array(Math.floor(needed*0.2)).fill('MID'), 
          ...Array(Math.floor(needed*0.2)).fill('ATT')
      ];
      
      squadStructure.forEach((roleType) => {
        let posPool: Position[] = roleType === 'GK' ? POS_DEFINITIONS.GK : roleType === 'DEF' ? POS_DEFINITIONS.DEF : roleType === 'DM' ? POS_DEFINITIONS.DM : roleType === 'MID' ? POS_DEFINITIONS.MID : POS_DEFINITIONS.ATT;
        const primaryPos = posPool[randomInt(0, posPool.length - 1)];
        let ageRange = squadType === 'U20' ? [15, 19] : squadType === 'RESERVE' ? [17, 25] : [18, 36];
        const player = this.createRandomPlayer(clubId, primaryPos, ageRange[0], ageRange[1]);
        player.squad = squadType;
        this.players.push(player);
        // Mantener el índice de jugadores por club consistente (el bucket es la misma referencia)
        this.playersByClubIndex?.get(clubId)?.push(player);
      });
    });
  }

  ensureDeepSquads(leagueId: string) {
    const clubs = this.getClubsByLeague(leagueId);
    clubs.forEach(club => {
      this.generateSquadsForClub(club.id);
      this.invalidateClubCache(club.id);
    });
  }

  generateStaffForClub(clubId: string) {
    const roles: StaffRole[] = ['HEAD_COACH', 'ASSISTANT_MANAGER', 'PHYSIO', 'FITNESS_COACH', 'RESERVE_MANAGER', 'YOUTH_MANAGER', 'SCOUT', 'SPORTING_DIRECTOR'];
    const club = this.getClub(clubId);
    const countryEconomy: Record<string, number> = {
      'Argentina': 0.6, 'Brasil': 0.8, 'Uruguay': 0.6, 'Chile': 0.7, 'Colombia': 0.65,
      'Inglaterra': 2.0, 'España': 1.8, 'Italia': 1.7, 'Alemania': 1.9, 'Francia': 1.8,
      'Portugal': 1.2, 'Países Bajos': 1.5, 'Bélgica': 1.3, 'Turquía': 1.0, 'Rusia': 0.9,
      'Croacia': 0.75, 'Grecia': 0.7, 'Austria': 1.5, 'Suiza': 1.6, 'Dinamarca': 1.3,
      'Suecia': 1.1, 'Noruega': 1.2, 'Polonia': 0.8, 'Ucrania': 0.6,
      'Estados Unidos': 2.2, 'México': 0.7, 'Japón': 1.6, 'China': 1.4, 'Arabia Saudita': 1.8,
      'Egipto': 0.7, 'Marruecos': 0.65, 'Sudáfrica': 0.8, 'Nigeria': 0.55,
      'Ghana': 0.5, 'Camerún': 0.45, 'Costa de Marfil': 0.45, 'Túnez': 0.6,
      'Senegal': 0.5,
      'Corea del Sur': 1.3, 'Australia': 1.2,
    };
    const economyMult = club ? (countryEconomy[club.country] || 0.8) : 0.8;

    roles.forEach(role => {
      const coachStyle = role === 'HEAD_COACH' ? COACH_STYLES[randomInt(0, COACH_STYLES.length - 1)] : undefined;
      const coachFormation = role === 'HEAD_COACH' ? COACH_FORMATIONS[randomInt(0, COACH_FORMATIONS.length - 1)] : undefined;
      const s: Staff = {
        id: generateUUID(), name: `${STAFF_NAMES.names[randomInt(0, STAFF_NAMES.names.length-1)]} ${STAFF_NAMES.surnames[randomInt(0, STAFF_NAMES.surnames.length-1)]}`,
        age: randomInt(35, 65), nationality: club?.country || "Argentina", role: role, clubId: clubId,
        attributes: {
          coaching: role === 'SPORTING_DIRECTOR' ? weightedRandom(4, 12) : weightedRandom(8, 20),
          judgingAbility: role === 'SCOUT' || role === 'SPORTING_DIRECTOR' ? weightedRandom(12, 20) : weightedRandom(8, 20),
          judgingPotential: role === 'SCOUT' || role === 'SPORTING_DIRECTOR' ? weightedRandom(12, 20) : weightedRandom(8, 20),
          tacticalKnowledge: weightedRandom(10, 20),
          adaptability: weightedRandom(5, 20),
          medical: role === 'PHYSIO' ? 18 : 5,
          physiotherapy: role === 'PHYSIO' ? 18 : 5,
          motivation: weightedRandom(8, 20),
          manManagement: role === 'SPORTING_DIRECTOR' ? weightedRandom(12, 20) : weightedRandom(8, 20),
        },
        salary: Math.round(randomInt(3000, 15000) * economyMult),
        contractExpiry: new Date(2010, 5, 30), history: [],
        personality: ['LEADER', 'PASSIONATE', 'CALM', 'DISCIPLINARIAN', 'VISIONARY'][randomInt(0, 4)],
        morale: 70,
        reputation: 50,
        relationships: {},
        pressReputation: 50,
        boardRelationship: 60,
        tacticalStyle: coachStyle,
        preferredFormation: coachFormation,
        playingStyle: coachStyle ? COACH_PLAYING_STYLE[coachStyle] : undefined,
        pressIntensity: role === 'HEAD_COACH' ? (['LOW', 'MEDIUM', 'HIGH'] as const)[randomInt(0, 2)] : undefined,
        possessionVsCounter: role === 'HEAD_COACH' ? (['POSSESSION', 'COUNTER', 'BALANCED'] as const)[randomInt(0, 2)] : undefined,
      };
      this.staff.push(s);
    });
  }

  createRandomPlayer(clubId: string, primaryPos: Position, minAge = 16, maxAge = 36, baseYear = 2008): Player {
    const club = this.getClub(clubId);
    let nat = club ? (Math.random() < 0.9 ? club.country : NATIONS[randomInt(0, NATIONS.length - 1)]) : "Argentina";
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
    const repBase = club ? club.reputation / 500 : 10;
    const qualityFactor = Math.max(0.3, Math.min(1.5, repBase / 15));
    const player = generatePlayer(clubId, primaryPos, nat, `${firstName} ${lastName}`, age, { qualityFactor });
    const ca = Math.max(40, Math.min(200, Math.round(qualityFactor * 100 + randomInt(-20, 20))));
    const pa = Math.min(200, ca + randomInt(0, 50));
    player.currentAbility = ca;
    player.potentialAbility = pa;
    player.reputation = ca * 40;
    player.value = Math.round(ca * ca * 2000);
    player.salary = Math.round(ca * 2000 / 12);
    player.releaseClause = Math.round(player.value * 3);
    player.agent = age >= 22 && Math.random() < 0.15 ? { name: `Agente ${lastName}`, commission: Math.round(5 + Math.random() * 10) } : undefined;
    player.personality = this.assignPlayerPersonality(player.leadership, player.loyalty, player.stats.internal.agresividad, player.stats.internal.decision, player.stats.internal.vision);
    return player;
  }
  /** Versión de fixtures: se incrementa cada vez que cambian resultados (invalida tablas cacheadas). */
  private fixturesVersion = 0;
  private leagueTableCache = new Map<string, { version: number; table: TableEntry[] }>();

  /**
   * Señaliza que los resultados de partidos cambiaron (invalida la caché de tablas).
   * INVARIANTE: TODA mutación de resultados (f.played/scores) DEBE llamar a este método,
   * o las tablas de posiciones quedarán obsoletas hasta el próximo avance.
   */
  bumpFixturesVersion() { this.fixturesVersion++; }

  getLeagueTable(compId: string, fixtures: Fixture[], squadType: SquadType, groupId?: number): TableEntry[] {
    const key = `${compId}|${squadType}|${groupId ?? ''}`;
    const cached = this.leagueTableCache.get(key);
    if (cached && cached.version === this.fixturesVersion) return [...cached.table];

    const table: Record<string, TableEntry> = {};
    
    // Fix: We must only initialize the table with clubs that are actually in the requested group
    const relevantFixtures = fixtures.filter(f => 
        f.competitionId === compId && 
        f.squadType === squadType && 
        (groupId === undefined || f.groupId === groupId)
    );

    const participantIds = new Set(relevantFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]));
    
    // Fallback for leagues that might not have any fixtures yet
    if (participantIds.size === 0 && groupId === undefined) {
        this.clubs.filter(c => c.leagueId === compId).forEach(c => participantIds.add(c.id));
    }

    const clubs = this.clubs.filter(c => participantIds.has(c.id));
    
    clubs.forEach(c => table[c.id] = { clubId: c.id, clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    
    relevantFixtures.filter(f => f.played).forEach(f => {
      const h = table[f.homeTeamId]; const a = table[f.awayTeamId];
      if (!h || !a) return;
      h.played++; a.played++; h.gf += f.homeScore!; h.ga += f.awayScore!; a.gf += f.awayScore!; a.ga += f.homeScore!;
      if (f.homeScore! > f.awayScore!) { h.won++; a.lost++; h.points += 3; }
      else if (f.homeScore! < f.awayScore!) { a.won++; h.lost++; a.points += 3; }
      else { h.drawn++; a.drawn++; h.points++; a.points++; }
    });
    
    const result = Object.values(table)
        .map(e => ({ ...e, gd: e.gf - e.ga }))
        .sort((a,b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    this.leagueTableCache.set(key, { version: this.fixturesVersion, table: result });
    return result;
  }

  getClubsByCompetition(compId: string, fixtures: Fixture[], groupId?: number): Club[] {
    const ids = new Set(fixtures.filter(f => f.competitionId === compId && (groupId === undefined || f.groupId === groupId)).flatMap(f => [f.homeTeamId, f.awayTeamId]));
    return this.clubs.filter(c => ids.has(c.id));
  }

  getClubsByLeague(leagueId: string) { return this.clubs.filter(c => c.leagueId === leagueId); }

  /** Recompute dynamic reputations for all leagues at end of season */
  updateLeagueReputations() {
    const leagues = this.competitions.filter(c => c.type === 'LEAGUE');
    leagues.forEach(league => {
      const clubs = this.getClubsByLeague(league.id);
      if (clubs.length === 0) { league.dynamicReputation = this.getBaseLeagueRep(league); return; }
      
      // Factor 1: Average reputation of clubs in the league
      const avgClubRep = clubs.reduce((s, c) => s + c.reputation, 0) / clubs.length;
      // Factor 2: Average CA of players in the league (proxy for quality)
      const allPlayers = clubs.flatMap(c => this.getPlayersByClub(c.id).filter(p => p.squad === 'SENIOR'));
      const avgCA = allPlayers.length > 0 ? allPlayers.reduce((s, p) => s + p.currentAbility, 0) / allPlayers.length : 100;
      // Factor 3: Continental performance bonus (clubs qualified for continental comps)
      const continentalBonus = clubs.filter(c => c.qualifiedFor && ['CONT_LIB', 'UCL', 'COPA_LIB'].includes(c.qualifiedFor)).length * 3;
      
      const rawScore = (avgClubRep / 100) * 0.5 + (avgCA / 2) * 0.3 + continentalBonus * 0.2;
      const baseRep = this.getBaseLeagueRep(league);
      // Smooth transition: 70% previous + 30% new score, then clamp
      const prevRep = league.dynamicReputation ?? baseRep;
      league.dynamicReputation = Math.max(10, Math.min(100, Math.round(prevRep * 0.7 + rawScore * 0.3)));
      league.marketMultiplier = 0.5 + (league.dynamicReputation / 100) * 1.5;
    });
  }

  private getBaseLeagueRep(league: Competition): number {
    const map: Record<string, number> = {
      'L_ENG_1': 92, 'L_ESP_1': 90, 'L_ITA_1': 85, 'L_DEU_1': 84, 'L_FRA_1': 78,
      'L_NLD_1': 70, 'L_PRT_1': 68, 'L_BEL_1': 58, 'L_TUR_1': 55,
      'L_BRA_1': 75, 'L_ARG_1': 72, 'L_URY_1': 48, 'L_CHI_1': 40, 'L_COL_1': 42,
      'L_MEX_1': 60, 'L_USA_1': 55, 'L_USA_2': 50,
      'L_JPN_1': 52, 'L_SAU_1': 48, 'L_KOR_1': 45, 'L_CHN_1': 38,
      'L_AUS_1': 32, 'L_EGY_1': 40, 'L_MAR_1': 35, 'L_RSA_1': 34,
    };
    return map[league.id] || 30;
  }

  getLeagueTier(rep: number): 'ELITE' | 'PRESTIGE' | 'DEVELOPING' | 'EMERGING' | 'LOCAL' {
    if (rep >= 80) return 'ELITE';
    if (rep >= 60) return 'PRESTIGE';
    if (rep >= 40) return 'DEVELOPING';
    if (rep >= 20) return 'EMERGING';
    return 'LOCAL';
  }

  getMarketMultiplier(leagueId: string): number {
    const league = this.competitions.find(c => c.id === leagueId);
    return league?.marketMultiplier ?? 1.0;
  }

  // ─── Pilar C: Personalidades y Drama ──────────────────────────────────────

  /** Assign personality based on player's hidden mental attributes */
  assignPlayerPersonality(leadership: number, loyalty: number, agresividad: number, decision: number, vision: number): PlayerPersonality {
    // LEADER: high leadership + high decision
    if (leadership >= 16 && decision >= 14) return 'LEADER';
    // MERCENARY: low loyalty + high vision (ambitious for money/fame)
    if (loyalty <= 7 && vision >= 14) return 'MERCENARY';
    // LOYAL: high loyalty + moderate decision
    if (loyalty >= 16) return 'LOYAL';
    // VOLATILE: high aggression + low decision
    if (agresividad >= 16 && decision <= 9) return 'VOLATILE';
    // LAZY: low decision + low aggression (no drive)
    if (decision <= 6 && agresividad <= 8) return 'LAZY';
    // AMBITIOUS: high vision + moderate/low loyalty
    if (vision >= 16 && loyalty <= 13) return 'AMBITIOUS';
    // PROFESSIONAL: high decision, moderate everything else
    if (decision >= 14) return 'PROFESSIONAL';
    // Fallback based on strongest signal
    const scores: [PlayerPersonality, number][] = [
      ['LEADER', leadership],
      ['LOYAL', loyalty],
      ['MERCENARY', 20 - loyalty],
      ['VOLATILE', agresividad],
      ['AMBITIOUS', vision],
      ['PROFESSIONAL', decision],
      ['LAZY', 20 - decision],
    ];
    scores.sort((a, b) => b[1] - a[1]);
    return scores[0][0];
  }

  /** Resolve personality labels for UI display */
  getPersonalityLabel(player: Player): string {
    if (!player.personality) return 'Equilibrado';
    return PLAYER_PERSONALITY_LABELS[player.personality] || 'Equilibrado';
  }

  /**
   * C2: Check dressing room conflicts based on clashing personalities.
   * Call daily for user's club; periodically for other DEEP clubs.
   */
  checkDressingRoomConflicts(clubId: string, date: Date) {
    const club = this.getClub(clubId);
    if (!club) return;

    const allSquad = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
    if (allSquad.length < 2) return;

    // Ensure all players have personality assigned (safety net for legacy saves)
    allSquad.forEach(p => {
      if (!p.personality) {
        p.personality = this.assignPlayerPersonality(p.leadership, p.loyalty, p.stats.internal.agresividad, p.stats.internal.decision, p.stats.internal.vision);
      }
    });

    // Personality clash matrix: pairs that naturally conflict
    const clashPairs: [PlayerPersonality, PlayerPersonality][] = [
      ['LEADER', 'VOLATILE'],
      ['LEADER', 'LAZY'],
      ['MERCENARY', 'LOYAL'],
      ['VOLATILE', 'PROFESSIONAL'],
      ['AMBITIOUS', 'LAZY'],
      ['MERCENARY', 'LEADER'],
    ];

    const captain = allSquad.find(p => p.leadership >= 15 && p.isStarter);

    for (let i = 0; i < allSquad.length; i++) {
      for (let j = i + 1; j < allSquad.length; j++) {
        const p1 = allSquad[i];
        const p2 = allSquad[j];
        if (!p1.personality || !p2.personality) continue;

        const isClash = clashPairs.some(
          ([a, b]) => (p1.personality === a && p2.personality === b) || (p1.personality === b && p2.personality === a)
        );
        if (!isClash) continue;

        // Accumulate tension
        if (!p1.playerTensions) p1.playerTensions = {};
        if (!p2.playerTensions) p2.playerTensions = {};
        p1.playerTensions[p2.id] = (p1.playerTensions[p2.id] || 0) + randomInt(1, 5);
        p2.playerTensions[p1.id] = (p2.playerTensions[p1.id] || 0) + randomInt(1, 5);

        const tension = Math.max(p1.playerTensions[p2.id] || 0, p2.playerTensions[p1.id] || 0);

        // Captain mediation
        if (captain && tension >= 40 && Math.random() < captain.leadership / 20) {
          p1.playerTensions[p2.id] = Math.max(0, (p1.playerTensions[p2.id] || 0) - 15);
          p2.playerTensions[p1.id] = Math.max(0, (p2.playerTensions[p1.id] || 0) - 15);
          if (tension >= 50) {
            this.addInboxMessage('SQUAD',
              `${captain.name} medió en el vestuario`,
              `El capitán ${captain.name} intervino para calmar la tensión entre ${p1.name} (${PLAYER_PERSONALITY_LABELS[p1.personality]}) y ${p2.name} (${PLAYER_PERSONALITY_LABELS[p2.personality]}).`,
              date, clubId);
          }
          continue;
        }

        // Escalation: notify coach
        if (tension >= 60 && tension < 80 && Math.random() < 0.3) {
          this.addInboxMessage('SQUAD',
            `Tensión en el vestuario: ${p1.name} vs ${p2.name}`,
            `Hay fricción creciente entre ${p1.name} (${PLAYER_PERSONALITY_LABELS[p1.personality!]}) y ${p2.name} (${PLAYER_PERSONALITY_LABELS[p2.personality!]}). El ambiente se resiente.`,
            date, clubId);
          club.teamCohesion = Math.max(10, (club.teamCohesion || 50) - 3);
        }

        // Boiling point: media leak
        if (tension >= 80 && Math.random() < 0.15) {
          p1.morale = Math.max(0, p1.morale - 10);
          p2.morale = Math.max(0, p2.morale - 10);
          club.teamCohesion = Math.max(0, (club.teamCohesion || 50) - 8);
          this.addInboxMessage('SQUAD',
            `🚨 Conflicto grave: ${p1.name} y ${p2.name}`,
            `La prensa ha filtrado una pelea entre ${p1.name} y ${p2.name} en el entrenamiento. La directiva está preocupada. Ambos jugadores han bajado su moral.`,
            date, clubId, 'CRITICAL');
          // Noticia de diario: crisis de vestuario en el club del usuario
          this.publishNews('TU_CLUB', {
            type: 'CRITICISM',
            headline: `Crisis en el vestuario de ${club.name}`,
            subheadline: `${p1.name} y ${p2.name} protagonizan un incidente`,
            body: `Fuentes internas confirman que la relación entre ${p1.name} (${PLAYER_PERSONALITY_LABELS[p1.personality!]}) y ${p2.name} (${PLAYER_PERSONALITY_LABELS[p2.personality!]}) es insostenible. El DT deberá tomar medidas.`,
            clubId,
          });
        }
      }
    }
  }

  /**
   * C3: Check if players want to request a transfer for narrative reasons.
   * Call daily per user club.
   */
  checkTransferRequestMotives(clubId: string, date: Date) {
    const club = this.getClub(clubId);
    if (!club) return;
    const players = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR' && !p.isTransferListed && !p.transferRequestReason);
    if (players.length === 0 || Math.random() > 0.03) return; // 3% daily chance

    const candidate = players[randomInt(0, players.length - 1)];
    if (!candidate.personality) return;

    const league = this.competitions.find(c => c.id === club.leagueId);
    const leagueRep = league?.dynamicReputation || 50;
    const motives: Record<PlayerPersonality, string[]> = {
      LEADER: ['Quiere competir por títulos importantes y siente que el club no está a la altura.', 'Busca un proyecto donde su liderazgo sea valorado con fichajes de nivel.'],
      MERCENARY: ['Recibió una oferta salarial que este club no puede igualar.', 'Su agente le ha conseguido un contrato mucho más lucrativo en otra liga.'],
      LOYAL: ['Su familia quiere regresar a su país de origen.', 'Problemas personales requieren que esté más cerca de casa.'],
      VOLATILE: ['No soporta más al cuerpo técnico y quiere un cambio de aires.', 'Siente que el DT lo tiene de punto y prefiere irse antes que seguir así.'],
      PROFESSIONAL: ['Considera que su ciclo en el club ha terminado y busca un nuevo desafío.', 'Quiere probarse en una liga más competitiva antes del final de su carrera.'],
      LAZY: ['No se siente motivado aquí. Cree que un cambio de entorno lo reactivaría.', 'Busca un club con menos exigencia donde pueda jugar sin presión.'],
      AMBITIOUS: ['Quiere jugar Champions League y este club no se la puede garantizar.', 'Aspira a un club más grande donde pueda ganar títulos y Balones de Oro.'],
    };

    const personalityMotives = motives[candidate.personality];
    const reason = personalityMotives[randomInt(0, personalityMotives.length - 1)];

    candidate.transferRequestReason = reason;
    candidate.isTransferListed = true;
    candidate.transferStatus = 'TRANSFERABLE';
    candidate.morale = Math.max(20, candidate.morale - 20);

    const label = PLAYER_PERSONALITY_LABELS[candidate.personality];
    this.addInboxMessage('SQUAD',
      `${candidate.name} pidió ser transferido`,
      `${candidate.name} (${label}) ha solicitado formalmente salir del club. Motivo: "${reason}"\n\nPuedes intentar convencerlo de quedarse o buscarle un destino.`,
      date, candidate.id, 'IMPORTANT', true);

    this.publishNews('MERCADO', {
      type: 'RUMOR',
      headline: `${candidate.name} quiere dejar ${club.name}`,
      subheadline: `El jugador habría pedido ser transferido`,
      body: `Según fuentes cercanas al jugador, ${candidate.name} comunicó su deseo de abandonar ${club.name}. El motivo principal: "${reason}"`,
      clubId, playerId: candidate.id,
    });
  }

  /**
   * C4: Generate random narrative events that add flavor to the daily cycle.
   * Low probability, high impact moments.
   */
  generateNarrativeEvents(clubId: string, date: Date) {
    const club = this.getClub(clubId);
    if (!club || Math.random() > 0.06) return; // 6% daily chance

    const squad = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
    if (squad.length < 5) return;

    const roll = Math.random();

    if (roll < 0.16) {
      // Youth asks for veteran's number
      const veteran = squad.find(p => p.age >= 30 && p.reputation >= 3000);
      const youth = squad.find(p => p.age <= 20 && p.potentialAbility >= 150);
      if (veteran && youth && youth.id !== veteran.id) {
        this.addInboxMessage('SQUAD',
          `${youth.name} quiere la dorsal de ${veteran.name}`,
          `El juvenil ${youth.name} ha expresado su deseo de heredar el número de ${veteran.name}, una leyenda del club. El vestuario está dividido: algunos creen que es una falta de respeto, otros ven ambición sana.`,
          date, clubId);
        youth.morale = Math.min(100, youth.morale + 5);
        veteran.morale = Math.max(0, veteran.morale - 5);
        if (!youth.playerTensions) youth.playerTensions = {};
        youth.playerTensions[veteran.id] = (youth.playerTensions[veteran.id] || 0) + 10;
      }
    } else if (roll < 0.32) {
      // Two stars argue over penalty
      const stars = squad.filter(p => p.currentAbility >= 150 && p.isStarter);
      if (stars.length >= 2) {
        const s1 = stars[randomInt(0, stars.length - 1)];
        let s2 = stars[randomInt(0, stars.length - 1)];
        while (s2.id === s1.id && stars.length > 1) s2 = stars[randomInt(0, stars.length - 1)];
        this.addInboxMessage('SQUAD',
          `¿Quién tira el penal? ${s1.name} vs ${s2.name}`,
          `${s1.name} y ${s2.name} discutieron acaloradamente sobre quién debería ser el lanzador de penaltis del equipo. Necesitas tomar una decisión antes del próximo partido.`,
          date, clubId);
        if (!s1.playerTensions) s1.playerTensions = {};
        if (!s2.playerTensions) s2.playerTensions = {};
        s1.playerTensions[s2.id] = (s1.playerTensions[s2.id] || 0) + 8;
        s2.playerTensions[s1.id] = (s2.playerTensions[s1.id] || 0) + 8;
      }
    } else if (roll < 0.46) {
      // Veteran mentors youth (positive event)
      const veteran = squad.find(p => p.age >= 31 && p.leadership >= 15);
      const youth = squad.find(p => p.age <= 21 && p.potentialAbility >= 140);
      if (veteran && youth && youth.id !== veteran.id) {
        youth.currentAbility = Math.min(youth.potentialAbility, youth.currentAbility + 1);
        youth.morale = Math.min(100, youth.morale + 10);
        veteran.morale = Math.min(100, veteran.morale + 5);
        club.teamCohesion = Math.min(100, (club.teamCohesion || 50) + 3);
        this.addInboxMessage('SQUAD',
          `${veteran.name} apadrina a ${youth.name}`,
          `El veterano ${veteran.name} ha tomado bajo su ala al joven ${youth.name}. Se los ve entrenando juntos y la química del equipo mejora. ${youth.name} ha ganado 1 punto de CA.`,
          date, clubId);
        this.publishNews('TU_CLUB', {
          type: 'PRAISE',
          headline: `${veteran.name}, el mentor de ${club.name}`,
          subheadline: `El veterano impulsa el desarrollo de ${youth.name}`,
          body: `En ${club.name} destacan la labor de ${veteran.name} como guía de las jóvenes promesas. ${youth.name} es el último beneficiado.`,
          clubId,
        });
      }
    } else if (roll < 0.58) {
      // Training injury
      const victim = squad[randomInt(0, squad.length - 1)];
      const days = randomInt(3, 21);
      const injuryTypes = ['esguince de tobillo', 'microrrotura fibrilar', 'contusión en el gemelo', 'sobrecarga muscular', 'golpe en la rodilla'];
      const injuryType = injuryTypes[randomInt(0, injuryTypes.length - 1)];
      victim.injury = {
        type: injuryType,
        daysLeft: days,
        totalDays: days,
        severity: days > 14 ? 'MODERATE' : 'MINOR',
        treatment: 'NONE',
        injuryDate: date,
        recoveryProgress: 0,
        relapseRisk: days > 14 ? 15 : 5,
        daysSinceInjury: 0,
      };
      victim.morale = Math.max(0, victim.morale - 10);
      this.addInboxMessage('SQUAD',
        `${victim.name} se lesiona en el entrenamiento`,
        `Malas noticias: ${victim.name} sufrió un ${injuryType} durante la sesión de hoy. Estará aproximadamente ${days} días de baja. El cuerpo médico recomienda precaución.`,
        date, clubId, 'IMPORTANT');
      this.publishNews('LESIONES', {
        type: 'CRITICISM',
        headline: `${victim.name}, baja sensible en ${club.name}`,
        subheadline: `Lesión en el entrenamiento: ${days} días de baja`,
        body: `${victim.name} se perderá los próximos partidos de ${club.name} tras sufrir un ${injuryType} en la sesión matinal. Una baja que complica los planes del entrenador.`,
        clubId, playerId: victim.id,
      });
      sendInjuryNotification(victim.name, injuryType, days);
    } else if (roll < 0.68) {
      // Romance / celebrity distraction
      const player = squad[randomInt(0, squad.length - 1)];
      const celebNames = ['una reconocida modelo', 'una cantante pop', 'una actriz de telenovelas', 'una influencer viral'];
      const celeb = celebNames[randomInt(0, celebNames.length - 1)];
      // Personality affects reaction
      const isDistracted = player.personality === 'MERCENARY' || player.personality === 'LAZY' || player.personality === 'VOLATILE';
      if (isDistracted) {
        player.morale = Math.min(100, player.morale + 8);
        player.fitness = Math.max(0, player.fitness - 5);
        this.addInboxMessage('STATEMENTS',
          `${player.name} en el ojo mediático`,
          `${player.name} ha sido vinculado sentimentalmente con ${celeb}. Las revistas del corazón no hablan de otra cosa. Su ánimo está por las nubes pero algunos temen que pierda el foco deportivo.`,
          date, clubId);
      } else {
        this.addInboxMessage('STATEMENTS',
          `Prensa rosa: ${player.name}`,
          `La prensa del corazón vincula a ${player.name} con ${celeb}. El jugador ha declarado que no afectará a su rendimiento y que está centrado en el fútbol.`,
          date, clubId);
      }
      this.publishNews('TU_CLUB', {
        type: 'RUMOR',
        headline: `¿${player.name} tiene nuevo amor?`,
        subheadline: `El jugador de ${club.name} en boca de todos`,
        body: `Las imágenes de ${player.name} con ${celeb} han dado la vuelta al mundo. En ${club.name} prefieren no hacer comentarios.`,
        clubId, playerId: player.id,
      });
    } else if (roll < 0.77) {
      // Conflict with board/directiva
      const star = squad.filter(p => p.reputation >= 5000 && p.isStarter)[0];
      if (star) {
        club.boardConfidence = Math.max(0, club.boardConfidence - 5);
        star.morale = Math.max(0, star.morale - 8);
        this.addInboxMessage('STATEMENTS',
          `${star.name} choca con la directiva`,
          `${star.name} ha tenido un encontronazo con la directiva por unas declaraciones sobre la política de fichajes del club. La afición está dividida: ¿apoyas al jugador o a la junta?`,
          date, clubId);
        this.publishNews('TU_CLUB', {
          type: 'HEADLINE',
          headline: `Terremoto en ${club.name}: ${star.name} carga contra la directiva`,
          subheadline: 'El vestuario, pendiente de la resolución del conflicto',
          body: `${star.name} no se mordió la lengua: "Este club merece más ambición". La directiva de ${club.name} estudia medidas disciplinarias mientras el entrenador intenta apaciguar los ánimos.`,
          clubId, playerId: star.id,
        });
      }
    } else if (roll < 0.86) {
      // Nightclub party leaked
      const partyGoer = squad[randomInt(0, squad.length - 1)];
      const nights = ['viernes', 'sábado'];
      const night = nights[randomInt(0, nights.length - 1)];
      partyGoer.fitness = Math.max(0, partyGoer.fitness - 10);
      partyGoer.morale = Math.max(0, partyGoer.morale - 5);
      club.teamCohesion = Math.max(0, (club.teamCohesion || 50) - 3);
      this.addInboxMessage('SQUAD',
        `Escándalo: ${partyGoer.name} en una fiesta nocturna`,
        `La prensa ha publicado fotos de ${partyGoer.name} saliendo de una discoteca a las 4 AM el ${night} por la noche, a 48 horas de un partido importante. El código disciplinario del club podría aplicarse. Su condición física se resiente.`,
        date, clubId);
      this.publishNews('TU_CLUB', {
        type: 'CRITICISM',
        headline: `${partyGoer.name}, cazado de fiesta a altas horas`,
        subheadline: 'El código disciplinario del club, en entredicho',
        body: `Exclusiva: ${partyGoer.name} fue fotografiado abandonando un conocido local nocturno en la madrugada del ${night}. En ${club.name} no ha sentado nada bien. El jugador se enfrenta a una posible sanción económica.`,
        clubId, playerId: partyGoer.id,
      });
    } else if (roll < 0.94) {
      // Bet between players (training challenge)
      const p1 = squad[randomInt(0, squad.length - 1)];
      let p2 = squad[randomInt(0, squad.length - 1)];
      while (p2.id === p1.id) p2 = squad[randomInt(0, squad.length - 1)];
      const betOutcome = Math.random() > 0.5;
      const winner = betOutcome ? p1 : p2;
      const loser = betOutcome ? p2 : p1;
      winner.morale = Math.min(100, winner.morale + 8);
      loser.morale = Math.max(0, loser.morale - 3);
      club.teamCohesion = Math.min(100, (club.teamCohesion || 50) + 2);
      this.addInboxMessage('SQUAD',
        `Apuesta entre ${p1.name} y ${p2.name}`,
        `${p1.name} y ${p2.name} hicieron una apuesta en el entrenamiento: quién mete más goles desde fuera del área. ${winner.name} ganó y se llevó los aplausos del grupo. Buen ambiente en el vestuario.`,
        date, clubId);
    } else {
      // Press amplifies minor squad friction
      this.publishNews('TU_CLUB', {
        type: 'RUMOR',
        headline: `¿Hay mal ambiente en ${club.name}?`,
        subheadline: 'La prensa especula sobre la química del plantel',
        body: `Varios medios señalan que no todo es armonía en el vestuario de ${club.name}. Fuentes anónimas hablan de pequeños roces que podrían escalar si no se gestionan.`,
        clubId,
      });
    }
  }

  // ─── Injury Treatment System ────────────────────────────────────────────

  /** Set a treatment plan for an injured player */
  setInjuryTreatment(playerId: string, treatment: 'CONSERVATIVE' | 'AGGRESSIVE', date: Date) {
    const player = this.getPlayer(playerId);
    if (!player || !player.injury) return;

    player.injury.treatment = treatment;
    // Recalculate progress based on days already healed vs remaining
    const daysHealed = player.injury.daysSinceInjury;
    player.injury.recoveryProgress = Math.min(99, Math.round((daysHealed / (daysHealed + player.injury.daysLeft)) * 100));

    if (treatment === 'CONSERVATIVE') {
      player.injury.relapseRisk = Math.max(0, player.injury.relapseRisk - 20);
      player.morale = Math.max(0, player.morale - 3);
      this.addInboxMessage('SQUAD',
        `Tratamiento conservador: ${player.name}`,
        `${player.name} seguirá un plan de recuperación conservador. Es más lento (~30% más) pero minimiza el riesgo de recaída. Días restantes estimados: ~${Math.round(player.injury.daysLeft * 1.3)}.`,
        date, playerId);
    } else {
      player.injury.relapseRisk = Math.min(100, player.injury.relapseRisk + 25);
      player.morale = Math.min(100, player.morale + 5);
      this.addInboxMessage('SQUAD',
        `Tratamiento agresivo: ${player.name}`,
        `${player.name} seguirá un plan de recuperación intensivo. Vuelve antes (~40% más rápido) pero con mayor riesgo de recaída.`,
        date, playerId);
    }
  }

  /** Get a human-readable injury report for UI */
  getInjuryReport(playerId: string): string | null {
    const player = this.getPlayer(playerId);
    if (!player || !player.injury) return null;

    const i = player.injury;
    const severityLabel: Record<string, string> = {
      MINOR: 'Leve', MODERATE: 'Moderada', SERIOUS: 'Grave', SEVERE: 'Muy Grave',
    };
    const treatmentLabel = i.treatment === 'CONSERVATIVE' ? 'Conservador' : i.treatment === 'AGGRESSIVE' ? 'Agresivo' : 'Sin definir';
    const progressBar = '█'.repeat(Math.floor(i.recoveryProgress / 10)) + '░'.repeat(10 - Math.floor(i.recoveryProgress / 10));

    return `📋 Parte médico: ${player.name}
━━━━━━━━━━━━━━━━━━━━
Lesión: ${i.type}
Gravedad: ${severityLabel[i.severity] || i.severity}
Tratamiento: ${treatmentLabel}
Progreso: [${progressBar}] ${Math.round(i.recoveryProgress)}%
Días restantes: ~${i.daysLeft}
Riesgo de recaída: ${Math.round(i.relapseRisk)}%
Días desde la lesión: ${i.daysSinceInjury}`;
  }

  // ─── End Injury Treatment ────────────────────────────────────────────────

  // ─── End Pilar C ──────────────────────────────────────────────────────────

  /**
   * Generate 3-5 preseason friendly fixtures for a club before its league starts.
   * Opponents are clubs of similar reputation from different leagues.
   */
  generatePreseasonFriendlies(clubId: string, seasonStart: Date): Fixture[] {
    const club = this.getClub(clubId);
    if (!club) return [];

    const league = this.competitions.find(c => c.id === club.leagueId);
    const leagueStartMonth = league?.seasonStartMonth ?? 0;

    const count = 3 + randomInt(0, 2); // 3-5 friendlies
    const fixtures: Fixture[] = [];

    // Find suitable opponents: similar reputation (±30%), different league, different country preferred
    const repRange = club.reputation * 0.3;
    const candidates = this.clubs
      .filter(c =>
        c.id !== clubId &&
        c.leagueId !== club.leagueId &&
        Math.abs(c.reputation - club.reputation) <= repRange
      )
      .sort((a, b) => b.reputation - a.reputation);

    if (candidates.length < count) {
      // Relax criteria: allow same country, wider rep range
      const fallback = this.clubs
        .filter(c => c.id !== clubId && c.leagueId !== club.leagueId)
        .sort((a, b) => Math.abs(a.reputation - club.reputation) - Math.abs(b.reputation - club.reputation));
      for (const c of fallback) {
        if (!candidates.includes(c)) candidates.push(c);
        if (candidates.length >= count) break;
      }
    }

    if (candidates.length === 0) return [];

    // Space friendlies across 3 weeks before season starts
    const firstFriendlyDate = new Date(seasonStart);
    firstFriendlyDate.setDate(firstFriendlyDate.getDate() - 21);

    // Pick count opponents
    const selected = candidates.slice(0, Math.min(count, candidates.length));

    for (let i = 0; i < selected.length; i++) {
      const matchDate = new Date(firstFriendlyDate);
      matchDate.setDate(matchDate.getDate() + i * 4 + randomInt(0, 2)); // every ~4 days

      const isHome = i % 2 === 0; // alternate home/away
      fixtures.push({
        id: generateUUID(),
        competitionId: 'FRIENDLY',
        homeTeamId: isHome ? clubId : selected[i].id,
        awayTeamId: isHome ? selected[i].id : clubId,
        date: matchDate,
        played: false,
        squadType: 'SENIOR',
        stage: 'REGULAR',
      });
    }

    // Notify user
    this.addInboxMessage('COMPETITION',
      'Pretemporada: amistosos programados',
      `Se han programado ${fixtures.length} partidos amistosos de pretemporada para ${club.name}. Los rivales son:\n${selected.map((c, i) => `${i + 1}. ${c.name} (${c.country}) — ${fixtures[i].date.toLocaleDateString('es-ES')} (${fixtures[i].homeTeamId === clubId ? 'Local' : 'Visitante'})`).join('\n')}\n\nLos amistosos no afectan la tabla ni generan sanciones. Sirven para ganar forma física, probar tácticas y mejorar la química del equipo.`,
      fixtures[0].date);

    return fixtures;
  }

  // ─── End Pretemporada ─────────────────────────────────────────────────────

  /** Evaluate all HEAD_COACHes and induct worthy ones into the Hall of Fame */
  updateHallOfFame(currentYear: number) {
    const coaches = this.staff.filter(s => s.role === 'HEAD_COACH');
    coaches.forEach(coach => {
      if (!coach.history || coach.history.length === 0) return;
      const totalGames = coach.history.length;
      if (totalGames < 100) return;
      const totalWins = coach.history.filter((h: any) => h.result === 'W').length;
      const winRate = Math.round((totalWins / totalGames) * 100);
      if (winRate < 55) return;
      const club = this.getClub(coach.clubId);
      const clubsManaged = [...new Set(coach.history.map((h: any) => h.clubName || club?.name || 'Desconocido'))];
      const existingIdx = this.hallOfFame.findIndex(h => h.id === coach.id);
      const entry = {
        id: coach.id,
        managerName: coach.name,
        nationality: coach.nationality,
        totalGames, totalWins, winRate,
        titles: coach.careerHonours || [],
        clubsManaged: clubsManaged as string[],
        era: `${currentYear - 10}-${currentYear}`,
        yearInducted: currentYear,
      };
      if (existingIdx >= 0) { this.hallOfFame[existingIdx] = entry; }
      else if (winRate >= 60) { this.hallOfFame.push(entry); }
    });
    this.hallOfFame.sort((a, b) => b.winRate - a.winRate || b.titles.length - a.titles.length);
    if (this.hallOfFame.length > 50) this.hallOfFame.length = 50;
  }

  /** Update all-time club records based on player career stats */
  updateClubAllTimeRecords() {
    this.clubs.forEach(club => {
      const allPlayers = this.players.filter(p => p.clubId === club.id || p.careerStats?.clubsPlayedFor?.includes(club.id));
      let topScorer: typeof club.records.allTimeTopScorer = undefined;
      let mostApps: typeof club.records.allTimeMostApps = undefined;
      allPlayers.forEach(p => {
        const cs = p.careerStats;
        if (!cs) return;
        if (cs.totalGoals > (topScorer?.goals || 0)) topScorer = { playerName: p.name, playerId: p.id, goals: cs.totalGoals };
        if (cs.totalApps > (mostApps?.apps || 0)) mostApps = { playerName: p.name, playerId: p.id, apps: cs.totalApps };
      });
      if (topScorer) club.records.allTimeTopScorer = topScorer;
      if (mostApps) club.records.allTimeMostApps = mostApps;
    });
  }

  /** Generate economic news when league reputations shift significantly (sección Internacional del diario) */
  generateEconomicNews(date: Date) {
    const leagues = this.competitions.filter(c => c.type === 'LEAGUE' && c.dynamicReputation !== undefined);
    // Find biggest movers
    const sortedByChange = [...leagues].sort((a, b) => 
      Math.abs((b.dynamicReputation || 0) - this.getBaseLeagueRep(b)) -
      Math.abs((a.dynamicReputation || 0) - this.getBaseLeagueRep(a))
    );
    const topMovers = sortedByChange.slice(0, 3);
    topMovers.forEach(league => {
      const change = (league.dynamicReputation || 0) - this.getBaseLeagueRep(league);
      const tier = this.getLeagueTier(league.dynamicReputation || 30);
      const direction = change >= 5 ? 'asciende' : change <= -5 ? 'desciende' : 'se mantiene';
      const tierNames: Record<string, string> = { ELITE: 'Élite', PRESTIGE: 'Prestigio', DEVELOPING: 'En Desarrollo', EMERGING: 'Emergente', LOCAL: 'Local' };
      if (Math.abs(change) >= 5) {
        this.publishNews('INTERNACIONAL', {
          type: 'FEATURE',
          headline: `${league.name}: ${direction} en el mapa del fútbol`,
          subheadline: `Reputación en ${league.dynamicReputation}/100 (${direction} ${Math.abs(change)} pts)`,
          body: `La reputación de la ${league.name} se sitúa en ${league.dynamicReputation}/100, ${direction} ${Math.abs(change)} puntos. El tier actual de la liga es ${tierNames[tier]}.`,
          competitionId: league.id,
        });
      }
    });
    // Cross-league comparison headline
    if (leagues.length >= 2) {
      const top3 = [...leagues].sort((a, b) => (b.dynamicReputation || 0) - (a.dynamicReputation || 0)).slice(0, 3);
      this.publishNews('INTERNACIONAL', {
        type: 'FEATURE',
        headline: 'Ranking Mundial de Ligas',
        subheadline: `Top 3: ${top3[0]?.name}, ${top3[1]?.name}, ${top3[2]?.name}`,
        body: `El Top 3 de ligas por reputación:\n1. ${top3[0]?.name} (${top3[0]?.dynamicReputation}/100)\n2. ${top3[1]?.name} (${top3[1]?.dynamicReputation}/100)\n3. ${top3[2]?.name} (${top3[2]?.dynamicReputation}/100)`,
      });
    }
  }

  selectBestEleven(clubId: string, squad: SquadType, tacticId?: string) {
    const players = this.getPlayersByClub(clubId).filter(p => p.squad === squad && !p.injury && (!p.suspension || p.suspension.matchesLeft === 0));
    players.forEach(p => { p.isStarter = false; p.tacticalPosition = undefined; });
    
    const tactic = tacticId ? (this.tactics.find(t => t.id === tacticId) || this.tactics[0]) : this.tactics[0];
    tactic.positions.forEach(slot => {
        const metadata = SLOT_CONFIG[slot];
        if (!metadata) return;

        const eligible = players.filter(p => {
            if (p.isStarter) return false;
            const primaryPos = p.positions[0];
            
            if (metadata.line === 'GK') return primaryPos === Position.GK;
            if (metadata.line === 'SW') return primaryPos === Position.SW;
            if (metadata.line === 'DEF') return primaryPos === Position.DC || primaryPos === Position.DL || primaryPos === Position.DR;
            if (metadata.line === 'DM') return primaryPos === Position.DM || primaryPos === Position.DML || primaryPos === Position.DMR;
            if (metadata.line === 'MID') return primaryPos === Position.MC || primaryPos === Position.MR || primaryPos === Position.ML;
            if (metadata.line === 'AM') return primaryPos === Position.AM || primaryPos === Position.AMR || primaryPos === Position.AML;
            if (metadata.line === 'ATT') return primaryPos === Position.ST || primaryPos === Position.STR || primaryPos === Position.STL;
            return false;
        });

        let best = eligible.sort((a,b) => b.currentAbility - a.currentAbility)[0];
        if (!best) {
            best = players.filter(p => !p.isStarter).sort((a,b) => b.currentAbility - a.currentAbility)[0];
        }

        if (best) { 
            best.isStarter = true; 
            best.tacticalPosition = slot; 
        }
    });

    return players.filter(p => p.isStarter);
  }

  updateTacticalFamiliarity(clubId: string) {
    const tactic = this.tactics[0];
    if (!tactic) return;

    const clubPlayers = this.getPlayersByClub(clubId);
    clubPlayers.forEach(p => {
      if (!p.isStarter) return;
      const increment = p.tacticalFamiliarity < 50 ? 4 : p.tacticalFamiliarity < 80 ? 2 : 1;
      p.tacticalFamiliarity = Math.min(100, p.tacticalFamiliarity + increment);
    });

    clubPlayers.forEach(p => {
      if (!p.isStarter && p.tacticalFamiliarity > 30) {
        p.tacticalFamiliarity = Math.max(30, p.tacticalFamiliarity - 1);
      }
    });
  }

  updateClubRecords(homeClubId: string, awayClubId: string, homeScore: number, awayScore: number, date: Date, competitionId: string) {
    const homeClub = this.getClub(homeClubId);
    const awayClub = this.getClub(awayClubId);
    if (!homeClub || !awayClub) return;

    const goalsTotal = homeScore + awayScore;
    const goalDiff = Math.abs(homeScore - awayScore);

    const updateRecord = (club: Club, opponentName: string, isWin: boolean, isHome: boolean) => {
      const scored = isHome ? homeScore : awayScore;
      const conceded = isHome ? awayScore : homeScore;

      if (isWin && goalDiff > 0) {
        if (!club.records.biggestVictory || goalDiff > Math.abs(club.records.biggestVictory.goalsFor - club.records.biggestVictory.goalsAgainst)) {
          club.records.biggestVictory = { opponent: opponentName, goalsFor: scored, goalsAgainst: conceded, date, competition: competitionId };
        }
      } else if (!isWin && scored < conceded) {
        if (!club.records.biggestDefeat || goalDiff > Math.abs(club.records.biggestDefeat.goalsAgainst - club.records.biggestDefeat.goalsFor)) {
          club.records.biggestDefeat = { opponent: opponentName, goalsFor: scored, goalsAgainst: conceded, date, competition: competitionId };
        }
      }

      if (goalsTotal > (club.records.highestScoringMatch?.goalsTotal || 0)) {
        club.records.highestScoringMatch = { goalsTotal, opponent: opponentName, date };
      }

      if (isWin) {
        club.records.currentWinStreak++;
        if (club.records.currentWinStreak > club.records.longestWinStreak) {
          club.records.longestWinStreak = club.records.currentWinStreak;
        }
      } else {
        club.records.currentWinStreak = 0;
      }
    };

    updateRecord(homeClub, awayClub.name, homeScore > awayScore, true);
    updateRecord(awayClub, homeClub.name, awayScore > homeScore, false);
  }

  saveTactic(name: string, positions: number[], settings: TacticSettings) {
    this.tactics.push({ id: generateUUID(), name, positions, settings, arrows: {}, individualSettings: {} });
  }

  makeTransferOffer(playerId: string, fromClubId: string, amount: number, type: 'PURCHASE' | 'LOAN' | 'LOAN_TO_BUY', date: Date, wageShare = 100) {
    const player = this.getPlayer(playerId);
    if (!player) return;
    if (player.releaseClause && amount >= player.releaseClause) {
      const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, wageShare, type, status: 'ACCEPTED', date, responseDate: date, isViewed: false };
      this.offers.push(offer);
      this.addInboxMessage('MARKET', `Cláusula activada: ${player.name}`, `${this.getClub(fromClubId)?.name} ha pagado la cláusula de rescisión de ${player.name}: $${amount.toLocaleString()}.`, date, playerId, 'IMPORTANT');
      return;
    }
    if (player.agent && Math.random() < 0.4) {
      const commission = Math.round(amount * player.agent.commission / 100);
      amount += commission;
      this.addInboxMessage('FINANCE', `Comisión del agente: ${player.name}`, `El agente ${player.agent.name} exige una comisión del ${player.agent.commission}% ($${commission.toLocaleString()}) sobre el traspaso.`, date, playerId, 'IMPORTANT');
    }
    const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, wageShare, type, status: 'PENDING', date, responseDate: date, isViewed: false };
    this.offers.push(offer);
  }

  acceptCounterOffer(offerId: string, date: Date) {
    const o = this.offers.find(offer => offer.id === offerId);
    if (o) { o.status = 'ACCEPTED'; o.amount = o.counterAmount || o.amount; o.responseDate = date; }
  }

  completeTransfer(offer: TransferOffer) {
    const p = this.getPlayer(offer.playerId);
    if (p) {
        if (offer.type === 'LOAN' || offer.type === 'LOAN_TO_BUY') {
          this.completeLoan(offer);
          return;
        }
        const oldClub = this.getClub(p.clubId); const newClub = this.getClub(offer.fromClubId);
        if (oldClub && offer.type === 'PURCHASE') oldClub.finances.balance += offer.amount;
        if (newClub && offer.type === 'PURCHASE') {
          newClub.finances.balance -= offer.amount;
          newClub.finances.transferBudget -= offer.amount;
          const signingBonus = Math.round(offer.amount * 0.08 + (p.currentAbility * 200));
          newClub.finances.balance -= signingBonus;
          newClub.finances.monthlyExpenses += signingBonus;
          this.addInboxMessage('FINANCE',
            `Prima de fichaje: ${p.name}`,
            `Se ha pagado una prima de fichaje de $${signingBonus.toLocaleString()} por la incorporación de ${p.name}.`,
            offer.date, p.id, 'IMPORTANT');
        }
        p.clubId = offer.fromClubId; p.isStarter = false; p.tacticalPosition = undefined;
        this.invalidateClubCache(offer.fromClubId);
        this.invalidateClubCache(offer.toClubId);
        p.isTransferListed = false;
        if (newClub) {
          const salaryFactor = 0.8 + Math.random() * 0.6;
          p.salary = Math.round(p.salary * salaryFactor);
          p.contractExpiry = new Date(offer.date.getFullYear() + 3 + Math.floor(Math.random() * 2), 5, 30);
        }
        p.isUnhappyWithContract = false;
        p.requestedSalary = undefined;
        offer.status = 'COMPLETED';
        // Notificación solo si el traspaso involucra al club del usuario; la noticia del diario la emite processTransferDecisions.
        const userClubHere = this.getUserClub();
        if (userClubHere && (offer.fromClubId === userClubHere.id || offer.toClubId === userClubHere.id)) {
          this.addInboxMessage('MARKET', `Traspaso completado: ${p.name}`, `${p.name} se ha unido a ${newClub?.name || 'nuevo club'} por $${offer.amount.toLocaleString()}.`, offer.date, p.id, 'IMPORTANT', true);
          sendTransferNotification(p.name, newClub?.name || 'nuevo club');
        }
    }
  }

  processMatchDayIncome(homeClubId: string, competitionId: string, date: Date) {
    const club = this.getClub(homeClubId);
    if (!club) return;
    const comp = this.competitions.find(c => c.id === competitionId);
    const attendance = Math.round(club.stadiumCapacity * (0.5 + (club.reputation / 10000) * 0.4 + Math.random() * 0.1));
    let ticketPrice = 15;
    if (comp?.type === 'CONTINENTAL_ELITE') ticketPrice = 40;
    else if (comp?.type === 'CONTINENTAL_SMALL') ticketPrice = 25;
    else if (comp?.type === 'CUP') ticketPrice = 20;
    const income = Math.round(attendance * ticketPrice);
    club.finances.balance += income;
    club.finances.monthlyIncome += income;
  }

  trackU21Minutes(clubId: string, squad: Player[], stats: Record<string, PlayerMatchStats>, currentDate: Date) {
    const club = this.getClub(clubId);
    if (!club) return;
    squad.forEach(p => {
      const s = stats[p.id];
      if (!s || s.minutesPlayed <= 0.1) return;
      const ageMs = currentDate.getTime() - p.birthDate.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      if (ageYears < 21) {
        if (!club.u21MinutesThisSeason) club.u21MinutesThisSeason = 0;
        club.u21MinutesThisSeason += s.minutesPlayed;
      }
    });
  }

  rescindContract(playerId: string, date: Date) {
    const p = this.getPlayer(playerId);
    if (p) { 
      const oldClubId = p.clubId;
      p.clubId = 'FREE_AGENT'; 
      p.isStarter = false; 
      p.tacticalPosition = undefined; 
      p.isTransferListed = false; 
      this.invalidateClubCache(oldClubId);
    }
  }

  createHumanManager(clubId: string, name: string) {
    const manager: Staff = { id: generateUUID(), name, age: 35, nationality: "Argentina", role: 'HEAD_COACH', clubId, attributes: { coaching: 12, judgingAbility: 12, judgingPotential: 11, tacticalKnowledge: 10, adaptability: 10, medical: 2, physiotherapy: 2, motivation: 14, manManagement: 13 }, salary: 12000, contractExpiry: new Date(2009, 5, 30), history: [], personality: 'LEADER', morale: 100, reputation: 55, relationships: {}, pressReputation: 50, boardRelationship: 65 };
    this.staff = this.staff.filter(s => s.clubId !== clubId || s.role !== 'HEAD_COACH');
    this.staff.unshift(manager);
  }

  replaceHeadCoach(managerData: RealManager, clubId: string, fired: boolean) {
    const fullName = `${managerData.name} ${managerData.surname}`;
    const manager: Staff = {
      id: managerData.id,
      name: fullName,
      age: managerData.age,
      nationality: managerData.nationality,
      role: 'HEAD_COACH',
      clubId,
      attributes: { ...managerData.attributes },
      salary: fired ? 10000 : 15000, // Reduced salary if fired
      contractExpiry: new Date(new Date().getFullYear() + 2, 5, 30), // 2-year contract
      history: [...managerData.history],
      personality: managerData.personality,
      morale: fired ? 60 : 100, // Lower morale if fired
      reputation: managerData.reputation,
      internationalReputation: managerData.internationalReputation,
      relationships: {},
      pressReputation: fired ? 30 : Math.min(100, managerData.reputation + 10),
      boardRelationship: fired ? 40 : 70, // Lower board relationship if fired
      biography: managerData.biography,
      preferredFormation: managerData.preferredFormation,
      tacticalStyle: managerData.tacticalStyle,
      pressIntensity: managerData.pressIntensity,
      possessionVsCounter: managerData.possessionVsCounter,
      playingStyle: managerData.playingStyle,
      careerHonours: managerData.careerHonours,
      previousClubs: managerData.previousClubs,
    };
    this.staff = this.staff.filter(s => s.clubId !== clubId || s.role !== 'HEAD_COACH');
    this.staff.unshift(manager);
  }

  createManagerProfile(clubId: string | null, name: string, surname: string, nationality: string, origin: ManagerOrigin, birthDate: Date, startDate: Date, nationalTeamId: string | null = null): ManagerProfile {
    const club = clubId ? this.getClub(clubId) : undefined;
    const clubName = club?.name || 'Sin club';
    const nationalTeam = nationalTeamId ? this.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === nationalTeamId) : undefined;
    const objective = clubId ? this.getClubObjective(clubId) : nationalTeam ? `Clasificar y competir con ${nationalTeam.name}` : 'Construir una carrera internacional';
    this.managerProfile = {
      name, surname, fullName: `${name} ${surname}`,
      nationality, birthDate, careerStartDate: startDate, origin,
      currentClubId: clubId, currentClubName: clubName,
      currentNationalTeamId: nationalTeamId,
      currentNationalTeamName: nationalTeam?.name,
      careerMode: clubId && nationalTeamId ? 'BOTH' : nationalTeamId ? 'NATIONAL' : 'CLUB',
      seasonInClub: 1, yearsInClub: 0,
      totalGames: 0, totalWins: 0, totalDraws: 0, totalLosses: 0,
      goalsFor: 0, goalsAgainst: 0,
      titles: [], youthDebuts: 0, mostUsedPlayer: 'Ninguno',
      biggestSale: null,
      currentObjective: objective,
      boardRelationship: 'CALM', pressRelationship: 'CALM', fansRelationship: 'CALM',
      clubHistory: clubId ? [{ clubId, clubName, startDate: new Date(startDate), seasons: 0, titles: [] }] : [],
      legacy: '',
    };
    return this.managerProfile;
  }

  updateManagerProfileMatch(userScore: number, oppScore: number) {
    if (!this.managerProfile) return;
    const p = this.managerProfile;
    p.totalGames++;
    p.goalsFor += userScore;
    p.goalsAgainst += oppScore;
    if (userScore > oppScore) p.totalWins++;
    else if (userScore < oppScore) p.totalLosses++;
    else p.totalDraws++;

    // Update most used player
    const userClub = this.getUserClub();
    if (userClub) {
      const squad = this.getPlayersByClub(userClub.id).filter(pl => pl.squad === 'SENIOR' && pl.seasonStats && pl.seasonStats.appearances > 0);
      if (squad.length > 0) {
        const mostUsed = squad.sort((a, b) => b.seasonStats.appearances - a.seasonStats.appearances)[0];
        if (mostUsed && mostUsed.seasonStats.appearances >= 3) {
          p.mostUsedPlayer = mostUsed.name;
        }
      }
    }

    // Update relationships based on result
    if (userScore > oppScore) {
      if (p.fansRelationship === 'WORRIED' || p.fansRelationship === 'ANGRY') p.fansRelationship = 'CALM';
      else if (p.fansRelationship === 'CALM') p.fansRelationship = 'HAPPY';
    } else if (userScore < oppScore) {
      if (p.fansRelationship === 'HAPPY') p.fansRelationship = 'CALM';
      else if (p.fansRelationship === 'CALM') p.fansRelationship = 'WORRIED';
      else if (p.fansRelationship === 'WORRIED' && Math.random() < 0.3) p.fansRelationship = 'ANGRY';
    }
  }

  updateManagerProfileYouthDebut() {
    if (this.managerProfile) this.managerProfile.youthDebuts++;
  }

  updateManagerProfileBiggestSale(playerName: string, amount: number) {
    if (!this.managerProfile) return;
    if (!this.managerProfile.biggestSale || amount > this.managerProfile.biggestSale.amount) {
      this.managerProfile.biggestSale = { player: playerName, amount };
    }
  }

  updateManagerProfileSeasonEnd(wonTitle: boolean, titleNames: string[], leaguePosition: number, totalTeams: number) {
    if (!this.managerProfile) return;
    const p = this.managerProfile;
    p.seasonInClub++;
    p.yearsInClub++;

    if (wonTitle) {
      titleNames.forEach(t => {
        if (!p.titles.includes(t)) p.titles.push(t);
      });
    }

    const currentEntry = p.clubHistory.find(e => e.clubId === p.currentClubId && !e.endDate);
    if (currentEntry) {
      currentEntry.seasons++;
      if (wonTitle) {
        titleNames.forEach(t => {
          if (!currentEntry.titles.includes(t)) currentEntry.titles.push(t);
        });
      }
    }

    // Update relationships based on season performance
    const winRate = p.totalGames > 0 ? p.totalWins / p.totalGames : 0;
    const midTable = totalTeams / 2;
    if (leaguePosition <= midTable * 0.3) {
      p.boardRelationship = 'HAPPY';
      p.fansRelationship = 'HAPPY';
    } else if (leaguePosition <= midTable) {
      p.boardRelationship = 'CALM';
    } else {
      p.boardRelationship = 'WORRIED';
      if (leaguePosition >= totalTeams - 2) {
        p.boardRelationship = 'ANGRY';
        p.fansRelationship = 'ANGRY';
      }
    }

    // Update press relationship
    if (winRate >= 0.6) p.pressRelationship = 'HAPPY';
    else if (winRate >= 0.4) p.pressRelationship = 'CALM';
    else p.pressRelationship = 'WORRIED';

    // Update next objective
    p.currentObjective = this.getClubObjective(p.currentClubId);
  }

  getClubObjective(clubId: string | null): string {
    const club = this.getClub(clubId);
    if (!club) return 'Permanecer en la categoría';
    const league = this.competitions.find(c => c.id === club.leagueId);
    const clubsInLeague = this.clubs.filter(c => c.leagueId === club.leagueId);
    const clubRep = clubsInLeague.sort((a, b) => b.reputation - a.reputation);
    const position = clubRep.findIndex(c => c.id === clubId);
    const total = clubRep.length;
    if (position === 0) return 'Ganar el campeonato';
    if (position <= 2) return 'Pelear por el título';
    if (position <= Math.ceil(total * 0.25)) return 'Clasificar a competición continental';
    if (position <= Math.ceil(total * 0.5)) return 'Finalizar en mitad alta';
    if (position <= total - 3) return 'Consolidar la categoría';
    return 'Evitar el descenso';
  }

  startNewClub(clubId: string, startDate: Date) {
    if (!this.managerProfile) return;
    const club = this.getClub(clubId);
    if (!club) return;
    // Close previous club entry
    const prevEntry = this.managerProfile.clubHistory.find(e => e.clubId === this.managerProfile!.currentClubId && !e.endDate);
    if (prevEntry) prevEntry.endDate = new Date(startDate);

    this.managerProfile.currentClubId = clubId;
    this.managerProfile.currentClubName = club.name;
    this.managerProfile.seasonInClub = 1;
    this.managerProfile.yearsInClub = 0;
    this.managerProfile.boardRelationship = 'CALM';
    this.managerProfile.pressRelationship = 'CALM';
    this.managerProfile.fansRelationship = 'CALM';
    this.managerProfile.currentObjective = this.getClubObjective(clubId);
    this.managerProfile.clubHistory.push({ clubId, clubName: club.name, startDate: new Date(startDate), seasons: 0, titles: [] });
  }

  getRequestedSalary(player: Player, club: Club) {
    const base = player.salary;
    const repFactor = (10000 + club.reputation) / 10000;
    const abilityFactor = player.currentAbility / 100;
    return Math.round(base * 1.3 * repFactor * abilityFactor / 100) * 100;
  }

  submitContractOffer(player: Player, salary: number, years: number, date: Date) {
    const requested = this.getRequestedSalary(player, this.getClub(player.clubId)!);
    player.negotiationAttempts++;
    if (salary >= requested) {
      player.salary = salary;
      player.contractExpiry = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
      player.isUnhappyWithContract = false;
      player.requestedSalary = undefined;
      player.negotiationAttempts = 0;
      return 'ACCEPTED';
    }
    if (salary >= requested * 0.85) {
      const acceptChance = player.loyalty / 20 + 0.1;
      if (Math.random() < acceptChance) {
        player.salary = salary;
        player.contractExpiry = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
        player.isUnhappyWithContract = false;
        player.requestedSalary = undefined;
        player.negotiationAttempts = 0;
        return 'ACCEPTED';
      }
    }
    if (player.negotiationAttempts >= 3) {
      player.negotiationAttempts = 0;
      return 'BROKEN';
    }
    return 'REJECTED';
  }

  processAIActivity(date: Date) {
    this.processPendingOffers(date);
    if (Math.random() > 0.15) return;
    const allClubs = this.clubs;
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);

    // Pools de candidatos: una sola pasada sobre el mundo (~41k) en lugar de un scan por club (~658 scans)
    const byPosition = new Map<Position, Player[]>();
    const youthPool: Player[] = [];
    const loanPool: Player[] = [];
    for (const p of this.players) {
      // Pool de cesiones: replica el filtro original (cualquier plantel, incl. agentes libres)
      if (p.age < 25 && p.currentAbility < 140 && !p.loanDetails &&
          (p.transferStatus === 'LOANABLE' || p.isTransferListed)) loanPool.push(p);
      if (p.clubId === 'FREE_AGENT' || p.squad !== 'SENIOR') continue;
      for (const pos of p.positions) {
        const arr = byPosition.get(pos);
        if (arr) arr.push(p); else byPosition.set(pos, [p]);
      }
      if (p.age >= 16 && p.age <= 22 && p.potentialAbility >= 140) youthPool.push(p);
    }
    // Conteos por club para las fases de cesiones (evita scans de 658×658 por llamada)
    const u20Counts = new Map<string, number>();
    const clubPosCoverage = new Map<string, Set<Position>>();
    for (const c of allClubs) {
      const squad = this.getPlayersByClub(c.id);
      let u20 = 0;
      const covered = new Set<Position>();
      for (const sp of squad) {
        if (sp.squad === 'U20') u20++;
        for (const pos of sp.positions) covered.add(pos);
      }
      u20Counts.set(c.id, u20);
      clubPosCoverage.set(c.id, covered);
    }

    // Cross-league: DEEP clubs can make offers to any DEEP league club, not just same-league
    if (Math.random() < 0.2) {
      const deepClubs = allClubs.filter(c => deepIds.has(c.leagueId) && c.finances.transferBudget > 20000);
      if (deepClubs.length >= 2) {
        const buyer = deepClubs[Math.floor(Math.random() * deepClubs.length)];
        const targets = this.players.filter(p =>
          p.clubId !== buyer.id && deepIds.has(this.getClub(p.clubId)?.leagueId || '') &&
          (p.isTransferListed || p.transferStatus === 'TRANSFERABLE') &&
          p.value <= buyer.finances.transferBudget * 0.4
        );
        if (targets.length > 0) {
          const target = targets[Math.floor(Math.random() * targets.length)];
          this.makeTransferOffer(target.id, buyer.id, Math.round(target.value * (0.8 + Math.random() * 0.4)), 'PURCHASE', date);
        }
      }
    }
    // Talent migration: young stars (U23, PA>150) prefer rising leagues
    if (Math.random() < 0.08) {
      const youngStars = this.players.filter(p => p.age <= 23 && p.potentialAbility > 150 && p.clubId !== 'FREE_AGENT');
      if (youngStars.length > 0) {
        const star = youngStars[Math.floor(Math.random() * youngStars.length)];
        const starClub = this.getClub(star.clubId);
        const starLeague = this.competitions.find(c => c.id === starClub?.leagueId);
        const risingLeagues = this.competitions.filter(c =>
          c.type === 'LEAGUE' && c.id !== starClub?.leagueId &&
          (c.dynamicReputation || 30) > (starLeague?.dynamicReputation || 30) + 10
        );
        if (risingLeagues.length > 0) {
          const targetLeague = risingLeagues[Math.floor(Math.random() * risingLeagues.length)];
          const targetClubs = this.clubs.filter(c => c.leagueId === targetLeague.id && c.finances.transferBudget > star.value * 0.5);
          if (targetClubs.length > 0) {
            const buyer = targetClubs[Math.floor(Math.random() * targetClubs.length)];
            this.makeTransferOffer(star.id, buyer.id, Math.round(star.value * 1.2), 'PURCHASE', date);
          }
        }
      }
    }

    // AI sell phase: list surplus players
    allClubs.forEach(club => {
      const seniorPlayers = this.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
      const surplus: Player[] = [];
      const gkList = seniorPlayers.filter(p => p.positions.includes(Position.GK));
      if (gkList.length > 2) surplus.push(...gkList.slice(2));
      const defList = seniorPlayers.filter(p => ['SW','DC','DR','DL'].some(pos => p.positions.includes(pos as Position)));
      if (defList.length > 6) surplus.push(...defList.slice(6));
      const midList = seniorPlayers.filter(p => ['DM','MC','ML','MR','AM'].some(pos => p.positions.includes(pos as Position)));
      if (midList.length > 6) surplus.push(...midList.slice(6));
      const fwdList = seniorPlayers.filter(p => p.positions.includes(Position.ST));
      if (fwdList.length > 3) surplus.push(...fwdList.slice(3));
      surplus.forEach(p => { p.isTransferListed = true; });
    });

    // AI buy phase
    allClubs.forEach(club => {
      if (club.finances.transferBudget < 5000) return;
      const needPositions = this.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR' && !p.injury);
      const weakPositions: Position[] = [];
      const gkCount = needPositions.filter(p => p.positions.includes(Position.GK)).length;
      if (gkCount < 2) weakPositions.push(Position.GK);
      const defCount = needPositions.filter(p => ['SW','DC','DR','DL'].some(pos => p.positions.includes(pos as Position))).length;
      if (defCount < 5) { weakPositions.push(Position.DC); weakPositions.push(Position.DR); }
      const midCount = needPositions.filter(p => ['DM','MC','ML','MR','AM'].some(pos => p.positions.includes(pos as Position))).length;
      if (midCount < 4) weakPositions.push(Position.MC);
      const fwdCount = needPositions.filter(p => p.positions.includes(Position.ST)).length;
      if (fwdCount < 2) weakPositions.push(Position.ST);
      if (weakPositions.length === 0) return;
      const targetPos = weakPositions[randomInt(0, weakPositions.length - 1)];
      const candidates = (byPosition.get(targetPos) || []).filter(p =>
        p.clubId !== club.id &&
        Math.abs(p.currentAbility - club.reputation / 100) < 20
      );
      if (candidates.length === 0) return;
      const target = candidates[randomInt(0, candidates.length - 1)];
      const maxOffer = Math.min(target.value, club.finances.transferBudget);
      if (maxOffer < 1000) return;
      if (target.releaseClause && target.releaseClause <= club.finances.transferBudget && Math.random() < 0.4) {
        const offer: TransferOffer = {
          id: generateUUID(), playerId: target.id,
          fromClubId: club.id, toClubId: target.clubId,
          amount: target.releaseClause, wageShare: 100, type: 'PURCHASE',
          status: 'ACCEPTED', date, responseDate: date, isViewed: false
        };
        this.offers.push(offer);
      } else {
        const amount = Math.round(maxOffer * (0.5 + Math.random() * 0.4));
        const offer: TransferOffer = {
          id: generateUUID(), playerId: target.id,
          fromClubId: club.id, toClubId: target.clubId,
          amount, wageShare: 100, type: 'PURCHASE',
          status: 'PENDING', date, responseDate: date, isViewed: false
        };
        this.offers.push(offer);
      }
    });

    // AI long-term buy phase: sign young talents with high potential
    allClubs.filter(c => c.finances.transferBudget >= 10000).forEach(club => {
      if (Math.random() > 0.15) return;
      const youngTalents = youthPool.filter(p =>
        p.clubId !== club.id &&
        p.currentAbility < club.reputation / 80
      );
      if (youngTalents.length === 0) return;
      const target = youngTalents[randomInt(0, Math.min(4, youngTalents.length - 1))];
      const maxOffer = Math.min(target.value * 1.5, club.finances.transferBudget);
      if (maxOffer < 5000) return;
      const amount = Math.round(maxOffer * (0.6 + Math.random() * 0.3));
      const offer: TransferOffer = {
        id: generateUUID(), playerId: target.id,
        fromClubId: club.id, toClubId: target.clubId,
        amount, wageShare: 100, type: 'PURCHASE',
        status: 'PENDING', date, responseDate: date, isViewed: false
      };
      this.offers.push(offer);
    });

    // AI sell old players phase: transfer-list players over 32 with declining trend
    allClubs.forEach(club => {
      const oldPlayers = this.getPlayersByClub(club.id).filter(p =>
        p.age >= 32 && p.developmentTrend === 'DECLINING' && !p.isTransferListed
      );
      oldPlayers.forEach(p => { p.isTransferListed = true; });
    });

    // AI loan phase: clubs loan out surplus young players
    allClubs.forEach(club => {
      const youngSurplus = this.getPlayersByClub(club.id).filter(p =>
        p.age < 23 && p.squad === 'SENIOR' && p.currentAbility < 130 &&
        !p.isTransferListed && !p.loanDetails && p.transferStatus !== 'NONE'
      );
      youngSurplus.slice(0, 2).forEach(p => {
        const loanCandidates = this.clubs.filter(c =>
          c.id !== club.id &&
          !p.positions.some(pos => clubPosCoverage.get(c.id)?.has(pos))
        );
        if (loanCandidates.length > 0 && Math.random() < 0.3) {
          const toClub = loanCandidates[randomInt(0, loanCandidates.length - 1)];
          const offer: TransferOffer = {
            id: generateUUID(), playerId: p.id,
            fromClubId: toClub.id, toClubId: club.id,
            amount: 0, wageShare: 50, type: 'LOAN',
            status: 'PENDING', date, responseDate: date, isViewed: false
          };
          this.offers.push(offer);
        }
      });
    });

    // AI loan request for weak positions
    allClubs.forEach(club => {
      const needPositions = this.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR' && !p.injury);
      const weakPositions: Position[] = [];
      if (needPositions.filter(p => p.positions.includes(Position.GK)).length < 2) weakPositions.push(Position.GK);
      if (needPositions.filter(p => ['DC','DR','DL'].some(pos => p.positions.includes(pos as Position))).length < 4) weakPositions.push(Position.DC);
      if (needPositions.filter(p => ['DM','MC','ML','MR','AM'].some(pos => p.positions.includes(pos as Position))).length < 3) weakPositions.push(Position.MC);
      if (needPositions.filter(p => p.positions.includes(Position.ST)).length < 2) weakPositions.push(Position.ST);
      if (weakPositions.length === 0 || club.finances.transferBudget < 2000) return;
      const targetPos = weakPositions[randomInt(0, weakPositions.length - 1)];
      const loanCandidates = loanPool.filter(p =>
        p.clubId !== club.id && p.positions.includes(targetPos)
      );
      if (loanCandidates.length === 0) return;
      const target = loanCandidates[randomInt(0, loanCandidates.length - 1)];
      const offer: TransferOffer = {
        id: generateUUID(), playerId: target.id,
        fromClubId: club.id, toClubId: target.clubId,
        amount: 0, wageShare: 50, type: 'LOAN',
        status: 'PENDING', date, responseDate: date, isViewed: false
      };
      this.offers.push(offer);
    });

    // AI Youth Loan System: loan out promising U20 players for development
    allClubs.forEach(club => {
      const candidates = this.getPlayersByClub(club.id).filter(p =>
        p.squad === 'U20' &&
        p.age >= 17 &&
        p.age <= 20 &&
        !p.injury &&
        !p.loanDetails &&
        (p.currentAbility >= 80 || p.potentialAbility >= 120)
      );
      if (candidates.length === 0) return;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const destinations = allClubs.filter(c => c.id !== club.id && (u20Counts.get(c.id) || 0) < 5);
      if (destinations.length === 0) return;
      const toClub = destinations[Math.floor(Math.random() * destinations.length)];
      const offer: TransferOffer = {
        id: generateUUID(),
        playerId: target.id,
        fromClubId: club.id,
        toClubId: toClub.id,
        amount: 0,
        wageShare: 70,
        type: 'LOAN',
        status: 'PENDING',
        date,
        responseDate: date,
        isViewed: false
      };
      this.offers.push(offer);
    });
  }

  processDailyContracts(date: Date, userClubId?: string) {
    if (userClubId) {
      const userPlayers = this.getPlayersByClub(userClubId);
      userPlayers.forEach(p => {
        if (p.contractExpiry < date && !p.isUnhappyWithContract) {
          p.isUnhappyWithContract = true;
          p.requestedSalary = this.getRequestedSalary(p, this.getClub(userClubId)!);
          this.addInboxMessage('SQUAD', `${p.name} — Contrato por vencer`, `A ${p.name} le queda menos de un año de contrato. Solicita $${p.requestedSalary.toLocaleString()}/sem. Renovalo o podría buscar otros horizontes.`, date, p.id);
        }
        if (p.injury && p.injury.daysLeft === 1) {
          this.addInboxMessage('SQUAD', `${p.name} — Próximo a recuperarse`, `${p.name} se recuperará de su lesión mañana y estará disponible para la próxima convocatoria.`, date, p.id);
        }
      });
      const injuredPlayers = userPlayers.filter(p => p.injury && p.injury.daysLeft > 0);
      if (injuredPlayers.length > 0 && Math.random() < 0.3) {
        const worst = injuredPlayers.reduce((a, b) => (a.injury!.daysLeft > b.injury!.daysLeft ? a : b));
        this.addInboxMessage('SQUAD', `Parte médico: ${worst.name}`, `${worst.name} continúa recuperándose de ${worst.injury!.type}. Regreso estimado en ${worst.injury!.daysLeft} días.`, date, worst.id);
      }
    }
  }

  processTransferDecisions(date: Date) {
    this.processPendingOffers(date);
    const completedToday = this.offers.filter(o => o.status === 'COMPLETED' && o.date.toDateString() === date.toDateString());
    completedToday.forEach(offer => {
      if (offer.type === 'LOAN') return;
      const buyer = this.getClub(offer.fromClubId);
      const seller = this.getClub(offer.toClubId);
      const player = this.getPlayer(offer.playerId);
      if (buyer && seller && player) {
        // Noticia del diario (sección Mercado), para todos los traspasos del mundo
        this.generateTransferNews(player, seller, buyer, offer.amount, date);
      }
    });
  }

  checkRenewalTriggers(date: Date, userClubId?: string) {
    if (Math.random() > 0.05) return;
    let mutated = false;
    this.players.forEach(p => {
      if (p.contractExpiry < date && p.clubId !== 'FREE_AGENT') {
        const club = this.getClub(p.clubId);
        if (!club) return;
        const renewChance = 0.3 + (p.currentAbility / 200) * 0.3 + (club.reputation / 10000) * 0.2;
        if (Math.random() < renewChance) {
          p.contractExpiry = new Date(date.getFullYear() + 2, 5, 30);
        } else if (Math.random() < 0.3) {
          // Liberar primero y reconstruir los índices UNA sola vez al final
          // (invalidar por jugador disparaba miles de rebuilds de ~41k en el día posterior al 30/6)
          p.clubId = 'FREE_AGENT';
          mutated = true;
          const availableBudget = club.finances.wageBudget - this.getPlayersByClub(club.id).reduce((s, pl) => s + pl.salary, 0);
          if (availableBudget > 0) {
            const newSalary = Math.round(p.salary * (0.8 + Math.random() * 0.5));
            if (newSalary <= availableBudget) {
              p.salary = newSalary;
              p.contractExpiry = new Date(date.getFullYear() + 1, 5, 30);
              p.clubId = club.id;
            }
          }
        }
      }
    });
    if (mutated) this.markPlayersDirty();
  }

  processPendingOffers(date: Date) {
    const pending = this.offers.filter(o => o.status === 'PENDING');
    pending.forEach(offer => {
      const player = this.getPlayer(offer.playerId);
      const sellerClub = this.getClub(offer.toClubId);
      if (!player || !sellerClub) { offer.status = 'REJECTED'; return; }

if (offer.type === 'LOAN' || offer.type === 'LOAN_TO_BUY') {
          const hasDepth = this.getPlayersByClub(sellerClub.id).filter(p => p.positions.some(pos => player.positions.includes(pos))).length > 3;
          const acceptChance = offer.type === 'LOAN_TO_BUY' ? (hasDepth ? 0.5 : 0.2) : (hasDepth ? 0.6 : 0.3);
          if (Math.random() < acceptChance) {
            offer.status = 'ACCEPTED';
            offer.responseDate = date;
          } else {
            offer.status = 'REJECTED';
            offer.responseDate = date;
          }
          return;
        }

        // Check if accepting would drop seller below minimums
        if (offer.type === 'PURCHASE' && this.wouldDropBelowMinimums(sellerClub.id, player)) {
          offer.status = 'REJECTED';
          offer.responseDate = date;
          return;
        }

       const valueRatio = offer.amount / Math.max(1, player.value);
      const repFactor = sellerClub.reputation / 5000;
      const acceptChance = Math.min(0.95, valueRatio * 1.5 - 0.3 + repFactor * 0.2);
      if (Math.random() < acceptChance) {
        offer.status = 'ACCEPTED';
        offer.responseDate = date;
      } else if (Math.random() < 0.3) {
        const counterAmount = Math.round(player.value * (0.8 + Math.random() * 0.6));
        offer.status = 'COUNTER_OFFER';
        offer.counterAmount = counterAmount;
        offer.responseDate = date;
      } else {
offer.status = 'REJECTED';
        offer.responseDate = date;
      }
    });
  }

  private wouldDropBelowMinimums(clubId: string, playerToSell: any): boolean {
    const seniorPlayers = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
    if (seniorPlayers.length <= 14) return true;
    
    const position = playerToSell.positions[0];
    const positionDepth = seniorPlayers.filter(p => p.positions.includes(position)).length;
    if (positionDepth <= 2) return true;
    
    return false;
  }

  completeLoan(offer: TransferOffer) {
    const p = this.getPlayer(offer.playerId);
    if (!p) return;
    const isLoanToBuy = offer.type === 'LOAN_TO_BUY';
    p.loanDetails = { originalClubId: p.clubId, wageShare: offer.wageShare, loanToBuy: isLoanToBuy };
    this.invalidateClubCache(p.clubId);
    this.invalidateClubCache(offer.fromClubId);
    p.clubId = offer.fromClubId;
    p.isStarter = false;
    p.isTransferListed = false;
    p.transferStatus = 'NONE';
    offer.status = 'COMPLETED';
    const newClub = this.getClub(offer.fromClubId);
    // Notificación solo si la cesión involucra al club del usuario
    const userClubHere = this.getUserClub();
    if (userClubHere && (offer.fromClubId === userClubHere.id || offer.toClubId === userClubHere.id)) {
      this.addInboxMessage('MARKET', `Cedido: ${p.name}`, `${p.name} se marcha cedido a ${newClub?.name || 'nuevo club'}${isLoanToBuy ? ' (con opción de compra)' : ''} hasta final de temporada.`, offer.date, p.id, 'IMPORTANT');
    }
  }

  processLoanReturns(date: Date) {
    const seasonEndMonth = 6;
    if (date.getMonth() !== seasonEndMonth || date.getDate() > 7) return;
    this.players.forEach(p => {
      if (p.loanDetails) {
        const wasLoanToBuy = p.loanDetails.loanToBuy;
        this.invalidateClubCache(p.clubId);
        this.invalidateClubCache(p.loanDetails.originalClubId);
        p.clubId = p.loanDetails.originalClubId;
        p.loanDetails = undefined;
        p.isStarter = false;
        if (wasLoanToBuy) {
          const buyingClub = this.getClub(p.clubId);
          if (buyingClub && buyingClub.id) {
            // Notificación solo si la cesión involucra al club del usuario
            const userClubHere = this.getUserClub();
            if (userClubHere && p.clubId === userClubHere.id) {
              this.addInboxMessage('MARKET', `Opción de compra: ${p.name}`, `El préstamo de ${p.name} ha finalizado. ${buyingClub.name} puede ejercer la opción de compra pagando su valor de mercado.`, date, p.id, 'IMPORTANT');
            }
          }
        }
      }
    });
  }

  // ─── Transfer Deadline Day ──────────────────────────────────────────────
  static isTransferDeadlineDay(date: Date): boolean {
    // January 31 and August 31 are deadline days
    return (date.getMonth() === 0 && date.getDate() === 31) || 
           (date.getMonth() === 7 && date.getDate() === 31);
  }

  static isDeadlineWeek(date: Date): boolean {
    // 7 days before deadline
    const deadline = new Date(date.getFullYear(), date.getMonth() === 7 ? 7 : 0, 31);
    const diff = deadline.getTime() - date.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  }

  static getDaysUntilDeadline(date: Date): number {
    const deadline = new Date(date.getFullYear(), date.getMonth() === 7 ? 7 : 0, 31);
    const diff = deadline.getTime() - date.getTime();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }

  processDeadlineDay(date: Date) {
    if (!WorldManager.isTransferDeadlineDay(date)) return;

    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    // AI clubs make last-minute offers — all DEEP league clubs get deadline activity
    const sellingClubs = this.clubs.filter(c => 
      c.finances.transferBudget > 5000 && deepIds.has(c.leagueId)
    );
    const transferablePlayers = this.players.filter(p => 
      p.transferStatus === 'TRANSFERABLE' || p.isTransferListed
    );

    // Increased AI activity on deadline day
    sellingClubs.forEach(club => {
      if (Math.random() > 0.3) return; // 30% chance per club

      const targets = transferablePlayers.filter(p => 
        p.clubId !== club.id && 
        p.value <= club.finances.transferBudget * 0.5
      );

      if (targets.length === 0) return;
      const target = targets[Math.floor(Math.random() * targets.length)];
      const offerAmount = Math.round(target.value * (0.7 + Math.random() * 0.6));

      const existingOffer = this.offers.find(o => 
        o.playerId === target.id && 
        o.fromClubId === club.id && 
        o.status === 'PENDING'
      );

      if (!existingOffer) {
        const offer: TransferOffer = {
          id: generateUUID(),
          playerId: target.id,
          fromClubId: club.id,
          toClubId: target.clubId,
          amount: offerAmount,
          wageShare: 100,
          type: 'PURCHASE',
          status: 'PENDING',
          date,
          responseDate: date,
          isViewed: false,
        };
        this.offers.push(offer);
      }
    });

    // Deadline day notification
    this.addInboxMessage('MARKET', 'DÍA LÍMITE DE FICHAJES', 
      `¡Hoy cierra el mercado de pase! Se están ultimando los traspasos.`, date, undefined, 'IMPORTANT');

    // Process all pending offers immediately on deadline day
    this.processPendingOffers(date);
  }

  processDeadlineWeekActivity(date: Date) {
    if (!WorldManager.isDeadlineWeek(date)) return;
    const daysLeft = WorldManager.getDaysUntilDeadline(date);

    // Increased AI activity as deadline approaches — all DEEP league clubs
    if (Math.random() > 0.4) return;
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    const clubs = this.clubs.filter(c => c.finances.transferBudget > 5000 && deepIds.has(c.leagueId));
    const club = clubs[Math.floor(Math.random() * clubs.length)];
    if (!club) return;

    const targets = this.players.filter(p => 
      (p.transferStatus === 'TRANSFERABLE' || p.isTransferListed) &&
      p.clubId !== club.id &&
      p.value <= club.finances.transferBudget * 0.4
    );

    if (targets.length === 0) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const offerAmount = Math.round(target.value * (0.8 + Math.random() * 0.5));

    const offer: TransferOffer = {
      id: generateUUID(),
      playerId: target.id,
      fromClubId: club.id,
      toClubId: target.clubId,
      amount: offerAmount,
      wageShare: 100,
      type: 'PURCHASE',
      status: 'PENDING',
      date,
      responseDate: date,
      isViewed: false,
    };
    this.offers.push(offer);

    if (daysLeft <= 2) {
      // Notificación solo si la oferta involucra al club del usuario
      const userClubHere = this.getUserClub();
      if (userClubHere && (club.id === userClubHere.id || target.clubId === userClubHere.id)) {
        this.addInboxMessage('MARKET', `Última oportunidad: ${target.name}`, 
          `${club.name} ha hecho una oferta por ${target.name} - ¡Quedan ${daysLeft} días!`, date, target.id, 'IMPORTANT');
      }
    }
  }

  evaluateBoardConfidence(clubId: string, leaguePosition: number, totalTeams: number, wonCup: boolean, cupSemis: boolean): number {
    const club = this.getClub(clubId);
    if (!club) return 0;
    const obj = club.seasonObjective;
    let confidenceChange = 0;
    switch (obj) {
      case 'WIN_LEAGUE':
        confidenceChange = leaguePosition === 1 ? 15 : leaguePosition <= 4 ? -5 : leaguePosition <= 10 ? -20 : -40;
        break;
      case 'TOP_4':
        confidenceChange = leaguePosition <= 4 ? 12 : leaguePosition <= 8 ? -3 : leaguePosition <= 12 ? -15 : -30;
        break;
      case 'TOP_HALF':
        confidenceChange = leaguePosition <= totalTeams / 2 ? 10 : leaguePosition <= totalTeams * 0.75 ? -8 : -20;
        break;
      case 'AVOID_RELEGATION':
        confidenceChange = leaguePosition > totalTeams - 3 ? 15 : leaguePosition > totalTeams * 0.75 ? 5 : leaguePosition > totalTeams / 2 ? -5 : -15;
        break;
      case 'WIN_CUP':
        confidenceChange = wonCup ? 20 : cupSemis ? 5 : -15;
        break;
      default:
        confidenceChange = leaguePosition <= totalTeams / 2 ? 5 : -5;
    }
    if (wonCup && obj !== 'WIN_CUP') confidenceChange += 10;

    // National team performance bonus
    if (this.nationalTeamManager) {
      const clubCountry = club.country;
      const nationalTeam = this.nationalTeamManager.nationalTeams.find((t: any) => t.country === clubCountry);
      if (nationalTeam) {
        // Check if any club players are in the national team
        const clubPlayersInNational = this.players.filter(p => 
          p.clubId === clubId && nationalTeam.playerIds.includes(p.id)
        );
        
        if (clubPlayersInNational.length > 0) {
          // Bonus for having national team players
          confidenceChange += clubPlayersInNational.length * 2;
          
          // Extra bonus for high-profile national team players
          const starPlayers = clubPlayersInNational.filter(p => p.currentAbility > 120);
          if (starPlayers.length > 0) {
            confidenceChange += starPlayers.length * 3;
          }
        }
      }
    }

    club.boardConfidence = Math.max(0, Math.min(100, club.boardConfidence + confidenceChange));
    if (club.boardConfidence <= 0) {
      this.addInboxMessage('SQUAD', '¡DIRECTIVA HARTA!',
        `La directiva de ${club.name} ha perdido toda la confianza en el entrenador tras los malos resultados.`,
        new Date(), undefined, 'CRITICAL');
    }
    return confidenceChange;
  }

  requestFacilityUpgrade(clubId: string, facility: 'training' | 'youth', date: Date): { success: boolean; cost: number; message: string } {
    const club = this.getClub(clubId);
    if (!club) return { success: false, cost: 0, message: 'Club no encontrado' };
    const currentLevel = facility === 'training' ? club.trainingFacilities : club.youthFacilities;
    if (currentLevel >= 20) return { success: false, cost: 0, message: 'Las instalaciones ya están al máximo nivel' };
    const targetLevel = currentLevel + 1;
    const cost = Math.round(targetLevel * targetLevel * 50000);
    if (club.finances.balance < cost) return { success: false, cost, message: `Fondos insuficientes. Necesitas $${cost.toLocaleString()}` };
    const acceptChance = (club.boardConfidence / 100) * 0.7 + (club.reputation / 10000) * 0.3;
    if (Math.random() > acceptChance) {
      club.boardConfidence = Math.max(0, club.boardConfidence - 5);
      this.addInboxMessage('FINANCE',
        `Directiva rechaza mejora de ${facility === 'training' ? 'entrenamiento' : 'juveniles'}`,
        `La directiva ha rechazado la solicitud de mejora. Consideran que no es el momento adecuado.`,
        date, undefined, 'IMPORTANT');
      return { success: false, cost: 0, message: 'La directiva ha rechazado la solicitud' };
    }
    club.finances.balance -= cost;
    if (facility === 'training') {
      club.trainingFacilities = targetLevel;
      this.addInboxMessage('FINANCE', 'Mejora de instalaciones de entrenamiento',
        `La directiva aprobó la mejora. Nivel de entrenamiento: ${targetLevel}/20. Costo: $${cost.toLocaleString()}`, date);
    } else {
      club.youthFacilities = targetLevel;
      this.addInboxMessage('FINANCE', 'Mejora de instalaciones juveniles',
        `La directiva aprobó la mejora. Nivel juvenil: ${targetLevel}/20. Costo: $${cost.toLocaleString()}`, date);
    }
    return { success: true, cost, message: `Mejora aprobada. Nivel ${targetLevel}.` };
  }

  requestBudgetIncrease(clubId: string, date: Date): { success: boolean; amount: number; message: string } {
    const club = this.getClub(clubId);
    if (!club) return { success: false, amount: 0, message: 'Club no encontrado' };
    const requestedAmount = Math.round(club.finances.transferBudget * 0.3);
    const grantChance = (club.boardConfidence / 100) * 0.6 + (club.reputation / 10000) * 0.4;
    if (Math.random() > grantChance) {
      club.boardConfidence = Math.max(0, club.boardConfidence - 3);
      this.addInboxMessage('FINANCE', 'Directiva rechaza aumento de presupuesto',
        `La directiva no considera prudente aumentar el presupuesto de fichajes en este momento.`, date, undefined, 'IMPORTANT');
      return { success: false, amount: 0, message: 'Rechazado' };
    }
    club.finances.transferBudget += requestedAmount;
    this.addInboxMessage('FINANCE', 'Aumento de presupuesto de fichajes',
      `La directiva aprobó un aumento de $${requestedAmount.toLocaleString()} en el presupuesto de fichajes.`, date);
    return { success: true, amount: requestedAmount, message: `Aprobado: +$${requestedAmount.toLocaleString()}` };
  }

  setSeasonObjective(clubId: string, objective: NonNullable<Club['seasonObjective']>, date: Date): { success: boolean; message: string } {
    const club = this.getClub(clubId);
    if (!club) return { success: false, message: 'Club no encontrado' };
    if (club.seasonObjective === objective) return { success: false, message: 'Ya es el objetivo vigente de la temporada.' };

    const labels: Record<string, string> = {
      WIN_LEAGUE: 'Ganar la Liga', TOP_4: 'Clasificar a competición europea (Top 4)',
      WIN_CUP: 'Ganar la Copa', CUP_SEMIS: 'Alcanzar semifinales de Copa',
      TOP_HALF: 'Terminar en la mitad superior', AVOID_RELEGATION: 'Evitar el descenso',
    };
    // Ambición: objetivos más exigentes tensan la relación con la directiva; los modestos la relajan.
    const ambition: Record<string, number> = {
      WIN_LEAGUE: 6, TOP_4: 4, WIN_CUP: 4, CUP_SEMIS: 2, TOP_HALF: 0, AVOID_RELEGATION: -3,
    };
    const ambitionScore = ambition[objective] ?? 0;
    const acceptChance = (club.boardConfidence / 100) * 0.6 + (club.reputation / 10000) * 0.4;
    if (Math.random() > acceptChance) {
      club.boardConfidence = Math.max(0, club.boardConfidence - 5);
      this.addInboxMessage('SQUAD', 'Directiva rechaza el cambio de objetivo',
        `La directiva ha rechazado tu propuesta de fijar como objetivo \"${labels[objective]}\". Consideran que el momento no es adecuado para cambiar las exigencias.`, date, undefined, 'IMPORTANT');
      return { success: false, message: 'La directiva rechazó la propuesta.' };
    }
    club.seasonObjective = objective;
    club.boardConfidence = Math.max(0, Math.min(100, club.boardConfidence - ambitionScore));
    const confDirection = ambitionScore > 0 ? 'Se esperan exigencias mayores y la directiva estará más pendiente de tus resultados.' : ambitionScore < 0 ? 'La directiva valora tu prudencia y ha relajado la presión sobre el cargo.' : 'La directiva toma nota del objetivo consensuado.';
    this.addInboxMessage('SQUAD', 'Nuevo objetivo de temporada',
      `La directiva ha acordado fijar como objetivo de la temporada: \"${labels[objective]}\". ${confDirection}`, date);
    return { success: true, message: `Objetivo fijado: ${labels[objective]}` };
  }

  checkManagerJobOffers(date: Date, userClubId: string, managerReputation: number): void {
    if (managerReputation < 50) return;
    if (Math.random() > 0.06) return;
    const userClub = this.getClub(userClubId);
    if (!userClub) return;
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    const candidateClubs = this.clubs
      .filter(c => c.id !== userClubId && c.reputation > userClub.reputation * 1.1 && c.reputation <= userClub.reputation * 2.5)
      .filter(c => deepIds.has(c.leagueId)) // Prefer DEEP league clubs for visibility
      .slice(0, 5);
    if (candidateClubs.length === 0) return;
    const target = candidateClubs[randomInt(0, candidateClubs.length - 1)];
    this.addInboxMessage('STATEMENTS', `Oferta de trabajo: ${target.name}`,
      `El club ${target.name} está interesado en contratarte como entrenador. Tu reputación y resultados han llamado su atención.`,
      date, target.id, 'IMPORTANT', true);
  }

addInboxMessage(category: MessageCategory, subject: string, body: string, date: Date, relatedId?: string, priority: NotificationPriority = 'INFO', actionRequired = false) {
     this.inbox.unshift({ id: generateUUID(), date: new Date(date), category, priority, subject, body, isRead: false, relatedId, actionRequired: actionRequired || undefined });
     // Bandeja acotada: evita crecimiento sin límite (memoria, render y barridos diarios)
     if (this.inbox.length > 800) this.inbox.length = 800;
     // Push del navegador solo para asuntos Importantes/Críticos (las INFO no spamean)
     if (priority !== 'INFO') {
       sendInboxNotification(subject, priority);
     }
   }

  checkSquadRegistration(clubId: string, competitionId: string, date: Date): string[] {
    const comp = this.competitions.find(c => c.id === competitionId);
    if (!comp || !comp.squadRegistrationLimit) return [];
    const seniorPlayers = this.getPlayersByClub(clubId).filter(p => p.squad === 'SENIOR');
    const warnings: string[] = [];
    if (seniorPlayers.length > comp.squadRegistrationLimit) {
      warnings.push(`Plantilla excede el límite de ${comp.squadRegistrationLimit} jugadores. Necesitas liberar ${seniorPlayers.length - comp.squadRegistrationLimit} jugadores.`);
    }
    if (comp.u21Requirement) {
      const u21Count = seniorPlayers.filter(p => p.age < 21).length;
      if (u21Count < comp.u21Requirement) {
        warnings.push(`Necesitas al menos ${comp.u21Requirement} jugadores sub-21 en la plantilla (actual: ${u21Count}).`);
      }
    }
    if (warnings.length > 0) {
      this.addInboxMessage('COMPETITION', `Registro de plantilla - ${comp.name}`,
        warnings.join(' '), date, clubId);
    }
    return warnings;
  }

  generateScoutingReport(playerId: string, clubId: string, date: Date, userClubId?: string) {
    const player = this.getPlayer(playerId);
    if (!player) return null;

    const scouts = this.getStaffByClub(clubId).filter(s => s.role !== 'PHYSIO');
    const scoutAbility = scouts.length > 0
      ? scouts.reduce((a,b) => a + b.attributes.judgingAbility, 0) / scouts.length
      : 8;
    const scoutPotential = scouts.length > 0
      ? scouts.reduce((a,b) => a + b.attributes.judgingPotential, 0) / scouts.length
      : 8;

    const abilityError = Math.round((20 - scoutAbility) * (Math.random() * 5 - 2));
    const potentialError = Math.round((20 - scoutPotential) * (Math.random() * 6 - 3));

    const reportedCA = Math.max(1, Math.min(200, player.currentAbility + abilityError));
    const reportedPA = Math.max(1, Math.min(200, player.potentialAbility + potentialError));

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const internalEntries = Object.entries(player.stats.internal).sort(([,a], [,b]) => b - a);

    if (internalEntries[0][1] >= 15) strengths.push(internalEntries[0][0]);
    if (internalEntries.length > 1 && internalEntries[1][1] >= 14) strengths.push(internalEntries[1][0]);
    if (internalEntries[internalEntries.length-1][1] <= 8) weaknesses.push(internalEntries[internalEntries.length-1][0]);

    const summary = reportedCA >= 150 ? "Jugador de clase mundial." :
      reportedCA >= 120 ? "Excelente jugador para el equipo." :
      reportedCA >= 100 ? "Jugador de primer nivel." :
      reportedCA >= 80 ? "Puede ser útil en la rotación." :
      "Jugador de relleno. No recomiendo su fichaje.";

    let personality = player.personality ? PLAYER_PERSONALITY_LABELS[player.personality] : "Equilibrado";

    const report: ScoutingReport = {
      id: generateUUID(),
      playerId,
      clubId,
      date: new Date(date),
      currentAbility: reportedCA,
      potentialAbility: reportedPA,
      summary,
      strengths,
      weaknesses,
      personality,
      isRead: false,
    };

    this.scoutingReports.unshift(report);

    if (clubId === userClubId) {
      this.addInboxMessage('SCOUTING', `Informe de ${player.name}`,
        `Nuestros ojeadores han completado un informe sobre ${player.name}. CA: ${reportedCA}/200, PA: ${reportedPA}/200.`,
        date, playerId
      );
    }

    return report;
  }

  processDailyScouting(date: Date, userClubId?: string) {
    if (!userClubId) return;
    const club = this.getClub(userClubId);
    if (!club) return;
    if (club.finances.scoutingBudget <= 0) return;

    const scouts = this.getStaffByClub(userClubId).filter(s => s.role === 'SCOUT' || s.role === 'HEAD_COACH' || s.role === 'ASSISTANT_MANAGER' || s.role === 'SPORTING_DIRECTOR');
    const scoutCount = Math.max(1, scouts.length);
    const dailyBudget = Math.round(club.finances.scoutingBudget / 365);
    const reportsToday = Math.min(scoutCount * 2, Math.max(1, Math.floor(dailyBudget / 200)));

    for (let i = 0; i < reportsToday; i++) {
      const alreadyReported = new Set(this.scoutingReports.filter(r => r.clubId === userClubId).map(r => r.playerId));
      const candidates = this.players.filter(p =>
        p.clubId !== userClubId &&
        !alreadyReported.has(p.id) &&
        p.age > 16
      );
      if (candidates.length === 0) break;
      const target = candidates[randomInt(0, candidates.length - 1)];
      club.finances.scoutingBudget = Math.max(0, club.finances.scoutingBudget - 150);
      this.generateScoutingReport(target.id, userClubId, date);
    }
  }

  getScoutingReports(clubId: string, limit = 50): ScoutingReport[] {
    return this.scoutingReports
      .filter(r => r.clubId === clubId)
      .slice(0, limit);
  }

  getClubCompetitions(clubId: string): Competition[] {
    const club = this.getClub(clubId);
    if (!club) return [];
    const comps: Competition[] = [];
    const league = this.competitions.find(c => c.id === club.leagueId);
    if (league) comps.push(league);
    if (club.qualifiedFor === 'CONT_LIB') {
      const lib = this.competitions.find(c => c.id === 'CONT_LIB');
      if (lib) comps.push(lib);
    } else if (club.qualifiedFor === 'CONT_SUD') {
      const sud = this.competitions.find(c => c.id === 'CONT_SUD');
      if (sud) comps.push(sud);
    }
    const cup = this.competitions.find(c => c.id === 'C_ARG');
    if (cup) comps.push(cup);
    return comps;
  }


  recalculatePlayerValue(p: Player): number {
    const base = Math.round(p.currentAbility * p.currentAbility * 2000);
    const avgForm = p.formRatings.length > 0
      ? p.formRatings.reduce((a, b) => a + b, 0) / p.formRatings.length
      : 6.5;
    const formMult = 0.7 + (avgForm / 10) * 0.6;
    const agePeak = Math.max(0, 1 - Math.abs(p.age - 26) / 20);
    const ageMult = 0.6 + agePeak * 0.8;
    const monthsLeft = p.contractExpiry
      ? Math.max(0, (p.contractExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      : 12;
    const contractMult = 0.85 + Math.min(monthsLeft, 36) / 200;
    const club = this.getClub(p.clubId);
    const marketMult = club ? this.getMarketMultiplier(club.leagueId) : 1.0;
    return Math.round(base * formMult * ageMult * contractMult * marketMult);
  }

recalculateAllPlayerValues() {
     for (const p of this.players) {
       p.value = this.recalculatePlayerValue(p);
     }
   }

generateYouthIntake(year: number) {
      // Mantener el mundo estable: retiros + purga de agentes libres antes de la nueva cosecha
      this.retireAgingPlayers();
      this.purgeFreeAgents();
      this.clubs.forEach(club => {
        const youthCount = 1 + randomInt(0, Math.min(2, Math.floor(club.youthFacilities / 6)));
        for (let i = 0; i < youthCount; i++) {
          const posPool = [Position.GK, Position.DC, Position.DL, Position.DR, Position.DM, Position.MC, Position.ML, Position.MR, Position.AM, Position.AML, Position.AMR, Position.ST, Position.STR, Position.STL];
          const pos = posPool[randomInt(0, posPool.length - 1)];
          const age = 15 + randomInt(0, 3);
          
          // Determine nationality based on scouting region
          let nationality: string;
          switch (club.scoutingRegion) {
            case 'ARG':
              nationality = 'Argentina';
              break;
            case 'BRA':
              nationality = 'Brasil';
              break;
            case 'URU':
              nationality = 'Uruguay';
              break;
            case 'CHL':
              nationality = 'Chile';
              break;
            case 'COL':
              nationality = 'Colombia';
              break;
            case 'ECU':
              nationality = 'Ecuador';
              break;
            case 'PAR':
              nationality = 'Paraguay';
              break;
            case 'PER':
              nationality = 'Perú';
              break;
            case 'VEN':
              nationality = 'Venezuela';
              break;
            case 'BOL':
              nationality = 'Bolivia';
              break;
            default:
              // GLO or other regions - mostly Argentine with some neighbors
              if (Math.random() < 0.1) nationality = 'Uruguay';
              else if (Math.random() < 0.05) nationality = 'Chile';
              else if (Math.random() < 0.05) nationality = 'Brasil';
              else nationality = 'Argentina';
              break;
          }
          
          const youthBonus = (club.youthFacilities + club.youthRecruitment) / 40;
          const repBonus = club.reputation / 1000;
          const ca = randomInt(30, Math.round(60 + youthBonus * 20 + repBonus * 15));
          const pa = Math.min(200, ca + randomInt(10, 60 + Math.round(youthBonus * 30)));
          const player = this.createRandomPlayer(club.id, pos, age, age, year);
          player.nationality = nationality; // Override the nationality based on scouting region
          player.currentAbility = ca;
          player.potentialAbility = pa;
          player.squad = 'U20';
          player.value = Math.round(ca * pa * 10);
          player.salary = Math.round(ca * 200 / 12);
          this.players.push(player);
        }
      });
    }

  // ─── Youth Development Pipeline ────────────────────────────────────────
  /** Purga agentes libres que ningún club fichará (mundo estable: sin crecimiento infinito). */
  purgeFreeAgents() {
    const removedIds = new Set<string>();
    const survivors: Player[] = [];
    for (const p of this.players) {
      if (p.clubId !== 'FREE_AGENT') continue;
      // Muertos: nadie los va a fichar (liberados de cantera y veteranos descartados)
      if ((p.age >= 20 && p.potentialAbility < 100) || p.age >= 32) {
        removedIds.add(p.id);
        continue;
      }
      survivors.push(p);
    }
    // Tope del mercado de agentes libres: conservar solo los mejores si hay exceso
    const MAX_FREE_AGENTS = 1200;
    if (survivors.length > MAX_FREE_AGENTS) {
      survivors.sort((a, b) => (b.potentialAbility * 10 + b.currentAbility) - (a.potentialAbility * 10 + a.currentAbility));
      for (let i = MAX_FREE_AGENTS; i < survivors.length; i++) removedIds.add(survivors[i].id);
    }
    if (removedIds.size === 0) return;
    this.players = this.players.filter(p => !removedIds.has(p.id));
    this.pruneRemovedPlayerRefs(removedIds);
    this.markPlayersDirty();
  }

  /** Jubila a jugadores de club en edad avanzada (cierra el ciclo cantera↔retiro → mundo estable). */
  retireAgingPlayers() {
    const removedIds = new Set<string>();
    for (const p of this.players) {
      if (p.clubId === 'FREE_AGENT') continue;
      const isOld = p.age >= 34 || (p.age >= 32 && p.developmentTrend === 'DECLINING' && p.currentAbility < 100);
      if (isOld) removedIds.add(p.id);
    }
    if (removedIds.size === 0) return;
    this.players = this.players.filter(p => !removedIds.has(p.id));
    this.pruneRemovedPlayerRefs(removedIds);
    this.markPlayersDirty();
  }

  /** Limpia referencias a jugadores removidos (informes, ofertas, selecciones y relaciones). */
  private pruneRemovedPlayerRefs(removedIds: Set<string>) {
    this.scoutingReports = this.scoutingReports.filter(r => !removedIds.has(r.playerId));
    this.offers = this.offers.filter(o => !removedIds.has(o.playerId));
    const ntm = this.nationalTeamManager as any;
    if (ntm?.nationalTeams) {
      for (const t of ntm.nationalTeams) {
        if (Array.isArray(t.playerIds)) t.playerIds = t.playerIds.filter((id: string) => !removedIds.has(id));
      }
    }
    for (const a of Object.keys(this.relationshipWeb)) {
      if (removedIds.has(a)) { delete this.relationshipWeb[a]; continue; }
      for (const b of Object.keys(this.relationshipWeb[a])) {
        if (removedIds.has(b)) delete this.relationshipWeb[a][b];
      }
    }
  }

  getYouthPlayers(clubId: string): Player[] {
    return this.getPlayersByClub(clubId).filter(p => p.squad === 'U20');
  }

  isPlayerReadyForPromotion(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || player.squad !== 'U20') return false;
    
    // Ready if: age >= 18, CA >= 80, or PA > 140 and age >= 17
    const isReady = player.age >= 18 && player.currentAbility >= 80;
    const isHighPotential = player.potentialAbility > 140 && player.age >= 17;
    
    return isReady || isHighPotential;
  }

  promoteToFirstTeam(playerId: string): boolean {
    const player = this.getPlayer(playerId);
    if (!player || player.squad !== 'U20') return false;
    
    const club = this.getClub(player.clubId);
    if (!club) return false;

    // Check if first team has space (max 30 players)
    const seniorPlayers = this.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
    if (seniorPlayers.length >= 30) return false;

    player.squad = 'SENIOR';
    player.value = Math.round(player.value * 1.5);
    player.salary = Math.round(player.salary * 2);
    
    this.addInboxMessage('SQUAD', `Promovido: ${player.name}`, 
      `${player.name} ha sido promovido del sub-20 al primer equipo de ${club.name}.`, new Date(), player.id);
    
    return true;
  }

  autoPromoteYouthPlayers(date: Date) {
    // Auto-promote eligible U20 players at end of season (June)
    if (date.getMonth() !== 5 || date.getDate() !== 30) return;
    let released = false;

    this.clubs.forEach(club => {
      const youthPlayers = this.getYouthPlayers(club.id);
      const seniorCount = this.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR').length;
      
      youthPlayers.forEach(player => {
        if (this.isPlayerReadyForPromotion(player.id) && seniorCount < 30) {
          this.promoteToFirstTeam(player.id);
        }
      });

      // Release low-potential U20 players over 19
      youthPlayers.forEach(player => {
        if (player.age >= 19 && player.potentialAbility < 100) {
          player.clubId = 'FREE_AGENT';
          player.squad = 'U20';
          released = true;
        }
      });
    });
    // Reconstruir los índices una sola vez (no por cada liberación)
    if (released) this.markPlayersDirty();
  }

  developYouthPlayers(date: Date) {
    // Monthly youth development
    if (date.getDate() !== 1) return;

    this.clubs.forEach(club => {
      const youthPlayers = this.getYouthPlayers(club.id);
      const facilityBonus = (club.youthFacilities + club.youthRecruitment) / 40;
      
      youthPlayers.forEach(player => {
        // Natural growth based on age and potential
        if (player.age < 21) {
          const growthRate = facilityBonus * 0.3 + (player.potentialAbility - player.currentAbility) / 100;
          const growth = Math.max(0, Math.round(growthRate * (1 + Math.random() * 0.5)));
          
          if (player.currentAbility < player.potentialAbility) {
            player.currentAbility = Math.min(player.potentialAbility, player.currentAbility + growth);
          }
          
          // Update stats based on new CA
          const caRatio = player.currentAbility / 200;
          player.stats.visible.fisico = Math.min(20, Math.round(8 + caRatio * 12));
          player.stats.visible.mental = Math.min(20, Math.round(7 + caRatio * 13));
          player.stats.visible.tecnica = Math.min(20, Math.round(6 + caRatio * 14));
        }
        
        // Update value
        player.value = Math.round(player.currentAbility * player.potentialAbility * 10);
      });
    });
  }

  // --- MEDIA NEWS SYSTEM ---

  generateMatchNews(fixture: Fixture, homeScore: number, awayScore: number, date: Date) {
    const homeClub = this.getClub(fixture.homeTeamId);
    const awayClub = this.getClub(fixture.awayTeamId);
    if (!homeClub || !awayClub) return;
    const isUserMatch = homeClub.id === this.getUserClub()?.id || awayClub.id === this.getUserClub()?.id;
    const featured = Math.abs(homeScore - awayScore) >= 4; // goleadas a portada

    if (homeScore > awayScore) {
      this.publishNews('RESULTADOS', {
        type: 'HEADLINE',
        headline: `${homeClub.shortName} se impone al ${awayClub.shortName}`,
        subheadline: `${homeScore} - ${awayScore}`,
        body: `${homeClub.name} logró una victoria importante ante ${awayClub.name} por ${homeScore}-${awayScore}. El equipo mostró solidez tanto en ataque como en defensa.`,
        clubId: homeClub.id, competitionId: fixture.competitionId,
        featured,
      });
    } else if (awayScore > homeScore) {
      this.publishNews('RESULTADOS', {
        type: 'HEADLINE',
        headline: `${awayClub.shortName} derrota a ${homeClub.shortName}`,
        subheadline: `${awayScore} - ${homeScore}`,
        body: `${awayClub.name} se llevó los tres puntos ante ${homeClub.name} con un contundente ${awayScore}-${homeScore}.`,
        clubId: awayClub.id, competitionId: fixture.competitionId,
        featured,
      });
    } else {
      this.publishNews('RESULTADOS', {
        type: 'FEATURE',
        headline: `${homeClub.shortName} y ${awayClub.shortName} empatan`,
        subheadline: `${homeScore} - ${awayScore}`,
        body: `Un vibrante empate ${homeScore}-${awayScore} entre ${homeClub.name} y ${awayClub.name} deja la tabla más pareja que nunca.`,
        clubId: homeClub.id, competitionId: fixture.competitionId,
      });
    }
  }

  generateTransferNews(player: Player, fromClub: Club, toClub: Club, amount: number, date: Date) {
    this.publishNews('MERCADO', {
      type: 'HEADLINE',
      headline: `${player.name} ficha por ${toClub.shortName}`,
      subheadline: `Traspaso: $${amount.toLocaleString()}`,
      body: `El jugador ${player.name} deja ${fromClub.name} para unirse a ${toClub.name} en un movimiento que sacude el mercado.`,
      clubId: toClub.id, playerId: player.id,
    });
  }

  generateInjuryNews(player: Player, club: Club, date: Date) {
    this.publishNews('LESIONES', {
      type: 'CRITICISM',
      headline: `Duro golpe para ${club.shortName}: ${player.name} lesionado`,
      subheadline: `Fuera de los terrenos de juego`,
      body: `${player.name} sufre una lesión que lo dejará fuera de las canchas por varias semanas. Un golpe duro para las aspiraciones de ${club.name}.`,
      clubId: club.id, playerId: player.id,
    });
  }

  /** Noticias de diario derivadas del estado real del mundo, con secciones reales. */
  generateGeneralNews(date: Date) {
    const leagues = this.getLeagues().filter(l => (l.dynamicReputation || 0) >= 40);
    if (leagues.length === 0) return;
    const league = leagues[randomInt(0, leagues.length - 1)];
    const clubs = this.getClubsByLeague(league.id);
    if (clubs.length < 2) return;
    const a = clubs[randomInt(0, clubs.length - 1)];
    let b = clubs[randomInt(0, clubs.length - 1)];
    while (b.id === a.id) b = clubs[randomInt(0, clubs.length - 1)];
    const senior = this.getPlayersByClub(a.id).filter(p => p.squad === 'SENIOR');
    const star = senior[randomInt(0, Math.max(0, senior.length - 1))];
    const roll = randomInt(0, 5);

    if (roll === 0 && star) {
      // Mercado: rumor de salida
      this.publishNews('MERCADO', {
        type: 'RUMOR',
        headline: `${star.name}: ¿rumores de salida?`,
        subheadline: `El mercado sigue activo en ${league.name}`,
        body: `En ${league.name} crece la especulación alrededor de ${a.name}. Medios locales apuntan a posibles movimientos en los próximos días, aunque el club desmiente versiones de salidas.`,
        clubId: a.id, playerId: star.id, competitionId: league.id,
      });
    } else if (roll === 1) {
      // Resultados: duelo destacado de la fecha
      this.publishNews('RESULTADOS', {
        type: 'FEATURE',
        headline: `${a.shortName} vs ${b.shortName}: choque de estilos`,
        subheadline: `La jornada de ${league.name} tiene un duelo atractivo`,
        body: `El duelo destacado de la fecha en ${league.name} enfrenta a ${a.name} y ${b.name}. Ambos llegan con aspiraciones distintas pero con la misma necesidad de sumar.`,
        clubId: a.id, competitionId: league.id,
      });
    } else if (roll === 2) {
      // Cantera: promesa en alza
      const youth = this.getPlayersByClub(a.id).find(p => p.squad === 'U20' && p.potentialAbility >= 140);
      this.publishNews('TU_CLUB', {
        type: 'PRAISE',
        headline: `La cantera de ${a.shortName} ilusiona`,
        subheadline: youth ? `${youth.name} es la gran promesa` : 'Jóvenes valores en ascenso',
        body: youth
          ? `En ${a.name} destacan al juvenil ${youth.name}, una de las grandes promesas de la sub-20. Su potencial genera expectativas en el cuerpo técnico.`
          : `El trabajo en las divisiones formativas de ${a.name} da frutos: varios juveniles piden pista en el primer equipo.`,
        clubId: a.id, playerId: youth?.id,
      });
    } else if (roll === 3) {
      // Internacional: calendario de selecciones
      this.publishNews('INTERNACIONAL', {
        type: 'FEATURE',
        headline: `Las ligas del mundo, en plena ebullición`,
        subheadline: `Selecciones y copas marcan el calendario`,
        body: `El calendario internacional condiciona a los clubes: los próximos compromisos de selecciones obligan a los técnicos a gestionar minutos y descansos de sus figuras.`,
        competitionId: league.id,
      });
    } else if (roll === 4) {
      // Lesiones: parte médico de la fecha
      const injured = this.players.find(p => p.injury && p.injury.daysLeft >= 10);
      this.publishNews('LESIONES', {
        type: 'CRITICISM',
        headline: injured ? `Preocupación por ${injured.name}` : 'El parte médico de la fecha',
        subheadline: injured ? `${injured.injury!.type} (${injured.injury!.daysLeft} días)` : 'Sin novedades graves',
        body: injured
          ? `${injured.name} arrastra una ${injured.injury!.type} y podría perderse los próximos compromisos. El cuerpo médico sigue de cerca su evolución.`
          : `La jornada deja un parte médico tranquilo en las principales ligas: sin lesiones de larga duración que lamentar.`,
        clubId: injured?.clubId, playerId: injured?.id,
      });
    } else {
      // Clasificación: el club a vencer por jerarquía
      const top = [...clubs].sort((x, y) => y.reputation - x.reputation)[0];
      this.publishNews('CLASIFICACION', {
        type: 'PRAISE',
        headline: `${top.shortName} marca la pauta en ${league.name}`,
        subheadline: `El club a vencer de la temporada`,
        body: `${top.name} es, por jerarquía, el gran candidato en ${league.name}. El resto de los equipos miran al líder con respeto mientras la temporada avanza.`,
        clubId: top.id, competitionId: league.id,
      });
    }
  }

  /** Emite una noticia al diario. Si involucra al club del usuario queda etiquetada como "Tu club". */
  publishNews(section: NewsSection, data: Partial<MediaNews> & { headline: string; subheadline?: string; body: string }) {
    const userClub = this.getUserClub();
    const involvesUser = userClub && (
      data.isUserClubNews ||
      data.clubId === userClub.id ||
      (data.playerId ? this.getPlayer(data.playerId)?.clubId === userClub.id : false)
    );
    this.mediaNews.unshift({
      id: generateUUID(),
      date: new Date(data.date || new Date()),
      type: data.type || 'FEATURE',
      section,
      headline: data.headline,
      subheadline: data.subheadline || '',
      body: data.body,
      clubId: data.clubId,
      competitionId: data.competitionId,
      playerId: data.playerId,
      isUserClubNews: !!involvesUser,
      read: false,
      featured: data.featured,
    });
    if (this.mediaNews.length > 100) this.mediaNews.pop();
  }

  /** Resumen semanal de clasificación (sección Clasificación del diario). */
  generateStandingsNews(date: Date, fixtures: Fixture[]) {
    const leagues = this.getLeagues()
      .filter(l => (l.dynamicReputation || 0) >= 40)
      .sort((a, b) => (b.dynamicReputation || 0) - (a.dynamicReputation || 0))
      .slice(0, 5);
    for (const comp of leagues) {
      if (Math.random() > 0.6) continue; // no todas las ligas todas las semanas
      const table = this.getLeagueTable(comp.id, fixtures, 'SENIOR');
      if (table.length < 4) continue;
      const leader = table[0];
      const leaderClub = this.getClub(leader.clubId);
      const last = table[table.length - 1];
      const lastClub = this.getClub(last.clubId);
      const roll = randomInt(0, 3);
      if (roll === 0 && leaderClub) {
        this.publishNews('CLASIFICACION', {
          type: 'HEADLINE',
          headline: `${leaderClub.shortName} manda en ${comp.name}`,
          subheadline: `${leader.points} pts, líder con ${leader.played} partidos jugados`,
          body: `${leaderClub.name} se afirma en lo más alto de ${comp.name} con ${leader.points} puntos. Su diferencia de gol (${leader.gd > 0 ? '+' : ''}${leader.gd}) marca la diferencia en la lucha por el título.`,
          clubId: leaderClub.id, competitionId: comp.id,
        });
      } else if (roll === 1 && lastClub) {
        this.publishNews('CLASIFICACION', {
          type: 'CRITICISM',
          headline: `${lastClub.shortName}, en la cuerda floja en ${comp.name}`,
          subheadline: `Colista con ${last.points} puntos`,
          body: `${lastClub.name} cierra la tabla de ${comp.name} y ya siente el calor de la zona de descenso. Solo ${last.points} puntos en ${last.played} jornadas ponen al club en máxima alerta.`,
          clubId: lastClub.id, competitionId: comp.id,
        });
      } else {
        const climber = table[Math.max(1, Math.floor(table.length * 0.4))];
        const climberClub = this.getClub(climber.clubId);
        if (climberClub) {
          this.publishNews('CLASIFICACION', {
            type: 'PRAISE',
            headline: `${climberClub.shortName} acecha los puestos de arriba`,
            subheadline: `${climber.points} pts en ${comp.name}`,
            body: `${climberClub.name} firma una campaña sólida en ${comp.name} y mira hacia la parte alta de la tabla. Con ${climber.points} puntos, el equipo ilusiona a su afición.`,
            clubId: climberClub.id, competitionId: comp.id,
          });
        }
      }
    }
  }

  /** Simulación semanal de ceses y nombramientos de entrenadores en el mundo (sección Despidos). */
  simulateCoachChanges(date: Date, fixtures?: Fixture[]) {
    const userClubId = this.managerProfile?.currentClubId;
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    const candidates = this.clubs.filter(c =>
      c.id !== userClubId &&
      deepIds.has(c.leagueId) &&
      this.staff.some(s => s.role === 'HEAD_COACH' && s.clubId === c.id)
    );
    let firedCount = 0;
    for (const club of candidates) {
      if (Math.random() > 0.05) continue; // gate semanal por club
      const board = club.boardConfidence ?? 50;
      let pressure = (100 - board) / 300; // baja confianza de la directiva
      if (fixtures && club.leagueId) {
        const table = this.getLeagueTable(club.leagueId, fixtures, 'SENIOR');
        const rank = table.findIndex(e => e.clubId === club.id) + 1;
        if (rank > 0 && rank > Math.ceil(table.length * 0.75)) pressure += 0.5; // zona de descenso
        else if (rank > 0 && rank <= 4) pressure -= 0.4;
      }
      const prob = Math.min(0.35, Math.max(0.02, pressure));
      if (Math.random() > prob) continue;
      if (this.fireAndReplaceCoach(club, date)) {
        firedCount++;
        if (firedCount >= 3) break;
      }
    }
  }

  /** Destituye al DT de un club IA y nombra reemplazante; emite noticia de la sección Despidos. */
  private fireAndReplaceCoach(club: Club, date: Date): boolean {
    const fired = this.staff.find(s => s.role === 'HEAD_COACH' && s.clubId === club.id);
    if (!fired) return false;
    let replacement = this.staff.find(s => s.role === 'HEAD_COACH' && s.clubId === '' && s.id !== fired.id);
    if (!replacement) {
      replacement = this.staff.find(s =>
        (s.role === 'ASSISTANT_MANAGER' || s.role === 'RESERVE_MANAGER' || s.role === 'YOUTH_MANAGER') && s.clubId === club.id
      );
    }
    if (replacement) {
      replacement.clubId = club.id;
      if (replacement.role !== 'HEAD_COACH') replacement.role = 'HEAD_COACH'; // promoción interna
    } else {
      replacement = this.createRandomHeadCoach(club.id, date);
      this.staff.push(replacement);
    }
    fired.clubId = ''; // queda desempleado
    club.boardConfidence = Math.min(100, (club.boardConfidence ?? 50) + 10); // efecto nuevo DT
    this.publishNews('DESPIDOS', {
      type: 'HEADLINE',
      headline: `${club.shortName} destituye a ${fired.name}`,
      subheadline: `${replacement.name} asume el banquillo`,
      body: `La directiva de ${club.name} decidió prescindir de ${fired.name} como entrenador. El equipo no cumplió con las expectativas y ${replacement.name} tomará el mando de inmediato.`,
      clubId: club.id,
    });
    return true;
  }

  /** Crea un DT nuevo para reemplazos (club IA). */
  private createRandomHeadCoach(clubId: string, date: Date): Staff {
    const club = this.getClub(clubId);
    const style = COACH_STYLES[randomInt(0, COACH_STYLES.length - 1)];
    return {
      id: generateUUID(),
      name: `${STAFF_NAMES.names[randomInt(0, STAFF_NAMES.names.length - 1)]} ${STAFF_NAMES.surnames[randomInt(0, STAFF_NAMES.surnames.length - 1)]}`,
      age: randomInt(38, 62),
      nationality: club?.country || 'Argentina',
      role: 'HEAD_COACH',
      clubId,
      attributes: {
        coaching: weightedRandom(8, 20),
        judgingAbility: weightedRandom(8, 20),
        judgingPotential: weightedRandom(8, 20),
        tacticalKnowledge: weightedRandom(10, 20),
        adaptability: weightedRandom(5, 20),
        medical: 5,
        physiotherapy: 5,
        motivation: weightedRandom(8, 20),
        manManagement: weightedRandom(8, 20),
      },
      salary: Math.round(randomInt(3000, 15000)),
      contractExpiry: new Date(date.getFullYear() + 1, 5, 30),
      history: [],
      personality: ['LEADER', 'PASSIONATE', 'CALM', 'DISCIPLINARIAN', 'VISIONARY'][randomInt(0, 4)],
      morale: 70,
      reputation: 50,
      relationships: {},
      pressReputation: 50,
      boardRelationship: 60,
      tacticalStyle: style,
      preferredFormation: COACH_FORMATIONS[randomInt(0, COACH_FORMATIONS.length - 1)],
      playingStyle: COACH_PLAYING_STYLE[style],
      pressIntensity: (['LOW', 'MEDIUM', 'HIGH'] as const)[randomInt(0, 2)],
      possessionVsCounter: (['POSSESSION', 'COUNTER', 'BALANCED'] as const)[randomInt(0, 2)],
    };
  }

  getUserClubNews(limit = 20): MediaNews[] {
    const userClub = this.getUserClub();
    if (!userClub) return this.mediaNews.slice(0, limit);
    return this.mediaNews.filter(n => n.isUserClubNews || n.clubId === userClub.id).slice(0, limit);
  }

  getAllNews(limit = 50): MediaNews[] {
    return this.mediaNews.slice(0, limit);
  }

  getUserClub() {
    const userClubId = this.managerProfile?.currentClubId;
    return userClubId ? this.getClub(userClubId) : undefined;
  }
}

export const world = new WorldManager();
