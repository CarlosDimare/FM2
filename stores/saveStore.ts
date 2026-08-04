import { create } from 'zustand';
import { SaveMetadata } from '../services/utils';

interface SaveStore {
  hasSave: boolean;
  isSaveModalOpen: boolean;
  saveNameInput: string;
  isLoadModalOpen: boolean;
  availableSaves: SaveMetadata[];
  isAutoSaveEnabled: boolean;

  setHasSave: (has: boolean) => void;
  setIsSaveModalOpen: (open: boolean) => void;
  setSaveNameInput: (name: string) => void;
  setIsLoadModalOpen: (open: boolean) => void;
  setAvailableSaves: (saves: SaveMetadata[]) => void;
  setIsAutoSaveEnabled: (enabled: boolean) => void;
}

export const useSaveStore = create<SaveStore>((set) => ({
  hasSave: false,
  isSaveModalOpen: false,
  saveNameInput: '',
  isLoadModalOpen: false,
  availableSaves: [],
  isAutoSaveEnabled: false,

  setHasSave: (hasSave) => set({ hasSave }),
  setIsSaveModalOpen: (isSaveModalOpen) => set({ isSaveModalOpen }),
  setSaveNameInput: (saveNameInput) => set({ saveNameInput }),
  setIsLoadModalOpen: (isLoadModalOpen) => set({ isLoadModalOpen }),
  setAvailableSaves: (availableSaves) => set({ availableSaves }),
  setIsAutoSaveEnabled: (isAutoSaveEnabled) => set({ isAutoSaveEnabled }),
}));
