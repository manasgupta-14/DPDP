import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { replyGrievance } from "../../api/grievance.js";
import ChatThread, { LiveBadge } from "../../components/grievance/ChatThread.jsx";
import Alert from "../../components/shared/Alert.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import useLiveGrievance from "../../hooks/useLiveGrievance.js";
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
    const { ticket, loading, loadError, offline, reload } = useLiveGrievance(id);
    const [error, setError] = useState("");
    const [flash, setFlash] = useState("");
    const [reply, setReply] = useState("");
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState([]);

    const send = async (e) => {
        e.preventDefault();
        const text = reply.trim();
        if (!text || busy) return;
        setBusy(true);
        setError("");
        setFlash("");
        setPending([{ tempId: `tmp-${Date.now()}`, text, senderType: "User", isInternal: false, createdAt: new Date().toISOString() }]);
        setReply("");
        const res = await replyGrievance(id, { messageText: text, isInternal: false });
        if (!res.ok) {
            setPending([]);
            setReply(text);
            setBusy(false);
            return setError(res.error);
        }
        await reload();
        setPending([]);
        setBusy(false);
    };

    if (loading) return <p className="text-sm text-ink-3">Loading grievance...</p>;
    if (!ticket) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Alert>{loadError || "Grievance not found."}</Alert>
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
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base font-semibold">Conversation</h2>
                            <LiveBadge offline={offline} />
                        </div>
                        <ChatThread
                            perspective="user"
                            messages={ticket.messages.filter((m) => !m.isInternal)}
                            pending={pending}
                            emptyText="No replies yet. The Data Protection team will respond here."
                        />

                        <form onSubmit={send} className="mt-5 space-y-3 border-t border-line pt-4">
                            <label className="block text-sm font-medium">Your reply
                                <textarea className={field} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(e); }} placeholder="Write your message... (Ctrl+Enter to send)" />
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
