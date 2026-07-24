import { create } from 'zustand';
import { world } from '../services/worldManager';
import { Player, Club, Competition, Staff, Tactic, TransferOffer, InboxMessage, Fixture, SquadType, TableEntry } from '../types';

type DirtyFlags = {
  players?: boolean;
  clubs?: boolean;
  competitions?: boolean;
  staff?: boolean;
  tactics?: boolean;
  offers?: boolean;
  inbox?: boolean;
};

interface WorldStore {
  _tick: number;
  players: Player[];
  clubs: Club[];
  competitions: Competition[];
  staff: Staff[];
  tactics: Tactic[];
  offers: TransferOffer[];
  inbox: InboxMessage[];

  notify: (dirty?: DirtyFlags) => void;
  getClub: (id: string) => Club | undefined;
  getPlayersByClub: (clubId: string) => Player[];
  getStaffByClub: (clubId: string) => Staff[];
  getClubsByLeague: (leagueId: string) => Club[];
  getLeagues: () => Competition[];
  getTactics: () => Tactic[];
  getLeagueTable: (compId: string, fixtures: Fixture[], squadType: SquadType, groupId?: number) => TableEntry[];
}

const ALL_DIRTY: DirtyFlags = {
  players: true, clubs: true, competitions: true,
  staff: true, tactics: true, offers: true, inbox: true,
};

export const useWorldStore = create<WorldStore>((set, get) => ({
  _tick: 0,
  players: world.players,
  clubs: world.clubs,
  competitions: world.competitions,
  staff: world.staff,
  tactics: world.tactics,
  offers: world.offers,
  inbox: world.inbox,

  notify: (dirty?: DirtyFlags) => {
    const d = dirty || ALL_DIRTY;
    const patch: any = { _tick: get()._tick + 1 };
    if (d.players) patch.players = [...world.players];
    if (d.clubs) patch.clubs = [...world.clubs];
    if (d.competitions) patch.competitions = [...world.competitions];
    if (d.staff) patch.staff = [...world.staff];
    if (d.tactics) patch.tactics = [...world.tactics];
    if (d.offers) patch.offers = [...world.offers];
    if (d.inbox) patch.inbox = [...world.inbox];
    set(patch);
  },

  getClub: (id: string) => world.getClub(id),
  getPlayersByClub: (clubId: string) => world.getPlayersByClub(clubId),
  getStaffByClub: (clubId: string) => world.getStaffByClub(clubId),
  getClubsByLeague: (leagueId: string) => world.getClubsByLeague(leagueId),
  getLeagues: () => world.getLeagues(),
  getTactics: () => world.getTactics(),
  getLeagueTable: (compId, fixtures, squadType, groupId) => world.getLeagueTable(compId, fixtures, squadType, groupId),
}));

export const notifyPlayers = () => useWorldStore.getState().notify({ players: true });
export const notifyClubs = () => useWorldStore.getState().notify({ clubs: true });
export const notifyInbox = () => useWorldStore.getState().notify({ inbox: true });
export const notifyOffers = () => useWorldStore.getState().notify({ offers: true });
export const notifyTactics = () => useWorldStore.getState().notify({ tactics: true });
export const notifyAll = () => useWorldStore.getState().notify();
