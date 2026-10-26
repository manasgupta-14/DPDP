
import { toDate } from "./audit.js";

const ID_KEY = /(^id$|Id$|ID$|_id$)/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
const PCT_KEY = /percent|pct|rate|coverage|ratio/i;
const DATE_KEY = /date|day|month|week|period|time|(^|[a-z])At$/;

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isText = (k, v) => typeof v === "string" && v !== "" && !ID_KEY.test(k) && !GUID.test(v);
const looksDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v));

export function humanize(key) {
    return String(key)
        .replace(/\$values/g, "")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_.-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatValue(metric) {
    const v = metric.value;
    if (PCT_KEY.test(metric.key)) {
        const pct = v > 0 && v <= 1 && !Number.isInteger(v) ? v * 100 : v;
        return `${Math.round(pct * 10) / 10}%`;
    }
    return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function formatLabel(value) {
    if (looksDate(value)) {
        return toDate(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    }
    return humanize(value);
}

function unwrap(raw) {
    let v = raw;
    for (let i = 0; i < 3; i++) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
            const keys = Object.keys(v);
            if (keys.length === 1 && v[keys[0]] && typeof v[keys[0]] === "object" && !Array.isArray(v[keys[0]])) {
                v = v[keys[0]];
                continue;
            }
        }
        break;
    }
    return v && typeof v === "object" ? v : {};
}

function collect(obj, path, depth, out) {
    for (const [k, v] of Object.entries(obj)) {
        if (v == null || typeof v === "boolean" || k === "$id") continue;
        const parts = [...path, k];
        if (isNum(v)) {
            if (!ID_KEY.test(k)) {
                out.metrics.push({ key: parts.join("."), label: humanize(parts.join(" ")), value: v, group: path.length ? humanize(path.join(" ")) : "" });
            }
        } else if (typeof v === "string") {
            out.strings.push({ key: k, value: v });
        } else if (Array.isArray(v)) {
            out.arrays.push({ key: k, label: humanize(k), rows: v });
        } else if (typeof v === "object") {
            const entries = Object.entries(v).filter(([name]) => name !== "$id");
            if (entries.length >= 4 && entries.every(([, x]) => isNum(x))) {
                out.arrays.push({ key: k, label: humanize(k), rows: entries.map(([name, value]) => ({ name, value })) });
            } else if (Array.isArray(v.$values)) {
                out.arrays.push({ key: k, label: humanize(k), rows: v.$values });
            } else if (depth < 2) {
                collect(v, parts, depth + 1, out);
            }
        }
    }
}

function monthsOrDates(rows, labelKey) {
    const times = rows.map((r) => Date.parse(r[labelKey]));
    if (times.every((t) => !Number.isNaN(t))) return [...rows].sort((a, b) => Date.parse(a[labelKey]) - Date.parse(b[labelKey]));
    return rows;
}

function classify(arr) {
    const rows = arr.rows.filter((r) => r && typeof r === "object");
    if (rows.length === 0) return null;
    const keys = Object.keys(rows[0]).filter((k) => k !== "$id");
    const numKeys = keys.filter((k) => isNum(rows[0][k]) && !ID_KEY.test(k));
    const textKeys = keys.filter((k) => isText(k, rows[0][k]));

    if (numKeys.length === 0) {
        if (textKeys.length === 0) return null;
        const titleKey = textKeys.find((k) => /title|message|description|action|event|name/i.test(k)) ?? textKeys[0];
        const dateKey = textKeys.find((k) => k !== titleKey && (DATE_KEY.test(k) || looksDate(rows[0][k])));
        const otherKey = textKeys.find((k) => k !== titleKey && k !== dateKey);
        return {
            type: "list",
            id: arr.key,
            title: arr.label,
            items: rows.slice(0, 8).map((r) => ({
                title: String(r[titleKey]),
                meta: [otherKey && r[otherKey], dateKey && (looksDate(r[dateKey]) ? toDate(r[dateKey]).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : r[dateKey])].filter(Boolean).join(" · "),
            })),
        };
    }

    const labelKey =
        textKeys.find((k) => DATE_KEY.test(k)) ??
        textKeys.find((k) => /name|label|type|category|status|kind/i.test(k)) ??
        textKeys[0];
    if (!labelKey) return null;

    const timeLike = DATE_KEY.test(labelKey) || rows.every((r) => looksDate(r[labelKey]));
    if (timeLike && rows.length >= 2) {
        const sorted = monthsOrDates(rows, labelKey);
        return {
            type: "line",
            id: arr.key,
            title: arr.label,
            labels: sorted.map((r) => formatLabel(String(r[labelKey]))),
            series: numKeys.slice(0, 4).map((k) => ({ name: humanize(k), values: sorted.map((r) => Number(r[k]) || 0) })),
        };
    }

    const valueKey = numKeys.find((k) => /count|total|value|number|amount/i.test(k)) ?? numKeys[0];
    let bars = rows.map((r) => ({ label: humanize(String(r[labelKey])), value: Number(r[valueKey]) || 0 }));
    if (bars.length > 8) {
        const top = [...bars].sort((a, b) => b.value - a.value);
        bars = [...top.slice(0, 7), { label: "Other", value: top.slice(7).reduce((s, b) => s + b.value, 0) }];
    }
    return { type: "bar", id: arr.key, title: arr.label, unit: humanize(valueKey), bars };
}

function iconFor(label) {
    const l = label.toLowerCase();
    if (/breach|incident|critical|overdue|violation/.test(l)) return { icon: "alert", tint: "bg-[#DC2626]/10 text-[#DC2626]" };
    if (/consent/.test(l)) return { icon: "consent", tint: "bg-[#CCFBF1] text-[#0F766E]" };
    if (/request|right|grievance|dpr|erasure|access/.test(l)) return { icon: "rights", tint: "bg-[#2A78D6]/10 text-[#2A78D6]" };
    if (/notice|policy|privacy/.test(l)) return { icon: "notice", tint: "bg-[#6250D6]/10 text-[#6250D6]" };
    if (/campaign|task|response|training|awareness/.test(l)) return { icon: "tasks", tint: "bg-[#16A34A]/10 text-[#16A34A]" };
    if (/user|principal|employee|member|admin/.test(l)) return { icon: "adduser", tint: "bg-[#D97706]/15 text-[#B45309]" };
    if (/inventory|data|record/.test(l)) return { icon: "inventory", tint: "bg-[#22D3EE]/15 text-[#0F766E]" };
    return { icon: "checklist", tint: "bg-[#CCFBF1] text-[#0F766E]" };
}

export function normalizeSummary(raw) {
    const root = unwrap(raw);
    const out = { metrics: [], strings: [], arrays: [] };
    collect(root, [], 0, out);

    const scoreAt = out.metrics.findIndex((m) => /score/i.test(m.key));
    const score = scoreAt >= 0 ? out.metrics.splice(scoreAt, 1)[0] : null;

    const org = out.strings.find((s) => /organi[sz]ation.*name|org.*name|company/i.test(s.key))?.value ?? "";

    const cards = out.metrics.map((m) => ({ ...m, display: formatValue(m), ...iconFor(m.label) }));
    const shapes = out.arrays.map(classify).filter(Boolean);

    return {
        raw,
        org,
        score: score ? { value: Math.round(score.value * 10) / 10, label: score.label } : null,
        kpis: cards.slice(0, 4),
        more: cards.slice(4),
        charts: shapes.filter((s) => s.type !== "list"),
        lists: shapes.filter((s) => s.type === "list"),
    };
}

export function summaryToCsv(summary) {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Section", "Item", "Value"]];
    if (summary.score) rows.push(["Summary", summary.score.label, summary.score.value]);
    [...summary.kpis, ...summary.more].forEach((m) => rows.push(["Metrics", m.label, m.display]));
    summary.charts.forEach((c) => {
        if (c.type === "bar") c.bars.forEach((b) => rows.push([c.title, b.label, b.value]));
        else c.labels.forEach((l, i) => c.series.forEach((s) => rows.push([`${c.title} - ${s.name}`, l, s.values[i]])));
    });
    return rows.map((r) => r.map(esc).join(",")).join("\n");
}
