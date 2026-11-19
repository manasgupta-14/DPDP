import { useState } from "react";
import { createIncident } from "../../api/breach.js";
import { getProfile } from "../../auth/authStore.js";
import { nowLocalInput } from "../../utils/breach.js";
import Alert from "../shared/Alert.jsx";
import { field, panel, primaryBtn } from "../shared/ui.js";

const LIMITS = { title: 150, description: 2000 };
const EMPTY = { title: "", description: "", incidentDate: "" };

function validate(form) {
    const errors = {};
    if (!form.title.trim()) errors.title = "Enter a title.";
    else if (form.title.trim().length < 5) errors.title = "Use at least 5 characters.";
    if (!form.description.trim()) errors.description = "Describe what happened.";
    else if (form.description.trim().length < 10) errors.description = "Use at least 10 characters.";
    if (!form.incidentDate) errors.incidentDate = "Select when the incident happened.";
    else if (new Date(form.incidentDate).getTime() > Date.now() + 60000) errors.incidentDate = "The date cannot be in the future.";
    return errors;
}

export default function IncidentForm({ onSubmitted }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState("");
    const [success, setSuccess] = useState("");

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((er) => ({ ...er, [key]: undefined }));
        setSuccess("");
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setApiError("");
        setSuccess("");
        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        const organizationId = getProfile()?.organizationId;
        if (!organizationId) {
            setApiError("Your session does not include an organisation. Please sign in again.");
            return;
        }

        setSubmitting(true);
        const res = await createIncident({
            organizationId,
            title: form.title.trim(),
            description: form.description.trim(),
            incidentDate: new Date(form.incidentDate).toISOString(),
            discoveryDate: new Date().toISOString(),
        });
        setSubmitting(false);

        if (!res.ok) {
            setApiError(res.error);
            return;
        }
        setForm(EMPTY);
        setSuccess("Your report has been submitted. The security team will review it.");
        onSubmitted?.();
    };

    return (
        <form onSubmit={onSubmit} noValidate className={`${panel} p-5 sm:p-6`} aria-labelledby="report-form-title">
            <h2 id="report-form-title" className="text-lg font-semibold text-ink">Report an incident</h2>
            <p className="mt-1 text-sm text-ink-3">Describe what you noticed. Severity and investigation are handled by the security team.</p>

            <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-ink-2">
                    Title
                    <input value={form.title} onChange={set("title")} maxLength={LIMITS.title} placeholder="e.g. Unrecognised login alert" aria-invalid={!!errors.title} className={field} />
                    <span className="mt-1 flex justify-between text-xs">
                        <span className="text-bad-ink">{errors.title}</span>
                        <span className="text-ink-3">{form.title.length}/{LIMITS.title}</span>
                    </span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Description
                    <textarea value={form.description} onChange={set("description")} maxLength={LIMITS.description} rows={5} placeholder="What happened, what you saw, and any systems or data involved" aria-invalid={!!errors.description} className={`${field} resize-y`} />
                    <span className="mt-1 flex justify-between text-xs">
                        <span className="text-bad-ink">{errors.description}</span>
                        <span className="text-ink-3">{form.description.length}/{LIMITS.description}</span>
                    </span>
                </label>

                <label className="block text-sm font-medium text-ink-2">
                    Incident date and time
                    <input type="datetime-local" value={form.incidentDate} onChange={set("incidentDate")} max={nowLocalInput()} aria-invalid={!!errors.incidentDate} className={field} />
                    <span className="mt-1 block text-xs text-bad-ink">{errors.incidentDate}</span>
                </label>

                <Alert>{apiError}</Alert>
                <Alert tone="success">{success}</Alert>

                <button type="submit" disabled={submitting} className={`${primaryBtn} w-full`}>
                    {submitting ? "Submitting..." : "Submit report"}
                </button>
            </div>
        </form>
    );
}
