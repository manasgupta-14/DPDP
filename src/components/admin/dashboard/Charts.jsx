import { useEffect, useRef, useState } from "react";

// Categorical slots in fixed order (identity never cycles; bar charts fold extras into "Other").
export const SERIES = ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100", "#E87BA4", "#008300", "#6250D6", "#E34948"];
const INK = "#0F172A";
const MUTED = "#64748B";
const GRID = "#E2E8F0";
const HEIGHT = 240;

const fmt = (v) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 });

function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(520);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
}

function scaleFor(max) {
    if (!(max > 0)) return { step: 1, top: 4 };
    const raw = max / 4;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
    return { step, top: step * Math.ceil(max / step) };
}

// Monotone cubic curve: smooth like the reference, never dips below the data.
function curve(pts) {
    const n = pts.length;
    if (n < 2) return "";
    const dx = [];
    const m = [];
    const t = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) {
        dx[i] = pts[i + 1].x - pts[i].x;
        m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
    }
    t[0] = m[0];
    t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
        if (m[i] === 0) {
            t[i] = 0;
            t[i + 1] = 0;
            continue;
        }
        const a = t[i] / m[i];
        const b = t[i + 1] / m[i];
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            t[i] = k * a * m[i];
            t[i + 1] = k * b * m[i];
        }
    }
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i] / 3;
        d += `C${pts[i].x + h},${pts[i].y + t[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
}

function Tooltip({ x, width, title, rows }) {
    const flip = x > width * 0.6;
    return (
        <div
            className="pointer-events-none absolute top-2 z-10 min-w-[140px] rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
            style={{ left: flip ? undefined : x + 12, right: flip ? width - x + 12 : undefined }}
        >
            <p className="font-semibold text-[#0F172A]">{title}</p>
            {rows.map((r) => (
                <p key={r.name} className="mt-1 flex items-center justify-between gap-4 text-[#334155]">
                    <span className="flex items-center gap-1.5">
                        {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
                        {r.name}
                    </span>
                    <span className="font-semibold text-[#0F172A]">{fmt(r.value)}</span>
                </p>
            ))}
        </div>
    );
}

export function LineChart({ labels, series }) {
    const [ref, width] = useWidth();
    const [hover, setHover] = useState(null);
    const m = { l: 40, r: 14, t: 12, b: 28 };
    const w = width - m.l - m.r;
    const h = HEIGHT - m.t - m.b;
    const max = Math.max(0, ...series.flatMap((s) => s.values));
    const { step, top } = scaleFor(max);
    const n = labels.length;
    const X = (i) => m.l + (n === 1 ? w / 2 : (i / (n - 1)) * w);
    const Y = (v) => m.t + h - (v / top) * h;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 70))));

    const onMove = (e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - box.left - m.l;
        setHover(Math.min(n - 1, Math.max(0, Math.round((px / w) * (n - 1)))));
    };

    return (
        <div>
            <div ref={ref} className="relative">
                <svg width={width} height={HEIGHT} role="img" aria-label={`Line chart of ${series.map((s) => s.name).join(", ")} over ${n} points`}>
                    <defs>
                        <linearGradient id="pg-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SERIES[0]} stopOpacity="0.16" />
                            <stop offset="100%" stopColor={SERIES[0]} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} stroke={GRID} strokeDasharray={t === 0 ? undefined : "3 4"} />
                            <text x={m.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{fmt(t)}</text>
                        </g>
                    ))}
                    {labels.map((l, i) => (i % every === 0 ? <text key={i} x={X(i)} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill={MUTED}>{l}</text> : null))}
                    {n > 1 && (
                        <path d={`${curve(series[0].values.map((v, i) => ({ x: X(i), y: Y(v) })))}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill="url(#pg-area)" />
                    )}
                    {series.map((s, si) => (
                        <path key={s.name} d={curve(s.values.map((v, i) => ({ x: X(i), y: Y(v) })))} fill="none" stroke={SERIES[si]} strokeWidth="2" strokeLinecap="round" />
                    ))}
                    {n === 1 && series.map((s, si) => <circle key={s.name} cx={X(0)} cy={Y(s.values[0])} r="4" fill={SERIES[si]} />)}
                    {hover !== null && (
                        <g>
                            <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + h} stroke={MUTED} strokeDasharray="3 3" />
                            {series.map((s, si) => <circle key={s.name} cx={X(hover)} cy={Y(s.values[hover])} r="4.5" fill={SERIES[si]} stroke="#fff" strokeWidth="2" />)}
                        </g>
                    )}
                    <rect x={m.l} y={m.t} width={w} height={h} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
                </svg>
                {hover !== null && (
                    <Tooltip x={X(hover)} width={width} title={labels[hover]} rows={series.map((s, si) => ({ name: s.name, value: s.values[hover], color: SERIES[si] }))} />
                )}
            </div>
            {series.length > 1 && (
                <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[#334155]">
                    {series.map((s, si) => (
                        <li key={s.name} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: SERIES[si] }} />
                            {s.name} <span className="font-semibold text-[#0F172A]">{fmt(s.values.reduce((a, b) => a + b, 0))}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function BarChart({ bars, unit }) {
    const [ref, width] = useWidth();
    const [hover, setHover] = useState(null);
    const m = { l: 40, r: 14, t: 12, b: 28 };
    const w = width - m.l - m.r;
    const h = HEIGHT - m.t - m.b;
    const { step, top } = scaleFor(Math.max(0, ...bars.map((b) => b.value)));
    const band = w / bars.length;
    const bw = Math.min(56, band * 0.62);
    const Y = (v) => m.t + h - (v / top) * h;
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
    const clip = Math.max(4, Math.floor(band / 7));

    return (
        <div ref={ref} className="relative">
            <svg width={width} height={HEIGHT} role="img" aria-label={`Bar chart of ${unit} by ${bars.length} categories`}>
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={m.l} x2={width - m.r} y1={Y(t)} y2={Y(t)} stroke={GRID} strokeDasharray={t === 0 ? undefined : "3 4"} />
                        <text x={m.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{fmt(t)}</text>
                    </g>
                ))}
                {bars.map((b, i) => {
                    const x = m.l + band * i + (band - bw) / 2;
                    const y = Y(b.value);
                    const bh = m.t + h - y;
                    const r = Math.min(4, bw / 2, bh);
                    return (
                        <g key={b.label}>
                            {hover === i && <rect x={m.l + band * i} y={m.t} width={band} height={h} fill="#F1F5F9" />}
                            {bh > 0 && (
                                <path d={`M${x},${y + bh}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + bh}Z`} fill={SERIES[i]} />
                            )}
                            <text x={x + bw / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill={MUTED}>
                                {b.label.length > clip ? `${b.label.slice(0, clip - 1)}…` : b.label}
                            </text>
                            <rect x={m.l + band * i} y={m.t} width={band} height={h} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
                        </g>
                    );
                })}
            </svg>
            {hover !== null && (
                <Tooltip x={m.l + band * hover + band / 2} width={width} title={bars[hover].label} rows={[{ name: unit, value: bars[hover].value, color: SERIES[hover] }]} />
            )}
        </div>
    );
}

export function ChartTable({ head, rows }) {
    return (
        <details className="mt-3 text-xs text-[#475569]">
            <summary className="cursor-pointer font-semibold text-[#0F766E]">View as table</summary>
            <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-[#E2E8F0]">
                <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[#64748B]">
                        <tr>{head.map((c) => <th key={c} className="px-3 py-1.5 font-semibold">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                        {rows.map((r, i) => (
                            <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-1.5">{c}</td>)}</tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}
