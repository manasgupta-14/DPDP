import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAuditLogs } from "../../api/audit.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";
import { ACTION_TONE, actionKind, auditToCsv, buildDiff, countByKind, formatValue, shortId } from "../../utils/audit.js";

const PAGE_SIZE = 20;

const when = (d) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : "-");

function Stat({ label, value, tone }) {
    return (
        <div className={`${panel} pg-card p-4`}>
            <p className="text-xs font-medium text-[#64748B]">{label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${tone}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function ActionBadge({ action }) {
    const kind = actionKind(action);
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ACTION_TONE[kind]}`}>{action || "Unknown"}</span>;
}

function Changes({ log }) {
    const [all, setAll] = useState(false);
    const rows = buildDiff(log);
    const changed = rows.filter((r) => r.changed);
    const kind = actionKind(log.action);
    const shown = all || kind !== "update" || changed.length === 0 ? rows : changed;

    return (
        <div className="space-y-4 px-5 py-4 sm:px-6">
            <dl className="grid gap-x-8 gap-y-2 text-xs sm:grid-cols-3">
                <div className="min-w-0"><dt className="text-[#64748B]">Event ID</dt><dd className="mt-0.5 break-all font-mono text-[#0F172A]">{log.id}</dd></div>
                <div className="min-w-0"><dt className="text-[#64748B]">Done by (user ID)</dt><dd className="mt-0.5 break-all font-mono text-[#0F172A]">{log.userId || "System or unknown"}</dd></div>
                <div className="min-w-0"><dt className="text-[#64748B]">Record ID</dt><dd className="mt-0.5 break-all font-mono text-[#0F172A]">{log.key || "-"}</dd></div>
            </dl>

            {rows.length === 0 ? (
                <p className="text-sm text-[#475569]">No field values were recorded for this event.</p>
            ) : (
                <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#0F172A]">
                            {kind === "update" && !all && changed.length > 0 ? `${changed.length} changed field${changed.length === 1 ? "" : "s"}` : `${rows.length} field${rows.length === 1 ? "" : "s"}`}
                        </p>
                        {kind === "update" && changed.length > 0 && rows.length > changed.length && (
                            <button type="button" onClick={() => setAll((v) => !v)} className="text-xs font-semibold text-[#0F766E] underline-offset-2 hover:underline">
                                {all ? "Show changed only" : "Show all fields"}
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
                        <table className="w-full min-w-[520px] text-left text-xs">
                            <thead className="bg-[#F8FAFC] text-[#64748B]">
                                <tr><th className="px-3 py-2 font-semibold">Field</th><th className="px-3 py-2 font-semibold">Before</th><th className="px-3 py-2 font-semibold">After</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {shown.map((r) => (
                                    <tr key={r.field}>
                                        <td className="whitespace-nowrap px-3 py-2 font-medium text-[#0F172A]">{r.field}</td>
                                        <td className={`max-w-[280px] break-words px-3 py-2 font-mono ${r.changed && r.before !== undefined ? "bg-[#DC2626]/5 text-[#991B1B]" : "text-[#475569]"}`}>{formatValue(r.field, r.before) || "-"}</td>
                                        <td className={`max-w-[280px] break-words px-3 py-2 font-mono ${r.changed && r.after !== undefined ? "bg-[#16A34A]/5 text-[#166534]" : "text-[#475569]"}`}>{formatValue(r.field, r.after) || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3 p-5" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-11 animate-pulse rounded-lg bg-[#E2E8F0]/70" />)}
        </div>
    );
}

export default function AuditTrail() {
    const { query } = useOutletContext() || { query: "" };
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [action, setAction] = useState("");
    const [table, setTable] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(null);

    const load = useCallback(async () => {
        setRefreshing(true);
        setError("");
        const res = await getAuditLogs();
        if (res.ok) setLogs(res.data);
        else setError(res.error);
        setRefreshing(false);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getAuditLogs().then((res) => {
            if (!active) return;
            if (res.ok) setLogs(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const tables = useMemo(() => [...new Set(logs.map((l) => l.table).filter(Boolean))].sort(), [logs]);
    const actions = useMemo(() => [...new Set(logs.map((l) => l.action).filter(Boolean))].sort(), [logs]);
    const counts = useMemo(() => countByKind(logs), [logs]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        const start = from ? new Date(`${from}T00:00:00`).getTime() : null;
        const end = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
        return logs.filter((l) => {
            if (action && l.action !== action) return false;
            if (table && l.table !== table) return false;
            const t = l.time ? l.time.getTime() : null;
            if (start !== null && (t === null || t < start)) return false;
            if (end !== null && (t === null || t > end)) return false;
            if (!q) return true;
            return [l.table, l.action, l.key, l.userId, l.ip, ...Object.keys(l.oldValues || {}), ...Object.keys(l.newValues || {})]
                .some((v) => v && String(v).toLowerCase().includes(q));
        });
    }, [logs, query, action, table, from, to]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    const filtering = !!(action || table || from || to || (query || "").trim());

    const reset = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
        setOpen(null);
    };

    const clear = () => {
        setAction("");
        setTable("");
        setFrom("");
        setTo("");
        setPage(1);
        setOpen(null);
    };

    const exportCsv = () => {
        const blob = new Blob([auditToCsv(filtered)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Audit trail</h1>
                    <p className="mt-1 text-sm text-[#475569]">Every change made to your organisation&rsquo;s data, newest first. Times are shown in your local time zone.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-50">
                        Export CSV
                    </button>
                </div>
            </div>

            <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total events" value={counts.total} tone="text-[#0F172A]" />
                <Stat label="Created" value={counts.create} tone="text-[#16A34A]" />
                <Stat label="Updated" value={counts.update} tone="text-[#D97706]" />
                <Stat label="Deleted" value={counts.delete} tone="text-[#DC2626]" />
            </section>

            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-end gap-3 border-b border-[#E2E8F0] px-5 py-4">
                    <label className="text-xs font-medium text-[#475569]">
                        Action
                        <select value={action} onChange={reset(setAction)} className={`${field} mt-1 min-w-[140px] py-2`}>
                            <option value="">All actions</option>
                            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-[#475569]">
                        Table
                        <select value={table} onChange={reset(setTable)} className={`${field} mt-1 min-w-[160px] py-2`}>
                            <option value="">All tables</option>
                            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-[#475569]">
                        From
                        <input type="date" value={from} max={to || undefined} onChange={reset(setFrom)} className={`${field} mt-1 py-2`} />
                    </label>
                    <label className="text-xs font-medium text-[#475569]">
                        To
                        <input type="date" value={to} min={from || undefined} onChange={reset(setTo)} className={`${field} mt-1 py-2`} />
                    </label>
                    {filtering && <button type="button" onClick={clear} className="pb-2.5 text-sm font-semibold text-[#0F766E] hover:underline">Clear filters</button>}
                    <p className="ml-auto pb-2.5 text-xs text-[#64748B]">Showing {filtered.length.toLocaleString()} of {logs.length.toLocaleString()}</p>
                </div>

                {error && (
                    <div className="p-4">
                        <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>
                    </div>
                )}

                {loading ? (
                    <Skeleton />
                ) : filtered.length === 0 && !error ? (
                    <div className="px-5 py-12 text-center">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="audit" className="h-6 w-6" /></span>
                        <p className="mt-3 font-semibold text-[#0F172A]">{logs.length === 0 ? "No audit events yet" : "No events match these filters"}</p>
                        <p className="mt-1 text-sm text-[#475569]">{logs.length === 0 ? "Changes to your organisation's data will be recorded here." : "Try a different action, table or date range."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#64748B]">
                                <tr>
                                    <th className="px-5 py-3">Time</th>
                                    <th className="px-3 py-3">Action</th>
                                    <th className="px-3 py-3">Table</th>
                                    <th className="px-3 py-3">Record</th>
                                    <th className="px-3 py-3">User</th>
                                    <th className="px-3 py-3">IP address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {slice.map((l) => {
                                    const expanded = open === l.id;
                                    return (
                                        <Fragment key={l.id}>
                                            <tr className={expanded ? "bg-[#F8FAFC]" : "hover:bg-[#F8FAFC]"}>
                                                <td className="whitespace-nowrap px-5 py-3">
                                                    <button type="button" onClick={() => setOpen(expanded ? null : l.id)} aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} details for ${l.action} on ${l.table}`} className="flex items-center gap-2 rounded-md text-left text-[#0F172A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                                                        <Icon name="chevron" className={`h-4 w-4 text-[#64748B] transition-transform ${expanded ? "rotate-180" : "-rotate-90"}`} />
                                                        {when(l.time)}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3"><ActionBadge action={l.action} /></td>
                                                <td className="px-3 py-3 font-medium text-[#0F172A]">{l.table || "-"}</td>
                                                <td className="px-3 py-3 font-mono text-xs text-[#334155]" title={l.key}>{shortId(l.key)}</td>
                                                <td className="px-3 py-3 font-mono text-xs text-[#334155]" title={l.userId || ""}>{l.userId ? shortId(l.userId) : "System"}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-[#334155]">{l.ip || "-"}</td>
                                            </tr>
                                            {expanded && (
                                                <tr>
                                                    <td colSpan={6} className="border-t border-[#E2E8F0] bg-[#F8FAFC] p-0"><Changes log={l} /></td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filtered.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-5 py-3">
                        <p className="text-xs text-[#64748B]">Page {current} of {pages}</p>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => { setPage(current - 1); setOpen(null); }} disabled={current === 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                            <button type="button" onClick={() => { setPage(current + 1); setOpen(null); }} disabled={current === pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
