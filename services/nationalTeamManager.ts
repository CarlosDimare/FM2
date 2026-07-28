import { Player, Club, NationalTeam, Competition, Fixture, LeagueStanding } from '../types';
import { generateUUID, randomInt } from './utils';

export interface NationalTeamDef {
  id: string;
  name: string;
  country: string;
  confederation: 'CONMEBOL' | 'UEFA' | 'CAF' | 'CONCACAF' | 'AFC' | 'OFC';
  reputation: number;
  formation: string;
}

export class NationalTeamManager {
  private nationalTeams: NationalTeam[] = [];
  private playerAssignments: Record<string, string[]> = {};

  static NATIONAL_TEAMS: NationalTeamDef[] = [
    // CONMEBOL (10 teams)
    { id: 'ARG', name: 'Argentina', country: 'Argentina', confederation: 'CONMEBOL', reputation: 9500, formation: '4-3-3' },
    { id: 'BRA', name: 'Brazil', country: 'Brasil', confederation: 'CONMEBOL', reputation: 9400, formation: '4-3-3' },
    { id: 'URU', name: 'Uruguay', country: 'Uruguay', confederation: 'CONMEBOL', reputation: 9000, formation: '4-4-2' },
    { id: 'COL', name: 'Colombia', country: 'Colombia', confederation: 'CONMEBOL', reputation: 8800, formation: '4-2-3-1' },
    { id: 'CHL', name: 'Chile', country: 'Chile', confederation: 'CONMEBOL', reputation: 8500, formation: '4-3-3' },
    { id: 'ECU', name: 'Ecuador', country: 'Ecuador', confederation: 'CONMEBOL', reputation: 8200, formation: '4-4-2' },
    { id: 'PAR', name: 'Paraguay', country: 'Paraguay', confederation: 'CONMEBOL', reputation: 8000, formation: '4-4-2' },
    { id: 'PER', name: 'Peru', country: 'Peru', confederation: 'CONMEBOL', reputation: 7800, formation: '4-4-2' },
    { id: 'BOL', name: 'Bolivia', country: 'Bolivia', confederation: 'CONMEBOL', reputation: 7500, formation: '4-4-2' },
    { id: 'VEN', name: 'Venezuela', country: 'Venezuela', confederation: 'CONMEBOL', reputation: 7300, formation: '4-4-2' },

    // UEFA (major teams)
    { id: 'FRA', name: 'France', country: 'Francia', confederation: 'UEFA', reputation: 9600, formation: '4-3-3' },
    { id: 'ESP', name: 'Spain', country: 'España', confederation: 'UEFA', reputation: 9500, formation: '4-3-3' },
    { id: 'ENG', name: 'England', country: 'Inglaterra', confederation: 'UEFA', reputation: 9300, formation: '4-2-3-1' },
    { id: 'DEU', name: 'Germany', country: 'Alemania', confederation: 'UEFA', reputation: 9200, formation: '4-2-3-1' },
    { id: 'ITA', name: 'Italy', country: 'Italia', confederation: 'UEFA', reputation: 9000, formation: '4-3-3' },
    { id: 'NLD', name: 'Netherlands', country: 'Países Bajos', confederation: 'UEFA', reputation: 8900, formation: '4-3-3' },
    { id: 'BEL', name: 'Belgium', country: 'Bélgica', confederation: 'UEFA', reputation: 8700, formation: '4-2-3-1' },
    { id: 'PRT', name: 'Portugal', country: 'Portugal', confederation: 'UEFA', reputation: 8800, formation: '4-3-3' },
    { id: 'HRV', name: 'Croatia', country: 'Croacia', confederation: 'UEFA', reputation: 8500, formation: '4-3-3' },
    { id: 'CHE', name: 'Switzerland', country: 'Suiza', confederation: 'UEFA', reputation: 8200, formation: '4-2-3-1' },
    { id: 'AUT', name: 'Austria', country: 'Austria', confederation: 'UEFA', reputation: 8000, formation: '4-2-3-1' },
    { id: 'DNK', name: 'Denmark', country: 'Dinamarca', confederation: 'UEFA', reputation: 8100, formation: '4-3-3' },
    { id: 'SWE', name: 'Sweden', country: 'Suecia', confederation: 'UEFA', reputation: 7900, formation: '4-4-2' },
    { id: 'NOR', name: 'Norway', country: 'Noruega', confederation: 'UEFA', reputation: 7800, formation: '4-3-3' },
    { id: 'POL', name: 'Poland', country: 'Polonia', confederation: 'UEFA', reputation: 7700, formation: '4-4-2' },
    { id: 'UKR', name: 'Ukraine', country: 'Ucrania', confederation: 'UEFA', reputation: 7600, formation: '4-2-3-1' },
    { id: 'SRB', name: 'Serbia', country: 'Serbia', confederation: 'UEFA', reputation: 7500, formation: '4-4-2' },
    { id: 'TUR', name: 'Turkey', country: 'Turquía', confederation: 'UEFA', reputation: 7400, formation: '4-2-3-1' },
    { id: 'RUS', name: 'Russia', country: 'Rusia', confederation: 'UEFA', reputation: 7300, formation: '4-4-2' },

    // CONCACAF
    { id: 'MEX', name: 'Mexico', country: 'México', confederation: 'CONCACAF', reputation: 8200, formation: '4-3-3' },
    { id: 'USA', name: 'United States', country: 'Estados Unidos', confederation: 'CONCACAF', reputation: 8000, formation: '4-3-3' },
    { id: 'CAN', name: 'Canada', country: 'Canadá', confederation: 'CONCACAF', reputation: 7500, formation: '4-4-2' },

    // AFC
    { id: 'JPN', name: 'Japan', country: 'Japón', confederation: 'AFC', reputation: 8000, formation: '4-2-3-1' },
    { id: 'KOR', name: 'South Korea', country: 'Corea del Sur', confederation: 'AFC', reputation: 7800, formation: '4-4-2' },
    { id: 'AUS', name: 'Australia', country: 'Australia', confederation: 'AFC', reputation: 7600, formation: '4-4-2' },
    { id: 'SAU', name: 'Saudi Arabia', country: 'Arabia Saudita', confederation: 'AFC', reputation: 7200, formation: '4-2-3-1' },

    // CAF
    { id: 'MAR', name: 'Morocco', country: 'Marruecos', confederation: 'CAF', reputation: 8200, formation: '4-2-3-1' },
    { id: 'SEN', name: 'Senegal', country: 'Senegal', confederation: 'CAF', reputation: 7800, formation: '4-4-2' },
    { id: 'NGA', name: 'Nigeria', country: 'Nigeria', confederation: 'CAF', reputation: 7700, formation: '4-3-3' },
    { id: 'EGY', name: 'Egypt', country: 'Egipto', confederation: 'CAF', reputation: 7600, formation: '4-4-2' },
    { id: 'GHA', name: 'Ghana', country: 'Ghana', confederation: 'CAF', reputation: 7500, formation: '4-4-2' },
    { id: 'CMR', name: 'Cameroon', country: 'Camerún', confederation: 'CAF', reputation: 7400, formation: '4-4-2' },
    { id: 'CIV', name: 'Ivory Coast', country: 'Costa de Marfil', confederation: 'CAF', reputation: 7300, formation: '4-3-3' },
    { id: 'TUN', name: 'Tunisia', country: 'Túnez', confederation: 'CAF', reputation: 7200, formation: '4-4-2' },
  ];

