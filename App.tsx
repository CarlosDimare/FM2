import React, { useEffect, useCallback, useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';
import { MatchView } from './components/MatchView';
import { TacticsView } from './components/TacticsView';
import { LeagueTable } from './components/LeagueTable';
import { SquadView } from './components/SquadView';
import { StaffView } from './components/StaffView';
import { TrainingView } from './components/TrainingView';
import { ScoutingView } from './components/ScoutingView';
import { BoardView } from './components/BoardView';
import { ClubReport } from './components/ClubReport';
import { PlayerCompareModal } from './components/PlayerCompareModal';
import { PeopleHub } from './components/PeopleHub';
import { PressConferenceView } from './components/PressConferenceView';
import { PreMatchView } from './components/PreMatchView';
import { PostMatchSummaryView } from './components/PostMatchSummaryView';
import { MarketView } from './components/MarketView';
import { SearchView } from './components/SearchView';
import { EconomyView } from './components/EconomyView';
import { NegotiationsView } from './components/NegotiationsView';
import { InboxView } from './components/InboxView';
import { SeasonSummaryModal } from './components/SeasonSummaryModal';
import { MediaView } from './components/MediaView';
import { PlayerContextMenu } from './components/PlayerContextMenu';
import { TournamentHub } from './components/TournamentHub';
import { NationalTeamView } from './components/NationalTeamView';
import { ClubsListView } from './components/ClubsListView';
import { BottomNav } from './components/BottomNav';
import { HallOfFameView } from './components/HallOfFameView';
import { SeasonHistoryView } from './components/SeasonHistoryView';
import { ChronicleView } from './components/ChronicleView';
import { ManagerProfileView } from './components/ManagerProfileView';
import { world } from './services/worldManager';
import { LifecycleManager } from './services/lifecycleManager';
import { generateMatchChronicle, generateMonthlyChronicle, generateNationalTeamChronicle } from './services/chronicleService';
import { Club, Player, Fixture, SquadType, PlayerMatchStats, RealManager, NationalTeamMatchOptions, NationalTeamChronicleContext, CareerMode, Chronicle } from './types';
import { saveGame, loadGame, checkSaveExists, listSaves, deleteSave, generateUUID, randomInt } from './services/utils';
import { MatchSimulator } from './services/engine';
import { LeagueEngine } from './services/leagueEngine';
import { requestNotificationPermission, sendMatchNotification, sendInjuryNotification, sendTransferNotification, sendInboxNotification } from './services/notifications';
import { RefreshCw, Globe, Play, Sun, Moon, Menu, Zap, Mail, Trophy, ChevronRight, ChevronLeft, User, ArrowLeft, Save, HardDrive, Trash2, X, Briefcase, Flag } from 'lucide-react';
import { OnboardingTour, isOnboarded } from './components/OnboardingTour';
import { FMButton, FMLoadingOverlay, FMModal } from './components/FMUI';
import { useWorldStore } from './stores/worldStore';
import { useUIStore } from './stores/uiStore';
import { useGameStore } from './stores/gameStore';
import { getFlagUrl, TACTIC_PRESETS } from './data/static';
import { ALL_REAL_MANAGERS, MANAGER_DATABASE_META } from './data/managerDatabase';

const AttrBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const pct = Math.min(100, Math.max(0, (value / 20) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-slate-600 uppercase w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-200 rounded-sm overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-black text-slate-900 w-6 text-right">{value}</span>
    </div>
  );
};

const App: React.FC = () => {
  const darkMode = useGameStore(s => s.darkMode);
  const setDarkMode = useGameStore(s => s.setDarkMode);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showConflictModal, setShowConflictModal] = React.useState(false);
  const [managerToConfirm, setManagerToConfirm] = React.useState<RealManager | null>(null);
  const [managerSearch, setManagerSearch] = React.useState('');
  const [managerCountryFilter, setManagerCountryFilter] = React.useState('ALL');
  const [managerResultLimit, setManagerResultLimit] = React.useState(120);
  const [lastMatchStats, setLastMatchStats] = React.useState<Record<string, PlayerMatchStats>>({});
  const [lastChronicle, setLastChronicle] = React.useState<Chronicle | null>(null);

  React.useEffect(() => {
    if (!isOnboarded()) {
      const t = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const notify = useWorldStore(s => s.notify);

const {
    gameState, currentView, selectedPlayer, contextMenu, isSidebarOpen,
    userName, userSurname, userNationality, userOrigin, userBirthDate, selectedCountry, selectedLeague, userClub, viewExternalClub,
    careerMode, selectedNationalTeamId,
    isVacationModalOpen, vacationTargetDate, isSimulating, isInVacation,
    vacationProgress, vacationDetail, vacationCancelled, setVacationProgress, setVacationDetail, setVacationCancelled, resetVacationState,
    simProgress, simProgressDetail, setSimProgress, setSimProgressDetail,
    seasonSummary, userWonLeague, viewLeagueId, viewSquadType,
    currentDate, seasonEndDate, hasSave,
    isSaveModalOpen, saveNameInput, isLoadModalOpen, availableSaves,
    setGameState, setView, setSelectedPlayer, setContextMenu, setIsSidebarOpen,
    setUserName, setUserSurname, setUserNationality, setUserOrigin, setUserBirthDate, setSelectedCountry, setSelectedLeague, setUserClub, setCareerMode, setSelectedNationalTeamId,
    setViewExternalClub, setIsVacationModalOpen, setVacationTargetDate, setIsSimulating,
    setIsInVacation, setSeasonSummary, setUserWonLeague, setViewLeagueId, setViewSquadType,
    setCurrentDate, setSeasonEndDate, setHasSave,
    setIsSaveModalOpen, setSaveNameInput, setIsLoadModalOpen, setAvailableSaves,
    isAutoSaveEnabled, setIsAutoSaveEnabled,
    comparePlayerA, comparePlayerB, setComparePlayerA, setComparePlayerB,
    selectedExistingManager, setSelectedExistingManager,
  } = useUIStore();

  const { fixtures, nextFixture, setFixtures, setNextFixture, initSeasonFixtures, updateNextFixture } = useGameStore();

  useEffect(() => {
    if (comparePlayerA && selectedPlayer && selectedPlayer.id !== comparePlayerA.id && !comparePlayerB) {
      setComparePlayerB(selectedPlayer);
      setSelectedPlayer(null);
    }
  }, [selectedPlayer, comparePlayerA, comparePlayerB]);

  const getClubNationalTeamId = () => {
    const manager = world.nationalTeamManager;
    if (!userClub || !manager?.nationalTeams) return undefined;
    const normalizeCountry = (country: string) => country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const userCountry = normalizeCountry(userClub.country);
    return manager.nationalTeams.find((team: any) => normalizeCountry(team.country) === userCountry)?.id;
  };

  const getNationalChronicleTeamIds = (fixture: Fixture): string[] => {
    const manager = world.nationalTeamManager;
    const ids = new Set<string>();
    if (manager?.controlledTeamId && (fixture.homeTeamId === manager.controlledTeamId || fixture.awayTeamId === manager.controlledTeamId)) {
      ids.add(manager.controlledTeamId);
    }
    const clubTeamId = getClubNationalTeamId();
    if (clubTeamId && (fixture.homeTeamId === clubTeamId || fixture.awayTeamId === clubTeamId)) ids.add(clubTeamId);
    return [...ids];
  };

  const getNationalMatchOptions = (fixture: Fixture): NationalTeamMatchOptions => {
    const manager = world.nationalTeamManager;
    const teamId = manager?.controlledTeamId;
    if (!manager || !teamId) return {};
    const squadIds = manager.getControlledSquadIds(teamId);
    const tactic = manager.getControlledTactic(teamId);
    if (fixture.homeTeamId === teamId) return { homeSquadIds: squadIds, homeTactic: tactic };
    if (fixture.awayTeamId === teamId) return { awaySquadIds: squadIds, awayTactic: tactic };
    return {};
  };

  const activeManagedTeamId = userClub?.id || selectedNationalTeamId || undefined;

  const getNationalChronicleContext = (teamId: string): NationalTeamChronicleContext | undefined => {
    const manager = world.nationalTeamManager;
    if (!manager?.isControlled(teamId)) return undefined;
    return {
      controlled: true,
      squadSize: manager.getControlledSquadIds(teamId).length,
      squadIds: manager.getControlledSquadIds(teamId),
      tactic: manager.getControlledTactic(teamId),
    };
  };

  const getMatchSquad = (clubId: string) => {
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
  };

  useEffect(() => {
    checkSaveExists().then(exists => setHasSave(exists));
    setTimeout(() => { setGameState('SETUP_USER'); }, 800);
  }, []);

  const handleGlobalClick = useCallback(() => {
    if (contextMenu) setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [handleGlobalClick]);

  const advanceTimeRef = useRef<() => void>(null as any);
  const lastChronicleMonth = useRef<number>(-1);
  const perfSamples = useRef<number[]>([]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Escape') {
        if (isSaveModalOpen) setIsSaveModalOpen(false);
        else if (currentView !== 'HOME' && gameState === 'PLAYING') setView('HOME');
      }
      if (e.key === ' ' && currentView === 'HOME' && gameState === 'PLAYING' && !isVacationModalOpen) {
        e.preventDefault();
        advanceTimeRef.current();
      }
      if (e.key === 'm' && gameState === 'PLAYING' && currentView === 'HOME') setView('MARKET');
      if (e.key === 't' && gameState === 'PLAYING' && currentView === 'HOME') setView('SENIOR_TACTICS');
      if (e.key === 's' && gameState === 'PLAYING' && currentView === 'HOME') setView('SENIOR_SQUAD');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentView, gameState, isSaveModalOpen, isVacationModalOpen, setView]);

  const handlePlayerContextMenu = (e: React.MouseEvent, player: Player) => {
    e.preventDefault();
    setContextMenu({ player, x: e.clientX, y: e.clientY });
  };

  const handleStartMatch = () => {
    if (nextFixture) setView('MATCH');
  };

  const setupNationalControl = (teamId: string): boolean => {
    const manager = world.nationalTeamManager;
    const team = manager?.nationalTeams?.find((candidate: any) => candidate.id === teamId);
    if (!manager || !team) return false;
    const eligiblePlayers = manager.getEligiblePlayers(teamId, world.players, world.clubs);
    const eligibleIds = new Set(eligiblePlayers.map((player: Player) => player.id));
    const savedIds = (team.playerIds || []).filter((id: string) => eligibleIds.has(id));
    const fallbackIds = eligiblePlayers.map((player: Player) => player.id).filter((id: string) => !savedIds.includes(id));
    const preset = TACTIC_PRESETS.find(tactic => tactic.id === team.formation) || TACTIC_PRESETS[0];
    return manager.assumeControl(teamId, [...savedIds, ...fallbackIds].slice(0, 23), { ...preset.settings }, eligiblePlayers.map((player: Player) => player.id));
  };

  const startNationalCareer = (teamId: string, managerData?: RealManager | null, clubId: string | null = null) => {
    if (!setupNationalControl(teamId)) {
      alert('No hay suficientes jugadores elegibles para formar una convocatoria internacional.');
      return;
    }
    const club = clubId ? world.getClub(clubId) : null;
    setSelectedNationalTeamId(teamId);
    setUserClub(club || null);
    if (club) {
      world.ensureDeepSquads(club.leagueId);
      useGameStore.getState().setDeepSimLeagues([club.leagueId]);
    }
    const allFix = initSeasonFixtures(currentDate, club?.id);
    updateNextFixture(allFix, currentDate, club?.id || teamId);
    world.createManagerProfile(club?.id || null, managerData?.name || userName, managerData?.surname || userSurname, managerData?.nationality || userNationality, managerData ? 'EX_PLAYER' : userOrigin, managerData?.birthDate || userBirthDate, currentDate, teamId);
    if (club) {
      if (managerData) world.replaceHeadCoach(managerData, club.id, false);
      else world.createHumanManager(club.id, `${userName} ${userSurname}`);
    }
    setGameState('PLAYING');
    setView('HOME');
    notify();
  };

  const createManagerAndStartGame = (manager: RealManager, clubId: string, fired: boolean) => {
    const club = world.getClub(clubId);
    if (!club) return;
    if (selectedNationalTeamId && careerMode !== 'CLUB') {
      if (!setupNationalControl(selectedNationalTeamId)) return;
      world.replaceHeadCoach(manager, club.id, fired);
    } else {
      world.replaceHeadCoach(manager, club.id, fired);
    }
    setUserClub(club);
    world.ensureDeepSquads(club.leagueId);
    useGameStore.getState().setDeepSimLeagues([club.leagueId]);
    const allFix = initSeasonFixtures(currentDate, club.id);
    updateNextFixture(allFix, currentDate, club.id);
    world.createManagerProfile(club.id, manager.name, manager.surname, manager.nationality, 'EX_PLAYER', manager.birthDate, currentDate, careerMode === 'BOTH' ? selectedNationalTeamId : null);
    setGameState('PLAYING');
    setView('HOME');
    notify();
  };

  const performAutoSave = async () => {
    if (!isAutoSaveEnabled) return;
    try {
      const id = `autosave_${currentDate.toISOString().slice(0, 10)}`;
      const managedName = userClub?.name || world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId)?.name || 'Selección Nacional';
      const saveData = {
        id, label: `Auto: ${currentDate.toLocaleDateString()}`, lastPlayed: new Date(),
        metaTeamName: managedName,
        metaManagerName: `${userName} ${userSurname}`,
        gameState: { currentDate, userName, userSurname, userClubId: userClub?.id || null, selectedNationalTeamId, careerMode, fixtures, seasonEndDate, deepSimLeagues: useGameStore.getState().deepSimLeagues, managerHistory: useGameStore.getState().managerHistory, managerReputation: useGameStore.getState().managerReputation, darkMode: useGameStore.getState().darkMode },
        worldState: {
          players: world.players, clubs: world.clubs, competitions: world.competitions,
          staff: world.staff, tactics: world.tactics, offers: world.offers, inbox: world.inbox,
          scoutingReports: world.scoutingReports, chronicles: world.chronicles,
          interactionLog: world.interactionLog, activeReputationalBuffs: world.activeReputationalBuffs,
          relationshipWeb: world.relationshipWeb, mediaNews: world.mediaNews,
          managerProfile: world.managerProfile,
          nationalTeamManager: world.nationalTeamManager
        }
      };
      await saveGame(saveData);
      setHasSave(true);
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  };

  const advanceTime = async () => {
    const t0 = performance.now();
    // ── Fixture stats ──────────────────────────────────────────────
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    const totalFix = fixtures.filter(f => !f.played && f.date.toDateString() === currentDate.toDateString());
    const deepFix = totalFix.filter(f => deepIds.has(world.getClub(f.homeTeamId)?.leagueId || world.getClub(f.awayTeamId)?.leagueId || ''));
    const lightFix = totalFix.length - deepFix.length;
    console.groupCollapsed(`📅 ${currentDate.toLocaleDateString('es-ES')} — ${totalFix.length} partidos (${deepFix.length} DEEP · ${lightFix} LIGHT) · ${fixtures.length.toLocaleString()} totales`);
  

    if (currentView === 'SENIOR_TACTICS' && userClub) {
      const isMatchToday = fixtures.some(f =>
        !f.played &&
        f.date.toDateString() === currentDate.toDateString() &&
        (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
        f.squadType === 'SENIOR'
      );
      if (isMatchToday) {
        setView('PRE_MATCH');
        return;
      }
    }

    if (currentDate >= seasonEndDate) {
      world.processLoanReturns(currentDate);
      const result = useGameStore.getState().finishSeason(fixtures, activeManagedTeamId);
      setSeasonSummary(result.summaries);
      setUserWonLeague(result.userWonLeague);
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
       }
       sendMatchNotification('Temporada finalizada — revisa el resumen');
      if (userClub) {
        const leagueTable = world.getLeagueTable(userClub.leagueId, result.newFixtures.length > 0 ? result.newFixtures : fixtures, 'SENIOR');
        const leaguePos = leagueTable.findIndex(e => e.clubId === userClub.id) + 1;
        const leagueTotal = leagueTable.length;
        const leagueSummary = result.summaries.find((s: any) => s.compType === 'LEAGUE');
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
      setView('HOME');
      notify();
      return;
    }

    await performAutoSave();

    if (userClub || selectedNationalTeamId) {
      const hasClubMatchToday = Boolean(userClub && fixtures.some(f =>
      !f.played && f.date.toDateString() === currentDate.toDateString() &&
      (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) && f.squadType === 'SENIOR'
    ));
    const hasNationalMatchToday = Boolean(selectedNationalTeamId && fixtures.some(f =>
      !f.played && f.date.toDateString() === currentDate.toDateString() &&
      (f.homeTeamId === selectedNationalTeamId || f.awayTeamId === selectedNationalTeamId) && f.squadType === 'SENIOR'
    ));
    if (hasClubMatchToday) {
      console.log(`  ⏸ partido del usuario hoy — pausado`);
      console.groupEnd();
      // Check if lineup is configured (need 11 starters)
      const starters = world.getPlayersByClub(userClub!.id).filter(p => p.isStarter && p.squad === 'SENIOR');
      if (starters.length < 11) {
        setView('SENIOR_TACTICS');
      } else {
        setView('PRE_MATCH');
      }
      return;
    }
    // Los partidos de selección se simulan en el bloque de fixtures de abajo;
    // no se interrumpe aquí para evitar dejar el mismo encuentro pendiente.

      const dayFixtures = fixtures.filter(f =>
        f.date.toDateString() === currentDate.toDateString() && !f.played
      );
      console.time('  ⚽ simular partidos');
      // Pre-cache squads for all clubs in today's fixtures
      const uniqueClubIds = [...new Set(dayFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
      const squads = world.preFetchSquads(uniqueClubIds);
      dayFixtures.forEach(f => {
        const isNationalTeamMatch = ['WC_Q', 'WC_FINAL', 'COPA', 'EURO', 'AFCON'].includes(f.competitionId);
        
        if (isNationalTeamMatch) {
          // National team match simulation
          const result = MatchSimulator.simulateNationalTeamMatch(f.homeTeamId, f.awayTeamId, getNationalMatchOptions(f));
          f.played = true;
          f.homeScore = result.homeScore;
          f.awayScore = result.awayScore;
          getNationalChronicleTeamIds(f).forEach(teamId => {
            generateNationalTeamChronicle(f, result.homeScore, result.awayScore, result.stats, teamId, result.events, getNationalChronicleContext(teamId));
          });
        } else {
          // Club match simulation
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
            // Friendlies: no suspensions, no U21 tracking, income + team benefits
            world.processMatchDayIncome(f.homeTeamId, f.competitionId, currentDate);
            if (f.homeTeamId === userClub?.id || f.awayTeamId === userClub?.id) {
              const userClubId = userClub?.id || '';
              if (userClubId) {
                const club = world.getClub(userClubId);
                if (club) club.teamCohesion = Math.min(100, (club.teamCohesion || 50) + 2);
                // Only players who played get the boost
                const userSquad = f.homeTeamId === userClubId ? hSquad : aSquad;
                userSquad.forEach(p => {
                  p.tacticalFamiliarity = Math.min(100, p.tacticalFamiliarity + 3);
                  p.fitness = Math.min(100, p.fitness + 5);
                });
              }
            }
          } else {
            LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, hRedCards, aRedCards);
            world.processMatchDayIncome(f.homeTeamId, f.competitionId, currentDate);
            world.trackU21Minutes(f.homeTeamId, hSquad, stats, currentDate);
            world.trackU21Minutes(f.awayTeamId, aSquad, stats, currentDate);
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
        world.generateMatchNews(f, f.homeScore!, f.awayScore!, currentDate);
      });
      console.timeEnd('  ⚽ simular partidos');
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);

    console.time('  🔄 ciclo diario');
    LifecycleManager.checkBirthdays(nextDay);
    LifecycleManager.recoverDailyFitness();
    LifecycleManager.processMonthlyFinances(nextDay);
    world.checkRenewalTriggers(nextDay, userClub?.id);
    world.processTransferDecisions(nextDay);
    world.processAIActivity(nextDay);
    world.processDailyContracts(nextDay, userClub?.id);
    world.processDailyScouting(nextDay, userClub?.id);
      world.generateGeneralNews(nextDay);
    if (nextDay.getMonth() === 7 && nextDay.getDate() === 1) {
      world.generateYouthIntake(nextDay.getFullYear());
      if (userClub) world.addInboxMessage('SQUAD', 'Cosecha de cantera', `Los juveniles de ${userClub.name} se han incorporado al club. Revisa los nuevos talentos en el equipo sub-20.`, nextDay);
    }
    if (nextDay.getDate() === 1) {
      world.recalculateAllPlayerValues();
      // Recompute team cohesion for user's club + DEEP league clubs
      if (userClub) world.computeTeamCohesion(userClub.id);
    }

    // Monthly chronicle generation
    if (userClub && nextDay.getDate() === 1 && lastChronicleMonth.current !== nextDay.getMonth()) {
      const prevMonth = nextDay.getMonth() === 0 ? 11 : nextDay.getMonth() - 1;
      const prevYear = nextDay.getMonth() === 0 ? nextDay.getFullYear() - 1 : nextDay.getFullYear();
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
      lastChronicleMonth.current = nextDay.getMonth();
    }

    // Transfer deadline day mechanics
    world.processDeadlineWeekActivity(nextDay);
    world.processDeadlineDay(nextDay);

    // Youth development pipeline
    world.developYouthPlayers(nextDay);
    world.autoPromoteYouthPlayers(nextDay);

    // ── Pilar C: Personality & Drama ──────────────────────────────────
    if (userClub) {
      world.checkDressingRoomConflicts(userClub.id, nextDay);
      world.checkTransferRequestMotives(userClub.id, nextDay);
      world.generateNarrativeEvents(userClub.id, nextDay);
    }
    console.timeEnd('  🔄 ciclo diario');

    const newCupFixtures = LifecycleManager.processCompetitionProgress(fixtures, nextDay);
    let allFixtures = fixtures;
    if (newCupFixtures.length > 0) {
      allFixtures = [...fixtures, ...newCupFixtures];
      setFixtures(allFixtures);
    }

    if (activeManagedTeamId) {
      const next = updateNextFixture(allFixtures, nextDay, activeManagedTeamId);
      const userMatchTomorrow = userClub && allFixtures.find(f =>
        !f.played &&
        f.date.toDateString() === nextDay.toDateString() &&
        (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
        f.squadType === 'SENIOR'
      );
      if (userMatchTomorrow) {
        // Check if lineup is configured
        const starters = userClub ? world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR') : [];
        setView(starters.length >= 11 ? 'PRE_MATCH' : 'SENIOR_TACTICS');
      } else if (next && next.date.toDateString() === nextDay.toDateString()) setView('PRE_MATCH');
    }
    notify();
    const elapsed = parseFloat((performance.now() - t0).toFixed(1));
    console.log(`  ✅ total: ${elapsed}ms`);
    // Rolling average (last 50 days)
    perfSamples.current.push(elapsed);
    if (perfSamples.current.length > 50) perfSamples.current.shift();
    if (perfSamples.current.length % 10 === 0) {
      const avg = (perfSamples.current.reduce((a, b) => a + b, 0) / perfSamples.current.length).toFixed(1);
      console.log(`  📊 promedio móvil (${perfSamples.current.length} días): ${avg}ms`);
    }
    console.groupEnd();
  };

  advanceTimeRef.current = advanceTime;

const startVacation = async (targetOverride?: Date) => {
    let target = targetOverride;
    if (!target) {
      if (!vacationTargetDate) return;
      target = new Date(vacationTargetDate);
    }

    if (target <= currentDate) return;
    
    // Reset vacation state
    resetVacationState();
    setIsSimulating(true);
    setIsInVacation(true);
    setVacationProgress(0);
    setVacationDetail('Iniciando simulación...');

    let tempDate = new Date(currentDate);
    let localFixtures = [...fixtures];
    let batchCount = 0;
    const BATCH_SIZE = 7;

    // Calculate total days for progress
    const totalDays = Math.ceil((target.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24));
    let daysProcessed = 0;

    while (tempDate < target) {
      // Check if cancelled
      if (vacationCancelled) {
        setIsSimulating(false);
        setIsInVacation(false);
        setVacationDetail('Vacaciones canceladas por el usuario');
        setVacationProgress(0);
        break;
      }

      tempDate.setDate(tempDate.getDate() + 1);
      batchCount++;
      daysProcessed++;

      // Update progress every day
      const progress = Math.min(100, Math.round((daysProcessed / totalDays) * 100));
      setVacationProgress(progress);
      setVacationDetail(`Procesando ${tempDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} (${daysProcessed}/${totalDays})`);

      LifecycleManager.checkBirthdays(tempDate);
      LifecycleManager.recoverDailyFitness();
      LifecycleManager.processMonthlyFinances(tempDate);
      world.checkRenewalTriggers(tempDate, userClub?.id);
      world.processTransferDecisions(tempDate);
      world.processAIActivity(tempDate);
      world.processDailyContracts(tempDate, userClub?.id);
      world.processDailyScouting(tempDate, userClub?.id);

      // Transfer deadline day mechanics
      world.processDeadlineWeekActivity(tempDate);
      world.processDeadlineDay(tempDate);

      // Youth development pipeline
      world.developYouthPlayers(tempDate);
      world.autoPromoteYouthPlayers(tempDate);

      const dayFixtures = localFixtures.filter(f =>
        f.date.toDateString() === tempDate.toDateString() && !f.played
      );
      // Pre-cache squads for all clubs in today's fixtures
      const uniqueClubIds = [...new Set(dayFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
      const squads = world.preFetchSquads(uniqueClubIds);
      dayFixtures.forEach(f => {
        const isNationalTeamMatch = ['WC_Q', 'WC_FINAL', 'COPA', 'EURO', 'AFCON'].includes(f.competitionId);
        
        if (isNationalTeamMatch) {
          const result = MatchSimulator.simulateNationalTeamMatch(f.homeTeamId, f.awayTeamId, getNationalMatchOptions(f));
          f.played = true; f.homeScore = result.homeScore; f.awayScore = result.awayScore;
          getNationalChronicleTeamIds(f).forEach(teamId => {
            generateNationalTeamChronicle(f, result.homeScore, result.awayScore, result.stats, teamId, result.events, getNationalChronicleContext(teamId));
          });
        } else {
          const { homeScore, awayScore, stats, events } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
          f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
          const hSquad = (squads.get(f.homeTeamId) || []).filter(p => p.squad === f.squadType);
          const aSquad = (squads.get(f.awayTeamId) || []).filter(p => p.squad === f.squadType);
          MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
          const hRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.homeTeamId).length;
          const aRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.awayTeamId).length;
          if (f.competitionId === 'FRIENDLY') {
            world.processMatchDayIncome(f.homeTeamId, f.competitionId, tempDate);
          } else {
            LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, hRedCards, aRedCards);
            world.processMatchDayIncome(f.homeTeamId, f.competitionId, tempDate);
            world.trackU21Minutes(f.homeTeamId, hSquad, stats, tempDate);
            world.trackU21Minutes(f.awayTeamId, aSquad, stats, tempDate);
          }
            if (userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) {
              const us = f.homeTeamId === userClub.id ? homeScore : awayScore;
              const os = f.homeTeamId === userClub.id ? awayScore : homeScore;
              useGameStore.getState().trackMatchResult(us, os);
              world.updateManagerProfileMatch(us, os);
              generateMatchChronicle(f, homeScore, awayScore, stats, userClub.id, events);
            }
        }
        world.generateMatchNews(f, f.homeScore!, f.awayScore!, tempDate);
      });

      const newCupFixtures = LifecycleManager.processCompetitionProgress(localFixtures, tempDate);
      if (newCupFixtures.length > 0) {
        localFixtures = [...localFixtures, ...newCupFixtures];
      }

      if (tempDate >= seasonEndDate) {
        setFixtures(localFixtures);
        const result = useGameStore.getState().finishSeason(localFixtures, activeManagedTeamId);
        setSeasonSummary(result.summaries);
        setUserWonLeague(result.userWonLeague);
        const gs = useGameStore.getState();
        gs.setManagerHistory({ ...gs.managerHistory, seasonsCompleted: gs.managerHistory.seasonsCompleted + 1 });
        if (result.userWonLeague) gs.trackTitle('Liga');
         const wonCups = result.summaries.filter((s: any) => s.championId === userClub?.id && s.compType !== 'LEAGUE');
         wonCups.forEach((s: any) => gs.trackTitle(s.compName));
         if (userClub) {
           const leagueTable = world.getLeagueTable(userClub.leagueId, localFixtures, 'SENIOR');
           const leaguePos = leagueTable.findIndex(e => e.clubId === userClub.id) + 1;
           const leagueTotal = leagueTable.length;
           const cupWinnerId = result.summaries.find((s: any) => s.compType !== 'LEAGUE' && s.championId)?.championId;
           const wonCup = cupWinnerId === userClub.id;
           const titleNames: string[] = [];
           if (result.userWonLeague) titleNames.push('Liga');
           wonCups.forEach((s: any) => titleNames.push(s.compName));
           world.updateManagerProfileSeasonEnd(result.userWonLeague || wonCups.length > 0, titleNames, leaguePos || 10, leagueTotal || 20);
           world.evaluateBoardConfidence(userClub.id, leaguePos || 10, leagueTotal || 20, wonCup, false);
           world.checkManagerJobOffers(currentDate, userClub.id, useGameStore.getState().managerReputation);
         }
        setIsSimulating(false);
        setIsInVacation(false);
        setIsVacationModalOpen(false);
        setCurrentDate(tempDate);
        notify();
        return;
      }

      if (batchCount >= BATCH_SIZE) {
        setCurrentDate(new Date(tempDate));
        batchCount = 0;
        // Yield to main thread to allow UI updates and cancellation check
        await new Promise(r => setTimeout(r, 0));
      }
    }

    setFixtures(localFixtures);
    setCurrentDate(new Date(tempDate));
    if (userClub) updateNextFixture(localFixtures, tempDate, userClub.id);
    setIsSimulating(false);
    setIsInVacation(false);
    setIsVacationModalOpen(false);
    setView('HOME');
    notify();
  };

  const simulateToNextMatch = async () => {
    if (!activeManagedTeamId) return;
    setIsSimulating(true);
    setSimProgress(0);
    setSimProgressDetail('Preparando simulación...');
    await new Promise(r => setTimeout(r, 30));

    let tempDate = new Date(currentDate);
    let localFixtures = [...fixtures];
    const maxDays = 120;
    let daysSimmed = 0;

    while (daysSimmed < maxDays) {
      tempDate.setDate(tempDate.getDate() + 1);
      daysSimmed++;

      if (tempDate >= seasonEndDate) {
        setFixtures(localFixtures);
        const result = useGameStore.getState().finishSeason(localFixtures, activeManagedTeamId);
        setSeasonSummary(result.summaries);
        setUserWonLeague(result.userWonLeague);
        const gs = useGameStore.getState();
        gs.setManagerHistory({ ...gs.managerHistory, seasonsCompleted: gs.managerHistory.seasonsCompleted + 1 });
        if (result.userWonLeague) gs.trackTitle('Liga');
         const wonCups = result.summaries.filter((s: any) => s.championId === activeManagedTeamId && s.compType !== 'LEAGUE');
         wonCups.forEach((s: any) => gs.trackTitle(s.compName));
         if (userClub) {
           const leagueTable = world.getLeagueTable(userClub.leagueId, localFixtures, 'SENIOR');
           const leaguePos = leagueTable.findIndex(e => e.clubId === userClub.id) + 1;
           const leagueTotal = leagueTable.length;
           const cupWinnerId = result.summaries.find((s: any) => s.compType !== 'LEAGUE' && s.championId)?.championId;
           const wonCup = cupWinnerId === userClub.id;
           const titleNames: string[] = [];
           if (result.userWonLeague) titleNames.push('Liga');
           wonCups.forEach((s: any) => titleNames.push(s.compName));
           world.updateManagerProfileSeasonEnd(result.userWonLeague || wonCups.length > 0, titleNames, leaguePos || 10, leagueTotal || 20);
           world.evaluateBoardConfidence(userClub.id, leaguePos || 10, leagueTotal || 20, wonCup, false);
           world.checkManagerJobOffers(tempDate, userClub.id, useGameStore.getState().managerReputation);
         }
        setIsSimulating(false);
        setSimProgress(0);
        setCurrentDate(tempDate);
        notify();
        return;
      }

      const hasUserMatch = localFixtures.some(f =>
        !f.played && f.date.toDateString() === tempDate.toDateString() &&
        ((userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)) ||
          (selectedNationalTeamId && (f.homeTeamId === selectedNationalTeamId || f.awayTeamId === selectedNationalTeamId))) &&
        f.squadType === 'SENIOR'
      );
      const hasClubMatch = Boolean(userClub && localFixtures.some(f =>
        !f.played && f.date.toDateString() === tempDate.toDateString() &&
        (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
        f.squadType === 'SENIOR'
      ));
      const hasNationalMatch = Boolean(selectedNationalTeamId && localFixtures.some(f =>
        !f.played && f.date.toDateString() === tempDate.toDateString() &&
        (f.homeTeamId === selectedNationalTeamId || f.awayTeamId === selectedNationalTeamId) && f.squadType === 'SENIOR'
      ));

      const dayFixtures = localFixtures.filter(f =>
        f.date.toDateString() === tempDate.toDateString() && !f.played
      );
      // Pre-cache squads for all clubs in today's fixtures (skip user matches)
      const nonUserFix = dayFixtures.filter(f => !(userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)));
      const uniqueClubIds = [...new Set(nonUserFix.flatMap(f => [f.homeTeamId, f.awayTeamId]))];
      const squads = world.preFetchSquads(uniqueClubIds);
dayFixtures.forEach(f => {
         const isUserMatch = userClub && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id);
          if (isUserMatch) return;
         
         const isNationalTeamMatch = ['WC_Q', 'WC_FINAL', 'COPA', 'EURO', 'AFCON'].includes(f.competitionId);
         
         if (isNationalTeamMatch) {
           const result = MatchSimulator.simulateNationalTeamMatch(f.homeTeamId, f.awayTeamId, getNationalMatchOptions(f));
           f.played = true; f.homeScore = result.homeScore; f.awayScore = result.awayScore;
           getNationalChronicleTeamIds(f).forEach(teamId => {
             generateNationalTeamChronicle(f, result.homeScore, result.awayScore, result.stats, teamId, result.events, getNationalChronicleContext(teamId));
           });
         } else {
           const { homeScore, awayScore, stats, events } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
           f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
           const hSquad = (squads.get(f.homeTeamId) || []).filter(p => p.squad === f.squadType);
           const aSquad = (squads.get(f.awayTeamId) || []).filter(p => p.squad === f.squadType);
           MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
           const hRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.homeTeamId).length;
           const aRedCards = Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === f.awayTeamId).length;
           if (f.competitionId === 'FRIENDLY') {
             world.processMatchDayIncome(f.homeTeamId, f.competitionId, tempDate);
           } else {
             LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId, hRedCards, aRedCards);
             world.processMatchDayIncome(f.homeTeamId, f.competitionId, tempDate);
             world.trackU21Minutes(f.homeTeamId, hSquad, stats, tempDate);
             world.trackU21Minutes(f.awayTeamId, aSquad, stats, tempDate);
           }
         }
         world.generateMatchNews(f, f.homeScore!, f.awayScore!, tempDate);
       });

      LifecycleManager.checkBirthdays(tempDate);
      LifecycleManager.recoverDailyFitness();
      LifecycleManager.processMonthlyFinances(tempDate);
      world.checkRenewalTriggers(tempDate, userClub?.id);
      world.processTransferDecisions(tempDate);
      world.processAIActivity(tempDate);
      world.processDailyContracts(tempDate, userClub?.id);
      world.processDailyScouting(tempDate, userClub?.id);
         world.generateGeneralNews(tempDate);

      // Transfer deadline day mechanics
      world.processDeadlineWeekActivity(tempDate);
      world.processDeadlineDay(tempDate);

      // Youth development pipeline
      world.developYouthPlayers(tempDate);
      world.autoPromoteYouthPlayers(tempDate);

      const newCupFixtures = LifecycleManager.processCompetitionProgress(localFixtures, tempDate);
      if (newCupFixtures.length > 0) {
        localFixtures = [...localFixtures, ...newCupFixtures];
      }

      if (daysSimmed % 5 === 0) {
        setCurrentDate(new Date(tempDate));
        const progress = Math.min(99, Math.round((daysSimmed / Math.min(maxDays, 90)) * 100));
        setSimProgress(progress);
        setSimProgressDetail(`Día ${daysSimmed} · ${tempDate.toLocaleDateString('es-ES')}`);
        await new Promise(r => setTimeout(r, 0));
      }

      if (hasUserMatch) {
        setFixtures(localFixtures);
        setCurrentDate(new Date(tempDate));
        updateNextFixture(localFixtures, tempDate, activeManagedTeamId);
        setIsSimulating(false);
        setSimProgress(0);
        // Check if lineup is configured before going to pre-match
        if (hasClubMatch && userClub) {
          const starters = world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR');
          setView(starters.length >= 11 ? 'PRE_MATCH' : 'SENIOR_TACTICS');
        } else {
          setView(hasNationalMatch ? `NT_${selectedNationalTeamId}` : 'PRE_MATCH');
        }
        notify();
        return;
      }
    }

    setFixtures(localFixtures);
    setCurrentDate(new Date(tempDate));
    updateNextFixture(localFixtures, tempDate, activeManagedTeamId);
    setIsSimulating(false);
    setSimProgress(0);
    setView('HOME');
    notify();
  };

  const handleOpenSaveModal = async () => {
    const saveTeamName = userClub?.shortName || world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId)?.name || 'Selección';
    setSaveNameInput(`${saveTeamName} - ${currentDate.toLocaleDateString()}`);
    const saves = await listSaves();
    setAvailableSaves(saves);
    setIsSaveModalOpen(true);
  };

  const confirmSaveGame = async () => {
    if (!saveNameInput.trim()) return;
    try {
      const id = generateUUID();
      const managedName = userClub?.name || world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId)?.name || 'Selección Nacional';
      const saveData = {
        id, label: saveNameInput, lastPlayed: new Date(),
        metaTeamName: managedName,
        metaManagerName: `${userName} ${userSurname}`,
        gameState: { currentDate, userName, userSurname, userClubId: userClub?.id || null, selectedNationalTeamId, careerMode, fixtures, seasonEndDate, deepSimLeagues: useGameStore.getState().deepSimLeagues, managerHistory: useGameStore.getState().managerHistory, managerReputation: useGameStore.getState().managerReputation, darkMode: useGameStore.getState().darkMode },
        worldState: {
          players: world.players, clubs: world.clubs, competitions: world.competitions,
          staff: world.staff, tactics: world.tactics, offers: world.offers, inbox: world.inbox,
          scoutingReports: world.scoutingReports, chronicles: world.chronicles,
          interactionLog: world.interactionLog, activeReputationalBuffs: world.activeReputationalBuffs,
          relationshipWeb: world.relationshipWeb, mediaNews: world.mediaNews,
          managerProfile: world.managerProfile,
          nationalTeamManager: world.nationalTeamManager
        }
      };
      await saveGame(saveData);
      setHasSave(true);
      setIsSaveModalOpen(false);
      alert("Partida guardada correctamente.");
    } catch (e) {
      console.error('Save game failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido al guardar la partida';
      alert(`Error al guardar la partida: ${errorMessage}`);
    }
  };

  const handleOpenLoadModal = async () => {
    const saves = await listSaves();
    setAvailableSaves(saves);
    setIsLoadModalOpen(true);
  };

  const confirmLoadGame = async (id: string) => {
    try {
      const data = await loadGame(id);
      if (!data) { 
        alert("No se pudo cargar la partida. Puede que el archivo de guardado esté corrupto o no exista.");
        return; 
      }

      // Deduplicate players by ID
      const seenIds = new Set<string>();
      world.players = data.worldState.players.filter((p: any) => {
        if (seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
      });
      world.clubs = data.worldState.clubs;
      world.competitions = data.worldState.competitions;
      world.staff = data.worldState.staff;
      world.tactics = data.worldState.tactics;
      world.offers = data.worldState.offers;
      world.inbox = data.worldState.inbox;
      if (data.worldState.scoutingReports) world.scoutingReports = data.worldState.scoutingReports;
      world.interactionLog = data.worldState.interactionLog || [];
      world.activeReputationalBuffs = data.worldState.activeReputationalBuffs || [];
      world.relationshipWeb = data.worldState.relationshipWeb || {};
      world.mediaNews = data.worldState.mediaNews || [];
      world.seasonHistory = data.worldState.seasonHistory || [];

      world.players.forEach(p => {
        if (!p.relationships) p.relationships = {};
        if (!p.injuryHistory) p.injuryHistory = [];
        if (p.tacticalFamiliarity === undefined) p.tacticalFamiliarity = 50;
        if (p.leadership === undefined) p.leadership = randomInt(5, 20);
        if (p.consistency === undefined) p.consistency = randomInt(5, 20);
        if (p.bigMatchTemperament === undefined) p.bigMatchTemperament = randomInt(5, 20);
      });
      world.staff.forEach(s => {
        if (!(s as any).relationships) (s as any).relationships = {};
        if ((s as any).personality === undefined) (s as any).personality = ['LEADER', 'PASSIONATE', 'CALM', 'DISCIPLINARIAN', 'VISIONARY'][Math.floor(Math.random() * 5)];
        if ((s as any).morale === undefined) (s as any).morale = 70;
        if ((s as any).reputation === undefined) (s as any).reputation = 50;
        if ((s as any).pressReputation === undefined) (s as any).pressReputation = 50;
        if ((s as any).boardRelationship === undefined) (s as any).boardRelationship = 60;
      });
      world.competitions.forEach(c => {
        if ((c as any).continent === undefined) (c as any).continent = 'América del Sur';
        if ((c as any).confederation === undefined) (c as any).confederation = 'CONMEBOL';
        if ((c as any).defaultPrizePool === undefined) (c as any).defaultPrizePool = 1000000;
        if ((c as any).continentalSlots === undefined) (c as any).continentalSlots = 4;
      });
      if (!world.interactionLog) world.interactionLog = [];
      if (!world.activeReputationalBuffs) world.activeReputationalBuffs = [];
      if (!world.relationshipWeb) world.relationshipWeb = {};
      if (!world.mediaNews) world.mediaNews = [];
      if (!world.seasonHistory) world.seasonHistory = [];
      if (data.worldState.chronicles) world.chronicles = data.worldState.chronicles;
      else world.chronicles = [];
      if (data.worldState.managerProfile) world.managerProfile = data.worldState.managerProfile;
      else world.managerProfile = null;

      // Restore NationalTeamManager from save if available, otherwise rebuild
      const { NationalTeamManager } = await import('./services/nationalTeamManager');
      if (data.worldState.nationalTeamManager) {
        // Validate the saved national team manager data
        world.nationalTeamManager = new NationalTeamManager();
        Object.assign(world.nationalTeamManager, data.worldState.nationalTeamManager);
        // Reassign automatic pools, then validate the saved controlled squad.
        world.nationalTeamManager.assignPlayersToNationalTeams(world.players, world.clubs);
        world.nationalTeamManager.validateControlledState(world.players, world.clubs);
      } else {
        world.nationalTeamManager = new NationalTeamManager();
        world.nationalTeamManager.assignPlayersToNationalTeams(world.players, world.clubs);
        world.nationalTeamManager.validateControlledState(world.players, world.clubs);
      }

      const savedUserLeague = world.getClub(data.gameState.userClubId)?.leagueId;
      const savedDeepLeagues = Array.isArray(data.gameState.deepSimLeagues) && data.gameState.deepSimLeagues.length > 0
        ? data.gameState.deepSimLeagues
        : (savedUserLeague ? [savedUserLeague] : []);
      const migratedDeepLeagues = LeagueEngine.resolveDeepLeagueIds(savedUserLeague, world.competitions, savedDeepLeagues);
      useGameStore.getState().setDeepSimLeagues(migratedDeepLeagues);
      migratedDeepLeagues.forEach((lid: string) => world.ensureDeepSquads(lid));

      setCurrentDate(data.gameState.currentDate);
      setUserName(data.gameState.userName);
      setUserSurname(data.gameState.userSurname);

      const club = data.gameState.userClubId ? world.getClub(data.gameState.userClubId) : null;
      const savedNationalTeamId = data.gameState.selectedNationalTeamId || world.managerProfile?.currentNationalTeamId || world.nationalTeamManager?.controlledTeamId || null;
      setUserClub(club || null);
      setSelectedNationalTeamId(savedNationalTeamId);
      setCareerMode(data.gameState.careerMode || (club && savedNationalTeamId ? 'BOTH' : savedNationalTeamId ? 'NATIONAL' : 'CLUB'));
      setFixtures(data.gameState.fixtures);
      setSeasonEndDate(data.gameState.seasonEndDate);

      if (data.gameState.managerHistory) {
        useGameStore.getState().setManagerHistory(data.gameState.managerHistory);
      }
      if (data.gameState.managerReputation) {
        useGameStore.getState().setManagerReputation(data.gameState.managerReputation);
      }
      if (data.gameState.darkMode !== undefined) {
        useGameStore.getState().setDarkMode(data.gameState.darkMode);
      }

      if (club) {
        updateNextFixture(data.gameState.fixtures, data.gameState.currentDate, club.id);
      } else if (savedNationalTeamId) {
        updateNextFixture(data.gameState.fixtures, data.gameState.currentDate, savedNationalTeamId);
      }

      setIsLoadModalOpen(false);
      setGameState('PLAYING');
      setView('HOME');
      notify();
    } catch (e) {
      console.error(e);
      alert("Error al cargar la partida.");
    }
  };

  const handleDeleteSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de borrar esta partida?")) {
      await deleteSave(id);
      const saves = await listSaves();
      setAvailableSaves(saves);
      if (saves.length === 0) setHasSave(false);
    }
  };

  const renderCurrentView = () => {
    if (!userClub && !selectedNationalTeamId) return null;
    // Vistas de selección nacional — pantallas separadas (Plantel / Tácticas / Partidos / Estadísticas) como en modo club.
    if (currentView.startsWith('NT_')) {
      const body = currentView.replace(/^NT_/, '');
      const sectionMatch = body.match(/^(.*?)_(SQUAD|TACTICS|SCHEDULE|STATS)$/);
      const teamId = sectionMatch ? sectionMatch[1] : body;
      const section = (sectionMatch ? sectionMatch[2] : 'SQUAD') as 'SQUAD' | 'TACTICS' | 'SCHEDULE' | 'STATS';
      return <NationalTeamView teamId={teamId} section={section} />;
    }
    if (!userClub && selectedNationalTeamId) {
      if (currentView === 'CHRONICLES') return <ChronicleView onBack={() => setView('HOME')} clubId={undefined} />;
      if (currentView === 'MANAGER_PROFILE') return <ManagerProfileView onBack={() => setView('HOME')} />;
      if (currentView === 'INBOX') return <InboxView setView={setView} />;
      if (currentView === 'MEDIA') return <MediaView onBack={() => setView('HOME')} />;
      if (currentView === 'SEASON_HISTORY') return <SeasonHistoryView onBack={() => setView('HOME')} />;
      const nationalTeam = world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId);
      const nationalFixture = nextFixture && (nextFixture.homeTeamId === selectedNationalTeamId || nextFixture.awayTeamId === selectedNationalTeamId) ? nextFixture : null;
      return (
        <div className="p-4 sm:p-8 h-full overflow-y-auto bg-[#d4dcd4]">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-[#e8ece8] border border-[#a0b0a0] rounded-sm p-5 shadow-sm flex items-center gap-4">
              <img src={getFlagUrl(nationalTeam?.country || selectedNationalTeamId)} alt={nationalTeam?.name || selectedNationalTeamId} className="w-12 h-8 object-cover rounded-sm border border-[#a0b0a0]" />
              <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cargo internacional activo</p><h2 className="text-2xl font-black uppercase italic text-slate-900">{nationalTeam?.name || selectedNationalTeamId}</h2><p className="text-[10px] text-slate-600">Convocatorias, once inicial y planteamiento táctico bajo tu responsabilidad.</p></div>
            </div>
            <div className="bg-white border border-[#a0b0a0] rounded-sm p-5 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 mb-4">Próximo compromiso</h3>
              {nationalFixture ? <div className="flex items-center justify-between gap-3 text-sm font-black uppercase"><span>{world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === nationalFixture.homeTeamId)?.name || nationalFixture.homeTeamId}</span><span className="text-slate-400">VS</span><span>{world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === nationalFixture.awayTeamId)?.name || nationalFixture.awayTeamId}</span></div> : <p className="text-xs text-slate-500 italic">No hay un partido internacional próximo.</p>}
              <FMButton onClick={() => setView(`NT_${selectedNationalTeamId}`)} className="mt-5"><Flag size={14} /> Gestionar selección</FMButton>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'HOME':
        return (
          <div className="p-4 space-y-4 overflow-y-auto pb-14">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div id="home-next-match" className="lg:col-span-2 bg-slate-200 p-6 rounded-sm border border-slate-500 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-900"><Globe size={120} /></div>
                <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-slate-400 pb-1">Próximo Encuentro</h3>
                {nextFixture ? (
                  <div className="flex items-center justify-center gap-8 py-4 relative z-10">
                    <div className="text-center"><div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center text-white font-black text-xl ${userClub.primaryColor} ${userClub.primaryColor === 'bg-white' ? 'text-slate-950 border border-slate-400' : 'text-white'}`}>{userClub.shortName}</div><p className="font-black text-slate-950 text-xs">{userClub.name}</p></div>
                    <div className="text-4xl font-black text-slate-400 italic">VS</div>
                    <div className="text-center"><div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center font-black text-xl ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor} ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor === 'bg-white' ? 'text-slate-950 border border-slate-400' : 'text-white'}`}>{world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.shortName}</div><p className="font-black text-slate-950 text-xs">{world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.name}</p></div>
                  </div>
                ) : <p className="text-center text-slate-500 italic py-10">No hay partidos próximos.</p>}
                <div className="mt-4 text-center text-slate-600 font-mono text-[10px] uppercase tracking-widest">{nextFixture?.date.toLocaleDateString()}</div>
                {nextFixture && (
                  <button
                    onClick={handleStartMatch}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#3a4a3a] hover:bg-[#2a3a2a] text-white font-black uppercase text-[11px] tracking-wider py-2.5 rounded-sm border border-[#2a3a2a] transition-colors"
                  >
                    <Play size={14} /> Ir al Partido
                  </button>
                )}
              </div>
              <div className="bg-slate-200 p-4 rounded-sm border border-slate-500 shadow-sm flex flex-col">
                <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-2 border-b border-slate-400 pb-1 flex items-center gap-2"><Trophy size={14} /> Competiciones</h3>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {world.competitions.filter(c => {
                    if (c.id === userClub.leagueId) return true;
                    if (c.type !== 'LEAGUE') return fixtures.some(f => f.competitionId === c.id && (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id));
                    return false;
                  }).map(comp => {
                    let statusText = "";
                    if (comp.type === 'LEAGUE') {
                      const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
                      const rank = table.findIndex(e => e.clubId === userClub.id) + 1;
                      statusText = rank > 0 ? `${rank}º Clasificado` : '-';
                    } else statusText = "En curso";
                    return (
                      <div key={comp.id} className="flex justify-between items-center p-2 bg-slate-300/50 rounded-sm border-l-4 border-slate-500">
                        <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[100px]">{comp.name}</span>
                        <span className="text-[10px] font-bold text-slate-950 uppercase">{statusText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {useGameStore.getState().managerHistory.totalGames > 0 && (
            <div className="bg-slate-200 p-3 rounded-sm border border-slate-400 shadow-sm">
              <h3 className="text-slate-950 font-black uppercase text-[10px] tracking-wider mb-2 border-b border-slate-400 pb-1 flex items-center gap-1.5"><User size={12} /> Mi Historíal · Reputación: {useGameStore.getState().managerReputation}/100 · {useGameStore.getState().managerReputation >= 90 ? 'Leyenda' : useGameStore.getState().managerReputation >= 75 ? 'Estrella' : useGameStore.getState().managerReputation >= 60 ? 'Respetado' : useGameStore.getState().managerReputation >= 40 ? 'Promedio' : useGameStore.getState().managerReputation >= 25 ? 'Novato' : 'Desconocido'}</h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-700">
                <span>PJ: {useGameStore.getState().managerHistory.totalGames}</span>
                <span className="text-green-700">G: {useGameStore.getState().managerHistory.totalWins}</span>
                <span className="text-slate-500">E: {useGameStore.getState().managerHistory.totalDraws}</span>
                <span className="text-red-700">P: {useGameStore.getState().managerHistory.totalLosses}</span>
                <span>GF: {useGameStore.getState().managerHistory.goalsFor}</span>
                <span>GC: {useGameStore.getState().managerHistory.goalsAgainst}</span>
                {useGameStore.getState().managerHistory.currentStreak && (
                  <span className={`${useGameStore.getState().managerHistory.currentStreak === 'W' ? 'text-green-600' : useGameStore.getState().managerHistory.currentStreak === 'L' ? 'text-red-600' : 'text-slate-500'}`}>
                    {useGameStore.getState().managerHistory.currentStreak === 'W' ? 'Racha: ' : useGameStore.getState().managerHistory.currentStreak === 'L' ? 'Racha: ' : 'Racha: '}{useGameStore.getState().managerHistory.streakCount}
                  </span>
                )}
                {useGameStore.getState().managerHistory.titles.length > 0 && (
                  <span className="text-yellow-600">Títulos: {useGameStore.getState().managerHistory.titles.length}</span>
                )}
              </div>
            </div>
            )}
            <div id="header-inbox" className="bg-slate-100 p-4 rounded-sm border border-slate-300 shadow-sm">
              <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-slate-300 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-2"><Mail size={14} /> Últimas Noticias</div>
                <button onClick={() => setView('INBOX')} className="text-[9px] text-blue-600 hover:underline flex items-center">Ver todo <ChevronRight size={10} /> </button>
             </h3>
              <div className="space-y-2">
                {world.inbox.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="p-3 bg-slate-200 border-l-4 border-slate-400 hover:bg-slate-300 transition-colors cursor-pointer" onClick={() => setView('INBOX')}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${msg.category === 'MARKET' ? 'bg-blue-600' : msg.category === 'SQUAD' ? 'bg-green-600' : 'bg-slate-600'}`}>{msg.category}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{msg.date.toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase truncate">{msg.subject}</h4>
                    <p className="text-[10px] text-slate-600 truncate italic">{msg.body}</p>
                  </div>
                ))}
                {world.inbox.length === 0 && <p className="text-center text-slate-400 italic text-xs py-4">No hay noticias recientes.</p>}
              </div>
            </div>
          </div>
        );
      case 'INBOX':
        return <InboxView setView={setView} />;
      case 'MEDIA':
        return <MediaView onBack={() => setView('HOME')} />;
      case 'CHRONICLES':
        return <ChronicleView onBack={() => setView('HOME')} clubId={userClub.id} />;
      case 'MANAGER_PROFILE':
        return <ManagerProfileView onBack={() => setView('HOME')} />;
      case 'TABLE':
        return (
          <div className="p-2 h-full flex flex-col">
            <LeagueTable
              entries={world.getLeagueTable(viewLeagueId || userClub.leagueId, fixtures, viewSquadType)}
              userClubId={userClub.id}
              allLeagues={world.getLeagues()}
              currentLeagueId={viewLeagueId || userClub.leagueId}
              onLeagueChange={setViewLeagueId}
              currentSquadType={viewSquadType}
              onSquadTypeChange={setViewSquadType}
            />
          </div>
        );
      case 'MARKET':
        return <MarketView userClubId={userClub.id} onSelectPlayer={setSelectedPlayer} currentDate={currentDate} />;
      case 'SEARCH':
        return <SearchView onSelectPlayer={setSelectedPlayer} />;
      case 'NEGOTIATIONS':
        return <NegotiationsView userClubId={userClub.id} currentDate={currentDate} />;
      case 'ECONOMY':
        return <EconomyView club={userClub} />;
      case 'STAFF':
        return <StaffView staff={world.getStaffByClub(userClub.id)} club={userClub} />;
      case 'TRAINING':
        return <TrainingView club={userClub} players={world.getPlayersByClub(userClub.id)} staff={world.getStaffByClub(userClub.id)} />;
      case 'SCOUTING':
        return <ScoutingView clubId={userClub.id} onSelectPlayer={setSelectedPlayer} />;
      case 'BOARD':
        return <BoardView userClub={userClub} />;
      case 'HALL_OF_FAME':
        return <HallOfFameView onBack={() => setView('HOME')} />;
      case 'SEASON_HISTORY':
        return <SeasonHistoryView onBack={() => setView('HOME')} />;
      case 'LEAGUE_RANKING':
        return (
          <div className="p-4 sm:p-8 h-full overflow-y-auto bg-[#d4dcd4]">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-black text-slate-900 uppercase italic mb-4">🌍 Ranking Mundial de Ligas</h2>
              <div className="bg-white border border-[#a0b0a0] rounded-sm shadow-sm overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="p-2 text-left w-8">#</th>
                      <th className="p-2 text-left">Liga</th>
                      <th className="p-2 text-left">País</th>
                      <th className="p-2 text-center">Rep.</th>
                      <th className="p-2 text-center">Tier</th>
                      <th className="p-2 text-right">Prize Pool</th>
                    </tr>
                  </thead>
                  <tbody>
                    {world.competitions
                      .filter(c => c.type === 'LEAGUE')
                      .sort((a, b) => (b.dynamicReputation || 0) - (a.dynamicReputation || 0))
                      .map((league, i) => {
                        const tier = world.getLeagueTier(league.dynamicReputation || 30);
                        const tierColors: Record<string, string> = {
                          ELITE: 'bg-yellow-100 text-yellow-800',
                          PRESTIGE: 'bg-slate-200 text-slate-700',
                          DEVELOPING: 'bg-amber-100 text-amber-800',
                          EMERGING: 'bg-slate-100 text-slate-600',
                          LOCAL: 'bg-slate-50 text-slate-500',
                        };
                        return (
                          <tr key={league.id} className={`border-t border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}>
                            <td className="p-2 font-black text-slate-400">{i + 1}</td>
                            <td className="p-2 font-black text-slate-900">{league.name}</td>
                            <td className="p-2 text-slate-600">{league.country}</td>
                            <td className="p-2 text-center font-black">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] ${(league.dynamicReputation || 0) >= 80 ? 'bg-green-100 text-green-800' : (league.dynamicReputation || 0) >= 60 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                {league.dynamicReputation || '—'}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${tierColors[tier] || ''}`}>{tier}</span>
                            </td>
                            <td className="p-2 text-right text-slate-600">${(league.defaultPrizePool || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'CLUB_REPORT':
        return <ClubReport club={userClub} />;
      case 'PEOPLE_HUB':
        return <PeopleHub userClub={userClub || undefined} currentDate={currentDate} />;
      case 'CLUBS_LIST':
        return <ClubsListView onSelectClub={(c) => { setViewExternalClub(c); setView('EXTERNAL_CLUB'); }} />;
      case 'EXTERNAL_CLUB':
        if (viewExternalClub) {
          return (
            <div className="flex flex-col h-full bg-slate-300">
              <div className="p-2 bg-slate-200 border-b border-slate-400 flex justify-between items-center shadow-sm">
                <h3 className="font-black uppercase text-slate-800 text-xs flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${viewExternalClub.primaryColor} border flex items-center justify-center text-[8px] text-white shadow-sm`}>
                    {viewExternalClub.shortName.substring(0, 2)}
                  </div>
                  {viewExternalClub.name} - PLANTILLA
                </h3>
                <button onClick={() => setView('CLUBS_LIST')} className="text-[10px] font-bold uppercase bg-white border border-slate-400 px-3 py-1 rounded-sm hover:bg-slate-50 flex items-center gap-1 shadow-sm">
                  <ArrowLeft size={10} /> Volver
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SquadView
                  players={world.getPlayersByClub(viewExternalClub.id).filter(p => p.squad === 'SENIOR')}
                  onSelectPlayer={setSelectedPlayer}
                  customTitle={`PLANTILLA - ${viewExternalClub.name}`}
                  currentDate={currentDate}
                  club={viewExternalClub}
                />
              </div>
            </div>
          );
        }
        return null;
      case 'PRESS_CONFERENCE_PRE': {
        if (isInVacation) {
          return <div className="p-8 text-center text-slate-500 font-black uppercase">En vacaciones</div>;
        }
        const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
        const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
        if (nextFixture && homeClub && awayClub) {
          const opponent = homeClub.id === userClub.id ? awayClub : homeClub;
          return <PressConferenceView club={userClub} opponent={opponent} context="PRE_MATCH" onFinish={() => setView('MATCH')} />;
        }
        return <div className="p-8 text-center text-slate-500 font-black uppercase">Error</div>;
      }
      case 'POST_MATCH_SUMMARY': {
         const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
         const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
         if (nextFixture && homeClub && awayClub) {
           return <PostMatchSummaryView
             homeTeam={homeClub}
             awayTeam={awayClub}
             homeScore={nextFixture.homeScore ?? 0}
             awayScore={nextFixture.awayScore ?? 0}
             stats={lastMatchStats}
             chronicle={lastChronicle}
             userClubId={userClub.id}
             onContinue={() => setView('PRESS_CONFERENCE_POST')}
           />;
         }
         return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos no disponibles</div>;
       }

case 'PRESS_CONFERENCE_POST': {
         if (isInVacation) {
           return <div className="p-8 text-center text-slate-500 font-black uppercase">En vacaciones</div>;
         }
         const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
         const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
         if (nextFixture && homeClub && awayClub) {
           const hName = homeClub.name;
           const aName = awayClub.name;
           const hScore = nextFixture.homeScore ?? 0;
           const aScore = nextFixture.awayScore ?? 0;
           const result = hScore > aScore ? 'Victoria' : hScore < aScore ? 'Derrota' : 'Empate';
           sendMatchNotification(`${result}: ${hName} ${hScore} - ${aScore} ${aName}`);
           const opponent = homeClub.id === userClub.id ? awayClub : homeClub;
           return <PressConferenceView club={userClub} opponent={opponent} context="POST_MATCH" homeScore={nextFixture.homeScore} awayScore={nextFixture.awayScore} onFinish={() => { setView('HOME'); updateNextFixture(fixtures, currentDate, userClub.id); }} />;
         }
return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos no disponibles</div>;
       }
      case 'PRE_MATCH': {
        const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
        const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
        if (nextFixture && homeClub && awayClub) {
          return <PreMatchView club={userClub} opponent={homeClub.id === userClub.id ? awayClub : homeClub} starters={world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR')} onStart={() => setView('MATCH')} onGoToTactics={() => setView('SENIOR_TACTICS')} />;
        }
        return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos de partido no disponibles</div>;
      }
      case 'MATCH': {
        const homeClub = nextFixture ? (nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)) : undefined;
        const awayClub = nextFixture ? (nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId)) : undefined;
        if (nextFixture && homeClub && awayClub) {
           return <MatchView userClubId={userClub.id} currentDate={currentDate} homeTeam={homeClub} awayTeam={awayClub} homePlayers={getMatchSquad(nextFixture.homeTeamId)} awayPlayers={getMatchSquad(nextFixture.awayTeamId)} onFinish={(h, a, stats: Record<string, PlayerMatchStats>, events) => {
              nextFixture.played = true; nextFixture.homeScore = h; nextFixture.awayScore = a;
              MatchSimulator.finalizeSeasonStats(
                world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.squad === 'SENIOR'),
                world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.squad === 'SENIOR'), stats, h, a, nextFixture.competitionId
              );
               LifecycleManager.processPostMatchSuspensions(nextFixture.homeTeamId, nextFixture.awayTeamId, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === nextFixture.homeTeamId).length, Object.entries(stats).filter(([pid, s]) => s.card === 'RED' && world.getPlayer(pid)?.clubId === nextFixture.awayTeamId).length);
               MatchSimulator.processMatchInjuries(stats);
               world.processMatchDayIncome(nextFixture.homeTeamId, nextFixture.competitionId, currentDate);
               world.trackU21Minutes(nextFixture.homeTeamId, world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.squad === 'SENIOR'), stats, currentDate);
               world.trackU21Minutes(nextFixture.awayTeamId, world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.squad === 'SENIOR'), stats, currentDate);
               const userScore = homeClub.id === userClub.id ? h : a;
               const oppScore = homeClub.id === userClub.id ? a : h;
                useGameStore.getState().trackMatchResult(userScore, oppScore);
                world.updateManagerProfileMatch(userScore, oppScore);
                world.updateTacticalFamiliarity(userClub.id);
                world.updateClubRecords(nextFixture.homeTeamId, nextFixture.awayTeamId, h, a, currentDate, nextFixture.competitionId);
                const chronicle = generateMatchChronicle(nextFixture, h, a, stats, userClub.id, events);
               setLastMatchStats(stats);
               setLastChronicle(chronicle);
               setView('POST_MATCH_SUMMARY');
               notify();
           }} />;
        }
        return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos de partido no disponibles</div>;
      }
      default:
        if (currentView.endsWith('_SQUAD')) {
          const type = currentView.split('_')[0] as SquadType;
          return <SquadView players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onSelectPlayer={setSelectedPlayer} onContextMenu={handlePlayerContextMenu} currentDate={currentDate} club={userClub} />;
        }
        if (currentView.endsWith('_TACTICS')) {
          const type = currentView.split('_')[0] as SquadType;
          return <TacticsView club={userClub} players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onContextMenu={handlePlayerContextMenu} />;
        }
        if (currentView.endsWith('_SCHEDULE')) {
          const type = currentView.split('_')[0] as SquadType;
          const squadFixtures = fixtures.filter(f => (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) && f.squadType === type);
          return (
            <div className="p-4 h-full flex flex-col">
              <h2 className="text-xl font-black text-slate-950 mb-4 uppercase tracking-tighter border-b border-slate-500 pb-2 italic">Calendario - {type}</h2>
              <div className="bg-slate-200 rounded-sm border border-slate-500 overflow-y-auto shadow-md flex-1 p-2">
                {squadFixtures.map(f => {
                  const home = world.getClub(f.homeTeamId); const away = world.getClub(f.awayTeamId);
                  const isPenalty = f.penaltyHome !== undefined;
                  const comp = world.competitions.find(c => c.id === f.competitionId);
                  return (
                    <div key={f.id} className="flex flex-col p-2 border-b border-slate-400 hover:bg-slate-300">
                      <div className="flex items-center text-[11px]">
                        <div className="w-20 text-slate-700 font-mono font-bold">{f.date.toLocaleDateString()}</div>
                        <div className="flex-1 text-right font-black text-slate-900 pr-2 uppercase">{home?.name}</div>
                        <div className={`w-20 text-center font-black bg-slate-300 rounded px-1 border border-slate-500 ${f.played ? 'text-slate-950' : 'text-slate-500'}`}>
                          {f.played ? (isPenalty ? `${f.homeScore}-${f.awayScore} (p)` : `${f.homeScore}-${f.awayScore}`) : 'v'}
                        </div>
                        <div className="flex-1 text-left font-black text-slate-900 pl-2 uppercase">{away?.name}</div>
                      </div>
                      <div className="ml-20 text-[9px] font-black uppercase text-slate-500 italic tracking-widest mt-1">{comp?.name || 'Amistoso'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        if (currentView.startsWith('COMP_')) {
          const competition = world.competitions.find(c => c.id === currentView.replace('COMP_', ''));
          return competition ? <TournamentHub competition={competition} fixtures={fixtures} userClubId={userClub.id} /> : null;
        }
        return null;
    }
  };

  if (gameState === 'LOADING') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center text-slate-950"><div className="animate-pulse flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin mb-4 text-slate-900" /><h1 className="text-2xl font-black italic tracking-widest uppercase">FM Argentina</h1></div></div>;

  const onboardingActive = showOnboarding && gameState === 'PLAYING';

  if (gameState === 'SETUP_USER') return (
    <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-400 to-slate-500 opacity-50 pointer-events-none"></div>
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-overlay-in">
          <div className="bg-slate-200 w-full max-lg rounded-sm border-2 border-slate-500 shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-slate-400 pb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase italic">Cargar Partida</h2>
              <button onClick={() => setIsLoadModalOpen(false)}><X size={20} className="text-slate-600 hover:text-red-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll">
              {availableSaves.length === 0 ? (
                <p className="text-center text-slate-500 italic py-10 font-bold uppercase text-xs">No hay partidas guardadas.</p>
              ) : (
                availableSaves.map(save => (
                  <div key={save.id} className="bg-white border border-slate-300 p-3 rounded-sm hover:border-blue-500 hover:shadow-md transition-all group flex justify-between items-center cursor-pointer" onClick={() => confirmLoadGame(save.id)}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-900 uppercase text-xs truncate group-hover:text-blue-700">{save.label}</h4>
                      <div className="flex gap-3 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                        <span>{save.teamName}</span><span>•</span><span>{new Date(save.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={(e) => handleDeleteSave(save.id, e)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Borrar Partida"><Trash2 size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-md w-full bg-slate-200 rounded-sm p-8 border border-slate-600 shadow-2xl z-10">
        <h1 className="text-3xl font-black text-slate-950 mb-6 italic uppercase border-b-4 border-slate-950 pb-2">Perfil del Manager</h1>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Nombre</label>
            <input type="text" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Apellido</label>
            <input type="text" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userSurname} onChange={(e) => setUserSurname(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Nacionalidad</label>
            <select className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userNationality} onChange={(e) => setUserNationality(e.target.value)}>
              <option value="Argentina">Argentina</option>
              <option value="España">España</option>
              <option value="Brasil">Brasil</option>
              <option value="Inglaterra">Inglaterra</option>
              <option value="Italia">Italia</option>
              <option value="Alemania">Alemania</option>
              <option value="Francia">Francia</option>
              <option value="Portugal">Portugal</option>
              <option value="Países Bajos">Países Bajos</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Chile">Chile</option>
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="EE. UU.">EE. UU.</option>
              <option value="Japón">Japón</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Origen</label>
            <select className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userOrigin} onChange={(e) => setUserOrigin(e.target.value as any)}>
              <option value="EX_PLAYER">Exjugador</option>
              <option value="YOUTH_COACH">Categorías inferiores</option>
              <option value="JOURNALIST">Periodista / Analista</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Fecha de nacimiento</label>
            <input type="date" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userBirthDate.toISOString().split('T')[0]} onChange={(e) => setUserBirthDate(new Date(e.target.value))} />
          </div>
          <FMButton onClick={() => { setGameState('SETUP_COUNTRY'); }} className="w-full py-4 mt-4">
            CREAR MI MANAGER <ChevronRight size={14} />
          </FMButton>
          <FMButton onClick={() => { setGameState('SETUP_EXISTING_MANAGER'); }} variant="secondary" className="w-full py-3 mt-2 text-xs border-2 border-slate-400">
            <User size={14} /> ELEGIR MANAGER EXISTENTE
          </FMButton>
          {hasSave && (
            <FMButton onClick={handleOpenLoadModal} variant="secondary" className="w-full py-3 mt-2 text-xs border-2 border-slate-400">
              <HardDrive size={14} /> CARGAR PARTIDA
            </FMButton>
          )}
        </div>
      </div>
    </div>
  );

  if (gameState === 'SETUP_EXISTING_MANAGER') {
    const clubName = (clubId: string | null): string => {
      if (!clubId) return 'Sin club';
      const club = world.getClub(clubId);
      return club ? club.name : 'Desconocido';
    };
    const onSelectManager = (m: RealManager) => {
      setSelectedExistingManager(m);
      setUserName(m.name);
      setUserSurname(m.surname);
      setUserNationality(m.nationality);
      setGameState('SETUP_COUNTRY');
    };
    const handleTakeClub = () => {
      if (managerToConfirm && managerToConfirm.currentClubId) {
        createManagerAndStartGame(managerToConfirm, managerToConfirm.currentClubId, false);
      }
      setShowConflictModal(false);
      setManagerToConfirm(null);
    };
    const handleFireAndTakeFree = () => {
      if (managerToConfirm && managerToConfirm.currentClubId) {
        createManagerAndStartGame(managerToConfirm, managerToConfirm.currentClubId, true);
      }
      setShowConflictModal(false);
      setManagerToConfirm(null);
    };

    // Group managers by country of the club they manage
    const managersByCountry = new Map<string, { manager: RealManager; club: any }[]>();
    ALL_REAL_MANAGERS.forEach(m => {
      if (m.currentClubId) {
        const club = world.getClub(m.currentClubId);
        if (club) {
          const country = club.country;
          if (!managersByCountry.has(country)) managersByCountry.set(country, []);
          managersByCountry.get(country)!.push({ manager: m, club });
        }
      }
    });
    const sortedCountries = Array.from(managersByCountry.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Search filter
    const query = managerSearch.trim().toLocaleLowerCase();
    const filteredBySearch = query ? ALL_REAL_MANAGERS.filter(m => {
      const club = m.currentClubId ? clubName(m.currentClubId) : '';
      const haystack = `${m.name} ${m.surname} ${m.nationality} ${club}`.toLocaleLowerCase();
      return haystack.includes(query);
    }) : [];

    return (
      <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
        {showConflictModal && managerToConfirm && (
          <FMModal isOpen={showConflictModal} onClose={() => setShowConflictModal(false)} title="Conflicto de Manager" size="lg">
            <p className="text-sm text-slate-700 mb-4">
              El manager <span className="font-bold">{managerToConfirm.name} {managerToConfirm.surname}</span> actualmente dirige al <span className="font-bold">{clubName(managerToConfirm.currentClubId)}</span>.
              ¿Qué acción deseas tomar?
            </p>
            <div className="flex justify-around gap-4 mt-6">
              <FMButton onClick={handleTakeClub} className="flex-1 py-3">
                <User size={14} /> Tomar el control de {clubName(managerToConfirm.currentClubId)}
              </FMButton>
              <FMButton onClick={handleFireAndTakeFree} variant="danger" className="flex-1 py-3">
                <Trash2 size={14} /> Despedirlo y tomar el club libre
              </FMButton>
            </div>
            <div className="mt-4 text-xs text-slate-500 italic text-center">
              Advertencia: Despedir un manager puede tener consecuencias en la reputación del club.
            </div>
          </FMModal>
        )}

        <div className="max-w-5xl w-full bg-white rounded-sm p-4 sm:p-10 border border-[#a0b0a0] shadow-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setGameState('SETUP_USER')} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-4 flex items-center gap-1">
            <ChevronLeft size={12} /> Volver
          </button>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-2 tracking-tighter italic uppercase text-center">Elegir Manager</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase text-center tracking-[0.3em] mb-2">{ALL_REAL_MANAGERS.length.toLocaleString()} managers · {ALL_REAL_MANAGERS.filter(m => m.currentClubId).length.toLocaleString()} en activo</p>

          {/* Search input */}
          <div className="mb-6">
            <input
              value={managerSearch}
              onChange={e => setManagerSearch(e.target.value)}
              placeholder="🔍 Buscar por nombre, apellido o club..."
              className="w-full bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#3a4a3a]"
            />
          </div>

          {/* Search results */}
          {query ? (
            <div>
              <p className="text-[9px] font-black text-slate-500 mb-3">{filteredBySearch.length} resultado{filteredBySearch.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBySearch.slice(0, managerResultLimit).map(m => (
                  <button key={m.id} onClick={() => onSelectManager(m)} className="p-4 bg-[#f2f7f2] hover:bg-[#e2eae2] border border-[#a0b0a0] hover:border-l-4 hover:border-l-[#3a4a3a] rounded-sm text-left transition-all shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={getFlagUrl(m.nationality)} alt={m.nationality} className="w-5 h-4 rounded-sm object-cover border border-[#a0b0a0]" />
                      <p className="font-black text-slate-900 text-xs uppercase truncate">{m.name} {m.surname}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${m.currentClubId ? 'bg-[#3a4a3a] text-white' : 'bg-slate-300 text-slate-700'}`}>{m.currentClubId ? clubName(m.currentClubId) : 'Sin club'}</span>
                    <p className="text-[9px] text-slate-500 mt-1">Rep: {m.reputation} · {m.age} años</p>
                  </button>
                ))}
              </div>
              {filteredBySearch.length > managerResultLimit && (
                <button onClick={() => setManagerResultLimit(l => l + 120)} className="mt-4 w-full py-2 bg-[#e2eae2] hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase text-slate-700">
                  Cargar más · {filteredBySearch.length - managerResultLimit} restantes
                </button>
              )}
            </div>
          ) : (
            /* Browse by country */
            <div>
              <p className="text-[9px] font-black text-slate-500 mb-3">Escribí un nombre o elegí un país para ver los managers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedCountries.map(([country, entries]) => (
                  <div key={country} className="border border-[#a0b0a0] rounded-sm overflow-hidden">
                    <div className="bg-[#3a4a3a] px-3 py-2 flex items-center gap-2">
                      <img src={getFlagUrl(country)} alt={country} className="w-5 h-4 rounded-sm object-cover" />
                      <span className="font-black text-white text-[11px] uppercase">{country}</span>
                      <span className="ml-auto text-[9px] text-slate-300 font-bold">{entries.length}</span>
                    </div>
                    <div className="bg-white divide-y divide-[#a0b0a0]/30">
                      {entries.sort((a, b) => b.manager.reputation - a.manager.reputation).slice(0, 5).map(({ manager: m, club }) => (
                        <button key={m.id} onClick={() => onSelectManager(m)} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[#e2eae2] transition-colors text-left">
                          <span className="font-bold text-slate-900 text-[10px] uppercase truncate flex-1">{m.name} {m.surname}</span>
                          <span className="text-[8px] font-bold text-slate-500 truncate">{club.shortName}</span>
                          <span className="text-[9px] font-black text-[#3a4a3a]">{m.reputation}</span>
                        </button>
                      ))}
                      {entries.length > 5 && <div className="px-3 py-1 text-[8px] text-slate-400 font-bold text-center">+{entries.length - 5} más</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'SETUP_CAREER') {
    const selectedManagerLabel = selectedExistingManager ? `${selectedExistingManager.name} ${selectedExistingManager.surname}` : `${userName} ${userSurname}`;
    const chooseMode = (mode: CareerMode) => {
      setCareerMode(mode);
      if (mode === 'CLUB') {
        setSelectedNationalTeamId(null);
        setGameState('SETUP_COUNTRY');
      } else {
        setGameState('SETUP_NATIONAL_TEAM');
      }
    };
    return (
      <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <div className="max-w-3xl w-full bg-white rounded-sm p-5 sm:p-10 border border-[#a0b0a0] shadow-2xl">
          <button onClick={() => setGameState(selectedExistingManager ? 'SETUP_EXISTING_MANAGER' : 'SETUP_USER')} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-5 flex items-center gap-1">
            <ChevronLeft size={12} /> Volver
          </button>
          <div className="flex items-center gap-3 mb-2"><div className="bg-[#3a4a3a] text-white rounded-sm p-2"><Briefcase size={18} /></div><div><h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase italic tracking-tight">Tu carrera</h1><p className="text-[10px] text-slate-500 uppercase tracking-widest">{selectedManagerLabel}</p></div></div>
          <p className="text-xs text-slate-600 mb-6">Elige qué responsabilidad quieres asumir al comenzar. Puedes dirigir un club, una selección nacional o ambos proyectos a la vez.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { mode: 'CLUB' as CareerMode, title: 'Solo club', text: 'Gestiona plantilla, fichajes, staff y competiciones de clubes.' },
              { mode: 'NATIONAL' as CareerMode, title: 'Solo selección', text: 'Convoca jugadores, define el once y dirige el calendario internacional.' },
              { mode: 'BOTH' as CareerMode, title: 'Club + selección', text: 'Una carrera dual con control formal de ambos equipos.' },
            ]).map(option => (
              <button key={option.mode} onClick={() => chooseMode(option.mode)} className="text-left p-4 bg-[#f2f7f2] hover:bg-[#e2eae2] border border-[#a0b0a0] hover:border-l-4 hover:border-l-[#3a4a3a] rounded-sm transition-all">
                <div className="text-[10px] font-black uppercase text-[#3a4a3a] mb-2">{option.title}</div>
                <p className="text-[10px] leading-relaxed text-slate-600">{option.text}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'SETUP_NATIONAL_TEAM') {
    const nationalTeams = world.nationalTeamManager?.nationalTeams || [];
    return (
      <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <div className="max-w-5xl w-full bg-white rounded-sm p-4 sm:p-10 border border-[#a0b0a0] shadow-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setGameState('SETUP_USER')} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-4 flex items-center gap-1"><ChevronLeft size={12} /> Volver</button>
          <div className="flex items-center justify-between gap-3 mb-5"><div><h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase italic tracking-tight">Elegir selección</h1><p className="text-[10px] text-slate-500 uppercase tracking-widest">{careerMode === 'BOTH' ? 'Primero la selección, después el club' : 'Tu equipo nacional'}</p></div><Flag size={22} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {nationalTeams.map((team: any) => {
              const eligible = world.nationalTeamManager?.getEligiblePlayers(team.id, world.players, world.clubs).length || 0;
              const selected = selectedNationalTeamId === team.id;
              return <button key={team.id} onClick={() => {
                if (careerMode === 'BOTH') { setSelectedNationalTeamId(team.id); setGameState('SETUP_COUNTRY'); }
                else { startNationalCareer(team.id, selectedExistingManager); }
              }} className={`p-4 text-left rounded-sm border transition-all ${selected ? 'border-[#3a4a3a] bg-[#e2eae2] border-l-4' : 'border-[#a0b0a0] bg-[#f2f7f2] hover:bg-[#e2eae2] hover:border-l-4 hover:border-l-[#3a4a3a]'}`}>
                <div className="flex items-center gap-2 mb-2"><img src={getFlagUrl(team.country)} alt={team.country} className="w-7 h-5 object-cover rounded-sm border border-[#a0b0a0]" /><span className="text-[9px] font-black text-slate-400">{team.id}</span></div>
                <p className="font-black text-slate-900 uppercase text-xs truncate">{team.name}</p>
                <p className="text-[9px] text-slate-500 mt-1">{team.confederation} · {eligible} elegibles</p>
              </button>;
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'SETUP_COUNTRY') {
    const countryLeagues = world.competitions.filter(c => c.type === 'LEAGUE');
    const countriesMap = new Map<string, number>();
    countryLeagues.forEach(l => {
      countriesMap.set(l.country, (countriesMap.get(l.country) || 0) + 1);
    });
    const countries = Array.from(countriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return (
      <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <div className="max-w-4xl w-full bg-white rounded-sm p-4 sm:p-10 border border-[#a0b0a0] shadow-2xl max-h-[90vh] overflow-y-auto">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-2 tracking-tighter italic uppercase text-center">FM Argentina</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase text-center tracking-[0.3em] mb-6">Seleccioná un país</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {countries.map(([country, count]) => (
              <button key={country} onClick={() => { setSelectedCountry(country); setGameState('SETUP_LEAGUE'); }}
                className="p-4 bg-[#f2f7f2] hover:bg-[#e2eae2] border border-[#a0b0a0] rounded-sm text-left transition-all shadow-sm flex items-center gap-3">
                <img src={getFlagUrl(country)} alt={country} className="w-8 h-6 rounded-sm object-cover border border-[#a0b0a0]" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-xs uppercase truncate">{country}</p>
                  <p className="text-[9px] text-slate-500">{count} liga{count !== 1 ? 's' : ''}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setGameState('SETUP_USER')} className="mt-4 text-[10px] text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1">
            <ChevronLeft size={12} /> Volver
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'SETUP_LEAGUE') {
    const country = selectedCountry;
    const leagues = world.competitions.filter(c => c.type === 'LEAGUE' && c.country === country);
    const nationalTeam = world.nationalTeamManager?.nationalTeams?.find((t: any) => t.country === country);
    return (
      <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <div className="max-w-4xl w-full bg-white rounded-sm p-4 sm:p-10 border border-[#a0b0a0] shadow-2xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setGameState('SETUP_COUNTRY')} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-4 flex items-center gap-1">
            <ChevronLeft size={12} /> Volver a países
          </button>
          <div className="flex items-center gap-3 mb-6">
            {country && <img src={getFlagUrl(country)} alt={country} className="w-8 h-6 rounded-sm border border-[#a0b0a0]" />}
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{country}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nationalTeam && (
              <button onClick={() => {
                startNationalCareer(nationalTeam.id, selectedExistingManager);
              }} className="p-5 bg-[#3a4a3a] hover:bg-[#2a3a2a] border border-[#2a3a2a] rounded-sm text-left transition-all shadow-sm flex flex-col">
                <h3 className="text-base font-black text-white mb-1 italic uppercase truncate">🏳️ Selección</h3>
                <p className="text-[9px] text-slate-300">{nationalTeam.name} · {world.nationalTeamManager?.getEligiblePlayers(nationalTeam.id, world.players, world.clubs).length || 0} elegibles</p>
              </button>
            )}
            {leagues.map(league => {
              const clubCount = world.getClubsByLeague(league.id).length;
              return (
                <button key={league.id} onClick={() => { setSelectedLeague(league); world.ensureDeepSquads(league.id); useGameStore.getState().setDeepSimLeagues([league.id]); setGameState('SETUP_TEAM'); }}
                  className="p-5 bg-[#f2f7f2] hover:bg-[#e2eae2] border border-[#a0b0a0] rounded-sm text-left transition-all shadow-sm flex flex-col">
                  <h3 className="text-base font-black text-slate-900 mb-1 italic uppercase truncate">{league.name}</h3>
                  <p className="text-[9px] text-slate-500">{clubCount} equipo{clubCount !== 1 ? 's' : ''}</p>
                </button>
              );
            })}
          </div>
          {leagues.length === 0 && !nationalTeam && (
            <p className="text-sm text-slate-500 text-center py-8">No hay ligas disponibles para este país.</p>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'SETUP_TEAM') {
    const leagueClubs = world.getClubsByLeague(selectedLeague.id);
    const isExistingManager = !!selectedExistingManager;
    return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-6xl w-full bg-white rounded-sm p-4 sm:p-10 border border-[#a0b0a0] shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={() => setGameState('SETUP_LEAGUE')} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold mb-4 flex items-center gap-1">
          <ChevronLeft size={12} /> Volver a ligas de {selectedCountry}
        </button>
        {isExistingManager && (
          <div className="mb-4 p-3 bg-[#f2f7f2] border border-[#a0b0a0] rounded-sm flex items-center gap-3">
            <img src={getFlagUrl(selectedExistingManager.nationality)} alt={selectedExistingManager.nationality} className="w-6 h-4 rounded-sm border border-[#a0b0a0]" />
            <div className="flex-1">
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Manager</p>
              <p className="text-xs font-black text-slate-900 uppercase">{selectedExistingManager.name} {selectedExistingManager.surname} <span className="text-slate-500 font-bold ml-2">Rep: {selectedExistingManager.reputation}</span></p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 mb-6">
          {selectedCountry && <img src={getFlagUrl(selectedCountry)} alt={selectedCountry} className="w-8 h-6 rounded-sm border border-[#a0b0a0]" />}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight italic">{selectedLeague.name}</h2>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {leagueClubs.map(c => (
              <button key={c.id} onClick={() => {                if (selectedNationalTeamId && careerMode === 'BOTH') {
                  startNationalCareer(selectedNationalTeamId, selectedExistingManager, c.id);
                } else if (selectedExistingManager) {
                  createManagerAndStartGame(selectedExistingManager, c.id, false);
                } else {
                  setUserClub(c);
                  world.createHumanManager(c.id, `${userName} ${userSurname}`);
                  world.createManagerProfile(c.id, userName, userSurname, userNationality, userOrigin, userBirthDate, currentDate, careerMode === 'BOTH' ? selectedNationalTeamId : null);
                  const allFix = initSeasonFixtures(currentDate, c.id);
                  updateNextFixture(allFix, currentDate, c.id);
                  setGameState('PLAYING');
                  notify();
                }
              }} className="p-4 bg-[#f2f7f2] hover:bg-[#e2eae2] border border-[#a0b0a0] rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-[#3a4a3a]">
                <div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-[#a0b0a0]`}></div>
                <p className="font-black text-slate-900 truncate text-[11px] uppercase group-hover:text-[#3a4a3a]">{c.name}</p>
                <p className="text-[9px] text-slate-500 mt-1">Reputación: {Math.round(c.reputation / 10)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  }

  const isMatchView = currentView === 'MATCH';
  const isPreMatchView = currentView === 'PRE_MATCH' || currentView === 'POST_MATCH_SUMMARY' || currentView === 'PRESS_CONFERENCE_POST';

  const dateBg = userClub ? userClub.secondaryColor.replace('text-', 'bg-') : 'bg-white';
  const dateText = userClub ? userClub.primaryColor.replace('bg-', 'text-') : 'text-slate-700';
  const headerTeamName = userClub?.name || world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId)?.name || 'FM';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-400 text-slate-950 overflow-hidden font-sans relative text-sm dark:bg-gray-900 dark:text-gray-100">
      <div className={`h-1 w-full ${userClub ? userClub.secondaryColor.replace('text-', 'bg-') : 'bg-slate-800'}`}></div>

      {isSimulating && !isInVacation && (
        <div className="fixed bottom-[7rem] lg:bottom-4 left-4 right-4 z-[300] pointer-events-none">
          <div className="max-w-md mx-auto bg-slate-900/90 text-white rounded-lg px-4 py-2.5 shadow-2xl border border-slate-700 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">⏳ Simulando</span>
              <span className="text-[9px] text-slate-400 ml-auto">{simProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.max(2, simProgress)}%` }} />
            </div>
            <p className="text-[9px] text-slate-400 mt-1">{simProgressDetail || 'Procesando...'}</p>
          </div>
        </div>
      )}

      {isInVacation && !vacationCancelled && (
        <FMLoadingOverlay
          message="Simulando Vacaciones"
          progress={{ current: vacationProgress, total: 100, detail: vacationDetail }}
          onCancel={() => setVacationCancelled(true)}
          showCancel
        />
      )}

      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-overlay-in">
          <div className="bg-slate-200 w-full max-lg rounded-sm border-2 border-slate-500 shadow-2xl p-6">
            <h3 className="text-lg font-black text-slate-900 uppercase italic mb-4 border-b border-slate-400 pb-2">Guardar Partida</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase block mb-1">Nombre del Archivo</label>
                <div className="flex gap-2">
                  <input type="text" autoFocus className="flex-1 bg-white border border-slate-400 rounded-sm px-3 py-2 text-slate-900 font-bold text-sm focus:border-slate-800 outline-none" value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmSaveGame()} />
                  <button onClick={async () => {
                    const saves = await listSaves();
                    setAvailableSaves(saves);
                  }} className="p-2 bg-slate-300 border border-slate-400 rounded-sm hover:bg-slate-400 transition-colors" title="Actualizar lista"><RefreshCw size={14} /></button>
                </div>
              </div>
              {availableSaves.length > 0 && (
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sobrescribir un guardado existente</label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {availableSaves.map(save => (
                      <div key={save.id} className="flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-sm hover:border-amber-500 transition-all cursor-pointer" onClick={() => {
                        setSaveNameInput(save.label);
                      }}>
                        <Trash2 size={12} className="text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-900 truncate block">{save.label}</span>
                          <span className="text-[8px] text-slate-500">{save.teamName} · {new Date(save.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1">Cancelar</FMButton>
                <FMButton variant="primary" onClick={confirmSaveGame} className="flex-1">Guardar</FMButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isMatchView && !isPreMatchView && (
        <header className={`h-12 border-b flex items-center justify-between px-4 shadow-sm z-[110] shrink-0 transition-colors duration-300 ${userClub ? `${userClub.primaryColor} ${userClub.secondaryColor} border-black/20` : 'bg-gradient-to-b from-slate-200 to-slate-300 border-slate-600'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden hover:opacity-80 transition-opacity ${userClub ? 'text-current' : 'text-slate-900'}`}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-8 ${userClub ? userClub.secondaryColor.replace('text-', 'bg-') : 'bg-slate-800'} border-x border-black/10 opacity-80`}></div>
              <h1 className={`text-sm font-black uppercase tracking-tight italic drop-shadow-sm truncate max-w-[150px] sm:max-w-none ${userClub ? '' : 'text-slate-950'}`}>
                {headerTeamName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-inner border border-black/20 ${dateBg} ${dateText}`}>
              {currentDate.toLocaleDateString()}
            </div>

          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {(userClub || selectedNationalTeamId) && !isMatchView && (
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} club={userClub} nationalTeamId={selectedNationalTeamId} onVacation={() => setIsVacationModalOpen(true)} onSave={handleOpenSaveModal} />
        )}
        <main className="flex-1 flex flex-col min-w-0 bg-[#94a3b8] relative overflow-hidden pb-[104px] lg:pb-0">
          {renderCurrentView()}
        </main>
        {onboardingActive && <OnboardingTour active={onboardingActive} currentView={currentView} onComplete={() => setShowOnboarding(false)} />}
      </div>

      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-slate-200 w-full max-sm rounded-sm border border-slate-600 p-8 text-center shadow-2xl">
            {isSimulating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <RefreshCw size={20} className="text-slate-950 animate-spin" />
                  <h2 className="text-xl font-black text-slate-950 uppercase italic">Simulando...</h2>
                </div>
                <div className="text-center">
                  <p className="text-slate-600 font-mono font-bold text-sm">{currentDate.toLocaleDateString()}</p>
                </div>
                <div className="animate-pulse space-y-2 mt-4">
                  <div className="h-3 bg-slate-300 rounded-sm w-3/4 mx-auto"></div>
                  <div className="h-3 bg-slate-300 rounded-sm w-1/2 mx-auto"></div>
                  <div className="h-3 bg-slate-300 rounded-sm w-2/3 mx-auto"></div>
                  <div className="h-8 bg-slate-300 rounded-sm w-full mt-3"></div>
                  <div className="h-8 bg-slate-300 rounded-sm w-full"></div>
                </div>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-2">Procesando jornadas...</p>
              </div>
            ) : (
              <>
                <Sun size={48} className="text-orange-600 mx-auto mb-4" />
                <h2 className="text-lg font-black text-slate-950 mb-6 uppercase italic tracking-widest border-b-2 border-slate-400 pb-2">Planificar Vacaciones</h2>
                <div className="space-y-4">
                  <div className="text-left"><label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Fecha de Regreso:</label><input type="date" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-3 py-2 text-slate-950 font-bold text-sm" value={vacationTargetDate} onChange={(e) => setVacationTargetDate(e.target.value)} /></div>
                  <FMButton variant="vacation" onClick={() => startVacation()} className="w-full py-4 text-xs">Iniciar Simulación</FMButton>
                  <FMButton variant="primary" onClick={() => startVacation(seasonEndDate)} className="w-full py-4 text-xs">Simular Temporada</FMButton>
                  <FMButton variant="secondary" onClick={() => setIsVacationModalOpen(false)} className="w-full">Cancelar</FMButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedPlayer && (userClub || selectedNationalTeamId) && <PlayerModal player={selectedPlayer} userClubId={userClub?.id} onClose={() => setSelectedPlayer(null)} currentDate={currentDate} />}
      {comparePlayerA && comparePlayerB && <PlayerCompareModal playerA={comparePlayerA} playerB={comparePlayerB} onClose={() => { setComparePlayerA(null); setComparePlayerB(null); }} />}
      {contextMenu && <PlayerContextMenu player={contextMenu.player} x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} currentDate={currentDate} />}
      {seasonSummary && <SeasonSummaryModal summary={seasonSummary} userWonLeague={userWonLeague} onClose={() => { setSeasonSummary(null); setUserWonLeague(false); }} />}
      {currentView !== 'MATCH' && <BottomNav advanceTime={advanceTime} simulateToNextMatch={simulateToNextMatch} isSimulating={isSimulating} isPreMatchView={isPreMatchView} />}
    </div>
  );
};

export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
