import { useMemo, useState } from "react";
import { addPurpose } from "../../../api/consent.js";
import { updatePurpose } from "../../../api/purposeRegistry.js";
import Modal from "../../shared/Modal.jsx";
import { dkBtn, dkInput, dkModal, dkPrimary } from "../consent/styles.js";
import { Check, Field } from "./FormBits.jsx";

const norm = (v) => String(v || "").trim().toLowerCase();
const toCode = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const unique = (list) => [...new Set(list.filter(Boolean))];

const LEGAL_BASES = ["Consent (Sec 6)", "Legitimate use (Sec 7)"];
const RISK_LEVELS = ["Low risk", "Medium risk", "High risk"];
const RETENTION_UNITS = ["days", "months", "years"];

function parseRetention(text) {
    const m = String(text ?? "").trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(day|week|month|year)s?$/);
    if (!m) return null;
    return m[2] === "week" ? { value: String(Number(m[1]) * 7), unit: "days" } : { value: m[1], unit: `${m[2]}s` };
}

function PickList({ title, items, picked, toggle, disabled, detail, emptyText }) {
    return (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
            <p className="text-xs font-semibold text-[#0F172A]">{title}</p>
            {items.length === 0 ? (
                <p className="mt-2 text-xs text-[#475569]">{emptyText}</p>
            ) : (
                <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                    {items.map((i) => (
                        <label key={i.id} className="flex items-center gap-2 text-xs text-[#0F172A]">
                            <input type="checkbox" checked={picked.has(i.id)} onChange={() => toggle(i.id)} disabled={disabled} className="accent-[#0F766E]" />
                            <span>{i.name}{detail(i) && <span className="text-[#475569]"> ({detail(i)})</span>}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PurposeFormModal({ purpose, existing, categories, processors, onClose, onCreated }) {
    const editing = !!purpose;
    const parsed = editing ? parseRetention(purpose.retention) : { value: "1", unit: "years" };
    const [form, setForm] = useState(() => ({
        name: purpose?.name ?? "", code: purpose?.code ?? "", description: purpose?.description ?? "",
        legalBasis: purpose?.legalBasis || LEGAL_BASES[0], risk: purpose?.risk || RISK_LEVELS[0],
        retentionValue: parsed?.value ?? "1", retentionUnit: parsed?.unit ?? "years", retentionText: purpose?.retention ?? "",
        lapses: purpose?.lapses ?? false, active: purpose?.active ?? true, mandatory: purpose?.mandatory ?? false, prohibitedForChildren: purpose?.prohibitedForChildren ?? false,
    }));
    const [codeTouched, setCodeTouched] = useState(editing);
    const [categoryIds, setCategoryIds] = useState(() => new Set(purpose ? purpose.categories.map((c) => c.id) : []));
    const [processorIds, setProcessorIds] = useState(() => new Set(purpose ? purpose.processors.map((c) => c.id) : []));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
    const code = codeTouched ? form.code : toCode(form.name);
    const legalOptions = useMemo(() => unique([...LEGAL_BASES, ...existing.map((p) => p.legalBasis)]), [existing]);
    const riskOptions = useMemo(() => unique([...RISK_LEVELS, ...existing.map((p) => p.risk)]), [existing]);
    const toggle = (setter) => (id) => setter((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

    const submit = async () => {
        setError("");
        if (!form.name.trim()) return setError("Enter a display name.");
        if (!code.trim()) return setError("Enter a code.");
        if (!/^[a-z0-9_]+$/.test(code)) return setError("Code can only have lowercase letters, numbers and underscores.");
        const textRetention = editing && !parsed;
        const amount = Number(form.retentionValue);
        if (textRetention ? !form.retentionText.trim() : form.retentionValue === "" || !Number.isFinite(amount) || amount <= 0) return setError("Enter how long the data is retained, for example 8 years.");
        const others = existing.filter((p) => !editing || p.code !== purpose.code);
        if (others.some((p) => norm(p.name) === norm(form.name) || norm(p.code) === norm(code))) return setError("A purpose with this name or code already exists.");
        setBusy(true);
        const unit = amount === 1 ? form.retentionUnit.replace(/s$/, "") : form.retentionUnit;
        const fields = {
            code,
            shortName: form.name,
            description: form.description,
            isMandatory: form.mandatory,
            legalBasis: form.legalBasis,
            retentionPeriod: textRetention ? form.retentionText : `${amount} ${unit}`,
            riskLevel: form.risk,
            doesConsentLapse: form.lapses,
            isActive: form.active,
            isProhibitedForChildren: form.prohibitedForChildren,
            categoryIds: [...categoryIds],
            processorIds: [...processorIds],
        };
        const res = editing ? await updatePurpose(purpose.id, fields) : await addPurpose(fields);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onCreated?.(res.data.message);
        onClose();
    };

    return (
        <Modal title={editing ? "Edit processing purpose" : "New processing purpose"} onClose={() => !busy && onClose()}>
            <div className={dkModal}>
                <h2 className="pr-8 text-lg font-semibold">{editing ? `Edit ${purpose.name}` : "New processing purpose"}</h2>
                {editing && <p className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#475569]">Saving creates version {purpose.version + 1}. The current version (v{purpose.version}) is archived, and its history stays available.</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Code" hint={editing ? "Code stays the same across versions." : "Stable machine name, appears in consent artifacts"}>
                        <input value={code} placeholder="billing_metering" onChange={(e) => { setCodeTouched(true); set("code")(e); }} disabled={busy || editing} className={`${dkInput} font-mono`} />
                    </Field>
                    <Field label="Display name">
                        <input value={form.name} placeholder="Billing & metering" onChange={set("name")} disabled={busy} className={dkInput} />
                    </Field>
                </div>

                <Field label="Plain-language description" hint="This exact text is shown to the consumer. Write it the way you would say it on the phone.">
                    <textarea value={form.description} onChange={set("description")} disabled={busy} rows={3} placeholder="We read your meter, work out your monthly bill and keep the record of what was billed and paid." className={`${dkInput} h-auto py-2`} />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Legal basis" hint="Legitimate use (Sec 7) means consent is not the basis, so consumers cannot withdraw it.">
                        <select value={form.legalBasis} onChange={set("legalBasis")} disabled={busy} className={dkInput}>
                            {legalOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Risk level">
                        <select value={form.risk} onChange={set("risk")} disabled={busy} className={dkInput}>
                            {riskOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Retention" hint="Saved as text, for example 8 years.">
                        <div className="flex gap-2">
                            {editing && !parsed ? (
                                <input value={form.retentionText} onChange={set("retentionText")} disabled={busy} className={dkInput} />
                            ) : (
                                <>
                                    <input type="number" min="1" value={form.retentionValue} onChange={set("retentionValue")} disabled={busy} className={dkInput} />
                                    <select value={form.retentionUnit} onChange={set("retentionUnit")} disabled={busy} className={dkInput}>
                                        {RETENTION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                    </Field>
                    <div className="space-y-3 pt-5">
                        <Check label="Consent lapses" checked={form.lapses} onChange={set("lapses")} disabled={busy} hint="Consent given for this purpose expires after a fixed period." />
                        <Check label="Mandatory for the service" checked={form.mandatory} onChange={set("mandatory")} disabled={busy} hint="Only use this where the service cannot be delivered without it." />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Check label="Active" checked={form.active} onChange={set("active")} disabled={busy} hint="Turn off to save this version as inactive." />
                    <Check label="Prohibited for children (Sec 9(2))" checked={form.prohibitedForChildren} onChange={set("prohibitedForChildren")} disabled={busy} hint="Tick if this purpose must not be applied to a child's data." />
                </div>

                <PickList
                    title="Data categories this purpose touches"
                    items={categories}
                    picked={categoryIds}
                    toggle={toggle(setCategoryIds)}
                    disabled={busy}
                    detail={(c) => c.sensitivity}
                    emptyText="No data categories yet. Add one in the Data categories tab first."
                />
                <PickList
                    title="Processors this data is shared with"
                    items={processors}
                    picked={processorIds}
                    toggle={toggle(setProcessorIds)}
                    disabled={busy}
                    detail={(p) => p.country}
                    emptyText="No processors yet. Add one in the Processors tab first."
                />

                {error && <p role="alert" className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-2 text-xs text-[#B91C1C]">{error}</p>}

                <div className="flex items-center justify-between gap-2.5">
                    <span />
                    <div className="flex gap-2.5">
                        <button type="button" onClick={onClose} disabled={busy} className={dkBtn}>Cancel</button>
                        <button type="button" onClick={submit} disabled={busy} className={dkPrimary}>{busy ? "Saving..." : editing ? "Save new version" : "Create purpose"}</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
