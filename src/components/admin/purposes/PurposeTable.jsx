import { dkCard, dkTh } from "../consent/styles.js";
import { Shown } from "./NotInApi.jsx";

const chip = "inline-flex max-w-[200px] items-center truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1";
const NEUTRAL = "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]";
const WARM = "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25";

const riskTone = (risk) => {
    const r = String(risk).toLowerCase();
    if (/high|critical/.test(r)) return "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/35";
    if (/medium|moderate/.test(r)) return WARM;
    return NEUTRAL;
};

const sensitive = (item) => /high|critical/i.test(item.raw?.sensitivity || "");

function Linked({ items, links, warm }) {
    if (items.length > 0) return <div className="flex flex-wrap gap-1">{items.map((i) => <span key={i.id} className={`${chip} ${warm && sensitive(i) ? WARM : NEUTRAL}`}>{i.name}</span>)}</div>;
    if (links > 0) return <span className="text-[11px] italic text-[#475569]">{links} linked</span>;
    return <span className="text-[11px] text-[#64748B]">None linked</span>;
}

export default function PurposeTable({ rows, onEdit, onHistory }) {
    return (
        <div className={`${dkCard} overflow-hidden`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-xs text-[#334155]">
                    <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                        <tr>{["Purpose", "Legal basis", "Data categories", "Processors", "Retention", "Flags", ""].map((h, i) => <th key={i} className={dkTh}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {rows.map((p) => (
                            <tr key={p.id} className={`align-top hover:bg-[#F8FAFC] ${p.active ? "" : "bg-[#F8FAFC]/70"}`}>
                                <td className="max-w-[280px] px-4 py-3">
                                    <p className="font-semibold text-[#0F172A]">{p.name} <span className="ml-1 text-[10px] font-medium text-[#475569]">v{p.version}</span></p>
                                    <p className="font-mono text-[10px] text-[#475569]">{p.code || "-"}</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#475569]"><Shown value={p.description} /></p>
                                </td>
                                <td className="px-4 py-3">
                                    <Shown value={p.legalBasis}><span className={`${chip} ${/consent/i.test(p.legalBasis) && !/legitimate/i.test(p.legalBasis) ? "bg-[#1D4ED8]/10 text-[#1D4ED8] ring-[#1D4ED8]/25" : "bg-[#CCFBF1] text-[#0E7490] ring-[#0E7490]/30"}`}>{p.legalBasis}</span></Shown>
                                </td>
                                <td className="max-w-[260px] px-4 py-3"><Linked items={p.categories} links={p.categoryLinks} warm /></td>
                                <td className="max-w-[260px] px-4 py-3"><Linked items={p.processors} links={p.processorLinks} /></td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-[#0F172A]"><Shown value={p.retention} /></p>
                                    <p className="text-[11px] text-[#475569]">
                                        <Shown value={p.lapses === undefined ? undefined : "x"}>{p.lapses ? "Consent lapses" : "Consent does not lapse"}</Shown>
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {p.mandatory && <span className={`${chip} ${WARM}`}>Mandatory</span>}
                                        <span className={`${chip} ${p.active ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]"}`}>{p.active ? "Active" : "Archived"}</span>
                                        {p.prohibitedForChildren && <span className={`${chip} ${NEUTRAL}`}>Not for children</span>}
                                        <Shown value={p.risk}><span className={`${chip} ${riskTone(p.risk)}`}>{p.risk}</span></Shown>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col items-start gap-1.5">
                                        <button type="button" onClick={() => onHistory?.(p)} className="h-7 rounded-lg border border-[#E2E8F0] px-3 text-[11px] font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">History</button>
                                        <button type="button" onClick={() => onEdit?.(p)} disabled={!p.active} title={p.active ? undefined : "Archived versions cannot be edited. Edit the current version."} className="h-7 rounded-lg border border-[#E2E8F0] px-3 text-[11px] font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-50">Edit</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
