import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    ACTION_TYPES, TRIGGER_EVENTS, actionLabel, createRetentionPolicy, deleteRetentionPolicy, getErasedRecords, getErasureQueue, getRetentionMetrics, getRetentionPolicies, getRetentionPolicy, isSupportedTrigger, runRetentionJob, triggerLabel, updateRetentionPolicy,
} from "../../api/retentionPolicy.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import StatTile from "../../components/shared/StatTile.jsx";
import DataPrincipal360Modal from "../../components/admin/principals/DataPrincipal360Modal.jsx";
import { toTime } from "../../utils/audit.js";
import { canNow } from "../../auth/access.js";

const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted";
const td = "px-3 py-3 text-sm text-ink-2";
const EMPTY = { name: "", description: "", days: "", trigger: "DataCreatedDate", action: "Anonymize", active: true };

function humanDays(n) {
    if (!n) return "-";
    if (n % 365 === 0) return `${n / 365} year${n / 365 === 1 ? "" : "s"}`;
    if (n % 30 === 0) return `${n / 30} month${n / 30 === 1 ? "" : "s"}`;
    return `${n} day${n === 1 ? "" : "s"}`;
}

function PolicyForm({ policy, onClose, onSaved }) {
    const editing = !!policy;
    const [form, setForm] = useState(() => (policy ? { ...EMPTY, ...policy, days: String(policy.days), trigger: isSupportedTrigger(policy.trigger) ? policy.trigger : "DataCreatedDate" } : EMPTY));
    const legacyTrigger = editing && !isSupportedTrigger(policy.trigger);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (k) => (e) => {
        const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        const found = {};
        if (!form.name.trim()) found.name = "Policy name is required.";
        else if (form.name.trim().length > 200) found.name = "Max 200 characters.";
        const days = Number(form.days);
        if (!Number.isInteger(days) || days < 1 || days > 3650) found.days = "Enter a whole number of days between 1 and 3650 (10 years).";
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        setError("");
        const res = editing ? await updateRetentionPolicy(policy.id, form) : await createRetentionPolicy(form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onSaved(editing ? `"${form.name.trim()}" updated.` : `Policy "${form.name.trim()}" created.`);
    };

    return (
        <Modal title={editing ? "Edit retention policy" : "New retention policy"} onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} max-h-[88vh] space-y-3 overflow-y-auto p-5 sm:p-6`}>
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">{editing ? "Edit retention policy" : "New retention policy"}</h2>
                    <p className="mt-1 text-sm text-ink-3">How long personal data is kept, and what happens when that time is up.</p>
                </div>
                <label className="block text-sm font-medium text-ink-2">
                    Policy name
                    <input value={form.name} onChange={set("name")} disabled={busy} maxLength={200} placeholder="e.g. Inactive consumer data" className={field} />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Description
                    <textarea value={form.description} onChange={set("description")} disabled={busy} rows={3} placeholder="Why this period, and which law or purpose requires it." className={field} />
                </label>
                <div className="grid gap-x-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-2">
                        Keep data for (days)
                        <input type="number" min={1} max={3650} value={form.days} onChange={set("days")} disabled={busy} placeholder="e.g. 365" className={field} />
                        <span className="mt-1 block text-xs text-bad-ink">{errors.days}</span>
                        {!errors.days && Number(form.days) > 0 && <span className="mt-1 block text-xs text-muted">≈ {humanDays(Number(form.days))}</span>}
                    </label>
                    <label className="block text-sm font-medium text-ink-2">
                        Countdown starts
                        <select value={form.trigger} onChange={set("trigger")} disabled={busy} className={field}>
                            {TRIGGER_EVENTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </label>
                </div>
                <label className="block text-sm font-medium text-ink-2">
                    When the time is up
                    <select value={form.action} onChange={set("action")} disabled={busy || editing} className={field}>
                        {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                </label>
                {legacyTrigger && <Alert tone="warning">This policy uses the trigger "{policy.trigger}", which the server no longer supports, so the job skips it. Pick a supported countdown above and save to fix it.</Alert>}
                {editing && <p className="text-xs text-muted">The action cannot be changed after a policy is created. Create a new policy if it needs to change.</p>}
                {editing && (
                    <label className="flex items-center gap-2 text-sm text-ink-2">
                        <input type="checkbox" checked={!!form.active} onChange={set("active")} disabled={busy} />
                        Active (inactive policies are skipped by the erasure job)
                    </label>
                )}
                {!editing && <Alert tone={form.action === "Delete" ? "warning" : "info"}>{form.action === "Delete" ? "Delete erases the person's name, email, mobile and identifiers permanently. It cannot be undone. The record's reference ID and its consent and request history are kept as audit proof." : "Anonymise replaces the person's name, email, mobile and identifiers. It cannot be undone. The reference ID and consent and request history are kept as audit proof."}</Alert>}
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5 pt-1">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : editing ? "Save changes" : "Create policy"}</button>
                </div>
            </form>
        </Modal>
    );
}

function ConfirmDelete({ policy, onClose, onDeleted }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const go = async () => {
        setBusy(true);
        const res = await deleteRetentionPolicy(policy.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDeleted(`"${policy.name}" deleted.`);
    };
    return (
        <Modal title="Delete policy" onClose={() => !busy && onClose()}>
            <div className={`${panel} mx-auto max-w-md space-y-4 p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Delete "{policy.name}"?</h2>
                <p className="text-sm text-ink-3">The policy is removed. Data already anonymised or deleted by it is not restored.</p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="button" onClick={go} disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-bad-ink disabled:opacity-60">{busy ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </Modal>
    );
}


