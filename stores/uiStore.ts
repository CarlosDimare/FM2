import { create } from 'zustand';
import { Player, Club, Competition, SquadType } from '../types';
import { SaveMetadata } from '../services/utils';
import { CompetitionSummary } from '../components/SeasonSummaryModal';

type GameState = 'LOADING' | 'SETUP_USER' | 'SETUP_LEAGUE' | 'SETUP_TEAM' | 'PLAYING';

interface UIStore {
  gameState: GameState;
  currentView: string;
  selectedPlayer: Player | null;
  contextMenu: { player: Player; x: number; y: number } | null;
  isSidebarOpen: boolean;
  userName: string;
  userSurname: string;
  selectedLeague: Competition | null;
  userClub: Club | null;
  viewExternalClub: Club | null;
  isVacationModalOpen: boolean;
  vacationTargetDate: string;
  isSimulating: boolean;
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

  setGameState: (state: GameState) => void;
  setView: (view: string) => void;
  setSelectedPlayer: (p: Player | null) => void;
  setContextMenu: (cm: { player: Player; x: number; y: number } | null) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setUserName: (name: string) => void;
  setUserSurname: (surname: string) => void;
  setSelectedLeague: (league: Competition | null) => void;
  setUserClub: (club: Club | null) => void;
  setViewExternalClub: (club: Club | null) => void;
  setIsVacationModalOpen: (open: boolean) => void;
  setVacationTargetDate: (date: string) => void;
  setIsSimulating: (sim: boolean) => void;
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
}

export const useUIStore = create<UIStore>((set) => ({
  gameState: 'LOADING',
  currentView: 'HOME',
  selectedPlayer: null,
  contextMenu: null,
  isSidebarOpen: false,
  userName: 'Manager',
  userSurname: 'Novato',
  selectedLeague: null,
  userClub: null,
  viewExternalClub: null,
  isVacationModalOpen: false,
  vacationTargetDate: '',
  isSimulating: false,
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

  setGameState: (gameState) => set({ gameState }),
  setView: (currentView) => set({ currentView }),
  setSelectedPlayer: (selectedPlayer) => set({ selectedPlayer }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setUserName: (userName) => set({ userName }),
  setUserSurname: (userSurname) => set({ userSurname }),
  setSelectedLeague: (selectedLeague) => set({ selectedLeague }),
  setUserClub: (userClub) => set({ userClub }),
  setViewExternalClub: (viewExternalClub) => set({ viewExternalClub }),
  setIsVacationModalOpen: (isVacationModalOpen) => set({ isVacationModalOpen }),
  setVacationTargetDate: (vacationTargetDate) => set({ vacationTargetDate }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
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
}));
