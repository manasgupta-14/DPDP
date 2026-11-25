import { useMemo } from "react";
import { BarChart, ChartTable, LineChart } from "../dashboard/Charts.jsx";
import { SEVERITIES, sameText, severityColor, timeOf } from "../../../utils/breach.js";
import { panel } from "../../shared/ui.js";
import { toTime } from "../../../utils/audit.js";

const DAY = 86400000;
const MAX_DAYS = 45;

const startOfDay = (t) => {
    const d = new Date(toTime(t) || t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

function trendOf(incidents) {
    const times = incidents.map((i) => timeOf(i.reportedAt)).filter(Boolean);
    if (!times.length) return { labels: [], values: [] };
    const first = startOfDay(Math.min(...times));
    const today = startOfDay(Date.now());
    const last = Math.max(today, startOfDay(Math.max(...times)));
    const days = Math.round((last - first) / DAY) + 1;

    if (days <= MAX_DAYS) {
        const values = Array(days).fill(0);
        times.forEach((t) => { values[Math.round((startOfDay(t) - first) / DAY)] += 1; });
        const labels = values.map((_, i) => new Date(first + i * DAY).toLocaleDateString(undefined, { day: "numeric", month: "short" }));
        return { labels, values };
    }

    const key = (t) => { const d = new Date(toTime(t) || t); return d.getFullYear() * 12 + d.getMonth(); };
    const from = key(first);
    const to = key(last);
    const values = Array(to - from + 1).fill(0);
    times.forEach((t) => { values[key(t) - from] += 1; });
    const labels = values.map((_, i) => new Date(Math.floor((from + i) / 12), (from + i) % 12, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" }));
    return { labels, values };
}

function Card({ title, sub, children }) {
    return (
        <section className={`${panel} min-w-0 p-5 sm:p-6`} aria-label={title}>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-xs text-muted">{sub}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

export default function BreachCharts({ incidents }) {
    const trend = useMemo(() => trendOf(incidents), [incidents]);
    const bars = useMemo(
        () => [
            ...SEVERITIES.map((s) => ({ label: s, value: incidents.filter((i) => sameText(i.severity, s)).length, color: severityColor(s) })),
            { label: "Unset", value: incidents.filter((i) => !i.severity).length, color: severityColor(null) },
        ],
        [incidents],
    );

    if (!incidents.length) return null;

    return (
        <div className="grid gap-5 lg:grid-cols-2" aria-label="Incident charts">
            <Card title="Incidents over time" sub="Reported incidents">
                <LineChart labels={trend.labels} series={[{ name: "Reported", values: trend.values }]} />
                <ChartTable head={["Period", "Reported"]} rows={trend.labels.map((l, i) => [l, trend.values[i]])} />
            </Card>
            <Card title="Incidents by severity" sub="Number of incidents">
                <BarChart bars={bars} unit="Incidents" />
                <ChartTable head={["Severity", "Incidents"]} rows={bars.map((b) => [b.label, b.value])} />
            </Card>
        </div>
    );
}
