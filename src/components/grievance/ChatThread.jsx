import { useEffect, useRef, useState } from "react";
import { formatDate } from "../../utils/breach.js";

const NEAR_BOTTOM_PX = 80;

// "Live" dot: green = auto-update chal raha hai, amber = server se connection toota hua.
export function LiveBadge({ offline }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-ink-3"
            title={offline ? "Connection problem. Retrying automatically." : "New messages appear automatically."}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${offline ? "bg-warn" : "animate-pulse bg-ok"}`} />
            {offline ? "Reconnecting..." : "Live"}
        </span>
    );
}

/**
 * Chat jaisa conversation view.
 *  perspective = "user"  -> Data Principal ka apna view ("You" = User messages)
 *  perspective = "staff" -> Support/DPO ka view ("You" = staff messages)
 *  pending = abhi bheje ja rahe (optimistic) messages
 */
export default function ChatThread({ messages, pending = [], perspective, raisedBy = "", emptyText = "No messages yet." }) {
    const listRef = useRef(null);
    const nearBottomRef = useRef(true);
    const totalRef = useRef(0);
    const [initialCount] = useState(messages.length);
    const [atBottom, setAtBottom] = useState(true);
    const [anchor, setAnchor] = useState(messages.length);

    const all = [...messages, ...pending.map((p) => ({ ...p, pending: true }))];
    const total = all.length;

    // Naya message aaya: agar user neeche hi tha (ya khud bheja) to neeche scroll, warna "new messages" pill.
    useEffect(() => {
        totalRef.current = total;
        const el = listRef.current;
        if (!el) return;
        if (nearBottomRef.current || pending.length > 0) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    }, [total, pending.length]);

    const onScroll = () => {
        const el = listRef.current;
        if (!el) return;
        const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
        if (near !== nearBottomRef.current || near) setAnchor(totalRef.current);
        nearBottomRef.current = near;
        setAtBottom(near);
    };

    const jumpToLatest = () => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    const unseen = atBottom ? 0 : Math.max(0, total - anchor);

    if (total === 0) return <p className="mt-4 text-sm text-ink-3">{emptyText}</p>;

    return (
        <div className="relative mt-4">
            <ul ref={listRef} onScroll={onScroll} aria-live="polite" className="max-h-[55vh] space-y-3 overflow-y-auto scroll-smooth pr-1">
                {all.map((m, i) => {
                    const fromUser = m.senderType === "User";
                    const mine = perspective === "user" ? fromUser : !fromUser;
                    const tone = m.isInternal
                        ? "border-warn/40 bg-warn/10"
                        : mine
                            ? "border-brand/30 bg-brand-soft/40"
                            : "border-line bg-soft";
                    const who = fromUser
                        ? perspective === "user" ? "You" : raisedBy ? `Data Principal (${raisedBy})` : "Data Principal"
                        : perspective === "staff" ? "You" : "Support team";
                    const isNew = i >= initialCount && !m.pending;
                    return (
                        <li
                            key={m.tempId ?? `${m.createdAt ?? "x"}-${i}`}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                            style={isNew ? { animation: "pg-rise .35s ease-out both" } : undefined}
                        >
                            <div className={`max-w-[88%] rounded-2xl border p-3 text-sm sm:max-w-[80%] ${tone} ${m.pending ? "opacity-60" : ""}`}>
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted">
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold text-ink-2">{who}</span>
                                        {m.isInternal && <span className="rounded bg-warn/20 px-1.5 py-0.5 text-[10px] font-semibold text-ink">Internal note</span>}
                                    </span>
                                    <span>{m.pending ? "Sending..." : formatDate(m.createdAt)}</span>
                                </div>
                                <p className="mt-1.5 whitespace-pre-wrap break-words text-ink">{m.text}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
            {unseen > 0 && (
                <button
                    type="button"
                    onClick={jumpToLatest}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
                >
                    {unseen} new {unseen === 1 ? "message" : "messages"} &darr;
                </button>
            )}
        </div>
    );
}
