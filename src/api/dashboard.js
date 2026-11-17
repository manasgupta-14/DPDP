import { apiFetch } from "./client.js";
import { getDataPrincipalCount } from "./dataPrincipal.js";
import { normalizeSummary } from "../utils/dashboard.js";

export async function getDashboardSummary() {
    // Summary aur data principal count ek saath (parallel) aate hain, isliye dashboard dheema nahi hota.
    const [res, count] = await Promise.all([apiFetch("/api/Dashboard/summary"), getDataPrincipalCount()]);
    if (res.ok) {
        const data = normalizeSummary(res.data);
        const has = [...data.kpis, ...data.more].some((m) => /data\s*principal|principals/i.test(m.label));
        if (count.ok && !has) {
            const metric = { key: "dataPrincipalsTotal", label: "Data principals", value: count.data, display: count.data.toLocaleString(), icon: "adduser", tint: "bg-warn/15 text-warn-ink" };
            if (data.kpis.length < 4) data.kpis = [...data.kpis, metric];
            else data.more = [metric, ...data.more];
        }
        return { ...res, data };
    }
    if (res.status === 403) return { ...res, error: "The organisation overview is only available to users whose role is named Admin. Your other pages still work." };
    return res;
}

const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};
const list = (v) => (Array.isArray(v) ? v : Array.isArray(v?.$values) ? v.$values : []);

export async function getUserSummary() {
    const res = await apiFetch("/api/Dashboard/user-summary");
    if (!res.ok) return res;
    const d = res.data;
    return {
        ...res,
        data: {
            healthScore: Number(pick(d, "privacyHealthScore", "PrivacyHealthScore") ?? 0),
            pendingActions: Number(pick(d, "pendingActionsCount", "PendingActionsCount") ?? 0),
            activeConsents: Number(pick(d, "activeConsentsCount", "ActiveConsentsCount") ?? 0),
            requestsRaised: Number(pick(d, "totalRequestsRaised", "TotalRequestsRaised") ?? 0),
            activity: list(pick(d, "recentActivityLog", "RecentActivityLog")).map((a) => ({
                action: String(pick(a, "action", "Action") ?? ""),
                date: pick(a, "date", "Date"),
            })),
            requests: list(pick(d, "recentRequests", "RecentRequests")).map((r) => ({
                type: String(pick(r, "requestType", "RequestType") ?? ""),
                status: String(pick(r, "status", "Status") ?? ""),
                createdAt: pick(r, "createdAt", "CreatedAt"),
            })),
        },
    };
}
