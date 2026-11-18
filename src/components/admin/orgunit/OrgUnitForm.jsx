import { useMemo, useState } from "react";
import { createOrgUnit } from "../../../api/orgUnit.js";
import { CODE_PATTERN, MAX_DEPTH, allowedKinds, kindRuleMessage, slugify, suggestKind } from "../../../utils/orgUnit.js";
import Alert from "../../shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../shared/ui.js";

function validate(form, flat, parent, parentDepth) {
    const errors = {};
    const code = form.code.trim();
    if (!form.kind) errors.kind = "Select a kind.";
    else if (!allowedKinds(parent).includes(form.kind)) errors.kind = kindRuleMessage(parent);
    if (!code) errors.code = "Code is required.";
    else if (!CODE_PATTERN.test(code)) errors.code = "Use lowercase letters, numbers and single hyphens, e.g. pune-urban.";
    else if (flat.some((u) => u.code.toLowerCase() === code)) errors.code = "This code is already used by another unit.";
    if (form.name.trim().length < 2) errors.name = "Use at least 2 characters.";
    if (parentDepth + 1 > MAX_DEPTH) errors.parentId = `The hierarchy can have at most ${MAX_DEPTH} levels.`;
    return errors;
}

export default function OrgUnitForm({ flat, parent, onSaved, onClose }) {
    const [form, setForm] = useState({
        kind: suggestKind(parent),
        code: "",
        name: "",
        parentId: parent?.id || "",
    });
    const [kindTouched, setKindTouched] = useState(false);
    const [codeTouched, setCodeTouched] = useState(false);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");

    const options = useMemo(() => flat.filter((u) => u.active), [flat]);
    const selectedParent = flat.find((u) => u.id === form.parentId) || null;
    const parentDepth = selectedParent ? selectedParent.depth : 0;
    const kinds = allowedKinds(selectedParent);

    const clear = (key) => setErrors((er) => ({ ...er, [key]: undefined }));

    const onName = (e) => {
        const name = e.target.value;
        setForm((f) => ({ ...f, name, code: codeTouched ? f.code : slugify(name) }));
        clear("name");
        clear("code");
    };

    const onCode = (e) => {
        setCodeTouched(true);
        setForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, "-") }));
        clear("code");
    };

    const onKind = (e) => {
        setKindTouched(true);
        setForm((f) => ({ ...f, kind: e.target.value }));
        clear("kind");
    };

    const onParent = (e) => {
        const parentId = e.target.value;
        const next = flat.find((u) => u.id === parentId) || null;
        setForm((f) => ({ ...f, parentId, kind: kindTouched && allowedKinds(next).includes(f.kind) ? f.kind : suggestKind(next) }));
        clear("parentId");
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = validate(form, flat, selectedParent, parentDepth);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createOrgUnit(form);
        setBusy(false);

        if (!res.ok) return setApiError(res.error);
        onSaved(`${form.name.trim()} was added.`, form.parentId);
    };

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">{selectedParent ? `New unit under ${selectedParent.name}` : "New top-level unit"}</h2>
            <p className="mt-0.5 text-xs text-muted">Add a branch, department or team to your organisation.</p>

            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Kind <span className="text-bad-ink">*</span>
                    <select value={form.kind} onChange={onKind} className={field} aria-invalid={!!errors.kind}>
                        {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <span className="mt-1 block text-xs text-ink-3">{selectedParent ? `Under a ${selectedParent.kind}, only lower levels can be added.` : "A top-level unit can be of any kind."}</span>
                    <span className="block text-xs text-bad-ink">{errors.kind}</span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Code <span className="text-bad-ink">*</span>
                    <input value={form.code} onChange={onCode} maxLength={60} placeholder="pune-urban" spellCheck={false} className={`${field} font-mono`} aria-invalid={!!errors.code} />
                    <span className="mt-1 block text-xs text-ink-3">Stable machine name used to identify the unit.</span>
                    <span className="block text-xs text-bad-ink">{errors.code}</span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Name <span className="text-bad-ink">*</span>
                    <input value={form.name} onChange={onName} maxLength={100} placeholder="Pune Urban" className={field} aria-invalid={!!errors.name} autoFocus />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.name}</span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Parent
                    <select value={form.parentId} onChange={onParent} className={field} aria-invalid={!!errors.parentId}>
                        <option value="">None (top-level unit)</option>
                        {options.map((u) => (
                            <option key={u.id} value={u.id} disabled={u.depth >= MAX_DEPTH}>
                                {`${"\u00A0\u00A0".repeat(u.depth - 1)}${u.name} (${u.kind})`}
                            </option>
                        ))}
                    </select>
                    <span className="mt-1 block text-xs text-ink-3">The hierarchy can have up to {MAX_DEPTH} levels.</span>
                    <span className="block text-xs text-bad-ink">{errors.parentId}</span>
                </label>

                <Alert>{apiError}</Alert>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Saving..." : "Create unit"}</button>
                </div>
            </div>
        </form>
    );
}
