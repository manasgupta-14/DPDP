import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getGrievance, replyGrievance } from "../../api/grievance.js";
import Alert from "../../components/shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";
import { grievanceStatusToneLight as grievanceStatusTone } from "../../utils/grievance.js";

const pill = "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

function Meta({ label, children }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium text-ink">{children}</dd>
        </div>
    );
}

export default function MyGrievanceDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [reply, setReply] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const res = await getGrievance(id);
        if (res.ok) {
            setTicket(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        let active = true;
        getGrievance(id).then((res) => {
            if (!active) return;
            if (res.ok) setTicket(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [id]);

    const send = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return setError("Write a message first.");
        setBusy(true);
        setError("");
        const res = await replyGrievance(id, { messageText: reply, isInternal: false });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        setFlash("Your reply was sent.");
        setReply("");
        load();
    };

    if (loading) return <p className="text-sm text-ink-3">Loading grievance...</p>;
    if (!ticket) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Alert>{error || "Grievance not found."}</Alert>
                <Link to="/user/grievance" className={ghostBtn}>Back to grievances</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <Link to="/user/grievance" className="text-sm font-semibold text-brand-ink hover:underline">&larr; Back to grievances</Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="break-words text-[24px] font-bold tracking-tight text-ink">{ticket.subject}</h1>
                    <span className={`${pill} ${grievanceStatusTone(ticket.status)}`}>{ticket.status}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">{ticket.referenceId}</p>
            </div>

            <Alert tone="success">{flash}</Alert>
            <Alert>{error}</Alert>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                    <section className={`${panel} p-5`}>
                        <h2 className="text-base font-semibold">Conversation</h2>
                        {ticket.messages.length === 0 ? (
                            <p className="mt-3 text-sm text-muted">No replies yet. The Data Protection team will respond here.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {ticket.messages.filter((m) => !m.isInternal).map((m, i) => (
                                    <li key={i} className={`rounded-xl border p-3 text-sm ${m.senderType === "User" ? "border-line bg-soft" : "border-brand/30 bg-brand-soft/40"}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                                            <span className="font-semibold text-ink-2">{m.senderType === "User" ? "You" : "Support team"}</span>
                                            <span>{formatDate(m.createdAt)}</span>
                                        </div>
                                        <p className="mt-1.5 whitespace-pre-wrap break-words text-ink">{m.text}</p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={send} className="mt-5 space-y-3 border-t border-line pt-4">
                            <label className="block text-sm font-medium">Your reply
                                <textarea className={field} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your message..." />
                            </label>
                            <div className="flex justify-end">
                                <button type="submit" className={primaryBtn} disabled={busy || !reply.trim()}>{busy ? "Sending..." : "Send reply"}</button>
                            </div>
                        </form>
                    </section>
                </div>

                <aside className={`${panel} h-fit p-5`}>
                    <h2 className="text-base font-semibold">Ticket</h2>
                    <p className="mt-0.5 text-xs text-muted">Your complaint and its current status.</p>
                    <dl className="mt-1 divide-y divide-line">
                        <Meta label="Status"><span className={`${pill} ${grievanceStatusTone(ticket.status)}`}>{ticket.status}</span></Meta>
                        <Meta label="Category">{ticket.category}</Meta>
                        <Meta label="Raised">{formatDate(ticket.createdAt)}</Meta>
                    </dl>
                </aside>
            </div>
        </div>
    );
}
