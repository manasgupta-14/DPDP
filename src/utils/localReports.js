const key = (email) => `pg:my-reports:${String(email || "anon").toLowerCase()}`;

export function loadLocalReports(email) {
    try {
        const list = JSON.parse(localStorage.getItem(key(email)) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

export function addLocalReport(email, report) {
    try {
        const next = [{ ...report, local: true }, ...loadLocalReports(email)].slice(0, 50);
        localStorage.setItem(key(email), JSON.stringify(next));
        return true;
    } catch {
        return false;
    }
}

const triageKey = "pg:triage-overlay";
const fingerprint = (r) => `${String(r?.title ?? "").trim().toLowerCase()}|${String(r?.description ?? "").trim().toLowerCase()}`;

function readTriage() {
    try {
        const map = JSON.parse(localStorage.getItem(triageKey) || "{}");
        return map && typeof map === "object" ? map : {};
    } catch {
        return {};
    }
}

export function saveTriage(incident, patch) {
    if (!incident) return;
    try {
        const map = readTriage();
        const k = fingerprint(incident);
        const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined && v !== null && v !== ""));
        map[k] = { ...map[k], ...clean };
        localStorage.setItem(triageKey, JSON.stringify(map));
    } catch {
        return;
    }
}

export function applyTriage(report) {
    const t = readTriage()[fingerprint(report)];
    return t ? { ...report, ...t } : report;
}
