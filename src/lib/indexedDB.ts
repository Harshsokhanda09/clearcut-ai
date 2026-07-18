const DB_NAME = "ClearCutAI";
const DB_VERSION = 2;
const IMAGE_STORE_NAME = "images";
const CURRENT_STORE_NAME = "current";
const CURRENT_RESULT_ID = "active";

const isBrowser = typeof window !== "undefined";

export interface DBEntry {
  id: string;
  originalBlob: Blob;
  processedBlob?: Blob;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  createdAt: string;
}

export interface CurrentResult {
  id: typeof CURRENT_RESULT_ID;
  originalBlob: Blob;
  processedBlob?: Blob;
  originalFileName: string;
  originalFileType: string;
  originalFileSize: number;
  width?: number;
  height?: number;
  processingMs?: number;
  savedAt: string;
  status: "idle" | "completed";
}

let db: IDBDatabase | null = null;
let opening: Promise<IDBDatabase> | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (!isBrowser) throw new Error("IndexedDB is only available in the browser");
  if (db) return db;
  if (opening) return opening;

  const openPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked by another tab"));
    request.onsuccess = () => {
      db = request.result;
      db.onversionchange = () => {
        db?.close();
        db = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(CURRENT_STORE_NAME)) {
        database.createObjectStore(CURRENT_STORE_NAME, { keyPath: "id" });
      }
    };
  });
  const trackedPromise = openPromise.finally(() => {
    opening = null;
  });
  opening = trackedPromise;
  return trackedPromise;
}

async function runRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addImage(entry: DBEntry): Promise<void> {
  if (!isBrowser) return;
  await runRequest(IMAGE_STORE_NAME, "readwrite", (store) => store.put(entry));
}

export async function getImage(id: string): Promise<DBEntry | null> {
  if (!isBrowser) return null;
  const entry = await runRequest<DBEntry | undefined>(IMAGE_STORE_NAME, "readonly", (store) =>
    store.get(id),
  );
  return entry ?? null;
}

export async function getAllImages(): Promise<DBEntry[]> {
  if (!isBrowser) return [];
  const entries = await runRequest<DBEntry[]>(IMAGE_STORE_NAME, "readonly", (store) =>
    store.getAll(),
  );
  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteImage(id: string): Promise<void> {
  if (!isBrowser) return;
  await runRequest(IMAGE_STORE_NAME, "readwrite", (store) => store.delete(id));
}

export async function clearAllImages(): Promise<void> {
  if (!isBrowser) return;
  await runRequest(IMAGE_STORE_NAME, "readwrite", (store) => store.clear());
}

export async function saveCurrentImage(result: Omit<CurrentResult, "id">): Promise<void> {
  if (!isBrowser) return;
  await runRequest(CURRENT_STORE_NAME, "readwrite", (store) =>
    store.put({ ...result, id: CURRENT_RESULT_ID }),
  );
}

export async function getCurrentImage(): Promise<CurrentResult | null> {
  if (!isBrowser) return null;
  const result = await runRequest<CurrentResult | undefined>(
    CURRENT_STORE_NAME,
    "readonly",
    (store) => store.get(CURRENT_RESULT_ID),
  );
  return result ?? null;
}

export async function clearCurrentImage(): Promise<void> {
  if (!isBrowser) return;
  await runRequest(CURRENT_STORE_NAME, "readwrite", (store) => store.delete(CURRENT_RESULT_ID));
}
