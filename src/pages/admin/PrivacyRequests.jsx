import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getPrivacyRequests } from "../../api/privacyRequest.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import NotInApi from "../../components/shared/NotInApi.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";
import { REQUEST_TYPES, STATUSES, dateText, dueInfo, shortId, statusLabel } from "../../utils/privacyRequest.js";

const PAGE_SIZE = 10;
const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]";

function Deadline({ r }) {
    const due = dueInfo(r);
    return (
        <div className="space-y-0.5">
            {due && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${due.overdue ? "bg-[#DC2626]/10 text-[#B91C1C]" : "bg-[#D97706]/10 text-[#B45309]"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {due.text}
                </span>
            )}
            <p className="text-xs text-[#64748B]">{dateText(r.target)}</p>
        </div>
    );
}

export default function PrivacyRequests() {
    const { query } = useOutletContext() || { query: "" };
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [reload, setReload] = useState(0);
    const [debounced, setDebounced] = useState("");
    const [result, setResult] = useState({ key: "", items: [], total: 0, error: "" });

    const typed = `${search} ${query || ""}`.trim();

    // The backend does the searching, so wait until the user stops typing before calling it.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebounced(typed);
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [typed]);

    const key = JSON.stringify([debounced, status, type, overdueOnly, page, reload]);
    const loading = result.key !== key;
    const refreshing = loading && result.key !== "";

    useEffect(() => {
        let active = true;
        getPrivacyRequests({ search: debounced, status, type, overdueOnly, page, pageSize: PAGE_SIZE }).then((res) => {
            if (!active) return;
            setResult(res.ok
                ? { key, items: res.data.items, total: res.data.totalCount, error: "" }
                : { key, items: [], total: 0, error: res.error });
        });
        return () => {
            active = false;
        };
    }, [key, debounced, status, type, overdueOnly, page]);

    const { items, total, error } = result;
    const load = () => setReload((n) => n + 1);
    const overdue = useMemo(() => items.filter((r) => dueInfo(r)?.overdue).length, [items]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, pages);
    const filtersOn = search || status || type || overdueOnly;

    const reset = () => {
        setSearch("");
        setStatus("");
        setType("");
        setOverdueOnly(false);
        setPage(1);
    };
    const onFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };
    const showEmpty = !loading && items.length === 0 && !error;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rights Requests</h1>
                    <p className="mt-1 text-sm text-[#475569]">Access, correction, erasure and other requests from Data Principals. Open a request to update its status.</p>
                </div>
                <button type="button" onClick={load} disabled={loading} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {!loading && overdue > 0 && (
                <div role="alert" className="rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 px-5 py-4 text-sm text-[#0F172A]">
                    <p className="font-semibold text-[#991B1B]">{overdue} request(s) on this page are past their deadline</p>
                    <p className="mt-0.5 text-[#475569]">A request that misses its statutory deadline is a contravention in itself. Work these first, and record why the delay happened on each one.</p>
                </div>
            )}

            <section aria-label="Filters" className={`${panel} grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto_auto] md:items-end`}>
                <label className="text-xs font-medium text-[#475569]">
                    Search
                    <input value={search} onChange={onFilter(setSearch)} placeholder="Reference ID, name or email" className={`${field} py-2`} />
                </label>
                <label className="text-xs font-medium text-[#475569]">
                    Status
                    <select value={status} onChange={onFilter(setStatus)} className={`${field} py-2`}>
                        <option value="">Any status</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-[#475569]">
                    Type
                    <select value={type} onChange={onFilter(setType)} className={`${field} py-2`}>
                        <option value="">Any right</option>
                        {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-[#0F172A]">
                    <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} className="h-4 w-4 accent-[#0F766E]" />
                    Overdue only
                </label>
                <button type="button" onClick={reset} disabled={!filtersOn} className="pb-2.5 text-xs font-semibold text-[#475569] underline disabled:no-underline disabled:opacity-40">Clear filters</button>
            </section>

            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            {loading && !refreshing ? (
                <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#E2E8F0]/70" />)}</div>
            ) : showEmpty ? (
                <div className={`${panel} px-5 py-12 text-center`}>
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="rights" className="h-6 w-6" /></span>
                    <p className="mt-3 font-semibold">{filtersOn ? "No requests match these filters" : "No Rights Requests yet"}</p>
                    <p className="mt-1 text-sm text-[#475569]">{filtersOn ? "Try a different status or right." : "Requests raised from the user Privacy settings page will appear here."}</p>
                </div>
            ) : (
                <div className={`${panel} overflow-x-auto transition-opacity ${refreshing ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                            <tr>
                                <th className={th}>Request ID</th>
                                <th className={th}>Right exercised</th>
                                <th className={th}>Data principal</th>
                                <th className={th}>Status</th>
                                <th className={th}>Tasks</th>
                                <th className={th}>Deadline</th>
                                <th className={th}>Assigned to</th>
                                <th className={th}>Raised</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {items.map((r) => (
                                <tr key={r.id} className="transition hover:bg-[#F8FAFC]">
                                    <td className="px-4 py-3.5">
                                        <Link to={`/dashboard/rights-requests/${encodeURIComponent(r.id)}`} className="font-mono text-xs font-semibold text-[#0F766E] hover:underline" title={r.id}>{r.referenceId || shortId(r.id)}</Link>
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-[#0F172A]">{r.type || "-"}</td>
                                    <td className="px-4 py-3.5">
                                        <span className="font-medium text-[#0F172A]" title="Name is masked by the backend">{r.principalName || shortId(r.principalId)}</span>
                                    </td>
                                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3.5"><NotInApi /></td>
                                    <td className="px-4 py-3.5"><Deadline r={r} /></td>
                                    <td className="px-4 py-3.5"><NotInApi /></td>
                                    <td className="px-4 py-3.5 text-[#334155]">{dateText(r.created)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && total > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-[#64748B]">Page {current} of {pages} · {total} request{total === 1 ? "" : "s"} in total</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                        <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
