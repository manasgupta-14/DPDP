import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createTemplate, deleteTemplate, getPurposeCheckboxes, getTemplates, updateTemplate } from "../../api/noticeTemplate.js";
import { dkBtn, dkCard, dkInput } from "../../components/admin/consent/styles.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { formatDate } from "../../utils/breach.js";

const LAYOUTS = ["Standard", "Compact", "Detailed"];
const EMPTY = { code: "", name: "", description: "", purposes: [], logoUrl: "", primaryColor: "#2B59C3", layout: "Standard" };
const primary = "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-semibold text-white transition hover:bg-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60";

function Preview({ form, purposeName }) {
    const compact = form.layout === "Compact";
    return (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: form.primaryColor || "#2B59C3" }}>
                {form.logoUrl.trim() ? <img src={form.logoUrl.trim()} alt="" className="h-6 w-6 rounded bg-surface object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null}
                <p className="text-sm font-semibold">{form.name.trim() || "Privacy notice"}</p>
            </div>
            <div className={compact ? "space-y-2 p-3" : "space-y-3 p-4"}>
                {form.description.trim() && <p className="whitespace-pre-line text-xs text-ink-2">{form.description.trim()}</p>}
                {form.purposes.length === 0 ? (
                    <p className="text-xs text-muted">Select purposes to show them here.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {form.purposes.map((code) => (
                            <li key={code} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-xs">
                                <span>
                                    {purposeName(code)}
                                    {form.layout === "Detailed" && <span className="ml-1 font-mono text-[10px] text-muted">({code})</span>}
                                </span>
                                <span className="flex gap-1">
                                    <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: form.primaryColor || "#2B59C3" }}>Allow</span>
                                    <span className="rounded-md border border-line-strong px-2 py-0.5 text-[10px] font-semibold text-ink-2">Don't allow</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function TemplateForm({ template, purposes, onClose, onSaved }) {
    const editing = !!template;
    const [form, setForm] = useState(() => (template ? { ...EMPTY, ...template, logoUrl: "", primaryColor: EMPTY.primaryColor } : EMPTY));
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };
    const toggle = (code) => setForm((f) => ({ ...f, purposes: f.purposes.includes(code) ? f.purposes.filter((c) => c !== code) : [...f.purposes, code] }));
    const nameOf = (code) => purposes.find((p) => p.code === code)?.name ?? code;

    const submit = async (e) => {
        e.preventDefault();
        const found = {};
        if (!form.code.trim()) found.code = "Code is required.";
        else if (form.code.trim().length > 100) found.code = "Max 100 characters.";
        if (!form.name.trim()) found.name = "Name is required.";
        else if (form.name.trim().length > 150) found.name = "Max 150 characters.";
        if (form.purposes.length === 0) found.purposes = "Select at least one purpose.";
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        setError("");
        const res = editing ? await updateTemplate(template.id, form) : await createTemplate(form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onSaved(editing ? "Notice template updated." : `Notice template "${form.name.trim()}" created.`);
    };

    const options = [...purposes, ...form.purposes.filter((c) => !purposes.some((p) => p.code === c)).map((c) => ({ code: c, name: c }))];

    return (
        <Modal title={editing ? "Edit notice" : "New notice"} onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className="max-h-[88vh] space-y-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">{editing ? "Edit notice" : "New notice"}</h2>
                    <p className="mt-1 text-sm text-ink-3">The privacy notice users see before giving consent.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-ink-2">Code<input value={form.code} onChange={set("code")} disabled={busy} maxLength={100} placeholder="e.g. GENERAL_NOTICE_V1" className={dkInput} /><span className="mt-1 block text-[11px] text-bad-ink">{errors.code}</span></label>
                    <label className="block text-xs font-medium text-ink-2">Name<input value={form.name} onChange={set("name")} disabled={busy} maxLength={150} placeholder="e.g. General service notice" className={dkInput} /><span className="mt-1 block text-[11px] text-bad-ink">{errors.name}</span></label>
                </div>
                <label className="block text-xs font-medium text-ink-2">Notice text<textarea value={form.description} onChange={set("description")} disabled={busy} rows={4} placeholder="Explain what data you collect and why." className={`${dkInput} h-auto py-2`} /></label>
                <div>
                    <p className="text-xs font-medium text-ink-2">Purposes shown in this notice</p>
                    {options.length === 0 ? (
                        <p className="mt-1 text-[11px] text-muted">No purposes yet. Create consent purposes in Consent management first.</p>
                    ) : (
                        <div className="mt-1.5 grid max-h-44 gap-1.5 overflow-y-auto rounded-xl border border-line p-2.5 sm:grid-cols-2">
                            {options.map((p) => (
                                <label key={p.code} className="flex items-center gap-2 text-xs text-ink-2">
                                    <input type="checkbox" checked={form.purposes.includes(p.code)} disabled={busy} onChange={() => toggle(p.code)} />
                                    {p.name}
                                </label>
                            ))}
                        </div>
                    )}
                    <span className="mt-1 block text-[11px] text-bad-ink">{errors.purposes}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-xs font-medium text-ink-2">Layout<select value={form.layout} onChange={set("layout")} disabled={busy} className={dkInput}>{[...new Set([...LAYOUTS, form.layout])].map((l) => <option key={l}>{l}</option>)}</select></label>
                    <label className="block text-xs font-medium text-ink-2">Brand colour<input type="color" value={form.primaryColor} onChange={set("primaryColor")} disabled={busy} className={`${dkInput} p-1`} /></label>
                    <label className="block text-xs font-medium text-ink-2">Logo URL<input value={form.logoUrl} onChange={set("logoUrl")} disabled={busy} placeholder="https://..." className={dkInput} /></label>
                </div>
                {editing && <p className="text-[11px] text-muted">The server does not send back the saved logo and colour, so set them again before saving.</p>}
                <div>
                    <p className="mb-1.5 text-xs font-medium text-ink-2">Preview</p>
                    <Preview form={form} purposeName={nameOf} />
                </div>
                {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{error}</p>}
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={dkBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primary}>{busy ? "Saving..." : editing ? "Save changes" : "Create notice"}</button>
                </div>
            </form>
        </Modal>
    );
}

function ConfirmDelete({ template, onClose, onDeleted }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const go = async () => {
        setBusy(true);
        const res = await deleteTemplate(template.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDeleted(`"${template.name}" deleted.`);
    };
    return (
        <Modal title="Delete notice" onClose={() => !busy && onClose()}>
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                <h2 className="pr-8 text-lg font-semibold">Delete "{template.name}"?</h2>
                <p className="text-sm text-ink-3">This removes the notice template. Consent records already given are not changed.</p>
                {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{error}</p>}
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={dkBtn}>Cancel</button>
                    <button type="button" onClick={go} disabled={busy} className="inline-flex h-9 items-center justify-center rounded-xl bg-bad px-4 text-xs font-semibold text-white transition hover:bg-bad-ink disabled:opacity-60">{busy ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </Modal>
    );
}

const fetchAll = () => Promise.all([getTemplates(), getPurposeCheckboxes()]);

export default function NoticeBuilder() {
    const { query = "" } = useOutletContext() || {};
    const [templates, setTemplates] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [modal, setModal] = useState(null);

    const apply = useCallback(([t, p]) => {
        if (t.ok) setTemplates(t.data);
        if (p.ok) setPurposes(p.data);
        setError(!t.ok ? t.error : !p.ok ? p.error : "");
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await fetchAll());
    }, [apply]);

    useEffect(() => {
        let active = true;
        fetchAll().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const done = (msg) => {
        setModal(null);
        setFlash(msg);
        load();
    };

    const nameOf = useCallback((code) => purposes.find((p) => p.code === code)?.name ?? code, [purposes]);
    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return templates.filter((t) => !q || [t.name, t.code, t.description, t.layout, ...t.purposes.map(nameOf)].some((v) => v && v.toLowerCase().includes(q)));
    }, [templates, query, nameOf]);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Privacy notice builder</h1>
                    <p className="mt-1 text-sm text-ink-3">Create the notices users read before they give consent, and pick which purposes each notice covers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={load} disabled={loading || refreshing} aria-label="Refresh" className={`${dkBtn} w-9 px-0`}>
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button type="button" onClick={() => setModal({ kind: "form", item: null })} className={primary}>
                        <span aria-hidden className="text-base leading-none">+</span> New notice
                    </button>
                </div>
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}
            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2" aria-busy="true">{[0, 1].map((i) => <div key={i} className={`${dkCard} h-40 animate-pulse`} />)}</div>
            ) : rows.length === 0 ? (
                <div className={`${dkCard} px-5 py-12 text-center`}>
                    <p className="text-sm font-semibold">{templates.length ? "No notices match your search" : "No notices yet"}</p>
                    <p className="mt-1 text-xs text-ink-3">{templates.length ? "Try a different search." : 'Use "New notice" to create your first privacy notice.'}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {rows.map((t) => (
                        <article key={t.id} className={`${dkCard} flex flex-col p-4`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="truncate text-sm font-semibold">{t.name}</h2>
                                    <p className="mt-0.5 font-mono text-[11px] text-muted">{t.code}</p>
                                </div>
                                <span className="shrink-0 rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-line-strong">{t.layout}</span>
                            </div>
                            {t.description && <p className="mt-2 line-clamp-3 text-xs text-ink-3">{t.description}</p>}
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                                {t.purposes.length === 0 ? <li className="text-[11px] text-muted">No purposes</li> : t.purposes.map((c) => <li key={c} className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-ink">{nameOf(c)}</li>)}
                            </ul>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
                                <span className="text-muted">Created {formatDate(t.createdAt)}</span>
                                <span className="flex gap-3">
                                    <button type="button" onClick={() => setModal({ kind: "form", item: t })} className="font-semibold text-brand-ink hover:underline">Edit</button>
                                    <button type="button" onClick={() => setModal({ kind: "delete", item: t })} className="font-semibold text-bad-ink hover:underline">Delete</button>
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {modal?.kind === "form" && <TemplateForm template={modal.item} purposes={purposes} onClose={() => setModal(null)} onSaved={done} />}
            {modal?.kind === "delete" && <ConfirmDelete template={modal.item} onClose={() => setModal(null)} onDeleted={done} />}
        </div>
    );
}
