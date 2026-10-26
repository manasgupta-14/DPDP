import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAllPrivacyRequests, resolvePrivacyRequest } from "../../api/privacyRequest.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { FILTER_CLOSED, FILTER_OVERDUE, REPLY_TEMPLATES, REQUEST_TYPES, STATUSES, dateText, dateTimeText, dueInfo, isClosed, typeLabel } from "../../utils/privacyRequest.js";

const PAGE_SIZE = 10;
const shortId = (id) => (id ? String(id).slice(0, 8) : "-");
const allTemplates = Object.values(REPLY_TEMPLATES).flat();

function Stat({ label, value, tone, onClick, pressed }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={pressed}
            className={`${panel} pg-card p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${pressed ? "border-[#0F766E] bg-[#F0FDFA]" : "hover:border-[#94A3B8]"}`}
        >
            <p className="text-xs font-medium text-[#64748B]">{label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
        </button>
    );
}

function UpdateForm({ request, onSaved, onCancel }) {
    const next = request.status === "Pending" ? "In-Progress" : request.status;
    const [status, setStatus] = useState(next);
    const [remarks, setRemarks] = useState(request.remarks || REPLY_TEMPLATES[next]?.[0] || "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const changeStatus = (value) => {
        setStatus(value);
        if (!remarks.trim() || allTemplates.includes(remarks)) setRemarks(REPLY_TEMPLATES[value]?.[0] || "");
    };

    const save = async (e) => {
        e.preventDefault();
        if (!remarks.trim()) {
            setError("Add a short note for the user explaining this update.");
            return;
        }
        setBusy(true);
        setError("");
        const res = await resolvePrivacyRequest(request.id, { status, resolutionRemarks: remarks });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        onSaved(`Status updated to ${status}.`);
    };

    return (
        <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4" noValidate>
            <Alert>{error}</Alert>
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <label className="block text-sm font-medium text-[#0F172A]">
                    Status
                    <select value={status} onChange={(e) => changeStatus(e.target.value)} className={field}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
                <label className="block text-sm font-medium text-[#0F172A]">
                    Note for the user
                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="What action was taken, or why the request was rejected." className={field} />
                </label>
            </div>
            {(REPLY_TEMPLATES[status] || []).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-[#64748B]">Quick note:</span>
                    {REPLY_TEMPLATES[status].map((t) => (
                        <button key={t} type="button" onClick={() => setRemarks(t)} className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-left text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E]">
                            {t.length > 52 ? `${t.slice(0, 50)}...` : t}
                        </button>
                    ))}
                </div>
            )}
            <div className="flex gap-2.5">
                <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Save update"}</button>
                <button type="button" onClick={onCancel} disabled={busy} className={ghostBtn}>Cancel</button>
            </div>
        </form>
    );
}

