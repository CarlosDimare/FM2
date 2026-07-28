#!/usr/bin/env npx tsx
/**
 * convertDatabase.ts
 * Reads the open-football-database and generates TypeScript data files
 * for integration into the football manager game.
 * 
 * Usage: npx tsx scripts/convertDatabase.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_ROOT = '/tmp/open-football-database/data';
const OUTPUT_DIR = path.join(__dirname, '..', 'data');

// ─── Position Mapping (FM codes → our Position enum) ───────────────────────
const FM_POSITION_MAP: Record<string, string> = {
  'GK': 'P', 'DC': 'DFC', 'DR': 'LD', 'DL': 'LI',
  'DMR': 'CD', 'DML': 'CI', 'DM': 'MCD',
  'MC': 'MC', 'MR': 'MD', 'ML': 'MI',
  'AM': 'MPC', 'AMR': 'ED', 'AML': 'EI',
  'ST': 'DC', 'STR': 'WD', 'STL': 'WI',
  'SW': 'LIB',
  // FM sometimes uses these
  'WBR': 'LD', 'WBL': 'LI',
  'WB R': 'LD', 'WB L': 'LI',
  'D C': 'DFC', 'D R': 'LD', 'D L': 'LI',
  'M C': 'MC', 'M R': 'MD', 'M L': 'MI',
  'DM C': 'MCD', 'DM R': 'CD', 'DM L': 'CI',
  'AM C': 'MPC', 'AM R': 'ED', 'AM L': 'EI',
  'ST C': 'DC', 'ST R': 'WD', 'ST L': 'WI',
};

// ─── Document Position (for attribute ranges) ──────────────────────────────
type DocPosition = 'POR' | 'DEF' | 'LAT' | 'PIV' | 'MC' | 'EXT' | 'DEL';
type InternalAttr = 'velocidad' | 'resistencia' | 'fuerza' | 'control' | 'pase' | 'regate' | 'disparo' | 'anticipacion' | 'decision' | 'posicionamiento' | 'vision' | 'agresividad' | 'polivalencia';

function getDocPosition(ourPos: string): DocPosition {
  switch (ourPos) {
    case 'P': return 'POR';
    case 'DFC': case 'LIB': return 'DEF';
    case 'LI': case 'LD': case 'CI': case 'CD': return 'LAT';
    case 'MCD': return 'PIV';
    case 'MC': case 'MI': case 'MD': return 'MC';
    case 'MPC': case 'ED': case 'EI': return 'EXT';
    case 'DC': case 'WD': case 'WI': return 'DEL';
    default: return 'MC';
  }
}

// ─── Attribute Weights per Position ────────────────────────────────────────
// Each position has different attribute importance
const ATTR_WEIGHTS: Record<DocPosition, Record<InternalAttr, number>> = {
  POR: {
    velocidad: 0.5, resistencia: 0.6, fuerza: 0.7,
    control: 0.6, pase: 0.5, regate: 0.3, disparo: 0.3,
    anticipacion: 0.8, decision: 0.7, posicionamiento: 0.9,
    vision: 0.5, agresividad: 0.5, polivalencia: 0.3
  },
  DEF: {
    velocidad: 0.7, resistencia: 0.7, fuerza: 0.9,
    control: 0.5, pase: 0.6, regate: 0.4, disparo: 0.4,
    anticipacion: 0.9, decision: 0.8, posicionamiento: 0.9,
    vision: 0.5, agresividad: 0.8, polivalencia: 0.5
  },
  LAT: {
    velocidad: 0.9, resistencia: 0.9, fuerza: 0.6,
    control: 0.7, pase: 0.8, regate: 0.7, disparo: 0.5,
    anticipacion: 0.7, decision: 0.7, posicionamiento: 0.7,
    vision: 0.6, agresividad: 0.6, polivalencia: 0.6
  },
  PIV: {
    velocidad: 0.6, resistencia: 0.8, fuerza: 0.8,
    control: 0.7, pase: 0.8, regate: 0.4, disparo: 0.5,
    anticipacion: 0.8, decision: 0.8, posicionamiento: 0.8,
    vision: 0.6, agresividad: 0.8, polivalencia: 0.6
  },
  MC: {
    velocidad: 0.6, resistencia: 0.8, fuerza: 0.6,
    control: 0.8, pase: 0.9, regate: 0.7, disparo: 0.6,
    anticipacion: 0.7, decision: 0.9, posicionamiento: 0.7,
    vision: 0.9, agresividad: 0.5, polivalencia: 0.7
  },
  EXT: {
    velocidad: 0.9, resistencia: 0.7, fuerza: 0.5,
    control: 0.9, pase: 0.7, regate: 0.9, disparo: 0.8,
    anticipacion: 0.6, decision: 0.7, posicionamiento: 0.7,
    vision: 0.7, agresividad: 0.5, polivalencia: 0.6
  },
  DEL: {
    velocidad: 0.8, resistencia: 0.7, fuerza: 0.7,
    control: 0.8, pase: 0.6, regate: 0.8, disparo: 0.9,
    anticipacion: 0.7, decision: 0.8, posicionamiento: 0.9,
    vision: 0.6, agresividad: 0.6, polivalencia: 0.5
  }
};

// ─── Country Code to Name Map ──────────────────────────────────────────────
const COUNTRY_NAME_MAP: Record<string, string> = {
  'ar': 'Argentina', 'br': 'Brasil', 'uy': 'Uruguay', 'cl': 'Chile',
  'co': 'Colombia', 'ec': 'Ecuador', 'py': 'Paraguay', 'bo': 'Bolivia',
  'pe': 'Peru', 've': 'Venezuela', 'gb': 'Inglaterra', 'es': 'España',
  'de': 'Alemania', 'it': 'Italia', 'fr': 'Francia', 'pt': 'Portugal',
  'nl': 'Países Bajos', 'be': 'Bélgica', 'tr': 'Turquía', 'ru': 'Rusia',
  'us': 'USA', 'mx': 'México', 'jp': 'Japón', 'cn': 'China',
  'au': 'Australia', 'sa': 'Arabia Saudita', 'ae': 'Emiratos Árabes',
  'eg': 'Egipto', 'za': 'Sudáfrica', 'ng': 'Nigeria', 'gh': 'Ghana',
  'cm': 'Camerún', 'dz': 'Argelia', 'ma': 'Marruecos',
  'pl': 'Polonia', 'ua': 'Ucrania', 'hr': 'Croacia', 'rs': 'Serbia',
  'cz': 'República Checa', 'sk': 'Eslovaquia', 'si': 'Eslovenia',
  'bg': 'Bulgaria', 'ro': 'Rumanía', 'gr': 'Grecia', 'at': 'Austria',
  'ch': 'Suiza', 'dk': 'Dinamarca', 'se': 'Suecia', 'no': 'Noruega',
  'fi': 'Finlandia', 'is': 'Islandia', 'ie': 'Irlanda', 'cy': 'Chipre',
  'mt': 'Malta', 'ee': 'Estonia', 'lv': 'Letonia', 'lt': 'Lituania',
  'ge': 'Georgia', 'am': 'Armenia', 'az': 'Azerbaiyán', 'kz': 'Kazajistán',
  'uz': 'Uzbekistán', 'id': 'Indonesia', 'kr': 'Corea del Sur',
  'ir': 'Irán', 'iq': 'Irak', 'il': 'Israel',
  'al': 'Albania', 'ba': 'Bosnia', 'by': 'Bielorrusia', 'mk': 'Macedonia',
  'me': 'Montenegro', 'xk': 'Kosovo',
};

// ─── League to Our Competition ID Map ──────────────────────────────────────
interface LeagueMapping {
  leagueSlug: string;
  countryCode: string;
  competitionId: string;
  tier: number;
  playable: boolean;
}

const LEAGUE_MAPPINGS: LeagueMapping[] = [
  // PLAYABLE - Top Leagues
  { leagueSlug: 'premier-league', countryCode: 'gb', competitionId: 'L_ENG_1', tier: 1, playable: true },
  { leagueSlug: 'championship', countryCode: 'gb', competitionId: 'L_ENG_2', tier: 2, playable: true },
  { leagueSlug: 'spanish-first-division', countryCode: 'es', competitionId: 'L_ESP_1', tier: 1, playable: true },
  { leagueSlug: 'spanish-second-division', countryCode: 'es', competitionId: 'L_ESP_2', tier: 2, playable: true },
  { leagueSlug: 'italian-serie-a', countryCode: 'it', competitionId: 'L_ITA_1', tier: 1, playable: true },
  { leagueSlug: 'italian-serie-b', countryCode: 'it', competitionId: 'L_ITA_2', tier: 2, playable: true },
  { leagueSlug: 'bundesliga', countryCode: 'de', competitionId: 'L_DEU_1', tier: 1, playable: true },
  { leagueSlug: 'ligue-1', countryCode: 'fr', competitionId: 'L_FRA_1', tier: 1, playable: true },
  { leagueSlug: 'ligue-2', countryCode: 'fr', competitionId: 'L_FRA_2', tier: 2, playable: true },
  { leagueSlug: 'eredivisie', countryCode: 'nl', competitionId: 'L_NLD_1', tier: 1, playable: true },
  { leagueSlug: 'belgian-pro-league', countryCode: 'be', competitionId: 'L_BEL_1', tier: 1, playable: true },
  { leagueSlug: 'portuguese-primeira-liga', countryCode: 'pt', competitionId: 'L_PRT_1', tier: 1, playable: true },
  { leagueSlug: 'turkish-super-league', countryCode: 'tr', competitionId: 'L_TUR_1', tier: 1, playable: true },
  // PLAYABLE - South America
  { leagueSlug: 'argentine-premier-division-zona-a', countryCode: 'ar', competitionId: 'L_ARG_1', tier: 1, playable: true },
  { leagueSlug: 'argentine-primera-nacional-zona-a', countryCode: 'ar', competitionId: 'L_ARG_2', tier: 2, playable: true },
  { leagueSlug: 'brazilian-serie-a', countryCode: 'br', competitionId: 'L_BRA_1', tier: 1, playable: true },
  { leagueSlug: 'brazilian-serie-b', countryCode: 'br', competitionId: 'L_BRA_2', tier: 2, playable: true },
  { leagueSlug: 'chilean-primera-division', countryCode: 'cl', competitionId: 'L_CHI_1', tier: 1, playable: true },
  { leagueSlug: 'colombian-first-division', countryCode: 'co', competitionId: 'L_COL_1', tier: 1, playable: true },
  { leagueSlug: 'uruguayan-first-division', countryCode: 'uy', competitionId: 'L_URY_1', tier: 1, playable: true },
  // BACKGROUND - For national team & continental cups data
  { leagueSlug: 'russian-premier-league', countryCode: 'ru', competitionId: 'L_RUS_1', tier: 1, playable: false },
  { leagueSlug: 'russian-first-league', countryCode: 'ru', competitionId: 'L_RUS_2', tier: 2, playable: false },
  { leagueSlug: 'ukrainian-premier-league', countryCode: 'ua', competitionId: 'L_UKR_1', tier: 1, playable: false },
  { leagueSlug: 'croatian-first-league', countryCode: 'hr', competitionId: 'L_CRO_1', tier: 1, playable: false },
  { leagueSlug: 'greek-super-league', countryCode: 'gr', competitionId: 'L_GRE_1', tier: 1, playable: false },
  { leagueSlug: 'austrian-bundesliga', countryCode: 'at', competitionId: 'L_AUT_1', tier: 1, playable: false },
  { leagueSlug: 'swiss-super-league', countryCode: 'ch', competitionId: 'L_CHE_1', tier: 1, playable: false },
  { leagueSlug: 'danish-superliga', countryCode: 'dk', competitionId: 'L_DEN_1', tier: 1, playable: false },
  { leagueSlug: 'allsvenskan', countryCode: 'se', competitionId: 'L_SWE_1', tier: 1, playable: false },
  { leagueSlug: 'eliteserien', countryCode: 'no', competitionId: 'L_NOR_1', tier: 1, playable: false },
  { leagueSlug: 'ekstraklasa', countryCode: 'pl', competitionId: 'L_POL_1', tier: 1, playable: false },
  { leagueSlug: 'j-league', countryCode: 'jp', competitionId: 'L_JPN_1', tier: 1, playable: false },
  { leagueSlug: 'major-league-soccer-eastern', countryCode: 'us', competitionId: 'L_USA_1', tier: 1, playable: false },
  { leagueSlug: 'major-league-soccer-western', countryCode: 'us', competitionId: 'L_USA_2', tier: 1, playable: false },
  { leagueSlug: 'liga-mx', countryCode: 'mx', competitionId: 'L_MEX_1', tier: 1, playable: false },
  { leagueSlug: 'saudi-professional-league', countryCode: 'sa', competitionId: 'L_SAU_1', tier: 1, playable: false },
];

// ─── Helper: clamp ─────────────────────────────────────────────────────────
function clamp(v: number, min = 1, max = 20): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ─── CA → Internal Attributes Conversion ───────────────────────────────────
function caToAttributes(ca: number, primaryPos: string): Record<InternalAttr, number> {
  const docPos = getDocPosition(primaryPos);
  const weights = ATTR_WEIGHTS[docPos];
  const base = ca / 10; // CA 200 → 20, CA 100 → 10
  
  const attrs: Record<InternalAttr, number> = {} as any;
  for (const [attr, weight] of Object.entries(weights) as [InternalAttr, number][]) {
    // Apply weight to base CA value
    // High weight = attribute closer to CA base
    // Low weight = attribute lower than CA base
    const raw = base * weight + (1 - weight) * (base * 0.7);
    // Add some controlled randomness
    const jitter = (Math.random() - 0.5) * 2;
    attrs[attr] = clamp(raw + jitter);
  }
  
  return attrs;
}

// ─── Read all leagues and clubs ────────────────────────────────────────────
interface RawClub {
  id: number;
  name: string;
  slug: string;
  colors: { background: string; foreground: string };
  teams: { id: number; name: string; slug: string; team_type: string; reputation: { home: number; national: number; world: number } }[];
  finance?: { balance: number };
  facilities?: any;
  average_attendance?: number;
  country_code?: string;
  league_id?: number;
}

interface RawPlayer {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  country_id: number;
  club_id: number;
  positions: { code: string; level: number }[];
  foots?: { left: number; right: number };
  current_ability: number;
  potential_ability: number;
  value: number;
  contract?: { salary: number; expiration: string };
  history?: { s: number; c: number; p: number; g?: number }[];
}

function readJson(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Main Conversion ───────────────────────────────────────────────────────
async function convert() {
  console.log('🔄 Starting database conversion...\n');
  
  // 1. Read countries
  const countries = readJson(path.join(DB_ROOT, 'countries.json'));
  const countryMap: Record<number, any> = {};
  for (const c of countries) {
    countryMap[c.id] = c;
  }
  console.log(`✅ Loaded ${countries.length} countries`);

  // 2. Read all clubs and players
  const allClubs: any[] = [];
  const allPlayers: any[] = [];
  const leagueData: any[] = [];
  const clubIdToLeagueId: Record<number, string> = {};
  
  for (const mapping of LEAGUE_MAPPINGS) {
    const leaguePath = path.join(DB_ROOT, mapping.countryCode, mapping.leagueSlug);
    if (!fs.existsSync(leaguePath)) {
      console.log(`⚠️  League not found: ${mapping.leagueSlug} (${mapping.countryCode})`);
      continue;
    }
    
    // Read league metadata
    const leagueJson = readJson(path.join(leaguePath, 'league.json'));
    if (!leagueJson) continue;
    
    leagueData.push({
      id: mapping.competitionId,
      name: leagueJson.name,
      country: COUNTRY_NAME_MAP[mapping.countryCode] || mapping.countryCode,
      tier: mapping.tier,
      reputation: leagueJson.reputation,
      promotion_spots: leagueJson.promotion_spots || 0,
      relegation_spots: leagueJson.relegation_spots || 0,
      playable: mapping.playable,
    });
    
    // Read clubs in this league
    const entries = fs.readdirSync(leaguePath);
    let clubCount = 0;
    let playerCount = 0;
    
    for (const entry of entries) {
      const clubPath = path.join(leaguePath, entry);
      if (!fs.statSync(clubPath).isDirectory()) continue;
      
      const clubJson = readJson(path.join(clubPath, 'club.json'));
      if (!clubJson) continue;
      
      const mainTeam = clubJson.teams?.find((t: any) => t.team_type === 'Main');
      if (!mainTeam) continue;
      
      const bg = clubJson.colors?.background || '#ffffff';
      const fg = clubJson.colors?.foreground || '#000000';
      
      const club = {
        id: clubJson.id,
        name: clubJson.name,
        slug: entry,
        shortName: clubJson.name.substring(0, 3).toUpperCase(),
        primaryColor: bg,
        secondaryColor: fg,
        reputation: mainTeam.reputation?.national || mainTeam.reputation?.home || 5000,
        country: COUNTRY_NAME_MAP[mapping.countryCode] || mapping.countryCode,
        countryCode: mapping.countryCode,
        competitionId: mapping.competitionId,
        playable: mapping.playable,
        average_attendance: clubJson.average_attendance || 0,
        facilities: clubJson.facilities || {},
      };
      
      allClubs.push(club);
      clubIdToLeagueId[clubJson.id] = mapping.competitionId;
      clubCount++;
      
      // Read players for this club
      const playersDir = path.join(clubPath, 'players');
      if (fs.existsSync(playersDir)) {
        const playerFiles = fs.readdirSync(playersDir);
        for (const pf of playerFiles) {
          if (!pf.endsWith('.json')) continue;
          const playerJson = readJson(path.join(playersDir, pf));
          if (!playerJson) continue;
          
          allPlayers.push({
            ...playerJson,
            league_country: mapping.countryCode,
            club_reputation: club.reputation,
          });
          playerCount++;
        }
      }
    }
    
    console.log(`  ✅ ${mapping.competitionId}: ${clubCount} clubs, ${playerCount} players`);
  }
  
  console.log(`\n📊 Total: ${allClubs.length} clubs, ${allPlayers.length} players`);
  
  // 3. Convert players to our format
  const convertedPlayers: any[] = [];
  
  for (const p of allPlayers) {
    // Get primary position
    const primaryPos = p.positions?.[0];
    if (!primaryPos) continue;
    
    const ourPos = FM_POSITION_MAP[primaryPos.code] || 'MC';
    
    // Calculate age from birth date
    const birthDate = new Date(p.birth_date);
    const seasonYear = 2026;
    const age = seasonYear - birthDate.getFullYear();
    
    // Skip players that are too old (>42) or too young (<16)
    if (age < 16 || age > 42) continue;
    
    // Get country name
    const countryData = countryMap[p.country_id];
    const nationality = countryData?.name || 'Unknown';
    
    // Convert CA/PA to attributes
    const internal = caToAttributes(p.current_ability, ourPos);
    
    // Calculate visible from internal
    const visible = {
      fisico: clamp((internal.velocidad + internal.resistencia + internal.fuerza) / 3),
      mental: clamp((internal.anticipacion + internal.decision + internal.posicionamiento + internal.vision) / 4),
      tecnica: clamp((internal.control + internal.pase + internal.regate + internal.disparo) / 4),
      agresividad: internal.agresividad,
      polivalencia: internal.polivalencia,
    };
    
    // Get secondary positions
    const allPositions = [ourPos];
    for (let i = 1; i < p.positions.length; i++) {
      const secPos = FM_POSITION_MAP[p.positions[i].code];
      if (secPos && !allPositions.includes(secPos)) {
        allPositions.push(secPos);
      }
    }
    
    convertedPlayers.push({
      id: String(p.id),
      name: p.first_name + (p.last_name ? ' ' + p.last_name : ''),
      firstName: p.first_name,
      lastName: p.last_name || '',
      birthDate: p.birth_date,
      age,
      nationality,
      countryId: p.country_id,
      clubId: String(p.club_id),
      positions: allPositions,
      primaryPosition: ourPos,
      stats: {
        internal,
        visible,
      },
      ca: p.current_ability,
      pa: p.potential_ability,
      value: p.value || 0,
      salary: p.contract?.salary || 0,
      contractExpiry: p.contract?.expiration || '2027-06-30',
      height: 175 + Math.floor(Math.random() * 20), // Approximate
      weight: 70 + Math.floor(Math.random() * 15),
      history: p.history || [],
    });
  }
  
  console.log(`✅ Converted ${convertedPlayers.length} players\n`);
  
  // 4. Write output files
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Write clubs
  const clubsPath = path.join(OUTPUT_DIR, 'convertedClubs.json');
  fs.writeFileSync(clubsPath, JSON.stringify(allClubs));
  console.log(`📝 Written ${clubsPath} (${(fs.statSync(clubsPath).size / 1024).toFixed(0)}KB)`);
  
  // Write players
  const playersPath = path.join(OUTPUT_DIR, 'convertedPlayers.json');
  fs.writeFileSync(playersPath, JSON.stringify(convertedPlayers));
  console.log(`📝 Written ${playersPath} (${(fs.statSync(playersPath).size / 1024 / 1024).toFixed(1)}MB)`);
  
  // Write leagues
  const leaguesPath = path.join(OUTPUT_DIR, 'convertedLeagues.json');
  fs.writeFileSync(leaguesPath, JSON.stringify(leagueData));
  console.log(`📝 Written ${leaguesPath} (${(fs.statSync(leaguesPath).size / 1024).toFixed(0)}KB)`);
  
  // Also write TS modules for type safety
  const clubsTsPath = path.join(OUTPUT_DIR, 'convertedClubs.ts');
  let clubsContent = '// Auto-generated by convertDatabase.ts\n';
  clubsContent += '// Do not edit manually - run: npx tsx scripts/convertDatabase.ts\n\n';
  clubsContent += `import data from './convertedClubs.json';\n`;
  clubsContent += `export const CONVERTED_CLUBS = data as any[];\n`;
  fs.writeFileSync(clubsTsPath, clubsContent);
  console.log(`📝 Written ${clubsTsPath}`);
  
  const playersTsPath = path.join(OUTPUT_DIR, 'convertedPlayers.ts');
  let playersContent = '// Auto-generated by convertDatabase.ts\n';
  playersContent += '// Do not edit manually - run: npx tsx scripts/convertDatabase.ts\n\n';
  playersContent += `import data from './convertedPlayers.json';\n`;
  playersContent += `export const CONVERTED_PLAYERS = data as any[];\n`;
  fs.writeFileSync(playersTsPath, playersContent);
  console.log(`📝 Written ${playersTsPath}`);
  
  const leaguesTsPath = path.join(OUTPUT_DIR, 'convertedLeagues.ts');
  let leaguesContent = '// Auto-generated by convertDatabase.ts\n';
  leaguesContent += '// Do not edit manually - run: npx tsx scripts/convertDatabase.ts\n\n';
  leaguesContent += `import data from './convertedLeagues.json';\n`;
  leaguesContent += `export const CONVERTED_LEAGUES = data as any[];\n`;
  fs.writeFileSync(leaguesTsPath, leaguesContent);
  console.log(`📝 Written ${leaguesTsPath}`);
  
  // Write summary
  console.log('\n🎉 Conversion complete!');
  console.log(`   Clubs: ${allClubs.length}`);
  console.log(`   Players: ${convertedPlayers.length}`);
  console.log(`   Leagues: ${leagueData.length}`);
}

convert().catch(console.error);
