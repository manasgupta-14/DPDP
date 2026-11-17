import { useMemo, useState } from "react";
import Alert from "../../shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import { EMPTY_FORM, toFormValues, toPayload, validateInventory } from "../../../utils/inventory.js";

export default function InventoryForm({ item = null, onSubmit, onSaved, onCancel }) {
    const editing = !!item;
    const initial = useMemo(() => (item ? toFormValues(item) : EMPTY_FORM), [item]);
    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");

    const changed = useMemo(() => Object.keys(initial).some((k) => String(form[k]).trim() !== String(initial[k]).trim()), [form, initial]);

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
