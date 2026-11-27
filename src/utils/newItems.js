import { useMemo, useSyncExternalStore } from "react";


// Admin kinds: breach, grievance, rights, dpia, consent, erasure, import, task.
// User kinds: mytask, mygrievance, myrequest, mynotice, myreport.
const PREFIX = {
    breach: "b", grievance: "g", rights: "r", dpia: "d", consent: "c", erasure: "e", import: "i", task: "t",
    mytask: "mt", mygrievance: "mg", myrequest: "mr", mynotice: "mn", myreport: "mp",
};
const KINDS = Object.keys(PREFIX);
const MAX_SEEN = 2000;

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

// Mark every currently open item of `kind` as seen (optionally only keys that start with `prefix`).
export function markKindSeen(kind, prefix = "") {
    if (!PREFIX[kind]) return;
    let changed = false;
    for (const key of open[kind]) {
        if (prefix && !key.startsWith(prefix)) continue;
        if (!seen[kind].has(key)) {
            seen[kind].add(key);
            changed = true;
        }
    }
    if (changed) {
        save();
        emit();
    }
}

export function markKeySeen(kind, key) {
    if (!PREFIX[kind] || !key || seen[kind].has(key)) return;
    seen[kind].add(key);
    save();
    emit();
}

export function markAllSeen(items = []) {
    let changed = false;
    for (const a of items) {
        if (seen[a.kind] && !seen[a.kind].has(a.key)) {
            seen[a.kind].add(a.key);
            changed = true;
        }
    }
    if (changed) {
        save();
        emit();
    }
}

const decode = (v) => {
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
};

export function markFromPath(pathname) {
    const path = String(pathname || "").replace(/\/+$/, "");

    // Admin: opening one record marks just that record.
    const m = /^\/dashboard\/(grievances|rights-requests|dpia)\/([^/]+)$/.exec(path);
    if (m && m[2] !== "new") {
        const kind = { grievances: "grievance", "rights-requests": "rights", dpia: "dpia" }[m[1]];
        markSeen(kind, decode(m[2]));
        return;
    }
    // Admin: opening a list-only module marks everything waiting in it.
    const modules = { "/dashboard/my-tasks": "task", "/dashboard/retention": "erasure", "/dashboard/imports": "import" };
    if (modules[path]) return markKindSeen(modules[path]);

    // User side.
    const g = /^\/user\/grievance\/([^/]+)$/.exec(path);
    if (g) return markKindSeen("mygrievance", `${PREFIX.mygrievance}-${decode(g[1])}-`);
    const userModules = { "/user/tasks": "mytask", "/user/notices": "mynotice", "/user/privacy": "myrequest", "/user/reports": "myreport" };
    if (userModules[path]) markKindSeen(userModules[path]);
}

const isNewItem = (kind, id) => {
    if (!PREFIX[kind] || id === undefined || id === null) return false;
    const key = keyOf(kind, id);
    return open[kind].has(key) && !seen[kind].has(key);
};
const isUnseenItem = (kind, id) => {
    if (!PREFIX[kind] || id === undefined || id === null || id === "") return false;
    return !seen[kind].has(keyOf(kind, id));
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
    return useMemo(() => ({ isSeenKey: (kind, key) => !!seen[kind]?.has(key), isNew: (kind, id) => isNewItem(kind, id), isUnseen: (kind, id) => isUnseenItem(kind, id), count: (kind) => newCount(kind), version: v }), [v]);
}