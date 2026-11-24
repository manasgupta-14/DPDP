import { useMemo, useSyncExternalStore } from "react";


const KINDS = ["breach", "grievance", "rights", "dpia"];
const PREFIX = { breach: "b", grievance: "g", rights: "r", dpia: "d" };
const MAX_SEEN = 500;

const empty = () => Object.fromEntries(KINDS.map((k) => [k, new Set()]));
const keyOf = (kind, id) => `${PREFIX[kind]}-${id}`;

let owner = null;
let seen = empty();
let open = empty();
let version = 0;
const listeners = new Set();

const storeKey = (email) => `kv_seen_items:${email || "admin"}`;
const emit = () => {
    version += 1;
    listeners.forEach((l) => l());
};

function load(email) {
    try {
        const raw = JSON.parse(localStorage.getItem(storeKey(email)) || "{}");
        return Object.fromEntries(KINDS.map((k) => [k, new Set(Array.isArray(raw[k]) ? raw[k] : [])]));
    } catch {
        return empty();
    }
}

function save() {
    try {
        const out = Object.fromEntries(KINDS.map((k) => [k, [...seen[k]].slice(-MAX_SEEN)]));
        localStorage.setItem(storeKey(owner), JSON.stringify(out));
    } catch {
    }
}

export function initNewItems(email) {
    const who = email || "admin";
    if (owner === who) return;
    owner = who;
    seen = load(who);
    open = empty();
    emit();
}

export function setOpenItems(all = []) {
    const next = empty();
    for (const a of all) if (next[a.kind]) next[a.kind].add(a.key);
    open = next;
    emit();
}

export function markSeen(kind, id) {
    if (!PREFIX[kind] || id === undefined || id === null || id === "") return;
    const key = keyOf(kind, id);
    if (seen[kind].has(key)) return;
    seen[kind].add(key);
    save();
    emit();
}

export function markFromPath(pathname) {
    const m = /^\/dashboard\/(grievances|rights-requests|dpia)\/([^/]+)\/?$/.exec(pathname);
    if (!m || m[2] === "new") return;
    const kind = { grievances: "grievance", "rights-requests": "rights", dpia: "dpia" }[m[1]];
    try {
        markSeen(kind, decodeURIComponent(m[2]));
    } catch {
        markSeen(kind, m[2]);
    }
}

const isNewItem = (kind, id) => {
    if (!PREFIX[kind] || id === undefined || id === null) return false;
    const key = keyOf(kind, id);
    return open[kind].has(key) && !seen[kind].has(key);
};
const newCount = (kind) => {
    let n = 0;
    for (const key of open[kind] || []) if (!seen[kind].has(key)) n += 1;
    return n;
};

const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
};
const snapshot = () => version;

export function useNewItems() {
    const v = useSyncExternalStore(subscribe, snapshot, snapshot);
    return useMemo(() => ({ isNew: (kind, id) => isNewItem(kind, id), count: (kind) => newCount(kind), version: v }), [v]);
}
