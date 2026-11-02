import { DEFAULT_COLOR, isHex } from "../../../utils/noticeTemplate.js";

export default function NoticePreview({ name, description, logoUrl, color, purposes }) {
    const accent = isHex(color) ? color : DEFAULT_COLOR;
    return (
        <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: accent }}>
                {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 rounded-md bg-white object-contain p-0.5" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-white/20 text-xs font-bold">{(name || "N").charAt(0).toUpperCase()}</span>}
                <p className="min-w-0 truncate text-sm font-semibold">{name || "Notice template name"}</p>
            </div>
            <div className="space-y-3 p-4">
                <p className="text-xs leading-relaxed text-[#475569]">{description || "The description you write appears here, above the list of purposes."}</p>
                {purposes.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-[#CBD5E1] px-3 py-3 text-center text-[11px] text-[#64748B]">No purposes selected yet.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {purposes.map((p) => (
                            <li key={p.code} className="flex items-center gap-2 text-xs text-[#0F172A]">
                                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
                                {p.name}
                            </li>
                        ))}
                    </ul>
                )}
                <span className="inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold text-white" style={{ background: accent }}>Continue</span>
            </div>
        </div>
    );
}
