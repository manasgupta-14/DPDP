import { displayStatus, riskTone, statusTone } from "../../utils/dpia.js";

const base = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

export function DpiaStatusBadge({ status }) {
    const label = displayStatus(status);
    return <span className={`${base} ${statusTone(label)}`}>{label}</span>;
}

export function RiskBadge({ risk }) {
    if (!risk) return <span className="text-[#64748B]">-</span>;
    return <span className={`${base} ${riskTone(risk)}`}>{risk}</span>;
}
