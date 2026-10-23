import { apiFetch } from "./client.js";
import { getMyTeam } from "./breach.js";
import { getSession } from "../auth/authStore.js";
import { asArray } from "../utils/breach.js";
import { normalizeConsent } from "../utils/consent.js";

export async function grantConsent({ dataPrincipalId, dataInventoryId, noticeVersion }) {
    const res = await apiFetch("/api/Consent/grant", {
        method: "POST",
        body: { dataPrincipalId, dataInventoryId, noticeVersion: noticeVersion.trim() },
    });
    if (!res.ok) return res;
    return { ...res, data: { message: res.data?.message ?? res.data?.Message, consentId: res.data?.consentId ?? res.data?.ConsentId } };
}

export async function withdrawConsent(consentId) {
    return apiFetch(`/api/Consent/withdraw/${encodeURIComponent(consentId)}`, { method: "PUT" });
}

export async function getConsentHistory(dataPrincipalId) {
    const res = await apiFetch(`/api/Consent/history/${encodeURIComponent(dataPrincipalId)}`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeConsent) } : res;
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
