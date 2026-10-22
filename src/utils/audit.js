const SENSITIVE = /password|hash|token|secret|salt/i;

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

function parseValues(raw) {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw === "object") return raw;
    try {
        const v = JSON.parse(raw);
        return v && typeof v === "object" && !Array.isArray(v) ? v : { value: v };
    } catch {
        return { value: String(raw) };
    }
}

function keyText(raw) {
    const v = parseValues(raw);
    if (!v) return "";
    const vals = Object.values(v).filter((x) => x !== null && x !== undefined);
    return vals.length ? vals.map(String).join(", ") : "";
}

export function normalizeLog(r, index = 0) {
    return {
        id: String(pick(r, "id", "Id") ?? `row-${index}`),
        userId: pick(r, "userId", "UserId"),
        ip: pick(r, "ipAddress", "IpAddress"),
        table: String(pick(r, "tableName", "TableName") ?? ""),
        action: String(pick(r, "actionType", "ActionType") ?? ""),
        key: keyText(pick(r, "primaryKey", "PrimaryKey")),
        oldValues: parseValues(pick(r, "oldValues", "OldValues")),
        newValues: parseValues(pick(r, "newValues", "NewValues")),
        time: toDate(pick(r, "timestamp", "Timestamp")),
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

export const shortId = (id) => (id ? String(id).slice(0, 8) : "-");

export function formatValue(field, value) {
    if (value === undefined) return "";
    if (value === null) return "null";
    if (SENSITIVE.test(field)) return "••••••";
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function buildDiff(log) {
    const before = log.oldValues || {};
    const after = log.newValues || {};
    const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    return fields.map((field) => ({
        field,
        before: before[field],
        after: after[field],
        changed: JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    }));
}

export function countByKind(logs) {
    const out = { total: logs.length, create: 0, update: 0, delete: 0 };
    for (const l of logs) {
        const k = actionKind(l.action);
        if (k in out) out[k] += 1;
    }
    return out;
}

const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function auditToCsv(logs) {
    const rows = [["Time (UTC)", "Action", "Table", "Record", "User", "IP address", "Old values", "New values"]];
    for (const l of logs) {
        rows.push([
            l.time ? l.time.toISOString() : "",
            l.action,
            l.table,
            l.key,
            l.userId ?? "",
            l.ip ?? "",
            l.oldValues ? JSON.stringify(Object.fromEntries(Object.entries(l.oldValues).map(([k, v]) => [k, formatValue(k, v)]))) : "",
            l.newValues ? JSON.stringify(Object.fromEntries(Object.entries(l.newValues).map(([k, v]) => [k, formatValue(k, v)]))) : "",
        ]);
    }
    return rows.map((r) => r.map(cell).join(",")).join("\n");
}
