import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { createNoticeVersion, getNotice, getPurposeDetails, getTemplateOptions, publishNotice, updateNotice } from "../../api/notices.js";
import Alert from "../../components/shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { LANGUAGES, isPublished, langLabel } from "../../utils/noticeApi.js";
import { StatusPill } from "../../components/admin/notices/NoticeBadges.jsx";

const PUBLISH_WARNING = "Publish this notice? A published notice is locked and hashed. To change it later you will need to create a new version.";

const DASH = <span className="text-[#94A3B8]">-</span>;

function Section({ letter, title, hint, children }) {
    return (
        <section className={panel}>
            <header className="flex items-center gap-3 border-b border-[#E2E8F0] px-5 py-4">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#CCFBF1] text-xs font-bold text-[#0F766E]">{letter}</span>
                <div>
                    <h2 className="font-semibold text-[#0F172A]">{title}</h2>
                    {hint && <p className="text-xs text-[#64748B]">{hint}</p>}
                </div>
            </header>
            <div className="p-5">{children}</div>
        </section>
    );
}

function TemplatePreview({ template, notice, changed }) {
    if (!template && !notice.layout) return <p className="text-sm text-[#64748B]">No template applied yet. Pick one and save the draft.</p>;
    const color = notice.primaryColor;
    return (
        <div className="rounded-xl border border-[#E2E8F0] p-4" style={color ? { borderTop: `4px solid ${color}` } : undefined}>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-[#64748B]">Layout</dt><dd className="font-medium">{template?.layout || notice.layout || DASH}</dd></div>
                <div>
                    <dt className="text-xs text-[#64748B]">Primary colour</dt>
                    <dd className="flex items-center gap-2 font-medium">{color ? <><span className="h-4 w-4 rounded border border-[#CBD5E1]" style={{ background: color }} />{color}</> : DASH}</dd>
                </div>
                <div>
                    <dt className="text-xs text-[#64748B]">Logo</dt>
                    <dd className="font-medium">{notice.logoUrl ? <img src={notice.logoUrl} alt="" className="h-8 max-w-[120px] object-contain" /> : DASH}</dd>
                </div>
            </dl>
            {changed && <p className="mt-3 text-xs text-[#B45309]">Template changed - colour and logo are applied when you save the draft.</p>}
        </div>
    );
}

export default function NoticeEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [notice, setNotice] = useState(null);
    const [form, setForm] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [purposes, setPurposes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState(location.state?.flash ?? "");
    const [busy, setBusy] = useState("");
    const [lang, setLang] = useState("");
    const [newLang, setNewLang] = useState("");

    const hydrate = useCallback((n, templateList) => {
        const tpl = templateList.find((t) => t.id === n.templateId);
        const own = tpl ? n.purposes.filter((c) => !tpl.purposes.includes(c)) : n.purposes;
        const translations = n.translations.length ? n.translations : [{ language: n.defaultLanguage, title: "", summary: "", isTranslated: true }];
        setNotice(n);
        setForm({ templateId: n.templateId, defaultLanguage: n.defaultLanguage, purposes: own, translations });
        setLang((l) => (translations.some((t) => t.language === l) ? l : n.defaultLanguage));
    }, []);

    const [tick, setTick] = useState(0);
    const load = useCallback(() => {
        setLoading(true);
        setTick((t) => t + 1);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([getNotice(id), getTemplateOptions(), getPurposeDetails()]).then(([n, t, p]) => {
            if (!active) return;
            if (t.ok) setTemplates(t.data);
            if (p.ok) setPurposes(p.data);
            if (n.ok) {
                hydrate(n.data, t.ok ? t.data : []);
                setError(t.ok && p.ok ? "" : "Some options could not be loaded: " + (t.ok ? p.error : t.error));
            } else setError(n.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [id, tick, hydrate]);

    const template = templates.find((t) => t.id === form?.templateId) || null;
    const published = notice ? isPublished(notice.status) : false;
    const merged = [...new Set([...(template?.purposes || []), ...(form?.purposes || [])])];
    const nameOf = (code) => purposes.find((p) => p.code === code)?.name || code;
    const allPurposes = [...purposes, ...merged.filter((c) => !purposes.some((p) => p.code === c)).map((c) => ({ code: c, name: c }))];

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const togglePurpose = (code) => set({ purposes: form.purposes.includes(code) ? form.purposes.filter((c) => c !== code) : [...form.purposes, code] });
    const setTranslation = (language, patch) => set({ translations: form.translations.map((t) => (t.language === language ? { ...t, ...patch } : t)) });
    const addLanguage = () => {
        if (!newLang || form.translations.some((t) => t.language === newLang)) return;
        set({ translations: [...form.translations, { language: newLang, title: "", summary: "", isTranslated: false }] });
        setLang(newLang);
        setNewLang("");
    };
    const removeLanguage = (language) => {
        if (language === form.defaultLanguage) return;
        set({ translations: form.translations.filter((t) => t.language !== language) });
        setLang(form.defaultLanguage);
    };

    const validate = () => {
        if (!form.templateId) return "Select a template to save the notice.";
        const primary = form.translations.find((t) => t.language === form.defaultLanguage);
        if (!primary?.title.trim()) return `Enter the ${langLabel(form.defaultLanguage)} (primary) title.`;
        const tooLong = form.translations.find((t) => t.title.trim().length > 500);
        if (tooLong) return `${langLabel(tooLong.language)} title can be at most 500 characters.`;
        return "";
    };

    const payload = () => ({ ...form, purposes: merged });

    const save = async () => {
        const problem = validate();
        if (problem) return setError(problem);
        setBusy("save");
        setError("");
        setFlash("");
        const res = await updateNotice(id, payload());
        setBusy("");
        if (!res.ok) return setError(res.error);
        setFlash(res.data.message);
        load();
    };

    const publish = async () => {
        const problem = validate();
        if (problem) return setError(problem);
        if (!window.confirm(PUBLISH_WARNING)) return;
        setBusy("publish");
        setError("");
        const saved = await updateNotice(id, payload());
        if (!saved.ok) {
            setBusy("");
            return setError(saved.error);
        }
        const res = await publishNotice(id);
        setBusy("");
        if (!res.ok) return setError(res.error);
        setFlash(res.data.message);
        load();
    };

    const newVersion = async () => {
        setBusy("version");
        setError("");
        const res = await createNoticeVersion(id);
        setBusy("");
        if (!res.ok) return setError(res.error);
        if (res.data.id) navigate(`/dashboard/notices/${res.data.id}`, { state: { flash: res.data.message } });
        else navigate("/dashboard/notices");
    };

    if (loading && !notice) return <div className="h-64 animate-pulse rounded-2xl bg-[#E2E8F0]/70" aria-busy="true" />;
    if (!notice || !form) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/notices" className="text-sm font-semibold text-[#0F766E] hover:underline">← Back to notices</Link>
                <Alert>{error || "Notice not found."}</Alert>
            </div>
        );
    }

    const current = form.translations.find((t) => t.language === lang);
    const addable = LANGUAGES.filter((l) => !form.translations.some((t) => t.language === l.code));
    const primaryTitle = form.translations.find((t) => t.language === form.defaultLanguage)?.title || notice.title;
    const templateChanged = !published && !!form.templateId && form.templateId !== notice.templateId;

    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{primaryTitle || "Notice"}</h1>
                    <p className="mt-1 text-sm text-[#475569]">
                        <Link to="/dashboard/notices" className="font-semibold text-[#0F766E] hover:underline">← Back to notices</Link>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono text-xs">{notice.code}</span> · v{notice.version} · primary language {langLabel(notice.defaultLanguage)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {published ? (
                        <button type="button" onClick={newVersion} disabled={busy === "version"} className={primaryBtn}>{busy === "version" ? "Creating..." : "Create new version"}</button>
                    ) : (
                        <>
                            <button type="button" onClick={save} disabled={!!busy} className={ghostBtn}>{busy === "save" ? "Saving..." : "Save draft"}</button>
                            <button type="button" onClick={publish} disabled={!!busy} className={primaryBtn}>{busy === "publish" ? "Publishing..." : "Publish"}</button>
                        </>
                    )}
                </div>
            </div>

            <Alert>{error}</Alert>
            <Alert tone="success">{flash}</Alert>

            <div className={`${panel} space-y-3 p-5`}>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-[#64748B]">Status:</span>
                    <StatusPill status={notice.status} />
                </div>
                {published && (
                    <div>
                        <p className="text-xs font-medium text-[#64748B]">Digital Fingerprint (SHA-256):</p>
                        {notice.hash ? <p className="mt-1 break-all rounded-lg bg-[#F1F5F9] px-3 py-2 font-mono text-sm text-[#0F172A]">{notice.hash}</p> : <p className="mt-1">{DASH}</p>}
                    </div>
                )}
                {!published && <p className="text-xs text-[#64748B]">Draft: editable. Once published, this notice becomes read-only and is hashed. To change it later, create a new version.</p>}
            </div>

            <Section letter="A" title="Template & settings" hint="The template gives this notice its layout, logo, colour and default purposes.">
                {published ? (
                    <div className="space-y-3 text-sm">
                        <p><span className="text-[#64748B]">Template: </span><span className="font-medium">{template?.name || "-"}</span></p>
                        <TemplatePreview template={template} notice={notice} changed={false} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-[#334155]">
                            Template
                            <select value={form.templateId} onChange={(e) => set({ templateId: e.target.value })} className={field}>
                                <option value="">Select a template</option>
                                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                            </select>
                        </label>
                        <TemplatePreview template={template} notice={notice} changed={templateChanged} />
                    </div>
                )}
            </Section>

            <Section letter="B" title="Consent purposes" hint="Purposes that come with the template are merged with your own selection.">
                {published ? (
                    merged.length === 0 ? <p className="text-sm text-[#64748B]">No purposes linked.</p> : (
                        <ul className="flex flex-wrap gap-2">{merged.map((c) => <li key={c} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold text-[#334155] ring-1 ring-[#CBD5E1]">{nameOf(c)}</li>)}</ul>
                    )
                ) : allPurposes.length === 0 ? (
                    <p className="text-sm text-[#64748B]">No purposes available. Add purposes first.</p>
                ) : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {allPurposes.map((p) => {
                            const fromTemplate = template?.purposes.includes(p.code);
                            const checked = merged.includes(p.code);
                            return (
                                <li key={p.code}>
                                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${checked ? "border-[#0F766E] bg-[#F0FDFA]" : "border-[#E2E8F0] bg-white"}`}>
                                        <input type="checkbox" checked={checked} disabled={fromTemplate} onChange={() => togglePurpose(p.code)} className="h-4 w-4 accent-[#0F766E]" />
                                        <span className="min-w-0 flex-1 truncate font-medium text-[#0F172A]">{p.name}</span>
                                        {fromTemplate && <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]">From template</span>}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <p className="mt-3 text-xs text-[#64748B]">{merged.length} {merged.length === 1 ? "purpose" : "purposes"} linked</p>
            </Section>

            <Section letter="C" title="Title, summary & translations" hint="One tab per language. The primary language is the notice title. All tabs are saved together.">
                <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-3">
                    {form.translations.map((t) => (
                        <button key={t.language} type="button" onClick={() => setLang(t.language)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${lang === t.language ? "bg-[#0F766E] text-white" : "border border-[#E2E8F0] text-[#334155] hover:border-[#0F766E]"}`}>
                            {langLabel(t.language)} ({t.language}){t.language === form.defaultLanguage && " · Primary"}
                        </button>
                    ))}
                    {!published && addable.length > 0 && (
                        <span className="ml-auto flex items-center gap-2">
                            <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className={`${field} !mt-0 !w-auto !py-1.5`}>
                                <option value="">Add language</option>
                                {addable.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                            </select>
                            <button type="button" onClick={addLanguage} disabled={!newLang} className={`${ghostBtn} !px-3 !py-1.5 text-xs`}>+ Add</button>
                        </span>
                    )}
                </div>
                {current ? (
                    <div className="mt-4 space-y-4">
                        <div className="text-sm">
                            <p className="font-medium text-[#334155]">{current.language === form.defaultLanguage ? "Primary title" : "Translated title"}</p>
                            {published ? <p className="mt-1">{current.title || "-"}</p> : <input value={current.title} maxLength={500} onChange={(e) => setTranslation(lang, { title: e.target.value })} className={field} />}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium text-[#334155]">{current.language === form.defaultLanguage ? "Summary" : "Translated summary"}</p>
                            {published ? <p className="mt-1 whitespace-pre-wrap">{current.summary || "-"}</p> : <textarea value={current.summary} onChange={(e) => setTranslation(lang, { summary: e.target.value })} rows={4} className={field} />}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
                                <input type="checkbox" checked={current.isTranslated} disabled={published} onChange={(e) => setTranslation(lang, { isTranslated: e.target.checked })} className="h-4 w-4 accent-[#0F766E]" />
                                Translation complete
                            </label>
                            {!published && current.language !== form.defaultLanguage && (
                                <button type="button" onClick={() => removeLanguage(current.language)} className="text-xs font-semibold text-[#B91C1C] hover:underline">Remove this language</button>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-[#64748B]">No translations yet.</p>
                )}
            </Section>
        </div>
    );
}
