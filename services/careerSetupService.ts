import { Club, Player, Fixture, RealManager, CareerMode, ManagerOrigin } from '../types';
import { world } from './worldManager';
import { TACTIC_PRESETS } from '../data/static';
import { useGameStore } from '../stores/gameStore';
import { useNavStore } from '../stores/navStore';
import { useUserStore } from '../stores/userStore';

// ─── National team helpers ───────────────────────────────────────────────────

export function setupNationalControl(teamId: string): boolean {
  const manager = world.nationalTeamManager;
  const team = manager?.nationalTeams?.find((candidate: any) => candidate.id === teamId);
  if (!manager || !team) return false;
  const eligiblePlayers = manager.getEligiblePlayers(teamId, world.players, world.clubs);
  const eligibleIds = new Set(eligiblePlayers.map((player: Player) => player.id));
  const savedIds = (team.playerIds || []).filter((id: string) => eligibleIds.has(id));
  const fallbackIds = eligiblePlayers.map((player: Player) => player.id).filter((id: string) => !savedIds.includes(id));
  const preset = TACTIC_PRESETS.find(tactic => tactic.id === team.formation) || TACTIC_PRESETS[0];
  return manager.assumeControl(teamId, [...savedIds, ...fallbackIds].slice(0, 23), { ...preset.settings }, eligiblePlayers.map((player: Player) => player.id));
}

export function startNationalCareer(params: {
  teamId: string;
  managerData?: RealManager | null;
  clubId?: string | null;
  currentDate: Date;
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: ManagerOrigin;
  userBirthDate: Date;
}): { success: boolean; error?: string } {
  const { teamId, managerData, clubId, currentDate, userName, userSurname, userNationality, userOrigin, userBirthDate } = params;

  if (!setupNationalControl(teamId)) {
    return { success: false, error: 'No hay suficientes jugadores elegibles para formar una convocatoria internacional.' };
  }

  const club = clubId ? world.getClub(clubId) : null;

  useUserStore.getState().setSelectedNationalTeamId(teamId);
  useUserStore.getState().setUserClub(club || null);

  if (club) {
    world.ensureDeepSquads(club.leagueId);
    useGameStore.getState().setDeepSimLeagues([club.leagueId]);
  }

  const { initSeasonFixtures, updateNextFixture } = useGameStore.getState();
  const allFix = initSeasonFixtures(currentDate, club?.id);
  updateNextFixture(allFix, currentDate, club?.id || teamId);

  world.createManagerProfile(
    club?.id || null,
    managerData?.name || userName,
    managerData?.surname || userSurname,
    managerData?.nationality || userNationality,
    managerData ? 'EX_PLAYER' : userOrigin,
    managerData?.birthDate || userBirthDate,
    currentDate,
    teamId
  );

  if (club) {
    if (managerData) world.replaceHeadCoach(managerData, club.id, false);
    else world.createHumanManager(club.id, `${userName} ${userSurname}`);
  }

  useNavStore.getState().setGameState('PLAYING');
  useNavStore.getState().setView('HOME');

  return { success: true };
}

export function createManagerAndStartGame(params: {
  manager: RealManager;
  clubId: string;
  fired: boolean;
  currentDate: Date;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  userName: string;
  userSurname: string;
}): boolean {
  const { manager, clubId, fired, currentDate, selectedNationalTeamId, careerMode, userName, userSurname } = params;
  const club = world.getClub(clubId);
  if (!club) return false;

  if (selectedNationalTeamId && careerMode !== 'CLUB') {
    if (!setupNationalControl(selectedNationalTeamId)) return false;
    world.replaceHeadCoach(manager, club.id, fired);
  } else {
    world.replaceHeadCoach(manager, club.id, fired);
  }

  useUserStore.getState().setUserClub(club);
  world.ensureDeepSquads(club.leagueId);
  useGameStore.getState().setDeepSimLeagues([club.leagueId]);

  const { initSeasonFixtures, updateNextFixture } = useGameStore.getState();
  const allFix = initSeasonFixtures(currentDate, club.id);
  updateNextFixture(allFix, currentDate, club.id);

  world.createManagerProfile(
    club.id,
    manager.name,
    manager.surname,
    manager.nationality,
    'EX_PLAYER',
    manager.birthDate,
    currentDate,
    careerMode === 'BOTH' ? selectedNationalTeamId : null
  );

  useNavStore.getState().setGameState('PLAYING');
  useNavStore.getState().setView('HOME');

  return true;
}

export function startNewGame(params: {
  club: Club;
  currentDate: Date;
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: ManagerOrigin;
  userBirthDate: Date;
  careerMode: CareerMode;
  selectedNationalTeamId: string | null;
}): void {
  const { club, currentDate, userName, userSurname, userNationality, userOrigin, userBirthDate, careerMode, selectedNationalTeamId } = params;

  useUserStore.getState().setUserClub(club);
  world.createHumanManager(club.id, `${userName} ${userSurname}`);
  world.createManagerProfile(club.id, userName, userSurname, userNationality, userOrigin, userBirthDate, currentDate, careerMode === 'BOTH' ? selectedNationalTeamId : null);

  const { initSeasonFixtures, updateNextFixture } = useGameStore.getState();
  const allFix = initSeasonFixtures(currentDate, club.id);
  updateNextFixture(allFix, currentDate, club.id);

  useNavStore.getState().setGameState('PLAYING');
}
