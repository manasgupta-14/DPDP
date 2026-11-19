const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export function toDate(value) {
    if (!value) return null;
    const text = String(value);
    const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const d = new Date(text.includes("T") && !zoned ? `${text}Z` : text);
    return Number.isNaN(d.getTime()) ? null : d;
}

function splitEntity(entity) {
    const text = String(entity ?? "").trim();
    const at = text.search(/\s/);
    if (at === -1) return { table: text, key: "" };
    return { table: text.slice(0, at), key: text.slice(at).trim() };
}

export const NOT_IN_API = "-";

function parseKey(key) {
    const text = String(key ?? "").trim();
    if (!text) return [];
    try {
        const obj = JSON.parse(text);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            return Object.entries(obj).map(([name, value]) => ({ name, value: value === null || value === undefined ? "" : String(value) }));
        }
    } catch {
    }
    return [{ name: "", value: text }];
}

export function humanizeEntity(name) {
    return String(name ?? "").replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
}

// Backend action "campaignaudiencegroupmembers.added" jaise lowercase jude hue shabd bhejta hai.
// In shabdon ki list se hum unhe "Campaign audience group members · added" bana dete hain.
const WORDS = (
    "campaign audience group groups member members mapping mappings response responses data principal principals identifier identifiers " +
    "consent consents record records detail details purpose purposes category categories processor processors notice notices template templates " +
    "translation translations version versions user users role roles permission permissions organization organizations organisation org unit units " +
    "grievance grievances message messages breach breaches incident incidents dpia dpias review reviews retention policy policies job jobs erasure " +
    "privacy request requests history histories audit log logs report reports inventory inventories import imports batch batches row rows staff " +
    "tenant tenants refresh token tokens assignment assignments comment comments attachment attachments evidence task tasks status sub recipient " +
    "recipients notification notifications setting settings language languages security activity activities queue item items file files " +
    "added modified deleted created updated removed inserted"
).split(" ").sort((a, b) => b.length - a.length);

function segment(word) {
    const w = word.toLowerCase();
    const best = new Array(w.length + 1).fill(null);
    best[0] = [];
    for (let i = 0; i < w.length; i++) {
        if (!best[i]) continue;
        for (const d of WORDS) {
            if (w.startsWith(d, i) && (!best[i + d.length] || best[i + d.length].length > best[i].length + 1)) best[i + d.length] = [...best[i], d];
        }
    }
    return best[w.length] ? best[w.length].join(" ") : word;
}

/** "campaignaudiencegroupmembers.added" -> "Campaign audience group members · added" */
export function humanizeAction(action) {
    const raw = String(action ?? "").trim();
    if (!raw) return "";
    const parts = raw.split(".").map((p) => {
        const spaced = /[A-Z]/.test(p) ? humanizeEntity(p).toLowerCase() : p.replace(/[_-]+/g, " ").split(" ").map(segment).join(" ");
        return spaced.trim();
    });
    const text = parts.filter(Boolean).join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitActor(actor) {
    const [email = "", ...rest] = String(actor ?? "").split(/\r?\n/);
    return { email: email.trim(), role: rest.join(" ").trim() };
}

export function normalizeLog(r, index = 0) {
    const seq = pick(r, "seq", "Seq");
    const entity = String(pick(r, "entity", "Entity") ?? "");
    const { table, key } = splitEntity(entity);
    const { email, role } = splitActor(pick(r, "actor", "Actor"));
    const keyPairs = parseKey(key);
    return {
        id: String(seq ?? `row-${index}`),
        seq: seq === null ? null : Number(seq),
        time: toDate(pick(r, "when", "When")),
        action: String(pick(r, "action", "Action") ?? ""),
        entity,
        table,
        key,
        keyPairs,
        entityType: humanizeEntity(table),
        entityId: keyPairs.map((k) => k.value).filter(Boolean).join(", "),
        actorEmail: email,
        actorRole: role,
        outcome: String(pick(r, "outcome", "Outcome") ?? ""),
        hash: String(pick(r, "entryHash", "EntryHash") ?? ""),
    };
}

export function actionKind(action) {
    const a = String(action).toLowerCase();
    if (/creat|add|insert/.test(a)) return "create";
    if (/updat|modif|edit|chang/.test(a)) return "update";
    if (/delet|remov/.test(a)) return "delete";
    return "other";
}

export const ACTION_TONE = {
    create: "bg-ok/10 text-ok-ink ring-ok/25",
    update: "bg-warn/10 text-warn-ink ring-warn/25",
    delete: "bg-bad/10 text-bad-ink ring-bad/25",
    other: "bg-subtle text-ink-2 ring-line-strong",
};

export const isSuccess = (outcome) => /^success/i.test(String(outcome ?? "").trim());

export const OUTCOME_TONE = {
    success: "bg-ok/10 text-ok-ink ring-ok/25",
    other: "bg-bad/10 text-bad-ink ring-bad/25",
};

export const shortId = (id) => (id ? String(id).slice(0, 8) : "-");

export const shortHash = (hash) => (hash ? `${String(hash).slice(0, 10)}...${String(hash).slice(-6)}` : "-");

export function countByKind(logs) {
    const out = { total: logs.length, create: 0, update: 0, delete: 0, failed: 0 };
    for (const l of logs) {
        const k = actionKind(l.action);
        if (k in out) out[k] += 1;
        if (l.outcome && !isSuccess(l.outcome)) out.failed += 1;
    }
    return out;
}

const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function auditToCsv(logs) {
    const rows = [["Seq", "When (UTC)", "Action", "Entity", "Actor", "Role", "Outcome", "Entry hash"]];
    for (const l of logs) {
        rows.push([l.seq ?? "", l.time ? l.time.toISOString() : "", l.action, l.entity, l.actorEmail, l.actorRole, l.outcome, l.hash]);
    }
    return rows.map((r) => r.map(cell).join(",")).join("\n");
}