function RunNowConfirm({ onClose, onDone }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const go = async () => {
        setBusy(true);
        setError("");
        const res = await runRetentionJob();
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDone(res.data.processed);
    };
    return (
        <Modal title="Run retention job now" onClose={() => !busy && onClose()}>
            <div className={`${panel} mx-auto max-w-md space-y-4 p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Run the retention job now?</h2>
                <p className="text-sm text-ink-3">Every active policy runs for your organisation right away, instead of waiting for the daily job. Records past their retention period are erased and this cannot be undone. Records on legal hold are skipped.</p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="button" onClick={go} disabled={busy} className={primaryBtn}>{busy ? "Running..." : "Run now"}</button>
                </div>
            </div>
        </Modal>
    );
}

function ErasedRecords({ query, reloadKey = 0 }) {
    const [state, setState] = useState({ loading: true, rows: [], error: "" });

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        const res = await getErasedRecords();
        setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
    }, []);

    useEffect(() => {
        let active = true;
        getErasedRecords().then((res) => {
            if (!active) return;
            setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
        });
        return () => { active = false; };
    }, [reloadKey]);

    const rows = useMemo(() => {
        const q = (query || "").trim().toLowerCase();
        return q ? state.rows.filter((r) => [r.reference, r.policy, r.action].some((v) => v.toLowerCase().includes(q))) : state.rows;
    }, [state.rows, query]);

    return (
        <>
            {state.error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}
            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                    <p className="text-xs text-ink-3"><Icon name="shield" className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-brand-ink" />{state.rows.length} record{state.rows.length === 1 ? "" : "s"} erased. Personal details are gone for good; only the reference ID and audit trail remain. The policy shown is the one active now.</p>
                    <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>
                </div>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="pg-shimmer h-10 rounded-lg" />)}</div>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-sm font-semibold text-ink">{state.rows.length ? "Nothing matches this search" : state.error ? "Erased records could not be loaded" : "No erased records yet"}</p>
                        <p className="mx-auto mt-1 max-w-lg text-sm text-ink-3">{state.rows.length || state.error ? "Try another search." : "Records appear here once the retention job or a manual erase has anonymised them."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-soft">
                                <tr><th className={`${th} pl-5`}>Reference ID</th><th className={th}>Erased on</th><th className={th}>Action</th><th className={`${th} pr-5`}>Policy</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((r) => (
                                    <tr key={r.id || r.reference}>
                                        <td className={`${td} pl-5 font-mono text-[13px] font-semibold text-ink`}>{r.reference || r.id.slice(0, 8)}</td>
                                        <td className={td}>{formatDate(r.erasedAt)}</td>
                                        <td className={td}><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${r.action === "Delete" ? "bg-bad/10 text-bad-ink ring-bad/25" : "bg-subtle text-ink-2 ring-line-strong"}`}>{actionLabel(r.action)}</span></td>
                                        <td className={`${td} pr-5`}>{r.policy || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function daysFromNow(value) {
    const t = toTime(value);
    if (!t) return null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return Math.round((t - startOfToday.getTime()) / 86400000);
}

function ErasureQueue({ query, reloadKey = 0 }) {
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [filter, setFilter] = useState("all");
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        const res = await getErasureQueue();
        setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
    }, []);

    useEffect(() => {
        let active = true;
        getErasureQueue().then((res) => {
            if (!active) return;
            setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
        });
        return () => { active = false; };
    }, [reloadKey]);

    const overdue = state.rows.filter((r) => r.status === "Overdue").length;
    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return state.rows.filter((r) =>
            (filter === "all" || r.status.toLowerCase() === filter) &&
            (!q || [r.reference, r.policy, r.action, r.status].some((v) => v.toLowerCase().includes(q))));
    }, [state.rows, filter, query]);

    const FILTERS = [["all", "All", state.rows.length], ["overdue", "Overdue", overdue], ["pending", "Pending", state.rows.length - overdue]];

    return (
        <>
            {state.error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}
            <div className={`${panel} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                    <div className="inline-flex rounded-xl bg-subtle p-1" role="tablist" aria-label="Filter queue">
                        {FILTERS.map(([key, label, n]) => (
                            <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === key ? "bg-surface text-ink shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "text-ink-3 hover:text-ink"}`}>
                                {label} <span className={`ml-1 rounded-full px-1.5 text-[10px] ${key === "overdue" && n ? "bg-bad/10 text-bad-ink" : "bg-line text-ink-3"}`}>{n}</span>
                            </button>
                        ))}
                    </div>
                    <p className="order-last w-full text-xs text-ink-3 sm:order-none sm:w-auto"><Icon name="eye" className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-brand-ink" />Click a record to open its 360° view.</p>
                    <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>
                </div>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="pg-shimmer h-10 rounded-lg" />)}</div>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-sm font-semibold text-ink">{state.rows.length ? "Nothing matches this filter" : state.error ? "Queue could not be loaded" : "Queue is clear"}</p>
                        <p className="mx-auto mt-1 max-w-lg text-sm text-ink-3">{state.rows.length || state.error ? "Try another filter or search." : "No records are close to their erasure date under the active retention policy. Records on legal hold never appear here."}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead className="bg-soft">
                                <tr><th className={`${th} pl-5`}>Record</th><th className={th}>Policy</th><th className={th}>Action</th><th className={th}>Due</th><th className={`${th} pr-5`}>Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((r) => {
                                    const d = daysFromNow(r.dueDate);
                                    const late = r.status === "Overdue";
                                    return (
                                        <tr
                                            key={r.id}
                                            role="button"
                                            tabIndex={0}
                                            title="View details of this record"
                                            onClick={() => r.id && setOpenId(r.id)}
                                            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && r.id) { e.preventDefault(); setOpenId(r.id); } }}

                                            className="group cursor-pointer transition hover:bg-brand-soft/40 focus-visible:bg-brand-soft/40 focus-visible:outline-none [&>td:first-child]:border-l-[3px] [&>td:first-child]:border-transparent hover:[&>td:first-child]:border-brand"


                                        >
                                            <td className={`${td} pl-5`}>
                                                <span className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-brand-ink underline decoration-brand/30 underline-offset-4 transition group-hover:decoration-brand">
                                                    {r.reference || r.id.slice(0, 8)}
                                                    <Icon name="arrowRight" className="h-3.5 w-3.5 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                                                </span>
                                            </td>
                                            <td className={td}>{r.policy || "-"}</td>
                                            <td className={td}>
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${r.action === "Delete" ? "bg-bad/10 text-bad-ink ring-bad/25" : "bg-subtle text-ink-2 ring-line-strong"}`}>{actionLabel(r.action)}</span>
                                            </td>
                                            <td className={td}>
                                                {formatDate(r.dueDate)}
                                                {d !== null && <span className={`block text-xs ${late ? "font-semibold text-bad-ink" : "text-muted"}`}>{d < 0 ? `${-d} day${d === -1 ? "" : "s"} overdue` : d === 0 ? "Due today" : `in ${d} day${d === 1 ? "" : "s"}`}</span>}
                                            </td>
                                            <td className={`${td} pr-5`}>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${late ? "bg-bad/10 text-bad-ink ring-bad/25" : "bg-warn/10 text-warn-ink ring-warn/25"}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${late ? "animate-pulse" : ""}`} />{r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {openId && <DataPrincipal360Modal id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
        </>
    );
}

