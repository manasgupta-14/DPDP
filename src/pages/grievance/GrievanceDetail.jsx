import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assignGrievance, escalateGrievance, getGrievance, replyGrievance } from "../../api/grievance.js";
import { usePermissions } from "../../auth/usePermissions.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { ESC_SEVERITIES, PERM, grievanceStatusTone, severityTone } from "../../utils/grievance.js";

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

function Meta({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
            <dt className="text-[#64748B]">{label}</dt>
            <dd className="text-right font-medium text-[#0F172A]">{children}</dd>
        </div>
    );
}

function EscalateDialog({ ticket, onClose, onDone }) {
    const [form, setForm] = useState({ title: `Breach from ${ticket.referenceId}: ${ticket.subject}`.slice(0, 200), breachDescription: "", severity: "High" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        if (form.title.trim().length < 3) return setError("Enter a breach title.");
        if (form.breachDescription.trim().length < 10) return setError("Describe the breach in at least 10 characters.");
        setBusy(true);
        setError("");
        const res = await escalateGrievance(ticket.id, form);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDone("Grievance escalated to a data breach incident.");
        onClose();
    };

    return (
        <form onSubmit={submit} className={`${panel} space-y-4 p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Escalate to data breach</h2>
            <p className="text-sm text-[#475569]">This creates a breach incident from {ticket.referenceId}. Use it only when the complaint points to a real data breach.</p>
            <Alert>{error}</Alert>
            <label className="block text-sm font-medium">Breach title
                <input className={field} value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block text-sm font-medium">Severity
                <select className={field} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {ESC_SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
            </label>
            <label className="block text-sm font-medium">What happened
                <textarea className={field} rows={4} value={form.breachDescription} onChange={(e) => setForm({ ...form, breachDescription: e.target.value })} />
            </label>
            <div className="flex justify-end gap-3">
                <button type="button" className={ghostBtn} onClick={onClose} disabled={busy}>Cancel</button>
                <button type="submit" className={primaryBtn} disabled={busy}>{busy ? "Escalating..." : "Escalate"}</button>
            </div>
        </form>
    );
}

export default function GrievanceDetail() {
    const { id } = useParams();
    const { can } = usePermissions();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [reply, setReply] = useState("");
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [escalating, setEscalating] = useState(false);

    const load = useCallback(async () => {
        const res = await getGrievance(id);
        if (res.ok) { setTicket(res.data); setError(""); } else setError(res.error);
        setLoading(false);
    }, [id]);

    useEffect(() => {
        let active = true;
        getGrievance(id).then((res) => {
            if (!active) return;
            if (res.ok) setTicket(res.data); else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, [id]);

    const canManage = can(PERM.manage);
    const canEscalate = can(PERM.escalate);

    const take = async () => {
        setBusy(true); setError("");
        const res = await assignGrievance(id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        setFlash("Ticket assigned to you and moved to In Progress.");
        load();
    };

    const send = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return setError("Write a message first.");
        setBusy(true); setError("");
        const res = await replyGrievance(id, { messageText: reply, isInternal: internal });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        setFlash(internal ? "Internal note added." : "Reply sent.");
        setReply(""); setInternal(false);
        load();
    };

    if (loading) return <p className="text-sm text-[#475569]">Loading grievance...</p>;
    if (!ticket) {
        return (
            <div className="space-y-4">
                <Alert>{error || "Grievance not found."}</Alert>
                <Link to="/dashboard/grievances" className={ghostBtn}>Back to grievances</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <Link to="/dashboard/grievances" className="text-sm font-semibold text-[#0F766E] hover:underline">&larr; Back to grievances</Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
                    <span className={`${pill} ${grievanceStatusTone(ticket.status)}`}>{ticket.status}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-[#64748B]">{ticket.referenceId}</p>
            </div>

            <Alert tone="success">{flash}</Alert>
            <Alert>{error}</Alert>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                    {canManage && (
                        <section className={`${panel} space-y-3 p-5`}>
                            <h2 className="text-base font-semibold">Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                {ticket.status === "Open" && (
                                    <button type="button" className={primaryBtn} onClick={take} disabled={busy}>Assign to me</button>
                                )}
                                {canEscalate && (
                                    <button type="button" className={ghostBtn} onClick={() => setEscalating(true)} disabled={busy}>Escalate to breach</button>
                                )}
                                {ticket.status !== "Open" && !canEscalate && <p className="text-sm text-[#64748B]">This ticket is already in progress.</p>}
                            </div>
                        </section>
                    )}

                    <section className={`${panel} p-5`}>
                        <h2 className="text-base font-semibold">Conversation</h2>
                        {ticket.messages.length === 0 ? (
                            <p className="mt-3 text-sm text-[#64748B]">No messages yet.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {ticket.messages.map((m, i) => (
                                    <li key={i} className={`rounded-xl border p-3 text-sm ${m.isInternal ? "border-[#D97706]/40 bg-[#D97706]/10" : m.senderType === "User" ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-[#0F766E]/30 bg-[#CCFBF1]/40"}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                                            <span className="font-semibold text-[#334155]">{m.isInternal ? "Internal note" : m.senderType === "User" ? "Data principal" : "Support team"}</span>
                                            <span>{formatDate(m.createdAt)}</span>
                                        </div>
                                        <p className="mt-1.5 whitespace-pre-wrap break-words text-[#0F172A]">{m.text}</p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={send} className="mt-5 space-y-3 border-t border-[#E2E8F0] pt-4">
                            <label className="block text-sm font-medium">{canManage ? "Reply or add a note" : "Your reply"}
                                <textarea className={field} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your message..." />
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {canManage ? (
                                    <label className="flex items-center gap-2 text-sm text-[#334155]">
                                        <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-4 w-4 accent-[#0F766E]" />
                                        Internal note (not visible to the data principal)
                                    </label>
                                ) : <span />}
                                <button type="submit" className={primaryBtn} disabled={busy || !reply.trim()}>{busy ? "Sending..." : internal ? "Add note" : "Send reply"}</button>
                            </div>
                        </form>
                    </section>
                </div>

                <aside className={`${panel} h-fit p-5`}>
                    <h2 className="text-base font-semibold">Ticket</h2>
                    <dl className="mt-1 divide-y divide-[#E2E8F0]">
                        <Meta label="Category">{ticket.category}</Meta>
                        <Meta label="Severity"><span className={`${pill} ${severityTone(ticket.severity)}`}>{ticket.severity}</span></Meta>
                        <Meta label="Raised by"><span className="font-mono text-xs">{ticket.raisedBy}</span></Meta>
                        <Meta label="Raised">{formatDate(ticket.createdAt)}</Meta>
                    </dl>
                </aside>
            </div>

            {escalating && (
                <Modal title="Escalate to breach" onClose={() => setEscalating(false)}>
                    <EscalateDialog ticket={ticket} onClose={() => setEscalating(false)} onDone={(m) => { setFlash(m); load(); }} />
                </Modal>
            )}
        </div>
    );
}
