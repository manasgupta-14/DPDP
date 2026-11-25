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
import { canNow } from "../auth/access.js";

export async function loadExecutiveData() {
    const skip = { ok: false, denied: true, error: "" };
    const guard = (permission, run) => (canNow(permission) ? run() : skip);
    const calls = {
        summary: getDashboardSummary(),
        incidents: guard(["Breaches.View"], getAllIncidents),
        requests: guard(["PrivacyRequest.View"], () => getPrivacyRequestList({ page: 1, pageSize: 200 })),
        consents: guard(["Consent.View"], getConsentRecords),
        inventory: guard(["DataInventory.View"], getDataInventory),
        dpia: guard(["DPIA.View"], getAllDpia),
        grievances: guard(["Grievances.View"], getAllGrievances),
        notices: getNotices(),
        retention: guard(["RetentionPolicy.View"], getRetentionMetrics),
        principals: guard(["DataPrincipal.View"], getDataPrincipalCount),
        checklist: guard(["Audit.View"], getComplianceChecklist),
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

let pre = null;
let preAt = 0;
export function prefetchExecutive() {
    if (!pre) {
        pre = loadExecutiveData();
        preAt = Date.now();
    }
}
export function takeExecutive() {
    const p = pre && Date.now() - preAt < 20000 ? pre : null;
    pre = null;
    return p || loadExecutiveData();
}
