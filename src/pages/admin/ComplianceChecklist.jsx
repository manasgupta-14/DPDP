import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getComplianceChecklist } from "../../api/checklist.js";
import { C, CountUp, Ring } from "../../components/charts/kit.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";


const rise = (i) => ({ animation: `pg-rise .55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` });

const TONE = {
    ok: { pill: "bg-ok-soft text-ok-ink ring-ok/25", icon: "check", tile: "var(--k-ok)" },
    warn: { pill: "bg-warn-soft text-warn-ink ring-warn/30", icon: "alert", tile: "var(--k-warn)" },
    muted: { pill: "bg-subtle text-muted ring-line", icon: "info", tile: "var(--k-faint)" },
};

const ORDER = { attention: 0, complete: 1, untracked: 2, other: 3 };

const FILTERS = [
    { key: "all", label: "All" },
    { key: "attention", label: "Needs attention" },
    { key: "complete", label: "Complete" },
    { key: "untracked", label: "Tracked outside Kavach" },
];

function Summary({ value, label, sub, tone, icon, i }) {
    return (
        <div className={`kd-card kd-kpi kd-kpi-${tone} p-5`} style={{ ...rise(i), "--kv-tint": TONE[tone]?.tile || "var(--k-c1)" }}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-ink-2">{label}</p>
                <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: TONE[tone]?.tile, background: `color-mix(in srgb, ${TONE[tone]?.tile} 14%, transparent)` }}>
                    <Icon name={icon} className="h-4 w-4" />
                </span>
            </div>
            <p className={`kd-big kd-num kd-num-${tone === "muted" ? "muted" : tone} mt-2 text-[32px]`}>
                <CountUp value={value} />
            </p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
        </div>
    );
}

function Item({ item }) {
    const t = TONE[item.status.tone] || TONE.muted;
    return (
        <li className="kd-tile-tint flex h-full flex-col rounded-xl border p-4" style={{ "--kv-tint": t.tile }}>
            <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: t.tile, background: `color-mix(in srgb, ${t.tile} 15%, transparent)` }}>
                        <Icon name={t.icon} className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                    <span className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{item.category}</span>
                </span>
                <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${t.pill}`}>{item.status.label}</span>
            </div>
            <p className="mt-2.5 text-[15px] font-semibold text-ink">{item.requirement}</p>
            {item.evidence && <p className="mt-0.5 text-sm text-ink-3">{item.evidence}</p>}
            {item.nextAction && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-2">
                    <Icon name="arrowRight" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-ink" />
                    <span>{item.nextAction}</span>
                </p>
            )}
            {item.to && (
                <Link to={item.to} className="kd-link mt-auto self-end pt-3 text-xs">
                    Open module <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </Link>
            )}
        </li>
    );
}

export default function ComplianceChecklist() {
    const [state, setState] = useState({ loading: true, data: null, error: "" });
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState("all");

    const load = useCallback(async () => {
        const res = await getComplianceChecklist();
        setState({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
    }, []);

    useEffect(() => {
        let active = true;
        getComplianceChecklist().then((res) => {
            if (active) setState({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, []);

    const refresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const d = state.data;
    const visible = useMemo(() => {
        if (!d) return [];
        return d.items
            .filter((it) => filter === "all" || it.status.key === filter)
            .slice()
            .sort((a, b) => ORDER[a.status.key] - ORDER[b.status.key] || a.category.localeCompare(b.category));
    }, [d, filter]);

    const count = (key) => (d ? d.items.filter((it) => key === "all" || it.status.key === key).length : 0);
    const ringColor = !d ? C.brand : d.progress >= 80 ? C.ok : d.progress >= 50 ? C.amber : C.red;

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-4" style={rise(0)}>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">Governance</p>
                    <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Compliance checklist</h1>
                    <p className="mt-1 max-w-2xl text-sm text-ink-3">Each DPDP duty, checked against the records in your Kavach workspace.</p>
                </div>
                <button type="button" onClick={refresh} disabled={state.loading || refreshing} className="kd-btn">
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing" : "Refresh"}
                </button>
            </header>

            {state.error && (
                <Alert
                    action={
                        <button type="button" onClick={refresh} className="shrink-0 font-semibold underline">
                            Retry
                        </button>
                    }
                >
                    {state.error}
                </Alert>
            )}

            {state.loading && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="pg-shimmer h-[132px] rounded-[14px]" />
                    ))}
                </div>
            )}

            {d && (
                <>
                    <section aria-label="Checklist summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="kd-card flex items-center gap-4 p-5" style={rise(1)}>
                            <Ring value={d.progress} size={96} stroke={10} color={ringColor} label={`${d.progress}% of tracked items complete`} tip={{ title: "Checklist progress", rows: [{ name: "Complete", value: d.progress, display: `${d.progress}%`, color: ringColor }] }}>
                                <span className="kd-big text-[22px]" style={{ color: ringColor }}>
                                    <CountUp value={d.progress} suffix="%" />
                                </span>
                            </Ring>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-ink-2">Progress</p>
                                <p className="mt-1 text-xs text-muted">
                                    {d.complete} of {d.tracked} tracked items complete
                                </p>
                            </div>
                        </div>
                        <Summary i={2} value={d.complete} label="Complete" sub="Backed by records in Kavach" tone="ok" icon="check" />
                        <Summary i={3} value={d.attention} label="Needs attention" sub="Missing records or open items" tone="warn" icon="alert" />
                        <Summary i={4} value={d.untracked} label="Tracked outside Kavach" sub="Keep evidence in your own systems" tone="muted" icon="info" />
                    </section>

                    <section className="kd-card p-5" style={rise(5)} aria-labelledby="ck-items">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 id="ck-items" className="text-base font-bold text-ink">
                                Requirements
                            </h2>
                            <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={filter === f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f.key ? "bg-brand text-white shadow-[var(--k-shadow-sm)]" : "border border-line bg-surface text-ink-2 hover:bg-subtle"}`}
                                    >
                                        {f.label} ({count(f.key)})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <p className="py-10 text-center text-sm text-ink-3">No requirements in this view.</p>
                        ) : (
                            <ul className="mt-5 grid gap-3 lg:grid-cols-2">
                                {visible.map((it) => (
                                    <Item key={it.id} item={it} />
                                ))}
                            </ul>
                        )}
                    </section>

                    {d.disclaimer && <p className="text-xs leading-relaxed text-muted">{d.disclaimer}</p>}
                </>
            )}
        </div>
    );
}
