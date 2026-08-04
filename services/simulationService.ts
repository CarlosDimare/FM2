import { Fixture, Player, Club, PlayerMatchStats, NationalTeamMatchOptions, NationalTeamChronicleContext, SquadType } from '../types';
import { world } from './worldManager';
import { LifecycleManager } from './lifecycleManager';
import { MatchSimulator } from './engine';
import { generateMatchChronicle, generateMonthlyChronicle, generateNationalTeamChronicle } from './chronicleService';
import { useGameStore } from '../stores/gameStore';

// ─── National team helpers (extracted from App.tsx) ─────────────────────────

export function getClubNationalTeamId(userClub: Club | null): string | undefined {
  const manager = world.nationalTeamManager;
  if (!userClub || !manager?.nationalTeams) return undefined;
  const normalizeCountry = (country: string) => country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const userCountry = normalizeCountry(userClub.country);
  return manager.nationalTeams.find((team: any) => normalizeCountry(team.country) === userCountry)?.id;
}

export function getNationalChronicleTeamIds(fixture: Fixture, userClub: Club | null): string[] {
  const manager = world.nationalTeamManager;
  const ids = new Set<string>();
  if (manager?.controlledTeamId && (fixture.homeTeamId === manager.controlledTeamId || fixture.awayTeamId === manager.controlledTeamId)) {
    ids.add(manager.controlledTeamId);
  }
  const clubTeamId = getClubNationalTeamId(userClub);
  if (clubTeamId && (fixture.homeTeamId === clubTeamId || fixture.awayTeamId === clubTeamId)) ids.add(clubTeamId);
  return [...ids];
}

export function getNationalMatchOptions(fixture: Fixture): NationalTeamMatchOptions {
  const manager = world.nationalTeamManager;
  const teamId = manager?.controlledTeamId;
  if (!manager || !teamId) return {};
  const squadIds = manager.getControlledSquadIds(teamId);
  const tactic = manager.getControlledTactic(teamId);
  if (fixture.homeTeamId === teamId) return { homeSquadIds: squadIds, homeTactic: tactic };
  if (fixture.awayTeamId === teamId) return { awaySquadIds: squadIds, awayTactic: tactic };
  return {};
}

export function getNationalChronicleContext(teamId: string): NationalTeamChronicleContext | undefined {
  const manager = world.nationalTeamManager;
  if (!manager?.isControlled(teamId)) return undefined;
  return {
    controlled: true,
    squadSize: manager.getControlledSquadIds(teamId).length,
    squadIds: manager.getControlledSquadIds(teamId),
    tactic: manager.getControlledTactic(teamId),
  };
}

export function getMatchSquad(clubId: string): Player[] {
  const clubPlayers = world.getPlayersByClub(clubId);
  let starters = clubPlayers.filter(p => p.isStarter && p.tacticalPosition !== undefined)
    .sort((a, b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0));

  if (starters.length < 11) {
    world.selectBestEleven(clubId, 'SENIOR');
    starters = world.getPlayersByClub(clubId)
      .filter(p => p.isStarter && p.tacticalPosition !== undefined)
      .sort((a, b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0));
  }

  const bench = clubPlayers
    .filter(p => !p.isStarter && !p.injury && (!p.suspension || p.suspension.matchesLeft === 0))
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, 9);

  return [...starters, ...bench];
}

// ─── Shared day simulation logic ─────────────────────────────────────────────

export interface DaySimParams {
  date: Date;
  fixtures: Fixture[];
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  activeManagedTeamId: string | undefined;
  /** If true, skip simulating fixtures involving the user's club (used by simulateToNextMatch) */
  skipUserMatches?: boolean;
}

/**
 * Simulate all fixtures for a single day. Returns the fixtures with results applied.
 */
