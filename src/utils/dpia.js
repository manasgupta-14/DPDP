import { getProfile } from "../auth/authStore.js";

const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export const STATUS = {
    DRAFT: "Draft",
    PENDING: "Pending Review",
    APPROVED: "Approved",
    CHANGES: "Changes Requested",
    REJECTED: "Rejected",
};
export const STATUS_LIST = Object.values(STATUS);

export function displayStatus(raw) {
    const s = String(raw ?? "").trim().toLowerCase();
    if (s === "draft") return STATUS.DRAFT;
    if (["in review", "pending", "pending review", "submitted"].includes(s)) return STATUS.PENDING;
    if (s === "approved") return STATUS.APPROVED;
    if (["needs changes", "changes requested", "sendback", "sent back"].includes(s)) return STATUS.CHANGES;
    if (s === "rejected") return STATUS.REJECTED;
    return raw ? String(raw) : STATUS.PENDING;
}

export function statusTone(status) {
    switch (status) {
        case STATUS.APPROVED: return "bg-ok/10 text-ok-ink ring-ok/30";
        case STATUS.PENDING: return "bg-warn/15 text-ink ring-warn/40";
        case STATUS.CHANGES: return "bg-brand/15 text-ink ring-focus/50";
        case STATUS.REJECTED: return "bg-bad/10 text-bad-ink ring-bad/30";
        default: return "bg-line text-ink-2 ring-line-strong";
    }
}

export const RISKS = ["Low", "Medium", "High"];
export const riskRank = (r) => RISKS.findIndex((x) => x.toLowerCase() === String(r ?? "").toLowerCase());

export function riskTone(risk) {
    switch (riskRank(risk)) {
        case 0: return "bg-brand-soft text-brand-ink ring-brand/30";
        case 1: return "bg-warn/15 text-ink ring-warn/40";
        case 2: return "bg-bad/10 text-bad-ink ring-bad/30";
        default: return "bg-line text-ink-2 ring-line-strong";
    }
}

export function normalizeDpia(r) {
    return {
        id: pick(r, ["id", "dpiaId"]),
        referenceId: pick(r, ["referenceId"]) || "",
        title: pick(r, ["title"]) || "Untitled DPIA",
        purposesCount: Number(pick(r, ["purposesCount"]) ?? 0),
        residualRisk: pick(r, ["residualRisk"]) || "",
        status: pick(r, ["status"]) || "In Review",
        createdAt: pick(r, ["createdAt", "createdDate"]),
        createdByUserId: pick(r, ["createdByUserId"]),
        reviewedAt: pick(r, ["reviewedAt"]),
        reviewedByUserId: pick(r, ["reviewedByUserId"]),
        reviewNotes: pick(r, ["reviewNotes"]) || "",
        nextReviewDate: pick(r, ["nextReviewDate"]),
        assessmentDetails: pick(r, ["assessmentDetails"]) || "",
        department: pick(r, ["department"]) || "",
    };
}

const SCHEMA = "kavach-dpia/1";
// Purane records (pehle ke naam se save hue) bhi structured hi padhe jaate hain
const LEGACY_SCHEMAS = new Set([SCHEMA, "privy" + "guard-dpia/1"]);

export function emptyForm() {
    return {
        title: "", department: "", description: "",
        dataTypes: "", dataSubjects: "", purposes: [], purposeInput: "",
        retention: "", sharesWithThirdParties: "no", thirdParties: "",
        crossBorder: "no", crossBorderCountries: "",
        inherentRisk: "", residualRisk: "", riskDescription: "", safeguardNotes: "",
        revisionOf: "", confirm: false,
    };
}

export function buildDetails(f) {
    const t = (v) => String(v ?? "").trim();
    return {
        schema: SCHEMA,
        department: t(f.department),
        description: t(f.description),
        dataTypes: t(f.dataTypes),
        dataSubjects: t(f.dataSubjects),
        purposes: f.purposes,
        retention: t(f.retention),
        sharesWithThirdParties: f.sharesWithThirdParties,
        thirdParties: f.sharesWithThirdParties === "yes" ? t(f.thirdParties) : "",
        crossBorder: f.crossBorder,
        crossBorderCountries: f.crossBorder === "yes" ? t(f.crossBorderCountries) : "",
        inherentRisk: f.inherentRisk,
        residualRisk: f.residualRisk,
        riskDescription: t(f.riskDescription),
        safeguardNotes: t(f.safeguardNotes),
        revisionOf: f.revisionOf || "",
    };
}

export function buildPayload(f) {
    return {
        title: f.title.trim(),
        purposesCount: f.purposes.length,
        residualRisk: f.residualRisk,
        assessmentDetails: JSON.stringify(buildDetails(f)),
    };
}

