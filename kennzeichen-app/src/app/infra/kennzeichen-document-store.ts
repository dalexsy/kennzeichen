import { createUserDocumentStore } from '@dryl/app-data';
import { type DocumentStore, type JsonDocumentBackend } from '@dryl/storage';

export const PLATES_APP_KEY = 'kennzeichen';
const SEEN_KEY = 'license-plates-seen';

export type KennzeichenBlob = {
  version: 1;
  seenCodes: string[];
  updatedAt: string;
};

export const EMPTY_PLATES_BLOB: KennzeichenBlob = {
  version: 1,
  seenCodes: [],
  updatedAt: '',
};

type SeenRow = { code: string; seenAt: string };

let storeCache: DocumentStore<KennzeichenBlob> | null = null;

function readSeenRows(): SeenRow[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((row) => row?.code) : [];
  } catch {
    return [];
  }
}

function localPlatesBackend(): JsonDocumentBackend {
  return {
    async load() {
      const rows = readSeenRows();
      if (!rows.length) return null;
      return {
        version: 1 as const,
        seenCodes: rows.map((row) => row.code),
        updatedAt: rows.reduce((max, row) => (row.seenAt > max ? row.seenAt : max), ''),
      };
    },
    async save(data: unknown) {
      const blob = data as KennzeichenBlob;
      const existing = new Map(readSeenRows().map((row) => [row.code, row]));
      const now = new Date().toISOString();
      const next: SeenRow[] = (blob.seenCodes ?? []).map(
        (code) => existing.get(code) ?? { code, seenAt: now },
      );
      localStorage.setItem(SEEN_KEY, JSON.stringify(next));
    },
  };
}

export function platesDocumentStore(): DocumentStore<KennzeichenBlob> {
  storeCache ??= createUserDocumentStore<KennzeichenBlob>({
    appKey: PLATES_APP_KEY,
    empty: EMPTY_PLATES_BLOB,
    local: localPlatesBackend(),
    isEmpty: (blob) => !blob.seenCodes.length,
    merge: (local, remote) => ({
      version: 1,
      seenCodes: Array.from(new Set([...local.seenCodes, ...remote.seenCodes])),
      updatedAt: local.updatedAt > remote.updatedAt ? local.updatedAt : remote.updatedAt,
    }),
  });
  if (!storeCache) {
    throw new Error('kennzeichen document store unavailable');
  }
  return storeCache;
}

export async function savePlatesBlob(blob: KennzeichenBlob): Promise<void> {
  await platesDocumentStore().save({ ...blob, version: 1 });
}
