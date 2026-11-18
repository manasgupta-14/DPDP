import { useState } from "react";
import { addCategory, addProcessor } from "../../../api/consent.js";
import { updateCategory, updateProcessor } from "../../../api/purposeRegistry.js";
import Modal from "../../shared/Modal.jsx";
import { dkBtn, dkInput, dkModal, dkPrimary } from "../consent/styles.js";
import { Check, Field } from "./FormBits.jsx";

const SENSITIVITIES = ["Low", "Medium", "High", "Critical"];
const RELATIONSHIPS = ["Processor", "Sub Processor", "Fiduciary"];

const norm = (v) => String(v || "").trim().toLowerCase();
const toCode = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function Footer({ busy, error, onClose, onSubmit, label }) {
    return (
        <>
            {error && <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs text-bad-ink">{error}</p>}
            <div className="flex justify-end gap-2.5">
                <button type="button" onClick={onClose} disabled={busy} className={dkBtn}>Cancel</button>
                <button type="button" onClick={onSubmit} disabled={busy} className={dkPrimary}>{busy ? "Saving..." : label}</button>
            </div>
        </>
    );
}

export function CategoryModal({ item, existing, onClose, onCreated }) {
    const editing = !!item;
    const [form, setForm] = useState({ name: item?.name ?? "", code: item?.code ?? "", description: item?.description ?? "", sensitivity: item?.sensitivity || "Low" });
    const [codeTouched, setCodeTouched] = useState(editing);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const code = codeTouched ? form.code : toCode(form.name);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async () => {
        setError("");
        if (!form.name.trim()) return setError("Enter a category name.");
        if (!code.trim() || !/^[a-z0-9_]+$/.test(code)) return setError("Code can only have lowercase letters, numbers and underscores.");
        if (existing.some((c) => c.id !== item?.id && (norm(c.name) === norm(form.name) || norm(c.code) === norm(code)))) return setError("A category with this name or code already exists.");
        setBusy(true);
        const fields = { code, name: form.name, description: form.description, sensitivity: form.sensitivity };
        const res = editing ? await updateCategory(item.id, fields) : await addCategory(fields);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onCreated?.(res.data.message || "Data category added.");
        onClose();
    };

    return (
        <Modal title={editing ? "Edit data category" : "Add data category"} onClose={() => !busy && onClose()}>
            <div className={dkModal}>
                <h2 className="pr-8 text-lg font-semibold">{editing ? `Edit ${item.name}` : "Add data category"}</h2>
                <p className="mt-0.5 text-xs text-muted">A type of personal data you collect, such as contact details.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Category name"><input value={form.name} onChange={set("name")} disabled={busy} placeholder="Contact details" className={dkInput} /></Field>
                    <Field label="Code"><input value={code} onChange={(e) => { setCodeTouched(true); set("code")(e); }} disabled={busy || editing} placeholder="contact_details" className={`${dkInput} font-mono`} /></Field>
                </div>
                <Field label="Description">
                    <textarea value={form.description} onChange={set("description")} disabled={busy} rows={3} placeholder="Registered mobile number, e-mail address and postal address of the connection." className={`${dkInput} h-auto py-2`} />
                </Field>
                <Field label="Sensitivity">
                    <select value={form.sensitivity} onChange={set("sensitivity")} disabled={busy} className={dkInput}>{SENSITIVITIES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                </Field>
                <Footer busy={busy} error={error} onClose={onClose} onSubmit={submit} label={editing ? "Save changes" : "Add category"} />
            </div>
        </Modal>
    );
}

export function ProcessorModal({ item, existing, onClose, onCreated }) {
    const editing = !!item;
    const [form, setForm] = useState({ legalName: item?.name ?? "", code: item?.code ?? "", relationship: item?.relationship || RELATIONSHIPS[0], country: item?.country || "IN", dataLeavesIndia: item?.leavesIndia ?? false });
    const [codeTouched, setCodeTouched] = useState(editing);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const code = codeTouched ? form.code : toCode(form.legalName);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const submit = async () => {
        setError("");
        if (!form.legalName.trim()) return setError("Enter the processor's legal name.");
        if (!code.trim() || !/^[a-z0-9_]+$/.test(code)) return setError("Code can only have lowercase letters, numbers and underscores.");
        if (!/^[A-Za-z]{2}$/.test(form.country.trim())) return setError("Country must be a 2-letter code, for example IN.");
        if (existing.some((p) => p.id !== item?.id && (norm(p.name) === norm(form.legalName) || norm(p.code) === norm(code)))) return setError("A processor with this name or code already exists.");
        setBusy(true);
        const fields = { code, legalName: form.legalName, relationship: form.relationship, country: form.country, dataLeavesIndia: form.dataLeavesIndia };
        const res = editing ? await updateProcessor(item.id, fields) : await addProcessor(fields);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onCreated?.(res.data.message || "Data processor added.");
        onClose();
    };

    return (
        <Modal title={editing ? "Edit data processor" : "Add data processor"} onClose={() => !busy && onClose()}>
            <div className={dkModal}>
                <h2 className="pr-8 text-lg font-semibold">{editing ? `Edit ${item.name}` : "Add data processor"}</h2>
                <p className="mt-0.5 text-xs text-muted">A company that processes personal data on your behalf.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Legal name"><input value={form.legalName} onChange={set("legalName")} disabled={busy} placeholder="BillDesk Payment Gateway" className={dkInput} /></Field>
                    <Field label="Code"><input value={code} onChange={(e) => { setCodeTouched(true); set("code")(e); }} disabled={busy || editing} placeholder="billdesk" className={`${dkInput} font-mono`} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Relationship">
                        <select value={form.relationship} onChange={set("relationship")} disabled={busy} className={dkInput}>{RELATIONSHIPS.map((v) => <option key={v} value={v}>{v}</option>)}</select>
                    </Field>
                    <Field label="Country (2-letter code)"><input value={form.country} maxLength={2} onChange={set("country")} disabled={busy} className={`${dkInput} uppercase`} /></Field>
                </div>
                <Check label="Data leaves India" checked={form.dataLeavesIndia} onChange={set("dataLeavesIndia")} disabled={busy} hint="Tick this when the processor stores or handles the data outside India." />
                <Footer busy={busy} error={error} onClose={onClose} onSubmit={submit} label={editing ? "Save changes" : "Add processor"} />
            </div>
        </Modal>
    );
}
