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
    create: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    update: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
    delete: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    other: "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]",
};

export const isSuccess = (outcome) => /^success/i.test(String(outcome ?? "").trim());

export const OUTCOME_TONE = {
    success: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    other: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
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
