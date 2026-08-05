import { Fixture, Club, NationalTeamMatchOptions, NationalTeamChronicleContext } from '../types';
import { world } from './worldManager';
import { LifecycleManager } from './lifecycleManager';
import { MatchSimulator } from './engine';
import { generateMatchChronicle, generateNationalTeamChronicle } from './chronicleService';
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

// ─── Shared day simulation logic ─────────────────────────────────────────────

/**
 * Determina si un fixture debe resolverse con resultado instantáneo (LIGHT):
 * partidos de reservas/sub-20 y ligas que no son "deep" para el usuario.
 * Copas, torneos continentales, selecciones y amistosos conservan la simulación completa.
 */
export function isLightFixture(f: Fixture, deepLeagueIds: Set<string>): boolean {
  if (f.squadType !== 'SENIOR') return true; // reservas y juveniles: siempre instantáneo
  if (deepLeagueIds.has(f.competitionId)) return false; // liga profunda del usuario: detalle completo
  const comp = world.competitions.find(c => c.id === f.competitionId);
  return comp?.type === 'LEAGUE'; // solo ligas de fondo usan resultado instantáneo
}

export interface DaySimParams {
  date: Date;
  fixtures: Fixture[];
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  /** If true, skip simulating fixtures involving el club o la selección del usuario (usado por simulateToNextMatch) */
  skipUserMatches?: boolean;
}

/** Tamaño de lote: cada N partidos se cede el hilo principal para que la UI pinte. */
const FIXTURE_BATCH = 40;

/**
 * Cooperative scheduling: cede el hilo principal para que la UI pinte y responda
 * a input (alternativa pragmática al Web Worker para esta arquitectura).
 */
function yieldToMainThread(): Promise<void> {
  const sched = (globalThis as any)?.scheduler;
  if (sched && typeof sched.yield === 'function') return sched.yield() as Promise<void>;
  return new Promise(r => setTimeout(r, 0));
}

/**
 * Simulate all fixtures for a single day (async, chunked para no congelar la UI).
 * Al finalizar, invalida la caché de tablas de posiciones.
 */
export async function simulateDayFixtures(params: DaySimParams): Promise<void> {
  const { date, fixtures, userClub, selectedNationalTeamId } = params;
  const dayFixtures = fixtures.filter(f =>
    f.date.toDateString() === date.toDateString() && !f.played
  );
  if (dayFixtures.length === 0) return;

  // Pre-cache squads
  const uniqueClubIds = [...new Set(dayFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
  const squads = world.preFetchSquads(uniqueClubIds);
  const deepIds = new Set(useGameStore.getState().deepSimLeagues);
  const isUserFixture = (f: Fixture) =>
    (userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) ||
    (selectedNationalTeamId && (f.homeTeamId === selectedNationalTeamId || f.awayTeamId === selectedNationalTeamId));

  for (let i = 0; i < dayFixtures.length; i++) {
    // Cooperative scheduling: ceder cada lote para que el navegador pinte y responda
    if (i > 0 && i % FIXTURE_BATCH === 0) await yieldToMainThread();

    const f = dayFixtures[i];
    // Skip user matches if requested (simulateToNextMatch stops at user match)
    if (params.skipUserMatches && isUserFixture(f)) continue;

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
      const light = isLightFixture(f, deepIds);
      const { homeScore, awayScore, stats, events } = light
        ? MatchSimulator.simulateLightMatch(f.homeTeamId, f.awayTeamId, f.squadType)
        : MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
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
      }
      if (userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) {
        const us = f.homeTeamId === userClub.id ? homeScore : awayScore;
        const os = f.homeTeamId === userClub.id ? awayScore : homeScore;
        useGameStore.getState().trackMatchResult(us, os);
        world.updateManagerProfileMatch(us, os);
        world.updateTacticalFamiliarity(userClub.id);
        generateMatchChronicle(f, homeScore, awayScore, stats, userClub.id, events);
      }
    }
    world.generateMatchNews(f, f.homeScore!, f.awayScore!, date);
  }

  // Los resultados de hoy afectan las tablas de posiciones → invalidar caché
  world.bumpFixturesVersion();
}
