import { pickNoticeForConsent } from "../../../api/consentNotice.js";
import { languageLabel } from "../../../config/consentNotice.js";
import { expiryText, formatClock, formatDay, shortId } from "../../../utils/consent.js";
import { NotInApi } from "../purposes/NotInApi.jsx";
import ConsentStatusBadge from "./StatusBadge.jsx";
import { dkCard, dkTh } from "./styles.js";

const HEADERS = [
    { label: "Reference", className: "w-[150px]" },
    { label: "Status", className: "w-[125px]" },
    { label: "Purposes", className: "" },
    { label: "Notice", className: "w-[185px]" },
    { label: "Channel", className: "w-[115px]" },
    { label: "Given", className: "w-[110px]" },
    { label: "Expires", className: "w-[105px]" },
];

const NOTICE_HINT = "The consent record does not store which notice was shown, so this is the notice that was in force when consent was given.";

function PurposeChip({ name }) {
    return (
        <span title={`${name}: yes`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ok/10 px-2 py-0.5 text-[10px] font-medium text-ok-ink">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
            <span className="truncate">{name}</span>
        </span>
    );
}

function PurposesCell({ purposes }) {
    if (purposes.length === 0) return <span className="text-muted">No purposes recorded</span>;
    const yes = purposes.filter((p) => p.allowed);
    const no = purposes.filter((p) => !p.allowed);
    return (
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-ink-2">{yes.length} of {purposes.length} allowed</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {yes.map((p) => <PurposeChip key={p.id} name={p.name} />)}
                {no.length > 0 && (
                    <span title={`Not allowed: ${no.map((p) => p.name).join(", ")}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-2">
                        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                        {no.length} not allowed
                    </span>
                )}
            </div>
        </div>
    );
}

function NoticeCell({ notice, loading }) {
    if (loading) return <div className="h-8 w-28 pg-shimmer rounded-md" aria-hidden="true" />;
    if (!notice) return <span className="text-muted" title="No notice has been created yet">No notice on record</span>;
    return (
        <div title={NOTICE_HINT} className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-ink">{notice.title || notice.code}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-ink-3" title={notice.code}>{notice.code}</p>
            <span className="mt-1 inline-flex whitespace-nowrap rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink ring-1 ring-brand/20">v{notice.version}</span>
        </div>
    );
}

export default function ConsentTable({ rows, notices, noticesLoading = false, onOpen }) {
    return (
        <div className={`${dkCard} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed text-xs text-ink-2">
                    <thead className="border-b border-line bg-soft">
                        <tr>{HEADERS.map((h) => <th key={h.label} className={`${dkTh} !px-3 ${h.className}`}>{h.label}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((r) => {
                            const isLatest = (r.versions?.length || 0) > 1 && r.versions[0].id === r.id;
                            return (
                                <tr key={r.id} onClick={() => onOpen(r)} className="cursor-pointer align-top transition hover:bg-soft">
                                    <td className="px-3 py-3">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(r); }} title="Open consent details" className="break-all text-left font-mono text-[11px] font-semibold text-brand-ink underline decoration-brand/30 underline-offset-2 hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">{r.reference}</button>
                                        <p className="mt-0.5 text-[10px] text-ink-3">Principal {shortId(r.principalId)}</p>
                                        <p className="mt-0.5 text-[10px] text-ink-3">v{r.version}{isLatest ? " · latest" : ""}</p>
                                    </td>
                                    <td className="px-3 py-3"><ConsentStatusBadge status={r.status} /></td>
                                    <td className="px-3 py-3"><PurposesCell purposes={r.purposes} /></td>
                                    <td className="overflow-hidden px-3 py-3"><NoticeCell notice={pickNoticeForConsent(notices, r)} loading={noticesLoading} /></td>
                                    <td className="px-3 py-3">
                                        <p className="text-ink">{r.channel || <NotInApi />}</p>
                                        <p className="mt-0.5 text-[10px] text-ink-3">{languageLabel(r.language) || <NotInApi />}</p>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {formatDay(r.submittedAt) ? <><p className="text-ink">{formatDay(r.submittedAt)}</p><p className="text-ink-3">{formatClock(r.submittedAt)}</p></> : <span className="text-muted">-</span>}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">{r.lapses ? expiryText(r.expiresAt) : <span className="text-ink-3">Does not lapse</span>}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
