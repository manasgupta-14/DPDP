import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assignGrievance, escalateGrievance, replyGrievance, resolveGrievance } from "../../api/grievance.js";
import { usePermissions } from "../../auth/usePermissions.js";
import ChatThread, { LiveBadge } from "../../components/grievance/ChatThread.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import useLiveGrievance from "../../hooks/useLiveGrievance.js";
import { formatDate, severityTone } from "../../utils/breach.js";
import { ESC_SEVERITIES, PERM, buildTimeline, grievanceStatusToneLight, isClosedStatus } from "../../utils/grievance.js";

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[110px_1fr] gap-3 py-1.5 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0 break-words font-medium text-ink">{children}</dd>
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
            <h2 className="pr-8 text-lg font-semibold text-ink">Escalate to data breach</h2>
            <p className="text-sm text-ink-3">This creates a breach incident from {ticket.referenceId}. Use it only when the complaint points to a real data breach.</p>
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
    const { ticket, loading, loadError, offline, reload } = useLiveGrievance(id);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [reply, setReply] = useState("");
    const [internal, setInternal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [escalating, setEscalating] = useState(false);
    const [pending, setPending] = useState([]);

    const timeline = useMemo(() => (ticket ? buildTimeline(ticket) : []), [ticket]);
    const canManage = can(PERM.manage);
    const canEscalate = can(PERM.escalate);

    const act = async (fn, okMessage) => {
        setBusy(true); setError(""); setFlash("");
        const res = await fn();
        if (!res.ok) { setBusy(false); setError(res.error); return res; }
        setFlash(okMessage);
        await reload();
        setBusy(false);
        return res;
    };

    const send = async (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (!text || busy) return;
        const wasInternal = internal;
        setPending([{ tempId: `tmp-${Date.now()}`, text, senderType: "Staff", isInternal: wasInternal, createdAt: new Date().toISOString() }]);
        setReply(""); setInternal(false);
        const res = await act(() => replyGrievance(id, { messageText: text, isInternal: wasInternal }), wasInternal ? "Internal note added." : "Reply sent.");
        setPending([]);
        if (!res.ok) { setReply(text); setInternal(wasInternal); }
    };

    if (loading) return <p className="text-sm text-ink-3">Loading grievance...</p>;
    if (!ticket) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Alert>{error || loadError || "Grievance not found."}</Alert>
                <Link to="/dashboard/grievances" className={ghostBtn}>Back to grievances</Link>
            </div>
        );
    }

    const isOpen = ticket.status === "Open";
    const isInProgress = ticket.status === "In Progress";
    const closed = isClosedStatus(ticket.status);
    const escalated = ticket.status === "Escalated to Breach";

    return (
        <div className="space-y-5" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 translate="no" className="break-words text-[24px] font-bold tracking-tight text-ink">{ticket.subject}</h1>
                        <span className={`${pill} ${grievanceStatusToneLight(ticket.status)}`}>{ticket.status}</span>
                    </div>
                    <Link to="/dashboard/grievances" className="mt-1 inline-block text-sm font-semibold text-brand-ink hover:underline">&larr; Back to grievances &middot; <span className="font-mono text-xs">{ticket.referenceId}</span></Link>
                </div>
                {canManage && !closed && (
                    <button
                        type="button"
                        className={primaryBtn}
                        disabled={busy || !isInProgress}
                        title={isOpen ? "Assign the ticket to yourself first, then resolve it." : undefined}
                        onClick={() => act(() => resolveGrievance(id), "Grievance marked as Resolved.")}
                    >
                        {busy ? "Please wait..." : "Resolve"}
                    </button>
                )}
            </div>

            <Alert tone="success">{flash}</Alert>
            <Alert>{error}</Alert>

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
                <div className="space-y-5">
                    <section className={`${panel} p-5`}>
                        <h2 className="text-base font-semibold text-ink">Complaint</h2>
                        <p className="mt-0.5 text-xs text-muted">What the person reported, in their own words.</p>
                        <dl className="mt-3 divide-y divide-line">
                            <Row label="Reference"><span className="font-mono text-xs">{ticket.referenceId}</span></Row>
                            <Row label="Category">{ticket.category}</Row>
                            <Row label="Severity"><span className={`${pill} ${severityTone(ticket.severity)}`}>{ticket.severity || "-"}</span></Row>
                            <Row label="Status"><span className={`${pill} ${grievanceStatusToneLight(ticket.status)}`}>{ticket.status}</span></Row>
                            <Row label="Raised by"><span className="font-mono text-xs">{ticket.raisedBy || "-"}</span></Row>
                            <Row label="Raised">{formatDate(ticket.createdAt)}</Row>
                        </dl>
                    </section>

                    <section className={`${panel} p-5`}>
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base font-semibold text-ink">Conversation</h2>
                            <LiveBadge offline={offline} />
                        </div>
                        {canManage && <p className="text-xs text-muted">Messages marked internal are never shown to the Data Principal.</p>}
                        <ChatThread perspective="staff" messages={ticket.messages} pending={pending} raisedBy={ticket.raisedBy} emptyText="No messages yet." />

                        <form onSubmit={send} className="mt-5 space-y-3 border-t border-line pt-4">
                            <label className="block text-sm font-medium">{canManage ? "Reply to the Data Principal" : "Your reply"}
                                <textarea className={field} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e); }} placeholder="Write your message... (Ctrl+Enter to send)" />
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {canManage ? (
                                    <label className="flex items-center gap-2 text-sm text-ink-2">
                                        <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-4 w-4 accent-brand" />
                                        Internal note (not sent to the complainant)
                                    </label>
                                ) : <span />}
                                <button type="submit" className={primaryBtn} disabled={busy || !reply.trim()}>{busy ? "Sending..." : internal ? "Add note" : "Send reply"}</button>
                            </div>
                        </form>
                    </section>
                </div>

                <aside className="space-y-5">
                    {canManage && (
                        <section className={`${panel} p-5`}>
                            <h2 className="text-base font-semibold text-ink">Case handling</h2>
                            <p className="mt-1 text-xs text-muted">Current status: <span className="font-semibold text-ink">{ticket.status}</span></p>
                            <div className="mt-4 flex flex-col gap-2.5">
                                {isOpen && <button type="button" className={primaryBtn} disabled={busy} onClick={() => act(() => assignGrievance(id), "Ticket assigned to you and moved to In Progress.")}>Assign to me</button>}
                                {canEscalate && !escalated && <button type="button" className={ghostBtn} disabled={busy} onClick={() => setEscalating(true)}>Escalate to breach</button>}
                                {closed && !canEscalate && <p className="text-xs text-muted">No further action is needed on this ticket.</p>}
                            </div>
                        </section>
                    )}

                    <section className={`${panel} p-5`}>
                        <h2 className="text-base font-semibold text-ink">Timeline</h2>
                        <p className="text-xs text-muted">Every action taken on this grievance.</p>
                        <ol className="mt-4 space-y-4">
                            {timeline.map((ev, ki) => (
                                <li key={`${ev.key}-${ki}`} className="flex gap-3">
                                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ev.color }} />
                                    <div>
                                        <p className="text-sm font-semibold text-ink">{ev.label}</p>
                                        <p className="text-xs text-muted">{formatDate(ev.time)}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                </aside>
            </div>

            {escalating && (
                <Modal title="Escalate to breach" onClose={() => setEscalating(false)}>
                    <EscalateDialog ticket={ticket} onClose={() => setEscalating(false)} onDone={(m) => { setFlash(m); reload(); }} />
                </Modal>
            )}
        </div>
    );
}
