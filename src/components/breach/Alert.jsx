const TONES = {
    error: "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#0F172A]",
    success: "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#0F172A]",
};

export default function Alert({ tone = "error", children, action }) {
    if (!children) return null;
    return (
        <div role={tone === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
            <span className="min-w-0 break-words">{children}</span>
            {action}
        </div>
    );
}
