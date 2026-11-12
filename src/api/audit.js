import { apiFetch } from "./client.js";
import { asArray } from "../utils/breach.js";
import { normalizeLog } from "../utils/audit.js";

export async function getAuditLogs() {
    const res = await apiFetch("/api/Audit/logs");
    if (res.ok) return { ...res, data: asArray(res.data).map(normalizeLog) };
    if (res.status === 403) return { ...res, error: "Your role does not have the \"Audit.View\" permission needed to open the audit trail. Ask an admin to add it in Roles & permissions." };
    return res;
}
