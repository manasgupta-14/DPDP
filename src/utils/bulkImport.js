import { toDate } from "./audit.js";
import { asArray } from "./breach.js";

// Backend (ImportController / BulkImportService) mein kinds ya statuses ki koi list endpoint nahi hai.
// ImportType ek free string hai (default "Consumers") aur sirf consumer CSV hi parse hota hai, isliye kind ek hi hai.
// Batch ke status backend ke code se liye gaye hain: Staged -> Executing -> Completed / CompletedWithErrors (ya Failed).
export const IMPORT_KINDS = [{ value: "Consumers", label: "Consumers", description: "Consumer base: mobile, email or consumer_no, name, class and preferred locale." }];

export const IMPORT_STATUSES = [
    { value: "Staged", label: "Staged - ready to execute" },
    { value: "Executing", label: "Importing" },
    { value: "Completed", label: "Completed" },
    { value: "CompletedWithErrors", label: "Completed with errors" },
    { value: "Failed", label: "Failed" },
];
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ROWS_PER_PAGE = 20;

export const BATCH_STATUS = {
    STAGED: "Staged",
    EXECUTING: "Executing",
    COMPLETED: "Completed",
    COMPLETED_WITH_ERRORS: "CompletedWithErrors",
    FAILED: "Failed",
};

export const ROW_STATUS = {
    VALID: "Valid",
    INVALID: "Invalid",
    EXECUTED: "Executed",
    EXECUTION_FAILED: "ExecutionFailed",
};

const statusLabels = Object.fromEntries(IMPORT_STATUSES.map((x) => [x.value, x.label]));
export const batchStatusLabel = (status) => statusLabels[status] ?? status;
export const ROW_STATUS_LABEL = { [ROW_STATUS.EXECUTION_FAILED]: "Execution failed" };

export const BATCH_TONE = {
    [BATCH_STATUS.STAGED]: "bg-[#CCFBF1] text-[#0F766E] ring-[#0F766E]/25",
    [BATCH_STATUS.EXECUTING]: "bg-[#22D3EE]/15 text-[#0E7490] ring-[#22D3EE]/40",
    [BATCH_STATUS.COMPLETED]: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    [BATCH_STATUS.COMPLETED_WITH_ERRORS]: "bg-[#D97706]/10 text-[#92400E] ring-[#D97706]/30",
    [BATCH_STATUS.FAILED]: "bg-[#DC2626]/10 text-[#991B1B] ring-[#DC2626]/25",
};

export const ROW_TONE = {
    [ROW_STATUS.VALID]: "bg-[#CCFBF1] text-[#0F766E] ring-[#0F766E]/25",
    [ROW_STATUS.EXECUTED]: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
    [ROW_STATUS.INVALID]: "bg-[#DC2626]/10 text-[#991B1B] ring-[#DC2626]/25",
    [ROW_STATUS.EXECUTION_FAILED]: "bg-[#DC2626]/10 text-[#991B1B] ring-[#DC2626]/25",
};

const GUARDIAN_CLASSES = ["child", "person_with_disability"];

// The API serializes row data with C# property names (Mobile, ConsumerNo ...), so match keys ignoring case.
function field(obj, ...names) {
    if (!obj || typeof obj !== "object") return "";
    const wanted = names.map((n) => n.toLowerCase());
    const key = Object.keys(obj).find((k) => wanted.includes(k.toLowerCase()));
    const value = key ? obj[key] : "";
    return value === null || value === undefined ? "" : String(value);
}

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function normalizeBatch(b) {
    return {
        id: String(field(b, "batchId", "id")),
        fileName: field(b, "fileName"),
        importType: field(b, "importType"),
        status: field(b, "status"),
        total: num(field(b, "totalRows")),
        processed: num(field(b, "processedRows")),
        failed: num(field(b, "failedRows")),
        createdAt: field(b, "createdAt"),
        completedAt: field(b, "completedAt"),
    };
}

export function normalizeRow(r) {
    const data = r?.rawData ?? r?.RawData ?? {};
    const cls = field(data, "class").toLowerCase();
    return {
        n: num(field(r, "rowNumber")),
        status: field(r, "status"),
        reason: field(r, "errorMessage"),
        mobile: field(data, "mobile"),
        email: field(data, "email"),
        consumerNo: field(data, "consumerNo", "consumer_no"),
        name: field(data, "displayName", "display_name") || field(data, "fullName", "full_name"),
        cls,
        locale: field(data, "preferredLocale", "preferred_locale"),
        dateOfBirth: field(data, "dateOfBirth", "date_of_birth"),
        guardian: GUARDIAN_CLASSES.includes(cls),
    };
}

export function normalizeBatchDetails(payload) {
    const head = payload?.batchDetails ?? payload?.BatchDetails ?? {};
    return { batch: normalizeBatch(head), rows: asArray(payload?.rows ?? payload?.Rows).map(normalizeRow) };
}

export const identifierOf = (r) => r.mobile || r.email || r.consumerNo || "-";

export function formatWhen(value) {
    const d = toDate(value);
    return d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-";
}

export const isFinished = (status) => status === BATCH_STATUS.COMPLETED || status === BATCH_STATUS.COMPLETED_WITH_ERRORS || status === BATCH_STATUS.FAILED;

const csvCell = (value) => {
    let v = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

export function errorLogCsv(rows) {
    const header = ["row_number", "status", "reason", "mobile", "email", "consumer_no", "display_name", "class", "preferred_locale"];
    const lines = rows.map((r) => [r.n, r.status, r.reason, r.mobile, r.email, r.consumerNo, r.name, r.cls, r.locale].map(csvCell).join(","));
    return [header.join(","), ...lines].join("\r\n");
}

export const errorLogName = (fileName) => `${String(fileName || "batch").replace(/\.csv$/i, "").replace(/[^\w.-]+/g, "-")}-error-log.csv`;

// Header names must match the backend's CSV mapping exactly (lower-case snake_case).
export const SAMPLE_CSV = [
    "mobile,email,consumer_no,display_name,full_name,date_of_birth,class,preferred_locale",
    "9876543210,jayesh@example.com,,Jayesh Mane,Jayesh Suresh Mane,1988-04-12,adult,mr-IN",
    "9123456780,,CN-10021,Sunita Patil,Sunita Ramesh Patil,1992-09-03,adult,hi-IN",
    "9988776655,,,Aarav Kulkarni,Aarav Kulkarni,2014-01-20,child,en-IN",
    "9812345670,,,Meera Joshi,Meera Joshi,1975-11-30,person_with_disability,mr-IN",
].join("\r\n") + "\r\n";

export function downloadText(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
