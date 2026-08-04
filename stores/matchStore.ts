import { create } from 'zustand';
import { CompetitionSummary } from '../components/SeasonSummaryModal';

interface MatchStore {
  currentDate: Date;
  seasonEndDate: Date;
  isSimulating: boolean;
  isInVacation: boolean;
  isVacationModalOpen: boolean;
  vacationTargetDate: string;
  vacationProgress: number;
  vacationDetail: string;
  vacationCancelled: boolean;
  simProgress: number;
  simProgressDetail: string;
  seasonSummary: CompetitionSummary[] | null;
  userWonLeague: boolean;

  setCurrentDate: (date: Date) => void;
  setSeasonEndDate: (date: Date) => void;
  setIsSimulating: (sim: boolean) => void;
  setIsInVacation: (inVacation: boolean) => void;
  setIsVacationModalOpen: (open: boolean) => void;
  setVacationTargetDate: (date: string) => void;
  setVacationProgress: (progress: number) => void;
  setVacationDetail: (detail: string) => void;
  setVacationCancelled: (cancelled: boolean) => void;
  setSimProgress: (progress: number) => void;
  setSimProgressDetail: (detail: string) => void;
  resetVacationState: () => void;
  setSeasonSummary: (summary: CompetitionSummary[] | null) => void;
  setUserWonLeague: (won: boolean) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
  currentDate: new Date(2008, 7, 16),
  seasonEndDate: new Date(2009, 6, 10),
  isSimulating: false,
  isInVacation: false,
  vacationTargetDate: '',
  vacationProgress: 0,
  vacationDetail: '',
  vacationCancelled: false,
  isVacationModalOpen: false,
  simProgress: 0,
  simProgressDetail: '',
  seasonSummary: null,
  userWonLeague: false,

  setCurrentDate: (currentDate) => set({ currentDate }),
  setSeasonEndDate: (seasonEndDate) => set({ seasonEndDate }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
  setIsInVacation: (isInVacation) => set({ isInVacation }),
  setVacationTargetDate: (vacationTargetDate) => set({ vacationTargetDate }),
  setVacationProgress: (progress) => set({ vacationProgress: progress }),
  setVacationDetail: (detail) => set({ vacationDetail: detail }),
  setVacationCancelled: (cancelled) => set({ vacationCancelled: cancelled }),
  setIsVacationModalOpen: (isVacationModalOpen) => set({ isVacationModalOpen }),
  setSimProgress: (simProgress) => set({ simProgress }),
  setSimProgressDetail: (simProgressDetail) => set({ simProgressDetail }),
  resetVacationState: () => set({ vacationProgress: 0, vacationDetail: '', vacationCancelled: false }),
  setSeasonSummary: (seasonSummary) => set({ seasonSummary }),
  setUserWonLeague: (userWonLeague) => set({ userWonLeague }),
}));
