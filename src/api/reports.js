import { apiFetch } from "./client.js";
import { clearToken, getToken } from "../auth/tokenStorage.js";
import { asArray } from "../utils/breach.js";


const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const pick = (o, ...keys) => {
    for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null) return o[k];
    return null;
};

export const REPORT_OPTIONS = [
    { key: "campaign", type: "CampaignAudit", label: "Campaign report", needsCampaign: true },
    { key: "consent-audit", type: "ConsentAuditReport", label: "Consent audit", path: "generate-consent-audit" },
    { key: "grievance", type: "GrievanceReport", label: "Grievance report", path: "generate-grievance-report" },
    { key: "grievance-audit", type: "GrievanceAuditReport", label: "Grievance audit", path: "generate-grievance-audit" },
    { key: "dsar", type: "DsarReport", label: "DSAR (rights requests) report", path: "generate-dsar-report" },
    { key: "breach", type: "DataBreachReport", label: "Data breach report", path: "generate-data-breach" },
    { key: "dpia", type: "DpiaReport", label: "DPIA report", path: "generate-dpia" },
    { key: "inventory", type: "DataInventoryReport", label: "Data inventory report", path: "generate-data-inventory-report" },
    { key: "processing", type: "DataProcessingReport", label: "Data processing report", path: "generate-data-processing-report" },
    { key: "retention", type: "DataRetentionReport", label: "Data retention report", path: "generate-data-retention-report" },
    { key: "sharing", type: "DataSharingReport", label: "Data sharing report", path: "generate-data-sharing-report" },
    { key: "security", type: "SecurityAuditReport", label: "Security audit report", path: "generate-security-audit-report" },
    { key: "compliance-gap", type: "ComplianceGapReport", label: "Compliance gap report", path: "generate-compliance-gap-report" },
];

export const REPORT_TYPES = Object.fromEntries(REPORT_OPTIONS.map((o) => [o.type, o.label]));
export const reportTypeLabel = (t) => REPORT_TYPES[t] ?? (t ? String(t).replace(/([a-z])([A-Z])/g, "$1 $2") : "-");

function normalizeJob(j) {
    return {
        id: String(pick(j, "jobId", "JobId") ?? ""),
        type: String(pick(j, "reportType", "ReportType") ?? ""),
        format: String(pick(j, "reportFormat", "ReportFormat") ?? "CSV"),
        status: String(pick(j, "status", "Status") ?? "Queued"),
        createdAt: pick(j, "createdAt", "CreatedAt"),
        completedAt: pick(j, "completedAt", "CompletedAt"),
        error: String(pick(j, "errorMessage", "ErrorMessage") ?? ""),
        requestedBy: String(pick(j, "requestedBy", "RequestedBy") ?? ""),
    };
}

export async function getReportHistory() {
    const res = await apiFetch("/api/Reports/history");
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeJob) } : res;
}

export async function generateReport(key) {
    const option = REPORT_OPTIONS.find((o) => o.key === key);
    if (!option?.path) return { ok: false, status: 0, data: null, error: "Unknown report type." };
    const res = await apiFetch(`/api/Reports/${option.path}`, { method: "POST" });
    if (!res.ok) return res;
    return { ...res, data: { jobId: String(pick(res.data, "jobId", "JobId") ?? "") } };
}

export async function generateCampaignReport(campaignId) {
    const res = await apiFetch(`/api/Reports/generate-campaign-report/${encodeURIComponent(campaignId)}`, { method: "POST" });
    if (!res.ok) return res;
    return { ...res, data: { jobId: String(pick(res.data, "jobId", "JobId") ?? "") } };
}

export async function downloadReport(jobId) {
    const token = getToken();
    let res;
    try {
        res = await fetch(`${BASE_URL}/api/Reports/download/${encodeURIComponent(jobId)}`, {
            headers: { Authorization: token ? `Bearer ${token}` : "", Accept: "text/csv, application/json" },
        });
    } catch {
        return { ok: false, error: "Cannot reach the server. Make sure the backend is running on https://localhost:7139." };
    }

    if (!res.ok) {
        if (res.status === 401) {
            clearToken();
            window.location.assign("/login?expired=1");
            return { ok: false, error: "Your session has expired. Please sign in again." };
        }
        let message = res.status === 403 ? "You do not have permission to download this report." : "The report could not be downloaded.";
        try {
            const data = await res.json();
            const m = data?.message ?? data?.Message ?? data?.error;
            if (m) message = /file not found/i.test(m) ? "The report file is missing on the server. Generate a new report." : m;
        } catch {
        }
        return { ok: false, error: message };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const fileName = match ? decodeURIComponent(match[1]) : `report-${jobId}.csv`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, fileName, text: await blob.text() };
}
