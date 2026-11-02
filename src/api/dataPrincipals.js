import { apiFetch } from "./client.js";
import { getBatchDetails, getBatches } from "./imports.js";
import { BATCH_STATUS, ROW_STATUS } from "../utils/bulkImport.js";

// POST /api/dataprincipal/add  (DataPrincipalDto)
// Backend DTO: mobile, email, consumerNo, fullName, dateOfBirth (yyyy-MM-dd), class, preferredLocale.
// Backend itself rejects a request that has neither mobile nor email. Display name is NOT in this DTO (only the CSV bulk import has it).
// Response: { message, referenceId, dataPrincipalId }
export async function addDataPrincipal({ mobile, email, consumerNo, fullName, dateOfBirth, cls, preferredLocale }) {
    const body = { class: cls, preferredLocale };
    if (mobile) body.mobile = mobile;
    if (email) body.email = email;
    if (consumerNo) body.consumerNo = consumerNo;
    if (fullName) body.fullName = fullName;
    if (dateOfBirth) body.dateOfBirth = dateOfBirth;

    const res = await apiFetch("/api/dataprincipal/add", { method: "POST", body });
    if (!res.ok) {
        // Backend sends plain-text 400 messages here, which apiFetch cannot parse as JSON.
        const error = res.status === 400 && !res.data ? "Mobile or email is required." : res.error;
        return { ...res, error };
    }
    return {
        ...res,
        data: {
            message: res.data?.message ?? res.data?.Message ?? "",
            referenceId: String(res.data?.referenceId ?? res.data?.ReferenceId ?? ""),
            dataPrincipalId: String(res.data?.dataPrincipalId ?? res.data?.DataPrincipalId ?? ""),
        },
    };
}

// Backend has no "list data principals" endpoint, but every user created by a bulk import is still described by the Import API:
//   GET /api/Import/batches                        -> all batches of this organisation
//   GET /api/Import/batches/{id}?status=Executed   -> the rows that were really written to the data principal table (paged)
// So the data principals created by bulk import are rebuilt from the executed rows of every batch that has been executed.
// Not available this way: the PSD-xxxxxxxx reference id (it is generated while executing and not stored on the row).
const ROWS_PAGE = 200;
const MAX_PAGES = 25;

async function executedRows(batch) {
    const rows = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const res = await getBatchDetails(batch.id, { status: ROW_STATUS.EXECUTED, page, pageSize: ROWS_PAGE });
        if (!res.ok) return res;
        rows.push(...res.data.rows);
        if (res.data.rows.length < ROWS_PAGE) break;
    }
    return { ok: true, data: rows };
}

export async function getImportedDataPrincipals() {
    const list = await getBatches();
    if (!list.ok) return list;
    // Staged / Failed batches wrote nothing. Executing may already have written some rows.
    const done = list.data.filter((b) => [BATCH_STATUS.COMPLETED, BATCH_STATUS.COMPLETED_WITH_ERRORS, BATCH_STATUS.EXECUTING].includes(b.status));
    const results = await Promise.all(done.map(async (b) => ({ batch: b, res: await executedRows(b) })));
    const failed = results.filter((r) => !r.res.ok);
    if (done.length > 0 && failed.length === done.length) return failed[0].res;

    const data = results
        .filter((r) => r.res.ok)
        .flatMap(({ batch, res }) => res.data.map((r) => ({
            id: `import:${batch.id}:${r.n}`,
            referenceId: "",
            mobile: r.mobile,
            email: r.email,
            consumerNo: r.consumerNo,
            fullName: r.name,
            dateOfBirth: r.dateOfBirth,
            cls: r.cls,
            preferredLocale: r.locale,
            source: batch.fileName ? `Bulk import: ${batch.fileName}` : "Bulk import",
            addedAt: batch.completedAt || batch.createdAt,
        })));
    return { ok: true, status: 200, error: null, data, skipped: failed.length };
}