export function decodeDetails(text) {
    try {
        const v = JSON.parse(text);
        if (v && LEGACY_SCHEMAS.has(v.schema)) return { structured: true, details: v };
    } catch {
        return { structured: false, text: String(text ?? "") };
    }
    return { structured: false, text: String(text ?? "") };
}

const joinList = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

export function normalizeForm(f) {
    const form = { ...emptyForm(), ...f };
    form.dataTypes = [joinList(f.dataTypes), f.otherDataType || ""].filter(Boolean).join(", ");
    form.safeguardNotes = [joinList(f.safeguards), f.safeguardNotes || ""].filter(Boolean).join("\n");
    delete form.otherDataType;
    delete form.legalBasis;
    delete form.safeguards;
    return form;
}

export function formFromRecord(record) {
    const decoded = decodeDetails(record.assessmentDetails);
    const base = { ...emptyForm(), title: record.title };
    if (!decoded.structured) return { ...base, description: decoded.text, revisionOf: record.referenceId };
    return { ...normalizeForm(decoded.details), title: record.title, revisionOf: record.referenceId, confirm: false };
}

export const STEPS = ["Project details", "Data processing", "Risk assessment", "Review & submit"];

export function validateStep(step, f) {
    const e = {};
    if (step === 0) {
        if (f.title.trim().length < 3) e.title = "Enter the project or process name (at least 3 characters).";
        else if (f.title.trim().length > 200) e.title = "Keep the name within 200 characters.";
        if (!f.department.trim()) e.department = "Tell us which department's data this is.";
        if (f.description.trim().length < 20) e.description = "Describe the project in at least 20 characters.";
    }
    if (step === 1) {
        if (f.dataTypes.trim().length < 3) e.dataTypes = "List the personal data collected (for example: name, phone number, medical history).";
        if (!f.dataSubjects.trim()) e.dataSubjects = "Say whose data this is (customers, employees, ...).";
        if (!f.purposes.length) e.purposes = f.purposeInput.trim() ? "Press Add to include the purpose you typed." : "Add at least one purpose.";
        if (!f.retention.trim()) e.retention = "Say how long the data is kept.";
        if (f.sharesWithThirdParties === "yes" && !f.thirdParties.trim()) e.thirdParties = "Name who the data is shared with.";
        if (f.crossBorder === "yes" && !f.crossBorderCountries.trim()) e.crossBorderCountries = "Name the countries.";
    }
    if (step === 2) {
        if (!f.inherentRisk) e.inherentRisk = "Select the risk level before safeguards.";
        if (!f.residualRisk) e.residualRisk = "Select the risk level after safeguards.";
        else if (f.inherentRisk && riskRank(f.residualRisk) > riskRank(f.inherentRisk)) e.residualRisk = "Residual risk cannot be higher than the risk before safeguards.";
        if (f.riskDescription.trim().length < 20) e.riskDescription = "Describe what could go wrong if this data leaks (at least 20 characters).";
        if (f.safeguardNotes.trim().length < 10) e.safeguardNotes = "Describe the security measures that reduce this risk (at least 10 characters).";
    }
    if (step === 3 && !f.confirm) e.confirm = "Please confirm the information is accurate before submitting.";
    return e;
}

function draftKey() {
    const p = getProfile();
    return `pg_dpia_drafts:${p?.organizationId ?? "org"}:${p?.userId ?? "user"}`;
}

function readDrafts() {
    try {
        const list = JSON.parse(localStorage.getItem(draftKey()) || "[]");
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeDrafts(list) {
    try {
        localStorage.setItem(draftKey(), JSON.stringify(list));
        return true;
    } catch {
        return false;
    }
}

export const listDrafts = () => readDrafts().sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
export const getDraft = (id) => {
    const d = readDrafts().find((x) => x.draftId === id);
    return d ? { ...d, form: normalizeForm(d.form) } : null;
};

export function saveDraft(form, draftId) {
    const id = draftId || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const entry = { draftId: id, savedAt: new Date().toISOString(), form: { ...form, confirm: false } };
    const list = readDrafts().filter((d) => d.draftId !== id);
    return writeDrafts([entry, ...list]) ? id : null;
}

export function deleteDraft(id) {
    writeDrafts(readDrafts().filter((d) => d.draftId !== id));
}

export function draftToRow(d) {
    return {
        id: `draft:${d.draftId}`, draftId: d.draftId, isDraft: true, referenceId: "Draft",
        title: d.form.title?.trim() || "Untitled DPIA", purposesCount: d.form.purposes?.length || 0,
        residualRisk: d.form.residualRisk || "", status: "Draft", createdAt: d.savedAt, department: d.form.department || "",
    };
}
