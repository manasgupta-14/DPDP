import { apiFetch } from "./client.js";
import { normalizeSummary } from "../utils/dashboard.js";

export async function getDashboardSummary() {
    const res = await apiFetch("/api/Dashboard/summary");
    return res.ok ? { ...res, data: normalizeSummary(res.data) } : res;
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
