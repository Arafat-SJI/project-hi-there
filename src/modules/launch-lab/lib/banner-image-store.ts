import type { BannerAspectRatio, BannerPlatform } from "../types";
import { BANNER_PLATFORMS } from "../constants";

const DB_NAME = "launch-lab-banner-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

export interface StoredBannerImage {
  imageUrl: string;
  aspectRatio: BannerAspectRatio;
  variantIndex: number;
  updatedAt: number;
}

type StoredBannerMap = Partial<Record<BannerPlatform, StoredBannerImage>>;

const memoryCache = new Map<string, StoredBannerImage>();
const MAX_MEMORY_CACHE_ENTRIES = 8;

function storageKey(sessionId: string, platform: BannerPlatform): string {
  return `${sessionId}:${platform}`;
}

function evictMemoryCacheIfNeeded(): void {
  while (memoryCache.size > MAX_MEMORY_CACHE_ENTRIES) {
    const oldest = memoryCache.keys().next().value;
    if (!oldest) break;
    memoryCache.delete(oldest);
  }
}

/** Drop in-memory banner blobs for every session except the active one. */
export function evictOtherSessionsBannerCache(activeSessionId: string): void {
  for (const key of memoryCache.keys()) {
    if (!key.startsWith(`${activeSessionId}:`)) {
      memoryCache.delete(key);
    }
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function idbGet(key: string): Promise<StoredBannerImage | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as StoredBannerImage | undefined) ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

async function idbPut(key: string, value: StoredBannerImage): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    /* best-effort */
  }
}

async function idbDeletePrefix(sessionId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const key = String(cursor.key);
        if (key.startsWith(`${sessionId}:`)) {
          cursor.delete();
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* best-effort */
  }
}

export async function loadSessionBannerImages(sessionId: string): Promise<StoredBannerMap> {
  const result: StoredBannerMap = {};
  const missingPlatforms = BANNER_PLATFORMS.filter(
    (platform) => !memoryCache.has(storageKey(sessionId, platform)),
  );

  for (const platform of BANNER_PLATFORMS) {
    const key = storageKey(sessionId, platform);
    const cached = memoryCache.get(key);
    if (cached?.imageUrl) {
      result[platform] = cached;
    }
  }

  if (missingPlatforms.length === 0) {
    return result;
  }

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      let pending = missingPlatforms.length;

      for (const platform of missingPlatforms) {
        const key = storageKey(sessionId, platform);
        const req = store.get(key);
        req.onsuccess = () => {
          const stored = req.result as StoredBannerImage | undefined;
          if (stored?.imageUrl) {
            result[platform] = stored;
            memoryCache.set(key, stored);
            evictMemoryCacheIfNeeded();
          }
          pending -= 1;
          if (pending === 0) resolve();
        };
        req.onerror = () => reject(req.error);
      }

      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* best-effort */
  }

  return result;
}

export async function saveSessionBannerImage(
  sessionId: string,
  platform: BannerPlatform,
  data: Omit<StoredBannerImage, "updatedAt">,
): Promise<void> {
  const key = storageKey(sessionId, platform);
  const record = { ...data, updatedAt: Date.now() };
  memoryCache.set(key, record);
  evictMemoryCacheIfNeeded();
  await idbPut(key, record);
}

export function getMemoryBannerImage(sessionId: string, platform: BannerPlatform): string | null {
  return memoryCache.get(storageKey(sessionId, platform))?.imageUrl ?? null;
}

export function hasBannerImage(sessionId: string, platform: BannerPlatform): boolean {
  return memoryCache.has(storageKey(sessionId, platform));
}

export async function clearSessionBannerImages(sessionId: string): Promise<void> {
  for (const platform of BANNER_PLATFORMS) {
    memoryCache.delete(storageKey(sessionId, platform));
  }
  await idbDeletePrefix(sessionId);
}
