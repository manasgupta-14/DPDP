// DOM translation engine. It translates visible UI text in place (text nodes + a few attributes),
// so no page/component has to be rewritten. Original text is remembered and restored on English.
//
// Opt out of translation for any element (names, ticket text, free-form user content):
//   <p translate="no">...</p>   or   <p data-no-translate>...</p>   or   className="notranslate"
import { getToken } from "../auth/tokenStorage.js";
import { PERSIST_MAX_CHARS, readMany, writeMany } from "./cache.js";
import { LANG_STORAGE_KEY, RTL_LANGS, SOURCE_LANG, isSupported } from "./languages.js";

const ENDPOINT = "/api/translate";
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
// Text inside these is never translated. (input/textarea: their placeholder/title attributes still are.)
const SKIP_TAGS = new Set(["script", "style", "noscript", "code", "pre", "kbd", "samp", "textarea", "input", "svg", "iframe", "canvas"]);
const SKIP_SUBTREE = new Set(["script", "style", "noscript", "code", "pre", "kbd", "samp", "svg", "iframe", "canvas"]);
const EXCLUDE = '[translate="no"],.notranslate,[data-no-translate],[contenteditable="true"]';
const MAX_TEXT = 1500;
const BATCH_TEXTS = 25;
const BATCH_CHARS = 8000;
const MAX_PARALLEL = 2;
const DEBOUNCE_MS = 120;
const FAIL_COOLDOWN_MS = 60_000;

const LATIN_WORD = /[A-Za-z]{2,}/;
const SKIP_VALUE = [/^[\w.+-]+@[\w-]+\.[\w.-]+$/, /^(https?:\/\/|www\.)\S+$/i, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i];

const state = {
    lang: SOURCE_LANG,
    started: false,
    observer: null,
    textRecs: new WeakMap(),
    attrRecs: new WeakMap(),
    mem: new Map(), // `${lang}\u0001${core}` -> translated
    pending: new Map(), // core -> Set<{node, attr}>
    inflight: new Set(), // `${lang}\u0001${core}`
    failed: new Map(), // `${lang}\u0001${core}` -> retry-after timestamp
    queue: [],
    running: 0,
    timer: 0,
    blockedUntil: 0,
    hardBlockUntil: 0, // set after a server/config failure; no more requests until it passes
    snapshot: { lang: SOURCE_LANG, busy: false, error: "" },
    listeners: new Set(),
};

// ---------- external store (for React) ----------
function publish(patch = {}) {
    const busy = state.pending.size > 0 || state.running > 0 || state.queue.length > 0;
    const next = { ...state.snapshot, lang: state.lang, busy, ...patch };
    if (next.lang !== state.snapshot.lang || next.busy !== state.snapshot.busy || next.error !== state.snapshot.error) {
        state.snapshot = next;
        state.listeners.forEach((l) => l());
    }
}
export const subscribe = (l) => {
    state.listeners.add(l);
    return () => state.listeners.delete(l);
};
export const getSnapshot = () => state.snapshot;

// ---------- records (original text bookkeeping) ----------
const getRec = (node, attr) => (attr ? state.attrRecs.get(node)?.[attr] : state.textRecs.get(node));
function setRec(node, attr, rec) {
    if (!attr) return state.textRecs.set(node, rec);
    const o = state.attrRecs.get(node) || {};
    o[attr] = rec;
    state.attrRecs.set(node, o);
}
function delRec(node, attr) {
    if (!attr) return state.textRecs.delete(node);
    const o = state.attrRecs.get(node);
    if (o) delete o[attr];
}
const read = (node, attr) => (attr ? node.getAttribute(attr) : node.nodeValue);
const write = (node, attr, v) => (attr ? node.setAttribute(attr, v) : (node.nodeValue = v));

// ---------- eligibility ----------
function translatable(core) {
    if (core.length < 2 || core.length > MAX_TEXT || !LATIN_WORD.test(core)) return false;
    return !SKIP_VALUE.some((p) => p.test(core));
}
function excluded(node, attr) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return true;
    if (!attr && SKIP_TAGS.has(el.localName)) return true;
    if (attr && SKIP_SUBTREE.has(el.localName)) return true;
    return !!el.closest(EXCLUDE);
}

