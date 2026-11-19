import { useMemo, useState } from "react";
import { formatWhen } from "../../../utils/bulkImport.js";
import { panel } from "../../shared/ui.js";
import { BatchBadge } from "./Badges.jsx";

const select = "mt-1.5 h-10 w-full min-w-[12rem] rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-focus/40";

export default function BatchList({ batches, kinds: knownKinds, statuses: knownStatuses, loading, query, onOpen }) {
    const [status, setStatus] = useState("");
    const [kind, setKind] = useState("");
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
                <div>
                    <h2 className="text-lg font-semibold">Batches</h2>
                    <p className="mt-0.5 text-xs text-muted">Every file you uploaded, with its row counts and status.</p>
                </div>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">{batches.length} total</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-soft p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <label className="block text-xs font-semibold text-ink-2">
                        Kind
                        <select value={kind} onChange={(e) => setKind(e.target.value)} className={select}>
                            <option value="">Any</option>
                            {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                        </select>
                    </label>
                    <label className="block text-xs font-semibold text-ink-2">
                        Status
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
                            <option value="">Any</option>
                            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </label>
                </div>
                <button type="button" disabled={!status && !kind} onClick={() => { setStatus(""); setKind(""); }} className="text-sm font-semibold text-brand-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline">
                    Clear filters
                </button>
            </div>

            {loading ? (
                <div className="mt-4 space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-12 pg-shimmer rounded-xl" />)}</div>
            ) : shown.length === 0 ? (
                <div className="py-14 text-center">
                    <p className="text-sm font-semibold text-ink">{batches.length === 0 ? "No batches yet" : "No records found"}</p>
                    <p className="mt-1 text-xs text-muted">{batches.length === 0 ? "Upload a CSV above and it will appear here." : "Try widening your filters."}</p>
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
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
                                <tr key={b.id} onClick={() => onOpen(b.id)} className="cursor-pointer border-b border-line transition last:border-0 hover:bg-soft">
                                    <td className="py-3 pr-3">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(b.id); }} className="text-left font-medium text-brand-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">{b.fileName}</button>
                                        <p className="font-mono text-xs text-muted">{b.id}</p>
                                    </td>
                                    <td className="py-3 pr-3 text-ink-3">{kindLabel(b.importType)}</td>
                                    <td className="py-3 pr-3 text-ink-3">{b.total.toLocaleString()}</td>
                                    <td className="py-3 pr-3 text-xs font-semibold">
                                        <span className="text-ok-ink">{b.processed}</span> / <span className="text-bad-ink">{b.failed}</span>
                                    </td>
                                    <td className="py-3 pr-3 text-ink-3">{formatWhen(b.createdAt)}</td>
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
