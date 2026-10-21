import { sameText, statusList, statusTone } from "../../utils/breach.js";
import { panel } from "./ui.js";

export default function SummaryCards({ incidents, activeStatus, onSelect }) {
    const statuses = statusList(incidents);
    const cards = [{ label: "All incidents", value: "All", count: incidents.length }].concat(
        statuses.map((s) => ({ label: s, value: s, count: incidents.filter((i) => sameText(i.status, s)).length })),
    );

    return (
        <section aria-label="Incident summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => {
                const active = sameText(activeStatus, c.value);
                return (
                    <button
                        key={c.value}
                        type="button"
                        onClick={() => onSelect(active && c.value !== "All" ? "All" : c.value)}
                        aria-pressed={active}
                        className={`${panel} pg-card p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${active ? "border-[#0F766E] ring-1 ring-[#0F766E]/40" : ""}`}
                    >
                        <p className="text-sm text-[#475569]">{c.label}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight text-[#0F172A]">{c.count}</p>
                        {c.value !== "All" && <span className={`mt-3 inline-block h-1.5 w-10 rounded-full ring-1 ${statusTone(c.value)}`} />}
                    </button>
                );
            })}
        </section>
    );
}
