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
                            className={`group flex min-w-0 items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed ${
                                active
                                    ? "border-brand/40 bg-gradient-to-r from-brand-soft to-brand-soft shadow-[0_8px_20px_-10px_rgba(43,89,195,0.6)]"
                                    : done
                                        ? "border-brand/20 bg-surface hover:border-brand/40"
                                        : "border-transparent hover:border-line"
                            }`}
                        >
                            <span
                                className={`grid h-8 w-9 shrink-0 place-items-center rounded-lg font-mono text-[13px] font-bold tabular-nums transition-all duration-300 ${
                                    active
                                        ? "bg-gradient-to-br from-brand-strong to-brand text-white shadow-[0_0_0_3px_rgba(91,141,239,0.25),0_6px_14px_-4px_rgba(43,89,195,0.7)]"
                                        : done
                                            ? "bg-brand-soft text-brand-ink ring-1 ring-brand/25"
                                            : "bg-subtle text-muted ring-1 ring-line"
                                }`}
                            >
                                {done ? <Icon name="check" className="h-4 w-4" /> : String(i + 1).padStart(2, "0")}
                            </span>
                            <span className={`hidden truncate text-sm font-semibold sm:block ${active ? "text-ink" : done ? "text-brand-ink" : "text-muted"}`}>{label}</span>
                        </button>
                        {i < steps.length - 1 && (
                            <span
                                aria-hidden="true"
                                className={`h-[2px] min-w-4 flex-1 rounded-full ${done ? "bg-gradient-to-r from-brand to-brand" : "bg-[radial-gradient(circle,var(--k-line-strong)_1px,transparent_1.5px)] bg-[length:8px_2px]"}`}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
