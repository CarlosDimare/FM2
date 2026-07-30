// Lazy-loaded data from open-football-database
// Data files are in public/data/ and fetched at runtime (not bundled)

let cachedClubs: any[] | null = null;
let cachedPlayers: any[] | null = null;
let cachedLeagues: any[] | null = null;

export async function loadConvertedClubs(): Promise<any[]> {
  if (cachedClubs) return cachedClubs;
  const resp = await fetch('data/convertedClubs.json');
  cachedClubs = await resp.json();
  return cachedClubs;
}

export async function loadConvertedPlayers(): Promise<any[]> {
  if (cachedPlayers) return cachedPlayers;
  const resp = await fetch('data/convertedPlayers.json');
  cachedPlayers = await resp.json();
  return cachedPlayers;
}

export async function loadConvertedLeagues(): Promise<any[]> {
  if (cachedLeagues) return cachedLeagues;
  const resp = await fetch('data/convertedLeagues.json');
  cachedLeagues = await resp.json();
  return cachedLeagues;
}
