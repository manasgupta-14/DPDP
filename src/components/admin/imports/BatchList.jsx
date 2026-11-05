import { useMemo, useState } from "react";
import { formatWhen } from "../../../utils/bulkImport.js";
import { panel } from "../../shared/ui.js";
import { BatchBadge } from "./Badges.jsx";

const select = "mt-1.5 h-10 w-full min-w-[12rem] rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40";

export default function BatchList({ batches, kinds: knownKinds, statuses: knownStatuses, loading, query, onOpen }) {
    const [status, setStatus] = useState("");
    const [kind, setKind] = useState("");
    // Known options + koi bhi aisi value jo batches mein aayi ho, taaki filter kabhi kisi batch ko chhupa na de
    const kinds = useMemo(() => {
        const extra = [...new Set(batches.map((b) => b.importType).filter((v) => v && !knownKinds.some((k) => k.value === v)))];
        return [...knownKinds, ...extra.map((v) => ({ value: v, label: v }))];
    }, [batches, knownKinds]);
    const statuses = useMemo(() => {
        const extra = [...new Set(batches.map((b) => b.status).filter((v) => v && !knownStatuses.some((s) => s.value === v)))];
        return [...knownStatuses, ...extra.map((v) => ({ value: v, label: v }))];
    }, [batches, knownStatuses]);
    const kindLabel = (value) => kinds.find((k) => k.value === value)?.label || value || "-";

    const shown = useMemo(() => {
        const q = String(query || "").trim().toLowerCase();
        return batches.filter((b) => (!status || b.status === status) && (!kind || b.importType === kind) && (!q || `${b.fileName} ${b.id}`.toLowerCase().includes(q)));
    }, [batches, status, kind, query]);

    return (
        <section className={`${panel} p-6`}>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Batches</h2>
                <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">{batches.length} total</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <label className="block text-xs font-semibold text-[#334155]">
                        Kind
                        <select value={kind} onChange={(e) => setKind(e.target.value)} className={select}>
                            <option value="">Any</option>
                            {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                        </select>
                    </label>
                    <label className="block text-xs font-semibold text-[#334155]">
                        Status
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
                            <option value="">Any</option>
                            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>
                </div>
                <button type="button" disabled={!status && !kind} onClick={() => { setStatus(""); setKind(""); }} className="text-sm font-semibold text-[#0F766E] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline">
                    Clear filters
                </button>
            </div>

            {loading ? (
                <div className="mt-4 space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[#E2E8F0]/70" />)}</div>
            ) : shown.length === 0 ? (
                <div className="py-14 text-center">
                    <p className="text-sm font-semibold text-[#0F172A]">{batches.length === 0 ? "No batches yet" : "No records found"}</p>
                    <p className="mt-1 text-xs text-[#64748B]">{batches.length === 0 ? "Stage a CSV above and it will appear here." : "Try widening your filters."}</p>
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-[#64748B]">
                                <th className="py-2 pr-3 font-semibold">Batch</th>
                                <th className="py-2 pr-3 font-semibold">Type</th>
                                <th className="py-2 pr-3 font-semibold">Rows</th>
                                <th className="py-2 pr-3 font-semibold">Valid / Invalid</th>
                                <th className="py-2 pr-3 font-semibold">Staged</th>
                                <th className="py-2 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((b) => (
                                <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer border-b border-[#E2E8F0] transition last:border-0 hover:bg-[#F8FAFC]">
                                    <td className="py-3 pr-3">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(b.id); }} className="text-left font-medium text-[#0F766E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">{b.fileName}</button>
                                        <p className="font-mono text-xs text-[#64748B]">{b.id}</p>
                                    </td>
                                    <td className="py-3 pr-3 text-[#475569]">{kindLabel(b.importType)}</td>
                                    <td className="py-3 pr-3 text-[#475569]">{b.total.toLocaleString()}</td>
                                    <td className="py-3 pr-3 text-xs font-semibold">
                                        <span className="text-[#16A34A]">{b.processed}</span> / <span className="text-[#DC2626]">{b.failed}</span>
                                    </td>
                                    <td className="py-3 pr-3 text-[#475569]">{formatWhen(b.createdAt)}</td>
                                    <td className="py-3"><BatchBadge status={b.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
