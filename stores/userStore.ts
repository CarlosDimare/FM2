import { create } from 'zustand';
import { Club, ManagerOrigin, RealManager, CareerMode } from '../types';

interface UserStore {
  userName: string;
  userSurname: string;
  userNationality: string;
  userOrigin: ManagerOrigin;
  userBirthDate: Date;
  selectedCountry: string | null;
  selectedLeague: any | null;
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  selectedExistingManager: RealManager | null;

  setUserName: (name: string) => void;
  setUserSurname: (surname: string) => void;
  setUserNationality: (nat: string) => void;
  setUserOrigin: (origin: ManagerOrigin) => void;
  setUserBirthDate: (date: Date) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedLeague: (league: any | null) => void;
  setUserClub: (club: Club | null) => void;
  setSelectedNationalTeamId: (id: string | null) => void;
  setCareerMode: (mode: CareerMode) => void;
  setSelectedExistingManager: (m: RealManager | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userName: 'Manager',
  userSurname: 'Novato',
  userNationality: 'Argentina',
  userOrigin: 'EX_PLAYER',
  userBirthDate: new Date(1985, 5, 15),
  selectedCountry: null,
  selectedLeague: null,
  userClub: null,
  selectedNationalTeamId: null,
  careerMode: 'CLUB',
  selectedExistingManager: null,

  setUserName: (userName) => set({ userName }),
  setUserSurname: (userSurname) => set({ userSurname }),
  setUserNationality: (userNationality) => set({ userNationality }),
  setUserOrigin: (userOrigin) => set({ userOrigin }),
  setUserBirthDate: (userBirthDate) => set({ userBirthDate }),
  setSelectedCountry: (selectedCountry) => set({ selectedCountry }),
  setSelectedLeague: (selectedLeague) => set({ selectedLeague }),
  setUserClub: (userClub) => set({ userClub }),
  setSelectedNationalTeamId: (selectedNationalTeamId) => set({ selectedNationalTeamId }),
  setCareerMode: (careerMode) => set({ careerMode }),
  setSelectedExistingManager: (selectedExistingManager) => set({ selectedExistingManager }),
}));
