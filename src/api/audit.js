import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeLog } from "../utils/audit.js";

export async function getAuditLogs() {
    const res = await apiFetch("/api/Audit/logs");
    if (res.ok) return { ...res, data: asArray(res.data).map(normalizeLog) };
    if (res.status === 403) return { ...res, error: "The audit trail is only available to users whose role is AdminDpo. Your current role cannot open it." };
    return res;
}
