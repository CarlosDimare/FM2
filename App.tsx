import React, { useEffect, useCallback, useRef } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';
import { PlayerCompareModal } from './components/PlayerCompareModal';
import { SeasonSummaryModal } from './components/SeasonSummaryModal';
import { PlayerContextMenu } from './components/PlayerContextMenu';
import { BottomNav } from './components/BottomNav';
import { ViewRouter } from './components/ViewRouter';
import { world } from './services/worldManager';
import { LifecycleManager } from './services/lifecycleManager';
import { generateMonthlyChronicle } from './services/chronicleService';
import { Club, Player, Fixture, RealManager, CareerMode } from './types';
import { checkSaveExists, listSaves, deleteSave } from './services/utils';
import { performAutoSave as performAutoSaveService, manualSave, loadGameData, applyWorldState, restoreNationalTeamManager, resolveDeepLeagues, SaveMetadata } from './services/saveLoadService';
import { setupNationalControl, startNationalCareer, createManagerAndStartGame, startNewGame } from './services/careerSetupService';
import { requestNotificationPermission, sendMatchNotification, resolveNotificationDeepLink } from './services/notifications';
import { simulateDayFixtures, processDailyLifecycle, handleSeasonEnd, generateMonthlyChroniclesIfNeeded } from './services/simulationService';
import { RefreshCw, Sun, Moon, Menu, Save, Trash2 } from 'lucide-react';
import { OnboardingTour, isOnboarded } from './components/OnboardingTour';
import { ScreenBackground } from './components/ScreenBackground';
import { FMButton, FMLoadingOverlay } from './components/FMUI';
import { useWorldStore } from './stores/worldStore';
import { useNavStore } from './stores/navStore';
import { useUserStore } from './stores/userStore';
import { useMatchStore } from './stores/matchStore';
import { useSaveStore } from './stores/saveStore';
import { useGameStore } from './stores/gameStore';
import { SetupUserView } from './components/views/SetupUserView';
import { SetupExistingManagerView } from './components/views/SetupExistingManagerView';
import { SetupCareerView } from './components/views/SetupCareerView';
import { SetupNationalTeamView } from './components/views/SetupNationalTeamView';
import { SetupCountryView } from './components/views/SetupCountryView';
import { SetupLeagueView } from './components/views/SetupLeagueView';
import { SetupTeamView } from './components/views/SetupTeamView';

