import { create } from 'zustand';
import { Player, Club, Competition, SquadType, ManagerOrigin, RealManager, CareerMode } from '../types';
import { SaveMetadata } from '../services/utils';
import { CompetitionSummary } from '../components/SeasonSummaryModal';

type GameState = 'LOADING' | 'SETUP_USER' | 'SETUP_EXISTING_MANAGER' | 'SETUP_CAREER' | 'SETUP_COUNTRY' | 'SETUP_LEAGUE' | 'SETUP_NATIONAL_TEAM' | 'SETUP_TEAM' | 'PLAYING';

interface UIStore {
  gameState: GameState;
  currentView: string;
  selectedPlayer: Player | null;
  contextMenu: { player: Player; x: number; y: number } | null;
  isSidebarOpen: boolean;
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: ManagerOrigin;
  userBirthDate: Date;
  selectedCountry: string | null;
  selectedLeague: Competition | null;
  userClub: Club | null;
  viewExternalClub: Club | null;
  isVacationModalOpen: boolean;
  vacationTargetDate: string;
  isSimulating: boolean;
  isInVacation: boolean;
  vacationProgress: number; // 0-100
  vacationDetail: string;
  vacationCancelled: boolean;
  simProgress: number; // 0-100 for simulateToNextMatch
  simProgressDetail: string;
  seasonSummary: CompetitionSummary[] | null;
  userWonLeague: boolean;
  viewLeagueId: string | null;
  viewSquadType: SquadType;
  currentDate: Date;
  seasonEndDate: Date;
  hasSave: boolean;
  isSaveModalOpen: boolean;
  saveNameInput: string;
  isLoadModalOpen: boolean;
  availableSaves: SaveMetadata[];
  isAutoSaveEnabled: boolean;
  comparePlayerA: Player | null;
  comparePlayerB: Player | null;
  selectedExistingManager: RealManager | null;
  careerMode: CareerMode;
  selectedNationalTeamId: string | null;

