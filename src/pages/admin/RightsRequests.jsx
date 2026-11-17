import { useCallback, useEffect, useState } from "react";
import { getRightsRequestDetail, getPrivacyRequestList, resolvePrivacyRequest } from "../../api/privacyRequest.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { RIGHT_STATUSES, RIGHT_TYPES, TONES, isFinal, rightLabel, statusInfo } from "../../utils/rightsRequest.js";

const PAGE_SIZE = 10;
const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted";
const td = "px-3 py-3 text-sm text-ink-2";

function StatusPill({ status }) {
    const s = statusInfo(status);
    return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONES[s.tone]}`}>{s.label}</span>;
}

function DetailModal({ id, onClose, onSaved }) {
    const [state, setState] = useState({ loading: true, data: null, error: "" });
    const [status, setStatus] = useState("");
    const [remarks, setRemarks] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        getRightsRequestDetail(id).then((res) => {
            if (!active) return;
            setState({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
            if (res.ok) {
                setStatus(res.data.status === "Submitted" ? "InProgress" : res.data.status);
                setRemarks(res.data.remarks);
            }
        });
        return () => {
            active = false;
        };
    }, [id]);

    const r = state.data;
    const erasing = r?.type === "Erasure" && status === "Fulfilled";

    const save = async (e) => {
        e.preventDefault();
        if (!remarks.trim()) return setError("Add a short note explaining this update.");
        setBusy(true);
        setError("");
        const res = await resolvePrivacyRequest(id, { status, resolutionRemarks: remarks });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onSaved(`${r.reference} updated to ${statusInfo(status).label}.`);
    };

    return (
        <Modal title="Request detail" onClose={() => !busy && onClose()}>
            <div className="max-h-[88vh] space-y-5 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                {state.loading ? (
                    <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-12 pg-shimmer rounded-xl" />)}</div>
                ) : state.error ? (
                    <Alert>{state.error}</Alert>
                ) : (
                    <>
                        <div className="pr-8">
                            <p className="font-mono text-xs text-muted">{r.reference}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold">Right to {rightLabel(r.type).toLowerCase()}</h2>
                                <StatusPill status={r.status} />
                                {r.overdue && <span className="text-xs font-semibold text-bad-ink">Overdue</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[["Raised by", r.principalName || "-"], ["Email", r.principalEmail || "-"], ["Mobile", r.principalMobile || "-"], ["Respond by", formatDate(r.deadline)]].map(([k, v]) => (
                                <div key={k} className="min-w-0 rounded-xl bg-soft p-3 ring-1 ring-line">
                                    <p className="text-xs text-muted">{k}</p>
                                    <p className="mt-0.5 truncate text-sm font-semibold" title={v}>{v}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-ink-3">Request</p>
                            <p className="mt-1 whitespace-pre-wrap break-words rounded-xl border border-line bg-soft px-4 py-3 text-sm">{r.details}</p>
                            <p className="mt-1.5 text-xs text-muted">Raised {formatDate(r.createdAt)}{r.resolvedAt ? ` · Last updated ${formatDate(r.resolvedAt)}` : ""}</p>
                        </div>

                        <form onSubmit={save} noValidate className="space-y-3 rounded-xl border border-line p-4">
                            <p className="text-sm font-semibold">Update status</p>
                            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                                <label className="block text-sm font-medium text-ink-2">
                                    Status
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy} className={field}>
                                        {RIGHT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-ink-2">
                                    Note for the data principal
                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} disabled={busy} placeholder="What action was taken, or why it was rejected." className={field} />
                                </label>
                            </div>
                            {erasing && <Alert>Marking an Erasure request as Fulfilled permanently anonymises this data principal's name, email, mobile and consumer number.</Alert>}
                            <Alert>{error}</Alert>
                            <div className="flex justify-end gap-2.5">
                                <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Close</button>
                                <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Save update"}</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default function RightsRequests() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [state, setState] = useState({ loading: true, rows: [], total: 0, error: "" });
    const [refreshKey, setRefreshKey] = useState(0);
    const [openId, setOpenId] = useState(null);
    const [flash, setFlash] = useState("");

    useEffect(() => {
        const t = setTimeout(() => {
            if (search === query) return;
            setState((s) => ({ ...s, loading: true }));
            setQuery(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [search, query]);

    useEffect(() => {
        let active = true;
        getPrivacyRequestList({ search: query, status, type, overdueOnly, page, pageSize: PAGE_SIZE }).then((res) => {
            if (!active) return;
            setState(res.ok ? { loading: false, rows: res.data.rows, total: res.data.total, error: "" } : { loading: false, rows: [], total: 0, error: res.error });
        });
        return () => {
            active = false;
        };
    }, [query, status, type, overdueOnly, page, refreshKey]);

    const reload = useCallback(() => {
        setState((s) => ({ ...s, loading: true }));
        setRefreshKey((k) => k + 1);
    }, []);

    const filter = (setter) => (value) => {
        setter(value);
        setPage(1);
        setState((s) => ({ ...s, loading: true }));
    };

    const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));
    const hasFilters = !!(query || status || type || overdueOnly);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">DSAR</h1>
                    <p className="mt-1 max-w-3xl text-sm text-ink-3">Rights requests raised by data principals. Open a request to see the details and update its status. Every request must be answered within 30 days.</p>
                </div>
                <button type="button" onClick={reload} disabled={state.loading} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}

            <div className={`${panel} grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]`}>
                <label className="text-xs font-medium text-ink-3">
                    Search
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, name or email" className={`${field} py-2`} />
                </label>
                <label className="text-xs font-medium text-ink-3">
                    Status
                    <select value={status} onChange={(e) => filter(setStatus)(e.target.value)} className={`${field} py-2`}>
                        <option value="">Any status</option>
                        {RIGHT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </label>
                <label className="text-xs font-medium text-ink-3">
                    Right
                    <select value={type} onChange={(e) => filter(setType)(e.target.value)} className={`${field} py-2`}>
                        <option value="">Any right</option>
                        {RIGHT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </label>
                <label className="flex h-10 items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" checked={overdueOnly} onChange={(e) => filter(setOverdueOnly)(e.target.checked)} />
                    Overdue only
                </label>
            </div>

            {state.error && <Alert action={<button type="button" onClick={reload} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}

            <div className={`${panel} overflow-hidden`}>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 pg-shimmer rounded" />)}</div>
                ) : state.rows.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-ink-3">{hasFilters ? "No requests match these filters." : "No rights requests yet."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px]">
                            <thead className="bg-soft">
                                <tr><th className={`${th} pl-5`}>Reference</th><th className={th}>Data principal</th><th className={th}>Right</th><th className={th}>Status</th><th className={th}>Raised</th><th className={th}>Respond by</th><th className={`${th} pr-5`} /></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {state.rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-soft">
                                        <td className={`${td} pl-5 font-mono text-xs`}>{r.reference}</td>
                                        <td className={`${td} font-medium text-ink`}>{r.principalName || "-"}</td>
                                        <td className={td}>{rightLabel(r.type)}</td>
                                        <td className={td}><StatusPill status={r.status} /></td>
                                        <td className={td}>{formatDate(r.createdAt)}</td>
                                        <td className={`${td} ${r.overdue ? "font-semibold text-bad-ink" : ""}`}>{formatDate(r.deadline)}{r.overdue ? " · Overdue" : ""}</td>
                                        <td className={`${td} pr-5 text-right`}>
                                            <button type="button" onClick={() => { setFlash(""); setOpenId(r.id); }} className="whitespace-nowrap font-semibold text-brand-ink hover:underline">{isFinal(r.status) ? "View" : "Open"}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!state.loading && state.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-3">
                    <p>{state.total} total · Page {page} of {pages}</p>
                    {pages > 1 && (
                        <div className="flex gap-2">
                            <button type="button" onClick={() => { setPage(page - 1); setState((st) => ({ ...st, loading: true })); }} disabled={page <= 1} className={ghostBtn}>Previous</button>
                            <button type="button" onClick={() => { setPage(page + 1); setState((st) => ({ ...st, loading: true })); }} disabled={page >= pages} className={ghostBtn}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {openId && <DetailModal key={openId} id={openId} onClose={() => setOpenId(null)} onSaved={(msg) => { setOpenId(null); setFlash(msg); reload(); }} />}
        </div>
    );
}
