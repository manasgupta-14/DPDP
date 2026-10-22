import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeLog } from "../utils/audit.js";

export async function getAuditLogs() {
    const res = await apiFetch("/api/Audit/logs");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeLog) } : res;
}
