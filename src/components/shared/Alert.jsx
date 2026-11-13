const TONES = {
    error: "border-[#DC2626]/30 bg-[#DC2626]/10 bg-[linear-gradient(100deg,rgba(220,38,38,0.12),rgba(244,63,94,0.06)_60%,rgba(255,255,255,0.6))] text-[#0F172A] border-l-4 border-l-[#DC2626]",
    success: "border-[#16A34A]/30 bg-[#16A34A]/10 bg-[linear-gradient(100deg,rgba(22,163,74,0.13),rgba(20,184,166,0.07)_60%,rgba(255,255,255,0.6))] text-[#0F172A] border-l-4 border-l-[#16A34A]",
    info: "border-[#22D3EE]/50 bg-[#22D3EE]/10 bg-[linear-gradient(100deg,rgba(34,211,238,0.14),rgba(99,102,241,0.06)_60%,rgba(255,255,255,0.6))] text-[#0F172A] border-l-4 border-l-[#0E7490]",
};

export default function Alert({ tone = "error", children, action }) {
    if (!children) return null;
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`pg-alert flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
            <span className="min-w-0 break-words">{children}</span>
            {action}
        </div>
    );
}
