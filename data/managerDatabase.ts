import { RealManager, StaffAttributes } from '../types';
import { REAL_MANAGERS } from './static';
import wikidataSnapshot from './wikidataManagers.json';

interface WikidataManagerRecord {
  wikidataId: string;
  name: string;
  surname: string;
  nationality?: string;
  birthDate?: string;
}

interface WikidataManagerSnapshot {
  source: string;
  license: string;
  query: string;
  complete: boolean;
  cursor?: string;
  retrievedAt: string;
  recordCount: number;
  managers: WikidataManagerRecord[];
}

export interface ManagerDatabaseMeta {
  curatedCount: number;
  importedCount: number;
  totalCount: number;
  importedSource: string;
  importedLicense: string;
  importedComplete: boolean;
  importedRetrievedAt: string;
}

const snapshot = wikidataSnapshot as WikidataManagerSnapshot;

const normalizeName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]/g, '');

const defaultAttributes = (): StaffAttributes => ({
  coaching: 10,
  judgingAbility: 10,
  judgingPotential: 10,
  tacticalKnowledge: 10,
  adaptability: 10,
  medical: 3,
  physiotherapy: 3,
  motivation: 10,
  manManagement: 10,
});

const fallbackAge = (birthDate?: string) => {
  if (!birthDate) return 45;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return 45;
  return Math.max(18, new Date().getFullYear() - parsed.getFullYear());
};

const toImportedManager = (record: WikidataManagerRecord): RealManager => {
  const age = fallbackAge(record.birthDate);
  const birthDate = record.birthDate ? new Date(record.birthDate) : new Date(new Date().getFullYear() - age, 0, 1);
  return {
    id: `WD_${record.wikidataId}`,
    name: record.name,
    surname: record.surname,
    nationality: record.nationality || 'Internacional',
    age,
    birthDate,
    currentClubId: null,
    leagueId: '',
    attributes: defaultAttributes(),
    personality: 'CALM',
    reputation: 50,
    history: [],
    biography: 'Perfil importado desde Wikidata. Los datos tácticos y de club se pueden completar en futuras actualizaciones del snapshot.',
    preferredFormation: '4-3-3 Ofensiva',
    tacticalStyle: 'BALANCED',
    pressIntensity: 'MEDIUM',
    possessionVsCounter: 'BALANCED',
    playingStyle: 'Perfil táctico equilibrado',
    internationalReputation: 50,
    careerHonours: [],
    previousClubs: [],
    dataSource: 'WIKIDATA',
    wikidataId: record.wikidataId,
  };
};

const mergeManagers = (): RealManager[] => {
  const managersById = new Map<string, RealManager>();

  // Curated and Wikidata records remain separate entities. A shared name is
  // not enough evidence to merge two people; Wikidata QIDs are authoritative.
  for (const manager of REAL_MANAGERS) {
    const normalized = { ...manager, dataSource: 'CURATED' as const };
    managersById.set(normalized.id, normalized);
  }

  for (const record of snapshot.managers || []) {
    const manager = toImportedManager(record);
    if (!managersById.has(manager.id)) managersById.set(manager.id, manager);
  }

  return [...managersById.values()].sort((a, b) => {
    const reputationDelta = b.reputation - a.reputation;
    if (reputationDelta !== 0) return reputationDelta;
    return `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`, 'es');
  });
};

export const ALL_REAL_MANAGERS: RealManager[] = mergeManagers();

export const MANAGER_DATABASE_META: ManagerDatabaseMeta = {
  curatedCount: REAL_MANAGERS.length,
  importedCount: snapshot.managers?.length || 0,
  totalCount: ALL_REAL_MANAGERS.length,
  importedSource: snapshot.source,
  importedLicense: snapshot.license,
  importedComplete: snapshot.complete,
  importedRetrievedAt: snapshot.retrievedAt,
};
