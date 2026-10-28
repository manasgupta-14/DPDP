import { useState } from "react";
import { raiseGrievance } from "../../api/grievance.js";
import Alert from "../../components/shared/Alert.jsx";
import { field, panel, primaryBtn } from "../../components/shared/ui.js";
import { CATEGORIES } from "../../utils/grievance.js";

export default function RaiseGrievance() {
    const [form, setForm] = useState({ subject: "", description: "", category: "Other" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [ticket, setTicket] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (form.subject.trim().length < 5) return setError("Enter a subject (at least 5 characters).");
        if (form.description.trim().length < 20) return setError("Describe the problem in at least 20 characters.");
        setBusy(true);
        setError("");
        const res = await raiseGrievance(form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        setTicket(res.data.ticketId);
        setForm({ subject: "", description: "", category: "Other" });
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Raise a grievance</h1>
                <p className="mt-1 text-sm text-[#475569]">Tell us how your personal data is being handled badly. The Data Protection team will review it and reply.</p>
            </div>

            {ticket && (
                <Alert tone="success">Your grievance was submitted. Keep this ticket number: <span className="font-mono font-semibold">{ticket}</span></Alert>
            )}

            <form onSubmit={submit} className={`${panel} space-y-4 p-5 sm:p-6`}>
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
                <div className="flex justify-end">
                    <button type="submit" className={primaryBtn} disabled={busy}>{busy ? "Submitting..." : "Submit grievance"}</button>
                </div>
            </form>
        </div>
    );
}
