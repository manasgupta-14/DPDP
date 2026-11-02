import { toDate } from "./audit.js";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

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

export const PURPOSE_STATE = { allowed: "Allowed", denied: "Not allowed", withdrawn: "Withdrawn", expired: "Expired" };

export const MISSING = "Not recorded";

export const NOT_IN_API = "Not in API";
export const NOT_IN_API_HINT = "The frontend is ready for this field, but the backend API does not return it yet.";
export const NOT_SET = "Not set";

const rawKey = (obj, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    const upper = key.charAt(0).toUpperCase() + key.slice(1);
    return obj && Object.prototype.hasOwnProperty.call(obj, upper) ? obj[upper] : undefined;
};

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

const CHANNEL_NAMES = ["Web", "MobileApp", "CallCentre"];
const CHANNEL_LABEL = { Web: "Web", MobileApp: "Mobile App", CallCentre: "Call Centre" };
export const CHANNEL_OPTIONS = CHANNEL_NAMES.map((value) => ({ value, label: CHANNEL_LABEL[value] }));
export const channelLabel = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const name = typeof value === "number" ? CHANNEL_NAMES[value] : value;
    return CHANNEL_LABEL[name] || String(name);
};

export const RECORD_STATUS_OPTIONS = ["Granted", "PartiallyGranted", "Withdrawn", "Expired"];
const RECORD_STATUS_NAMES = RECORD_STATUS_OPTIONS;

const listOf = (v) => (Array.isArray(v) ? v : []);
const optionalText = (v) => (v === undefined ? undefined : v === null ? "" : String(v));

function linkedNames(rows, nested, nameKeys) {
    return listOf(rows)
        .map((row) => {
            const inner = rawKey(row, nested) ?? row;
            const name = pick(inner, nameKeys);
            return name ? { id: String(pick(inner, [nested + "Id", "id"]) ?? name), name: String(name), code: String(pick(inner, ["code"]) ?? ""), raw: inner } : null;
        })
        .filter(Boolean);
}

