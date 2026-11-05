import { STATUS_TONE, statusLabel } from "../../utils/privacyRequest.js";

export default function StatusBadge({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_TONE[status] || "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]"}`}>{statusLabel(status)}</span>;
}
