// Lazy-loaded data from open-football-database
// Data files are in public/data/ and fetched at runtime (not bundled)

export async function loadConvertedClubs(): Promise<any[]> {
  const resp = await fetch('/data/convertedClubs.json');
  return resp.json();
}

export async function loadConvertedPlayers(): Promise<any[]> {
  const resp = await fetch('/data/convertedPlayers.json');
  return resp.json();
}

export async function loadConvertedLeagues(): Promise<any[]> {
  const resp = await fetch('/data/convertedLeagues.json');
  return resp.json();
}