// ---------- core: look at one text node / attribute ----------
function consider(node, attr) {
    if (!node.isConnected) return;
    const cur = read(node, attr);
    if (cur == null) return;
    const rec = getRec(node, attr);
    if (state.lang === SOURCE_LANG && !rec) return;

    let orig = cur;
    if (rec) {
        if (cur === rec.applied) {
            if (rec.lang === state.lang) return;
            orig = rec.orig;
        } else {
            delRec(node, attr); // the app changed this text itself: treat the new value as the original
        }
    }
    if (state.lang === SOURCE_LANG) {
        if (orig !== cur) write(node, attr, orig);
        delRec(node, attr);
        return;
    }
    if (excluded(node, attr)) {
        if (orig !== cur) write(node, attr, orig);
        delRec(node, attr);
        return;
    }
    const core = orig.trim().replace(/\s+/g, " ");
    if (!translatable(core)) {
        if (orig !== cur) write(node, attr, orig);
        delRec(node, attr);
        return;
    }
    const hit = state.mem.get(`${state.lang}\u0001${core}`);
    if (hit !== undefined) {
        const lead = orig.match(/^\s*/)[0];
        const trail = orig.match(/\s*$/)[0];
        const out = lead + hit + trail;
        if (out !== cur) write(node, attr, out);
        setRec(node, attr, { orig, applied: out, lang: state.lang });
        return;
    }
    let set = state.pending.get(core);
    if (!set) state.pending.set(core, (set = new Set()));
    set.add({ node, attr });
    schedule();
}

function considerAttrs(el) {
    for (const a of ATTRS) if (el.hasAttribute(a)) consider(el, a);
}

function scan(root) {
    if (!root) return;
    if (root.nodeType === 3) return consider(root);
    if (root.nodeType !== 1) return;
    if (SKIP_SUBTREE.has(root.localName) || root.matches(EXCLUDE)) {
        if (state.lang === SOURCE_LANG) restoreSubtree(root);
        return;
    }
    considerAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            if (n.nodeType === 1 && (SKIP_SUBTREE.has(n.localName) || n.matches(EXCLUDE))) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let n = walker.nextNode();
    while (n) {
        if (n.nodeType === 3) consider(n);
        else considerAttrs(n);
        n = walker.nextNode();
    }
}

function restoreSubtree(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n = walker.currentNode;
    while (n) {
        if (n.nodeType === 3) consider(n);
        else for (const a of ATTRS) if (getRec(n, a)) consider(n, a);
        n = walker.nextNode();
    }
}

// ---------- batching + network ----------
function schedule() {
    clearTimeout(state.timer);
    state.timer = setTimeout(flush, DEBOUNCE_MS);
    publish();
}

function resolveCore(lang, core) {
    if (lang !== state.lang) return;
    const targets = state.pending.get(core);
    state.pending.delete(core);
    if (targets) for (const t of targets) consider(t.node, t.attr);
}

async function flush() {
    const lang = state.lang;
    if (lang === SOURCE_LANG) return;
    if (Date.now() < state.hardBlockUntil) {
        state.pending.clear();
        return publish();
    }
    if (Date.now() < state.blockedUntil) {
        state.timer = setTimeout(flush, state.blockedUntil - Date.now());
        return;
    }
    const now = Date.now();
    const cores = [];
    for (const c of [...state.pending.keys()]) {
        const k = `${lang}\u0001${c}`;
        if ((state.failed.get(k) || 0) > now) state.pending.delete(c); // recently failed: keep English for now
        else if (!state.inflight.has(k)) cores.push(c);
    }
    if (cores.length === 0) return publish();

    // 1) device cache (short UI strings only)
    const keys = cores.filter((c) => c.length <= PERSIST_MAX_CHARS).map((c) => `${lang}\u0001${c}`);
    const stored = await readMany(keys);
    const missing = [];
    for (const c of cores) {
        const v = stored.get(`${lang}\u0001${c}`);
        if (v !== undefined) {
            state.mem.set(`${lang}\u0001${c}`, v);
            resolveCore(lang, c);
        } else if (lang === state.lang) {
            missing.push(c);
        }
    }

    // 2) server (proxy) in small batches
    let batch = [];
    let chars = 0;
    for (const c of missing) {
        if (batch.length >= BATCH_TEXTS || chars + c.length > BATCH_CHARS) {
            state.queue.push({ lang, texts: batch });
            batch = [];
            chars = 0;
        }
        batch.push(c);
        chars += c.length;
        state.inflight.add(`${lang}\u0001${c}`);
    }
    if (batch.length) state.queue.push({ lang, texts: batch });
    pump();
    publish();
}

