import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    ACTION_TYPES, TRIGGER_EVENTS, actionLabel, createRetentionPolicy, deleteRetentionPolicy, getErasureQueue, getRetentionMetrics, getRetentionPolicies, getRetentionPolicy, triggerLabel, updateRetentionPolicy,
} from "../../api/retentionPolicy.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import StatTile from "../../components/shared/StatTile.jsx";

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
    const [form, setForm] = useState(() => (policy ? { ...EMPTY, ...policy, days: String(policy.days) } : EMPTY));
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
                        <select value={form.trigger} onChange={set("trigger")} disabled={busy || editing} className={field}>
                            {[...TRIGGER_EVENTS, ...(TRIGGER_EVENTS.some((t) => t.value === form.trigger) ? [] : [{ value: form.trigger, label: form.trigger }])].map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </label>
                </div>
                <label className="block text-sm font-medium text-ink-2">
                    When the time is up
                    <select value={form.action} onChange={set("action")} disabled={busy || editing} className={field}>
                        {ACTION_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                </label>
                {editing && <p className="text-xs text-muted">Trigger and action cannot be changed after a policy is created. Create a new policy if they need to change.</p>}
                {editing && (
                    <label className="flex items-center gap-2 text-sm text-ink-2">
                        <input type="checkbox" checked={!!form.active} onChange={set("active")} disabled={busy} />
                        Active (inactive policies are skipped by the erasure job)
                    </label>
                )}
                {!editing && form.action === "Delete" && <Alert>Delete removes the data principal's record permanently. It cannot be undone.</Alert>}
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


function daysFromNow(value) {
    const t = value ? new Date(value).getTime() : NaN;
    if (Number.isNaN(t)) return null;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return Math.round((t - startOfToday.getTime()) / 86400000);
}

function ErasureQueue({ query }) {
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [filter, setFilter] = useState("all");

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
    }, []);

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
                    <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>
                </div>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="pg-shimmer h-10 rounded-lg" />)}</div>
                ) : rows.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-sm font-semibold text-ink">{state.rows.length ? "Nothing matches this filter" : state.error ? "Queue could not be loaded" : "Queue is clear"}</p>
                        <p className="mx-auto mt-1 max-w-lg text-sm text-ink-3">{state.rows.length || state.error ? "Try another filter or search." : "No records are close to their erasure date under the active retention policy."}</p>
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
                                        <tr key={r.id}>
                                            <td className={`${td} pl-5`}>
                                                <p className="font-mono text-[13px] font-medium text-ink">{r.reference || r.id.slice(0, 8)}</p>
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

    const activeCount = state.rows.filter((p) => p.active).length;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Retention &amp; erasure</h1>
                    <p className="mt-1 max-w-3xl text-sm text-ink-3">Delete data once its purpose is done or consent is withdrawn, unless another law says to keep it (Sec 8(7)).</p>
                </div>
                {tab === "policies" && (
                    <div className="flex gap-2">
                        <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>
                        <button type="button" onClick={() => { setFlash(""); setModal({ kind: "form", item: null }); }} className={primaryBtn}>+ New policy</button>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatTile label="Jobs in the queue" icon="clock" tone="info" value={metrics.loading ? "—" : metrics.data ? metrics.data.jobsInQueue : "—"} total={metrics.data ? metrics.data.jobsInQueue + metrics.data.overdue : 0} hint="Records waiting to be erased" />
                <StatTile label="Overdue" icon="alert" tone={metrics.data?.overdue ? "bad" : "ok"} colorValue value={metrics.loading ? "—" : metrics.data ? metrics.data.overdue : "—"} total={metrics.data ? metrics.data.jobsInQueue + metrics.data.overdue : 0} hint="Past their erasure date" />
                <StatTile label="Active policies" icon="shield" tone="ok" value={metrics.loading && state.loading ? "—" : metrics.data ? metrics.data.activePolicies : activeCount} total={state.rows.length} hint={state.loading ? "Loading..." : `${state.rows.length} polic${state.rows.length === 1 ? "y" : "ies"} in total`} />
            </div>

            <div className="flex gap-1 border-b border-line" role="tablist" aria-label="Sections">
                {[["queue", "Erasure queue"], ["policies", "Retention policies"]].map(([key, label]) => (
                    <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === key ? "border-brand text-brand-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}

            {tab === "queue" ? (
                <ErasureQueue query={query} />
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
                                                <td className={td}>{triggerLabel(p.trigger)}</td>
                                                <td className={td}>
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${p.action === "Delete" ? "bg-bad/10 text-bad-ink ring-bad/25" : "bg-subtle text-ink-2 ring-line-strong"}`}>{actionLabel(p.action)}</span>
                                                </td>
                                                <td className={td}>
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${p.active ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-subtle text-muted ring-line-strong"}`}>{p.active ? "Active" : "Inactive"}</span>
                                                </td>
                                                <td className={td}>{formatDate(p.createdAt)}</td>
                                                <td className={`${td} whitespace-nowrap pr-5 text-right`}>
                                                    <button type="button" onClick={() => openEdit(p)} disabled={opening === p.id} className="font-semibold text-brand-ink hover:underline disabled:opacity-50">{opening === p.id ? "Opening..." : "Edit"}</button>
                                                    <button type="button" onClick={() => { setFlash(""); setModal({ kind: "delete", item: p }); }} className="ml-4 font-semibold text-bad-ink hover:underline">Delete</button>
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
            {modal?.kind === "delete" && <ConfirmDelete policy={modal.item} onClose={() => setModal(null)} onDeleted={done} />}
        </div>
    );
}
