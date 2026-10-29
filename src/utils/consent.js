import { toDate } from "./audit.js";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

// Backend ConsentStatus enum ke naam (OverallStatus.ToString())
export const CONSENT_STATUS = {
    granted: "Granted",
    partial: "PartiallyGranted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    expired: "Expired",
};

export const STATUS_LABEL = {
    Granted: "Granted",
    PartiallyGranted: "Partially granted",
    Declined: "Declined",
    Withdrawn: "Withdrawn",
    Expired: "Expired",
    Unknown: "Unknown",
};

// Ek purpose ka haal: user ne allow kiya, mana kiya, wapas liya, ya expire ho gaya
export const PURPOSE_STATE = { allowed: "Allowed", denied: "Not allowed", withdrawn: "Withdrawn", expired: "Expired" };

export const MISSING = "Not recorded";

const QUESTIONS = {
    en: { name: "Can we use your name?", email: "Can we use your email address?", phone: "Can we use your phone number?" },
    hi: { name: "क्या हम आपका नाम इस्तेमाल कर सकते हैं?", email: "क्या हम आपका ईमेल पता इस्तेमाल कर सकते हैं?", phone: "क्या हम आपका फ़ोन नंबर इस्तेमाल कर सकते हैं?" },
};

export function questionFor(purpose, lang = "en") {
    const key = `${purpose?.code || ""} ${purpose?.name || ""}`.toLowerCase();
    const set = QUESTIONS[lang] || QUESTIONS.en;
    if (/\bname\b/.test(key)) return set.name;
    if (/e-?mail/.test(key)) return set.email;
    if (/phone|mobile|number/.test(key)) return set.phone;
    return purpose?.name || "Purpose";
}

const CHANNEL_LABEL = { Web: "Web", MobileApp: "Mobile App", CallCentre: "Call Centre" };
export const channelLabel = (value) => (value ? CHANNEL_LABEL[value] || String(value) : null);

// GET /api/Consent/purposes ka ek item
export function normalizePurpose(p) {
    return {
        id: String(pick(p, ["consentPurposeId", "id"]) ?? ""),
        code: String(pick(p, ["code"]) ?? ""),
        name: String(pick(p, ["shortName", "name"]) ?? "Purpose"),
        mandatory: !!pick(p, ["isMandatory"]),
        legalBasis: String(pick(p, ["legalBasis"]) ?? ""),
    };
}

function purposeState(decision, status, expiresAt, recordStatus) {
    const s = String(status || "").toLowerCase();
    if (s === "withdrawn" || String(recordStatus || "").toLowerCase() === "withdrawn") return PURPOSE_STATE.withdrawn;
    if (String(decision || "").toLowerCase() !== "yes") return PURPOSE_STATE.denied;
    const exp = toDate(expiresAt);
    if (exp && exp.getTime() < Date.now()) return PURPOSE_STATE.expired;
    return PURPOSE_STATE.allowed;
}

// Backend latest/history sirf { shortName, decision } deta hai (purpose id nahi). Isliye naam se purposes list mein dhoondhte hain.
// purposes: getPurposes() ki normalised list (id, code, name, mandatory)
export function normalizeConsentArtifact(record, index = 0, purposes = [], principalId = "") {
    const byName = new Map(purposes.map((p) => [p.name.trim().toLowerCase(), p]));
    const id = String(pick(record, ["consentRecordId", "id", "receiptId"]) ?? `record-${index}`);
    const backendVersion = Number(pick(record, ["version"]) ?? 1);
    const rawStatus = pick(record, ["status"]) ?? "Unknown";
    const recordStatus = rawStatus === CONSENT_STATUS.withdrawn && backendVersion <= 1 ? CONSENT_STATUS.declined : rawStatus;
    const rawList = record?.purposes ?? record?.Purposes ?? record?.decisions ?? record?.Decisions;
    const list = Array.isArray(rawList) ? rawList : [];
    const mapped = list.map((d, i) => {
        const name = String(pick(d, ["shortName", "name"]) ?? "Purpose");
        const known = byName.get(name.trim().toLowerCase());
        const purposeId = String(pick(d, ["consentPurposeId"]) ?? known?.id ?? `${name}-${i}`);
        const decision = String(pick(d, ["decision"]) ?? "No");
        const expiresAt = pick(d, ["expiryDate", "expiresAt"]);
        const state = purposeState(decision, pick(d, ["status"]), expiresAt, recordStatus);
        return {
            id: `${id}:${purposeId}`,
            purposeId,
            code: String(pick(d, ["code"]) ?? known?.code ?? ""),
            name,
            mandatory: !!(pick(d, ["isMandatory"]) ?? known?.mandatory),
            decision: decision.toLowerCase() === "yes" ? "Yes" : "No",
            state,
            allowed: state === PURPOSE_STATE.allowed,
            expiresAt,
        };
    });

    return {
        id,
        reference: String(pick(record, ["referenceNumber", "receiptId"]) ?? id),
        receiptId: pick(record, ["receiptId"]),
        principalId: String(pick(record, ["dataPrincipalId"]) ?? principalId ?? ""),
        principalName: pick(record, ["principalName"]),
        status: recordStatus,
        purposes: mapped,
        channel: channelLabel(pick(record, ["channel"])),
        language: pick(record, ["language"]),
        version: backendVersion,
        previousId: pick(record, ["previousRecordId"]),
        hash: pick(record, ["artifactHash"]),
        signature: pick(record, ["digitalSignature"]),
        keyId: pick(record, ["keyId"]),
        submittedAt: pick(record, ["createdAt"]),
        expiresAt: pick(record, ["expiresAt"]),
    };
}