const App: React.FC = () => {
  const darkMode = useGameStore(s => s.darkMode);
  const setDarkMode = useGameStore(s => s.setDarkMode);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showConflictModal, setShowConflictModal] = React.useState(false);
  const [managerToConfirm, setManagerToConfirm] = React.useState<RealManager | null>(null);
  const [managerSearch, setManagerSearch] = React.useState('');
  const [managerCountryFilter, setManagerCountryFilter] = React.useState('ALL');
  const [managerResultLimit, setManagerResultLimit] = React.useState(120);

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

  // ─── Nav store ────────────────────────────────────────────────────────────
  const { gameState, currentView, selectedPlayer, contextMenu, isSidebarOpen, viewExternalClub, viewLeagueId, viewSquadType, comparePlayerA, comparePlayerB,
    setGameState, setView, setSelectedPlayer, setContextMenu, setIsSidebarOpen, setViewExternalClub, setViewLeagueId, setViewSquadType, setComparePlayerA, setComparePlayerB } = useNavStore();
  // ─── User store ───────────────────────────────────────────────────────────
  const { userName, userSurname, userNationality, userOrigin, userBirthDate, selectedCountry, selectedLeague, userClub, selectedNationalTeamId, careerMode, selectedExistingManager,
    setUserName, setUserSurname, setUserNationality, setUserOrigin, setUserBirthDate, setSelectedCountry, setSelectedLeague, setUserClub, setSelectedNationalTeamId, setCareerMode, setSelectedExistingManager } = useUserStore();
  // ─── Match store ──────────────────────────────────────────────────────────
  const { currentDate, seasonEndDate, isSimulating, isInVacation, isVacationModalOpen, vacationTargetDate, vacationProgress, vacationDetail, vacationCancelled, simProgress, simProgressDetail, seasonSummary, userWonLeague,
    setCurrentDate, setSeasonEndDate, setIsSimulating, setIsInVacation, setIsVacationModalOpen, setVacationTargetDate, setVacationProgress, setVacationDetail, setVacationCancelled, resetVacationState, setSimProgress, setSimProgressDetail, setSeasonSummary, setUserWonLeague } = useMatchStore();
  // ─── Save store ───────────────────────────────────────────────────────────
  const { hasSave, isSaveModalOpen, saveNameInput, isLoadModalOpen, availableSaves, isAutoSaveEnabled,
    setHasSave, setIsSaveModalOpen, setSaveNameInput, setIsLoadModalOpen, setAvailableSaves, setIsAutoSaveEnabled } = useSaveStore();

  const { fixtures, nextFixture, setFixtures, setNextFixture, initSeasonFixtures, updateNextFixture } = useGameStore();

  // ─── Deep-linking: notificaciones → navegar a la vista correspondiente ────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const tag = event.data.tag as string;
        const deepLink = resolveNotificationDeepLink(tag);
        if (gameState === 'PLAYING') {
          setView(deepLink.view);
        }
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [gameState, setView]);

  useEffect(() => {
    if (comparePlayerA && selectedPlayer && selectedPlayer.id !== comparePlayerA.id && !comparePlayerB) {
      setComparePlayerB(selectedPlayer);
      setSelectedPlayer(null);
    }
  }, [selectedPlayer, comparePlayerA, comparePlayerB]);

  const activeManagedTeamId = userClub?.id || selectedNationalTeamId || undefined;

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

  // Career setup functions moved to services/careerSetupService.ts

  const performAutoSave = async () => {
    const success = await performAutoSaveService({
      currentDate, userName, userSurname, userClub, selectedNationalTeamId,
      careerMode, fixtures, seasonEndDate, isAutoSaveEnabled,
    });
    if (success) setHasSave(true);
  };

  const advanceTime = async () => {
    const t0 = performance.now();
    // ── Fixture stats ──────────────────────────────────────────────
    const deepIds = new Set(useGameStore.getState().deepSimLeagues);
    const totalFix = fixtures.filter(f => !f.played && f.date.toDateString() === currentDate.toDateString());
    const deepFix = totalFix.filter(f => deepIds.has(world.getClub(f.homeTeamId)?.leagueId || world.getClub(f.awayTeamId)?.leagueId || ''));
    const lightFix = totalFix.length - deepFix.length;
    console.groupCollapsed(`📅 ${currentDate.toLocaleDateString('es-ES')} — ${totalFix.length} partidos (${deepFix.length} DEEP · ${lightFix} LIGHT) · ${fixtures.length.toLocaleString()} totales`);
    if (currentView === 'PRE_MATCH') {
      handleStartMatch();
      return;
    }

    if (currentView === 'SENIOR_TACTICS' && userClub) {
      const isMatchToday = fixtures.some(f =>
        !f.played &&
        f.date.toDateString() === currentDate.toDateString() &&
        (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
        f.squadType === 'SENIOR'
      );
      if (isMatchToday) {
        setView('PRESS_CONFERENCE_PRE');
        return;
      }
    }

    if (currentDate >= seasonEndDate) {
      const result = handleSeasonEnd(fixtures, activeManagedTeamId, userClub, currentDate);
      if (result) {
        setSeasonSummary(result.summaries);
        setUserWonLeague(result.userWonLeague);
        sendMatchNotification('Temporada finalizada — revisa el resumen');
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
      setView('PRE_MATCH');
      return;
    }
    // Los partidos de selección se simulan en el bloque de fixtures de abajo;
    // no se interrumpe aquí para evitar dejar el mismo encuentro pendiente.

      console.time('  ⚽ simular partidos');
      simulateDayFixtures({ date: currentDate, fixtures, userClub, selectedNationalTeamId, activeManagedTeamId });
      console.timeEnd('  ⚽ simular partidos');
    }

    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);

    console.time('  🔄 ciclo diario');
    processDailyLifecycle(nextDay, userClub?.id);
    generateMonthlyChroniclesIfNeeded(nextDay, userClub, fixtures, lastChronicleMonth);
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
      if (userMatchTomorrow) setView('PRE_MATCH');
      else if (next && next.date.toDateString() === nextDay.toDateString()) setView('PRE_MATCH');
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

      processDailyLifecycle(tempDate, userClub?.id);
      simulateDayFixtures({ date: tempDate, fixtures: localFixtures, userClub, selectedNationalTeamId, activeManagedTeamId });

      const newCupFixtures = LifecycleManager.processCompetitionProgress(localFixtures, tempDate);
      if (newCupFixtures.length > 0) {
        localFixtures = [...localFixtures, ...newCupFixtures];
      }

      if (tempDate >= seasonEndDate) {
        setFixtures(localFixtures);
        const result = handleSeasonEnd(localFixtures, activeManagedTeamId, userClub, tempDate);
        if (result) {
          setSeasonSummary(result.summaries);
          setUserWonLeague(result.userWonLeague);
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
        const result = handleSeasonEnd(localFixtures, activeManagedTeamId, userClub, tempDate);
        if (result) {
          setSeasonSummary(result.summaries);
          setUserWonLeague(result.userWonLeague);
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

      // Skip user matches in simulateToNextMatch (they stop at the user match)
      simulateDayFixtures({ date: tempDate, fixtures: localFixtures, userClub, selectedNationalTeamId, activeManagedTeamId });
      processDailyLifecycle(tempDate, userClub?.id);

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
        setView(hasClubMatch ? 'PRE_MATCH' : hasNationalMatch ? `NT_${selectedNationalTeamId}` : 'PRE_MATCH');
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
    try {
      await manualSave({ saveNameInput, currentDate, userName, userSurname, userClub, selectedNationalTeamId, careerMode, fixtures, seasonEndDate });
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
      const data = await loadGameData(id);
      if (!data) {
        alert("No se pudo cargar la partida. Puede que el archivo de guardado esté corrupto o no exista.");
        return;
      }

      applyWorldState(data.worldState);
      await restoreNationalTeamManager(data.worldState);

      const deepLeagues = resolveDeepLeagues(data.gameState.userClubId, data.gameState.deepSimLeagues);
      useGameStore.getState().setDeepSimLeagues(deepLeagues);
      deepLeagues.forEach((lid: string) => world.ensureDeepSquads(lid));

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

      if (data.gameState.managerHistory) useGameStore.getState().setManagerHistory(data.gameState.managerHistory);
      if (data.gameState.managerReputation) useGameStore.getState().setManagerReputation(data.gameState.managerReputation);
      if (data.gameState.darkMode !== undefined) useGameStore.getState().setDarkMode(data.gameState.darkMode);

      if (club) updateNextFixture(data.gameState.fixtures, data.gameState.currentDate, club.id);
      else if (savedNationalTeamId) updateNextFixture(data.gameState.fixtures, data.gameState.currentDate, savedNationalTeamId);

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

  // renderCurrentView removed — replaced by <ViewRouter />

  if (gameState === 'LOADING') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center text-slate-950"><div className="animate-pulse flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin mb-4 text-slate-900" /><h1 className="text-2xl font-black italic tracking-widest uppercase">FM Argentina</h1></div></div>;

  const onboardingActive = showOnboarding && gameState === 'PLAYING';

  if (gameState === 'SETUP_USER') return (
    <SetupUserView
      userName={userName}
      userSurname={userSurname}
      userNationality={userNationality}
      userOrigin={userOrigin}
      userBirthDate={userBirthDate}
      hasSave={hasSave}
      isLoadModalOpen={isLoadModalOpen}
      availableSaves={availableSaves}
      onUserNameChange={setUserName}
      onUserSurnameChange={setUserSurname}
      onUserNationalityChange={setUserNationality}
      onUserOriginChange={setUserOrigin}
      onUserBirthDateChange={setUserBirthDate}
      onNext={() => setGameState('SETUP_CAREER')}
      onExistingManager={() => setGameState('SETUP_EXISTING_MANAGER')}
      onLoad={handleOpenLoadModal}
      onCloseLoadModal={() => setIsLoadModalOpen(false)}
      onLoadGame={confirmLoadGame}
      onDeleteSave={handleDeleteSave}
    />
  );

  if (gameState === 'SETUP_EXISTING_MANAGER') {
    const onSelectManager = (m: RealManager) => {
      setSelectedExistingManager(m);
      setManagerResultLimit(120);
      setUserName(m.name);
      setUserSurname(m.surname);
      setUserNationality(m.nationality);
      setGameState('SETUP_CAREER');
    };
    const handleTakeClub = () => {
      if (managerToConfirm && managerToConfirm.currentClubId) {
        createManagerAndStartGame({ manager: managerToConfirm, clubId: managerToConfirm.currentClubId, fired: false, currentDate, selectedNationalTeamId, careerMode, userName, userSurname });
      }
      setShowConflictModal(false);
      setManagerToConfirm(null);
    };
    const handleFireAndTakeFree = () => {
      if (managerToConfirm && managerToConfirm.currentClubId) {
        createManagerAndStartGame({ manager: managerToConfirm, clubId: managerToConfirm.currentClubId, fired: true, currentDate, selectedNationalTeamId, careerMode, userName, userSurname });
      }
      setShowConflictModal(false);
      setManagerToConfirm(null);
    };

    return (
      <SetupExistingManagerView
        showConflictModal={showConflictModal}
        managerToConfirm={managerToConfirm}
        managerSearch={managerSearch}
        managerCountryFilter={managerCountryFilter}
        managerResultLimit={managerResultLimit}
        onManagerSearchChange={setManagerSearch}
        onManagerCountryFilterChange={setManagerCountryFilter}
        onManagerResultLimitChange={setManagerResultLimit}
        onSelectManager={onSelectManager}
        onTakeClub={handleTakeClub}
        onFireAndTakeFree={handleFireAndTakeFree}
        onCloseConflict={() => { setShowConflictModal(false); setManagerToConfirm(null); }}
        onBack={() => setGameState('SETUP_USER')}
      />
    );
  }

  if (gameState === 'SETUP_CAREER') {
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
      <SetupCareerView
        userName={userName}
        userSurname={userSurname}
        selectedExistingManager={selectedExistingManager}
        onChooseMode={chooseMode}
        onBack={() => setGameState(selectedExistingManager ? 'SETUP_EXISTING_MANAGER' : 'SETUP_USER')}
      />
    );
  }

  if (gameState === 'SETUP_NATIONAL_TEAM') {
    return (
      <SetupNationalTeamView
        careerMode={careerMode}
        selectedNationalTeamId={selectedNationalTeamId}
        selectedExistingManager={selectedExistingManager}
        onSelectTeam={(teamId) => {
          if (careerMode === 'BOTH') { setSelectedNationalTeamId(teamId); setGameState('SETUP_COUNTRY'); }
          else {
            const result = startNationalCareer({ teamId, managerData: selectedExistingManager, currentDate, userName, userSurname, userNationality, userOrigin, userBirthDate });
            if (result.error) alert(result.error);
            else notify();
          }
        }}
        onBack={() => setGameState('SETUP_CAREER')}
      />
    );
  }

  if (gameState === 'SETUP_COUNTRY') {
    return (
      <SetupCountryView
        onSelectCountry={(country) => { setSelectedCountry(country); setGameState('SETUP_LEAGUE'); }}
        onBack={() => setGameState('SETUP_CAREER')}
      />
    );
  }

  if (gameState === 'SETUP_LEAGUE') {
    return (
      <SetupLeagueView
        selectedCountry={selectedCountry}
        onSelectLeague={(league) => { setSelectedLeague(league); world.ensureDeepSquads(league.id); useGameStore.getState().setDeepSimLeagues([league.id]); setGameState('SETUP_TEAM'); }}
        onBack={() => setGameState('SETUP_COUNTRY')}
      />
    );
  }

  if (gameState === 'SETUP_TEAM') {
    return (
      <SetupTeamView
        selectedLeague={selectedLeague}
        selectedCountry={selectedCountry}
        selectedExistingManager={selectedExistingManager}
        selectedNationalTeamId={selectedNationalTeamId}
        careerMode={careerMode}
        currentDate={currentDate}
        userName={userName}
        userSurname={userSurname}
        userNationality={userNationality}
        userOrigin={userOrigin}
        userBirthDate={userBirthDate}
        onSelectClub={(c) => {
          if (selectedNationalTeamId && careerMode === 'BOTH') {
            startNationalCareer({ teamId: selectedNationalTeamId, managerData: selectedExistingManager, clubId: c.id, currentDate, userName, userSurname, userNationality, userOrigin, userBirthDate });
            notify();
          } else if (selectedExistingManager) {
            createManagerAndStartGame({ manager: selectedExistingManager, clubId: c.id, fired: false, currentDate, selectedNationalTeamId, careerMode, userName, userSurname });
            notify();
          } else {
            startNewGame({ club: c, currentDate, userName, userSurname, userNationality, userOrigin, userBirthDate, careerMode, selectedNationalTeamId });
            notify();
          }
        }}
        onBack={() => setGameState('SETUP_LEAGUE')}
      />
    );
  }

  const isMatchView = currentView === 'MATCH';
  const isPreMatchView = currentView === 'PRE_MATCH' || currentView === 'PRESS_CONFERENCE_PRE' || currentView === 'PRESS_CONFERENCE_POST';

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
            <div id="header-actions" className="flex items-center gap-2">
              <button onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)} className={`p-1.5 rounded-sm border transition-colors ${isAutoSaveEnabled ? 'bg-slate-800 text-green-400 border-green-600' : 'bg-slate-700 text-slate-400 border-slate-600'}`} title={isAutoSaveEnabled ? 'Auto-guardado activado' : 'Auto-guardado desactivado'}>
                <Save size={12} />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 rounded-sm border border-slate-600 bg-slate-700 text-yellow-300 hover:bg-slate-600 transition-colors" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {(userClub || selectedNationalTeamId) && !isMatchView && (
          <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} club={userClub} nationalTeamId={selectedNationalTeamId} onVacation={() => setIsVacationModalOpen(true)} onSave={handleOpenSaveModal} />
        )}
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden pb-[104px] lg:pb-0">
          <ScreenBackground view={currentView}>
            <ViewRouter
              currentView={currentView}
              userClub={userClub}
              selectedNationalTeamId={selectedNationalTeamId}
              nextFixture={nextFixture}
              fixtures={fixtures}
              currentDate={currentDate}
              viewLeagueId={viewLeagueId}
              viewSquadType={viewSquadType}
              viewExternalClub={viewExternalClub}
              isInVacation={isInVacation}
              setView={setView}
              setSelectedPlayer={setSelectedPlayer}
              setViewExternalClub={setViewExternalClub}
              handlePlayerContextMenu={handlePlayerContextMenu}
              notify={notify}
            />
          </ScreenBackground>
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
