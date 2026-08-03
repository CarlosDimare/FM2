import { create } from 'zustand';
import { Fixture, ManagerHistory } from '../types';
import { world } from '../services/worldManager';
import { Scheduler } from '../services/scheduler';
import { LifecycleManager } from '../services/lifecycleManager';
import { LeagueEngine } from '../services/leagueEngine';
import { ChampionsLeagueManager } from '../services/championsLeague';
import { NationalTeamManager } from '../services/nationalTeamManager';

interface GameStore {
  fixtures: Fixture[];
  nextFixture: Fixture | null;
  currentDate: Date;
  seasonEndDate: Date;
  managerHistory: ManagerHistory;
  managerReputation: number;
  darkMode: boolean;
  deepSimLeagues: string[];

  setFixtures: (fixtures: Fixture[]) => void;
  setNextFixture: (f: Fixture | null) => void;
  setCurrentDate: (d: Date) => void;
  setSeasonEndDate: (d: Date) => void;
  setManagerHistory: (h: ManagerHistory) => void;
  setManagerReputation: (r: number) => void;
  setDarkMode: (d: boolean) => void;
  setDeepSimLeagues: (leagues: string[]) => void;
  trackMatchResult: (userScore: number, opponentScore: number) => void;
  trackTitle: (title: string) => void;

