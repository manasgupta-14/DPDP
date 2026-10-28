const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export const CONSENT_STATUS = { granted: "Granted", denied: "Denied", withdrawn: "Withdrawn" };

export const CONSENT_TONE = {
    Granted: "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25",
    Denied: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
    Withdrawn: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
};

function normalizeStatus(value) {
    const s = String(value || "").toLowerCase();
    if (s === "withdrawn") return CONSENT_STATUS.withdrawn;
    if (s === "denied") return CONSENT_STATUS.denied;
    return CONSENT_STATUS.granted;
}

export function normalizeConsentRecord(record, index = 0) {
    const recordId = String(pick(record, ["consentRecordId", "id"]) ?? `record-${index}`);
    const principalId = String(pick(record, ["dataPrincipalId"]) ?? "");
    const noticeVersion = String(pick(record, ["noticeVersion"]) ?? "-");
    const submittedAt = pick(record, ["submittedAt"]);
    const details = pick(record, ["consentDetails"]);

    return (Array.isArray(details) ? details : []).map((d, i) => {
        const inventoryId = String(pick(d, ["dataInventoryId"]) ?? "");
        return {
            id: String(pick(d, ["consentDetailId"]) ?? `${recordId}:${inventoryId || i}`),
            recordId,
            principalId,
            inventoryId,
            status: normalizeStatus(pick(d, ["consentStatus", "status"])),
            noticeVersion,
            submittedAt,
            withdrawnAt: pick(d, ["withdrawnAt"]),
        };
    });
}

export function normalizeConsentList(list) {
    return (Array.isArray(list) ? list : []).flatMap((r, i) => normalizeConsentRecord(r, i));
}

export const isGranted = (c) => c.status === CONSENT_STATUS.granted;
export const isDenied = (c) => c.status === CONSENT_STATUS.denied;
export const shortId = (id) => (id ? String(id).slice(0, 8) : "-");