export function simulateDayFixtures(params: DaySimParams): void {
  const { date, fixtures, userClub, selectedNationalTeamId } = params;
  const dayFixtures = fixtures.filter(f =>
    f.date.toDateString() === date.toDateString() && !f.played
  );
  if (dayFixtures.length === 0) return;

  // Pre-cache squads
  const uniqueClubIds = [...new Set(dayFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
  const squads = world.preFetchSquads(uniqueClubIds);

  dayFixtures.forEach(f => {
    // Skip user matches if requested (simulateToNextMatch stops at user match)
    if (params.skipUserMatches && userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) return;

    const isNationalTeamMatch = ['WC_Q', 'WC_FINAL', 'COPA', 'EURO', 'AFCON'].includes(f.competitionId);

    if (isNationalTeamMatch) {
      const result = MatchSimulator.simulateNationalTeamMatch(f.homeTeamId, f.awayTeamId, getNationalMatchOptions(f));
      f.played = true;
      f.homeScore = result.homeScore;
      f.awayScore = result.awayScore;
      getNationalChronicleTeamIds(f, userClub).forEach(teamId => {
        generateNationalTeamChronicle(f, result.homeScore, result.awayScore, result.stats, teamId, result.events, getNationalChronicleContext(teamId));
      });
    } else {
      const { homeScore, awayScore, stats, events } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
      f.played = true;
      f.homeScore = homeScore;
      f.awayScore = awayScore;
      const hSquad = (squads.get(f.homeTeamId) || []).filter(p => p.squad === f.squadType);
      const aSquad = (squads.get(f.awayTeamId) || []).filter(p => p.squad === f.squadType);
      MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
      const hRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.homeTeamId).length;
      const aRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.awayTeamId).length;
      if (f.competitionId === 'FRIENDLY') {
        world.processMatchDayIncome(f.homeTeamId, f.competitionId, date);
        // Friendlies: cohesion + tactical familiarity boost
        if (f.homeTeamId === userClub?.id || f.awayTeamId === userClub?.id) {
          const userClubId = userClub?.id || '';
          if (userClubId) {
            const club = world.getClub(userClubId);
            if (club) club.teamCohesion = Math.min(100, (club.teamCohesion || 50) + 2);
            const userSquad = f.homeTeamId === userClubId ? hSquad : aSquad;
            userSquad.forEach(p => {
              p.tacticalFamiliarity = Math.min(100, p.tacticalFamiliarity + 3);
              p.fitness = Math.min(100, p.fitness + 5);
            });
          }
        }
      } else {
        LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, hRedCards, aRedCards);
        world.processMatchDayIncome(f.homeTeamId, f.competitionId, date);
        world.trackU21Minutes(f.homeTeamId, hSquad, stats, date);
        world.trackU21Minutes(f.awayTeamId, aSquad, stats, date);
      }        if (userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) {
          const us = f.homeTeamId === userClub.id ? homeScore : awayScore;
          const os = f.homeTeamId === userClub.id ? awayScore : homeScore;
          useGameStore.getState().trackMatchResult(us, os);
          world.updateManagerProfileMatch(us, os);
          world.updateTacticalFamiliarity(userClub.id);
          generateMatchChronicle(f, homeScore, awayScore, stats, userClub.id, events);
        }
    }
    world.generateMatchNews(f, f.homeScore!, f.awayScore!, date);
  });
}

/**
 * Run all daily lifecycle processing (birthdays, fitness, finances, transfers, etc.)
 */
export function processDailyLifecycle(date: Date, userClubId: string | null | undefined): void {
  LifecycleManager.checkBirthdays(date);
  LifecycleManager.recoverDailyFitness();
  LifecycleManager.processMonthlyFinances(date);
  world.checkRenewalTriggers(date, userClubId);
  world.processTransferDecisions(date);
  world.processAIActivity(date);
  world.processDailyContracts(date, userClubId);
  world.processDailyScouting(date, userClubId);
  world.generateGeneralNews(date);

  // Transfer deadline day
  world.processDeadlineWeekActivity(date);
  world.processDeadlineDay(date);

  // Youth development
  world.developYouthPlayers(date);
  world.autoPromoteYouthPlayers(date);

  // Monthly maintenance
  if (date.getDate() === 1) {
    world.recalculateAllPlayerValues();
    if (userClubId) world.computeTeamCohesion(userClubId);
  }

  // Youth intake on August 1
  if (date.getMonth() === 7 && date.getDate() === 1) {
    world.generateYouthIntake(date.getFullYear());
  }
}

