import StatTile from "../../components/shared/StatTile.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    NOTICE_LANGUAGES, createNotice, createNoticeVersion, getNotice, getNoticeTemplatesLite, getNotices, getPurposeOptions, publishNotice, updateNotice,
} from "../../api/notice.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";

const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted";
const td = "px-3 py-3 text-sm text-ink-2";
const isPublished = (s) => String(s).toLowerCase() === "published";

function StatusPill({ status }) {
    return isPublished(status)
        ? <span className="inline-flex rounded-full bg-ok/10 px-2.5 py-0.5 text-xs font-semibold text-ok-ink ring-1 ring-ok/25">Published</span>
        : <span className="inline-flex rounded-full bg-warn/10 px-2.5 py-0.5 text-xs font-semibold text-warn-ink ring-1 ring-warn/25">{status || "Draft"}</span>;
}

function CreateModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ code: "", title: "", summary: "", primaryLanguage: "en" });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        const found = {};
        if (!form.code.trim()) found.code = "Code is required.";
        else if (form.code.trim().length > 100) found.code = "Max 100 characters.";
        if (!form.title.trim()) found.title = "Title is required.";
        else if (form.title.trim().length > 500) found.title = "Max 500 characters.";
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        setError("");
        const res = await createNotice(form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onCreated(res.data.id);
    };

    return (
        <Modal title="New notice" onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} space-y-3 p-5 sm:p-6`}>
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">New privacy notice</h2>
                    <p className="mt-1 text-sm text-ink-3">It starts as a Draft. Next you pick a template, purposes and translations, then publish.</p>
                </div>
                <div className="grid gap-x-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink-2">Code<input value={form.code} onChange={set("code")} disabled={busy} maxLength={100} placeholder="e.g. GENERAL_NOTICE" className={field} /><span className="mt-1 block text-xs text-bad-ink">{errors.code}</span></label>
                    <label className="block text-sm font-medium text-ink-2">
                        Primary language
                        <select value={form.primaryLanguage} onChange={set("primaryLanguage")} disabled={busy} className={field}>
                            {NOTICE_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                    </label>
                </div>
                <label className="block text-sm font-medium text-ink-2">Title<input value={form.title} onChange={set("title")} disabled={busy} maxLength={500} placeholder="e.g. How we use your personal data" className={field} /><span className="mt-1 block text-xs text-bad-ink">{errors.title}</span></label>
                <label className="block text-sm font-medium text-ink-2">Summary<textarea value={form.summary} onChange={set("summary")} disabled={busy} rows={4} placeholder="Short explanation shown to the customer." className={field} /></label>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Creating..." : "Create draft"}</button>
                </div>
            </form>
        </Modal>
    );
}

function EditorModal({ id, onClose, onChanged }) {
    const [state, setState] = useState({ loading: true, error: "", notice: null, templates: [], templatesError: "", purposes: [] });
    const [templateId, setTemplateId] = useState("");
    const [picked, setPicked] = useState([]);
    const [translations, setTranslations] = useState([]);
    const [lang, setLang] = useState("en");
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([getNotice(id), getNoticeTemplatesLite(), getPurposeOptions()]).then(([n, t, p]) => {
            if (!active) return;
            if (!n.ok) return setState((s) => ({ ...s, loading: false, error: n.error }));
            const notice = n.data;
            setState({ loading: false, error: "", notice, templates: t.ok ? t.data : [], templatesError: t.ok ? "" : t.error, purposes: p.ok ? p.data : [] });
            setPicked(notice.purposes);
            setTranslations(NOTICE_LANGUAGES.map((l) => notice.translations.find((x) => x.languageCode === l.code) ?? { languageCode: l.code, title: "", summary: "" }));
            setLang(notice.translations[0]?.languageCode || "en");
        });
        return () => {
            active = false;
        };
    }, [id]);

    const n = state.notice;
    const locked = n && isPublished(n.status);
    const template = state.templates.find((t) => t.id === templateId);
    const nameOf = (code) => state.purposes.find((p) => p.code === code)?.name ?? code;
    const options = useMemo(() => [...state.purposes, ...picked.filter((c) => !state.purposes.some((p) => p.code === c)).map((c) => ({ code: c, name: c }))], [state.purposes, picked]);
    const current = translations.find((t) => t.languageCode === lang) ?? { title: "", summary: "" };

    const setText = (k) => (e) => setTranslations((list) => list.map((t) => (t.languageCode === lang ? { ...t, [k]: e.target.value } : t)));
    const toggle = (code) => setPicked((l) => (l.includes(code) ? l.filter((c) => c !== code) : [...l, code]));

    const save = async () => {
        setError("");
        setFlash("");
        if (!translations.some((t) => t.title.trim())) {
            setError("Add a title in at least one language.");
            return false;
        }
        setBusy("save");
        const res = await updateNotice(id, { templateId, purposes: picked, translations });
        setBusy("");
        if (!res.ok) {
            setError(res.error);
            return false;
        }
        setFlash("Draft saved.");
        onChanged();
        return true;
    };

    const publish = async () => {
        if (!(await save())) return;
        setBusy("publish");
        const res = await publishNotice(id);
        setBusy("");
        if (!res.ok) return setError(res.error);
        onChanged(`${n.code} v${n.version} published.`);
        onClose();
    };

    return (
        <Modal title="Notice" onClose={() => !busy && onClose()}>
            <div className="max-h-[88vh] space-y-5 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                {state.loading ? (
                    <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-12 pg-shimmer rounded-xl" />)}</div>
                ) : state.error ? (
                    <Alert>{state.error}</Alert>
                ) : (
                    <>
                        <div className="pr-8">
                            <p className="font-mono text-xs text-muted">{n.code} · v{n.version}</p>
                            <div className="mt-1 flex items-center gap-2"><h2 className="text-lg font-semibold">{locked ? "Published notice" : "Edit draft notice"}</h2><StatusPill status={n.status} /></div>
                            {locked && <p className="mt-1 text-sm text-ink-3">Published notices are locked. Use "New version" in the list to make changes.</p>}
                            {n.hash && <p className="mt-1 break-all font-mono text-[11px] text-muted">SHA-256: {n.hash}</p>}
                        </div>

                        {!locked && (
                            <label className="block text-sm font-medium text-ink-2">
                                Template (design and default purposes)
                                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={!!busy} className={field}>
                                    <option value="">{n.layout ? `Keep current design (${n.layout})` : "No template"}</option>
                                    {state.templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                </select>
                                {state.templatesError && <span className="mt-1 block text-xs text-warn-ink">Could not load templates: {state.templatesError}</span>}
                                {template && template.purposes.length > 0 && <span className="mt-1 block text-xs text-muted">This template adds: {template.purposes.map(nameOf).join(", ")}</span>}
                            </label>
                        )}

                        <div>
                            <p className="text-sm font-medium text-ink-2">Purposes</p>
                            {options.length === 0 ? (
                                <p className="mt-1 text-xs text-muted">No purposes found. Create consent purposes in Consent management first.</p>
                            ) : (
                                <div className="mt-1.5 grid max-h-44 gap-1.5 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2">
                                    {options.map((p) => (
                                        <label key={p.code} className="flex items-center gap-2 text-sm text-ink-2">
                                            <input type="checkbox" checked={picked.includes(p.code)} disabled={locked || !!busy} onChange={() => toggle(p.code)} />
                                            {p.name}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-ink-2">Text and translations</p>
                                <div className="inline-flex rounded-xl border border-line p-0.5" role="tablist" aria-label="Language">
                                    {NOTICE_LANGUAGES.map((l) => {
                                        const filled = translations.find((t) => t.languageCode === l.code)?.title.trim();
                                        return (
                                            <button key={l.code} type="button" role="tab" aria-selected={lang === l.code} onClick={() => setLang(l.code)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${lang === l.code ? "bg-brand-soft text-brand-ink" : "text-ink-3 hover:bg-subtle"}`}>
                                                {l.label}{filled ? " ✓" : ""}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <label className="mt-2 block text-sm font-medium text-ink-2">Title<input value={current.title} onChange={setText("title")} disabled={locked || !!busy} maxLength={500} className={field} /></label>
                            <label className="mt-2 block text-sm font-medium text-ink-2">Summary<textarea value={current.summary} onChange={setText("summary")} disabled={locked || !!busy} rows={5} className={field} /></label>
                            <p className="mt-1 text-xs text-muted">Leave a language empty to skip it. Users get English if their language is missing.</p>
                        </div>

                        <Alert>{error}</Alert>
                        <Alert tone="success">{flash}</Alert>

                        <div className="flex flex-wrap justify-end gap-2.5">
                            <button type="button" onClick={onClose} disabled={!!busy} className={ghostBtn}>Close</button>
                            {!locked && <button type="button" onClick={save} disabled={!!busy} className={ghostBtn}>{busy === "save" ? "Saving..." : "Save draft"}</button>}
                            {!locked && <button type="button" onClick={publish} disabled={!!busy} className={primaryBtn}>{busy === "publish" ? "Publishing..." : "Save and publish"}</button>}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default function Notices() {
    const { query = "" } = useOutletContext() || {};
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [openId, setOpenId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [flash, setFlash] = useState("");
    const [actionError, setActionError] = useState("");
    const [busyId, setBusyId] = useState(null);

    const apply = useCallback((res) => setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error }), []);
    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true }));
        apply(await getNotices());
    }, [apply]);

    useEffect(() => {
        let active = true;
        getNotices().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply]);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return state.rows
            .filter((r) => !q || [r.code, r.title, r.status].some((v) => v.toLowerCase().includes(q)))
            .sort((a, b) => a.code.localeCompare(b.code) || b.version - a.version);
    }, [state.rows, query]);

    const newVersion = async (r) => {
        setActionError("");
        setFlash("");
        setBusyId(r.id);
        const res = await createNoticeVersion(r.id);
        setBusyId(null);
        if (!res.ok) return setActionError(res.error);
        setFlash(`Draft v${r.version + 1} of ${r.code} created.`);
        load();
        if (res.data.id) setOpenId(res.data.id);
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Privacy notices</h1>
                    <p className="mt-1 max-w-3xl text-sm text-ink-3">Privacy notices shown to customers. Write a draft, add translations, then publish. Published notices are locked; to change one, create a new version.</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={load} disabled={state.loading} className={ghostBtn}><Icon name="refresh" className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />Refresh</button>
                    <button type="button" onClick={() => { setFlash(""); setCreating(true); }} className={primaryBtn}>+ New notice</button>
                </div>
            </div>

            {flash && <Alert tone="success" action={<button type="button" aria-label="Dismiss" onClick={() => setFlash("")} className="text-lg leading-none text-muted hover:text-ink">&times;</button>}>{flash}</Alert>}
            <Alert>{actionError}</Alert>
            {state.error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>}

            {!state.loading && state.rows.length > 0 && (
                <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="All notices" value={state.rows.length} total={state.rows.length} icon="notice" tone="info" hint="Every version" />
                    <StatTile label="Published" value={state.rows.filter((r) => /publish/i.test(r.status)).length} total={state.rows.length} icon="check" tone="ok" colorValue hint="Shown to data principals" />
                    <StatTile label="Drafts" value={state.rows.filter((r) => /draft/i.test(r.status)).length} total={state.rows.length} icon="file" tone="warn" colorValue hint="Not visible yet" />
                    <StatTile label="Notice codes" value={new Set(state.rows.map((r) => r.code)).size} icon="list" tone="violet" hint="Distinct notices" />
                </section>
            )}

            <div className={`${panel} overflow-hidden`}>
                {state.loading ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 pg-shimmer rounded" />)}</div>
                ) : rows.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-ink-3">{state.rows.length ? "No notices match your search." : 'No notices yet. Use "New notice" to create one.'}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="bg-soft">
                                <tr><th className={`${th} pl-5`}>Code</th><th className={th}>Title</th><th className={th}>Version</th><th className={th}>Status</th><th className={th}>Purposes</th><th className={th}>Created</th><th className={`${th} pr-5`} /></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-soft">
                                        <td className={`${td} pl-5 font-mono text-xs`}>{r.code}</td>
                                        <td className={`${td} font-medium text-ink`}>{r.title || "-"}</td>
                                        <td className={td}>v{r.version}</td>
                                        <td className={td}><StatusPill status={r.status} /></td>
                                        <td className={td}>{r.purposesCount}</td>
                                        <td className={td}>{formatDate(r.createdAt)}</td>
                                        <td className={`${td} whitespace-nowrap pr-5 text-right`}>
                                            <button type="button" onClick={() => { setFlash(""); setOpenId(r.id); }} className="font-semibold text-brand-ink hover:underline">{isPublished(r.status) ? "View" : "Edit"}</button>
                                            {isPublished(r.status) && (
                                                <button type="button" onClick={() => newVersion(r)} disabled={busyId === r.id} className="ml-4 font-semibold text-info-ink hover:underline disabled:opacity-50">{busyId === r.id ? "Creating..." : "New version"}</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {creating && <CreateModal onClose={() => setCreating(false)} onCreated={(newId) => { setCreating(false); setFlash("Draft created. Add purposes and translations, then publish."); load(); if (newId) setOpenId(newId); }} />}
            {openId && <EditorModal key={openId} id={openId} onClose={() => setOpenId(null)} onChanged={(msg) => { if (msg) setFlash(msg); load(); }} />}
        </div>
    );
}
