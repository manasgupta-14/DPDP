import { apiFetch } from "./client.js";
import { normalizeBatch, normalizeBatchDetails } from "../utils/bulkImport.js";
import { asArray } from "../utils/breach.js";

// POST /api/Import/stage (multipart/form-data: ImportType, FileName, CsvFile | RawCsvData)
export async function stageImport({ importType, fileName, file, rawCsv }) {
    const form = new FormData();
    form.append("ImportType", importType);
    if (fileName) form.append("FileName", fileName);
    if (file) form.append("CsvFile", file);
    else form.append("RawCsvData", rawCsv);

    const res = await apiFetch("/api/Import/stage", { method: "POST", body: form });
    if (!res.ok) return res;
    const batchId = res.data?.batchId ?? res.data?.BatchId;
    return { ...res, data: { batchId: batchId ? String(batchId) : "", message: res.data?.message ?? "" } };
}

// GET /api/Import/batches?status=&kind=
export async function getBatches({ status, kind } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kind) params.set("kind", kind);
    const query = params.toString() ? `?${params}` : "";
    const res = await apiFetch(`/api/Import/batches${query}`);
    return res.ok ? { ...res, data: asArray(res.data).map(normalizeBatch) } : res;
}

// GET /api/Import/batches/{id}?status=&page=&pageSize=
export async function getBatchDetails(id, { status = "", page = 1, pageSize = 50 } = {}) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    const res = await apiFetch(`/api/Import/batches/${encodeURIComponent(id)}?${params}`);
    return res.ok ? { ...res, data: normalizeBatchDetails(res.data) } : res;
}

// POST /api/Import/batches/{id}/execute
export async function executeBatch(id) {
    const res = await apiFetch(`/api/Import/batches/${encodeURIComponent(id)}/execute`, { method: "POST" });
    return res.ok ? { ...res, data: { message: res.data?.message ?? "" } } : res;
}
