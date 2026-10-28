import { apiFetch } from "./client.js";
import { getMyTeam } from "./breach.js";
import { getSession } from "../auth/authStore.js";
import { asArray } from "../utils/breach.js";
import { CONSENT_STATUS, normalizeConsentList, normalizeConsentRecord } from "../utils/consent.js";

export async function submitConsent({ dataPrincipalId, preferences }) {
    const res = await apiFetch("/api/Consent/submit", {
        method: "POST",
        body: {
            dataPrincipalId,
            preferences: preferences.map((p) => ({ dataInventoryId: p.dataInventoryId, status: p.status })),
        },
    });
    if (!res.ok) return res;
    return { ...res, data: normalizeConsentRecord(res.data) };
}

export const grantConsent = ({ dataPrincipalId, dataInventoryId }) =>
    submitConsent({ dataPrincipalId, preferences: [{ dataInventoryId, status: CONSENT_STATUS.granted }] });

export async function withdrawConsent({ recordId, inventoryId }) {
    const res = await apiFetch(`/api/Consent/withdraw/${encodeURIComponent(recordId)}/${encodeURIComponent(inventoryId)}`, { method: "POST" });
    if (res.ok || res.status !== 400) return res;
    return { ...res, error: "This consent could not be withdrawn. It may already be withdrawn, or it was not found." };
}

export async function getConsentHistory(dataPrincipalId) {
    const res = await apiFetch(`/api/Consent/history/${encodeURIComponent(dataPrincipalId)}`);
    return res.ok ? { ...res, data: normalizeConsentList(asArray(res.data)) } : res;
}

export async function getOrganizationConsents() {
    const team = await getMyTeam();
    if (!team.ok) return team;

    const ids = new Set(team.data.map((m) => String(m.id)));
    const ownId = getSession()?.userId;
    if (ownId) ids.add(String(ownId));

    const results = await Promise.all([...ids].map((id) => getConsentHistory(id)));
    const failed = results.filter((r) => !r.ok);
    if (failed.length === results.length && results.length > 0) return failed[0];

    const seen = new Set();
    const data = results
        .filter((r) => r.ok)
        .flatMap((r) => r.data)
        .filter((c) => (seen.has(c.id) ? false : seen.add(c.id)));

    return {
        ok: true,
        status: 200,
        error: failed.length ? `${failed.length} of ${results.length} users' consent history could not be loaded. Showing the rest.` : null,
        data,
        team: team.data,
    };
}
