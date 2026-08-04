import { create } from 'zustand';
import { Player, Club, SquadType } from '../types';

export type GameState = 'LOADING' | 'SETUP_USER' | 'SETUP_EXISTING_MANAGER' | 'SETUP_CAREER' | 'SETUP_COUNTRY' | 'SETUP_LEAGUE' | 'SETUP_NATIONAL_TEAM' | 'SETUP_TEAM' | 'PLAYING';

interface NavStore {
  gameState: GameState;
  currentView: string;
  isSidebarOpen: boolean;
  selectedPlayer: Player | null;
  contextMenu: { player: Player; x: number; y: number } | null;
  viewExternalClub: Club | null;
  viewLeagueId: string | null;
  viewSquadType: SquadType;
  comparePlayerA: Player | null;
  comparePlayerB: Player | null;

  setGameState: (state: GameState) => void;
  setView: (view: string) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setSelectedPlayer: (p: Player | null) => void;
  setContextMenu: (cm: { player: Player; x: number; y: number } | null) => void;
  setViewExternalClub: (club: Club | null) => void;
  setViewLeagueId: (id: string | null) => void;
  setViewSquadType: (type: SquadType) => void;
  setComparePlayerA: (p: Player | null) => void;
  setComparePlayerB: (p: Player | null) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  gameState: 'LOADING',
  currentView: 'HOME',
  isSidebarOpen: false,
  selectedPlayer: null,
  contextMenu: null,
  viewExternalClub: null,
  viewLeagueId: null,
  viewSquadType: 'SENIOR',
  comparePlayerA: null,
  comparePlayerB: null,

  setGameState: (gameState) => set({ gameState }),
  setView: (currentView) => set({ currentView }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setSelectedPlayer: (selectedPlayer) => set({ selectedPlayer }),
  setContextMenu: (contextMenu) => set({ contextMenu }),
  setViewExternalClub: (viewExternalClub) => set({ viewExternalClub }),
  setViewLeagueId: (viewLeagueId) => set({ viewLeagueId }),
  setViewSquadType: (viewSquadType) => set({ viewSquadType }),
  setComparePlayerA: (comparePlayerA) => set({ comparePlayerA }),
  setComparePlayerB: (comparePlayerB) => set({ comparePlayerB }),
}));
