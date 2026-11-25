import RowDetail, { RowLink } from "../../shared/RowDetail.jsx";
import { useRowDetail } from "../../shared/useRowDetail.js";
import { dkCard, dkTh } from "../consent/styles.js";
import { Shown } from "./NotInApi.jsx";

const chip = "inline-flex max-w-[200px] items-center truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1";
const NEUTRAL = "bg-subtle text-ink-2 ring-line-strong";
const WARM = "bg-warn/10 text-warn-ink ring-warn/25";

const riskTone = (risk) => {
    const r = String(risk).toLowerCase();
    if (/high|critical/.test(r)) return "bg-bad/10 text-bad-ink ring-bad/35";
    if (/medium|moderate/.test(r)) return WARM;
    return NEUTRAL;
};

const sensitive = (item) => /high|critical/i.test(item.raw?.sensitivity || "");

function Linked({ items, links, warm }) {
    if (items.length > 0) return <div className="flex flex-wrap gap-1">{items.map((i) => <span key={i.id} className={`${chip} ${warm && sensitive(i) ? WARM : NEUTRAL}`}>{i.name}</span>)}</div>;
    if (links > 0) return <span className="text-[11px] italic text-ink-3">{links} linked</span>;
    return <span className="text-[11px] text-muted">None linked</span>;
}

export default function PurposeTable({ rows, onEdit, onHistory }) {
    const [detail, rowProps, closeDetail] = useRowDetail();
    const names = (items, links) => (items.length ? items.map((i) => i.name).join(", ") : links > 0 ? `${links} linked` : "None linked");
    return (
        <>
        <div className={`${dkCard} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-xs text-ink-2">
                    <thead className="border-b border-line bg-soft">
                        <tr>{["Purpose", "Legal basis", "Data categories", "Processors", "Retention", "Flags", ""].map((h, i) => <th key={i} className={dkTh}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((p) => (
                            <tr key={p.id} {...rowProps(() => ({ title: p.name, subtitle: p.code, items: [{ label: "Purpose", value: `${p.name} v${p.version}` }, { label: "Code", value: p.code }, { label: "Description", value: p.description }, { label: "Legal basis", value: p.legalBasis }, { label: "Data categories", value: names(p.categories, p.categoryLinks) }, { label: "Processors", value: names(p.processors, p.processorLinks) }, { label: "Retention", value: p.retention }, { label: "Consent", value: p.lapses === undefined ? "" : p.lapses ? "Consent lapses" : "Consent does not lapse" }, { label: "Risk", value: p.risk }, { label: "Mandatory", value: p.mandatory ? "Yes" : "No" }, { label: "Not for children", value: p.prohibitedForChildren ? "Yes" : "No" }, { label: "Status", value: p.active ? "Active" : "Archived" }] }))} className={`cursor-pointer align-top hover:bg-soft ${p.active ? "" : "bg-soft/70"}`}>
                                <td className="max-w-[280px] px-4 py-3">
                                    <p className="font-semibold text-ink"><RowLink>{p.name}</RowLink> <span className="ml-1 text-[10px] font-medium text-ink-3">v{p.version}</span></p>
                                    <p className="font-mono text-[10px] text-ink-3">{p.code || "-"}</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-ink-3"><Shown value={p.description} /></p>
                                </td>
                                <td className="px-4 py-3">
                                    <Shown value={p.legalBasis}><span className={`${chip} ${/consent/i.test(p.legalBasis) && !/legitimate/i.test(p.legalBasis) ? "bg-brand/10 text-brand-ink ring-brand/25" : "bg-brand-soft text-info-ink ring-info-ink/30"}`}>{p.legalBasis}</span></Shown>
                                </td>
                                <td className="max-w-[260px] px-4 py-3"><Linked items={p.categories} links={p.categoryLinks} warm /></td>
                                <td className="max-w-[260px] px-4 py-3"><Linked items={p.processors} links={p.processorLinks} /></td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-ink"><Shown value={p.retention} /></p>
                                    <p className="text-[11px] text-ink-3">
                                        <Shown value={p.lapses === undefined ? undefined : "x"}>{p.lapses ? "Consent lapses" : "Consent does not lapse"}</Shown>
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.mandatory && <span className={`${chip} ${WARM}`}>Mandatory</span>}
                                        <span className={`${chip} ${p.active ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-line text-ink-2 ring-line-strong"}`}>{p.active ? "Active" : "Archived"}</span>
                                        {p.prohibitedForChildren && <span className={`${chip} ${NEUTRAL}`}>Not for children</span>}
                                        <Shown value={p.risk}><span className={`${chip} ${riskTone(p.risk)}`}>{p.risk}</span></Shown>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col items-start gap-1.5">
                                        <button type="button" onClick={() => onHistory?.(p)} className="h-7 rounded-lg border border-line px-3 text-[11px] font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">History</button>
                                        <button type="button" onClick={() => onEdit?.(p)} disabled={!p.active} title={p.active ? undefined : "Archived versions cannot be edited. Edit the current version."} className="h-7 rounded-lg border border-line px-3 text-[11px] font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50">Edit</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <RowDetail row={detail} onClose={closeDetail} />
        </>
    );
}