  static WORLD_CUP_GROUPS: { name: string; teams: string[] }[] = [
    { name: 'Grupo A', teams: ['ARG', 'JPN', 'SEN', 'AUT'] },
    { name: 'Grupo B', teams: ['BRA', 'ENG', 'ECU', 'NGA'] },
    { name: 'Grupo C', teams: ['FRA', 'URU', 'KOR', 'MAR'] },
    { name: 'Grupo D', teams: ['ESP', 'COL', 'DNK', 'USA'] },
    { name: 'Grupo E', teams: ['DEU', 'CHL', 'POL', 'SEN'] },
    { name: 'Grupo F', teams: ['ITA', 'BEL', 'NOR', 'GHA'] },
    { name: 'Grupo G', teams: ['NLD', 'PRT', 'SWE', 'EGY'] },
    { name: 'Grupo H', teams: ['HRV', 'CHE', 'CMR', 'MEX'] },
  ];

  static COPA_AMERICA_TEAMS = ['ARG', 'BRA', 'URU', 'COL', 'CHL', 'ECU', 'PAR', 'PER', 'BOL', 'VEN', 'MEX', 'USA'];

  static EURO_TEAMS = ['FRA', 'ESP', 'ENG', 'DEU', 'ITA', 'NLD', 'BEL', 'PRT', 'HRV', 'CHE', 'AUT', 'DNK', 'SWE', 'NOR', 'POL', 'UKR', 'SRB', 'TUR', 'RUS', 'MAR', 'SEN', 'NGA'];

  static AFCON_TEAMS = ['MAR', 'SEN', 'NGA', 'EGY', 'GHA', 'CMR', 'CIV', 'TUN'];

  constructor() {
    this.init();
  }

  private init() {
    for (const def of NationalTeamManager.NATIONAL_TEAMS) {
      this.nationalTeams.push({
        ...def,
        playerIds: [],
      });
    }
  }