export const allowedPurposes = (c) => c.purposes.filter((p) => p.allowed);
export const notAllowedPurposes = (c) => c.purposes.filter((p) => !p.allowed);

// Admin table: har user ka sirf sabse naya consent ek row banta hai; uske purane consent detail ki History mein dikhte hain.
// (Backend har naye submit par naya reference banata hai, isliye user (principal) se group karte hain.)
export function latestPerPrincipal(artifacts) {
    const byUser = new Map();
    for (const a of artifacts) {
        if (!byUser.has(a.principalId)) byUser.set(a.principalId, []);
        byUser.get(a.principalId).push(a);
    }
    return [...byUser.values()].map((versions) => {
        const sorted = [...versions].sort((x, y) => (toDate(y.submittedAt)?.getTime() ?? 0) - (toDate(x.submittedAt)?.getTime() ?? 0));
        return { ...sorted[0], versions: sorted };
    });
}

// Do versions ke beech kaunse purposes ka faisla badla
function changesBetween(current, previous) {
    if (!previous) return [];
    const before = new Map(previous.purposes.map((p) => [p.purposeId, p]));
    return current.purposes
        .filter((p) => before.has(p.purposeId) && before.get(p.purposeId).allowed !== p.allowed)
        .map((p) => `${p.name}: ${before.get(p.purposeId).allowed ? "allowed" : "not allowed"} -> ${p.allowed ? "allowed" : "not allowed"}`);
}

// History sirf un versions se bante hain jo backend mein sach mein store hain.
export function artifactHistory(artifact) {
    const versions = artifact.versions?.length ? artifact.versions : [artifact];
    return versions.map((v, i) => {
        const older = versions[i + 1];
        const total = v.purposes.length;
        const yes = allowedPurposes(v).length;
        let title = "Consent given";
        if (v.status === CONSENT_STATUS.withdrawn) title = "Consent withdrawn";
        else if (older) title = "Consent updated";
        const changes = changesBetween(v, older);
        return {
            id: v.id,
            title,
            detail: v.status === CONSENT_STATUS.withdrawn ? "All purposes withdrawn" : `${yes} of ${total} purpose${total === 1 ? "" : "s"} allowed`,
            changes,
            version: v.version,
            channel: v.channel,
            at: v.submittedAt,
        };
    });
}

const pad = (n) => String(n).padStart(2, "0");

export function formatDay(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

export function formatClock(value) {
    const d = toDate(value);
    return d ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase() : "";
}

export const formatStamp = (value) => (toDate(value) ? `${formatDay(value)}, ${formatClock(value)}` : "");

export const expiryText = (value) => formatDay(value) || MISSING;

// yyyy-mm-dd (local) for comparing against <input type="date"> values
export function dayKey(value) {
    const d = toDate(value);
    return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "";
}

export const shortId = (id) => (id ? String(id).slice(0, 8) : "-");

const csvCell = (value) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function consentsToCsv(rows) {
    const header = ["Receipt", "Data principal", "Data principal id", "Status", "Allowed purposes", "Not allowed purposes", "Given", "Version"];
    const lines = rows.map((r) => [
        r.reference,
        r.principalName || "",
        r.principalId,
        STATUS_LABEL[r.status] || r.status,
        allowedPurposes(r).map((p) => p.name).join("; "),
        notAllowedPurposes(r).map((p) => p.name).join("; "),
        r.submittedAt ? new Date(toDate(r.submittedAt)).toISOString() : "",
        r.version,
    ]);
    return [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(text, filename) {
    const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
