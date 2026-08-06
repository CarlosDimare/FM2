import { Club, Fixture, CareerMode } from '../types';
import { world } from './worldManager';
import { saveGame, loadGame, checkSaveExists, listSaves, deleteSave, generateUUID, randomInt } from './utils';
import { LeagueEngine } from './leagueEngine';
import { useGameStore } from '../stores/gameStore';

// ─── Save/Load Data Interfaces ───────────────────────────────────────────────

export interface SaveData {
  id: string;
  label: string;
  lastPlayed: Date;
  metaTeamName: string;
  metaManagerName: string;
  gameState: {
    currentDate: Date;
    userName: string;
    userSurname: string;
    userClubId: string | null;
    selectedNationalTeamId: string | null;
    careerMode: CareerMode;
    fixtures: Fixture[];
    seasonEndDate: Date;
    deepSimLeagues: string[];
    managerHistory: any;
    managerReputation: number;
    darkMode: boolean;
  };
  worldState: {
    players: any[];
    clubs: any[];
    competitions: any[];
    staff: any[];
    tactics: any[];
    offers: any[];
    inbox: any[];
    scoutingReports: any[];
    chronicles: any[];
    interactionLog: any[];
    activeReputationalBuffs: any[];
    relationshipWeb: any;
    mediaNews: any[];
    managerProfile: any;
    nationalTeamManager: any;
    seasonHistory: any[];
  };
}

export interface SaveMetadata {
  id: string;
  label: string;
  date: string;
  teamName: string;
  managerName?: string;
}

// ─── Build save data from current state ──────────────────────────────────────

export function buildSaveData(params: {
  id: string;
  label: string;
  currentDate: Date;
  userName: string;
  userSurname: string;
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  fixtures: Fixture[];
  seasonEndDate: Date;
}): SaveData {
  const { id, label, currentDate, userName, userSurname, userClub, selectedNationalTeamId, careerMode, fixtures, seasonEndDate } = params;
  const managedName = userClub?.name || world.nationalTeamManager?.nationalTeams?.find((team: any) => team.id === selectedNationalTeamId)?.name || 'Selección Nacional';

  return {
    id,
    label,
    lastPlayed: new Date(),
    metaTeamName: managedName,
    metaManagerName: `${userName} ${userSurname}`,
    gameState: {
      currentDate,
      userName,
      userSurname,
      userClubId: userClub?.id || null,
      selectedNationalTeamId,
      careerMode,
      fixtures,
      seasonEndDate,
      deepSimLeagues: useGameStore.getState().deepSimLeagues,
      managerHistory: useGameStore.getState().managerHistory,
      managerReputation: useGameStore.getState().managerReputation,
      darkMode: useGameStore.getState().darkMode,
    },
    worldState: {
      players: world.players,
      clubs: world.clubs,
      competitions: world.competitions,
      staff: world.staff,
      tactics: world.tactics,
      offers: world.offers,
      inbox: world.inbox,
      scoutingReports: world.scoutingReports,
      chronicles: world.chronicles,
      interactionLog: world.interactionLog,
      activeReputationalBuffs: world.activeReputationalBuffs,
      relationshipWeb: world.relationshipWeb,
      mediaNews: world.mediaNews,
      managerProfile: world.managerProfile,
      nationalTeamManager: world.nationalTeamManager,
      seasonHistory: world.seasonHistory,
    },
  };
}

// ─── Auto-save ───────────────────────────────────────────────────────────────

export async function performAutoSave(params: {
  currentDate: Date;
  userName: string;
  userSurname: string;
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  fixtures: Fixture[];
  seasonEndDate: Date;
  isAutoSaveEnabled: boolean;
}): Promise<boolean> {
  if (!params.isAutoSaveEnabled) return false;
  try {
    const id = `autosave_${params.currentDate.toISOString().slice(0, 10)}`;
    const saveData = buildSaveData({
      id,
      label: `Auto: ${params.currentDate.toLocaleDateString()}`,
      ...params,
    });
    await saveGame(saveData);
    return true;
  } catch (e) {
    console.error('Auto-save failed:', e);
    return false;
  }
}

