import { useCallback, useEffect, useState } from "react";
import { addDataPrincipal, deleteDataPrincipal, get360View, getDataPrincipalCount, getDataPrincipals, updateDataPrincipal } from "../../api/dataPrincipal.js";
import { getRoleOptions } from "../../api/roles.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";

const PAGE_SIZE = 10;
const CLASSES = [
    ["", "All classes"],
    ["adult", "Adult"],
    ["child", "Child"],
    ["person_with_disability", "Person with disability"],
];
const classLabel = (c) => CLASSES.find(([v]) => v === String(c).toLowerCase())?.[1] ?? (c || "-");
const LOCALES = { "en-IN": "English", "hi-IN": "Hindi", "mr-IN": "Marathi" };
const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted";
const td = "px-3 py-3 text-sm text-ink-2";

function Pill({ tone = "slate", children }) {
    const tones = {
        slate: "bg-subtle text-ink-2 ring-line-strong",
        green: "bg-ok/10 text-ok-ink ring-ok/25",
        amber: "bg-warn/10 text-warn-ink ring-warn/25",
        red: "bg-bad/10 text-bad-ink ring-bad/25",
    };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

function Section({ title, count, children }) {
    return (
        <section>
            <h3 className="text-sm font-semibold">{title}{count !== undefined && <span className="ml-1 font-normal text-muted">({count})</span>}</h3>
            <div className="mt-2">{children}</div>
        </section>
    );
}

function View360({ principal, onClose }) {
    const [state, setState] = useState({ loading: true, data: null, error: "" });

    useEffect(() => {
        let active = true;
        get360View(principal.id).then((res) => {
            if (active) setState({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, [principal.id]);

    const d = state.data;
    const empty = (text) => <p className="rounded-xl bg-soft px-3 py-3 text-sm text-muted ring-1 ring-line">{text}</p>;

    return (
        <Modal title="360° view" onClose={onClose}>
            <div className="max-h-[88vh] space-y-5 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                <div className="pr-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Data principal · 360° view</p>
                    <h2 className="mt-1 text-lg font-semibold">{d?.record.name || principal.name || principal.referenceId}</h2>
                    <p className="text-sm text-ink-3">{d?.record.referenceId || principal.referenceId}</p>
                </div>

                {state.loading ? (
                    <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-12 pg-shimmer rounded-xl" />)}</div>
                ) : state.error ? (
                    <Alert>{state.error}</Alert>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                ["Class", classLabel(d.record.class)],
                                ["Status", d.record.status || "-"],
                                ["Language", LOCALES[d.record.language] || d.record.language || "-"],
                                ["Registered", formatDate(d.record.registered)],
                            ].map(([k, v]) => (
                                <div key={k} className="rounded-xl bg-soft p-3 ring-1 ring-line">
                                    <p className="text-xs text-muted">{k}</p>
                                    <p className="mt-0.5 text-sm font-semibold">{v}</p>
                                </div>
                            ))}
                        </div>

                        <Section title="Identifiers" count={d.identifiers.length}>
                            {d.identifiers.length === 0 ? empty("No identifiers recorded.") : (
                                <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
                                    {d.identifiers.map((i, n) => (
                                        <li key={`${i.kind}-${n}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                            <span><span className="font-medium">{i.kind}</span> <span className="ml-2 font-mono text-ink-3">{i.value}</span></span>
                                            <span className="flex gap-1.5">
                                                {i.primary && <Pill>Primary</Pill>}
                                                {i.verified ? <Pill tone="green">Verified</Pill> : <Pill tone="amber">Not verified</Pill>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>

                        <Section title="Rights requests" count={d.requests.length}>
                            {d.requests.length === 0 ? empty("No rights requests raised.") : (
                                <div className="overflow-x-auto rounded-xl ring-1 ring-line">
                                    <table className="w-full min-w-[520px]">
                                        <thead className="bg-soft"><tr><th className={th}>Reference</th><th className={th}>Right</th><th className={th}>Status</th><th className={th}>Raised</th><th className={th}>Deadline</th></tr></thead>
                                        <tbody className="divide-y divide-line">
                                            {d.requests.map((r) => (
                                                <tr key={r.id}>
                                                    <td className={`${td} font-mono text-xs`}>{r.reference}</td>
                                                    <td className={td}>{r.right}</td>
                                                    <td className={td}><Pill>{r.status}</Pill></td>
                                                    <td className={td}>{formatDate(r.raisedOn)}</td>
                                                    <td className={td}>{formatDate(r.deadline)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Section>

                        <Section title="Active consents" count={d.consents.length}>
                            {d.consents.length === 0 ? empty("No active consents.") : (
                                <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
                                    {d.consents.map((c, n) => (
                                        <li key={n} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                            <span className="font-medium">{c.purpose}</span>
                                            <span className="flex items-center gap-2 text-xs text-muted">{formatDate(c.grantedOn)} <Pill tone="green">{c.status}</Pill></span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>
                        <p className="text-xs text-muted">Personal details are partly hidden for privacy.</p>
                    </>
                )}
            </div>
        </Modal>
    );
}

const EMPTY = { fullName: "", mobile: "", email: "", consumerNo: "", dateOfBirth: "", class: "adult", preferredLocale: "en-IN", roleId: "", password: "", confirm: "" };

function AddForm({ onClose, onAdded, editing = null }) {
    const isEdit = !!editing;
    const [form, setForm] = useState(() =>
        isEdit
            ? { ...EMPTY, fullName: editing.name || "", class: String(editing.class || "adult").toLowerCase(), preferredLocale: editing.locale || "en-IN" }
            : EMPTY,
    );
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [roles, setRoles] = useState({ loading: true, items: [] });
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };

    useEffect(() => {
        let active = true;
        getRoleOptions().then((res) => {
            if (!active) return;
            const items = res.ok ? res.data.filter((r) => !/admin|^dpo$/i.test(r.name)) : [];
            const def = items.find((r) => /^data\s*principal$/i.test(r.name));
            setRoles({ loading: false, items });
            if (def && !isEdit) setForm((f) => (f.roleId ? f : { ...f, roleId: def.id }));
        });
        return () => {
            active = false;
        };
    }, [isEdit]);

    const submit = async (e) => {
        e.preventDefault();
        const f = form;
        const found = {};
        if (!isEdit && !f.mobile.trim() && !f.email.trim()) found.mobile = "Enter a mobile number or an email.";
        if (f.mobile.trim() && !/^\d{10}$/.test(f.mobile.trim())) found.mobile = "Mobile number must be exactly 10 digits.";
        if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) found.email = "Enter a valid email.";
        if (f.dateOfBirth && new Date(f.dateOfBirth) > new Date()) found.dateOfBirth = "Date of birth cannot be in the future.";
        if (f.password || f.confirm) {
            if (!isEdit && !f.email.trim()) found.email = "Email is required so this person can sign in.";
            if (f.password.length < 8) found.password = "Use at least 8 characters.";
            else if (f.password !== f.confirm) found.confirm = "Passwords do not match.";
            if (!isEdit && !f.roleId) found.roleId = "Select a role so this person gets the customer permissions.";
        }
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        setError("");
        const res = isEdit ? await updateDataPrincipal(editing.id, f) : await addDataPrincipal(f);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onAdded(isEdit ? `Data principal ${editing.referenceId} updated.` : `Data principal added. Reference ID: ${res.data.referenceId}`);
    };

    const keep = (masked) => (isEdit ? { placeholder: masked ? `Leave blank to keep ${masked}` : "Leave blank to keep current" } : {});
    const input = (k, label, props = {}) => (
        <label className="block text-sm font-medium text-ink-2">
            {label}
            <input value={form[k]} onChange={set(k)} disabled={busy} className={field} aria-invalid={!!errors[k]} {...props} />
            <span className="mt-1 block text-xs text-bad-ink">{errors[k]}</span>
        </label>
    );

    return (
        <Modal title={isEdit ? "Edit data principal" : "Add data principal"} onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} max-h-[88vh] space-y-3 overflow-y-auto p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">{isEdit ? "Edit data principal" : "Add data principal"}</h2>
                {isEdit && <p className="-mt-2 font-mono text-xs text-muted">{editing.referenceId}</p>}
                <div className="grid gap-x-4 sm:grid-cols-2">
                    {input("fullName", "Full name", { maxLength: 150 })}
                    {input("consumerNo", "Consumer number", { maxLength: 50, ...keep(editing?.consumerNo) })}
                    {input("mobile", "Mobile", { inputMode: "numeric", maxLength: 10, placeholder: "10 digits", ...keep(editing?.mobile) })}
                    {input("email", "Email", { type: "email", maxLength: 100, ...keep(editing?.email) })}
                    {input("dateOfBirth", "Date of birth", { type: "date", max: new Date().toISOString().slice(0, 10) })}
                    <label className="block text-sm font-medium text-ink-2">
                        Preferred language
                        <select value={form.preferredLocale} onChange={set("preferredLocale")} disabled={busy} className={field}>
                            {Object.entries(LOCALES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                </div>
                <div className="grid gap-x-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-2">
                        Class
                        <select value={form.class} onChange={set("class")} disabled={busy} className={field}>
                            {CLASSES.filter(([v]) => v).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-ink-2">
                        Role
                        <select value={form.roleId} onChange={set("roleId")} disabled={busy || roles.loading} className={field} aria-invalid={!!errors.roleId}>
                            <option value="">{roles.loading ? "Loading roles..." : isEdit ? "Keep current role" : "No role"}</option>
                            {roles.items.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <span className="mt-1 block text-xs text-bad-ink">{errors.roleId}</span>
                    </label>
                    {input("password", isEdit ? "New password" : "Password", { type: "password", autoComplete: "new-password", placeholder: isEdit ? "Leave blank to keep current" : "At least 8 characters" })}
                    {input("confirm", "Confirm password", { type: "password", autoComplete: "new-password" })}
                </div>
                <p className="-mt-1 text-xs text-muted">
                    {isEdit
                        ? "Only the fields you fill in are changed. Mobile, email and consumer number are masked, so type the full new value to change them."
                        : "Password is optional. Set it (with an email) so this person can sign in to the customer portal."}
                </p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5 pt-1">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? (isEdit ? "Saving..." : "Adding...") : isEdit ? "Save changes" : "Add"}</button>
                </div>
            </form>
        </Modal>
    );
}

function DeleteConfirm({ principal, onClose, onDeleted }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const confirm = async () => {
        setBusy(true);
        setError("");
        const res = await deleteDataPrincipal(principal.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDeleted(`Data principal ${principal.referenceId} deleted.`);
    };
    return (
        <Modal title="Delete data principal" onClose={() => !busy && onClose()}>
            <div className={`${panel} space-y-3 p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Delete data principal?</h2>
                <p className="text-sm text-ink-3">
                    <span className="font-semibold text-ink">{principal.name || principal.referenceId}</span> ({principal.referenceId}) will be removed from this list. Their name, mobile, email and login are erased. Consent and request history is kept as audit proof.
                </p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5 pt-1">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="button" onClick={confirm} disabled={busy} className="rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-bad-ink disabled:opacity-60">{busy ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </Modal>
    );
}

export default function DataPrincipals() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [classType, setClassType] = useState("");
    const [page, setPage] = useState(1);
    const [state, setState] = useState({ loading: true, rows: [], total: 0, error: "" });
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewing, setViewing] = useState(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [flash, setFlash] = useState("");
    const [orgTotal, setOrgTotal] = useState(null);

    useEffect(() => {
        let active = true;
        getDataPrincipalCount().then((res) => active && res.ok && setOrgTotal(res.data));
        return () => {
            active = false;
        };
    }, [refreshKey]);

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
        getDataPrincipals({ search: query, classType, page, pageSize: PAGE_SIZE }).then((res) => {
            if (!active) return;
            setState(res.ok ? { loading: false, rows: res.data.rows, total: res.data.total, error: "" } : { loading: false, rows: [], total: 0, error: res.error });
        });
        return () => {
            active = false;
        };
    }, [query, classType, page, refreshKey]);

    const refresh = useCallback(() => {
        setState((s) => ({ ...s, loading: true }));
        setRefreshKey((k) => k + 1);
    }, []);

    const pages = Math.max(1, Math.ceil(state.total / PAGE_SIZE));

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex flex-wrap items-center gap-3 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                        Data principals
                        {orgTotal !== null && <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-ink ring-1 ring-brand/20" title="Total data principals in your organisation">{orgTotal.toLocaleString()} total</span>}
                    </h1>
                    <p className="mt-1.5 max-w-3xl text-[15px] text-ink-3">Your customers whose personal data you hold. Open anyone to see their identifiers, rights requests and consents in one place.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={refresh} disabled={state.loading} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button type="button" onClick={() => { setFlash(""); setAdding(true); }} className={primaryBtn}>+ Add data principal</button>
                </div>
            </header>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}

            <div className={`${panel} grid gap-3 p-4 sm:grid-cols-[1fr_220px]`}>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile or reference" aria-label="Search" className={`${field} mt-0`} />
                <select value={classType} onChange={(e) => { setClassType(e.target.value); setPage(1); setState((s) => ({ ...s, loading: true })); }} aria-label="Class" className={`${field} mt-0`}>
                    {CLASSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            {state.error && <Alert action={<button type="button" onClick={refresh} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}

            <div className={`${panel} overflow-hidden`}>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 pg-shimmer rounded" />)}</div>
                ) : state.rows.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-ink-3">{query || classType ? "No data principals match these filters." : "No data principals yet. Add one, or import a CSV from Bulk import."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[940px]">
                            <thead className="bg-soft">
                                <tr><th className={`${th} pl-5`}>Reference</th><th className={th}>Name</th><th className={th}>Mobile</th><th className={th}>Email</th><th className={th}>Class</th><th className={th}>Language</th><th className={th}>Added</th><th className={`${th} pr-5`} /></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {state.rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-soft">
                                        <td className={`${td} pl-5 font-mono text-xs`}>{r.referenceId}</td>
                                        <td className={`${td} font-medium text-ink`}>{r.name || "-"}</td>
                                        <td className={`${td} font-mono text-xs`}>{r.mobile || "-"}</td>
                                        <td className={`${td} font-mono text-xs`}>{r.email || "-"}</td>
                                        <td className={td}>
                                            {classLabel(r.class)}
                                            {r.guardian && <span className="ml-1.5"><Pill tone="amber">Guardian</Pill></span>}
                                        </td>
                                        <td className={td}>{LOCALES[r.locale] || r.locale || "-"}</td>
                                        <td className={td}>{formatDate(r.createdAt)}</td>
                                        <td className={`${td} pr-5 text-right`}>
                                            <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                                                <button type="button" onClick={() => setViewing(r)} className="font-semibold text-brand-ink hover:underline">360° view</button>
                                                <button type="button" onClick={() => { setFlash(""); setEditing(r); }} className="font-semibold text-brand-ink hover:underline">Edit</button>
                                                <button type="button" onClick={() => { setFlash(""); setDeleting(r); }} className="font-semibold text-bad-ink hover:underline">Delete</button>
                                            </div>
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
                            <button type="button" onClick={() => { setPage((p) => p - 1); setState((s) => ({ ...s, loading: true })); }} disabled={page <= 1} className={ghostBtn}>Previous</button>
                            <button type="button" onClick={() => { setPage((p) => p + 1); setState((s) => ({ ...s, loading: true })); }} disabled={page >= pages} className={ghostBtn}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {viewing && <View360 key={viewing.id} principal={viewing} onClose={() => setViewing(null)} />}
            {adding && <AddForm onClose={() => setAdding(false)} onAdded={(msg) => { setAdding(false); setFlash(msg); refresh(); }} />}
            {editing && <AddForm key={editing.id} editing={editing} onClose={() => setEditing(null)} onAdded={(msg) => { setEditing(null); setFlash(msg); refresh(); }} />}
            {deleting && <DeleteConfirm principal={deleting} onClose={() => setDeleting(null)} onDeleted={(msg) => { setDeleting(null); setFlash(msg); refresh(); }} />}
        </div>
    );
}
