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
            <dt className="text-[#64748B]">{label}</dt>
            <dd className="text-right font-medium text-[#0F172A]">{children}</dd>
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

    if (loading) return <p className="text-sm text-[#475569]">Loading grievance...</p>;
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
                <Link to="/user/grievance" className="text-sm font-semibold text-[#0F766E] hover:underline">&larr; Back to grievances</Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="break-words text-2xl font-bold tracking-tight">{ticket.subject}</h1>
                    <span className={`${pill} ${grievanceStatusTone(ticket.status)}`}>{ticket.status}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-[#64748B]">{ticket.referenceId}</p>
            </div>

            <Alert tone="success">{flash}</Alert>
            <Alert>{error}</Alert>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                    <section className={`${panel} p-5`}>
                        <h2 className="text-base font-semibold">Conversation</h2>
                        {ticket.messages.length === 0 ? (
                            <p className="mt-3 text-sm text-[#64748B]">No replies yet. The Data Protection team will respond here.</p>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {ticket.messages.filter((m) => !m.isInternal).map((m, i) => (
                                    <li key={i} className={`rounded-xl border p-3 text-sm ${m.senderType === "User" ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-[#0F766E]/30 bg-[#CCFBF1]/40"}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                                            <span className="font-semibold text-[#334155]">{m.senderType === "User" ? "You" : "Support team"}</span>
                                            <span>{formatDate(m.createdAt)}</span>
                                        </div>
                                        <p className="mt-1.5 whitespace-pre-wrap break-words text-[#0F172A]">{m.text}</p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={send} className="mt-5 space-y-3 border-t border-[#E2E8F0] pt-4">
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
                    <dl className="mt-1 divide-y divide-[#E2E8F0]">
                        <Meta label="Status"><span className={`${pill} ${grievanceStatusTone(ticket.status)}`}>{ticket.status}</span></Meta>
                        <Meta label="Category">{ticket.category}</Meta>
                        <Meta label="Raised">{formatDate(ticket.createdAt)}</Meta>
                    </dl>
                </aside>
            </div>
        </div>
    );
}
