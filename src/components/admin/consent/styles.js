export const dkPage = "space-y-6";
export const dkInput = "mt-1 h-9 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40 disabled:cursor-not-allowed disabled:opacity-60";
export const dkCard = "pg-surface rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-[#CBD5E1] hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.12)]";
export const dkBtn = "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#334155] transition-all duration-200 hover:-translate-y-px hover:border-[#0F766E] hover:text-[#0F766E] hover:shadow-[0_6px_16px_-6px_rgba(15,118,110,0.28)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-60";
export const dkPrimary = "pg-cta inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] bg-[linear-gradient(135deg,#14857B_0%,#0F766E_45%,#115E59_100%)] px-4 text-xs font-semibold text-white ring-1 ring-inset ring-white/15 shadow-[0_4px_12px_-2px_rgba(15,118,110,0.35)] transition-all duration-200 hover:-translate-y-px hover:bg-[#115E59] hover:shadow-[0_10px_22px_-4px_rgba(15,118,110,0.45)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-60";
export const dkTh = "px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569]";
export const dkModal = "max-h-[90vh] space-y-4 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 text-[#0F172A] shadow-xl sm:p-6";
export const dkAlert = "flex items-start justify-between gap-3 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 px-4 py-3 text-xs text-[#B91C1C]";
export const dkSuccess = "rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 text-xs text-[#15803D]";

export const STATUS_BADGE = {
    Granted: "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25",
    PartiallyGranted: "bg-[#0E7490]/10 text-[#0E7490] ring-[#0E7490]/25",
    Declined: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    Expired: "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]",
    Denied: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    Rejected: "bg-[#DC2626]/10 text-[#B91C1C] ring-[#DC2626]/25",
    Unknown: "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]",
    Withdrawn: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
};
