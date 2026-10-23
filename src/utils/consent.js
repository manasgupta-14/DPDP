const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export const CONSENT_STATUS = { granted: "Granted", withdrawn: "Withdrawn" };

export const CONSENT_TONE = {
    Granted: "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25",
    Withdrawn: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
};

export function normalizeConsent(c, index = 0) {
    const status = String(pick(c, ["consentStatus", "status"]) || CONSENT_STATUS.granted);
    return {
        id: String(pick(c, ["consentRecordId", "id"]) ?? `row-${index}`),
        principalId: String(pick(c, ["dataPrincipalId"]) ?? ""),
        inventoryId: String(pick(c, ["dataInventoryId"]) ?? ""),
        status: status.toLowerCase() === "withdrawn" ? CONSENT_STATUS.withdrawn : CONSENT_STATUS.granted,
        noticeVersion: String(pick(c, ["noticeVersion"]) ?? "-"),
        grantedAt: pick(c, ["grantedAt"]),
        withdrawnAt: pick(c, ["withdrawnAt"]),
    };
}

export const isGranted = (c) => c.status === CONSENT_STATUS.granted;
export const shortId = (id) => (id ? String(id).slice(0, 8) : "-");
