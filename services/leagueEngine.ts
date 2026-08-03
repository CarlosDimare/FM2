
import { Competition, Fixture, SquadType } from "../types";
import { Scheduler } from "./scheduler";
import { MatchSimulator } from "./engine";
import { randomInt, generateUUID } from "./utils";

export type SimulationDepth = 'DEEP' | 'LIGHT';
export type SimulationProfile = 'USER' | 'CONTINENTAL_AFFINITY' | 'DOMESTIC' | 'GLOBAL';

export interface LeagueCluster {
  leagueId: string;
  depth: SimulationDepth;
  competitions: string[];
  squadTypes: SquadType[];
  maxFixtures: number;
}

export interface SimulatedResult {
  homeScore: number;
  awayScore: number;
  homePenalty?: number;
  awayPenalty?: number;
  events?: any[];
  stats?: any;
}

export class LeagueEngine {
  static resolveDepth(deepLeagues: string[], userLeagueId: string, competition: Competition): SimulationDepth {
    const deepIds = new Set(deepLeagues.filter(Boolean));
    if (competition.id === userLeagueId || deepIds.has(competition.id)) return 'DEEP';

    // Continental competitions connected to a deep domestic cluster retain the
    // detailed path; unrelated competitions remain quick-simulated.
    if (competition.type === 'CONTINENTAL_ELITE' || competition.type === 'CONTINENTAL_SMALL') {
      const deepCompetition = deepLeagues.some(id => id === competition.id);
      return deepCompetition || deepLeagues.length <= 6 ? 'DEEP' : 'LIGHT';
    }
    if (competition.type === 'GLOBAL') return deepLeagues.length <= 3 ? 'DEEP' : 'LIGHT';
    return 'LIGHT';
  }

  static resolveDeepLeagueIds(userLeagueId: string | undefined, competitions: Competition[], requested: string[] = []): string[] {
    const userLeague = competitions.find(c => c.id === userLeagueId);
    if (!userLeagueId || !userLeague) return requested.filter(Boolean);

    const ids = new Set<string>([userLeagueId, ...requested.filter(Boolean)]);
    // Same-country divisions are cheap enough to keep detailed and make
    // promotion/relegation and transfers feel coherent.
    competitions
      .filter(c => c.type === 'LEAGUE' && c.country === userLeague.country)
      .sort((a, b) => a.tier - b.tier)
      .slice(0, 2)
      .forEach(c => ids.add(c.id));

    // Keep the deep cluster bounded: the user's country plus up to two
    // continental tier-one leagues provide context without exploding fixtures.
    competitions
      .filter(c => c.type === 'LEAGUE' && c.continent === userLeague.continent && c.tier === 1 && c.country !== userLeague.country)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 2)
      .forEach(c => ids.add(c.id));

    return [...ids];
  }

  static buildCluster(deepLeagues: string[], userLeagueId: string, userClubId: string, clubs: any [], competitions: Competition[]): LeagueCluster[] {
    const userLeague = competitions.find(c => c.id === userLeagueId);
    const userContinent = userLeague?.continent || 'América del Sur';
    const userCountry = userLeague?.country || 'Argentina';

    const effectiveDeepLeagues = this.resolveDeepLeagueIds(userLeagueId, competitions, deepLeagues);

    return competitions
      .filter(c => c.type === 'LEAGUE')
      .map(comp => {
        const depth = this.resolveDepth(effectiveDeepLeagues, userLeagueId, comp);
        let relatedComps = competitions
          .filter(c => c.type !== 'LEAGUE' && (
            c.country === comp.country ||
            (comp.continent && c.country === comp.continent) ||
            c.country === 'Sudamérica' ||
            c.country === 'Europa'
          ))
          .map(c => c.id);
        if (depth === 'DEEP') {
          relatedComps = competitions.filter(c => c.id === comp.id || c.country === comp.country || c.type === 'GLOBAL').map(c => c.id);
        }
        const squadTypes: SquadType[] = depth === 'DEEP' ? ['SENIOR', 'RESERVE', 'U20'] : ['SENIOR'];
        const maxFixtures = depth === 'DEEP' ? 1800 : 400;
        return {
          leagueId: comp.id,
          depth,
          competitions: relatedComps,
          squadTypes,
          maxFixtures
        };
      });
  }

  static generateFixturesForLeague(clubs: any [], compId: string, startDate: Date, squadType: SquadType = 'SENIOR', clubsByLeague: Record<string, any []> = {}): Fixture[] {
    const leagueClubs = clubsByLeague[compId] || clubs.filter(c => (c as any).leagueId === compId);
    if (leagueClubs.length < 2) return [];
    return Scheduler.generateSeasonFixtures(compId, leagueClubs, startDate, squadType);
  }

  static simulateLightRound(compId: string, clubs: any [], roundFixtures: Fixture[]): Fixture[] {
    const seen = new Set<string>();
    const processed: Fixture[] = [];
    for (const fixture of roundFixtures) {
      if (fixture.played || seen.has(fixture.id)) continue;
      seen.add(fixture.id);
      try {
        const result = MatchSimulator.simulateQuickMatch(fixture.homeTeamId, fixture.awayTeamId, 'SENIOR');
        fixture.played = true;
        fixture.homeScore = result.homeScore;
        fixture.awayScore = result.awayScore;
        if (result.homeScore === result.awayScore) {
          let pH = 0;
          let pA = 0;
          while (pH === pA) {
            pH = randomInt(3, 5);
            pA = randomInt(3, 5);
          }
          fixture.penaltyHome = pH;
          fixture.penaltyAway = pA;
        }
        processed.push(fixture);
      } catch (err) {
        console.warn('Light simulation failed for fixture', fixture.id, err);
      }
    }
    return processed;
  }

  static getNextDeepFixture(clusters: LeagueCluster[], fixtures: Fixture[], currentDate: Date, userClubId?: string): Fixture | null {
    const candidate = fixtures.find(f => !f.played && f.date >= currentDate);
    if (!candidate) return null;
    if (userClubId && (candidate.homeTeamId === userClubId || candidate.awayTeamId === userClubId)) return candidate;
    if (clusters.some(cluster => cluster.depth === 'DEEP' && cluster.leagueId === candidate.competitionId)) return candidate;
    if (clusters.filter(c => c.depth === 'DEEP').length === 0 && candidate.squadType === 'SENIOR' && candidate.stage === 'REGULAR') return candidate;
    return null;
  }
}
