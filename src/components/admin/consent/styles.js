export const dkPage = "space-y-6";
export const dkInput = "mt-1 h-9 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/30 disabled:cursor-not-allowed disabled:opacity-60";
export const dkCard = "pg-surface rounded-[14px] border border-line bg-surface shadow-[var(--k-shadow-sm)] transition-[box-shadow,border-color] duration-200 hover:border-line-strong";
export const dkBtn = "inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-xs font-semibold text-ink-2 transition-[background-color,border-color,color] duration-150 hover:border-line-strong hover:bg-soft hover:text-ink active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55";
export const dkPrimary = "pg-cta inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-brand px-4 text-xs font-semibold text-white transition-[background-color] duration-150 hover:bg-brand-strong active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55";
export const dkTh = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
export const dkModal = "max-h-[90vh] space-y-4 overflow-y-auto rounded-[16px] border border-line bg-surface p-5 text-ink shadow-[var(--k-shadow-lg)] sm:p-6";
export const dkAlert = "flex items-start justify-between gap-3 rounded-[10px] border border-bad/25 bg-bad-soft px-4 py-3 text-sm text-bad-ink";
export const dkSuccess = "rounded-[10px] border border-ok/25 bg-ok-soft px-4 py-3 text-sm text-ok-ink";

export const STATUS_BADGE = {
    Granted: "bg-ok-soft text-ok-ink ring-ok/25",
    PartiallyGranted: "bg-brand-soft text-brand-ink ring-brand/25",
    Declined: "bg-bad-soft text-bad-ink ring-bad/25",
    Expired: "bg-subtle text-ink-2 ring-line-strong",
    Denied: "bg-bad-soft text-bad-ink ring-bad/25",
    Rejected: "bg-bad-soft text-bad-ink ring-bad/25",
    Unknown: "bg-subtle text-ink-2 ring-line-strong",
    Withdrawn: "bg-warn-soft text-warn-ink ring-warn/25",
};
