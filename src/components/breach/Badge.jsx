import { severityTone, statusTone } from "../../utils/breach.js";

const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

export function StatusBadge({ status }) {
    return <span className={`${base} ${statusTone(status)}`}>{status}</span>;
}

export function SeverityBadge({ severity }) {
    return <span className={`${base} ${severityTone(severity)}`}>{severity || "Not set"}</span>;
}