function RequestCard({ r, who, editing, onEdit, onSaved }) {
    const due = dueInfo(r);
    return (
        <li className={`${panel} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-semibold text-[#0F172A]">{typeLabel(r.type)}</p>
                    <StatusBadge status={r.status} />
                    {due && <span className={`text-xs font-semibold ${due.overdue ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>{due.text}</span>}
                </div>
                {!editing && (
                    <button type="button" onClick={onEdit} className={`${isClosed(r.status) ? ghostBtn : primaryBtn} px-3 py-1.5`}>
                        {r.status === "Pending" ? "Start working" : isClosed(r.status) ? "Edit update" : "Update status"}
                    </button>
                )}
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#334155]">{r.details}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#64748B]">
                <div className="flex gap-1.5"><dt>Raised by</dt><dd className="font-medium text-[#334155]" title={r.principalId}>{who.name || <span className="font-mono">{shortId(r.principalId)}</span>}</dd></div>
                <div className="flex gap-1.5"><dt>Raised</dt><dd className="font-medium text-[#334155]">{dateTimeText(r.created)}</dd></div>
                <div className="flex gap-1.5"><dt>Respond by</dt><dd className="font-medium text-[#334155]">{dateText(r.target)}</dd></div>
                {isClosed(r.status) && r.resolved && <div className="flex gap-1.5"><dt>Closed</dt><dd className="font-medium text-[#334155]">{dateTimeText(r.resolved)}</dd></div>}
            </dl>
            {r.remarks && !editing && (
                <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                    <p className="text-xs font-semibold text-[#475569]">Note sent to the user</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#0F172A]">{r.remarks}</p>
                </div>
            )}
            {editing && <UpdateForm request={r} onSaved={onSaved} onCancel={() => onSaved(null)} />}
        </li>
    );
}

const time = (d) => d?.getTime() || 0;

export default function PrivacyRequests() {
    const { query } = useOutletContext() || { query: "" };
    const [items, setItems] = useState([]);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [missing, setMissing] = useState(false);
    const [notice, setNotice] = useState("");
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");
    const [sort, setSort] = useState("urgent");
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null);

    const apply = (res) => {
        if (res.ok) {
            setItems(res.data);
            setTeam(res.team || []);
            setError(res.error || "");
            setMissing(false);
        } else {
            setError(res.error);
            setMissing(!!res.missing);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await getAllPrivacyRequests());
    }, []);

    useEffect(() => {
        let active = true;
        getAllPrivacyRequests().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, []);

    const people = useMemo(() => new Map(team.map((m) => [String(m.id).toLowerCase(), { name: m.name }])), [team]);
    const whoIs = useCallback((id) => people.get(String(id).toLowerCase()) || { name: "" }, [people]);

    const counts = useMemo(() => ({
        total: items.length,
        pending: items.filter((r) => r.status === "Pending").length,
        progress: items.filter((r) => r.status === "In-Progress").length,
        closed: items.filter((r) => isClosed(r.status)).length,
        overdue: items.filter((r) => dueInfo(r)?.overdue).length,
    }), [items]);

    const filtered = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        const list = items.filter((r) => {
            if (status === FILTER_CLOSED ? !isClosed(r.status) : status === FILTER_OVERDUE ? !dueInfo(r)?.overdue : status && r.status !== status) return false;
            if (type && r.type !== type) return false;
            if (!q) return true;
            return [r.details, r.type, r.principalId, r.remarks, whoIs(r.principalId).name].some((v) => v && String(v).toLowerCase().includes(q));
        });
        const order =
            sort === "oldest" ? (a, b) => time(a.created) - time(b.created)
            : sort === "newest" ? (a, b) => time(b.created) - time(a.created)
            : (a, b) => (isClosed(a.status) - isClosed(b.status)) || (isClosed(a.status) ? time(b.created) - time(a.created) : time(a.target) - time(b.target));
        return [...list].sort(order);
    }, [items, query, status, type, sort, whoIs]);

    const typeOptions = useMemo(
        () => [...new Set([...REQUEST_TYPES.map((t) => t.value), ...items.map((r) => r.type).filter(Boolean)])],
        [items],
    );

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const saved = (message) => {
        setEditing(null);
        if (message) {
            setNotice(message);
            load();
        }
    };

    const onFilter = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
        setEditing(null);
    };

    const pickStatus = (value) => {
        setStatus((s) => (s === value ? "" : value));
        setPage(1);
        setEditing(null);
    };

    const headline = counts.overdue > 0
        ? `${counts.overdue} ${counts.overdue === 1 ? "request is" : "requests are"} past the 30-day response deadline.`
        : counts.pending > 0
            ? `${counts.pending} new ${counts.pending === 1 ? "request is" : "requests are"} waiting for you to start.`
            : "You are up to date. No request needs attention right now.";

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DSAR</h1>
                    <p className="mt-1 text-sm text-[#475569]">Data Subject Access Requests: access, correction, erasure and grievance requests raised by your users. Update the status and they will see it in their History.</p>
                    {!loading && items.length > 0 && <p className={`mt-2 text-sm font-semibold ${counts.overdue ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>{headline}</p>}
                </div>
                <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Stat label="Total requests" value={counts.total} tone="text-[#0F172A]" onClick={() => { setStatus(""); setPage(1); }} pressed={status === ""} />
                <Stat label="Pending" value={counts.pending} tone="text-[#D97706]" onClick={() => pickStatus("Pending")} pressed={status === "Pending"} />
                <Stat label="In progress" value={counts.progress} tone="text-[#0E7490]" onClick={() => pickStatus("In-Progress")} pressed={status === "In-Progress"} />
                <Stat label="Closed" value={counts.closed} tone="text-[#16A34A]" onClick={() => pickStatus(FILTER_CLOSED)} pressed={status === FILTER_CLOSED} />
                <Stat label="Overdue" value={counts.overdue} tone="text-[#DC2626]" onClick={() => pickStatus(FILTER_OVERDUE)} pressed={status === FILTER_OVERDUE} />
            </section>

            {notice && <Alert tone="success">{notice}</Alert>}

            {missing ? (
                <div className={`${panel} px-5 py-10 text-center`}>
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#D97706]/15 text-[#B45309]"><Icon name="alert" className="h-6 w-6" /></span>
                    <p className="mt-3 font-semibold">{error}</p>
                    <p className="mx-auto mt-1 max-w-lg text-sm text-[#475569]">Please try again.</p>
                    <button type="button" onClick={load} className={`${ghostBtn} mt-4`}>Refresh</button>
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="text-xs font-medium text-[#475569]">
                            Status
                            <select value={status} onChange={onFilter(setStatus)} className={`${field} min-w-[170px] py-2`}>
                                <option value="">All statuses</option>
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                <option value={FILTER_CLOSED}>Closed (resolved or rejected)</option>
                                <option value={FILTER_OVERDUE}>Overdue</option>
                            </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                            Type
                            <select value={type} onChange={onFilter(setType)} className={`${field} min-w-[170px] py-2`}>
                                <option value="">All types</option>
                                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-medium text-[#475569]">
                            Sort by
                            <select value={sort} onChange={onFilter(setSort)} className={`${field} min-w-[170px] py-2`}>
                                <option value="urgent">Most urgent first</option>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </label>
                        <p className="ml-auto pb-2.5 text-xs text-[#64748B]">Showing {filtered.length} of {items.length}</p>
                    </div>

                    {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

                    {loading ? (
                        <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#E2E8F0]/70" />)}</div>
                    ) : filtered.length === 0 && !error ? (
                        <div className={`${panel} px-5 py-12 text-center`}>
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="rights" className="h-6 w-6" /></span>
                            <p className="mt-3 font-semibold">{items.length === 0 ? "No DSARs yet" : "No requests match these filters"}</p>
                            <p className="mt-1 text-sm text-[#475569]">{items.length === 0 ? "Requests raised from the user Privacy settings page will appear here." : "Try a different status or type."}</p>
                            {items.length > 0 && <button type="button" onClick={() => { setStatus(""); setType(""); setPage(1); }} className={`${ghostBtn} mt-4`}>Clear filters</button>}
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {slice.map((r) => (
                                <RequestCard key={r.id} r={r} who={whoIs(r.principalId)} editing={editing === r.id} onEdit={() => { setNotice(""); setEditing(r.id); }} onSaved={saved} />
                            ))}
                        </ul>
                    )}

                    {!loading && filtered.length > PAGE_SIZE && (
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-[#64748B]">Page {current} of {pages}</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setPage(current - 1); setEditing(null); }} disabled={current === 1} className={`${ghostBtn} px-3 py-1.5`}>Previous</button>
                                <button type="button" onClick={() => { setPage(current + 1); setEditing(null); }} disabled={current === pages} className={`${ghostBtn} px-3 py-1.5`}>Next</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
