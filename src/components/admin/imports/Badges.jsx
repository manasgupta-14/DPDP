import { BATCH_STATUS, BATCH_TONE, ROW_STATUS_LABEL, ROW_TONE, batchStatusLabel } from "../../../utils/bulkImport.js";

const base = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";
const fallback = "bg-line text-ink-2 ring-line-strong";

export function BatchBadge({ status }) {
    return (
        <span className={`${base} ${BATCH_TONE[status] ?? fallback}`}>
            {status === BATCH_STATUS.EXECUTING && <span aria-hidden className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-info-ink" />}
            {status ? batchStatusLabel(status) : "Unknown"}
        </span>
    );
}

export function RowBadge({ status }) {
    return <span className={`${base} ${ROW_TONE[status] ?? fallback}`}>{ROW_STATUS_LABEL[status] ?? (status || "Unknown")}</span>;
}

export function GuardianBadge() {
    return <span className={`${base} bg-warn-soft text-warn-ink ring-warn/40`}>Needs guardian consent (Sec 9)</span>;
}
