import { useState } from "react";
import { addDataPrincipal } from "../../../api/dataPrincipals.js";
import { GUARDIAN_CLASSES, PRINCIPAL_CLASSES, PRINCIPAL_LOCALES, allowedClassValues, classDobHint, classForDob, validatePrincipal } from "../../../utils/dataPrincipals.js";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, primaryBtn } from "../../shared/ui.js";

const label = "block text-sm font-medium text-ink-2";
const EMPTY = { mobile: "", email: "", consumerNo: "", fullName: "", displayName: "", dateOfBirth: "", cls: "adult", preferredLocale: "en-IN", orgUnitId: "", password: "", confirm: "" };

function validateLogin(form) {
    const e = {};
    if (!form.password && !form.confirm) return e;
    if (!form.email.trim()) e.email = "Email is required so this customer can sign in.";
    if (form.password.length < 8) e.password = "Use at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
}

function Row({ title, error, hint, children }) {
    return (
        <label className={label}>
            <span className="flex items-center gap-2">{title}</span>
            {children}
            {error ? <span role="alert" className="mt-1 block text-xs text-bad-ink">{error}</span> : hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
        </label>
    );
}

export default function AddDataPrincipalModal({ onClose, onAdded }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState(false);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const setDob = (e) => {
        const dateOfBirth = e.target.value;
        setForm((f) => ({ ...f, dateOfBirth, cls: classForDob(dateOfBirth, f.cls) }));
        setErrors((er) => ({ ...er, dateOfBirth: undefined, cls: undefined }));
    };
    const classOptions = PRINCIPAL_CLASSES.filter((c) => allowedClassValues(form.dateOfBirth).includes(c.value));

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = { ...validatePrincipal(form), ...validateLogin(form) };
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        setBusy(true);
        const res = await addDataPrincipal({
            mobile: form.mobile.trim(),
            email: form.email.trim(),
            consumerNo: form.consumerNo.trim(),
            fullName: form.fullName.trim(),
            dateOfBirth: form.dateOfBirth,
            cls: form.cls,
            preferredLocale: form.preferredLocale,
            password: form.password || undefined,
        });
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onAdded?.(res.data);
        onClose();
    };

    return (
        <Modal title="Add new user" onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className="max-h-[90vh] space-y-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">Add new user</h2>
                    <p className="mt-1 text-sm text-ink-3">Adds one customer, with the same checks as a bulk import. They will appear under Data principals.</p>
                </div>

                <p className="rounded-lg bg-soft px-3 py-2 text-xs text-ink-3 ring-1 ring-line">
                    The customer is placed in your own branch (the org unit you belong to) and always gets the Data Principal role. If you are not assigned to a unit, the customer will have no branch.
                </p>

                {errors.identifier && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{errors.identifier}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                    <Row title="Mobile" error={errors.mobile} hint="10 digits"><input value={form.mobile} onChange={set("mobile")} inputMode="numeric" maxLength={10} placeholder="9876543210" disabled={busy} className={field} /></Row>
                    <Row title="Email" error={errors.email}><input type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" disabled={busy} className={field} /></Row>
                    <Row title="Consumer no."><input value={form.consumerNo} onChange={set("consumerNo")} maxLength={50} placeholder="CN-10021" disabled={busy} className={field} /></Row>
                    <Row title="Full name"><input value={form.fullName} onChange={set("fullName")} maxLength={150} placeholder="Jayesh Suresh Mane" disabled={busy} className={field} /></Row>
                    <Row title="Date of birth" error={errors.dateOfBirth}><input type="date" value={form.dateOfBirth} onChange={setDob} max={new Date().toISOString().slice(0, 10)} disabled={busy} className={field} /></Row>
                    <Row title="Class" error={errors.cls} hint={GUARDIAN_CLASSES.includes(form.cls) ? `${classDobHint(form.dateOfBirth)} Guardian consent will be required (DPDP rule).` : classDobHint(form.dateOfBirth)}>
                        <select value={form.cls} onChange={set("cls")} disabled={busy} className={field}>{classOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                    </Row>
                    <Row title="Preferred locale" error={errors.preferredLocale}>
                        <select value={form.preferredLocale} onChange={set("preferredLocale")} disabled={busy} className={field}>{PRINCIPAL_LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
                    </Row>
                </div>

                <fieldset className="rounded-xl border border-line p-4">
                    <legend className="px-1.5 text-sm font-semibold text-ink">Customer login <span className="font-normal text-muted">(optional)</span></legend>
                    <p className="text-xs text-muted">Set a password so this customer can sign in at the login page with their email and use the customer portal (consents, notices, privacy requests).</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Row title="Password" error={errors.password} hint="At least 8 characters"><input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" disabled={busy} className={field} /></Row>
                        <Row title="Confirm password" error={errors.confirm}><input type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" disabled={busy} className={field} /></Row>
                    </div>
                </fieldset>

                {apiError && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{apiError}</p>}

                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Adding..." : "Add user"}</button>
                </div>
            </form>
        </Modal>
    );
}