  setGameState: (state: GameState) => void;
  setView: (view: string) => void;
  setSelectedPlayer: (p: Player | null) => void;
  setContextMenu: (cm: { player: Player; x: number; y: number } | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setUserName: (name: string) => void;
  setUserSurname: (surname: string) => void;
  setUserNationality: (nat: string) => void;
  setUserOrigin: (origin: ManagerOrigin) => void;
  setUserBirthDate: (date: Date) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedLeague: (league: Competition | null) => void;
  setUserClub: (club: Club | null) => void;
  setViewExternalClub: (club: Club | null) => void;
  setIsVacationModalOpen: (open: boolean) => void;
  setVacationTargetDate: (date: string) => void;
  setIsSimulating: (sim: boolean) => void;
  setVacationProgress: (progress: number) => void;
  setVacationDetail: (detail: string) => void;
  setVacationCancelled: (cancelled: boolean) => void;
  setSimProgress: (progress: number) => void;
  setSimProgressDetail: (detail: string) => void;
  resetVacationState: () => void;
  setIsInVacation: (inVacation: boolean) => void;
  setSeasonSummary: (summary: CompetitionSummary[] | null) => void;
  setUserWonLeague: (won: boolean) => void;
  setViewLeagueId: (id: string | null) => void;
  setViewSquadType: (type: SquadType) => void;
  setCurrentDate: (date: Date) => void;
  setSeasonEndDate: (date: Date) => void;
  setHasSave: (has: boolean) => void;
  setIsSaveModalOpen: (open: boolean) => void;
  setSaveNameInput: (name: string) => void;
  setIsLoadModalOpen: (open: boolean) => void;
  setAvailableSaves: (saves: SaveMetadata[]) => void;
  setIsAutoSaveEnabled: (enabled: boolean) => void;
  setComparePlayerA: (p: Player | null) => void;
  setComparePlayerB: (p: Player | null) => void;
  setSelectedExistingManager: (m: RealManager | null) => void;
  setCareerMode: (mode: CareerMode) => void;
  setSelectedNationalTeamId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  gameState: 'LOADING',
  currentView: 'HOME',
  selectedPlayer: null,
  contextMenu: null,
  isSidebarOpen: false,
  userName: 'Manager',
  userSurname: 'Novato',
  userNationality: 'Argentina',
  userOrigin: 'EX_PLAYER',
  userBirthDate: new Date(1985, 5, 15),
  selectedCountry: null,
  selectedLeague: null,
  userClub: null,
  viewExternalClub: null,
  isVacationModalOpen: false,
  vacationTargetDate: '',
  isSimulating: false,
  isInVacation: false,
  vacationProgress: 0,
  vacationDetail: '',
  vacationCancelled: false,
  simProgress: 0,
  simProgressDetail: '',
  seasonSummary: null,
  userWonLeague: false,
  viewLeagueId: null,
  viewSquadType: 'SENIOR',
  currentDate: new Date(2008, 7, 16),
  seasonEndDate: new Date(2009, 6, 10),
  hasSave: false,
  isSaveModalOpen: false,
  saveNameInput: '',
  isLoadModalOpen: false,
  availableSaves: [],
  isAutoSaveEnabled: false,
  comparePlayerA: null,
  comparePlayerB: null,
  selectedExistingManager: null,
  careerMode: 'CLUB',
  selectedNationalTeamId: null,

  setGameState: (gameState) => set({ gameState }),
  setView: (currentView) => set({ currentView }),
  setSelectedPlayer: (selectedPlayer) => set({ selectedPlayer }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setUserName: (userName) => set({ userName }),
  setUserSurname: (userSurname) => set({ userSurname }),
  setUserNationality: (userNationality) => set({ userNationality }),
  setUserOrigin: (userOrigin) => set({ userOrigin }),
  setUserBirthDate: (userBirthDate) => set({ userBirthDate }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedLeague: (selectedLeague) => set({ selectedLeague }),
  setUserClub: (userClub) => set({ userClub }),
  setViewExternalClub: (viewExternalClub) => set({ viewExternalClub }),
  setIsVacationModalOpen: (isVacationModalOpen) => set({ isVacationModalOpen }),
  setVacationTargetDate: (vacationTargetDate) => set({ vacationTargetDate }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setIsInVacation: (isInVacation) => set({ isInVacation }),
  setVacationProgress: (progress) => set({ vacationProgress: progress }),
  setVacationDetail: (detail) => set({ vacationDetail: detail }),
  setVacationCancelled: (cancelled) => set({ vacationCancelled: cancelled }),
  setSimProgress: (simProgress: number) => set({ simProgress }),
  setSimProgressDetail: (simProgressDetail: string) => set({ simProgressDetail }),
  resetVacationState: () => set({ vacationProgress: 0, vacationDetail: '', vacationCancelled: false }),
  setSeasonSummary: (seasonSummary) => set({ seasonSummary }),
  setUserWonLeague: (userWonLeague) => set({ userWonLeague }),
  setViewLeagueId: (viewLeagueId) => set({ viewLeagueId }),
  setViewSquadType: (viewSquadType) => set({ viewSquadType }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  setSeasonEndDate: (seasonEndDate) => set({ seasonEndDate }),
  setHasSave: (hasSave) => set({ hasSave }),
  setIsSaveModalOpen: (isSaveModalOpen) => set({ isSaveModalOpen }),
  setSaveNameInput: (saveNameInput) => set({ saveNameInput }),
  setIsLoadModalOpen: (isLoadModalOpen) => set({ isLoadModalOpen }),
  setAvailableSaves: (availableSaves) => set({ availableSaves }),
  setIsAutoSaveEnabled: (isAutoSaveEnabled) => set({ isAutoSaveEnabled }),
  setComparePlayerA: (comparePlayerA) => set({ comparePlayerA }),
  setComparePlayerB: (comparePlayerB) => set({ comparePlayerB }),
  setSelectedExistingManager: (selectedExistingManager) => set({ selectedExistingManager }),
  setCareerMode: (careerMode) => set({ careerMode }),
  setSelectedNationalTeamId: (selectedNationalTeamId) => set({ selectedNationalTeamId }),
}));
