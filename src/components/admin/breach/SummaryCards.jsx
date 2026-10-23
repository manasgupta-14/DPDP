import { isFinished, isUnassigned, sameText, severityRank, statusColor, statusList } from "../../../utils/breach.js";
import { panel } from "../../shared/ui.js";

function StatusRow({ active, onClick, color, label, count, total }) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`group grid w-full grid-cols-[96px_minmax(0,1fr)_72px] items-center gap-3 rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${active ? "bg-[#F0FDFA] ring-1 ring-[#0F766E]" : "hover:bg-[#F8FAFC]"}`}
        >
            <span className="flex items-center gap-2 text-sm font-medium text-[#334155]">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
            </span>
            <span className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
                <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
            </span>
            <span className="text-right text-sm tabular-nums text-[#0F172A]"><span className="font-semibold">{count}</span> <span className="text-xs text-[#64748B]">({pct}%)</span></span>
        </button>
    );
}

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

export default function SummaryCards({ incidents, activeStatus, severityFilter, onStatus, onNeedsSeverity }) {
    const total = incidents.length;
    const statuses = statusList(incidents).map((s) => ({ name: s, count: incidents.filter((i) => sameText(i.status, s)).length }));

    const needsSeverity = incidents.filter((i) => !i.severity).length;
    const highOpen = incidents.filter((i) => !isFinished(i.status) && severityRank(i.severity) >= 2).length;
    const unassigned = incidents.filter((i) => !isFinished(i.status) && isUnassigned(i)).length;

    return (
        <section aria-label="Incident summary" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat value={needsSeverity} label="Waiting for a severity" hint="Incidents that need classification" bg="bg-[#FFF7ED]" tone="text-[#B45309]" onClick={onNeedsSeverity} pressed={severityFilter === "Unset"} hover="hover:border-[#D97706]/50 hover:bg-[#FFFBEB]" />
                <Stat value={highOpen} label="High or critical" hint="Incidents still open" bg="bg-[#FEF2F2]" tone={highOpen ? "text-[#DC2626]" : "text-[#0F172A]"} />
                <Stat value={unassigned} label="Unassigned incidents" hint="Open with no owner" bg="bg-[#F1F5F9]" tone="text-[#0F172A]" />
            </div>

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

                <div className="mt-3 space-y-1">
                    <StatusRow active={sameText(activeStatus, "All")} onClick={() => onStatus("All")} color="#334155" label="All" count={total} total={total} />
                    {statuses.map((s) => {
                        const active = sameText(activeStatus, s.name);
                        return <StatusRow key={s.name} active={active} onClick={() => onStatus(active ? "All" : s.name)} color={statusColor(s.name)} label={s.name} count={s.count} total={total} />;
                    })}
                </div>
            </div>
        </section>
    );
}
