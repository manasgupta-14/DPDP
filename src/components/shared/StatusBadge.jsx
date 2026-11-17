import { STATUS_TONE, statusLabel } from "../../utils/privacyRequest.js";

export default function StatusBadge({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_TONE[status] || "bg-subtle text-ink-2 ring-line-strong"}`}>{statusLabel(status)}</span>;
}