  initSeasonFixtures: (startFrom: Date, clubId?: string) => Fixture[];
  updateNextFixture: (fixtures: Fixture[], date: Date, clubId: string) => Fixture | null;
  finishSeason: (fixtures: Fixture[], userClubId?: string, dateOverride?: Date) => {
    summaries: any[];
    userWonLeague: boolean;
    newFixtures: Fixture[];
    nextSeasonStart: Date;
    nextSeasonEnd: Date;
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  fixtures: [],
  nextFixture: null,
  currentDate: new Date(2026, 7, 1),
  seasonEndDate: new Date(2027, 5, 30),
  managerHistory: {
    totalGames: 0, totalWins: 0, totalDraws: 0, totalLosses: 0,
    goalsFor: 0, goalsAgainst: 0, currentStreak: null, streakCount: 0,
    longestWinStreak: 0, titles: [], seasonsCompleted: 0
  },
  managerReputation: 50,
  darkMode: false,
  deepSimLeagues: [],

  setFixtures: (fixtures) => set({ fixtures }),
  setNextFixture: (nextFixture) => set({ nextFixture }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setSeasonEndDate: (seasonEndDate) => set({ seasonEndDate }),
  setManagerHistory: (managerHistory) => set({ managerHistory }),
  setManagerReputation: (managerReputation) => set({ managerReputation }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setDeepSimLeagues: (deepSimLeagues) => set({ deepSimLeagues }),

  trackMatchResult: (userScore, opponentScore) => {
    const { managerHistory } = get();
    const newHistory = { ...managerHistory };
    newHistory.totalGames++;
    newHistory.goalsFor += userScore;
    newHistory.goalsAgainst += opponentScore;

    if (userScore > opponentScore) {
      newHistory.totalWins++;
      if (newHistory.currentStreak === 'W') {
        newHistory.streakCount++;
      } else {
        newHistory.currentStreak = 'W';
        newHistory.streakCount = 1;
      }
      if (newHistory.streakCount > newHistory.longestWinStreak) {
        newHistory.longestWinStreak = newHistory.streakCount;
      }
    } else if (userScore < opponentScore) {
      newHistory.totalLosses++;
      newHistory.currentStreak = 'L';
      newHistory.streakCount = 1;
    } else {
      newHistory.totalDraws++;
      if (newHistory.currentStreak !== 'D') {
        newHistory.currentStreak = 'D';
        newHistory.streakCount = 1;
      } else {
        newHistory.streakCount++;
      }
    }

    set({ managerHistory: newHistory });

    const repDelta = userScore > opponentScore ? 1 : userScore < opponentScore ? -1 : 0;
    const newRep = Math.max(1, Math.min(100, get().managerReputation + repDelta));
    set({ managerReputation: newRep });
  },

  trackTitle: (title) => {
    const { managerHistory } = get();
    const newHistory = { ...managerHistory };
    newHistory.titles = [title, ...newHistory.titles];
    const newRep = Math.min(100, get().managerReputation + 5);
    set({ managerHistory: newHistory, managerReputation: newRep });
  },

  initSeasonFixtures: (startFrom, clubId) => {
    const allFixtures: Fixture[] = [];
    const clubsByLeague: Record<string, any[]> = {};
    world.competitions.filter(c => c.type === 'LEAGUE').forEach(l => {
      const clubs = world.getClubsByLeague(l.id);
      clubsByLeague[l.id] = clubs;
    });

    const userLeagueId = clubId ? world.getClub(clubId)?.leagueId : undefined;
    const deepLeagueIds = LeagueEngine.resolveDeepLeagueIds(userLeagueId, world.competitions, get().deepSimLeagues);
    if (deepLeagueIds.length > 0 && deepLeagueIds.some(id => !get().deepSimLeagues.includes(id))) {
      set({ deepSimLeagues: deepLeagueIds });
    }

    world.competitions.filter(c => c.type === 'LEAGUE').forEach(l => {
      const clubs = clubsByLeague[l.id] || [];
      if (deepLeagueIds.includes(l.id)) world.ensureDeepSquads(l.id);
      const depth = deepLeagueIds.includes(l.id) ? 'DEEP' : 'LIGHT';
      const squadTypes = depth === 'DEEP' ? (['SENIOR', 'RESERVE', 'U20'] as const) : (['SENIOR'] as const);
      squadTypes.forEach(st => {
        allFixtures.push(...LeagueEngine.generateFixturesForLeague(world.clubs, l.id, startFrom, st, clubsByLeague));
      });
    });

    const cupDate = new Date(startFrom);
    cupDate.setMonth(startFrom.getMonth() + 1);
    while (cupDate.getDay() !== 3) cupDate.setDate(cupDate.getDate() + 1);

    const copaArg = world.competitions.find(c => c.id === 'C_ARG');
    if (copaArg) {
      const clubs = world.getClubsByLeague('L_ARG_1').concat(world.getClubsByLeague('L_ARG_2'));
      const top32 = clubs.sort(() => Math.random() - 0.5).slice(0, 32);
      allFixtures.push(...Scheduler.generateCupRound(copaArg.id, top32, cupDate, 'ROUND_OF_32'));
    }

    const libertadores = world.competitions.find(c => c.id === 'CONT_LIB');
    const sudamericana = world.competitions.find(c => c.id === 'CONT_SUD');

    let libArg = world.clubs.filter(c => c.qualifiedFor === 'CONT_LIB');
    let sudArg = world.clubs.filter(c => c.qualifiedFor === 'CONT_SUD');

    if (libArg.length === 0 && sudArg.length === 0) {
      const allArgTeams = world.getClubsByLeague('L_ARG_1').sort((a, b) => b.reputation - a.reputation);
      libArg = allArgTeams.slice(0, 6);
      sudArg = allArgTeams.slice(6, 12);
    }

    const allUserLeagueTeams = clubId ? (clubsByLeague[world.getClub(clubId)?.leagueId || ''] || []) : [];
    const allContTeams = world.clubs.filter(c => c.qualifiedFor || c.leagueId !== (world.getClub(clubId)?.leagueId || ''));
    const allArgTeams = world.getClubsByLeague('L_ARG_1').sort((a, b) => b.reputation - a.reputation);
    const targetSize = 32;

    let libPool = [...libArg];
    if (libPool.length < targetSize) {
      const needed = targetSize - libPool.length;
      const fromCont = allContTeams.slice(0, needed);
      libPool = [...libPool, ...fromCont];
      if (libPool.length < targetSize) {
        const moreNeeded = targetSize - libPool.length;
        const moreArg = allArgTeams.filter(c => !libPool.includes(c)).slice(0, moreNeeded);
        libPool = [...libPool, ...moreArg];
      }
    }

    let sudPool = [...sudArg];
    const usedIds = new Set(libPool.map(c => c.id));
    const availableCont = allContTeams.filter(c => !usedIds.has(c.id));

    if (sudPool.length < targetSize) {
      const needed = targetSize - sudPool.length;
      const fromCont = availableCont.slice(0, needed);
      sudPool = [...sudPool, ...fromCont];
      if (sudPool.length < targetSize) {
        const moreNeeded = targetSize - sudPool.length;
        const moreArg = allArgTeams.filter(c => !usedIds.has(c.id) && !sudPool.includes(c)).slice(0, moreNeeded);
        sudPool = [...sudPool, ...moreArg];
      }
    }

    if (libertadores && libPool.length >= 32) {
      const finalLibPool = libPool.slice(0, 32);
      const groupStageStart = new Date(startFrom.getTime() + 1000 * 60 * 60 * 24 * 150);
      allFixtures.push(...Scheduler.generateContinentalGroups(libertadores.id, finalLibPool, groupStageStart));
    }

    if (sudamericana && sudPool.length >= 32) {
      const finalSudPool = sudPool.slice(0, 32);
      const groupStageStart = new Date(startFrom.getTime() + 1000 * 60 * 60 * 24 * 157);
      allFixtures.push(...Scheduler.generateContinentalGroups(sudamericana.id, finalSudPool, groupStageStart));
    }

    const cwc = world.competitions.find(c => c.id === 'W_CLUB');
    if (cwc) {
      const decDate = new Date(startFrom.getFullYear(), 11, 15);
      const bossTeams = world.getClubsByLeague('L_EUR_ELITE') || world.clubs.filter(c => c.leagueId === 'L_EUR_ELITE').slice(0, 1);
      const libTeams = world.getClubsByLeague('L_ARG_1').slice(0, 1);
      const others = (world.getClubsByLeague('L_SAM_OTHER') || []).slice(0, 2);
      const cwcPool = [...bossTeams, ...libTeams, ...others];
      allFixtures.push(...Scheduler.generateCupRound(cwc.id, cwcPool, decDate, 'SEMI_FINAL'));
    }

    // ─── UEFA Champions League ─────────────────────────────────────────────
    const uclStart = new Date(startFrom);
    uclStart.setMonth(uclStart.getMonth() + 1); // September
    while (uclStart.getDay() !== 2 && uclStart.getDay() !== 3) uclStart.setDate(uclStart.getDate() + 1);

    // Get top clubs from European leagues for UCL
    const europeanLeagueIds = ['L_ESP_1', 'L_ESP_2', 'L_ITA_1', 'L_ITA_2', 'L_DEU_1', 'L_FRA_1', 'L_FRA_2', 'L_NLD_1', 'L_BEL_1', 'L_PRT_1', 'L_TUR_1'];
    const uclPool: any[] = [];
    for (const lid of europeanLeagueIds) {
      const clubs = world.getClubsByLeague(lid).sort((a, b) => b.reputation - a.reputation);
      uclPool.push(...clubs.slice(0, 4));
    }
    if (uclPool.length >= 32) {
      const uclClubs = uclPool.slice(0, 32).map(c => ({
        clubId: c.id, clubName: c.name, country: c.country, seed: 0,
      }));
      allFixtures.push(...ChampionsLeagueManager.generateLeaguePhase(uclClubs, uclStart));
    }

    // ─── UEFA Europa League ────────────────────────────────────────────────
    const uelStart = new Date(startFrom);
    uelStart.setMonth(uelStart.getMonth() + 1);
    while (uelStart.getDay() !== 3) uelStart.setDate(uelStart.getDate() + 1);
    const uelPool: any[] = [];
    for (const lid of europeanLeagueIds) {
      const clubs = world.getClubsByLeague(lid).sort((a, b) => b.reputation - a.reputation);
      uelPool.push(...clubs.slice(4, 6));
    }
    if (uelPool.length >= 32) {
      const uelClubs = uelPool.slice(0, 32).map(c => ({
        clubId: c.id, clubName: c.name, country: c.country, seed: 0,
      }));
      allFixtures.push(...Scheduler.generateContinentalGroups('UEL', uelClubs.map(c => world.getClub(c.clubId)).filter(Boolean) as any[], uelStart));
    }

    // ─── Domestic Cups ─────────────────────────────────────────────────────
    const domesticCupDate = new Date(startFrom);
    domesticCupDate.setMonth(startFrom.getMonth() + 3);
    while (domesticCupDate.getDay() !== 3) domesticCupDate.setDate(domesticCupDate.getDate() + 1);

    // Copa del Rey (all Spanish clubs)
    const copaRey = world.competitions.find(c => c.id === 'COPA_REY');
    if (copaRey) {
      const espClubs = [...world.getClubsByLeague('L_ESP_1'), ...world.getClubsByLeague('L_ESP_2')];
      if (espClubs.length >= 32) {
        allFixtures.push(...Scheduler.generateCupRound(copaRey.id, espClubs.slice(0, 32), domesticCupDate, 'ROUND_OF_32'));
      }
    }

    // FA Cup (all English clubs)
    const faCup = world.competitions.find(c => c.id === 'FA_CUP');
    if (faCup) {
      const engClubs = [...world.getClubsByLeague('L_ENG_1'), ...world.getClubsByLeague('L_ENG_2')];
      if (engClubs.length >= 32) {
        allFixtures.push(...Scheduler.generateCupRound(faCup.id, engClubs.slice(0, 32), domesticCupDate, 'ROUND_OF_32'));
      }
    }

    // DFB Pokal (all German clubs)
    const dfbPokal = world.competitions.find(c => c.id === 'DFB_POKAL');
    if (dfbPokal) {
      const deuClubs = [...world.getClubsByLeague('L_DEU_1')];
      if (deuClubs.length >= 32) {
        allFixtures.push(...Scheduler.generateCupRound(dfbPokal.id, deuClubs.slice(0, 32), domesticCupDate, 'ROUND_OF_32'));
      }
    }

    // Coppa Italia (all Italian clubs)
    const coppaItalia = world.competitions.find(c => c.id === 'COPA_ITALIA');
    if (coppaItalia) {
      const itaClubs = [...world.getClubsByLeague('L_ITA_1'), ...world.getClubsByLeague('L_ITA_2')];
      if (itaClubs.length >= 32) {
        allFixtures.push(...Scheduler.generateCupRound(coppaItalia.id, itaClubs.slice(0, 32), domesticCupDate, 'ROUND_OF_32'));
      }
    }

    // Coupe de France (all French clubs)
    const coupeDeFrance = world.competitions.find(c => c.id === 'COPA_FRANCE');
    if (coupeDeFrance) {
      const fraClubs = [...world.getClubsByLeague('L_FRA_1'), ...world.getClubsByLeague('L_FRA_2')];
      if (fraClubs.length >= 32) {
        allFixtures.push(...Scheduler.generateCupRound(coupeDeFrance.id, fraClubs.slice(0, 32), domesticCupDate, 'ROUND_OF_32'));
      }
    }

    // ─── National Team Fixtures ────────────────────────────────────────────
    const wcqDate = new Date(startFrom);
    wcqDate.setMonth(wcqDate.getMonth() + 2); // October for WC qualifiers
    if (world.nationalTeamManager) {
      allFixtures.push(...world.nationalTeamManager.generateWorldCupQualifiers(startFrom.getFullYear(), 'CONMEBOL'));
      allFixtures.push(...world.nationalTeamManager.generateWorldCupQualifiers(startFrom.getFullYear(), 'UEFA'));

      // World Cup final tournament (after qualifiers, in June of next year)
      const wcYear = startFrom.getFullYear() + 2;
      const qualifiedTeams = [
        'ARG', 'BRA', 'FRA', 'ESP', 'ENG', 'DEU', 'ITA', 'NLD',
        'COL', 'URU', 'BEL', 'PRT', 'HRV', 'CHE', 'DNK', 'MAR',
      ];
      allFixtures.push(...world.nationalTeamManager.generateWorldCupFinalTournament(qualifiedTeams, wcYear));
    }

    // ── Preseason friendlies for user's club ────────────────────────
    if (clubId) {
      const userClub = world.getClub(clubId);
      if (userClub) {
        const friendlyFixtures = world.generatePreseasonFriendlies(clubId, startFrom);
        allFixtures.push(...friendlyFixtures);
        if (friendlyFixtures.length > 0) {
          const total = allFixtures.length;
          console.log(`  ⚽ ${friendlyFixtures.length} amistosos de pretemporada para ${userClub.name}`);
        }
      }
    }

    // ── Performance: fixture breakdown ──────────────────────────────
    const deepIds = new Set(deepLeagueIds);
    const leagueFixCounts: string[] = [];
    let totalDeepFix = 0, totalLightFix = 0, totalDeepLeagues = 0, totalLightLeagues = 0;
    world.competitions.filter(c => c.type === 'LEAGUE').forEach(l => {
      const count = allFixtures.filter(f => f.competitionId === l.id && f.squadType === 'SENIOR').length;
      if (deepIds.has(l.id)) { totalDeepFix += count; totalDeepLeagues++; }
      else { totalLightFix += count; totalLightLeagues++; }
      leagueFixCounts.push(`${l.id}: ${count} (${deepIds.has(l.id) ? 'DEEP' : 'LIGHT'})`);
    });
    console.groupCollapsed(`📋 Fixtures generados: ${allFixtures.length.toLocaleString()} total · ${totalDeepFix} DEEP (${totalDeepLeagues} ligas) · ${totalLightFix} LIGHT (${totalLightLeagues} ligas)`);
    console.table(leagueFixCounts.map(s => ({ fixtureCount: s })));
    console.groupEnd();

    set({ fixtures: allFixtures });
    if (clubId) {
      const next = get().updateNextFixture(allFixtures, startFrom, clubId);
      set({ nextFixture: next });
    }
    return allFixtures;
  },

  updateNextFixture: (allFixtures, date, clubId) => {
    const next = allFixtures.find(f =>
      !f.played &&
      f.date.getTime() >= date.getTime() &&
      (f.homeTeamId === clubId || f.awayTeamId === clubId) &&
      f.squadType === 'SENIOR'
    );
    set({ nextFixture: next || null });
    return next || null;
  },

  finishSeason: (fixtures, userClubId, dateOverride) => {
    const { currentDate, seasonEndDate } = get();
    const refDate = dateOverride || currentDate;
    const managedTeamId = userClubId || world.nationalTeamManager?.controlledTeamId;
    const summaries = LifecycleManager.processEndOfSeason(fixtures, managedTeamId, refDate);
    const userWonLeague = managedTeamId ? summaries.some((s: any) => s.championId === managedTeamId) : false;

    const currentYear = refDate.getFullYear();
    const nextSeasonStart = new Date(currentYear, 6, 20);
    const nextSeasonEnd = new Date(currentYear + 1, 6, 10);

    set({
      seasonEndDate: nextSeasonEnd,
      currentDate: nextSeasonStart,
    });

    const newFixtures = get().initSeasonFixtures(nextSeasonStart, managedTeamId);

    return { summaries, userWonLeague, newFixtures, nextSeasonStart, nextSeasonEnd };
  },
}));
