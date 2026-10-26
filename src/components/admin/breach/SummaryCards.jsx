import { isFinished, isUnassigned, severityRank } from "../../../utils/breach.js";

function Stat({ value, label, hint, tone, bg, onClick, pressed, hover }) {
    const body = (
        <>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-xl font-bold tabular-nums ${bg} ${tone}`}>{value}</span>
            <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0F172A]">{label}</span>
                <span className="mt-0.5 block text-xs text-[#64748B]">{hint}</span>
            </span>
        </>
    );
    if (!onClick) return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-4">{body}</div>;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={pressed}
            className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${hover} ${pressed ? "border-[#D97706]/50 bg-[#FFFBEB]" : "border-[#E2E8F0] bg-white"}`}
        >
            {body}
        </button>
    );
}

export default function SummaryCards({ incidents, severityFilter, onNeedsSeverity }) {
    const needsSeverity = incidents.filter((i) => !i.severity).length;
    const highOpen = incidents.filter((i) => !isFinished(i.status) && severityRank(i.severity) >= 2).length;
    const unassigned = incidents.filter((i) => !isFinished(i.status) && isUnassigned(i)).length;

    return (
        <section aria-label="Incident summary">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat value={needsSeverity} label="Waiting for a severity" hint="Incidents that need classification" bg="bg-[#FFF7ED]" tone="text-[#B45309]" onClick={onNeedsSeverity} pressed={severityFilter === "Unset"} hover="hover:border-[#D97706]/50 hover:bg-[#FFFBEB]" />
                <Stat value={highOpen} label="High or critical" hint="Incidents still open" bg="bg-[#FEF2F2]" tone={highOpen ? "text-[#DC2626]" : "text-[#0F172A]"} />
                <Stat value={unassigned} label="Unassigned incidents" hint="Open with no owner" bg="bg-[#F1F5F9]" tone="text-[#0F172A]" />
            </div>
        </section>
    );
}
