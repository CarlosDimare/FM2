
import { Player, Position, Club, Fixture, TableEntry, Competition, MatchStage, Staff, PlayerStats } from "../types";
import { world } from "./worldManager";
import { randomInt, generateUUID } from "./utils";
import { CompetitionSummary } from "../components/SeasonSummaryModal";
import { Scheduler } from "./scheduler";
import { MatchSimulator } from "./engine"; 

export class LifecycleManager {

  // Renamed to broader "ProcessDailyPhysicals" to cover injuries
  static recoverDailyFitness() {
     const clubPhysioMap = new Map<string, number>();
     world.clubs.forEach(c => {
        const physios = world.getStaffByClub(c.id).filter(s => s.role === 'PHYSIO');
        const avg = physios.length > 0 ? physios.reduce((a,b) => a + b.attributes.physiotherapy, 0) / physios.length : 5;
        clubPhysioMap.set(c.id, avg);
     });

     world.players.forEach(p => {
        const physioScore = clubPhysioMap.get(p.clubId) || 5;
        const physioMult = 1 + (physioScore / 40);

        const schedule = p.trainingSchedule || { STRENGTH: 8, AEROBIC: 8, TACTICAL: 8, BALL_CONTROL: 8, DEFENDING: 8, ATTACKING: 8, SHOOTING: 8, SET_PIECES: 4 };
        const totalIntensity = Object.values(schedule).reduce((a, b) => a + b, 0);
        const trainingFatigue = Math.max(0, (totalIntensity - 40) * 0.08);

        // Fitness Recovery (reduced by training load)
        if (p.fitness < 100) {
           const recovery = (2 + (p.stats.internal.resistencia * 0.65)) * physioMult - trainingFatigue;
           p.fitness = Math.min(100, Math.round(p.fitness + Math.max(0, recovery)));
        }

        // Training injury risk (high load + low fitness)
        if (p.fitness < 60 && totalIntensity > 50 && Math.random() < 0.005 * (totalIntensity - 40) / 20) {
           if (!p.injury) {
             p.injury = { type: 'Entrenamiento', daysLeft: randomInt(3, 10) };
           }
        }

        // Injury Recovery
        if (p.injury) {
           p.injury.daysLeft -= 1;
           if (p.injury.daysLeft <= 0) {
              p.injury = undefined;
           }
        }
     });
  }

  static processMonthlyFinances(currentDate: Date) {
     const month = currentDate.getMonth();
     const day = currentDate.getDate();
     if (day !== 1) return;

     world.clubs.forEach(club => {
        const playerSalaries = world.getPlayersByClub(club.id).reduce((s, p) => s + p.salary, 0);
        const staffSalaries = world.getStaffByClub(club.id).reduce((s, st) => s + st.salary, 0);
        const totalSalaries = playerSalaries + staffSalaries;
        const operational = Math.round(club.reputation * 10);

        const sponsorships = Math.round(club.reputation * 80);
        const seasonTicket = Math.round(club.stadiumCapacity * 0.35 * 12 * 0.45);
        const merchandising = Math.round(club.reputation * 25);
        const baseIncome = sponsorships + seasonTicket + merchandising;

        club.finances.monthlyIncome = baseIncome + Math.max(0, club.finances.monthlyIncome);
        club.finances.monthlyExpenses = totalSalaries + operational;

        const lastMonthIncome = club.finances.monthlyIncome;
        const lastMonthExpenses = club.finances.monthlyExpenses;

        club.finances.balance += lastMonthIncome;
        club.finances.balance -= lastMonthExpenses;

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthLabel = `${monthNames[month]} ${currentDate.getFullYear()}`;
        club.finances.monthlyHistory.push({ month: monthLabel, income: lastMonthIncome, expenses: lastMonthExpenses, balance: club.finances.balance });
        if (club.finances.monthlyHistory.length > 12) club.finances.monthlyHistory.shift();

        if (club.finances.balance < 0) {
          const interest = Math.round(Math.abs(club.finances.balance) * 0.05);
          club.finances.balance -= interest;
        }

        club.finances.monthlyIncome = 0;
        club.finances.transferBudget += Math.round(lastMonthIncome * 0.05);

        const monthlyNet = lastMonthIncome - lastMonthExpenses;
        if (monthlyNet > 0) {
          club.finances.transferBudget += Math.round(monthlyNet * 0.1);
        } else if (monthlyNet < -50000) {
          club.finances.transferBudget = Math.max(0, club.finances.transferBudget + Math.round(monthlyNet * 0.15));
        }

        if (club.finances.balance < -(club.reputation * 500)) {
          this.executeTakeover(club, currentDate);
        }
      });
   }

   private static executeTakeover(club: Club, currentDate: Date) {
      const squad = world.getPlayersByClub(club.id).filter(p => p.squad === 'SENIOR');
      const sortedByValue = [...squad].sort((a, b) => b.value - a.value);

      let fireSaleRevenue = 0;
      const playersToSell = sortedByValue.slice(0, Math.ceil(sortedByValue.length * 0.4));
      playersToSell.forEach(p => {
        const fireSalePrice = Math.round(p.value * 0.3);
        fireSaleRevenue += fireSalePrice;
        p.value = fireSalePrice;
        p.transferStatus = 'TRANSFERABLE';
      });

      const takeoverAmount = Math.round(club.reputation * 1000 + Math.abs(club.finances.balance) * 2);
      club.finances.balance = Math.round(takeoverAmount * 0.5);
      club.finances.transferBudget = Math.round(takeoverAmount * 0.3);
      club.reputation = Math.min(10000, Math.max(2000, club.reputation - 500));

      world.addInboxMessage(
        'FINANCE',
        'Cambio de propietario',
        `${club.name} ha sido adquirido por nuevos inversores tras problemas financieros. Se vendieron ${playersToSell.length} jugadores por $${(fireSaleRevenue / 1000).toFixed(0)}K. Nuevo presupuesto: $${(club.finances.transferBudget / 1000).toFixed(0)}K.`,
        currentDate,
        club.id
      );
   }

