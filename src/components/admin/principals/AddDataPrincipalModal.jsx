import { useState } from "react";
import { addDataPrincipal } from "../../../api/dataPrincipals.js";
import { GUARDIAN_CLASSES, PRINCIPAL_CLASSES, PRINCIPAL_LOCALES, validatePrincipal } from "../../../utils/dataPrincipals.js";
import Modal from "../../shared/Modal.jsx";
import { field, ghostBtn, primaryBtn } from "../../shared/ui.js";

const label = "block text-sm font-medium text-[#334155]";
const EMPTY = { mobile: "", email: "", consumerNo: "", fullName: "", displayName: "", dateOfBirth: "", cls: "adult", preferredLocale: "en-IN", orgUnitId: "" };

function Row({ title, error, hint, children }) {
    return (
        <label className={label}>
            <span className="flex items-center gap-2">{title}</span>
            {children}
            {error ? <span role="alert" className="mt-1 block text-xs text-[#B91C1C]">{error}</span> : hint && <span className="mt-1 block text-xs font-normal text-[#64748B]">{hint}</span>}
        </label>
    );
}

export default function AddDataPrincipalModal({ onClose, onAdded }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [busy, setBusy] = useState(false);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        const found = validatePrincipal(form);
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
        });
        setBusy(false);
        if (!res.ok) return setApiError(res.error);
        onAdded?.(res.data);
        onClose();
    };

    return (
        <Modal title="Add new user" onClose={() => !busy && onClose()}>
            <form onSubmit={submit} noValidate className="max-h-[90vh] space-y-4 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-xl sm:p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">Add new user</h2>
                    <p className="mt-1 text-sm text-[#475569]">Adds one data principal, with the same checks as a bulk import row. The user is saved through <span className="font-mono text-xs">POST /api/dataprincipal/add</span> and appears under Data principals.</p>
                </div>

                {errors.identifier && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{errors.identifier}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                    <Row title="Mobile" error={errors.mobile} hint="10 digits"><input value={form.mobile} onChange={set("mobile")} inputMode="numeric" maxLength={10} placeholder="9876543210" disabled={busy} className={field} /></Row>
                    <Row title="Email" error={errors.email}><input type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" disabled={busy} className={field} /></Row>
                    <Row title="Consumer no."><input value={form.consumerNo} onChange={set("consumerNo")} maxLength={50} placeholder="CN-10021" disabled={busy} className={field} /></Row>
                    <Row title="Full name"><input value={form.fullName} onChange={set("fullName")} maxLength={150} placeholder="Jayesh Suresh Mane" disabled={busy} className={field} /></Row>
                    <Row title="Date of birth" error={errors.dateOfBirth}><input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} max={new Date().toISOString().slice(0, 10)} disabled={busy} className={field} /></Row>
                    <Row title="Class" error={errors.cls} hint={GUARDIAN_CLASSES.includes(form.cls) ? "Guardian consent will be required (DPDP rule)." : undefined}>
                        <select value={form.cls} onChange={set("cls")} disabled={busy} className={field}>{PRINCIPAL_CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                    </Row>
                    <Row title="Preferred locale" error={errors.preferredLocale}>
                        <select value={form.preferredLocale} onChange={set("preferredLocale")} disabled={busy} className={field}>{PRINCIPAL_LOCALES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
                    </Row>
                </div>

                {apiError && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{apiError}</p>}

                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Adding..." : "Add user"}</button>
                </div>
            </form>
        </Modal>
    );
}
