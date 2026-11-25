import { useMemo, useRef, useState } from "react";
import Alert from "../../shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import { EMPTY_FORM, LAWFUL_BASIS, PRINCIPAL_CATEGORIES, joinProcessors, splitProcessors, toFormValues, toPayload, validateInventory } from "../../../utils/inventory.js";

function ProcessorTags({ value, onChange, invalid }) {
    const [draft, setDraft] = useState("");
    const inputRef = useRef(null);
    const tags = splitProcessors(value);
    const commit = (text) => {
        const next = splitProcessors([...tags, ...splitProcessors(text)].join(","));
        onChange(joinProcessors(next));
        setDraft("");
    };
    const remove = (t) => onChange(joinProcessors(tags.filter((x) => x !== t)));
    const onKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === ",") && draft.trim()) {
            e.preventDefault();
            commit(draft);
        } else if (e.key === "Enter") {
            e.preventDefault();
        } else if (e.key === "Backspace" && !draft && tags.length) {
            remove(tags[tags.length - 1]);
        }
    };
    return (
        <div
            className={`${field} kv-tag-box flex min-h-[46px] cursor-text flex-wrap items-center gap-1.5 py-2`}
            aria-invalid={invalid}
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((t) => (
                <span key={t} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-ink ring-1 ring-brand/20">
                    <span className="truncate">{t}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(t); }} className="grid h-4 w-4 place-items-center rounded hover:bg-brand/15" aria-label={`Remove ${t}`}>
                        ×
                    </button>
                </span>
            ))}
            <input
                ref={inputRef}
                id="inv-processors"
                value={draft}
                onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
                onKeyDown={onKeyDown}
                onBlur={() => draft.trim() && commit(draft)}
                placeholder={tags.length ? "Add another" : "e.g. AWS, Razorpay, Mailchimp"}
                className="kv-tag-input min-w-[8rem] flex-1 text-sm"
                aria-describedby="inv-processors-help"
            />
        </div>
    );
}

export default function InventoryForm({ item = null, onSubmit, onSaved, onCancel }) {
    const editing = !!item;
    const initial = useMemo(() => (item ? toFormValues(item) : EMPTY_FORM), [item]);
    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");

    const changed = useMemo(() => Object.keys(initial).some((k) => String(form[k]).trim() !== String(initial[k]).trim()), [form, initial]);

    const setValue = (k, v) => {
        setForm((f) => ({ ...f, [k]: v }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setApiError("");
    };
    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setApiError("");
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = validateInventory(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await onSubmit(toPayload(form));
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onSaved?.();
    };

    const text = (k, label, props = {}) => (
        <label className="block text-sm font-medium text-ink-2">
            {label}
            <input value={form[k]} onChange={set(k)} className={field} aria-invalid={!!errors[k]} {...props} />
            <span className="mt-1 block text-xs text-bad-ink">{errors[k]}</span>
        </label>
    );

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">{editing ? "Edit data point" : "Add data point"}</h2>
            <p className="mt-1 text-sm text-ink-3">
                {editing ? "Changes apply to this data point everywhere it is used, including consent campaigns." : "Record what personal data you hold and why. Consent campaigns link to these."}
            </p>
            <div className="mt-5 space-y-4">
                {text("name", "Name", { maxLength: 150, placeholder: "e.g. Email address" })}
                {text("dataCategory", "Category", { maxLength: 100, placeholder: "e.g. Contact info" })}
                <label className="block text-sm font-medium text-ink-2">
                    Purpose
                    <textarea value={form.purpose} onChange={set("purpose")} rows={3} maxLength={300} placeholder="Why do you collect this data?" className={`${field} resize-y`} aria-invalid={!!errors.purpose} />
                    <span className="mt-1 flex justify-between text-xs">
                        <span className="text-bad-ink">{errors.purpose}</span>
                        <span className="text-muted">{form.purpose.length}/300</span>
                    </span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("dataSource", "Source (optional)", { maxLength: 150, placeholder: "e.g. Signup form" })}
                    {text("storageLocation", "Storage (optional)", { maxLength: 200, placeholder: "e.g. India region database" })}
                </div>
                {text("retentionPeriodDays", "Retention in days (optional)", { type: "number", min: 1, max: 36500, placeholder: "e.g. 365" })}

                <fieldset className="space-y-4 rounded-xl border border-line bg-soft/60 p-4">
                    <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">DPDP details</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-ink-2">
                            Lawful basis
                            <select value={form.lawfulBasis} onChange={set("lawfulBasis")} className={field} aria-invalid={!!errors.lawfulBasis}>
                                {!form.lawfulBasis && <option value="">Choose one</option>}
                                {LAWFUL_BASIS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <span className="mt-1 block text-xs text-bad-ink">{errors.lawfulBasis}</span>
                            <span className="block text-xs font-normal text-muted">{LAWFUL_BASIS.find((o) => o.value === form.lawfulBasis)?.hint || "Why you are allowed to hold this data (Section 7)."}</span>
                        </label>
                        <label className="block text-sm font-medium text-ink-2">
                            Whose data
                            <select value={form.dataPrincipalCategory} onChange={set("dataPrincipalCategory")} className={field} aria-invalid={!!errors.dataPrincipalCategory}>
                                {!form.dataPrincipalCategory && <option value="">Choose one</option>}
                                {PRINCIPAL_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <span className="mt-1 block text-xs text-bad-ink">{errors.dataPrincipalCategory}</span>
                            <span className="block text-xs font-normal text-muted">Customers, staff or children.</span>
                        </label>
                    </div>
                    {form.dataPrincipalCategory === "Minor" && (
                        <Alert tone="warning">Children's data needs verifiable consent from a parent or guardian. Tracking, behaviour monitoring and targeted ads are not allowed (Section 9).</Alert>
                    )}
                    <div className="text-sm font-medium text-ink-2">
                        <label htmlFor="inv-processors">Shared with processors (optional)</label>
                        <ProcessorTags value={form.sharedWithProcessors} onChange={(v) => setValue("sharedWithProcessors", v)} invalid={!!errors.sharedWithProcessors} />
                        <span className="mt-1 block text-xs text-bad-ink">{errors.sharedWithProcessors}</span>
                        <span id="inv-processors-help" className="block text-xs font-normal text-muted">Vendors who receive this data (Section 8). Press Enter or comma after each name.</span>
                    </div>
                </fieldset>
                <Alert>{apiError}</Alert>
                <div className="flex gap-2.5">
                    <button type="submit" disabled={busy || (editing && !changed)} className={`${primaryBtn} flex-1`}>
                        {busy ? "Saving..." : editing ? "Save changes" : "Add data point"}
                    </button>
                    {onCancel && <button type="button" onClick={onCancel} disabled={busy} className={ghostBtn}>Cancel</button>}
                </div>
                {editing && !changed && <p className="text-center text-xs text-muted">Change a field to enable saving.</p>}
            </div>
        </form>
    );
}
