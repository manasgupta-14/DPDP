import { apiFetch } from "./client.js";
import { normalizeSummary } from "../utils/dashboard.js";

// GET /api/Dashboard/summary (Admin only; the organisation comes from the JWT).
export async function getDashboardSummary() {
    const res = await apiFetch("/api/Dashboard/summary");
    return res.ok ? { ...res, data: normalizeSummary(res.data) } : res;
}
