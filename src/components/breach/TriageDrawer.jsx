import { useEffect, useRef, useState } from "react";
import { assignIncident, updateIncident } from "../../api/breach.js";
import { BASE_STATUSES, SEVERITIES, formatDate, isFinished, sameText } from "../../utils/breach.js";
import Alert from "./Alert.jsx";
import { SeverityBadge, StatusBadge } from "./Badge.jsx";
import { field, ghostBtn, primaryBtn } from "./ui.js";

function validate(form, original) {
    const errors = {};
    if (!form.severity) errors.severity = "Select a severity.";
    const n = Number(form.estimatedAffectedRecords);
    if (form.estimatedAffectedRecords === "" || !Number.isInteger(n) || n < 0) errors.estimatedAffectedRecords = "Enter a whole number of 0 or more.";
    if (isFinished(form.status) && !isFinished(original.status) && form.mitigationSteps.trim().length < 5) {
        errors.mitigationSteps = "Record the mitigation or resolution before closing.";
    }
    return errors;
}

export default function TriageDrawer({ incident, statuses, assigneeName, onClose, onChanged }) {
    const [form, setForm] = useState({
        severity: incident.severity || "",
        status: incident.status,
        estimatedAffectedRecords: incident.estimatedAffectedRecords ?? 0,
        mitigationSteps: incident.mitigationSteps || "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [apiError, setApiError] = useState("");
    const [success, setSuccess] = useState("");
    const panelRef = useRef(null);

    useEffect(() => {
        const opener = document.activeElement;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.querySelector("select, input, textarea, button")?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key !== "Tab" || !panelRef.current) return;
            const items = [...panelRef.current.querySelectorAll("button:not([disabled]), select, input, textarea, [href]")];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
            opener?.focus?.();
        };
    }, [onClose]);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((er) => ({ ...er, [key]: undefined }));
        setConfirming(false);
        setSuccess("");
    };

    const statusOptions = [...new Set([...BASE_STATUSES, ...statuses, incident.status])];
    const closing = isFinished(form.status) && !sameText(form.status, incident.status);

    const persist = async () => {
        setSaving(true);
        setApiError("");
        const res = await updateIncident(incident.id, {
            status: form.status,
            severity: form.severity,
            estimatedAffectedRecords: Number(form.estimatedAffectedRecords),
            mitigationSteps: form.mitigationSteps.trim(),
        });
        setSaving(false);
        setConfirming(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        setSuccess("Incident updated.");
        await onChanged();
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setApiError("");
        setSuccess("");
        const found = validate(form, incident);
        setErrors(found);
        if (Object.keys(found).length) return;
        if (closing && !confirming) {
            setConfirming(true);
            return;
        }
        persist();
    };

    const onAssign = async () => {
        setAssigning(true);
        setApiError("");
        setSuccess("");
        const res = await assignIncident(incident.id);
        setAssigning(false);
        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        setSuccess("Incident assigned to you.");
        await onChanged();
    };

    const busy = saving || assigning;

    return (
        <div className="fixed inset-0 z-50">
            <button type="button" tabIndex={-1} aria-label="Close triage drawer" onClick={onClose} className="absolute inset-0 bg-[#0B1220]/60" />
            <aside ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="triage-title" className="pg-pop absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">Investigation workspace</p>
                        <h2 id="triage-title" className="mt-1 break-words text-xl font-bold text-[#0F172A]">{incident.title}</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <StatusBadge status={incident.status} />
                            <SeverityBadge severity={incident.severity} />
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#475569] hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        <section className="rounded-xl bg-[#F8FAFC] p-4" aria-label="Incident details">
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#334155]">{incident.description || "No description provided."}</p>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#475569]">
                                <div><dt className="font-semibold">Reported by</dt><dd className="mt-0.5 text-[#0F172A]">{incident.reporterLabel}</dd></div>
                                <div><dt className="font-semibold">Assigned to</dt><dd className="mt-0.5 text-[#0F172A]">{assigneeName}</dd></div>
                                <div><dt className="font-semibold">Incident date</dt><dd className="mt-0.5 text-[#0F172A]">{formatDate(incident.incidentDate)}</dd></div>
                                <div><dt className="font-semibold">Reported</dt><dd className="mt-0.5 text-[#0F172A]">{formatDate(incident.reportedAt)}</dd></div>
                            </dl>
                            <button type="button" onClick={onAssign} disabled={busy} className={`${ghostBtn} mt-4 w-full py-2 text-xs`}>
                                {assigning ? "Assigning..." : "Assign this incident to me"}
                            </button>
                        </section>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-[#334155]">
                                Severity
                                <select value={form.severity} onChange={set("severity")} aria-invalid={!!errors.severity} className={field}>
                                    <option value="" disabled>Select severity</option>
                                    {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <span className="mt-1 block text-xs text-[#DC2626]">{errors.severity}</span>
                            </label>
                            <label className="block text-sm font-medium text-[#334155]">
                                Status
                                <select value={form.status} onChange={set("status")} className={field}>
                                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                        </div>

                        <label className="block text-sm font-medium text-[#334155]">
                            Estimated affected records
                            <input type="number" inputMode="numeric" min="0" step="1" value={form.estimatedAffectedRecords} onChange={set("estimatedAffectedRecords")} aria-invalid={!!errors.estimatedAffectedRecords} className={field} />
                            <span className="mt-1 block text-xs text-[#DC2626]">{errors.estimatedAffectedRecords}</span>
                        </label>

                        <label className="block text-sm font-medium text-[#334155]">
                            Mitigation steps
                            <textarea rows={5} maxLength={4000} value={form.mitigationSteps} onChange={set("mitigationSteps")} aria-invalid={!!errors.mitigationSteps} placeholder="What was investigated or done to contain and fix the incident" className={`${field} resize-y`} />
                            <span className="mt-1 block text-xs text-[#DC2626]">{errors.mitigationSteps}</span>
                        </label>

                        {confirming && (
                            <div role="alertdialog" aria-label="Confirm closing" className="rounded-xl border border-[#D97706]/40 bg-[#D97706]/10 p-4 text-sm text-[#0F172A]">
                                <p className="font-semibold">Mark this incident as {form.status}?</p>
                                <p className="mt-1 text-[#475569]">The reporter will be able to see the outcome. Select Save changes again to confirm.</p>
                            </div>
                        )}

                        <Alert>{apiError}</Alert>
                        <Alert tone="success">{success}</Alert>
                    </div>

                    <div className="flex gap-3 border-t border-[#E2E8F0] p-5">
                        <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>Cancel</button>
                        <button type="submit" disabled={busy} className={`${primaryBtn} flex-1`}>
                            {saving ? "Saving..." : confirming ? "Confirm and save" : "Save changes"}
                        </button>
                    </div>
                </form>
            </aside>
        </div>
    );
}
