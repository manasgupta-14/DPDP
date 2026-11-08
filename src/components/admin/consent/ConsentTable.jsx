import { expiryText, formatClock, formatDay, shortId } from "../../../utils/consent.js";
import { NotInApi } from "../purposes/NotInApi.jsx";
import ConsentStatusBadge from "./StatusBadge.jsx";
import { dkCard, dkTh } from "./styles.js";

const HEADERS = ["Reference", "Status", "Purposes", "Notice", "Channel", "Language", "Given", "Expires"];

function PurposeChip({ name, allowed }) {
    const tone = allowed ? "bg-[#16A34A]/10 text-[#15803D]" : "bg-[#F1F5F9] text-[#334155]";
    const dot = allowed ? "bg-[#16A34A]" : "bg-[#64748B]";
    return (
        <span title={`${name}: ${allowed ? "yes" : "no"}`} className={`inline-flex max-w-[260px] items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}>
            <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="truncate">{name}: {allowed ? "yes" : "no"}</span>
        </span>
    );
}

export default function ConsentTable({ rows, onOpen }) {
    return (
        <div className={`${dkCard} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-xs text-[#334155]">
                    <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <tr>{HEADERS.map((h) => <th key={h} className={dkTh}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {rows.map((r) => (
                            <tr key={r.id} className="align-top transition hover:bg-[#F8FAFC]">
                                <td className="px-4 py-3">
                                    <button type="button" onClick={() => onOpen(r)} title={r.id} className="font-mono text-[11px] font-semibold text-[#0E7490] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">{r.reference}</button>
                                    <p className="mt-0.5 text-[10px] text-[#475569]">Principal {shortId(r.principalId)} · v{r.version}</p>
                                </td>
                                <td className="px-4 py-3"><ConsentStatusBadge status={r.status} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex max-w-[420px] flex-wrap gap-1.5">
                                        {r.purposes.map((p) => <PurposeChip key={p.id} name={p.name} allowed={p.allowed} />)}
                                        {r.purposes.length === 0 && <span className="text-[#64748B]">No purposes recorded</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px]">{r.notice || <NotInApi />}</td>
                                <td className="px-4 py-3">{r.channel || <NotInApi />}</td>
                                <td className="px-4 py-3 font-mono text-[11px]">{r.language || <NotInApi />}</td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {formatDay(r.submittedAt) ? <><p className="text-[#0F172A]">{formatDay(r.submittedAt)}</p><p className="text-[#475569]">{formatClock(r.submittedAt)}</p></> : <span className="text-[#64748B]">-</span>}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">{r.lapses ? expiryText(r.expiresAt) : <span className="text-[#475569]">Does not lapse</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