function pump() {
    if (Date.now() < state.blockedUntil) return;
    while (state.running < MAX_PARALLEL && state.queue.length) {
        const job = state.queue.shift();
        state.running++;
        run(job).finally(() => {
            state.running--;
            pump();
            publish();
        });
    }
}

async function run({ lang, texts }) {
    try {
        const token = getToken();
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ target: lang, texts }),
        });
        if (res.status === 429) {
            const wait = Math.min(Number(res.headers.get("Retry-After")) || 15, 90);
            state.blockedUntil = Date.now() + wait * 1000;
            texts.forEach((c) => state.inflight.delete(`${lang}\u0001${c}`));
            state.queue.push({ lang, texts });
            texts.forEach((c) => state.inflight.add(`${lang}\u0001${c}`));
            publish({ error: "Translation is busy. Retrying shortly..." });
            setTimeout(pump, wait * 1000);
            return;
        }
        if (!res.ok) {
            let message = "Translation is unavailable right now. Showing English.";
            try {
                message = (await res.json())?.error || message;
            } catch {
                // keep default
            }
            if (res.status >= 500 || res.status === 401 || res.status === 403) state.hardBlockUntil = Date.now() + 2 * 60_000;
            throw new Error(message);
        }
        const data = await res.json();
        const out = Array.isArray(data?.translations) ? data.translations : [];
        const persist = [];
        texts.forEach((core, i) => {
            const k = `${lang}\u0001${core}`;
            state.inflight.delete(k);
            if (typeof out[i] === "string" && out[i]) {
                state.mem.set(k, out[i]);
                if (core.length <= PERSIST_MAX_CHARS) persist.push([k, out[i]]);
            } else {
                state.failed.set(k, Date.now() + FAIL_COOLDOWN_MS);
                state.pending.delete(core);
            }
        });
        writeMany(persist);
        texts.forEach((core) => resolveCore(lang, core));
        publish({ error: "" });
    } catch (e) {
        texts.forEach((core) => {
            const k = `${lang}\u0001${core}`;
            state.inflight.delete(k);
            state.failed.set(k, Date.now() + FAIL_COOLDOWN_MS);
            state.pending.delete(core);
        });
        publish({ error: e?.message || "Translation is unavailable right now. Showing English." });
    }
}

// ---------- observer + public API ----------
function onMutations(list) {
    for (const m of list) {
        if (m.type === "characterData") consider(m.target);
        else if (m.type === "attributes") consider(m.target, m.attributeName);
        else m.addedNodes.forEach(scan);
    }
}

function startObserver() {
    if (state.observer || typeof MutationObserver === "undefined") return;
    state.observer = new MutationObserver(onMutations);
    state.observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
function stopObserver() {
    state.observer?.disconnect();
    state.observer = null;
}

function applyDocumentLang(lang) {
    const root = document.documentElement;
    root.lang = lang === SOURCE_LANG ? "en" : lang.split("-")[0];
    root.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

export function setLanguage(lang) {
    if (!isSupported(lang)) return;
    state.lang = lang;
    state.hardBlockUntil = 0; // picking a language again always retries
    state.pending.clear();
    state.queue.length = 0;
    clearTimeout(state.timer);
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
        // ignore
    }
    applyDocumentLang(lang);
    publish({ error: "" });
    if (lang === SOURCE_LANG) {
        scan(document.body);
        stopObserver();
        return;
    }
    startObserver();
    scan(document.body);
    publish();
}

export function initTranslator() {
    if (state.started || typeof document === "undefined") return;
    state.started = true;
    let saved = SOURCE_LANG;
    try {
        saved = localStorage.getItem(LANG_STORAGE_KEY) || SOURCE_LANG;
    } catch {
        // ignore
    }
    if (isSupported(saved) && saved !== SOURCE_LANG) requestAnimationFrame(() => setLanguage(saved));
}

// For tests only.
export const __state = state;
