import { useCallback, useEffect, useState } from "react";
import { addDataPrincipal, get360View, getDataPrincipals } from "../../api/dataPrincipal.js";
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
const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]";
const td = "px-3 py-3 text-sm text-[#334155]";

function Pill({ tone = "slate", children }) {
    const tones = {
        slate: "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]",
        green: "bg-[#16A34A]/10 text-[#166534] ring-[#16A34A]/25",
        amber: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
        red: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    };
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

function Section({ title, count, children }) {
    return (
        <section>
            <h3 className="text-sm font-semibold">{title}{count !== undefined && <span className="ml-1 font-normal text-[#64748B]">({count})</span>}</h3>
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
    const empty = (text) => <p className="rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm text-[#64748B] ring-1 ring-[#E2E8F0]">{text}</p>;

    return (
        <Modal title="360° view" onClose={onClose}>
            <div className="max-h-[88vh] space-y-5 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-xl sm:p-6">
                <div className="pr-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Data principal · 360° view</p>
                    <h2 className="mt-1 text-lg font-semibold">{d?.record.name || principal.name || principal.referenceId}</h2>
                    <p className="text-sm text-[#475569]">{d?.record.referenceId || principal.referenceId}</p>
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
                                <div key={k} className="rounded-xl bg-[#F8FAFC] p-3 ring-1 ring-[#E2E8F0]">
                                    <p className="text-xs text-[#64748B]">{k}</p>
                                    <p className="mt-0.5 text-sm font-semibold">{v}</p>
                                </div>
                            ))}
                        </div>

                        <Section title="Identifiers" count={d.identifiers.length}>
                            {d.identifiers.length === 0 ? empty("No identifiers recorded.") : (
                                <ul className="divide-y divide-[#E2E8F0] rounded-xl ring-1 ring-[#E2E8F0]">
                                    {d.identifiers.map((i, n) => (
                                        <li key={`${i.kind}-${n}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                            <span><span className="font-medium">{i.kind}</span> <span className="ml-2 font-mono text-[#475569]">{i.value}</span></span>
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
                                <div className="overflow-x-auto rounded-xl ring-1 ring-[#E2E8F0]">
                                    <table className="w-full min-w-[520px]">
                                        <thead className="bg-[#F8FAFC]"><tr><th className={th}>Reference</th><th className={th}>Right</th><th className={th}>Status</th><th className={th}>Raised</th><th className={th}>Deadline</th></tr></thead>
                                        <tbody className="divide-y divide-[#E2E8F0]">
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
                                <ul className="divide-y divide-[#E2E8F0] rounded-xl ring-1 ring-[#E2E8F0]">
                                    {d.consents.map((c, n) => (
                                        <li key={n} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                                            <span className="font-medium">{c.purpose}</span>
                                            <span className="flex items-center gap-2 text-xs text-[#64748B]">{formatDate(c.grantedOn)} <Pill tone="green">{c.status}</Pill></span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Section>
                        <p className="text-xs text-[#64748B]">Personal details are masked by the server for privacy.</p>
                    </>
                )}
            </div>
        </Modal>
    );
}

const EMPTY = { fullName: "", mobile: "", email: "", consumerNo: "", dateOfBirth: "", class: "adult", preferredLocale: "en-IN" };

function AddForm({ onClose, onAdded }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        const f = form;
        const found = {};
        if (!f.mobile.trim() && !f.email.trim()) found.mobile = "Enter a mobile number or an email.";
        if (f.mobile.trim() && !/^\d{10}$/.test(f.mobile.trim())) found.mobile = "Mobile number must be exactly 10 digits.";
        if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) found.email = "Enter a valid email.";
        if (f.dateOfBirth && new Date(f.dateOfBirth) > new Date()) found.dateOfBirth = "Date of birth cannot be in the future.";
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        setError("");
        const res = await addDataPrincipal(f);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onAdded(`Data principal added. Reference ID: ${res.data.referenceId}`);
    };

    const input = (k, label, props = {}) => (
        <label className="block text-sm font-medium text-[#334155]">
            {label}
            <input value={form[k]} onChange={set(k)} disabled={busy} className={field} aria-invalid={!!errors[k]} {...props} />
            <span className="mt-1 block text-xs text-[#DC2626]">{errors[k]}</span>
        </label>
    );

    return (
        <Modal title="Add data principal" onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} max-h-[88vh] space-y-3 overflow-y-auto p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Add data principal</h2>
                <div className="grid gap-x-4 sm:grid-cols-2">
                    {input("fullName", "Full name", { maxLength: 150 })}
                    {input("consumerNo", "Consumer number", { maxLength: 50 })}
                    {input("mobile", "Mobile", { inputMode: "numeric", maxLength: 10, placeholder: "10 digits" })}
                    {input("email", "Email", { type: "email", maxLength: 100 })}
                    {input("dateOfBirth", "Date of birth", { type: "date", max: new Date().toISOString().slice(0, 10) })}
                    <label className="block text-sm font-medium text-[#334155]">
                        Preferred language
                        <select value={form.preferredLocale} onChange={set("preferredLocale")} disabled={busy} className={field}>
                            {Object.entries(LOCALES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                </div>
                <label className="block text-sm font-medium text-[#334155]">
                    Class
                    <select value={form.class} onChange={set("class")} disabled={busy} className={field}>
                        {CLASSES.filter(([v]) => v).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </label>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5 pt-1">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Adding..." : "Add"}</button>
                </div>
            </form>
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
                    <h1 className="text-3xl font-bold tracking-tight">Data principals</h1>
                    <p className="mt-1.5 max-w-3xl text-[15px] text-[#475569]">Your customers whose personal data you hold. Open anyone to see their identifiers, rights requests and consents in one place.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={refresh} disabled={state.loading} className={ghostBtn}>
                        <Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button type="button" onClick={() => { setFlash(""); setAdding(true); }} className={primaryBtn}>+ Add data principal</button>
                </div>
            </header>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-[#64748B] hover:text-[#0F172A]">&times;</button>}>{flash}</Alert>}

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
                    <p className="px-5 py-12 text-center text-sm text-[#475569]">{query || classType ? "No data principals match these filters." : "No data principals yet. Add one, or import a CSV from Bulk import."}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead className="bg-[#F8FAFC]">
                                <tr><th className={`${th} pl-5`}>Reference</th><th className={th}>Name</th><th className={th}>Mobile</th><th className={th}>Email</th><th className={th}>Class</th><th className={th}>Language</th><th className={th}>Added</th><th className={`${th} pr-5`} /></tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {state.rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#F8FAFC]">
                                        <td className={`${td} pl-5 font-mono text-xs`}>{r.referenceId}</td>
                                        <td className={`${td} font-medium text-[#0F172A]`}>{r.name || "-"}</td>
                                        <td className={`${td} font-mono text-xs`}>{r.mobile || "-"}</td>
                                        <td className={`${td} font-mono text-xs`}>{r.email || "-"}</td>
                                        <td className={td}>
                                            {classLabel(r.class)}
                                            {r.guardian && <span className="ml-1.5"><Pill tone="amber">Guardian</Pill></span>}
                                        </td>
                                        <td className={td}>{LOCALES[r.locale] || r.locale || "-"}</td>
                                        <td className={td}>{formatDate(r.createdAt)}</td>
                                        <td className={`${td} pr-5 text-right`}>
                                            <button type="button" onClick={() => setViewing(r)} className="whitespace-nowrap font-semibold text-[#0F766E] hover:underline">360° view</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!state.loading && state.total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#475569]">
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
        </div>
    );
}
