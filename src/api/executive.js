import { getAllIncidents } from "./breach.js";
import { getComplianceChecklist } from "./checklist.js";
import { getConsentRecords } from "./consent.js";
import { getDashboardSummary } from "./dashboard.js";
import { getDataInventory } from "./dataInventory.js";
import { getDataPrincipalCount } from "./dataPrincipal.js";
import { getAllDpia } from "./dpia.js";
import { getAllGrievances } from "./grievance.js";
import { getNotices } from "./notice.js";
import { getPrivacyRequestList } from "./privacyRequest.js";
import { getRetentionMetrics } from "./retentionPolicy.js";

/**
 * Executive dashboard ke liye saari asli API ek saath (parallel) mangwate hain.
 * Jis API ki permission nahi hai ya jo fail ho, uska hissa "no access" dikhata hai; baaki dashboard chalta rehta hai.
 */
export async function loadExecutiveData() {
    const calls = {
        summary: getDashboardSummary(),
        incidents: getAllIncidents(),
        requests: getPrivacyRequestList({ page: 1, pageSize: 200 }),
        consents: getConsentRecords(),
        inventory: getDataInventory(),
        dpia: getAllDpia(),
        grievances: getAllGrievances(),
        notices: getNotices(),
        retention: getRetentionMetrics(),
        principals: getDataPrincipalCount(),
        checklist: getComplianceChecklist(),
    };
    const keys = Object.keys(calls);
    const settled = await Promise.allSettled(Object.values(calls));
    const out = {};
    settled.forEach((r, i) => {
        out[keys[i]] = r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason?.message || r.reason || "Request failed") };
    });
    out.loadedAt = new Date();
    return out;
}
