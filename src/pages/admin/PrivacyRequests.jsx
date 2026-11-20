import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getPrivacyRequests } from "../../api/privacyRequest.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import NewTag from "../../components/shared/NewTag.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";
import { useNewItems } from "../../utils/newItems.js";
import { REQUEST_TYPES, STATUSES, dateText, dueInfo, shortId, statusLabel } from "../../utils/privacyRequest.js";

const PAGE_SIZE = 10;
const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";

function Deadline({ r }) {
    const due = dueInfo(r);
    return (
        <div className="space-y-0.5">
            {due && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${due.overdue ? "bg-bad/10 text-bad-ink" : "bg-warn/10 text-warn-ink"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {due.text}
                </span>
            )}
            <p className="text-xs text-muted">{dateText(r.target)}</p>
        </div>
    );
}

export default function PrivacyRequests() {
    const { isNew } = useNewItems();
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
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Rights Requests</h1>
                    <p className="mt-1 text-sm text-ink-3">Access, correction, erasure and other requests from Data Principals. Open a request to update its status.</p>
                </div>
                <button type="button" onClick={load} disabled={loading} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {!loading && overdue > 0 && (
                <div role="alert" className="rounded-2xl border border-bad/30 bg-bad/10 px-5 py-4 text-sm text-ink">
                    <p className="font-semibold text-bad-ink">{overdue} request{overdue === 1 ? " on this page is" : "s on this page are"} past the deadline</p>
                    <p className="mt-0.5 text-ink-3">Missing the legal deadline is itself a breach of the Act. Handle these first and note the reason for each delay.</p>
                </div>
            )}

            <section aria-label="Filters" className={`${panel} grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto_auto] md:items-end`}>
                <label className="text-xs font-medium text-ink-3">
                    Search
                    <input value={search} onChange={onFilter(setSearch)} placeholder="Reference ID, name or email" className={`${field} py-2`} />
                </label>
                <label className="text-xs font-medium text-ink-3">
                    Status
                    <select value={status} onChange={onFilter(setStatus)} className={`${field} py-2`}>
                        <option value="">Any status</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-ink-3">
                    Type
                    <select value={type} onChange={onFilter(setType)} className={`${field} py-2`}>
                        <option value="">Any right</option>
                        {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-ink">
                    <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} className="h-4 w-4 accent-brand" />
                    Overdue only
                </label>
                <button type="button" onClick={reset} disabled={!filtersOn} className="pb-2.5 text-xs font-semibold text-ink-3 underline disabled:no-underline disabled:opacity-40">Clear filters</button>
            </section>

            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            {loading && !refreshing ? (
                <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-16 pg-shimmer rounded-2xl" />)}</div>
            ) : showEmpty ? (
                <div className={`${panel} px-5 py-12 text-center`}>
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink"><Icon name="rights" className="h-6 w-6" /></span>
                    <p className="mt-3 font-semibold">{filtersOn ? "No requests match these filters" : "No Rights Requests yet"}</p>
                    <p className="mt-1 text-sm text-ink-3">{filtersOn ? "Try a different status or right." : "Requests raised from the user Privacy settings page will appear here."}</p>
                </div>
            ) : (
                <div className={`${panel} overflow-x-auto transition-opacity ${refreshing ? "opacity-60" : ""}`}>
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="border-b border-line bg-soft">
                            <tr>
                                <th className={th}>Request ID</th>
                                <th className={th}>Right exercised</th>
                                <th className={th}>Data principal</th>
                                <th className={th}>Status</th>
                                <th className={th}>Deadline</th>
                                <th className={th}>Raised</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {items.map((r) => (
                                <tr key={r.id} className="transition hover:bg-soft">
                                    <td className="px-4 py-3.5">
                                        <Link to={`/dashboard/rights-requests/${encodeURIComponent(r.id)}`} className="font-mono text-xs font-semibold text-brand-ink hover:underline" title={r.id}>{r.referenceId || shortId(r.id)}</Link>
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-ink"><NewTag show={isNew("rights", r.id)} className="mr-2 align-middle" />{r.type || "-"}</td>
                                    <td className="px-4 py-3.5">
                                        <span className="font-medium text-ink" title="Name is masked">{r.principalName || shortId(r.principalId)}</span>
                                    </td>
                                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3.5"><Deadline r={r} /></td>
                                    <td className="px-4 py-3.5 text-ink-2">{dateText(r.created)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && total > PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted">Page {current} of {pages} · {total} request{total === 1 ? "" : "s"} in total</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage(current - 1)} disabled={current === 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                        <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
