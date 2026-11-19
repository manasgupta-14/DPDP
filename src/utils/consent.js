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
    Unknown: "Not recorded",
};

// Backend purpose na mile to naam "Unknown" bhejta hai (ConsentPurpose?.ShortName ?? "Unknown")
export const REMOVED_PURPOSE = "Removed purpose";
const purposeName = (v) => {
    const t = String(v ?? "").trim();
    return !t || /^unknown$/i.test(t) ? REMOVED_PURPOSE : t;
};

export const PURPOSE_STATE = { allowed: "Allowed", denied: "Not allowed", withdrawn: "Withdrawn", expired: "Expired" };

export const MISSING = "Not recorded";

export const NOT_IN_API = "-";

// Backend abhi har consent par ek hi fixed naam ("general_service_notice_v1") bhejta hai, asli notice nahi.
// Use asli notice ki tarah nahi dikhate; jab backend asli notice code bhejega, wo apne aap dikhega.
const PLACEHOLDER_NOTICES = new Set(["general_service_notice_v1"]);
const realNotice = (v) => (v && !PLACEHOLDER_NOTICES.has(String(v).trim().toLowerCase()) ? v : "");
export const NOT_IN_API_HINT = "";
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
    // Backend history me purpose ka ID nahi aata, sirf naam. Aur backend har record me org ke SAARE purposes
    // (edit se pehle wale purane versions bhi) save karta hai, isliye ek naam ki kai entries ho sakti hain.
    // Pehle hum inhe kram se jodte the; DB ka kram badalne par decisions aapas me badal jaate the
    // (ek Allow dabao to baaki bhi badal jaate). Ab ek naam = ek entry, aur use ACTIVE purpose se jodte hain.
    const key = (n) => String(n || "").trim().toLowerCase();
    const byName = new Map();
    purposes.forEach((p) => {
        const k = key(p.name);
        const cur = byName.get(k);
        // active purpose ko pehle, fir naya version
        if (!cur || (p.active && !cur.active) || (p.active === cur.active && (p.version || 1) > (cur.version || 1))) byName.set(k, p);
    });
    const id = String(pick(record, ["consentRecordId", "id", "receiptId"]) ?? `record-${index}`);
    const backendVersion = Number(pick(record, ["version"]) ?? 1);
    const rawStatus = pick(record, ["status"]) ?? "Unknown";
    const recordStatus = rawStatus === CONSENT_STATUS.withdrawn && backendVersion <= 1 ? CONSENT_STATUS.declined : rawStatus;
    const rawList = record?.purposes ?? record?.Purposes ?? record?.decisions ?? record?.Decisions;
    const list = Array.isArray(rawList) ? rawList : [];

    // Ek naam ke saare versions (v1, v2, ...) purane se naye kram me
    const versionsByName = new Map();
    purposes.forEach((p) => {
        const k = key(p.name);
        if (!versionsByName.has(k)) versionsByName.set(k, []);
        versionsByName.get(k).push(p);
    });
    versionsByName.forEach((arr) => arr.sort((a, b) => (a.version || 1) - (b.version || 1)));

    const groups = new Map();
    list.forEach((d, i) => {
        const name = purposeName(pick(d, ["shortName", "name", "purpose"]));
        const rawId = pick(d, ["consentPurposeId"]);
        const known = rawId ? purposes.find((p) => p.id === String(rawId)) : byName.get(key(name));
        const purposeId = String(rawId ?? known?.id ?? `${name}-${i}`);
        const gk = rawId ? `id:${rawId}` : `name:${key(name)}`;
        const decision = String(pick(d, ["decision"]) ?? "No").toLowerCase() === "yes" ? "Yes" : "No";
        const item = { name, known, purposeId, decision, status: pick(d, ["status"]), expiresAt: pick(d, ["expiryDate", "expiresAt"]), code: pick(d, ["code"]), mandatory: pick(d, ["isMandatory"]) };
        const prev = groups.get(gk);
        if (!prev) {
            groups.set(gk, { ...item, yes: decision === "Yes" ? 1 : 0, count: 1 });
            return;
        }
        prev.count += 1;
        if (decision === "Yes") prev.yes += 1;
        if (!prev.expiresAt && item.expiresAt) prev.expiresAt = item.expiresAt;
    });

    // Backend har record me org ke SAARE purpose versions likhta hai: purane (inactive) version par "No",
    // lekin agar purana version mandatory tha to us par hamesha "Yes". Pehle "Yes jeetegi" rule tha, isliye
    // Payment Processing jaise purpose par purane mandatory version ka "Yes" user ke "No" ko daba deta tha
    // -> "Stop allowing" kabhi "Allow" nahi banta tha aur poori history me wo "Allowed" dikhta tha.
    // Ab: record me jitni entries hain utne versions us samay maujood the (v1..vN). Purane versions (v1..vN-1)
    // ke forced "Yes" ginkar ghatao; jo bacha wahi user ka asli faisla hai (sabse naya version).
    groups.forEach((g, gk) => {
        if (g.count > 1 && gk.startsWith("name:")) {
            const versions = versionsByName.get(key(g.name)) || [];
            if (versions.length >= g.count) {
                const older = versions.slice(0, g.count - 1);
                const forcedYes = older.filter((p) => p.mandatory).length;
                g.decision = g.yes - forcedYes > 0 ? "Yes" : "No";
                // Har version par ek hi ID rahe (active wali), taaki history ke versions aapas me mil sakein
                const canonical = byName.get(key(g.name))?.id;
                if (canonical) g.purposeId = canonical;
            } else {
                g.decision = g.yes > 0 ? "Yes" : "No";
            }
        }
    });

    const mapped = [...groups.values()].map((g) => {
        const state = purposeState(g.decision, g.status, g.expiresAt, recordStatus);
        return {
            id: `${id}:${g.purposeId}`,
            purposeId: g.purposeId,
            code: String(g.code ?? g.known?.code ?? ""),
            name: g.name,
            mandatory: !!(g.mandatory ?? g.known?.mandatory),
            decision: g.decision,
            state,
            allowed: state === PURPOSE_STATE.allowed,
            expiresAt: g.expiresAt,
        };
    });

    return {
        id,
        reference: String(pick(record, ["referenceNumber", "reference", "receiptId", "receipt"]) ?? id),
        receiptId: pick(record, ["receiptId", "receipt"]),
        principalId: String(pick(record, ["dataPrincipalId", "dataPrincipal"]) ?? principalId ?? ""),
        notice: realNotice(pick(record, ["notice"])),
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

export function normalizeConsentRecord(record, index = 0, knownPurposes = []) {
    const rawStatus = rawKey(record, "overallStatus") ?? rawKey(record, "status");
    const status = typeof rawStatus === "number" ? RECORD_STATUS_NAMES[rawStatus] ?? "Unknown" : rawStatus ?? "Unknown";
    const id = String(pick(record, ["consentRecordId", "id", "receiptId"]) ?? `record-${index}`);
    const details = listOf(rawKey(record, "consentDetails") ?? rawKey(record, "purposes") ?? rawKey(record, "decisions"));
    const all = details.map((d, i) => {
        const purpose = rawKey(d, "consentPurpose") ?? d;
        const purposeId = String(pick(d, ["consentPurposeId"]) ?? pick(purpose, ["consentPurposeId"]) ?? purposeName(pick(purpose, ["shortName", "name", "purpose"])) ?? `${id}-${i}`);
        const decision = String(pick(d, ["decision"]) ?? "No").toLowerCase() === "yes" ? "Yes" : "No";
        const expiresAt = pick(d, ["expiryDate"]);
        const detailStatus = pick(d, ["status"]);
        const state = purposeState(decision, detailStatus, expiresAt, status);
        return {
            id: `${id}:${purposeId}`,
            detailStatus,
            purposeId,
            code: String(pick(purpose, ["code"]) ?? ""),
            name: purposeName(pick(purpose, ["shortName", "name", "purpose"])),
            mandatory: !!pick(purpose, ["isMandatory"]),
            lapses: !!pick(purpose, ["doesConsentLapse"]),
            decision,
            state,
            allowed: state === PURPOSE_STATE.allowed,
            expiresAt,
        };
    });
    // Backend har record me org ke saare purposes (edit se pehle wale purane versions bhi) rakhta hai, aur ID nahi bhejta.
    // Ek naam ki kai entries aati thi -> React me "same key" warning aur list me dohra naam. Ab ek ID/naam = ek entry,
    // aur "Yes" wali jeetegi (purane inactive versions par backend hamesha "No" rakhta hai).
    const seen = new Map();
    all.forEach((p) => {
        const k = p.purposeId.trim().toLowerCase();
        const prev = seen.get(k);
        if (!prev) seen.set(k, { ...p, yes: p.decision === "Yes" ? 1 : 0, count: 1 });
        else {
            prev.count += 1;
            if (p.decision === "Yes") prev.yes += 1;
        }
    });
    // Purane mandatory versions ka forced "Yes" user ke faisle ko na dabaye (normalizeConsentArtifact wala hi niyam)
    const nameKey = (n) => String(n || "").trim().toLowerCase();
    const purposes = [...seen.values()].map(({ yes, count, ...p }) => {
        if (count <= 1 || !Array.isArray(knownPurposes)) return p;
        const versions = knownPurposes.filter((x) => nameKey(x.name) === nameKey(p.name)).sort((a, b) => (a.version || 1) - (b.version || 1));
        const decision = versions.length >= count
            ? (yes - versions.slice(0, count - 1).filter((x) => x.mandatory).length > 0 ? "Yes" : "No")
            : (yes > 0 ? "Yes" : "No");
        const state = purposeState(decision, p.detailStatus, p.expiresAt, status);
        return { ...p, decision, state, allowed: state === PURPOSE_STATE.allowed };
    });
    const lapsing = purposes.filter((p) => p.lapses && p.expiresAt).map((p) => toDate(p.expiresAt)?.getTime()).filter(Boolean);
    const apiExpires = pick(record, ["expiresAt", "expires"]);
    return {
        id,
        reference: String(pick(record, ["referenceNumber", "reference", "receiptId", "receipt"]) ?? id),
        receiptId: pick(record, ["receiptId", "receipt"]),
        principalId: String(pick(record, ["dataPrincipalId", "dataPrincipal"]) ?? ""),
        notice: realNotice(pick(record, ["notice"])),
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
