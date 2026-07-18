import {
  addImage,
  clearAllImages,
  deleteImage,
  getAllImages,
  getImage,
  type DBEntry,
} from "./indexedDB";

const STORAGE_KEY = "clearcut-history-ids";
const CURRENT_STORAGE_KEY = "clearcut-current-result";
const MAX_HISTORY = 50;
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const isBrowser = typeof window !== "undefined";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  if (!header || !data) throw new Error("Invalid base64 data URL");
  const typeMatch = header.match(/data:([^;]+)/);
  if (!typeMatch) throw new Error("Invalid base64 MIME type");
  const type = typeMatch[1];
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
}

export interface CurrentResult {
  serverSessionId: string;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  originalBase64: string;
  processedBase64?: string;
  width?: number;
  height?: number;
  processingMs?: number;
  savedAt: string;
  status: "idle" | "completed";
}

function getServerSessionId(): string | null {
  if (!isBrowser) return null;
  return import.meta.env.VITE_SERVER_SESSION_ID ?? null;
}

export interface HistoryItem {
  id: string;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  createdAt: string;
}

function getHistoryIds(): string[] {
  if (!isBrowser) return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function saveHistoryIds(ids: string[]): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_HISTORY)));
}

function isExpired(entry: DBEntry, now = Date.now()): boolean {
  const createdAt = new Date(entry.createdAt).getTime();
  return !Number.isFinite(createdAt) || now - createdAt >= HISTORY_TTL_MS;
}

async function pruneHistory(preferredIds = getHistoryIds()): Promise<DBEntry[]> {
  const allImages = await getAllImages();
  const imagesById = new Map(allImages.map((image) => [image.id, image]));
  const keptIds: string[] = [];

  for (const id of preferredIds) {
    const entry = imagesById.get(id);
    if (!entry || isExpired(entry) || keptIds.length >= MAX_HISTORY) continue;
    if (!keptIds.includes(id)) keptIds.push(id);
  }

  const keptIdSet = new Set(keptIds);
  await Promise.all(
    allImages.filter((entry) => !keptIdSet.has(entry.id)).map((entry) => deleteImage(entry.id)),
  );
  saveHistoryIds(keptIds);
  return keptIds.map((id) => imagesById.get(id)).filter((entry): entry is DBEntry => !!entry);
}

export async function saveHistoryEntry(entry: DBEntry): Promise<void> {
  await addImage(entry);
  try {
    const ids = getHistoryIds().filter((id) => id !== entry.id);
    await pruneHistory([entry.id, ...ids]);
  } catch (error) {
    await deleteImage(entry.id).catch(() => undefined);
    throw error;
  }
}

export async function getHistory(): Promise<HistoryItem[]> {
  if (!isBrowser) return [];
  const entries = await pruneHistory();
  return entries.map((entry) => ({
    id: entry.id,
    originalFileName: entry.originalFileName,
    originalFileType: entry.originalFileType,
    originalFileSize: entry.originalFileSize,
    createdAt: entry.createdAt,
  }));
}

export async function cleanupExpiredHistory(): Promise<void> {
  if (!isBrowser) return;
  await pruneHistory();
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await deleteImage(id);
  saveHistoryIds(getHistoryIds().filter((storedId) => storedId !== id));
}

export async function clearHistory(): Promise<void> {
  await clearAllImages();
  if (isBrowser) localStorage.removeItem(STORAGE_KEY);
}

export async function saveCurrentResult(
  result: Omit<
    CurrentResult,
    "serverSessionId" | "savedAt" | "originalBase64" | "processedBase64"
  > & {
    originalBlob: Blob;
    processedBlob?: Blob;
  },
): Promise<void> {
  if (!isBrowser) return;
  const serverSessionId = getServerSessionId();
  if (!serverSessionId) return;

  const originalBase64 = await blobToBase64(result.originalBlob);
  const processedBase64 = result.processedBlob
    ? await blobToBase64(result.processedBlob)
    : undefined;

  const data: CurrentResult = {
    serverSessionId,
    originalFileName: result.originalFileName,
    originalFileType: result.originalFileType,
    originalFileSize: result.originalFileSize,
    originalBase64,
    processedBase64,
    width: result.width,
    height: result.height,
    processingMs: result.processingMs,
    status: result.status,
    savedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(data));
}

export async function getCurrentResult(): Promise<
  (CurrentResult & { originalBlob: Blob; processedBlob?: Blob }) | null
> {
  if (!isBrowser) return null;
  const serverSessionId = getServerSessionId();
  if (!serverSessionId) return null;

  try {
    const raw = sessionStorage.getItem(CURRENT_STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      !("serverSessionId" in data) ||
      !("originalBase64" in data)
    ) {
      return null;
    }
    const result = data as CurrentResult;
    if (result.serverSessionId !== serverSessionId) {
      sessionStorage.removeItem(CURRENT_STORAGE_KEY);
      return null;
    }
    const originalBlob = base64ToBlob(result.originalBase64);
    const processedBlob = result.processedBase64 ? base64ToBlob(result.processedBase64) : undefined;
    return {
      ...result,
      originalBlob,
      processedBlob,
    };
  } catch {
    return null;
  }
}

export async function clearCurrentResult(): Promise<void> {
  if (!isBrowser) return;
  sessionStorage.removeItem(CURRENT_STORAGE_KEY);
}

export function checkServerSessionAndClearCurrentResult(): boolean {
  if (!isBrowser) return false;
  const serverSessionId = getServerSessionId();
  const raw = sessionStorage.getItem(CURRENT_STORAGE_KEY);
  if (!raw || !serverSessionId) return false;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("serverSessionId" in data)) {
      return false;
    }
    if ((data as CurrentResult).serverSessionId !== serverSessionId) {
      sessionStorage.removeItem(CURRENT_STORAGE_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { getImage };
