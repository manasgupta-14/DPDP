import Icon from "../shared/Icon.jsx";

// Roadmap-style stepper: "01 · 02 · 03" chips, glowing active step, dotted connectors.
export default function Stepper({ steps, current, maxReached, onSelect }) {
    return (
        <ol className="flex items-center gap-2 overflow-x-auto pb-1" aria-label="DPIA steps">
            {steps.map((label, i) => {
                const done = i < current;
                const active = i === current;
                const reachable = i <= maxReached;
                return (
                    <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
                        <button
                            type="button"
                            disabled={!reachable}
                            onClick={() => onSelect(i)}
                            className={`group flex min-w-0 items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed ${
                                active
                                    ? "border-[#0F766E]/40 bg-gradient-to-r from-[#CCFBF1] to-[#ECFEFF] shadow-[0_8px_20px_-10px_rgba(15,118,110,0.6)]"
                                    : done
                                        ? "border-[#0F766E]/20 bg-white hover:border-[#0F766E]/40"
                                        : "border-transparent hover:border-[#E2E8F0]"
                            }`}
                        >
                            <span
                                className={`grid h-8 w-9 shrink-0 place-items-center rounded-lg font-mono text-[13px] font-bold tabular-nums transition-all duration-300 ${
                                    active
                                        ? "bg-gradient-to-br from-[#14857B] to-[#0F766E] text-white shadow-[0_0_0_3px_rgba(34,211,238,0.25),0_6px_14px_-4px_rgba(15,118,110,0.7)]"
                                        : done
                                            ? "bg-[#CCFBF1] text-[#0F766E] ring-1 ring-[#0F766E]/25"
                                            : "bg-[#F1F5F9] text-[#64748B] ring-1 ring-[#E2E8F0]"
                                }`}
                            >
                                {done ? <Icon name="check" className="h-4 w-4" /> : String(i + 1).padStart(2, "0")}
                            </span>
                            <span className={`hidden truncate text-sm font-semibold sm:block ${active ? "text-[#0F172A]" : done ? "text-[#0F766E]" : "text-[#64748B]"}`}>{label}</span>
                        </button>
                        {i < steps.length - 1 && (
                            <span
                                aria-hidden="true"
                                className={`h-[2px] min-w-4 flex-1 rounded-full ${done ? "bg-gradient-to-r from-[#0F766E] to-[#22D3EE]" : "bg-[radial-gradient(circle,#CBD5E1_1px,transparent_1.5px)] bg-[length:8px_2px]"}`}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