  static getNationalTeamByCountry(country: string): NationalTeamDef | undefined {
    return this.NATIONAL_TEAMS.find(t => t.country === country);
  }

  static getNationalTeamsByConfederation(confederation: string): NationalTeamDef[] {
    return this.NATIONAL_TEAMS.filter(t => t.confederation === confederation);
  }

  assignPlayersToNationalTeams(players: Player[], clubs: Club[]) {
    for (const team of this.nationalTeams) {
      const teamPlayers = players.filter(p => {
        const club = clubs.find(c => c.id === p.clubId);
        return club && club.country === team.country;
      });

      team.playerIds = teamPlayers
        .sort((a, b) => {
          const aOverall = (a.stats.visible.fisico + a.stats.visible.mental + a.stats.visible.tecnica) / 3;
          const bOverall = (b.stats.visible.fisico + b.stats.visible.mental + b.stats.visible.tecnica) / 3;
          return bOverall - aOverall;
        })
        .slice(0, 23)
        .map(p => p.id);
    }
  }

  generateWorldCupQualifiers(startYear: number, confederation: string): Fixture[] {
    const fixtures: Fixture[] = [];
    const teams = NationalTeamManager.getNationalTeamsByConfederation(confederation);
    const currentDate = new Date(startYear, 8, 1);

    if (confederation === 'CONMEBOL') {
      // Round-robin format: each team plays every other team home and away
      for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
          if (i !== j) {
            const matchDate = new Date(currentDate);
            matchDate.setDate(matchDate.getDate() + (i * teams.length + j) * 7);

            fixtures.push({
              id: generateUUID(),
              competitionId: 'WC_Q',
              homeTeamId: teams[i].id,
              awayTeamId: teams[j].id,
              date: matchDate,
              played: false,
              squadType: 'SENIOR',
              stage: 'REGULAR',
            });
          }
        }
      }
    } else if (confederation === 'UEFA') {
      // Group stage format
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      const groupSize = 6;
      const numGroups = Math.ceil(shuffled.length / groupSize);

      for (let g = 0; g < numGroups; g++) {
        const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);

        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = 0; j < groupTeams.length; j++) {
            if (i !== j) {
              const matchDate = new Date(currentDate);
              matchDate.setDate(matchDate.getDate() + (g * groupSize * groupSize + i * groupSize + j) * 7);

              fixtures.push({
                id: generateUUID(),
                competitionId: 'WC_Q',
                homeTeamId: groupTeams[i].id,
                awayTeamId: groupTeams[j].id,
                date: matchDate,
                played: false,
                squadType: 'SENIOR',
                stage: 'GROUP',
                groupId: g,
              });
            }
          }
        }
      }
    }

    return fixtures;
  }

  generateCopaAmerica(startYear: number): Fixture[] {
    const fixtures: Fixture[] = [];
    const teams = NationalTeamManager.COPA_AMERICA_TEAMS;
    const currentDate = new Date(startYear, 5, 1);

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const groupSize = 4;
    const numGroups = Math.ceil(shuffled.length / groupSize);

    for (let g = 0; g < numGroups; g++) {
      const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);

      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = 0; j < groupTeams.length; j++) {
          if (i !== j) {
            const matchDate = new Date(currentDate);
            matchDate.setDate(matchDate.getDate() + (g * groupSize * groupSize + i * groupSize + j) * 4);

            fixtures.push({
              id: generateUUID(),
              competitionId: 'COPA',
              homeTeamId: groupTeams[i],
              awayTeamId: groupTeams[j],
              date: matchDate,
              played: false,
              squadType: 'SENIOR',
              stage: 'GROUP',
              groupId: g,
            });
          }
        }
      }
    }

    return fixtures;
  }

  generateEuro(startYear: number): Fixture[] {
    const fixtures: Fixture[] = [];
    const teams = NationalTeamManager.EURO_TEAMS;
    const currentDate = new Date(startYear, 5, 1);

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const groupSize = 4;
    const numGroups = Math.ceil(shuffled.length / groupSize);

    for (let g = 0; g < numGroups; g++) {
      const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);

      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = 0; j < groupTeams.length; j++) {
          if (i !== j) {
            const matchDate = new Date(currentDate);
            matchDate.setDate(matchDate.getDate() + (g * groupSize * groupSize + i * groupSize + j) * 4);

            fixtures.push({
              id: generateUUID(),
              competitionId: 'EURO',
              homeTeamId: groupTeams[i],
              awayTeamId: groupTeams[j],
              date: matchDate,
              played: false,
              squadType: 'SENIOR',
              stage: 'GROUP',
              groupId: g,
            });
          }
        }
      }
    }

    return fixtures;
  }

  generateAFCON(startYear: number): Fixture[] {
    const fixtures: Fixture[] = [];
    const teams = NationalTeamManager.AFCON_TEAMS;
    const currentDate = new Date(startYear, 0, 1);

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const groupSize = 4;
    const numGroups = Math.ceil(shuffled.length / groupSize);

    for (let g = 0; g < numGroups; g++) {
      const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);

      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = 0; j < groupTeams.length; j++) {
          if (i !== j) {
            const matchDate = new Date(currentDate);
            matchDate.setDate(matchDate.getDate() + (g * groupSize * groupSize + i * groupSize + j) * 4);

            fixtures.push({
              id: generateUUID(),
              competitionId: 'AFCON',
              homeTeamId: groupTeams[i],
              awayTeamId: groupTeams[j],
              date: matchDate,
              played: false,
              squadType: 'SENIOR',
              stage: 'GROUP',
              groupId: g,
            });
          }
        }
      }
    }

    return fixtures;
  }

  getQualificationStandings(fixtures: Fixture[], teamIds: string[]): LeagueStanding[] {
    const standings: LeagueStanding[] = teamIds.map(id => ({
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

    fixtures.filter(f => f.played).forEach(fixture => {
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

  getQualifiedTeamsForWorldCup(standings: LeagueStanding[], confederation: string): string[] {
    const qualified: string[] = [];

    if (confederation === 'CONMEBOL') {
      // Top 6 qualify directly, 7th goes to playoff
      qualified.push(...standings.slice(0, 6).map(s => s.clubId));
    } else if (confederation === 'UEFA') {
      // Top teams from groups qualify
      qualified.push(...standings.slice(0, 12).map(s => s.clubId));
    }

    return qualified;
  }

  generateWorldCupFinalTournament(qualifiedTeamIds: string[], startYear: number): Fixture[] {
    const fixtures: Fixture[] = [];
    const currentDate = new Date(startYear, 5, 15); // June 15

    // Group stage: 8 groups of 4
    const shuffled = [...qualifiedTeamIds].sort(() => Math.random() - 0.5);
    const groups = [];
    for (let i = 0; i < shuffled.length; i += 4) {
      groups.push(shuffled.slice(i, i + 4));
    }

    // Generate group matches
    for (let g = 0; g < groups.length; g++) {
      const groupTeams = groups[g];
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const matchDate = new Date(currentDate);
          matchDate.setDate(matchDate.getDate() + (g * 3 + i + j) * 4);

          fixtures.push({
            id: generateUUID(),
            competitionId: 'WC_FINAL',
            homeTeamId: groupTeams[i],
            awayTeamId: groupTeams[j],
            date: matchDate,
            played: false,
            squadType: 'SENIOR',
            stage: 'GROUP',
            groupId: g,
          });
        }
      }
    }

    // Knockout rounds (generated after group stage via processCompetitionProgress)
    return fixtures;
  }

  getWorldCupGroupStandings(fixtures: Fixture[]): Record<number, LeagueStanding[]> {
    const standings: Record<number, LeagueStanding[]> = {};
    const groupMatches = fixtures.filter(f => f.stage === 'GROUP');

    for (const match of groupMatches) {
      const g = match.groupId || 0;
      if (!standings[g]) {
        standings[g] = [];
      }

      let homeEntry = standings[g].find(s => s.clubId === match.homeTeamId);
      let awayEntry = standings[g].find(s => s.clubId === match.awayTeamId);

      if (!homeEntry) {
        homeEntry = { clubId: match.homeTeamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [], position: 0 };
        standings[g].push(homeEntry);
      }
      if (!awayEntry) {
        awayEntry = { clubId: match.awayTeamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [], position: 0 };
        standings[g].push(awayEntry);
      }

      if (match.played && match.homeScore !== undefined && match.awayScore !== undefined) {
        homeEntry.played++;
        awayEntry.played++;
        homeEntry.goalsFor += match.homeScore;
        homeEntry.goalsAgainst += match.awayScore;
        awayEntry.goalsFor += match.awayScore;
        awayEntry.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          homeEntry.won++;
          homeEntry.points += 3;
          awayEntry.lost++;
        } else if (match.homeScore < match.awayScore) {
          awayEntry.won++;
          awayEntry.points += 3;
          homeEntry.lost++;
        } else {
          homeEntry.drawn++;
          awayEntry.drawn++;
          homeEntry.points++;
          awayEntry.points++;
        }
      }
    }

    // Calculate goal difference and sort
    for (const g of Object.keys(standings).map(Number)) {
      standings[g].forEach(s => { s.goalDifference = s.goalsFor - s.goalsAgainst; });
      standings[g].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
      standings[g].forEach((s, i) => { s.position = i + 1; });
    }

    return standings;
  }
}
