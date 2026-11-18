import { useState } from "react";
import { updateOrgUnit } from "../../../api/orgUnit.js";
import { CODE_PATTERN } from "../../../utils/orgUnit.js";
import Alert from "../../shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";

export default function EditOrgUnitForm({ unit, flat, onSaved, onClose }) {
    const [form, setForm] = useState({ name: unit.name, code: unit.code });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = {};
        const code = form.code.trim();
        if (form.name.trim().length < 2) found.name = "Use at least 2 characters.";
        if (!code) found.code = "Code is required.";
        else if (!CODE_PATTERN.test(code)) found.code = "Use lowercase letters, numbers and single hyphens, e.g. pune-urban.";
        else if (flat.some((u) => u.id !== unit.id && u.code.toLowerCase() === code)) found.code = "This code is already used by another unit.";
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await updateOrgUnit(unit.id, form);
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onSaved(`${form.name.trim()} was updated.`);
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Edit {unit.name}</h2>
            <p className="mt-0.5 text-xs text-muted">Change the name, code or parent of this unit.</p>
            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Name <span className="text-bad-ink">*</span>
                    <input value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: undefined })); }} maxLength={100} className={field} aria-invalid={!!errors.name} autoFocus />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>
                </label>
                <label className="block text-sm font-medium text-ink-2">
                    Code <span className="text-bad-ink">*</span>
                    <input value={form.code} onChange={(e) => { setForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, "-") })); setErrors((er) => ({ ...er, code: undefined })); }} maxLength={60} spellCheck={false} className={`${field} font-mono`} aria-invalid={!!errors.code} />
                    <span className="mt-1 block text-xs text-ink-3">Kind ({unit.kind}) and parent cannot be changed here. Only name and code can be edited.</span>
                    <span className="block text-xs text-bad-ink">{errors.code}</span>
                </label>
                <Alert>{apiError}</Alert>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Save changes"}</button>
                </div>
            </div>
        </form>
    );
}