// ─── Manual save ─────────────────────────────────────────────────────────────

export async function manualSave(params: {
  saveNameInput: string;
  currentDate: Date;
  userName: string;
  userSurname: string;
  userClub: Club | null;
  selectedNationalTeamId: string | null;
  careerMode: CareerMode;
  fixtures: Fixture[];
  seasonEndDate: Date;
}): Promise<void> {
  if (!params.saveNameInput.trim()) return;
  const id = generateUUID();
  const saveData = buildSaveData({
    id,
    label: params.saveNameInput,
    ...params,
  });
  await saveGame(saveData);
}

// ─── Load game ───────────────────────────────────────────────────────────────

export interface LoadResult {
  gameState: any;
  worldState: any;
}

/** Migra saves creados antes de la separación notificaciones/noticias:
 *  - Inbox sin `priority` → INFO; sin `actionRequired` → false.
 *  - MediaNews sin `section` → derivada de la antigua `category`. */
/** Migra planteles rotos de saves previos: antes todos los jugadores convertidos quedaban en SENIOR
 *  y RESERVA/SUB-20 quedaban vacíos (generateSquadsForClub se saltaba para clubes con >=14 jugadores).
 *  Se redistribuye por edad y se completan los planteles. */
export function migrateSquadDistribution(): void {
  let needsFix = false;
  world.clubs.forEach((club: any) => {
    const squad = world.players.filter((p: any) => p.clubId === club.id);
    const senior = squad.filter((p: any) => p.squad === 'SENIOR');
    const reserve = squad.filter((p: any) => p.squad === 'RESERVE');
    const u20 = squad.filter((p: any) => p.squad === 'U20');
    // Estado roto típico: plantel volcado en SENIOR y reserva/sub-20 sin jugadores
    if (reserve.length === 0 && u20.length === 0 && senior.length >= 14) {
      senior.forEach((p: any) => {
        if (p.age >= 23) return;
        // Respetar a los titulares: si el usuario lo puso en el once, no se lo movemos
        if (p.isStarter) return;
        p.squad = p.age >= 20 ? 'RESERVE' : 'U20';
        p.isStarter = false;
        p.tacticalPosition = undefined;
        needsFix = true;
      });
    }
  });
  if (needsFix) {
    world.markPlayersDirty();
    world.clubs.forEach((club: any) => world.generateSquadsForClub(club.id));
  }
}

export function migrateInboxAndNews(): void {
  world.inbox.forEach((m: any) => {
    if (!m.priority) m.priority = 'INFO';
    if (m.actionRequired === undefined) m.actionRequired = false;
  });
  world.mediaNews.forEach((n: any) => {
    if (!n.section) {
      const legacy = (n.category || '') as string;
      n.section =
        legacy === 'MATCH' ? 'RESULTADOS'
        : legacy === 'TRANSFER' ? 'MERCADO'
        : legacy === 'INJURY' ? 'LESIONES'
        : legacy === 'BOARD' ? 'CLASIFICACION'
        : 'INTERNACIONAL';
    }
    if (n.featured === undefined) n.featured = false;
  });
}

export async function loadGameData(id: string): Promise<LoadResult | null> {
  const data = await loadGame(id);
  if (!data) return null;
  return data;
}