/**
 * Handle season end logic. Returns the result for UI display.
 */
export function handleSeasonEnd(
  fixtures: Fixture[],
  activeManagedTeamId: string | undefined,
  userClub: Club | null,
  currentDate: Date,
): { summaries: any[]; userWonLeague: boolean; newFixtures: Fixture[] } | null {
  world.processLoanReturns(currentDate);
  const result = useGameStore.getState().finishSeason(fixtures, activeManagedTeamId);
  const gs = useGameStore.getState();
  gs.setManagerHistory({ ...gs.managerHistory, seasonsCompleted: gs.managerHistory.seasonsCompleted + 1 });
  if (result.userWonLeague) gs.trackTitle('Liga');
  const wonCups = result.summaries.filter((s: any) => s.championId === userClub?.id && s.compType !== 'LEAGUE');
  wonCups.forEach((s: any) => gs.trackTitle(s.compName));

  if (userClub) {
    const leagueTable = world.getLeagueTable(userClub.leagueId, result.newFixtures.length > 0 ? result.newFixtures : fixtures, 'SENIOR');
    const leaguePos = leagueTable.findIndex(e => e.clubId === userClub.id) + 1;
    const leagueTotal = leagueTable.length;
    const titleNames: string[] = [];
    if (result.userWonLeague) titleNames.push('Liga');
    wonCups.forEach((s: any) => titleNames.push(s.compName));
    world.updateManagerProfileSeasonEnd(result.userWonLeague || wonCups.length > 0, titleNames, leaguePos || 10, leagueTotal || 20);

    const cupWinnerId = result.summaries.find((s: any) => s.compType !== 'LEAGUE' && s.championId)?.championId;
    const wonCup = cupWinnerId === userClub.id;
    const cupSemi = result.summaries.find((s: any) => s.compType !== 'LEAGUE')?.championId ? false : false;
    const changes = world.evaluateBoardConfidence(userClub.id, leaguePos || 10, leagueTotal || 20, wonCup, cupSemi);
    if (changes <= -30) {
      world.addInboxMessage('SQUAD', 'Confianza de la directiva baja', `La directiva no está satisfecha con los resultados de esta temporada. Se esperan mejoras significativas.`, currentDate);
    }
    world.checkManagerJobOffers(currentDate, userClub.id, useGameStore.getState().managerReputation);
    const comps = world.getClubCompetitions(userClub.id);
    comps.forEach(c => world.checkSquadRegistration(userClub.id, c.id, currentDate));
  }

  return { summaries: result.summaries, userWonLeague: result.userWonLeague, newFixtures: result.newFixtures };
}

/**
 * Monthly chronicle generation
 */
export function generateMonthlyChroniclesIfNeeded(
  date: Date,
  userClub: Club | null,
  fixtures: Fixture[],
  lastChronicleMonth: { current: number },
): void {
  if (userClub && date.getDate() === 1 && lastChronicleMonth.current !== date.getMonth()) {
    const prevMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
    const prevYear = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
    const monthFixtures = fixtures.filter(f => {
      const fd = new Date(f.date);
      return f.played && fd.getMonth() === prevMonth && fd.getFullYear() === prevYear &&
        (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) && f.squadType === 'SENIOR';
    });
    let won = 0, drawn = 0, lost = 0;
    monthFixtures.forEach(f => {
      const isHome = f.homeTeamId === userClub.id;
      const us = isHome ? f.homeScore! : f.awayScore!;
      const them = isHome ? f.awayScore! : f.homeScore!;
      if (us > them) won++; else if (us < them) lost++; else drawn++;
    });
    if (monthFixtures.length > 0) {
      const monthDate = new Date(prevYear, prevMonth, 15);
      generateMonthlyChronicle(userClub.id, monthDate, { won, drawn, lost });
    }
    lastChronicleMonth.current = date.getMonth();
  }
}
