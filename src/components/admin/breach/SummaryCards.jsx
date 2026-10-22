import { isFinished, isUnassigned, sameText, severityRank, statusColor, statusList } from "../../../utils/breach.js";
import { panel } from "../../shared/ui.js";

function Chip({ active, onClick, color, label, count }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                active ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F172A]" : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#0F766E]/50"
            }`}
        >
            {color && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />}
            {label}
            <span className="font-semibold tabular-nums">{count}</span>
        </button>
    );
}

export default function SummaryCards({ incidents, activeStatus, severityFilter, onStatus, onNeedsSeverity }) {
    const total = incidents.length;
    const statuses = statusList(incidents).map((s) => ({ name: s, count: incidents.filter((i) => sameText(i.status, s)).length }));

    const needsSeverity = incidents.filter((i) => !i.severity).length;
    const highOpen = incidents.filter((i) => !isFinished(i.status) && severityRank(i.severity) >= 2).length;
    const unassigned = incidents.filter((i) => !isFinished(i.status) && isUnassigned(i)).length;
    const filteringUnset = severityFilter === "Unset";

    return (
        <section aria-label="Incident summary" className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div className={`${panel} p-5`}>
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-semibold text-[#0F172A]">Where incidents stand</h2>
                    <span className="text-sm text-[#475569]">{total} reported</span>
                </div>

                <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]" role="img" aria-label={statuses.map((s) => `${s.count} ${s.name}`).join(", ")}>
                    {statuses.filter((s) => s.count > 0).map((s) => (
                        <span key={s.name} style={{ width: `${(s.count / total) * 100}%`, background: statusColor(s.name) }} />
                    ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <Chip active={sameText(activeStatus, "All")} onClick={() => onStatus("All")} label="All" count={total} />
                    {statuses.map((s) => {
                        const active = sameText(activeStatus, s.name);
                        return <Chip key={s.name} active={active} onClick={() => onStatus(active ? "All" : s.name)} color={statusColor(s.name)} label={s.name} count={s.count} />;
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <button
                    type="button"
                    onClick={onNeedsSeverity}
                    aria-pressed={filteringUnset}
                    className={`group flex min-w-0 items-center gap-3 rounded-xl border px-4 py-4 text-left transition hover:border-[#D97706]/50 hover:bg-[#FFFBEB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${filteringUnset ? "border-[#D97706]/50 bg-[#FFFBEB]" : "border-[#E2E8F0] bg-white"}`}
                >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#FFF7ED] text-xl font-bold tabular-nums text-[#B45309]`}>{needsSeverity}</span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A]">Waiting for a severity</span>
                        <span className="mt-0.5 block text-xs text-[#64748B]">Incidents that need classification</span>
                    </span>
                </button>
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-4">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#FEF2F2] text-xl font-bold tabular-nums ${highOpen ? "text-[#DC2626]" : "text-[#0F172A]"}`}>{highOpen}</span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A]">High or critical</span>
                        <span className="mt-0.5 block text-xs text-[#64748B]">Incidents still open</span>
                    </span>
                </div>
                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] text-xl font-bold tabular-nums text-[#0F172A]">{unassigned}</span>
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A]">Unassigned incidents</span>
                        <span className="mt-0.5 block text-xs text-[#64748B]">Open with no owner</span>
                    </span>
                </div>
            </div>
        </section>
    );
}
