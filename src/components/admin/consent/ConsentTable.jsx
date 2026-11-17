import { expiryText, formatClock, formatDay, shortId } from "../../../utils/consent.js";
import { NotInApi } from "../purposes/NotInApi.jsx";
import ConsentStatusBadge from "./StatusBadge.jsx";
import { dkCard, dkTh } from "./styles.js";

const HEADERS = ["Reference", "Status", "Purposes", "Notice", "Channel", "Language", "Given", "Expires"];

function PurposeChip({ name, allowed }) {
    const tone = allowed ? "bg-ok/10 text-ok-ink" : "bg-subtle text-ink-2";
    const dot = allowed ? "bg-ok" : "bg-muted";
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
                <table className="w-full min-w-[1080px] text-xs text-ink-2">
                    <thead className="border-b border-line bg-soft">
                        <tr>{HEADERS.map((h) => <th key={h} className={dkTh}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((r) => (
                            <tr key={r.id} className="align-top transition hover:bg-soft">
                                <td className="px-4 py-3">
                                    <button type="button" onClick={() => onOpen(r)} title={r.id} className="font-mono text-[11px] font-semibold text-info-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">{r.reference}</button>
                                    <p className="mt-0.5 text-[10px] text-ink-3">Principal {shortId(r.principalId)} · v{r.version}</p>
                                </td>
                                <td className="px-4 py-3"><ConsentStatusBadge status={r.status} /></td>
                                <td className="px-4 py-3">
                                    <div className="flex max-w-[420px] flex-wrap gap-1.5">
                                        {r.purposes.map((p) => <PurposeChip key={p.id} name={p.name} allowed={p.allowed} />)}
                                        {r.purposes.length === 0 && <span className="text-muted">No purposes recorded</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px]">{r.notice || <NotInApi />}</td>
                                <td className="px-4 py-3">{r.channel || <NotInApi />}</td>
                                <td className="px-4 py-3 font-mono text-[11px]">{r.language || <NotInApi />}</td>
                                <td className="whitespace-nowrap px-4 py-3">
                                    {formatDay(r.submittedAt) ? <><p className="text-ink">{formatDay(r.submittedAt)}</p><p className="text-ink-3">{formatClock(r.submittedAt)}</p></> : <span className="text-muted">-</span>}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">{r.lapses ? expiryText(r.expiresAt) : <span className="text-ink-3">Does not lapse</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
