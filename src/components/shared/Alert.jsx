// Ek line ka sandesh: laal = galti, hara = ho gaya, neela = jaankari.
const TONES = {
    error: { box: "border-bad/25 bg-bad-soft text-ink", dot: "bg-bad", icon: "M12 8v5M12 16.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z", ink: "text-bad-ink" },
    success: { box: "border-ok/25 bg-ok-soft text-ink", dot: "bg-ok", icon: "M5 13l4 4L19 7", ink: "text-ok-ink" },
    info: { box: "border-brand/20 bg-brand-soft text-ink", dot: "bg-brand", icon: "M12 16v-5M12 7.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z", ink: "text-brand-ink" },
};

export default function Alert({ tone = "error", children, action }) {
    if (!children) return null;
    const t = TONES[tone] || TONES.error;
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`pg-alert flex items-start justify-between gap-3 rounded-[12px] border px-4 py-3 text-sm ${t.box}`}>
            <span className="flex min-w-0 items-start gap-2.5">
                <svg viewBox="0 0 24 24" className={`mt-0.5 h-4 w-4 shrink-0 ${t.ink}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={t.icon} />
                </svg>
                <span className="min-w-0 break-words">{children}</span>
            </span>
            {action}
        </div>
    );
}
