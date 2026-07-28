
import { Player, Club, Competition, Position, PlayerStats, PlayerMatchStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, TransferOffer, InboxMessage, MessageCategory, MediaNews, TacticalStyle, TacticSettings, MatchSettings, ScoutingReport, InteractionLogEntry, ReputationalBuff } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";
import { TACTIC_PRESETS, NAMES_DB, REGEN_DB, STAFF_NAMES, POS_DEFINITIONS, ARG_PRIMERA, ARG_NACIONAL, CONT_CLUBS, CONT_CLUBS_TIER2, WORLD_BOSSES, BRA_SERIE_A, BRA_SERIE_B, ESP_LA_LIGA, ITA_SERIE_A, DEU_BUNDESLIGA, FRA_LIGUE_1, PRT_LIGA, NLD_EREDIVISIE, MEX_LIGA_MX, USA_MLS, JPN_J1, ENG_PREMIER, CHI_PRIMERA, COL_LIGA, URY_PRIMERA, ECU_LIGA_PRO, PRY_DIVISION, BOL_DIVISION, VEN_LIGA, PER_LIGA1, PRY_DIVISION_B, DEU_2_BUNDESLIGA, FRA_LIGUE_2, ITA_SERIE_B, ENG_CHAMPIONSHIP, JPN_J2, RealClubDef } from "../data/static";
import { REAL_PLAYERS_DB, RealPlayerDef } from "../data/realPlayers";
import { SLOT_CONFIG } from "./engine";
import { sendTransferNotification, sendInboxNotification } from "./notifications";

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
     pauseAtHalftime: true
  };
  scoutingReports: ScoutingReport[] = [];
  interactionLog: InteractionLogEntry[] = [];
  activeReputationalBuffs: ReputationalBuff[] = [];
  relationshipWeb: Record<string, Record<string, { trust: number; respect: number; tension: number }>> = {};

  constructor() { this.initWorld(); }

   initWorld() {
     this.competitions = [
       { id: "L_ARG_1", name: "Liga Profesional", country: "Argentina", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 5000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_ARG_2", name: "Primera Nacional", country: "Argentina", type: 'LEAGUE', tier: 2, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 1000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_BRA_1", name: "Brasileirao Serie A", country: "Brasil", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 6000000, squadRegistrationLimit: 30, u21Requirement: 5 },
       { id: "L_BRA_2", name: "Brasileirao Serie B", country: "Brasil", type: 'LEAGUE', tier: 2, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2000000, squadRegistrationLimit: 30, u21Requirement: 5 },
       { id: "L_CHI_1", name: "Primera División", country: "Chile", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2500000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_COL_1", name: "Liga BetPlay", country: "Colombia", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2500000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_URY_1", name: "Primera División", country: "Uruguay", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_ECU_1", name: "Liga Pro", country: "Ecuador", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_PRY_1", name: "División Profesional", country: "Paraguay", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 1800000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_BOL_1", name: "División Profesional", country: "Bolivia", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 1200000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_VEN_1", name: "Liga FUTVE", country: "Venezuela", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 1200000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_PER_1", name: "Liga 1", country: "Perú", type: 'LEAGUE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 1500000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_ESP_1", name: "LaLiga EA Sports", country: "España", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 12000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_ITA_1", name: "Serie A", country: "Italia", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 11000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_DEU_1", name: "Bundesliga", country: "Alemania", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 10000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_FRA_1", name: "Ligue 1", country: "Francia", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 8000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_PRT_1", name: "Liga Portugal", country: "Portugal", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 7000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_NLD_1", name: "Eredivisie", country: "Países Bajos", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 5000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_ENG_1", name: "Premier League", country: "Inglaterra", type: 'LEAGUE', tier: 1, continent: "Europa", confederation: "UEFA", defaultPrizePool: 14000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_MEX_1", name: "Liga MX", country: "México", type: 'LEAGUE', tier: 1, continent: "América del Norte", confederation: "CONCACAF", defaultPrizePool: 4000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_USA_1", name: "MLS", country: "USA", type: 'LEAGUE', tier: 1, continent: "América del Norte", confederation: "CONCACAF", defaultPrizePool: 5000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_JPN_1", name: "J1 League", country: "Japón", type: 'LEAGUE', tier: 1, continent: "Asia", confederation: "AFC", defaultPrizePool: 5000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_ESP_2", name: "LaLiga Hypermotion", country: "España", type: 'LEAGUE', tier: 2, continent: "Europa", confederation: "UEFA", defaultPrizePool: 2000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_ITA_2", name: "Serie B", country: "Italia", type: 'LEAGUE', tier: 2, continent: "Europa", confederation: "UEFA", defaultPrizePool: 1500000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_DEU_2", name: "2. Bundesliga", country: "Alemania", type: 'LEAGUE', tier: 2, continent: "Europa", confederation: "UEFA", defaultPrizePool: 1200000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_FRA_2", name: "Ligue 2", country: "Francia", type: 'LEAGUE', tier: 2, continent: "Europa", confederation: "UEFA", defaultPrizePool: 1000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_ENG_2", name: "Championship", country: "Inglaterra", type: 'LEAGUE', tier: 2, continent: "Europa", confederation: "UEFA", defaultPrizePool: 5000000, squadRegistrationLimit: 25, u21Requirement: 3 },
       { id: "L_JPN_2", name: "J2 League", country: "Japón", type: 'LEAGUE', tier: 2, continent: "Asia", confederation: "AFC", defaultPrizePool: 2000000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "L_PRY_2", name: "División Intermedia", country: "Paraguay", type: 'LEAGUE', tier: 2, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 800000, squadRegistrationLimit: 28, u21Requirement: 4 },
       { id: "C_ARG", name: "Copa Argentina", country: "Argentina", type: 'CUP', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 2000000 },
       { id: "CONT_LIB", name: "Copa Libertadores", country: "Sudamérica", type: 'CONTINENTAL_ELITE', tier: 1, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 8000000 },
       { id: "CONT_SUD", name: "Copa Sudamericana", country: "Sudamérica", type: 'CONTINENTAL_SMALL', tier: 2, continent: "América del Sur", confederation: "CONMEBOL", defaultPrizePool: 3000000 },
       { id: "W_CLUB", name: "Mundial de Clubes", country: "Global", type: 'GLOBAL', tier: 1, continent: "Global", confederation: "FIFA", defaultPrizePool: 5000000 },
     ];

     this.loadRealClubs(ARG_PRIMERA, "L_ARG_1");
     this.loadRealClubs(ARG_NACIONAL, "L_ARG_2");
     this.loadRealClubs([...CONT_CLUBS, ...CONT_CLUBS_TIER2], "L_SAM_OTHER");
     this.loadRealClubs(BRA_SERIE_A, "L_BRA_1");
     this.loadRealClubs(BRA_SERIE_B, "L_BRA_2");
     this.loadRealClubs(ESP_LA_LIGA, "L_ESP_1");
     this.loadRealClubs(ITA_SERIE_A, "L_ITA_1");
     this.loadRealClubs(DEU_BUNDESLIGA, "L_DEU_1");
     this.loadRealClubs(FRA_LIGUE_1, "L_FRA_1");
     this.loadRealClubs(PRT_LIGA, "L_PRT_1");
     this.loadRealClubs(NLD_EREDIVISIE, "L_NLD_1");
     this.loadRealClubs(ENG_PREMIER, "L_ENG_1");
     this.loadRealClubs(MEX_LIGA_MX, "L_MEX_1");
     this.loadRealClubs(USA_MLS, "L_USA_1");
     this.loadRealClubs(JPN_J1, "L_JPN_1");
     this.loadRealClubs(CHI_PRIMERA, "L_CHI_1");
     this.loadRealClubs(COL_LIGA, "L_COL_1");
     this.loadRealClubs(URY_PRIMERA, "L_URY_1");
     this.loadRealClubs(ECU_LIGA_PRO, "L_ECU_1");
     this.loadRealClubs(PRY_DIVISION, "L_PRY_1");
     this.loadRealClubs(BOL_DIVISION, "L_BOL_1");
     this.loadRealClubs(VEN_LIGA, "L_VEN_1");
     this.loadRealClubs(PER_LIGA1, "L_PER_1");
     this.loadRealClubs(PRY_DIVISION_B, "L_PRY_2");
     this.loadRealClubs(ENG_CHAMPIONSHIP, "L_ENG_2");
     this.loadRealClubs(DEU_2_BUNDESLIGA, "L_DEU_2");
     this.loadRealClubs(FRA_LIGUE_2, "L_FRA_2");
     this.loadRealClubs(ITA_SERIE_B, "L_ITA_2");
     this.loadRealClubs(JPN_J2, "L_JPN_2");
     this.loadRealClubs(WORLD_BOSSES, "L_EUR_ELITE");

     this.players.forEach(p => {
        if (!p.relationships) p.relationships = {};
        if (Math.random() < 0.08) {
           if (p.age < 22 && p.currentAbility < 120 && p.potentialAbility > 140) p.transferStatus = 'LOANABLE';
           else if (p.age > 28) p.transferStatus = 'TRANSFERABLE';
        }
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
               scoutingBudget: def.rep * 100
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
              u21MinutesThisSeason: 0
          };
        this.clubs.push(club);
        this.injectRealPlayers(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
     });
  }

   getClub(id: string) { return this.clubs.find(c => c.id === id); }
   getPlayer(id: string) { return this.players.find(p => p.id === id); }
   getPlayersByClub(clubId: string) { return this.players.filter(p => p.clubId === clubId); }
   getStaffByClub(clubId: string) { return this.staff.filter(s => s.clubId === clubId); }
   getLeagues() { return this.competitions.filter(c => c.type === 'LEAGUE'); }
   getTactics() { return this.tactics; }

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
     const birthDate = new Date(2008 - age, randomInt(0, 11), randomInt(1, 28));
     const caBase = def.ca / 10;

     const stats: PlayerStats = {
        mental: { 
           aggression: weightedRandom(caBase - 4, caBase + 4), anticipation: weightedRandom(caBase - 3, caBase + 4),
           bravery: weightedRandom(caBase - 4, caBase + 4), composure: weightedRandom(caBase - 3, caBase + 4),
           concentration: weightedRandom(caBase - 4, caBase + 4), decisions: weightedRandom(caBase - 3, caBase + 4),
           determination: randomInt(10, 20), flair: weightedRandom(caBase - 5, caBase + 5),
           leadership: weightedRandom(caBase - 5, caBase + 5), offTheBall: weightedRandom(caBase - 4, caBase + 4),
           positioning: weightedRandom(caBase - 4, caBase + 4), teamwork: weightedRandom(caBase - 4, caBase + 4),
           vision: weightedRandom(caBase - 4, caBase + 4), workRate: weightedRandom(caBase - 4, caBase + 4),
           professionalism: randomInt(10, 20), ambition: randomInt(10, 20), pressure: randomInt(10, 20),
           temperament: randomInt(5, 20), loyalty: randomInt(10, 20), adaptability: weightedRandom(10, 20),
           sportsmanship: weightedRandom(5, 20)
        },
        technical: {
           corners: weightedRandom(caBase - 5, caBase + 5), crossing: weightedRandom(caBase - 5, caBase + 5),
           dribbling: weightedRandom(caBase - 5, caBase + 5), finishing: weightedRandom(caBase - 5, caBase + 5),
           firstTouch: weightedRandom(caBase - 3, caBase + 4), freeKickTaking: weightedRandom(caBase - 5, caBase + 5),
           heading: weightedRandom(caBase - 5, caBase + 5), longShots: weightedRandom(caBase - 5, caBase + 5),
           longThrows: weightedRandom(caBase - 5, caBase + 5), marking: weightedRandom(caBase - 5, caBase + 5),
           passing: weightedRandom(caBase - 4, caBase + 4), penaltyTaking: weightedRandom(caBase - 5, caBase + 5),
           tackling: weightedRandom(caBase - 5, caBase + 5), technique: weightedRandom(caBase - 3, caBase + 4)
        },
        physical: {
           acceleration: weightedRandom(caBase - 4, caBase + 4), agility: weightedRandom(caBase - 4, caBase + 4),
           balance: weightedRandom(caBase - 4, caBase + 4), jumpingReach: weightedRandom(caBase - 4, caBase + 4),
           naturalFitness: weightedRandom(caBase - 2, caBase + 4), pace: weightedRandom(caBase - 4, caBase + 4),
           stamina: weightedRandom(caBase - 4, caBase + 4), strength: weightedRandom(caBase - 4, caBase + 4)
        }
     };

     if (primaryPos === Position.GK) {
        stats.goalkeeping = {
           aerialReach: weightedRandom(caBase - 3, caBase + 4), commandOfArea: weightedRandom(caBase - 3, caBase + 4),
           communication: weightedRandom(caBase - 3, caBase + 4), eccentricity: weightedRandom(1, 15),
           handling: weightedRandom(caBase - 3, caBase + 4), kicking: weightedRandom(caBase - 3, caBase + 4),
           oneOnOnes: weightedRandom(caBase - 3, caBase + 4), reflexes: weightedRandom(caBase - 3, caBase + 4),
           rushingOut: weightedRandom(caBase - 3, caBase + 4), punching: weightedRandom(caBase - 3, caBase + 4),
           throwing: weightedRandom(caBase - 3, caBase + 4)
        };
     }

      return {
         id: generateUUID(), name: def.name, photo: def.photo, age: age, birthDate,
         height: 180, weight: 75, nationality: def.nationality, positions: [primaryPos], secondaryPositions: [],
         stats, seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 },
         statsByCompetition: {}, history: [], currentAbility: def.ca, potentialAbility: def.pa,
         reputation: def.ca * 45, fitness: 100, morale: 100, clubId, isStarter: false, squad: 'SENIOR',
         value: Math.round(def.ca * def.ca * 2500), salary: Math.round(def.ca * 2500 / 10) * 10,
         transferStatus: 'NONE', contractExpiry: new Date(2010, 5, 30), loyalty: stats.mental.loyalty,
         negotiationAttempts: 0, isUnhappyWithContract: false, developmentTrend: 'STABLE', yellowCardsAccumulated: 0,
         formRatings: [], isTransferListed: false,
         injuryHistory: [], injuryProneness: Math.max(0.01, (20 - stats.physical.naturalFitness) * 0.02),
         relationships: {}
      };
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
      });
    });
  }

  generateStaffForClub(clubId: string) {
    const roles: StaffRole[] = ['HEAD_COACH', 'ASSISTANT_MANAGER', 'PHYSIO', 'FITNESS_COACH', 'RESERVE_MANAGER', 'YOUTH_MANAGER', 'SCOUT'];
    roles.forEach(role => {
      const s: Staff = {
        id: generateUUID(), name: `${STAFF_NAMES.names[randomInt(0, STAFF_NAMES.names.length-1)]} ${STAFF_NAMES.surnames[randomInt(0, STAFF_NAMES.surnames.length-1)]}`,
        age: randomInt(35, 65), nationality: "Argentina", role: role, clubId: clubId,
        attributes: { coaching: weightedRandom(8, 20), judgingAbility: role === 'SCOUT' ? weightedRandom(12, 20) : weightedRandom(8, 20), judgingPotential: role === 'SCOUT' ? weightedRandom(12, 20) : weightedRandom(8, 20), tacticalKnowledge: weightedRandom(10, 20), adaptability: weightedRandom(5, 20), medical: role === 'PHYSIO' ? 18 : 5, physiotherapy: role === 'PHYSIO' ? 18 : 5, motivation: weightedRandom(8, 20), manManagement: weightedRandom(8, 20) },
        salary: randomInt(3000, 15000), contractExpiry: new Date(2010, 5, 30), history: [],
        personality: ['LEADER', 'PASSIONATE', 'CALM', 'DISCIPLINARIAN', 'VISIONARY'][randomInt(0, 4)],
        morale: 70,
        reputation: 50,
        relationships: {},
        pressReputation: 50,
        boardRelationship: 60
      };
      this.staff.push(s);
    });
  }

  createRandomPlayer(clubId: string, primaryPos: Position, minAge = 16, maxAge = 36, baseYear = 2008): Player {
    const club = this.getClub(clubId);
    const repBase = club ? club.reputation / 500 : 10;
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

    const ca = randomInt(Math.max(1, repBase * 5), Math.min(200, repBase * 15));
    const pa = Math.min(200, ca + randomInt(0, 50));
    const caBase = ca / 10;

    const stats: PlayerStats = {
        mental: { aggression: weightedRandom(caBase-4, caBase+4), anticipation: weightedRandom(caBase-4, caBase+4), bravery: weightedRandom(caBase-4, caBase+4), composure: weightedRandom(caBase-4, caBase+4), concentration: weightedRandom(caBase-4, caBase+4), decisions: weightedRandom(caBase-4, caBase+4), determination: randomInt(5, 20), flair: weightedRandom(caBase-4, caBase+4), leadership: weightedRandom(caBase-4, caBase+4), offTheBall: weightedRandom(caBase-4, caBase+4), positioning: weightedRandom(caBase-4, caBase+4), teamwork: weightedRandom(caBase-4, caBase+4), vision: weightedRandom(caBase-4, caBase+4), workRate: weightedRandom(caBase-4, caBase+4), professionalism: randomInt(5, 20), ambition: randomInt(5, 20), pressure: randomInt(5, 20), temperament: randomInt(5, 20), loyalty: randomInt(5, 20), adaptability: randomInt(5, 20), sportsmanship: randomInt(5, 20) },
        technical: { corners: weightedRandom(caBase-4, caBase+4), crossing: weightedRandom(caBase-4, caBase+4), dribbling: weightedRandom(caBase-4, caBase+4), finishing: weightedRandom(caBase-4, caBase+4), firstTouch: weightedRandom(caBase-4, caBase+4), freeKickTaking: weightedRandom(caBase-4, caBase+4), heading: weightedRandom(caBase-4, caBase+4), longShots: weightedRandom(caBase-4, caBase+4), longThrows: weightedRandom(caBase-4, caBase+4), marking: weightedRandom(caBase-4, caBase+4), passing: weightedRandom(caBase-4, caBase+4), penaltyTaking: weightedRandom(caBase-4, caBase+4), tackling: weightedRandom(caBase-4, caBase+4), technique: weightedRandom(caBase-4, caBase+4) },
        physical: { acceleration: weightedRandom(caBase-4, caBase+4), agility: weightedRandom(caBase-4, caBase+4), balance: weightedRandom(caBase-4, caBase+4), jumpingReach: weightedRandom(caBase-4, caBase+4), naturalFitness: weightedRandom(caBase-4, caBase+4), pace: weightedRandom(caBase-4, caBase+4), stamina: weightedRandom(caBase-4, caBase+4), strength: weightedRandom(caBase-4, caBase+4) }
    };
    if (primaryPos === Position.GK) {
        stats.goalkeeping = { aerialReach: weightedRandom(caBase-4, caBase+4), commandOfArea: weightedRandom(caBase-4, caBase+4), communication: weightedRandom(caBase-4, caBase+4), eccentricity: randomInt(1, 20), handling: weightedRandom(caBase-4, caBase+4), kicking: weightedRandom(caBase-4, caBase+4), oneOnOnes: weightedRandom(caBase-4, caBase+4), reflexes: weightedRandom(caBase-4, caBase+4), rushingOut: weightedRandom(caBase-4, caBase+4), punching: weightedRandom(caBase-4, caBase+4), throwing: weightedRandom(caBase-4, caBase+4) };
    }

return {
         id: generateUUID(), name: `${firstName} ${lastName}`, age: randomInt(minAge, maxAge), birthDate: new Date(baseYear - 20, randomInt(0, 11), randomInt(1, 28)), height: randomInt(165, 195), weight: randomInt(65, 95), nationality: nat, positions: [primaryPos], secondaryPositions: [], stats, seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 }, statsByCompetition: {}, history: [], currentAbility: ca, potentialAbility: pa, reputation: ca * 40, fitness: 100, morale: 100, clubId, isStarter: false, squad: 'SENIOR', value: Math.round(ca * ca * 2000), salary: Math.round(ca * 2000 / 12), transferStatus: 'NONE', contractExpiry: new Date(2010, 5, 30), loyalty: stats.mental.loyalty, negotiationAttempts: 0, isUnhappyWithContract: false, releaseClause: Math.round(ca * ca * 2000 * 3), yellowCardsAccumulated: 0, formRatings: [], isTransferListed: false, injuryHistory: [], injuryProneness: Math.max(0.01, (20 - stats.physical.naturalFitness) * 0.02), relationships: {}, agent: randomInt(minAge, maxAge) >= 22 && Math.random() < 0.15 ? { name: `Agente ${lastName}`, commission: Math.round(5 + Math.random() * 10) } : undefined
     };
  }

  getLeagueTable(compId: string, fixtures: Fixture[], squadType: SquadType, groupId?: number): TableEntry[] {
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
    
    return Object.values(table)
        .map(e => ({ ...e, gd: e.gf - e.ga }))
        .sort((a,b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }

  getClubsByCompetition(compId: string, fixtures: Fixture[], groupId?: number): Club[] {
    const ids = new Set(fixtures.filter(f => f.competitionId === compId && (groupId === undefined || f.groupId === groupId)).flatMap(f => [f.homeTeamId, f.awayTeamId]));
    return this.clubs.filter(c => ids.has(c.id));
  }

  getClubsByLeague(leagueId: string) { return this.clubs.filter(c => c.leagueId === leagueId); }

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
            // Fix: Comparison between narrowed enum type and specific member caused overlap error due to duplicate string values in Position enum. Casting primaryPos to any to skip overlap check.
            if (metadata.line === 'AM') return (primaryPos as any) === Position.AM || primaryPos === Position.AMR || primaryPos === Position.AML;
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

  saveTactic(name: string, positions: number[], settings: TacticSettings) {
    this.tactics.push({ id: generateUUID(), name, positions, settings, arrows: {}, individualSettings: {} });
  }

  makeTransferOffer(playerId: string, fromClubId: string, amount: number, type: 'PURCHASE' | 'LOAN' | 'LOAN_TO_BUY', date: Date, wageShare = 100) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    if (player.releaseClause && amount >= player.releaseClause) {
      const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, wageShare, type, status: 'ACCEPTED', date, responseDate: date, isViewed: false };
      this.offers.push(offer);
      this.addInboxMessage('MARKET', `Cláusula activada: ${player.name}`, `${this.getClub(fromClubId)?.name} ha pagado la cláusula de rescisión de ${player.name}: $${amount.toLocaleString()}.`, date, playerId);
      return;
    }
    if (player.agent && Math.random() < 0.4) {
      const commission = Math.round(amount * player.agent.commission / 100);
      amount += commission;
      this.addInboxMessage('FINANCE', `Comisión del agente: ${player.name}`, `El agente ${player.agent.name} exige una comisión del ${player.agent.commission}% ($${commission.toLocaleString()}) sobre el traspaso.`, date, playerId);
    }
    const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, wageShare, type, status: 'PENDING', date, responseDate: date, isViewed: false };
    this.offers.push(offer);
  }

  acceptCounterOffer(offerId: string, date: Date) {
    const o = this.offers.find(offer => offer.id === offerId);
    if (o) { o.status = 'ACCEPTED'; o.amount = o.counterAmount || o.amount; o.responseDate = date; }
  }

  completeTransfer(offer: TransferOffer) {
    const p = this.players.find(player => player.id === offer.playerId);
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
            offer.date, p.id);
        }
        p.clubId = offer.fromClubId; p.isStarter = false; p.tacticalPosition = undefined;
        p.isTransferListed = false;
        if (newClub) {
          const salaryFactor = 0.8 + Math.random() * 0.6;
          p.salary = Math.round(p.salary * salaryFactor);
          p.contractExpiry = new Date(offer.date.getFullYear() + 3 + Math.floor(Math.random() * 2), 5, 30);
        }
        p.isUnhappyWithContract = false;
        p.requestedSalary = undefined;
        offer.status = 'COMPLETED';
        this.addInboxMessage('MARKET', `Traspaso completado: ${p.name}`, `${p.name} se ha unido a ${newClub?.name || 'nuevo club'} por $${offer.amount.toLocaleString()}.`, offer.date, p.id);
        sendTransferNotification(p.name, newClub?.name || 'nuevo club');
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
    const p = this.players.find(player => player.id === playerId);
    if (p) { p.clubId = 'FREE_AGENT'; p.isStarter = false; p.tacticalPosition = undefined; p.isTransferListed = false; }
  }

  createHumanManager(clubId: string, name: string) {
    const manager: Staff = { id: generateUUID(), name, age: 35, nationality: "Argentina", role: 'HEAD_COACH', clubId, attributes: { coaching: 12, judgingAbility: 12, judgingPotential: 11, tacticalKnowledge: 10, adaptability: 10, medical: 2, physiotherapy: 2, motivation: 14, manManagement: 13 }, salary: 12000, contractExpiry: new Date(2009, 5, 30), history: [], personality: 'LEADER', morale: 100, reputation: 55, relationships: {}, pressReputation: 50, boardRelationship: 65 };
    this.staff = this.staff.filter(s => s.clubId !== clubId || s.role !== 'HEAD_COACH');
    this.staff.unshift(manager);
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
    if (Math.random() > 0.1) return;
    const allClubs = this.clubs;

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
      const candidates = this.players.filter(p =>
        p.clubId !== club.id && p.clubId !== 'FREE_AGENT' &&
        p.squad === 'SENIOR' && p.positions.includes(targetPos) &&
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
      const youngTalents = this.players.filter(p =>
        p.clubId !== club.id && p.clubId !== 'FREE_AGENT' &&
        p.age >= 16 && p.age <= 22 &&
        p.potentialAbility >= 140 &&
        p.currentAbility < club.reputation / 80 &&
        p.squad === 'SENIOR'
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
          !this.getPlayersByClub(c.id).some(sp => sp.positions.some(pos => p.positions.includes(pos)))
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
      const loanCandidates = this.players.filter(p =>
        p.clubId !== club.id && p.positions.includes(targetPos) &&
        p.age < 25 && p.currentAbility < 140 && !p.loanDetails &&
        (p.transferStatus === 'LOANABLE' || p.isTransferListed)
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
      const destinations = allClubs.filter(c => c.id !== club.id && this.getPlayersByClub(c.id).filter(pp => pp.squad === 'U20').length < 5);
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
      if (buyer && seller) {
        this.addInboxMessage('MARKET', `Traspaso: ${this.players.find(p => p.id === offer.playerId)?.name || 'Jugador'}`, `${buyer.name} ha fichado a un jugador de ${seller.name} por $${offer.amount.toLocaleString()}.`, date);
      }
    });
  }

  checkRenewalTriggers(date: Date, userClubId?: string) {
    if (Math.random() > 0.05) return;
    this.players.forEach(p => {
      if (p.contractExpiry < date && p.clubId !== 'FREE_AGENT') {
        const club = this.getClub(p.clubId);
        if (!club) return;
        const renewChance = 0.3 + (p.currentAbility / 200) * 0.3 + (club.reputation / 10000) * 0.2;
        if (Math.random() < renewChance) {
          p.contractExpiry = new Date(date.getFullYear() + 2, 5, 30);
        } else if (Math.random() < 0.3) {
          p.clubId = 'FREE_AGENT';
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
  }

  processPendingOffers(date: Date) {
    const pending = this.offers.filter(o => o.status === 'PENDING');
    pending.forEach(offer => {
      const player = this.players.find(p => p.id === offer.playerId);
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

  completeLoan(offer: TransferOffer) {
    const p = this.players.find(player => player.id === offer.playerId);
    if (!p) return;
    const isLoanToBuy = offer.type === 'LOAN_TO_BUY';
    p.loanDetails = { originalClubId: p.clubId, wageShare: offer.wageShare, loanToBuy: isLoanToBuy };
    p.clubId = offer.fromClubId;
    p.isStarter = false;
    p.isTransferListed = false;
    p.transferStatus = 'NONE';
    offer.status = 'COMPLETED';
    const newClub = this.getClub(offer.fromClubId);
    this.addInboxMessage('MARKET', `Cedido: ${p.name}`, `${p.name} se marcha cedido a ${newClub?.name || 'nuevo club'}${isLoanToBuy ? ' (con opción de compra)' : ''} hasta final de temporada.`, offer.date, p.id);
  }

  processLoanReturns(date: Date) {
    const seasonEndMonth = 6;
    if (date.getMonth() !== seasonEndMonth || date.getDate() > 7) return;
    this.players.forEach(p => {
      if (p.loanDetails) {
        const wasLoanToBuy = p.loanDetails.loanToBuy;
        p.clubId = p.loanDetails.originalClubId;
        p.loanDetails = undefined;
        p.isStarter = false;
        if (wasLoanToBuy) {
          const buyingClub = this.getClub(p.clubId);
          if (buyingClub && buyingClub.id) {
            this.addInboxMessage('MARKET', `Opción de compra: ${p.name}`, `El préstamo de ${p.name} ha finalizado. ${buyingClub.name} puede ejercer la opción de compra pagando su valor de mercado.`, date, p.id);
          }
        }
      }
    });
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
    club.boardConfidence = Math.max(0, Math.min(100, club.boardConfidence + confidenceChange));
    if (club.boardConfidence <= 0) {
      this.addInboxMessage('SQUAD', '¡DIRECTIVA HARTA!',
        `La directiva de ${club.name} ha perdido toda la confianza en el entrenador tras los malos resultados.`,
        new Date());
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
        date);
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
        `La directiva no considera prudente aumentar el presupuesto de fichajes en este momento.`, date);
      return { success: false, amount: 0, message: 'Rechazado' };
    }
    club.finances.transferBudget += requestedAmount;
    this.addInboxMessage('FINANCE', 'Aumento de presupuesto de fichajes',
      `La directiva aprobó un aumento de $${requestedAmount.toLocaleString()} en el presupuesto de fichajes.`, date);
    return { success: true, amount: requestedAmount, message: `Aprobado: +$${requestedAmount.toLocaleString()}` };
  }

  checkManagerJobOffers(date: Date, userClubId: string, managerReputation: number): void {
    if (managerReputation < 60) return;
    if (Math.random() > 0.05) return;
    const userClub = this.getClub(userClubId);
    if (!userClub) return;
    const candidateClubs = this.clubs
      .filter(c => c.id !== userClubId && c.reputation > userClub.reputation * 1.2 && c.reputation <= userClub.reputation * 2.5)
      .slice(0, 5);
    if (candidateClubs.length === 0) return;
    const target = candidateClubs[randomInt(0, candidateClubs.length - 1)];
    this.addInboxMessage('STATEMENTS', `Oferta de trabajo: ${target.name}`,
      `El club ${target.name} está interesado en contratarte como entrenador. Tu reputación y resultados han llamado su atención.`,
      date, target.id);
  }

addInboxMessage(category: MessageCategory, subject: string, body: string, date: Date, relatedId?: string) {
     this.inbox.unshift({ id: generateUUID(), date: new Date(date), category, subject, body, isRead: false, relatedId });
     if (category === 'SQUAD' || category === 'MARKET' || category === 'FINANCE') {
       sendInboxNotification(subject);
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
    const player = this.players.find(p => p.id === playerId);
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

    const techKeys = Object.entries(player.stats.technical).sort(([,a], [,b]) => b - a);
    const mentalKeys = Object.entries(player.stats.mental).sort(([,a], [,b]) => b - a);

    if (techKeys[0][1] >= 15) strengths.push(techKeys[0][0]);
    if (mentalKeys[0][1] >= 15) strengths.push(mentalKeys[0][0]);
    if (techKeys[techKeys.length-1][1] <= 8) weaknesses.push(techKeys[techKeys.length-1][0]);
    if (mentalKeys[mentalKeys.length-1][1] <= 8) weaknesses.push(mentalKeys[mentalKeys.length-1][0]);

    const summary = reportedCA >= 150 ? "Jugador de clase mundial." :
      reportedCA >= 120 ? "Excelente jugador para el equipo." :
      reportedCA >= 100 ? "Jugador de primer nivel." :
      reportedCA >= 80 ? "Puede ser útil en la rotación." :
      "Jugador de relleno. No recomiendo su fichaje.";

    let personality = "Equilibrado";
    if (player.stats.mental.professionalism >= 17) personality = "Modelo de profesionalidad";
    else if (player.stats.mental.determination >= 17) personality = "Muy determinado";
    else if (player.stats.mental.ambition >= 17) personality = "Muy ambicioso";
    else if (player.stats.mental.temperament <= 6) personality = "Volátil";
    else if (player.stats.mental.leadership >= 16) personality = "Líder nato";

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

    const scouts = this.getStaffByClub(userClubId).filter(s => s.role === 'SCOUT' || s.role === 'HEAD_COACH' || s.role === 'ASSISTANT_MANAGER');
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
    return Math.round(base * formMult * ageMult * contractMult);
  }

recalculateAllPlayerValues() {
     for (const p of this.players) {
       p.value = this.recalculatePlayerValue(p);
     }
   }

generateYouthIntake(year: number) {
      this.clubs.forEach(club => {
        const youthCount = 3 + randomInt(0, Math.min(3, Math.floor(club.youthFacilities / 5)));
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

  // --- MEDIA NEWS SYSTEM ---

  generateMatchNews(fixture: Fixture, homeScore: number, awayScore: number, date: Date) {
    const homeClub = this.getClub(fixture.homeTeamId);
    const awayClub = this.getClub(fixture.awayTeamId);
    if (!homeClub || !awayClub) return;
    const isUserMatch = homeClub.id === this.getUserClub()?.id || awayClub.id === this.getUserClub()?.id;
    const userClub = this.getUserClub();

    if (homeScore > awayScore) {
      this.addMediaNews({
        id: generateUUID(), date, type: 'HEADLINE', category: 'MATCH',
        headline: `${homeClub.shortName} se impone al ${awayClub.shortName}`,
        subheadline: `${homeScore} - ${awayScore}`,
        body: `${homeClub.name} logró una victoria importante ante ${awayClub.name} por ${homeScore}-${awayScore}. El equipo mostró solidez tanto en ataque como en defensa.`,
        clubId: homeClub.id, competitionId: fixture.competitionId,
        isUserClubNews: userClub && (homeClub.id === userClub.id || awayClub.id === userClub.id),
        read: false,
      });
    } else if (awayScore > homeScore) {
      this.addMediaNews({
        id: generateUUID(), date, type: 'HEADLINE', category: 'MATCH',
        headline: `${awayClub.shortName} derrota a ${homeClub.shortName}`,
        subheadline: `${awayScore} - ${homeScore}`,
        body: `${awayClub.name} se llevó los tres puntos ante ${homeClub.name} con un contundente ${awayScore}-${homeScore}.`,
        clubId: awayClub.id, competitionId: fixture.competitionId,
        isUserClubNews: userClub && (homeClub.id === userClub.id || awayClub.id === userClub.id),
        read: false,
      });
    } else {
      this.addMediaNews({
        id: generateUUID(), date, type: 'FEATURE', category: 'MATCH',
        headline: `${homeClub.shortName} y ${awayClub.shortName} empatan`,
        subheadline: `${homeScore} - ${awayScore}`,
        body: `Un vibrante empate ${homeScore}-${awayScore} entre ${homeClub.name} y ${awayClub.name} deja la tabla más pareja que nunca.`,
        clubId: homeClub.id, competitionId: fixture.competitionId,
        isUserClubNews: userClub && (homeClub.id === userClub.id || awayClub.id === userClub.id),
        read: false,
      });
    }
  }

  generateTransferNews(player: Player, fromClub: Club, toClub: Club, amount: number, date: Date) {
    const userClub = this.getUserClub();
    this.addMediaNews({
      id: generateUUID(), date, type: 'HEADLINE', category: 'TRANSFER',
      headline: `${player.name} ficha por ${toClub.shortName}`,
      subheadline: `Traspaso: $${amount.toLocaleString()}`,
      body: `El jugador ${player.name} deja ${fromClub.name} para unirse a ${toClub.name} en un movimiento que sacude el mercado.`,
      clubId: toClub.id, playerId: player.id,
      isUserClubNews: userClub && (fromClub.id === userClub.id || toClub.id === userClub.id),
      read: false,
    });
  }

  generateInjuryNews(player: Player, club: Club, date: Date) {
    const userClub = this.getUserClub();
    this.addMediaNews({
      id: generateUUID(), date, type: 'CRITICISM', category: 'INJURY',
      headline: `Duro golpe para ${club.shortName}: ${player.name} lesionado`,
      subheadline: `Fuera de los terrenos de juego`,
      body: `${player.name} sufre una lesión que lo dejará fuera de las canchas por varias semanas. Un golpe duro para las aspiraciones de ${club.name}.`,
      clubId: club.id, playerId: player.id,
      isUserClubNews: userClub && club.id === userClub.id,
      read: false,
    });
  }

  generateGeneralNews(date: Date) {
    const userClub = this.getUserClub();
    const headlines = [
      { headline: 'La liga se pone más emocionante que nunca', subheadline: 'Las posiciones se estrechan en la parte alta', type: 'FEATURE' as const, category: 'GENERAL' as const, isUserClub: false },
      { headline: 'El mercado de pases no para: nuevas incorporaciones sorprenden', subheadline: 'Varios clubes apuestan por jóvenes promesas', type: 'HEADLINE' as const, category: 'TRANSFER' as const, isUserClub: false },
      { headline: 'Lesiones preocupantes en la zona media de la tabla', subheadline: 'Varios jugadores clave fuera por lesión', type: 'CRITICISM' as const, category: 'INJURY' as const, isUserClub: false },
      { headline: 'La afición responde: llenos históricos en los estadios', subheadline: 'La liga bate récord de asistencia', type: 'PRAISE' as const, category: 'GENERAL' as const, isUserClub: false },
      { headline: 'El entrenador del año: ¿quién se lleva el galardón?', subheadline: 'Las votaciones están muy reñidas', type: 'FEATURE' as const, category: 'BOARD' as const, isUserClub: false },
      { headline: 'Cantera: los jóvenes que están dando la campanada', subheadline: 'Varios juveniles llamados a la selección', type: 'PRAISE' as const, category: 'GENERAL' as const, isUserClub: false },
      { headline: 'El VAR sigue generando polémica en la liga', subheadline: 'Varias decisiones polémicas alteran resultados', type: 'CRITICISM' as const, category: 'GENERAL' as const, isUserClub: false },
      { headline: 'Negociaciones contractuales tensas en varios clubes', subheadline: 'Jugadores importantes piden renovaciones', type: 'RUMOR' as const, category: 'BOARD' as const, isUserClub: false },
    ];
    const pick = headlines[randomInt(0, headlines.length - 1)];
    this.addMediaNews({
      id: generateUUID(), date, type: pick.type, category: pick.category,
      headline: pick.headline, subheadline: pick.subheadline,
      body: `Noticia de interés general en el mundo del fútbol. ${pick.subheadline}.`,
      isUserClubNews: userClub && Math.random() < 0.3,
      read: false,
    });
  }

  addMediaNews(news: MediaNews) {
    this.mediaNews.unshift(news);
    if (this.mediaNews.length > 100) this.mediaNews.pop();
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
    const userClubId = useGameStore.getState().userClubId;
    return userClubId ? this.getClub(userClubId) : undefined;
  }
}

export const world = new WorldManager();
