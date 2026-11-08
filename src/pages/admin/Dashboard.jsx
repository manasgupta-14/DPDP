import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDashboardSummary } from "../../api/dashboard.js";
import { BarChart, ChartTable, LineChart } from "../../components/admin/dashboard/Charts.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import { summaryToCsv } from "../../utils/dashboard.js";

const rise = (delay = 0) => ({ animation: `pg-rise .65s cubic-bezier(.22,1,.36,1) ${delay}ms both` });
const card = "rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

function Kpi({ item, delay }) {
    return (
        <div className={`${card} pg-card p-5`} style={rise(delay)}>
            <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-full ${item.tint}`}>
                    <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <Icon name="arrow" className="h-4 w-4 text-[#CBD5E1]" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A]">{item.display}</p>
            <p className="mt-1 text-sm font-medium text-[#334155]">{item.label}</p>
            {item.group && <p className="mt-0.5 text-xs text-[#64748B]">{item.group}</p>}
        </div>
    );
}

function ChartCard({ chart, delay }) {
    const table =
        chart.type === "bar"
            ? { head: ["Category", chart.unit], rows: chart.bars.map((b) => [b.label, b.value]) }
            : { head: ["Period", ...chart.series.map((s) => s.name)], rows: chart.labels.map((l, i) => [l, ...chart.series.map((s) => s.values[i])]) };
    return (
        <section className={`${card} pg-card min-w-0 p-5 sm:p-6`} style={rise(delay)} aria-label={chart.title}>
            <h2 className="text-base font-semibold text-[#0F172A]">{chart.title}</h2>
            <p className="mt-0.5 text-xs text-[#64748B]">{chart.type === "bar" ? chart.unit : "Trend over time"}</p>
            <div className="mt-4">{chart.type === "bar" ? <BarChart bars={chart.bars} unit={chart.unit} /> : <LineChart labels={chart.labels} series={chart.series} />}</div>
            <ChartTable head={table.head} rows={table.rows} />
        </section>
    );
}

function Skeleton() {
    return (
        <div className="space-y-5" aria-busy="true">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-[#E2E8F0]/70" />)}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
                {[0, 1].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-[#E2E8F0]/70" />)}
            </div>
        </div>
    );
}

function download(summary) {
    const blob = new Blob([summaryToCsv(summary)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Dashboard() {
    const location = useLocation();
    const [banner, setBanner] = useState(!!location.state?.justLoggedIn);
    const [state, setState] = useState({ loading: true, error: "", data: null });
    const [refreshing, setRefreshing] = useState(false);

    const apply = (res) => setState(res.ok ? { loading: false, error: "", data: res.data } : { loading: false, error: res.error, data: null });

    const refresh = useCallback(async () => {
        setRefreshing(true);
        apply(await getDashboardSummary());
        setRefreshing(false);
    }, []);

    useEffect(() => {
        let active = true;
        getDashboardSummary().then((res) => {
            if (active) apply(res);
        });
        return () => { active = false; };
    }, []);

    const d = state.data;
    const nothing = d && d.kpis.length === 0 && d.more.length === 0 && d.charts.length === 0 && d.lists.length === 0;
    const wide = d ? d.charts.length % 2 === 1 : false;

    return (
        <div className="space-y-6">
            {banner && (
                <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3" style={rise()}>
                    <div>
                        <p className="text-sm font-semibold text-[#166534]">Login successful</p>
                        <p className="text-sm text-[#166534]/80">You are signed in to your PrivyGuard admin workspace.</p>
                    </div>
                    <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="rounded-md px-2 text-lg leading-none text-[#166534] hover:bg-white/60">&times;</button>
                </div>
            )}

            <header className={`${card} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`} style={rise()}>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0F766E]">Analytics &amp; reporting</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">Compliance Dashboard</h1>
                    <p className="mt-1 text-sm text-[#475569]">
                        {d?.org ? `${d.org} · ` : ""}Live compliance posture across consent, campaigns, Rights Requests and breach workflows.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    {d?.score && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs font-semibold text-[#334155]">
                            <Icon name="shield" className="h-4 w-4 text-[#0F766E]" />
                            {d.score.value} / 100 compliance score
                        </span>
                    )}
                    <button type="button" onClick={refresh} disabled={state.loading || refreshing} className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E] disabled:opacity-60">
                        <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                    <button type="button" onClick={() => d && download(d)} disabled={!d || nothing} className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1E293B] disabled:opacity-50">
                        Generate report
                    </button>
                </div>
            </header>

            {state.error && (
                <Alert action={<button type="button" onClick={refresh} className="shrink-0 font-semibold underline">Retry</button>}>{state.error}</Alert>
            )}
            {state.loading && <Skeleton />}

            {d && !nothing && (
                <>
                    {d.kpis.length > 0 && (
                        <section aria-label="Key numbers" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            {d.kpis.map((k, i) => <Kpi key={k.key} item={k} delay={80 + i * 60} />)}
                        </section>
                    )}

                    {d.charts.length > 0 && (
                        <div className="grid gap-5 lg:grid-cols-2">
                            {d.charts.map((c, i) => (
                                <div key={c.id} className={wide && i === d.charts.length - 1 ? "lg:col-span-2" : "min-w-0"}>
                                    <ChartCard chart={c} delay={320 + i * 60} />
                                </div>
                            ))}
                        </div>
                    )}

                    {d.more.length > 0 && (
                        <section className={`${card} p-5 sm:p-6`} style={rise(420)} aria-label="More metrics">
                            <h2 className="text-base font-semibold text-[#0F172A]">More metrics</h2>
                            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {d.more.map((m) => (
                                    <div key={m.key} className="rounded-xl bg-[#F8FAFC] p-3 ring-1 ring-[#E2E8F0]">
                                        <dt className="text-xs text-[#64748B]">{m.label}</dt>
                                        <dd className="mt-0.5 text-xl font-bold text-[#0F172A]">{m.display}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    {d.lists.map((l) => (
                        <section key={l.id} className={`${card} p-5 sm:p-6`} style={rise(480)} aria-label={l.title}>
                            <h2 className="text-base font-semibold text-[#0F172A]">{l.title}</h2>
                            <ul className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2">
                                {l.items.map((it, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0F766E]" />
                                        <div className="min-w-0">
                                            <p className="text-[15px] font-medium leading-snug">{it.title}</p>
                                            {it.meta && <p className="mt-0.5 text-xs text-[#64748B]">{it.meta}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </>
            )}

            {nothing && (
                <div className={`${card} p-6`}>
                    <p className="font-semibold text-[#0F172A]">The server answered, but there is nothing to chart yet.</p>
                    <p className="mt-1 text-sm text-[#475569]">Numbers appear here as soon as /api/Dashboard/summary returns counts or lists.</p>
                    <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-[#F8FAFC] p-3 text-xs">{JSON.stringify(d.raw, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