export function normalizePurpose(p) {
    const description = rawKey(p, "description");
    const legalBasis = rawKey(p, "legalBasis");
    const retention = rawKey(p, "retentionPeriod");
    const lapses = rawKey(p, "doesConsentLapse");
    const risk = rawKey(p, "riskLevel");
    return {
        id: String(pick(p, ["consentPurposeId", "id"]) ?? ""),
        code: String(pick(p, ["code"]) ?? ""),
        name: String(pick(p, ["shortName", "name"]) ?? "Purpose"),
        mandatory: !!pick(p, ["isMandatory"]),
        active: rawKey(p, "isActive") === undefined || rawKey(p, "isActive") === null ? true : !!rawKey(p, "isActive"),
        prohibitedForChildren: rawKey(p, "isProhibitedForChildren") === undefined || rawKey(p, "isProhibitedForChildren") === null ? undefined : !!rawKey(p, "isProhibitedForChildren"),
        version: Number(pick(p, ["version"]) ?? 1),
        description: description === undefined || description === null ? undefined : String(description),
        legalBasis: legalBasis === undefined || legalBasis === null ? undefined : String(legalBasis),
        retention: retention === undefined || retention === null ? undefined : String(retention),
        lapses: lapses === undefined || lapses === null ? undefined : !!lapses,
        risk: risk === undefined || risk === null ? undefined : String(risk),
        categories: linkedNames(rawKey(p, "categories"), "dataCategory", ["name", "category"]),
        processors: linkedNames(rawKey(p, "processors"), "dataProcessor", ["legalName", "processor", "name"]),
        categoryLinks: listOf(rawKey(p, "categories")).length,
        processorLinks: listOf(rawKey(p, "processors")).length,
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

export function normalizeConsentArtifact(record, index = 0, purposes = [], principalId = "") {
    // API purpose id nahi bhejti, naam se match hota hai. Same naam ke purposes ho toh ek-ek karke match karte hain.
    const nameQueues = new Map();
    const lastByName = new Map();
    purposes.forEach((p) => {
        const key = p.name.trim().toLowerCase();
        if (!nameQueues.has(key)) nameQueues.set(key, []);
        nameQueues.get(key).push(p);
        lastByName.set(key, p);
    });
    const takeByName = (key) => {
        const queue = nameQueues.get(key);
        return queue && queue.length ? queue.shift() : lastByName.get(key);
    };
    const id = String(pick(record, ["consentRecordId", "id", "receiptId"]) ?? `record-${index}`);
    const backendVersion = Number(pick(record, ["version"]) ?? 1);
    const rawStatus = pick(record, ["status"]) ?? "Unknown";
    const recordStatus = rawStatus === CONSENT_STATUS.withdrawn && backendVersion <= 1 ? CONSENT_STATUS.declined : rawStatus;
    const rawList = record?.purposes ?? record?.Purposes ?? record?.decisions ?? record?.Decisions;
    const list = Array.isArray(rawList) ? rawList : [];
    const mapped = list.map((d, i) => {
        const name = String(pick(d, ["shortName", "name", "purpose"]) ?? "Purpose");
        const known = pick(d, ["consentPurposeId"]) ? purposes.find((p) => p.id === String(pick(d, ["consentPurposeId"]))) : takeByName(name.trim().toLowerCase());
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
        reference: String(pick(record, ["referenceNumber", "reference", "receiptId", "receipt"]) ?? id),
        receiptId: pick(record, ["receiptId", "receipt"]),
        principalId: String(pick(record, ["dataPrincipalId", "dataPrincipal"]) ?? principalId ?? ""),
        notice: pick(record, ["notice"]),
        status: recordStatus,
        purposes: mapped,
        channel: channelLabel(pick(record, ["channel"])),
        language: pick(record, ["language"]),
        version: backendVersion,
        previousId: pick(record, ["previousRecordId"]),
        hash: pick(record, ["artifactHash", "hash"]),
        signature: pick(record, ["digitalSignature", "signature"]),
        keyId: pick(record, ["keyId"]),
        submittedAt: pick(record, ["createdAt", "given"]),
        expiresAt: pick(record, ["expiresAt", "expires"]),
    };
}

export function normalizeCategory(c) {
    return {
        id: String(pick(c, ["dataCategoryId", "id"]) ?? ""),
        name: String(pick(c, ["name", "category"]) ?? "Category"),
        code: String(pick(c, ["code"]) ?? ""),
        sensitivity: optionalText(rawKey(c, "sensitivity")),
        description: optionalText(rawKey(c, "description")),
    };
}

export function normalizeProcessor(p) {
    return {
        id: String(pick(p, ["dataProcessorId", "id"]) ?? ""),
        name: String(pick(p, ["legalName", "processor", "name"]) ?? "Processor"),
        code: String(pick(p, ["code"]) ?? ""),
        relationship: optionalText(rawKey(p, "relationship")),
        country: optionalText(rawKey(p, "country") ?? rawKey(p, "location")),
        leavesIndia: rawKey(p, "dataLeavesIndia") === undefined ? undefined : !!rawKey(p, "dataLeavesIndia"),
    };
}

export function normalizeConsentRecord(record, index = 0) {
    const rawStatus = rawKey(record, "overallStatus") ?? rawKey(record, "status");
    const status = typeof rawStatus === "number" ? RECORD_STATUS_NAMES[rawStatus] ?? "Unknown" : rawStatus ?? "Unknown";
    const id = String(pick(record, ["consentRecordId", "id", "receiptId"]) ?? `record-${index}`);
    // API ab Purposes / Decisions ([{purpose, decision, status}]) bhejti hai; purani shape (consentDetails) bhi chalti rehti hai.
    const details = listOf(rawKey(record, "consentDetails") ?? rawKey(record, "purposes") ?? rawKey(record, "decisions"));
    const purposes = details.map((d, i) => {
        const purpose = rawKey(d, "consentPurpose") ?? d;
        const purposeId = String(pick(d, ["consentPurposeId"]) ?? pick(purpose, ["shortName", "name", "purpose"]) ?? `${id}-${i}`);
        const decision = String(pick(d, ["decision"]) ?? "No").toLowerCase() === "yes" ? "Yes" : "No";
        const expiresAt = pick(d, ["expiryDate"]);
        const state = purposeState(decision, pick(d, ["status"]), expiresAt, status);
        return {
            id: `${id}:${purposeId}`,
            purposeId,
            code: String(pick(purpose, ["code"]) ?? ""),
            name: String(pick(purpose, ["shortName", "name", "purpose"]) ?? "Purpose"),
            mandatory: !!pick(purpose, ["isMandatory"]),
            lapses: !!pick(purpose, ["doesConsentLapse"]),
            decision,
            state,
            allowed: state === PURPOSE_STATE.allowed,
            expiresAt,
        };
    });
    const lapsing = purposes.filter((p) => p.lapses && p.expiresAt).map((p) => toDate(p.expiresAt)?.getTime()).filter(Boolean);
    const apiExpires = pick(record, ["expiresAt", "expires"]);
    return {
        id,
        reference: String(pick(record, ["referenceNumber", "reference", "receiptId", "receipt"]) ?? id),
        receiptId: pick(record, ["receiptId", "receipt"]),
        principalId: String(pick(record, ["dataPrincipalId", "dataPrincipal"]) ?? ""),
        notice: pick(record, ["notice"]),
        status,
        purposes,
        channel: channelLabel(rawKey(record, "channel")),
        language: pick(record, ["language"]),
        version: Number(pick(record, ["version"]) ?? 1),
        previousId: pick(record, ["previousRecordId"]),
        hash: pick(record, ["artifactHash", "hash"]),
        signature: pick(record, ["digitalSignature", "signature"]),
        keyId: pick(record, ["keyId"]),
        submittedAt: pick(record, ["createdAt", "given"]),
        expiresAt: apiExpires ?? (lapsing.length ? new Date(Math.min(...lapsing)).toISOString() : null),
        lapses: !!apiExpires || purposes.some((p) => p.lapses),
    };
}

export function withVersions(records) {
    const groups = new Map();
    for (const r of records) {
        if (!groups.has(r.reference)) groups.set(r.reference, []);
        groups.get(r.reference).push(r);
    }
    const time = (r) => toDate(r.submittedAt)?.getTime() ?? 0;
    return records.map((r) => ({ ...r, versions: [...groups.get(r.reference)].sort((a, b) => time(b) - time(a)) }));
}

export const allowedPurposes = (c) => c.purposes.filter((p) => p.allowed);
export const notAllowedPurposes = (c) => c.purposes.filter((p) => !p.allowed);

function changesBetween(current, previous) {
    if (!previous) return [];
    const before = new Map(previous.purposes.map((p) => [p.purposeId, p]));
    return current.purposes
        .filter((p) => before.has(p.purposeId) && before.get(p.purposeId).allowed !== p.allowed)
        .map((p) => `${p.name}: ${before.get(p.purposeId).allowed ? "allowed" : "not allowed"} -> ${p.allowed ? "allowed" : "not allowed"}`);
}

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
    const header = ["Reference", "Receipt", "Data principal id", "Status", "Allowed purposes", "Not allowed purposes", "Channel", "Language", "Given", "Expires", "Version"];
    const lines = rows.map((r) => [
        r.reference,
        r.receiptId || "",
        r.principalId,
        STATUS_LABEL[r.status] || r.status,
        allowedPurposes(r).map((p) => p.name).join("; "),
        notAllowedPurposes(r).map((p) => p.name).join("; "),
        r.channel || "",
        r.language || "",
        r.submittedAt ? new Date(toDate(r.submittedAt)).toISOString() : "",
        r.expiresAt ? new Date(toDate(r.expiresAt)).toISOString() : r.lapses ? "" : "Does not lapse",
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
