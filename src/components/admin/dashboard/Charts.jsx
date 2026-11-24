import { AreaChart, ChartTable, ColumnChart, SERIES } from "../../charts/kit.jsx";

export { ChartTable };

export function LineChart({ labels, series }) {
    return <AreaChart labels={labels} series={series.map((s, i) => ({ ...s, color: s.color || SERIES[i % SERIES.length] }))} />;
}

export function BarChart({ bars, unit = "Value" }) {
    const labels = bars.map((b) => b.label);
    const series = bars.map((b, i) => ({
        name: unit,
        color: b.color || SERIES[i % SERIES.length],
        values: bars.map((_, j) => (j === i ? b.value : 0)),
    }));
    return <ColumnChart labels={labels} series={series} stacked ariaLabel={`${unit} by category`} />;
}
