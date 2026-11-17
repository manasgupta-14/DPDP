import { useMemo, useState } from "react";
import { createTemplate, updateTemplate } from "../../../api/noticeTemplate.js";
import { DEFAULT_COLOR, DEFAULT_LAYOUT, isHex, norm, toCode } from "../../../utils/noticeTemplate.js";
import Alert from "../../shared/Alert.jsx";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import NoticePreview from "./NoticePreview.jsx";

const hint = "mt-1 block text-xs font-normal text-ink-3";
const err = "mt-1 block text-xs text-bad-ink";

export default function TemplateFormModal({ template, templates, purposeOptions, purposeError, onClose, onSaved }) {
    const editing = !!template;
    const [form, setForm] = useState({
        name: template?.name ?? "",
        code: template?.code ?? "",
        description: template?.description ?? "",
        purposes: template?.purposes ?? [],
        logoUrl: template?.logoUrl ?? "",
        primaryColor: template?.primaryColor || DEFAULT_COLOR,
        layout: template?.layout || DEFAULT_LAYOUT,
    });
    const [codeTouched, setCodeTouched] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState(false);

    const code = editing ? form.code : codeTouched ? form.code : toCode(form.name);
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
    };
    const toggle = (c) => {
        setForm((f) => ({ ...f, purposes: f.purposes.includes(c) ? f.purposes.filter((x) => x !== c) : [...f.purposes, c] }));
        setErrors((er) => ({ ...er, purposes: undefined }));
    };

    const known = useMemo(() => new Set(purposeOptions.map((p) => p.code)), [purposeOptions]);
    const orphaned = form.purposes.filter((c) => !known.has(c));
    const options = useMemo(() => [...purposeOptions, ...orphaned.map((c) => ({ code: c, name: c }))], [purposeOptions, orphaned]);
    const picked = options.filter((p) => form.purposes.includes(p.code));

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = {};
        if (!form.name.trim()) found.name = "Enter a template name.";
        else if (form.name.trim().length > 150) found.name = "Use at most 150 characters.";
        if (!code.trim()) found.code = "Enter a code.";
        else if (!/^[a-z0-9_]+$/.test(code)) found.code = "Code can only have lowercase letters, numbers and underscores.";
        else if (code.length > 100) found.code = "Use at most 100 characters.";
        if (!form.description.trim()) found.description = "Describe what this notice is for.";
        if (form.purposes.length === 0) found.purposes = "Select at least one purpose.";
        if (!isHex(form.primaryColor)) found.primaryColor = "Use a hex colour like #2B59C3.";
        if (form.layout.trim().length > 50) found.layout = "Use at most 50 characters.";
        const others = editing ? templates.filter((t) => t.id !== template.id) : templates;
        if (others.some((t) => norm(t.code) === norm(code))) found.code = "A template with this code already exists.";
        else if (others.some((t) => norm(t.name) === norm(form.name))) found.name = "A template with this name already exists.";
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const payload = { ...form, code };
        const res = editing ? await updateTemplate(template.id, payload) : await createTemplate(payload);
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onSaved(res.data.message);
        onClose();
    };

    const title = editing ? `Edit template \u00B7 ${template.name}` : "New notice template";

    return (
        <Modal title={title} onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className={`${panel} max-h-[90vh] overflow-y-auto p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-ink-3">A template groups the purposes a consumer is told about in one notice, with your organisation's logo and colour.</p>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-ink-2">
                                Name
                                <input value={form.name} onChange={set("name")} maxLength={150} disabled={busy} placeholder="General service notice" className={field} aria-invalid={!!errors.name} />
                                <span className={err}>{errors.name}</span>
                            </label>
                            <label className="block text-sm font-medium text-ink-2">
                                Code
                                <input value={code} onChange={(e) => { setCodeTouched(true); set("code")(e); }} readOnly={editing} maxLength={100} disabled={busy} placeholder="general_service_notice" className={`${field} font-mono ${editing ? "cursor-not-allowed bg-subtle" : ""}`} aria-invalid={!!errors.code} />
                                <span className={hint}>{editing ? "Codes cannot be changed once created." : "Stable machine name for this template."}</span>
                                <span className={err}>{errors.code}</span>
                            </label>
                        </div>

                        <label className="block text-sm font-medium text-ink-2">
                            Description
                            <textarea value={form.description} onChange={set("description")} rows={3} disabled={busy} placeholder="What is this notice for, and who sees it?" className={`${field} resize-y`} aria-invalid={!!errors.description} />
                            <span className={err}>{errors.description}</span>
                        </label>

                        <fieldset className="rounded-xl border border-line bg-soft p-3">
                            <legend className="px-1 text-sm font-medium text-ink-2">Purposes in this notice</legend>
                            {purposeError ? (
                                <p className="text-xs text-bad-ink">Could not load purposes: {purposeError}</p>
                            ) : options.length === 0 ? (
                                <p className="text-xs text-ink-3">No purposes yet. Add them on the Purposes page first.</p>
                            ) : (
                                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                                    {options.map((p) => (
                                        <label key={p.code} className="flex items-start gap-2 text-xs text-ink">
                                            <input type="checkbox" checked={form.purposes.includes(p.code)} onChange={() => toggle(p.code)} disabled={busy} className="mt-0.5 accent-brand" />
                                            <span>{p.name}<span className="block font-mono text-[10px] text-muted">{p.code}</span></span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            <span className={err}>{errors.purposes}</span>
                            {orphaned.length > 0 && <span className="mt-2 block text-[11px] text-warn-ink">{orphaned.length} saved purpose code(s) are no longer in the purposes list. Untick them to remove.</span>}
                        </fieldset>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-ink-2">
                                <span className="flex items-center gap-2">Logo URL</span>
                                <input type="url" value={form.logoUrl} onChange={set("logoUrl")} disabled={busy} placeholder="https://example.com/logo.png" className={field} />
                                <span className={hint}>Optional. Shown at the top of the notice.</span>
                            </label>
                            <label className="block text-sm font-medium text-ink-2">
                                <span className="flex items-center gap-2">Primary colour</span>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={isHex(form.primaryColor) ? form.primaryColor : DEFAULT_COLOR} onChange={set("primaryColor")} disabled={busy} aria-label="Pick colour" className="mt-1.5 h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-surface p-1" />
                                    <input value={form.primaryColor} onChange={set("primaryColor")} disabled={busy} maxLength={7} className={`${field} font-mono uppercase`} aria-invalid={!!errors.primaryColor} />
                                </div>
                                <span className={err}>{errors.primaryColor}</span>
                            </label>
                        </div>
                        <label className="block text-sm font-medium text-ink-2">
                            Layout
                            <input list="notice-template-layouts" value={form.layout} onChange={set("layout")} maxLength={50} disabled={busy} placeholder="Standard" className={field} aria-invalid={!!errors.layout} />
                            <datalist id="notice-template-layouts"><option value="Standard" /></datalist>
                            <span className={hint}>Standard is the default layout.</span>
                            <span className={err}>{errors.layout}</span>
                        </label>
                        {editing && (template.logoUrl === undefined || template.primaryColor === undefined) && (
                            <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn-ink">Check the logo and colour before saving. Saving uses the values shown here.</p>
                        )}
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">Preview</p>
                        <NoticePreview name={form.name} description={form.description} logoUrl={form.logoUrl} color={form.primaryColor} purposes={picked} />
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <Alert>{apiError}</Alert>
                    <div className="flex justify-end gap-2.5">
                        <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : editing ? "Save changes" : "Create template"}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
