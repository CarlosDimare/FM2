import { Club, Fixture, LeagueStanding } from '../types';
import { generateUUID, randomInt } from './utils';

export interface UCLTeam {
  clubId: string;
  clubName: string;
  country: string;
  seed: number;
}

export class ChampionsLeagueManager {
  private leagueId: string;
  private leagueStandings: LeagueStanding[] = [];
  private clubs: Club[] = [];

  constructor(leagueId: string) {
    this.leagueId = leagueId;
  }

  static getQualifiedClubs(standings: LeagueStanding[], clubs: Club[], country: string): UCLTeam[] {
    const qualified: UCLTeam[] = [];
    
    // Top 4 qualify for league phase
    const top4 = standings.slice(0, 4);
    top4.forEach((s, i) => {
      const club = clubs.find(c => c.id === s.clubId);
      if (club) {
        qualified.push({
          clubId: club.id,
          clubName: club.name,
          country,
          seed: i + 1,
        });
      }
    });
    
    return qualified;
  }

  static generateLeaguePhase(clubs: UCLTeam[], startDate: Date): Fixture[] {
    const fixtures: Fixture[] = [];
    const numClubs = clubs.length; // 36
    
    if (numClubs < 2) return fixtures;

    // Swiss format: each team plays 8 matches (4 home, 4 away)
    // For simplicity, we'll generate 8 rounds
    const rounds = 8;
    let currentDate = new Date(startDate);
    
    // Ensure Tuesday/Wednesday for UCL
    while (currentDate.getDay() !== 2 && currentDate.getDay() !== 3) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const shuffled = [...clubs].sort(() => Math.random() - 0.5);
    
    for (let round = 0; round < rounds; round++) {
      const roundClubs = [...shuffled];
      const matchesPerRound = Math.floor(numClubs / 2);
      
      for (let i = 0; i < matchesPerRound; i++) {
        const homeIdx = (round + i) % numClubs;
        const awayIdx = (round + i + Math.floor(numClubs / 2)) % numClubs;
        
        if (homeIdx !== awayIdx) {
          fixtures.push({
            id: generateUUID(),
            competitionId: 'UCL',
            homeTeamId: roundClubs[homeIdx].clubId,
            awayTeamId: roundClubs[awayIdx].clubId,
            date: new Date(currentDate),
            played: false,
            squadType: 'SENIOR',
            stage: 'GROUP',
          });
        }
      }
      
      // Next matchday is a week later
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return fixtures;
  }

  static getLeaguePhaseStandings(fixtures: Fixture[], clubIds: string[]): LeagueStanding[] {
    const standings: LeagueStanding[] = clubIds.map(id => ({
      clubId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      position: 0,
    }));

    fixtures.filter(f => f.played && f.competitionId === 'UCL').forEach(fixture => {
      const home = standings.find(s => s.clubId === fixture.homeTeamId);
      const away = standings.find(s => s.clubId === fixture.awayTeamId);
      
      if (home && away && fixture.homeScore !== undefined && fixture.awayScore !== undefined) {
        home.played++;
        away.played++;
        home.goalsFor += fixture.homeScore;
        home.goalsAgainst += fixture.awayScore;
        away.goalsFor += fixture.awayScore;
        away.goalsAgainst += fixture.homeScore;
        
        if (fixture.homeScore > fixture.awayScore) {
          home.won++;
          home.points += 3;
          away.lost++;
        } else if (fixture.homeScore < fixture.awayScore) {
          away.won++;
          away.points += 3;
          home.lost++;
        } else {
          home.drawn++;
          away.drawn++;
          home.points++;
          away.points++;
        }
      }
    });

    standings.forEach(s => {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
    });

    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    standings.forEach((s, i) => { s.position = i + 1; });
    return standings;
  }

  static generateKnockoutPhase(standings: LeagueStanding[], clubs: Club[], startDate: Date): Fixture[] {
    const fixtures: Fixture[] = [];
    
    // Top 8 qualify directly to R16
    // 9th-24th play playoff
    // 25th-36th eliminated
    
    const qualified = standings.filter(s => s.position <= 24);
    const directQualifiers = qualified.filter(s => s.position <= 8);
    const playoffTeams = qualified.filter(s => s.position >= 9 && s.position <= 24);
    
    let currentDate = new Date(startDate);
    
    // Playoff round (9th-24th)
    if (playoffTeams.length >= 2) {
      // Ensure Wednesday
      while (currentDate.getDay() !== 3) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      for (let i = 0; i < playoffTeams.length; i += 2) {
        if (playoffTeams[i] && playoffTeams[i + 1]) {
          fixtures.push({
            id: generateUUID(),
            competitionId: 'UCL',
            homeTeamId: playoffTeams[i].clubId,
            awayTeamId: playoffTeams[i + 1].clubId,
            date: new Date(currentDate),
            played: false,
            squadType: 'SENIOR',
            stage: 'QUARTER_FINAL',
          });
        }
      }
      
      // Second leg
      currentDate.setDate(currentDate.getDate() + 7);
      for (let i = 0; i < playoffTeams.length; i += 2) {
        if (playoffTeams[i] && playoffTeams[i + 1]) {
          fixtures.push({
            id: generateUUID(),
            competitionId: 'UCL',
            homeTeamId: playoffTeams[i + 1].clubId,
            awayTeamId: playoffTeams[i].clubId,
            date: new Date(currentDate),
            played: false,
            squadType: 'SENIOR',
            stage: 'QUARTER_FINAL',
          });
        }
      }
    }
    
    // R16 (top 8 vs playoff winners)
    // For simplicity, we'll just generate the draw
    const r16Teams = [...directQualifiers, ...playoffTeams.slice(0, 8)];
    const seeded = r16Teams.filter(t => t.position <= 8);
    const unseeded = r16Teams.filter(t => t.position > 8);
    
    currentDate.setDate(currentDate.getDate() + 14);
    while (currentDate.getDay() !== 3) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (let i = 0; i < Math.min(seeded.length, unseeded.length); i++) {
      fixtures.push({
        id: generateUUID(),
        competitionId: 'UCL',
        homeTeamId: unseeded[i].clubId,
        awayTeamId: seeded[i].clubId,
        date: new Date(currentDate),
        played: false,
        squadType: 'SENIOR',
        stage: 'ROUND_OF_16',
      });
    }
    
    // Second leg
    currentDate.setDate(currentDate.getDate() + 7);
    for (let i = 0; i < Math.min(seeded.length, unseeded.length); i++) {
      fixtures.push({
        id: generateUUID(),
        competitionId: 'UCL',
        homeTeamId: seeded[i].clubId,
        awayTeamId: unseeded[i].clubId,
        date: new Date(currentDate),
        played: false,
        squadType: 'SENIOR',
        stage: 'ROUND_OF_16',
      });
    }
    
    return fixtures;
  }
}
