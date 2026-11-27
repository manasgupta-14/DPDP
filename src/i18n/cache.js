// Small IndexedDB cache for translated UI strings. Everything is best effort:
// if IndexedDB is blocked (private mode, old browser) the in-memory cache still works.
const DB_NAME = "pg-i18n";
const STORE = "t";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
// Only short UI strings are persisted on the device. Longer text (could be user content) stays in memory.
export const PERSIST_MAX_CHARS = 160;

let dbPromise;
function open() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            try {
                if (typeof indexedDB === "undefined") return resolve(null);
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = () => req.result.createObjectStore(STORE);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
                req.onblocked = () => resolve(null);
            } catch {
                resolve(null);
            }
        });
    }
    return dbPromise;
}

export async function readMany(keys) {
    const out = new Map();
    const db = await open();
    if (!db || keys.length === 0) return out;
    return new Promise((resolve) => {
        try {
            const store = db.transaction(STORE, "readonly").objectStore(STORE);
            const now = Date.now();
            let left = keys.length;
            const done = () => {
                if (--left === 0) resolve(out);
            };
            for (const key of keys) {
                const r = store.get(key);
                r.onsuccess = () => {
                    const v = r.result;
                    if (v && typeof v.v === "string" && now - v.t < TTL_MS) out.set(key, v.v);
                    done();
                };
                r.onerror = done;
            }
        } catch {
            resolve(out);
        }
    });
}

export async function writeMany(entries) {
    const db = await open();
    if (!db || entries.length === 0) return;
    try {
        const store = db.transaction(STORE, "readwrite").objectStore(STORE);
        const t = Date.now();
        for (const [key, v] of entries) store.put({ v, t }, key);
    } catch {
        // ignore
    }
}

export async function clearCache() {
    const db = await open();
    if (!db) return;
    try {
        db.transaction(STORE, "readwrite").objectStore(STORE).clear();
    } catch {
        // ignore
    }
}
