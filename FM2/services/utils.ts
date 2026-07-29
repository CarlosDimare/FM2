// Random number between min and max (inclusive)
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Weighted random to simulate bell curves for attributes
export const weightedRandom = (min: number, max: number, skew: number = 1): number => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  
  num = num / 10.0 + 0.5;
  if (num > 1 || num < 0) num = weightedRandom(min, max, skew);
  
  num = Math.pow(num, skew);
  num *= max - min;
  num += min;
  return Math.round(num);
}

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- INDEXED DB SAVING SYSTEM ---

const DB_NAME = 'FM_ARG_DB_V2';
const STORE_NAME = 'saves';

export interface SaveMetadata {
  id: string;
  label: string;
  date: Date;
  teamName: string;
  managerName: string;
  profile?: string;
}

const CLOUD_PREFIX = 'fm_arg_cloud_';
const PROFILES_KEY = 'fm_arg_profiles';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const syncToCloud = async (data: any) => {
  try {
    const cloudData = JSON.stringify(data);
    if (cloudData.length > 4 * 1024 * 1024) return;
    localStorage.setItem(CLOUD_PREFIX + (data.id || 'default'), cloudData);
  } catch { /* ignore */ }
};

const loadFromCloud = async (id: string): Promise<any | null> => {
  try {
    const raw = localStorage.getItem(CLOUD_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const saveGame = async (data: any) => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      if (!data.id) data.id = generateUUID();
      const req = store.put(data);
      req.onsuccess = async () => {
        try {
          await syncToCloud(data);
          resolve();
        } catch (cloudError) {
          console.warn('Cloud sync failed, but local save succeeded:', cloudError);
          resolve(); // Still resolve since local save worked
        }
      };
      req.onerror = () => {
        console.error('Save game failed:', req.error);
        reject(req.error);
      };
    });
  } catch (dbError) {
    console.error('Database initialization failed:', dbError);
    throw dbError;
  }
};

export const loadGame = async (id: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = async () => {
        if (req.result) { 
          console.log(`Game loaded successfully from local storage: ${id}`);
          resolve(req.result); 
          return; 
        }
        
        try {
          const cloud = await loadFromCloud(id);
          if (cloud) { 
            console.log(`Game loaded successfully from cloud: ${id}`);
            resolve(cloud); 
            return; 
          }
          console.warn(`Game not found in local or cloud storage: ${id}`);
          resolve(null);
        } catch (cloudError) {
          console.error('Cloud load failed:', cloudError);
          resolve(null);
        }
      };
      req.onerror = () => {
        console.error('Load game failed:', req.error);
        reject(req.error);
      };
    });
  } catch (dbError) {
    console.error('Database initialization failed:', dbError);
    throw dbError;
  }
};

export const listSaves = async (): Promise<SaveMetadata[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    
    req.onsuccess = () => {
      const results = req.result.map((item: any) => ({
        id: item.id,
        label: item.label || 'Partida sin nombre',
        date: item.lastPlayed || new Date(),
        teamName: item.metaTeamName || 'Desconocido',
        managerName: item.metaManagerName || 'Manager'
      }));
      resolve(results.sort((a, b) => b.date.getTime() - a.date.getTime()));
    };
    req.onerror = () => reject(req.error);
  });
};

export const checkSaveExists = async (): Promise<boolean> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.count();
    req.onsuccess = () => resolve(req.result > 0);
    req.onerror = () => reject(req.error);
  });
};

export const deleteSave = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      try { localStorage.removeItem(CLOUD_PREFIX + id); } catch { /* ignore */ }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
};

export const saveProfile = async (profileName: string, data: any): Promise<void> => {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    profiles[profileName] = { data, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch { /* ignore */ }
};

export const loadProfile = async (profileName: string): Promise<any | null> => {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    const profile = profiles[profileName];
    return profile ? profile.data : null;
  } catch { return null; }
};

export const listProfiles = async (): Promise<string[]> => {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    return Object.keys(profiles).sort((a, b) => {
      const da = profiles[a].updatedAt || '';
      const db = profiles[b].updatedAt || '';
      return db.localeCompare(da);
    });
  } catch { return []; }
};

export const deleteProfile = async (profileName: string): Promise<void> => {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    delete profiles[profileName];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch { /* ignore */ }
};