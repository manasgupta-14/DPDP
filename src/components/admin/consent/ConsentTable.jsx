import { formatClock, formatDay, shortId } from "../../../utils/consent.js";
import { dkCard, dkTh } from "./styles.js";
import ConsentStatusBadge from "./StatusBadge.jsx";

const MAX_BADGES = 6;
const muted = <span className="text-[#64748B]">-</span>;

// Har purpose ke saath saaf "yes" ya "no": admin ek nazar mein dekh sake kisne kya allow kiya
function PurposeBadge({ name, allowed }) {
    const tone = allowed ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25";
    return (
        <span title={`${name}: ${allowed ? "allowed" : "not allowed"}`} className={`inline-block max-w-[220px] truncate rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ${tone}`}>
            {name}: {allowed ? "yes" : "no"}
        </span>
    );
}

export default function ConsentTable({ rows, onOpen }) {
    return (
        <div className={`${dkCard} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-xs text-[#334155]">
                    <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <tr>
                            {["Receipt", "Data principal", "Status", "Purposes", "Given"].map((h) => <th key={h} className={dkTh}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {rows.map((r) => {
                            const shown = r.purposes.slice(0, MAX_BADGES);
                            const extra = r.purposes.length - shown.length;
                            return (
                                <tr key={r.id} className="align-top hover:bg-[#F8FAFC]">
                                    <td className="px-4 py-3">
                                        <button type="button" onClick={() => onOpen(r)} title={r.id} className="font-mono text-[#0E7490] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">{r.reference}</button>
                                        <p className="text-[#64748B]">v{r.version}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-[#0F172A]">{r.principalName || `User ${shortId(r.principalId)}`}</p>
                                        <p className="font-mono text-[10px] text-[#64748B]" title={r.principalId}>{shortId(r.principalId)}</p>
                                    </td>
                                    <td className="px-4 py-3"><ConsentStatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex max-w-[380px] flex-wrap gap-1">
                                            {shown.map((p) => <PurposeBadge key={p.id} name={p.name} allowed={p.allowed} />)}
                                            {extra > 0 && <span className="rounded px-1.5 py-0.5 text-[10px] text-[#475569] ring-1 ring-[#E2E8F0]">+{extra} more</span>}
                                            {r.purposes.length === 0 && <span className="text-[#64748B]">No purposes recorded</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDay(r.submittedAt) ? <><p className="text-[#0F172A]">{formatDay(r.submittedAt)}</p><p className="text-[#64748B]">{formatClock(r.submittedAt)}</p></> : muted}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