export function applyWorldState(worldState: any): void {
  world.players = worldState.players;
  world.clubs = worldState.clubs;
  world.competitions = worldState.competitions;
  world.staff = worldState.staff;
  world.tactics = worldState.tactics;
  world.offers = worldState.offers;
  world.inbox = worldState.inbox;
  if (worldState.scoutingReports) world.scoutingReports = worldState.scoutingReports;
  world.interactionLog = worldState.interactionLog || [];
  world.activeReputationalBuffs = worldState.activeReputationalBuffs || [];
  world.relationshipWeb = worldState.relationshipWeb || {};
  world.mediaNews = worldState.mediaNews || [];

  // Migración notificaciones vs noticias (saves previos a la separación)
  migrateInboxAndNews();
  // Migración de planteles rotos (todos los jugadores en SENIOR, reserva/sub-20 vacíos)
  migrateSquadDistribution();

  // Migrate player fields
  world.players.forEach((p: any) => {
    if (!p.relationships) p.relationships = {};
    if (!p.injuryHistory) p.injuryHistory = [];
    if (p.tacticalFamiliarity === undefined) p.tacticalFamiliarity = 50;
    if (p.leadership === undefined) p.leadership = randomInt(5, 20);
    if (p.consistency === undefined) p.consistency = randomInt(5, 20);
    if (p.bigMatchTemperament === undefined) p.bigMatchTemperament = randomInt(5, 20);
  });

  // Migrate staff fields
  world.staff.forEach((s: any) => {
    if (!s.relationships) s.relationships = {};
    if (s.personality === undefined) s.personality = ['LEADER', 'PASSIONATE', 'CALM', 'DISCIPLINARIAN', 'VISIONARY'][Math.floor(Math.random() * 5)];
    if (s.morale === undefined) s.morale = 70;
    if (s.reputation === undefined) s.reputation = 50;
    if (s.pressReputation === undefined) s.pressReputation = 50;
    if (s.boardRelationship === undefined) s.boardRelationship = 60;
  });

  // Migrate competition fields
  world.competitions.forEach((c: any) => {
    if (c.continent === undefined) c.continent = 'América del Sur';
    if (c.confederation === undefined) c.confederation = 'CONMEBOL';
    if (c.defaultPrizePool === undefined) c.defaultPrizePool = 1000000;
    if (c.continentalSlots === undefined) c.continentalSlots = 4;
  });

  if (!world.interactionLog) world.interactionLog = [];
  if (!world.activeReputationalBuffs) world.activeReputationalBuffs = [];
  if (!world.relationshipWeb) world.relationshipWeb = {};
  if (!world.mediaNews) world.mediaNews = [];
  world.seasonHistory = worldState.seasonHistory || [];
  if (worldState.chronicles) world.chronicles = worldState.chronicles;
  else world.chronicles = [];
  if (worldState.managerProfile) world.managerProfile = worldState.managerProfile;
  else world.managerProfile = null;
}

export async function restoreNationalTeamManager(worldState: any): Promise<void> {
  const { NationalTeamManager } = await import('./nationalTeamManager');
  if (worldState.nationalTeamManager) {
    world.nationalTeamManager = new NationalTeamManager();
    Object.assign(world.nationalTeamManager, worldState.nationalTeamManager);
    world.nationalTeamManager.assignPlayersToNationalTeams(world.players, world.clubs);
    world.nationalTeamManager.validateControlledState(world.players, world.clubs);
  } else {
    world.nationalTeamManager = new NationalTeamManager();
    world.nationalTeamManager.assignPlayersToNationalTeams(world.players, world.clubs);
    world.nationalTeamManager.validateControlledState(world.players, world.clubs);
  }
}

export function resolveDeepLeagues(userClubId: string | null, savedDeepLeagues: string[]): string[] {
  const savedUserLeague = world.getClub(userClubId)?.leagueId;
  const effectiveDeepLeagues = Array.isArray(savedDeepLeagues) && savedDeepLeagues.length > 0
    ? savedDeepLeagues
    : (savedUserLeague ? [savedUserLeague] : []);
  return LeagueEngine.resolveDeepLeagueIds(savedUserLeague, world.competitions, effectiveDeepLeagues);
}

// ─── List/delete saves ───────────────────────────────────────────────────────

export { listSaves, deleteSave, checkSaveExists };
