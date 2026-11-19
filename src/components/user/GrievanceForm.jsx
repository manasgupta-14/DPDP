import { useState } from "react";
import { raiseGrievance } from "../../api/grievance.js";
import { CATEGORIES } from "../../utils/grievance.js";
import Alert from "../shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../shared/ui.js";

const EMPTY = { subject: "", description: "", category: "Other" };

export default function GrievanceForm({ onClose, onSubmitted }) {
    const [form, setForm] = useState(EMPTY);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (form.subject.trim().length < 5) return setError("Enter a subject (at least 5 characters).");
        if (form.description.trim().length < 20) return setError("Describe the problem in at least 20 characters.");
        setBusy(true);
        setError("");
        const res = await raiseGrievance(form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onSubmitted(res.data.ticketId);
    };

    return (
        <form onSubmit={submit} className={`${panel} space-y-4 p-5 sm:p-6`}>
            <div className="pr-8">
                <h2 className="text-lg font-semibold">Raise a grievance</h2>
                <p className="mt-1 text-sm text-ink-3">Tell us how your personal data is being handled badly. The Data Protection team will review it and reply.</p>
            </div>
            <Alert>{error}</Alert>
            <label className="block text-sm font-medium">Category
                <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
            </label>
            <label className="block text-sm font-medium">Subject
                <input className={field} value={form.subject} maxLength={255} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary of the problem" />
            </label>
            <label className="block text-sm font-medium">Details
                <textarea className={field} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened? Which data is involved?" />
            </label>
            <div className="flex justify-end gap-3">
                <button type="button" className={ghostBtn} onClick={onClose} disabled={busy}>Cancel</button>
                <button type="submit" className={primaryBtn} disabled={busy}>{busy ? "Submitting..." : "Submit grievance"}</button>
            </div>
        </form>
    );
}