  // New: Decrement suspensions for clubs that just played
  static processPostMatchSuspensions(homeTeamId: string, awayTeamId: string, homeRedCards = 0, awayRedCards = 0) {
     const FINE_PER_RED = 5000;
     const processTeam = (clubId: string, redCards: number) => {
        if (redCards > 0) {
           const club = world.getClub(clubId);
           if (club) {
              club.finances.balance -= redCards * FINE_PER_RED;
              club.finances.monthlyExpenses += redCards * FINE_PER_RED;
           }
        }
        const suspendedPlayers = world.getPlayersByClub(clubId).filter(p => p.suspension && p.suspension.matchesLeft > 0);
        suspendedPlayers.forEach(p => {
           if (p.suspension) {
              p.suspension.matchesLeft -= 1;
              if (p.suspension.matchesLeft <= 0) {
                 p.suspension = undefined;
              }
           }
        });
     };
     processTeam(homeTeamId, homeRedCards);
     processTeam(awayTeamId, awayRedCards);
  }
  
  static processEndOfSeason(fixtures: Fixture[], userClubId?: string, currentDate?: Date): CompetitionSummary[] {
    
    // 1. Force finish all cups recursively (Loop until a Final is played)
    const refDate = currentDate || new Date();
    world.competitions.filter(c => c.type !== 'LEAGUE').forEach(cup => {
        this.resolveCupIdeally(cup, fixtures, refDate);
    });

    // 2. Resolve pending league matches (if any weird leftovers)
    fixtures.filter(f => !f.played && world.getClub(f.homeTeamId)).forEach(f => {
        const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, 'SENIOR');
        f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
        const hEleven = world.selectBestEleven(f.homeTeamId, 'SENIOR');
        const aEleven = world.selectBestEleven(f.awayTeamId, 'SENIOR');
MatchSimulator.finalizeSeasonStats(hEleven, aEleven, stats, homeScore, awayScore, f.competitionId);
                     MatchSimulator.processMatchInjuries(stats);
                     this.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.homeTeamId).length, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.awayTeamId).length);
                     world.processMatchDayIncome(f.homeTeamId, f.competitionId, new Date());
                     world.trackU21Minutes(f.homeTeamId, hEleven, stats, new Date());
                     world.trackU21Minutes(f.awayTeamId, aEleven, stats, new Date());
                     world.generateMatchNews(f, homeScore, awayScore, new Date());
    });

    // 3. Generate Summaries
    const summaries: CompetitionSummary[] = world.competitions.map(comp => {
       let championId = "";
       let championName = "Sin Ganador";

       if (comp.type === 'LEAGUE') {
          const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
          if (table.length > 0) {
             championId = table[0].clubId;
             championName = table[0].clubName;
             const c = world.getClub(championId);
             if (c && currentDate) c.honours.unshift({ name: comp.name, year: currentDate.getFullYear() });
          }
       } else {
          // Find the Played Final
          const finalMatch = fixtures.find(f => f.competitionId === comp.id && f.stage === 'FINAL' && f.played);
          if (finalMatch) {
             const hScore = finalMatch.homeScore || 0;
             const aScore = finalMatch.awayScore || 0;
             let winnerId = "";
             
             if (hScore > aScore) winnerId = finalMatch.homeTeamId;
             else if (aScore > hScore) winnerId = finalMatch.awayTeamId;
             else {
                // Ensure tie-break exists even if simulation missed it
                if (finalMatch.penaltyHome === undefined) {
                    let pH = 0, pA = 0;
                    while(pH === pA) { pH = randomInt(3,5); pA = randomInt(3,5); }
                    finalMatch.penaltyHome = pH;
                    finalMatch.penaltyAway = pA;
                }
                winnerId = finalMatch.penaltyHome! > finalMatch.penaltyAway! ? finalMatch.homeTeamId : finalMatch.awayTeamId;
             }

             if (winnerId) {
                championId = winnerId;
                championName = world.getClub(winnerId)?.name || "Equipo Desconocido";
                const c = world.getClub(championId);
                if (c && currentDate) c.honours.unshift({ name: comp.name, year: currentDate.getFullYear() });
             }
          }
       }

       // Player Awards
       const eligiblePlayers = world.players.filter(p => (p.statsByCompetition[comp.id]?.appearances || 0) > 0);
       if (eligiblePlayers.length === 0) {
          return {
             compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
             topScorer: { name: 'N/A', club: '', value: 0 },
             topAssists: { name: 'N/A', club: '', value: 0 },
             bestGK: { name: 'N/A', club: '', value: '0.00' },
             bestDF: { name: 'N/A', club: '', value: '0.00' }
          };
       }

       const getStats = (p: Player) => p.statsByCompetition[comp.id];
       const topScorer = [...eligiblePlayers].sort((a,b) => getStats(b).goals - getStats(a).goals)[0];
       const topAssister = [...eligiblePlayers].sort((a,b) => getStats(b).assists - getStats(a).assists)[0];
       const bestGK = [...eligiblePlayers].filter(p => p.positions.includes(Position.GK) && getStats(p).appearances > 2).sort((a,b) => (getStats(b).totalRating/(getStats(b).appearances || 1)) - (getStats(a).totalRating/(getStats(a).appearances || 1)))[0];
       const bestDF = [...eligiblePlayers].filter(p => p.positions.some(pos => pos.includes("DF") || pos === Position.SW) && getStats(p).appearances > 2).sort((a,b) => (getStats(b).totalRating/(getStats(b).appearances || 1)) - (getStats(a).totalRating/(getStats(a).appearances || 1)))[0];

       return {
          compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
          topScorer: topScorer ? { name: topScorer.name, club: world.getClub(topScorer.clubId)?.name || '', value: getStats(topScorer).goals } : { name: 'N/A', club: '', value: 0 },
          topAssists: topAssister ? { name: topAssister.name, club: world.getClub(topAssister.clubId)?.name || '', value: getStats(topAssister).assists } : { name: 'N/A', club: '', value: 0 },
          bestGK: bestGK ? { name: bestGK.name, club: world.getClub(bestGK.clubId)?.name || '', value: (getStats(bestGK).totalRating/getStats(bestGK).appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' },
          bestDF: bestDF ? { name: bestDF.name, club: world.getClub(bestDF.clubId)?.name || '', value: (getStats(bestDF).totalRating/getStats(bestDF).appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' }
       };
    });

    // 4. Process Promotions, Relegations and Qualification
    this.handleLeagueMovements(fixtures, currentDate, userClubId);

    // 4b. Prize Money distribution
    const prizePool: Record<string, number> = {
      'L_ARG_1': 5000000,
      'L_ARG_2': 1000000,
      'CONT_LIB': 8000000,
      'CONT_SUD': 3000000,
      'C_ARG': 2000000,
      'W_CLUB': 5000000,
    };
    summaries.forEach(summary => {
      const pool = prizePool[summary.compId] || 0;
      if (pool <= 0) return;
      if (summary.compType === 'LEAGUE') {
        const table = world.getLeagueTable(summary.compId, fixtures, 'SENIOR');
        table.forEach((entry, idx) => {
          const club = world.getClub(entry.clubId);
          if (!club) return;
          const pos = idx + 1;
          const total = table.length;
          const share = pos <= total * 0.25 ? 0.25 : pos <= total * 0.5 ? 0.15 : pos <= total * 0.75 ? 0.08 : 0.03;
          const amount = Math.round(pool * share);
          club.finances.balance += amount;
          club.finances.transferBudget += Math.round(amount * 0.3);
        });
      } else {
        const champ = world.getClub(summary.championId);
        if (champ) {
          const amount = Math.round(pool * 0.5);
          champ.finances.balance += amount;
          champ.finances.transferBudget += Math.round(amount * 0.3);
          if (currentDate) world.addInboxMessage('FINANCE', `Premio: ${summary.compName}`, `${champ.name} ha recibido $${amount.toLocaleString()} por ganar la ${summary.compName}.`, currentDate);
        }
      }
    });

    // 4. U21 Minutes Compliance Check
    const MIN_U21_MINUTES = 600;
    world.competitions.filter(c => c.type === 'LEAGUE').forEach(comp => {
      const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
      table.forEach(entry => {
        const club = world.getClub(entry.clubId);
        if (!club || (club.u21MinutesThisSeason || 0) >= MIN_U21_MINUTES) return;
        const deficit = MIN_U21_MINUTES - (club.u21MinutesThisSeason || 0);
        const penaltyPoints = Math.min(6, Math.ceil(deficit / 200));
        entry.points = Math.max(0, entry.points - penaltyPoints);
        if (currentDate) world.addInboxMessage('COMPETITION', `Sanción sub-21: ${club.name}`, `${club.name} pierde ${penaltyPoints} puntos por no cumplir el mínimo de ${MIN_U21_MINUTES} minutos para jugadores sub-21 (total: ${Math.round(club.u21MinutesThisSeason || 0)}).`, currentDate, club.id);
      });
    });
    world.clubs.forEach(c => c.u21MinutesThisSeason = 0);

    const seasonYear = currentDate ? currentDate.getFullYear() : 2008;

    // 5. Development & History
    world.players.forEach(player => {
      this.updatePlayerDevelopment(player);
      if (player.seasonStats.appearances > 0) {
         player.history.push({ year: seasonYear, clubId: player.clubId, stats: { ...player.seasonStats } });
      }
      player.seasonStats = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 };
      player.statsByCompetition = {}; 
    });

    world.staff.forEach(s => {
      if (s.clubId) {
        const lastEntry = s.history[s.history.length - 1];
        if (!lastEntry || lastEntry.year !== seasonYear || lastEntry.clubId !== s.clubId) {
          s.history.push({ year: seasonYear, clubId: s.clubId, role: s.role });
        }
      }
    });

    // 6. Retirement & Regens
    const retiredIds: string[] = [];
    world.players.forEach(p => { if (p.age > 34 && Math.random() < (p.age - 32) * 0.20) retiredIds.push(p.id); });
    world.players = world.players.filter(p => !retiredIds.includes(p.id));

    const nextSeasonYear = seasonYear + 1;
    world.clubs.forEach(club => {
      const newYouthNames: string[] = [];
      for(let i=0; i<3; i++) {
         const pos = [Position.GK, Position.DC, Position.MC, Position.ST][randomInt(0, 3)];
         const regen = world.createRandomPlayer(club.id, pos, 15, 16, nextSeasonYear);
         regen.squad = 'U20'; 
         world.players.push(regen);
         if (club.id === userClubId) newYouthNames.push(regen.name);
      }
      if (club.id === userClubId && newYouthNames.length > 0 && currentDate) {
         world.addInboxMessage('SQUAD', 'Incorporación de Juveniles', `Se han incorporado ${newYouthNames.length} nuevos jugadores al equipo Sub-20 para la temporada ${nextSeasonYear}.`, currentDate, club.id);
      }
    });

    return summaries;
  }

  // RECURSIVE CUP RESOLVER
  private static resolveCupIdeally(cup: Competition, fixtures: Fixture[], currentDate: Date) {
      let limit = 0;
      let hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
      
      // Use a local simulation date to ensure we progress through rounds logically
      // even if we are simulating everything in one go at season end.
      let simDate = new Date(currentDate);

      while (!hasFinal && limit < 12) {
          // 1. Find matches of this cup that are NOT played
          const pending = fixtures.filter(f => f.competitionId === cup.id && !f.played);
          
          if (pending.length > 0) {
              // Force play them
              pending.forEach(f => {
                  const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, 'SENIOR');
                  f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
                  if (homeScore === awayScore) {
                      let pH = 0, pA = 0;
                      while(pH === pA) { pH = randomInt(3,5); pA = randomInt(3,5); }
                      f.penaltyHome = pH; f.penaltyAway = pA;
                  }
                  const hEleven = world.selectBestEleven(f.homeTeamId, 'SENIOR');
                  const aEleven = world.selectBestEleven(f.awayTeamId, 'SENIOR');
                    MatchSimulator.finalizeSeasonStats(hEleven, aEleven, stats, homeScore, awayScore, f.competitionId);
                    MatchSimulator.processMatchInjuries(stats);
                    this.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.homeTeamId).length, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.awayTeamId).length);
                    world.processMatchDayIncome(f.homeTeamId, f.competitionId, new Date());
                    world.trackU21Minutes(f.homeTeamId, hEleven, stats, new Date());
                    world.trackU21Minutes(f.awayTeamId, aEleven, stats, new Date());
              });
          }

          // 2. Trigger "Next Round" logic using the simulation date
          const nextRoundFixtures = this.processCompetitionProgress(fixtures, simDate);
          
          if (nextRoundFixtures.length > 0) {
              fixtures.push(...nextRoundFixtures);
              // Advance sim date for the next round (2 weeks)
              simDate.setDate(simDate.getDate() + 14);
          } else {
              // No more rounds generated? Maybe we just finished the final?
              hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
              if (hasFinal) break; 
              
              limit++; 
          }
          
          // Check again for loop condition
          hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
          limit++;
      }
  }

  private static handleLeagueMovements(fixtures: Fixture[], currentDate?: Date, userClubId?: string) {
      if (!currentDate) return;

      const t1 = world.getLeagueTable('L_ARG_1', fixtures, 'SENIOR');
      const t2 = world.getLeagueTable('L_ARG_2', fixtures, 'SENIOR');

      if (t1.length < 2 || t2.length < 2) return;

      const relegatedTeams = t1.slice(-2); 
      const promotedTeams = t2.slice(0, 2); 

      // Reset previous qualifications
      world.clubs.forEach(c => c.qualifiedFor = null);

      // FIX: Increase to 6 teams each to ensure we have enough for 32 team pools
      const libTeams = t1.slice(0, 6);
      const sudTeams = t1.slice(6, 12);

      relegatedTeams.forEach(r => {
         const club = world.getClub(r.clubId);
         if (club) {
            club.leagueId = 'L_ARG_2'; 
            if (club.id === userClubId) {
               world.addInboxMessage('COMPETITION', 'DESCENSO CONSUMADO', `Día triste para el club. Hemos descendido a la Segunda División.`, currentDate, club.id);
            } else {
               world.addInboxMessage('COMPETITION', 'Noticias de Liga', `El ${club.name} ha descendido a Segunda División.`, currentDate, club.id);
            }
         }
      });

      promotedTeams.forEach(p => {
         const club = world.getClub(p.clubId);
         if (club) {
            club.leagueId = 'L_ARG_1'; 
            if (club.id === userClubId) {
               world.addInboxMessage('COMPETITION', '¡ASCENSO!', `¡Objetivo cumplido! Jugaremos en Primera División la próxima temporada.`, currentDate, club.id);
            } else {
               world.addInboxMessage('COMPETITION', 'Noticias de Liga', `El ${club.name} ha ascendido a Primera División.`, currentDate, club.id);
            }
         }
      });

      libTeams.forEach(l => {
         const club = world.getClub(l.clubId);
         if (club) {
            club.qualifiedFor = 'CONT_LIB';
            if (club.id === userClubId) world.addInboxMessage('COMPETITION', 'Clasificación Continental', `Nos hemos clasificado para la COPA LIBERTADORES.`, currentDate, club.id);
         }
      });

      sudTeams.forEach(s => {
         const club = world.getClub(s.clubId);
         if (club) {
            club.qualifiedFor = 'CONT_SUD';
            if (club.id === userClubId) world.addInboxMessage('COMPETITION', 'Clasificación Continental', `Nos hemos clasificado para la COPA SUDAMERICANA.`, currentDate, club.id);
         }
      });
  }

  static checkBirthdays(currentDate: Date) {
    world.players.forEach(player => {
      const bDate = new Date(player.birthDate);
      if (bDate.getMonth() === currentDate.getMonth() && bDate.getDate() === currentDate.getDate()) {
        player.age += 1;
      }
    });
  }

   static processCompetitionProgress(fixtures: Fixture[], currentDate: Date): Fixture[] {
       const newFixtures: Fixture[] = [];
       const cups = world.competitions.filter(c => c.type === 'CUP' || c.type.startsWith('CONTINENTAL') || c.type === 'GLOBAL');
       
       cups.forEach(cup => {
          const cupFixtures = fixtures.filter(f => f.competitionId === cup.id);
          
          if (cup.id === 'UCL') {
             // UCL Swiss format: league phase → playoff → R16 → QF → SF → F
             const leaguePhaseMatches = cupFixtures.filter(f => f.stage === 'GROUP');
             const hasPlayoff = cupFixtures.some(f => f.stage === 'QUARTER_FINAL' && f.homeTeamId.startsWith('ucl_'));
             const hasR16 = cupFixtures.some(f => f.stage === 'ROUND_OF_16');
             
             if (leaguePhaseMatches.length > 0 && leaguePhaseMatches.every(f => f.played) && !hasPlayoff && !hasR16) {
                // League phase complete, generate playoff round (9th-24th)
                  const allClubIds = [...new Set(leaguePhaseMatches.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
                const standings = this.calculateUCLStandings(leaguePhaseMatches, allClubIds);
                
                const playoffTeams = standings.filter(s => s.position >= 9 && s.position <= 24);
                const directQualifiers = standings.filter(s => s.position <= 8);
                
                if (playoffTeams.length >= 2) {
                   const nextDate = this.findNextCupDate(currentDate);
                   // Playoff: 9th vs 24th, 10th vs 23rd, etc.
                   for (let i = 0; i < playoffTeams.length / 2; i++) {
                      const home = world.getClub(playoffTeams[i].clubId);
                      const away = world.getClub(playoffTeams[playoffTeams.length - 1 - i].clubId);
                      if (home && away) {
                         newFixtures.push({
                            id: generateUUID(), competitionId: 'UCL', homeTeamId: home.id,
                            awayTeamId: away.id, date: new Date(nextDate), played: false,
                            squadType: 'SENIOR', stage: 'QUARTER_FINAL',
                         });
                      }
                   }
                   world.addInboxMessage('COMPETITION', 'UCL Playoff', `Clasificados al playoff de la Champions League.`, currentDate, 'UCL');
                }
                
                // If no playoffs needed (all direct), go to R16
                if (playoffTeams.length === 0 && directQualifiers.length >= 16) {
                   const nextDate = this.findNextCupDate(currentDate);
                   const seeds = directQualifiers.slice(0, 8);
                   const nonSeeds = directQualifiers.slice(8, 16);
                   for (let i = 0; i < 8; i++) {
                      const home = world.getClub(nonSeeds[i].clubId);
                      const away = world.getClub(seeds[i].clubId);
                      if (home && away) {
                         newFixtures.push({
                            id: generateUUID(), competitionId: 'UCL', homeTeamId: home.id,
                            awayTeamId: away.id, date: new Date(nextDate), played: false,
                            squadType: 'SENIOR', stage: 'ROUND_OF_16',
                         });
                      }
                   }
                }
} else if (hasPlayoff && !hasR16) {
                 // Check if playoff is done, generate R16
                 const playoffMatches = cupFixtures.filter(f => f.stage === 'QUARTER_FINAL' && f.homeTeamId.startsWith('ucl_'));
                 if (playoffMatches.length > 0 && playoffMatches.every(f => f.played)) {
const allClubIds = Array.from(new Set(leaguePhaseMatches.flatMap(f => [f.homeTeamId, f.awayTeamId])));
                    const standings = this.calculateUCLStandings(leaguePhaseMatches, allClubIds);
                    
                    const winners: Club[] = [];
                    playoffMatches.forEach(f => {
                       const winnerId = f.homeScore! > f.awayScore! ? f.homeTeamId : f.awayTeamId;
                       const w = world.getClub(winnerId);
                       if (w) winners.push(w);
                    });
                    
                    const directQualifiers = standings.filter(s => s.position <= 8);
                   const r16Teams = [...directQualifiers.slice(0, 8), ...winners.map(c => ({ clubId: c.id, position: 0 }))];
                   
                   if (r16Teams.length >= 16) {
                      const nextDate = this.findNextCupDate(currentDate);
                      const seeds = r16Teams.slice(0, 8);
                      const nonSeeds = r16Teams.slice(8, 16);
                      for (let i = 0; i < 8; i++) {
                         const home = world.getClub(nonSeeds[i].clubId);
                         const away = world.getClub(seeds[i].clubId);
                         if (home && away) {
                            newFixtures.push({
                               id: generateUUID(), competitionId: 'UCL', homeTeamId: home.id,
                               awayTeamId: away.id, date: new Date(nextDate), played: false,
                               squadType: 'SENIOR', stage: 'ROUND_OF_16',
                            });
                         }
                      }
                   }
                }
             } else {
                this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
             }
          } else if (['COPA', 'EURO', 'AFCON', 'WC_FINAL'].includes(cup.id)) {
             // National team tournament: group stage → knockout
             const groupMatches = cupFixtures.filter(f => f.stage === 'GROUP');
             const hasKnockout = cupFixtures.some(f => 
                ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'].includes(f.stage)
             );
             
             if (groupMatches.length > 0 && groupMatches.every(f => f.played) && !hasKnockout) {
                const groupCount = cup.id === 'WC_FINAL' ? 8 : cup.id === 'COPA' || cup.id === 'EURO' ? 8 : 2;
                const winners: Club[] = [];
                const runnersUp: Club[] = [];
                
                for (let g = 0; g < groupCount; g++) {
                   const groupTable = world.getLeagueTable(cup.id, fixtures, 'SENIOR', g);
                   if (groupTable.length >= 2) {
                      const first = world.getClub(groupTable[0].clubId);
                      const second = world.getClub(groupTable[1].clubId);
                      if (first) winners.push(first);
                      if (second) runnersUp.push(second);
                   }
                }
                
                if (winners.length >= 8 && runnersUp.length >= 8) {
                   const nextDate = this.findNextCupDate(currentDate);
                   for (let i = 0; i < 8; i++) {
                      const home = runnersUp[i];
                      const away = winners[(i + 1) % 8];
                      if (home && away) {
                         newFixtures.push({
                            id: generateUUID(), competitionId: cup.id, homeTeamId: home.id,
                            awayTeamId: away.id, date: new Date(nextDate), played: false,
                            squadType: 'SENIOR', stage: 'QUARTER_FINAL',
                         });
                      }
                   }
                   world.addInboxMessage('COMPETITION', `${cup.name} - Eliminatorias`, `Finalizada la fase de grupos. Se han definido los Cuartos de Final.`, currentDate, cup.id);
                } else if (winners.length >= 4) {
                   const nextDate = this.findNextCupDate(currentDate);
                   for (let i = 0; i < winners.length; i += 2) {
                      if (winners[i] && winners[i+1]) {
                         newFixtures.push({
                            id: generateUUID(), competitionId: cup.id, homeTeamId: winners[i].id,
                            awayTeamId: winners[i+1].id, date: new Date(nextDate), played: false,
                            squadType: 'SENIOR', stage: 'QUARTER_FINAL',
                         });
                      }
                   }
                }
             } else {
                this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
             }
          } else if (cup.type.startsWith('CONTINENTAL')) {
             const groupMatches = cupFixtures.filter(f => f.stage === 'GROUP');
             const hasRound16 = cupFixtures.some(f => f.stage === 'ROUND_OF_16');
             
             if (groupMatches.length > 0 && groupMatches.every(f => f.played) && !hasRound16) {
                const pot1: Club[] = [];
                const pot2: Club[] = [];
                
                for(let g=0; g<8; g++) {
                   const groupTable = world.getLeagueTable(cup.id, fixtures, 'SENIOR', g);
                   if (groupTable.length >= 2) {
                      const first = world.getClub(groupTable[0].clubId);
                      const second = world.getClub(groupTable[1].clubId);
                      if (first) pot1.push(first);
                      if (second) pot2.push(second);
                   }
                }
                
                if (pot1.length === 8 && pot2.length === 8) {
                   const nextDate = this.findNextCupDate(currentDate);
                   newFixtures.push(...Scheduler.generateKnockoutDraw(cup.id, pot1, pot2, nextDate, 'ROUND_OF_16'));
                   world.addInboxMessage('COMPETITION', `Sorteo ${cup.name}`, `Finalizada la fase de grupos. Se han sorteado los cruces de Octavos.`, currentDate, cup.id);
                }
             } else {
                this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
             }
          } else {
             this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
          }
       });
       return newFixtures;
    }

private static calculateUCLStandings(fixtures: Fixture[], clubIds: string[]): LeagueStanding[] {
        const table: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }> = {};
        
        clubIds.forEach(id => {
           table[id] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
        });

        fixtures.filter(f => f.played).forEach(f => {
           const home = table[f.homeTeamId];
           const away = table[f.awayTeamId];
           if (home && away && f.homeScore !== undefined && f.awayScore !== undefined) {
              home.played++; away.played++;
              home.gf += f.homeScore; home.ga += f.awayScore;
              away.gf += f.awayScore; away.ga += f.homeScore;
              if (f.homeScore > f.awayScore) { home.won++; home.points += 3; away.lost++; }
              else if (f.homeScore < f.awayScore) { away.won++; away.points += 3; home.lost++; }
              else { home.drawn++; away.drawn++; home.points++; away.points++; }
           }
        });

        return Object.entries(table)
           .map(([clubId, s]) => ({
              clubId,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goalsFor: s.gf,
              goalsAgainst: s.ga,
              goalDifference: s.gf - s.ga,
              points: s.points,
              form: [],
              position: 0
           }))
           .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
           .map((s, i) => ({ ...s, position: i + 1 }));
     }

  private static findNextCupDate(fromDate: Date): Date {
     const d = new Date(fromDate);
     d.setDate(d.getDate() + 14); 
     while(d.getDay() !== 3) { d.setDate(d.getDate() + 1); }
     return d;
  }

  private static processKnockoutStage(cup: Competition, cupFixtures: Fixture[], currentDate: Date, newFixtures: Fixture[]) {
      const stages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
      let currentStageIdx = -1;
      
      // Find the furthest stage that has fixtures
      for(let i=stages.length-1; i>=0; i--) {
         if (cupFixtures.some(f => f.stage === stages[i])) {
            currentStageIdx = i;
            break;
         }
      }
      
      // If no knockout stages yet (only R32 or nothing), check if R32 is done
      if (currentStageIdx === -1) {
          const r32 = cupFixtures.filter(f => f.stage === 'ROUND_OF_32');
          if (r32.length > 0 && r32.every(f => f.played)) {
              this.generateNextRound(cup, r32, 'ROUND_OF_16', currentDate, newFixtures);
          }
          return;
      }

      if (currentStageIdx >= stages.length - 1) return; // Final is done

      const currentStage = stages[currentStageIdx];
      const nextStage = stages[currentStageIdx + 1];
      const currentRoundMatches = cupFixtures.filter(f => f.stage === currentStage);
      
      if (currentRoundMatches.every(f => f.played) && !cupFixtures.some(f => f.stage === nextStage) && currentRoundMatches.length > 0) {
          this.generateNextRound(cup, currentRoundMatches, nextStage as MatchStage, currentDate, newFixtures);
      }
  }

  private static generateNextRound(cup: Competition, prevRoundMatches: Fixture[], nextStage: MatchStage, currentDate: Date, newFixtures: Fixture[]) {
      const winners: Club[] = [];
         
      prevRoundMatches.forEach(f => {
        const winnerId = this.resolveKnockoutTie(f);
        const wClub = world.getClub(winnerId);
        if (wClub) winners.push(wClub);
      });

      if (winners.length >= 2) {
        const nextDate = this.findNextCupDate(currentDate);
        newFixtures.push(...Scheduler.generateCupRound(cup.id, winners, nextDate, nextStage));
        
        const msg = nextStage === 'FINAL' ? `Definida la Gran Final de la ${cup.name}.` : `Definidos los cruces de ${nextStage} en la ${cup.name}.`;
        world.addInboxMessage('COMPETITION', `Fase Avanzada ${cup.name}`, msg, currentDate, cup.id);
      }
  }

  private static resolveKnockoutTie(fixture: Fixture): string {
     const h = fixture.homeScore || 0;
     const a = fixture.awayScore || 0;
     
     if (h > a) return fixture.homeTeamId;
     if (a > h) return fixture.awayTeamId;
     
     if (fixture.penaltyHome === undefined) {
        let pH = 0, pA = 0;
        while(pH === pA) {
           if (Math.random() > 0.2) pH++;
           if (Math.random() > 0.2) pA++;
        }
        fixture.penaltyHome = pH;
        fixture.penaltyAway = pA;
     }
     
     return fixture.penaltyHome! > fixture.penaltyAway! ? fixture.homeTeamId : fixture.awayTeamId;
  }

  private static updatePlayerDevelopment(p: Player) {
     const i = p.stats.internal;
     const avgRating = p.seasonStats.appearances > 3 ? p.seasonStats.totalRating / p.seasonStats.appearances : 5.5;
     
     let growthFactor = 1.0;
     if (avgRating >= 7.5) growthFactor = 2.0;
     else if (avgRating >= 7.0) growthFactor = 1.5;
     else if (avgRating >= 6.5) growthFactor = 1.0;
     else if (avgRating >= 6.0) growthFactor = 0.8;
     else growthFactor = 0.4;

     const coaches = world.getStaffByClub(p.clubId).filter(s => s.role !== 'PHYSIO');
     const coachingScore = coaches.length > 0 ? coaches.reduce((a,b) => a + b.attributes.coaching, 0) / coaches.length : 8;
     growthFactor *= (0.8 + (coachingScore / 50)); 

     const schedule = p.trainingSchedule || { STRENGTH: 8, AEROBIC: 8, TACTICAL: 8, BALL_CONTROL: 8, DEFENDING: 8, ATTACKING: 8, SHOOTING: 8, SET_PIECES: 4 };
     const totalIntensity = Object.values(schedule).reduce((a, b) => a + b, 0);
     const intensityFactor = Math.min(2, totalIntensity / 56);

      let phase: 'EARLY_YOUTH' | 'YOUTH' | 'EARLY_PRIME' | 'PRIME' | 'LATE_PRIME' | 'VETERAN' = 'PRIME';
      if (p.age <= 17) phase = 'EARLY_YOUTH';
      else if (p.age <= 21) phase = 'YOUTH';
      else if (p.age <= 25) phase = 'EARLY_PRIME';
      else if (p.age <= 29) phase = 'PRIME';
      else if (p.age <= 32) phase = 'LATE_PRIME';
      else phase = 'VETERAN';

      let phaseMultiplier = 1.0;
      switch (phase) {
        case 'EARLY_YOUTH': phaseMultiplier = 1.2; break;
        case 'YOUTH': phaseMultiplier = 1.1; break;
        case 'EARLY_PRIME': phaseMultiplier = 1.0; break;
        case 'PRIME': phaseMultiplier = 0.95; break;
        case 'LATE_PRIME': phaseMultiplier = 0.85; break;
        case 'VETERAN': phaseMultiplier = 0.6; break;
      }

      const club = world.getClub(p.clubId);
      const scoutingBonus = (() => {
        if (!club || phase !== 'YOUTH' && phase !== 'EARLY_YOUTH') return 1.0;
        const regionMap: Record<string, string[]> = { ARG: ['Argentina'], BRA: ['Brasil'], URU: ['Uruguay'], CHL: ['Chile'], COL: ['Colombia'], ECU: ['Ecuador'], PAR: ['Paraguay'], PER: ['Perú'], VEN: ['Venezuela'], BOL: ['Bolivia'] };
        const targets = regionMap[club.scoutingRegion];
        if (!targets) return 1.0;
        return targets.includes(p.nationality) ? 1.25 : 1.0;
      })();

      const finalGrowthFactor = growthFactor * phaseMultiplier * scoutingBonus;

      const getTrainingBias = (attrKey: string): number => {
        const biasMap: Record<string, string[]> = {
          fuerza: ['STRENGTH'],
          resistencia: ['AEROBIC', 'STRENGTH'],
          velocidad: ['AEROBIC'],
          control: ['BALL_CONTROL', 'SHOOTING'],
          pase: ['ATTACKING', 'SET_PIECES'],
          regate: ['BALL_CONTROL'],
          disparo: ['SHOOTING', 'ATTACKING'],
          anticipacion: ['TACTICAL', 'DEFENDING'],
          decision: ['TACTICAL', 'SHOOTING'],
          posicionamiento: ['TACTICAL', 'DEFENDING'],
          vision: ['TACTICAL', 'ATTACKING'],
          agresividad: ['DEFENDING', 'STRENGTH'],
          polivalencia: ['TACTICAL']
        };
        const cats = biasMap[attrKey] || [];
        let bias = 0;
        cats.forEach(cat => { bias = Math.max(bias, ((schedule as any)[cat] || 8) / 10); });
        return Math.max(0.3, bias || 0.5);
      };

      const attrKeys = Object.keys(i) as Array<keyof typeof i>;
      let totalChange = 0;

      if (phase === 'EARLY_YOUTH' || phase === 'YOUTH') {
         if (p.currentAbility < p.potentialAbility) {
            const baseChance = phase === 'EARLY_YOUTH' ? 0.45 : 0.35;
            const chance = baseChance * finalGrowthFactor * intensityFactor;
            attrKeys.forEach(k => {
              if (i[k] < 20 && Math.random() < chance * getTrainingBias(k)) { (i as any)[k] = Math.min(20, i[k] + 1); totalChange++; }
            });
         }
      }
      else if (phase === 'EARLY_PRIME' || phase === 'PRIME') {
         const mentalChance = 0.3 * finalGrowthFactor * intensityFactor;
         ['anticipacion', 'decision', 'posicionamiento', 'vision', 'polivalencia'].forEach(k => {
           if ((i as any)[k] < 20 && Math.random() < mentalChance * getTrainingBias(k)) { (i as any)[k] = Math.min(20, (i as any)[k] + 1); totalChange++; }
         });
         if (avgRating > 7.2 && p.currentAbility < p.potentialAbility) {
            const weights = attrKeys.map(k => getTrainingBias(k));
            const totalW = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * totalW;
            for (let idx = 0; idx < attrKeys.length; idx++) {
              r -= weights[idx];
              if (r <= 0) {
                if ((i as any)[attrKeys[idx]] < 20) { (i as any)[attrKeys[idx]] = Math.min(20, (i as any)[attrKeys[idx]] + 1); totalChange++; }
                break;
              }
            }
         }
      }
      else if (phase === 'LATE_PRIME') {
         const mentalChance = 0.25 * finalGrowthFactor * intensityFactor;
         ['anticipacion', 'decision', 'posicionamiento', 'vision'].forEach(k => {
           if ((i as any)[k] < 20 && Math.random() < mentalChance * getTrainingBias(k)) { (i as any)[k] = Math.min(20, (i as any)[k] + 1); totalChange++; }
         });
      }
      else {
         const declineBase = (p.age - 30) * 0.15;
         const trainingMitigation = intensityFactor * 0.1;
         const mitigation = (i.resistencia / 40) + (finalGrowthFactor * 0.2) + trainingMitigation;
         const declineChance = Math.max(0.05, declineBase - mitigation);
         ['velocidad', 'resistencia', 'fuerza'].forEach(k => {
           if ((i as any)[k] > 1 && Math.random() < declineChance) { (i as any)[k] = Math.max(1, (i as any)[k] - 1); totalChange--; }
         });
         ['control', 'pase', 'regate', 'disparo'].forEach(k => {
           if ((i as any)[k] > 1 && Math.random() < (declineChance * 0.5)) { (i as any)[k] = Math.max(1, (i as any)[k] - 1); totalChange--; }
         });
         if (Math.random() < 0.3) {
             const mentalGrowth = ['decision', 'posicionamiento', 'anticipacion', 'polivalencia'];
             const k = mentalGrowth[randomInt(0, mentalGrowth.length - 1)];
             if ((i as any)[k] < 20) { (i as any)[k] = Math.min(20, (i as any)[k] + 1); totalChange++; }
         }
      }

     const avgInternal = attrKeys.reduce((sum, k) => sum + (i[k] as number), 0) / attrKeys.length;
     const oldCA = p.currentAbility;
     p.currentAbility = Math.round(avgInternal * 10);

     if (totalChange > 0 || (p.currentAbility - oldCA) > 2) p.developmentTrend = 'RISING';
     else if (totalChange < 0 || (p.currentAbility - oldCA) < -2) p.developmentTrend = 'DECLINING';
     else p.developmentTrend = 'STABLE';

     p.stats.visible.fisico = Math.round((i.velocidad + i.resistencia + i.fuerza) / 3) as any;
     p.stats.visible.mental = Math.round((i.anticipacion + i.decision + i.posicionamiento + i.vision) / 4) as any;
     p.stats.visible.tecnica = Math.round((i.control + i.pase + i.regate + i.disparo) / 4) as any;
     p.stats.visible.agresividad = i.agresividad;
     p.stats.visible.polivalencia = i.polivalencia;
  }
}