export default function Retention() {
    const { query = "" } = useOutletContext() || {};
    const [tab, setTab] = useState("policies");
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [modal, setModal] = useState(null);
    const [flash, setFlash] = useState("");
    const [opening, setOpening] = useState(null);
    const [openError, setOpenError] = useState("");
    const [queueKey, setQueueKey] = useState(0);

    const openEdit = async (p) => {
        setFlash("");
        setOpenError("");
        setOpening(p.id);
        const res = await getRetentionPolicy(p.id);
        setOpening(null);
        if (!res.ok) return setOpenError(res.error);
        setModal({ kind: "form", item: res.data });
    };

    const [metrics, setMetrics] = useState({ loading: true, data: null });

    const apply = useCallback((res) => setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error }), []);
    const applyMetrics = useCallback((res) => setMetrics({ loading: false, data: res.ok ? res.data : null }), []);
    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        setMetrics((m) => ({ ...m, loading: true }));
        const [p, m] = await Promise.all([getRetentionPolicies(), getRetentionMetrics()]);
        apply(p);
        applyMetrics(m);
    }, [apply, applyMetrics]);

    useEffect(() => {
        let active = true;
        Promise.all([getRetentionPolicies(), getRetentionMetrics()]).then(([p, m]) => {
            if (!active) return;
            apply(p);
            applyMetrics(m);
        });
        return () => {
            active = false;
        };
    }, [apply, applyMetrics]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return state.rows.filter((p) => !q || [p.name, p.description, p.trigger, p.action].some((v) => v.toLowerCase().includes(q)));
    }, [state.rows, query]);

    const done = (msg) => {
        setModal(null);
        setFlash(msg);
        load();
    };

    const ranJob = (n) => {
        setModal(null);
        setFlash(n ? `Retention job finished. ${n} record${n === 1 ? "" : "s"} erased.` : "Retention job finished. No records were due for erasure.");
        setQueueKey((k) => k + 1);
        load();
    };

    const activeCount = state.rows.filter((p) => p.active).length;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Retention &amp; erasure</h1>
                    <p className="mt-1 max-w-3xl text-sm text-ink-3">Erase personal data once its purpose is done or consent is withdrawn, unless another law says to keep it (Sec 8(7)). The job runs automatically every day; records on legal hold are skipped. Erased records are listed in the third tab.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tab === "policies" && <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>}
                    {canNow(["RetentionPolicy.Manage"]) && <button type="button" onClick={() => { setFlash(""); setModal({ kind: "run" }); }} className={tab === "queue" ? primaryBtn : ghostBtn}><Icon name="clock" className="h-4 w-4" />Run now</button>}
                    {tab === "policies" && canNow(["RetentionPolicy.Manage"]) && <button type="button" onClick={() => { setFlash(""); setModal({ kind: "form", item: null }); }} className={primaryBtn}>+ New policy</button>}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatTile label="Jobs in the queue" icon="clock" tone="info" value={metrics.loading ? "—" : metrics.data ? metrics.data.jobsInQueue : "—"} total={metrics.data ? metrics.data.jobsInQueue + metrics.data.overdue : 0} hint="Records waiting to be erased" />
                <StatTile label="Overdue" icon="alert" tone={metrics.data?.overdue ? "bad" : "ok"} colorValue value={metrics.loading ? "—" : metrics.data ? metrics.data.overdue : "—"} total={metrics.data ? metrics.data.jobsInQueue + metrics.data.overdue : 0} hint="Past their erasure date" />
                <StatTile label="Active policies" icon="shield" tone="ok" value={metrics.loading && state.loading ? "—" : metrics.data ? metrics.data.activePolicies : activeCount} total={state.rows.length} hint={state.loading ? "Loading..." : `${state.rows.length} polic${state.rows.length === 1 ? "y" : "ies"} in total`} />
            </div>

            <div className="flex gap-1 border-b border-line" role="tablist" aria-label="Sections">
                {[["queue", "Erasure queue"], ["policies", "Retention policies"], ["erased", "Erased records"]].map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === key ? "border-brand text-brand-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}

            {tab === "queue" ? (
                <ErasureQueue query={query} reloadKey={queueKey} />
            ) : tab === "erased" ? (
                <ErasedRecords query={query} reloadKey={queueKey} />
            ) : (
                <>
                    {openError && <Alert>{openError}</Alert>}
                    {state.error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}
                    <div className={`${panel} overflow-hidden`}>
                        {state.loading ? (
                            <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 pg-shimmer rounded" />)}</div>
                        ) : rows.length === 0 ? (
                            <p className="px-5 py-12 text-center text-sm text-ink-3">{state.rows.length ? "No policies match your search." : state.error ? "Policies could not be loaded." : 'No retention policies yet. Use "New policy" to create one.'}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px]">
                                    <thead className="bg-soft">
                                        <tr><th className={`${th} pl-5`}>Policy</th><th className={th}>Keep for</th><th className={th}>Countdown starts</th><th className={th}>Then</th><th className={th}>Status</th><th className={th}>Created</th><th className={`${th} pr-5`} /></tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {rows.map((p) => (
                                            <tr key={p.id} className="align-top hover:bg-soft">
                                                <td className={`${td} pl-5`}>
                                                    <p className="font-medium text-ink">{p.name}</p>
                                                    {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>}
                                                </td>
                                                <td className={td}>{humanDays(p.days)}<span className="block text-xs text-muted">{p.days} days</span></td>
                                                <td className={td}>{triggerLabel(p.trigger)}{!isSupportedTrigger(p.trigger) && <span className="block text-xs font-semibold text-warn-ink">Skipped by the job. Edit to fix.</span>}</td>
                                                <td className={td}>
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${p.action === "Delete" ? "bg-bad/10 text-bad-ink ring-bad/25" : "bg-subtle text-ink-2 ring-line-strong"}`}>{actionLabel(p.action)}</span>
                                                </td>
                                                <td className={td}>
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${p.active ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-subtle text-muted ring-line-strong"}`}>{p.active ? "Active" : "Inactive"}</span>
                                                </td>
                                                <td className={td}>{formatDate(p.createdAt)}</td>
                                                <td className={`${td} whitespace-nowrap pr-5 text-right`}>
                                                    {canNow(["RetentionPolicy.Manage"]) && <button type="button" onClick={() => openEdit(p)} disabled={opening === p.id} className="font-semibold text-brand-ink hover:underline disabled:opacity-50">{opening === p.id ? "Opening..." : "Edit"}</button>}
                                                    {canNow(["RetentionPolicy.Manage"]) && <button type="button" onClick={() => { setFlash(""); setModal({ kind: "delete", item: p }); }} className="ml-4 font-semibold text-bad-ink hover:underline">Delete</button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {modal?.kind === "form" && <PolicyForm policy={modal.item} onClose={() => setModal(null)} onSaved={done} />}
            {modal?.kind === "run" && <RunNowConfirm onClose={() => setModal(null)} onDone={ranJob} />}
            {modal?.kind === "delete" && <ConfirmDelete policy={modal.item} onClose={() => setModal(null)} onDeleted={done} />}
        </div>
    );
}
