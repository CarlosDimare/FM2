import { create } from 'zustand';
import { Fixture } from '../types';
import { world } from '../services/worldManager';
import { Scheduler } from '../services/scheduler';
import { MatchSimulator } from '../services/engine';
import { LifecycleManager } from '../services/lifecycleManager';

interface GameStore {
  fixtures: Fixture[];
  nextFixture: Fixture | null;
  currentDate: Date;
  seasonEndDate: Date;

  setFixtures: (fixtures: Fixture[]) => void;
  setNextFixture: (f: Fixture | null) => void;
  setCurrentDate: (d: Date) => void;
  setSeasonEndDate: (d: Date) => void;

  initSeasonFixtures: (startFrom: Date, clubId?: string) => Fixture[];
  updateNextFixture: (fixtures: Fixture[], date: Date, clubId: string) => Fixture | null;
  advanceTime: (currentDate: Date, userClubId?: string) => { newDate: Date; hasSeniorMatch: boolean; };
  simulateDay: (day: Date, fixtures: Fixture[]) => Fixture[];
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

  setFixtures: (fixtures) => set({ fixtures }),
  setNextFixture: (nextFixture) => set({ nextFixture }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setSeasonEndDate: (seasonEndDate) => set({ seasonEndDate }),

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

  advanceTime: (currentDate, userClubId) => {
    const { fixtures } = get();
    let hasSeniorMatch = false;

    if (userClubId) {
      const hasUserSeniorMatchToday = fixtures.some(f =>
        !f.played &&
        f.date.toDateString() === currentDate.toDateString() &&
        (f.homeTeamId === userClubId || f.awayTeamId === userClubId) &&
        f.squadType === 'SENIOR'
      );

      if (!hasUserSeniorMatchToday) {
        const dayFixtures = fixtures.filter(f =>
          f.date.toDateString() === currentDate.toDateString() &&
          !f.played
        );
        dayFixtures.forEach(f => {
          const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
          f.played = true;
          f.homeScore = homeScore;
          f.awayScore = awayScore;
          const hSquad = world.getPlayersByClub(f.homeTeamId).filter(p => p.squad === f.squadType);
          const aSquad = world.getPlayersByClub(f.awayTeamId).filter(p => p.squad === f.squadType);
          MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
          LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId);
          MatchSimulator.processMatchInjuries(stats);
        });
      }
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);

    LifecycleManager.checkBirthdays(nextDay);
    LifecycleManager.recoverDailyFitness();
    world.checkRenewalTriggers(nextDay, userClubId);
    world.processTransferDecisions(nextDay);
    world.processAIActivity(nextDay);
    world.processDailyContracts(nextDay, userClubId);
    world.processDailyScouting(nextDay, userClubId);

    const newCupFixtures = LifecycleManager.processCompetitionProgress(fixtures, nextDay);
    if (newCupFixtures.length > 0) {
      const updatedFixtures = [...fixtures, ...newCupFixtures];
      set({ fixtures: updatedFixtures });
    }

    if (userClubId) {
      get().updateNextFixture(newCupFixtures.length > 0 ? [...fixtures, ...newCupFixtures] : fixtures, nextDay, userClubId);
    }

    return { newDate: nextDay, hasSeniorMatch };
  },

  simulateDay: (day, fixtures) => {
    const dayFixtures = fixtures.filter(f =>
      f.date.toDateString() === day.toDateString() &&
      !f.played
    );
    if (dayFixtures.length === 0) return fixtures;

    dayFixtures.forEach(f => {
      const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
      f.played = true;
      f.homeScore = homeScore;
      f.awayScore = awayScore;
      const hSquad = world.getPlayersByClub(f.homeTeamId).filter(p => p.squad === f.squadType);
      const aSquad = world.getPlayersByClub(f.awayTeamId).filter(p => p.squad === f.squadType);
      MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
      LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId);
      MatchSimulator.processMatchInjuries(stats);
    });

    return [...fixtures];
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
