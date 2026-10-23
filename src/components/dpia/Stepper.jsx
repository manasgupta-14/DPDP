import Icon from "../shared/Icon.jsx";

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
                            className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed"
                        >
                            <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                                    active ? "bg-[#0F766E] text-white" : done ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-[#E2E8F0] text-[#475569]"
                                }`}
                            >
                                {done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                            </span>
                            <span className={`hidden truncate text-sm font-medium sm:block ${active ? "text-[#0F172A]" : "text-[#475569]"}`}>{label}</span>
                        </button>
                        {i < steps.length - 1 && <span aria-hidden="true" className={`h-px flex-1 ${done ? "bg-[#0F766E]" : "bg-[#E2E8F0]"}`} />}
                    </li>
                );
            })}
        </ol>
    );
}
