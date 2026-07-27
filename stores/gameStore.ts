import { create } from 'zustand';
import { Fixture, ManagerHistory } from '../types';
import { world } from '../services/worldManager';
import { Scheduler } from '../services/scheduler';
import { LifecycleManager } from '../services/lifecycleManager';

interface GameStore {
  fixtures: Fixture[];
  nextFixture: Fixture | null;
  currentDate: Date;
  seasonEndDate: Date;
  managerHistory: ManagerHistory;
  managerReputation: number;
  darkMode: boolean;

  setFixtures: (fixtures: Fixture[]) => void;
  setNextFixture: (f: Fixture | null) => void;
  setCurrentDate: (d: Date) => void;
  setSeasonEndDate: (d: Date) => void;
  setManagerHistory: (h: ManagerHistory) => void;
  setManagerReputation: (r: number) => void;
  setDarkMode: (d: boolean) => void;
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
  currentDate: new Date(2008, 7, 16),
  seasonEndDate: new Date(2009, 6, 10),
  managerHistory: {
    totalGames: 0, totalWins: 0, totalDraws: 0, totalLosses: 0,
    goalsFor: 0, goalsAgainst: 0, currentStreak: null, streakCount: 0,
    longestWinStreak: 0, titles: [], seasonsCompleted: 0
  },
  managerReputation: 50,
  darkMode: false,

  setFixtures: (fixtures) => set({ fixtures }),
  setNextFixture: (nextFixture) => set({ nextFixture }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setSeasonEndDate: (seasonEndDate) => set({ seasonEndDate }),
  setManagerHistory: (managerHistory) => set({ managerHistory }),
  setManagerReputation: (managerReputation) => set({ managerReputation }),
  setDarkMode: (darkMode) => set({ darkMode }),

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

    world.competitions.filter(c => c.type === 'LEAGUE').forEach(l => {
      const clubs = world.getClubsByLeague(l.id);
      (['SENIOR', 'RESERVE', 'U20'] as any[]).forEach((st: any) => {
        allFixtures.push(...Scheduler.generateSeasonFixtures(l.id, clubs, startFrom, st));
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

    const allContTeams = world.getClubsByLeague('L_SAM_OTHER').sort((a, b) => b.reputation - a.reputation);
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
      const bossTeams = world.getClubsByLeague('L_EUR_ELITE').slice(0, 1);
      const libTeams = world.getClubsByLeague('L_ARG_1').slice(0, 1);
      const others = world.getClubsByLeague('L_SAM_OTHER').slice(0, 2);
      const cwcPool = [...bossTeams, ...libTeams, ...others];
      allFixtures.push(...Scheduler.generateCupRound(cwc.id, cwcPool, decDate, 'SEMI_FINAL'));
    }

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
    const summaries = LifecycleManager.processEndOfSeason(fixtures, userClubId, refDate);
    const userWonLeague = userClubId ? summaries.some((s: any) => s.championId === userClubId) : false;

    const currentYear = refDate.getFullYear();
    const nextSeasonStart = new Date(currentYear, 6, 20);
    const nextSeasonEnd = new Date(currentYear + 1, 6, 10);

    set({
      seasonEndDate: nextSeasonEnd,
      currentDate: nextSeasonStart,
    });

    const newFixtures = get().initSeasonFixtures(nextSeasonStart, userClubId);

    return { summaries, userWonLeague, newFixtures, nextSeasonStart, nextSeasonEnd };
  },
}));
