import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";


export const C = {
    brand: "var(--kc-1)",
    teal: "var(--kc-2)",
    amber: "var(--kc-3)",
    red: "var(--kc-4)",
    violet: "var(--kc-5)",
    sky: "var(--kc-6)",
    pink: "var(--kc-7)",
    lime: "var(--kc-8)",
    indigo: "var(--kc-9)",
    orange: "var(--kc-10)",
    ok: "var(--kc-ok)",
    warn: "var(--kc-warn)",
    bad: "var(--kc-bad)",
    track: "var(--k-track)",
    muted: "var(--k-faint)",
};
export const SERIES = [C.brand, C.teal, C.amber, C.red, C.violet, C.sky];

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Number(v) || 0));
export const fmtNum = (v) => Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 });

export function useInView({ replay = true, threshold = 0.25 } = {}) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (typeof IntersectionObserver === "undefined") {
            setInView(true);
            return undefined;
        }
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) setInView(true);
                else if (replay && e.intersectionRatio === 0) setInView(false);
            },
            { threshold: [0, threshold] },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [replay, threshold]);
    return [ref, inView];
}

export function useCountUp(value, active, duration = 1100) {
    const target = Number(value) || 0;
    const [shown, setShown] = useState(0);
    const skip = typeof window !== "undefined" && !!window.matchMedia?.("(max-width: 1023px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches;
    useEffect(() => {
        if (!active || skip) return undefined;
        let raf = 0;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.max(0, Math.min(1, (now - start) / duration));
            const eased = 1 - Math.pow(1 - t, 3);
            setShown(target * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, active, duration, skip]);
    if (skip) return active ? target : 0;
    return active ? shown : 0;
}

export function CountUp({ value, decimals = 0, prefix = "", suffix = "", className = "" }) {
    const [ref, inView] = useInView();
    const v = useCountUp(value, inView);
    const text = Number(v).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return (
        <span ref={ref} className={className} data-num>
            {prefix}
            {text}
            {suffix}
        </span>
    );
}

function useWidth(initial = 520) {
    const ref = useRef(null);
    const [width, setWidth] = useState(initial);
    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === "undefined") return undefined;
        const ro = new ResizeObserver(([entry]) => setWidth(Math.max(220, Math.floor(entry.contentRect.width))));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
}

function niceScale(max, ticks = 4) {
    if (!(max > 0)) return { top: ticks, step: 1 };
    const raw = max / ticks;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    const step = Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p);
    return { step, top: step * Math.ceil(max / step) };
}

function curve(pts) {
    const n = pts.length;
    if (n < 2) return n ? `M${pts[0].x},${pts[0].y}` : "";
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
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < n - 1; i++) {
        const h = dx[i] / 3;
        d += `C${pts[i].x + h},${pts[i].y + t[i] * h} ${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h} ${pts[i + 1].x},${pts[i + 1].y}`;
    }
    return d;
}

function TipBody({ title, rows }) {
    return (
        <>
            {title && <p className="font-semibold text-ink">{title}</p>}
            {rows.map((r, ki) => (
                <p key={`${r.name}-${ki}`} className="mt-1 flex items-center justify-between gap-3 text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                        <i className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                        {r.name}
                    </span>
                    <b className="tabular-nums text-ink">{r.display ?? fmtNum(r.value)}</b>
                </p>
            ))}
        </>
    );
}

const isTouchDevice = () => typeof window !== "undefined" && !!window.matchMedia?.("(hover: none), (pointer: coarse)").matches;

function useAutoClear(active, clear, holderRef, delay = 2600) {
    useEffect(() => {
        if (!active || !isTouchDevice()) return undefined;
        const timer = setTimeout(clear, delay);
        const onOutside = (e) => {
            const holder = holderRef?.current;
            if (!holder || !holder.contains(e.target)) clear();
        };
        const onScroll = () => clear();
        document.addEventListener("touchstart", onOutside, { passive: true });
        document.addEventListener("mousedown", onOutside);
        window.addEventListener("scroll", onScroll, { passive: true, capture: true });
        return () => {
            clearTimeout(timer);
            document.removeEventListener("touchstart", onOutside);
            document.removeEventListener("mousedown", onOutside);
            window.removeEventListener("scroll", onScroll, { capture: true });
        };
    }, [active, clear, holderRef, delay]);
}

export function useFloatTip() {
    const [pos, setPos] = useState(null);
    const holder = useRef(null);
    const clear = useCallback(() => setPos(null), []);
    useAutoClear(pos, clear, holder);
    const at = (e, x, y) => {
        holder.current = e.currentTarget;
        setPos({ x, y });
    };
    const bind = {
        onMouseMove: (e) => at(e, e.clientX, e.clientY),
        onMouseLeave: clear,
        onTouchStart: (e) => {
            const t = e.touches?.[0];
            if (t) at(e, t.clientX, t.clientY);
        },
        onTouchMove: (e) => {
            const t = e.touches?.[0];
            if (t) at(e, t.clientX, t.clientY);
        },
        onTouchCancel: clear,
    };
    const render = (content) => {
        if (!pos || !content || typeof document === "undefined") return null;
        const vw = window.innerWidth;
        const width = Math.min(220, vw - 16);
        const left = Math.max(8, Math.min(pos.x + 14 + width > vw ? pos.x - width - 14 : pos.x + 14, vw - width - 8));
        const top = Math.max(8, pos.y - 12);
        return createPortal(
            <div className="kc-tip kc-tip-float" style={{ position: "fixed", left, top, maxWidth: width, pointerEvents: "none", transform: "translateY(-100%)" }} role="tooltip">
                <TipBody {...content} />
            </div>,
            document.body
        );
    };
    return [bind, render, pos];
}

export function Ring({ value, size = 132, stroke = 12, color = C.brand, children, label, name, tip, unit = "" }) {
    const [ref, inView] = useInView();
    const [bind, renderTip] = useFloatTip();
    const v = clamp(value);
    const r = (size - stroke) / 2;
    const raw = value === null || value === undefined ? null : Number(value);
    const content = tip || { title: name || label, rows: [{ name: "Score", value: raw, display: raw === null || Number.isNaN(raw) ? "No data" : `${fmtNum(raw)}${unit}`, color }] };
    return (
        <div ref={ref} data-in={inView} className="kc-hov relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${v}%`} {...bind}>
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: C.track }} strokeWidth={stroke} />
                <circle
                    className="kc-arc"
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    style={{ stroke: color }}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={inView ? 100 - v : 100}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
            {renderTip(content)}
        </div>
    );
}

export function Donut({ parts, size = 168, stroke = 22, children, label, name }) {
    const [ref, inView] = useInView();
    const [bind, renderTip, tipPos] = useFloatTip();
    const [activeRaw, setActive] = useState(null);
    const active = tipPos ? activeRaw : null;
    const total = parts.reduce((s, p) => s + (Number(p.value) || 0), 0);
    const share = (v) => (total > 0 ? Math.round(((Number(v) || 0) / total) * 100) : 0);
    const rowOf = (p) => ({ name: `${p.label} · ${share(p.value)}%`, value: p.value, color: p.color });
    const content =
        active !== null && parts[active]
            ? { title: parts[active].label, rows: [{ name: `Share · ${share(parts[active].value)}%`, value: parts[active].value, color: parts[active].color }] }
            : { title: name || (total > 0 ? `Total ${fmtNum(total)}` : "No records yet"), rows: parts.map(rowOf) };
    const r = (size - stroke) / 2;
    const gap = parts.filter((p) => p.value > 0).length > 1 ? 0.8 : 0;
    let start = 0;
    return (
        <div
            ref={ref}
            data-in={inView}
            className="kc-hov relative shrink-0"
            style={{ width: size, height: size }}
            role="img"
            aria-label={label || parts.map((p) => `${p.label} ${p.value}`).join(", ")}
            {...bind}
            onMouseLeave={(e) => {
                setActive(null);
                bind.onMouseLeave(e);
            }}
        >
            <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: C.track }} strokeWidth={stroke} />
                {total > 0 &&
                    parts.map((p, i) => {
                        const len = (Number(p.value) / total) * 100;
                        const seg = (
                            <circle
                                key={`${p.label}-${i}`}
                                cx={size / 2}
                                cy={size / 2}
                                r={r}
                                fill="none"
                                strokeWidth={active === i ? stroke + 4 : stroke}
                                pathLength="100"
                                strokeDasharray={`${inView ? Math.max(len - gap, 0) : 0} 100`}
                                strokeDashoffset={-start}
                                onMouseEnter={() => setActive(i)}
                                onTouchStart={() => setActive(i)}
                                onMouseLeave={() => setActive(null)}
                                className="kc-seg"
                                style={{ stroke: p.color, opacity: active === null || active === i ? 1 : 0.35, transition: `stroke-dasharray 1100ms cubic-bezier(.22,1,.36,1) ${i * 140}ms, opacity .2s ease, stroke-width .2s ease` }}
                            />
                        );
                        start += len;
                        return seg;
                    })}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">{children}</div>
            {renderTip(content)}
        </div>
    );
}

export function Gauge({ value, size = 220, color = C.brand, children, label, name }) {
    const [ref, inView] = useInView();
    const [bind, renderTip] = useFloatTip();
    const v = clamp(value);
    const w = size;
    const h = size * 0.58;
    const r = w / 2 - 14;
    const d = `M14 ${h - 6} A${r} ${r} 0 0 1 ${w - 14} ${h - 6}`;
    return (
        <div ref={ref} data-in={inView} className="kc-hov relative" style={{ width: w, height: h }} role="img" aria-label={label || `${v} out of 100`} {...bind}>
            <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
                <path d={d} fill="none" style={{ stroke: C.track }} strokeWidth="16" strokeLinecap="round" />
                <path className="kc-arc" d={d} fill="none" style={{ stroke: color }} strokeWidth="16" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={inView ? 100 - v : 100} />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center">{children}</div>
            {renderTip({ title: name || label || "Score", rows: [{ name: "Score", value: v, display: `${fmtNum(v)} / 100`, color }] })}
        </div>
    );
}

function Tip({ x, width, title, rows }) {
    const left = Math.min(Math.max(x - 70, 4), width - 150);
    return (
        <div className="kc-tip" style={{ left, top: 4 }}>
            <p className="font-semibold text-ink">{title}</p>
            {rows.map((r, ki) => (
                <p key={`${r.name}-${ki}`} className="mt-1 flex items-center justify-between gap-3 text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                        <i className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                        {r.name}
                    </span>
                    <b className="tabular-nums text-ink">{r.display ?? fmtNum(r.value)}</b>
                </p>
            ))}
        </div>
    );
}

export function AreaChart({ labels, series, height = 220, area = true, yFormat = fmtNum, ariaLabel }) {
    const [wrapRef, width] = useWidth();
    const [ref, inView] = useInView();
    const [hover, setHover] = useState(null);
    const m = { t: 14, r: 12, b: 26, l: 40 };
    const w = width - m.l - m.r;
    const h = height - m.t - m.b;
    const n = labels.length;
    const max = Math.max(0, ...series.flatMap((s) => s.values));
    const { top, step } = niceScale(max);
    const X = (i) => m.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
    const Y = (v) => m.t + h - (v / top) * h;
    const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 70))));
    const uid = useRef(`kc${Math.random().toString(36).slice(2, 8)}`).current;

    const clearHover = useCallback(() => setHover(null), []);
    useAutoClear(hover !== null, clearHover, wrapRef);
    const onMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        const x = cx - rect.left - m.l;
        const i = n <= 1 ? 0 : Math.round((x / w) * (n - 1));
        setHover(Math.max(0, Math.min(n - 1, i)));
    };

    return (
        <div ref={wrapRef} className="relative w-full">
            <div ref={ref} data-in={inView} className="kc-stage">
                <svg width={width} height={height} role="img" aria-label={ariaLabel || series.map((s) => s.name).join(", ")} onMouseMove={onMove} onTouchStart={onMove} onTouchMove={onMove} onMouseLeave={() => setHover(null)}>
                    <defs>
                        {series.map((s, si) => (
                            <linearGradient key={`${s.name}-${si}`} id={`${uid}-${si}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0" style={{ stopColor: s.color || SERIES[si] }} stopOpacity="0.28" />
                                <stop offset="1" style={{ stopColor: s.color || SERIES[si] }} stopOpacity="0" />
                            </linearGradient>
                        ))}
                    </defs>
                    {ticks.map((t, ki) => (
                        <g key={`${t}-${ki}`}>
                            <line className="kc-grid" x1={m.l} x2={m.l + w} y1={Y(t)} y2={Y(t)} strokeDasharray={t === 0 ? "" : "3 4"} />
                            <text className="kc-axis" x={m.l - 8} y={Y(t) + 4} textAnchor="end">
                                {yFormat(t)}
                            </text>
                        </g>
                    ))}
                    {labels.map((l, i) =>
                        i % every === 0 || i === n - 1 ? (
                            <text key={`${l}-${i}`} className="kc-axis" x={X(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
                                {l}
                            </text>
                        ) : null,
                    )}
                    {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + h} style={{ stroke: "var(--k-line-strong)" }} strokeDasharray="3 3" />}
                    {series.map((s, si) => {
                        const pts = s.values.map((v, i) => ({ x: X(i), y: Y(v) }));
                        const line = curve(pts);
                        const color = s.color || SERIES[si];
                        return (
                            <g key={`${s.name}-${si}`}>
                                {area && si === 0 && pts.length > 1 && <path className="kc-area" d={`${line}L${X(n - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill={`url(#${uid}-${si})`} />}
                                <path
                                    className="kc-line"
                                    d={line}
                                    fill="none"
                                    style={{ stroke: color, "--d": `${si * 200}ms` }}
                                    strokeWidth={si === 0 ? 2.5 : 2}
                                    strokeDasharray={s.dashed ? "5 5" : "1"}
                                    pathLength={s.dashed ? undefined : 1}
                                    strokeDashoffset={s.dashed ? 0 : inView ? 0 : 1}
                                    strokeLinecap="round"
                                />
                                {pts.map((p, i) => (
                                    <circle key={i} className="kc-dot" cx={p.x} cy={p.y} r={hover === i ? 5 : 3} style={{ fill: "var(--k-surface)", stroke: color, "--d": `${700 + i * 40}ms` }} strokeWidth="2" />
                                ))}
                                {pts.length > 1 && <circle className="kc-pulse" cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="5" style={{ stroke: color }} />}
                            </g>
                        );
                    })}
                    <rect x={m.l} y={m.t} width={w} height={h} fill="transparent" />
                </svg>
            </div>
            {hover !== null && <Tip x={X(hover)} width={width} title={labels[hover]} rows={series.map((s, si) => ({ name: s.name, value: s.values[hover], color: s.color || SERIES[si] }))} />}
        </div>
    );
}

export const BAR3D = [C.brand, C.violet, C.teal, C.amber, C.pink, C.lime, C.orange, C.sky];

export function ColumnChart({ labels, series, height = 230, stacked = false, ariaLabel, barColors, percent }) {
    const [wrapRef, width] = useWidth();
    const [ref, inView] = useInView();
    const [hover, setHover] = useState(null);
    const uid = useRef(`bf${Math.random().toString(36).slice(2, 8)}`).current;
    const m = { t: 26, r: 8, b: 30, l: 40 };
    const w = width - m.l - m.r;
    const h = height - m.t - m.b;
    const n = labels.length;
    const totals = labels.map((_, i) => series.reduce((s, x) => s + (Number(x.values[i]) || 0), 0));
    const seriesTotals = series.map((x) => x.values.reduce((s, v) => s + (Number(v) || 0), 0));
    const max = stacked ? Math.max(0, ...totals) : Math.max(0, ...series.flatMap((s) => s.values));
    const { top, step } = niceScale(max);
    const band = w / Math.max(1, n);
    const inner = Math.min(band * 0.72, stacked ? 46 : 26 * series.length + 8);
    const bw = stacked ? inner : Math.max(5, (inner - (series.length - 1) * 4) / series.length);
    const Y = (v) => m.t + h - (v / top) * h;
    const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    const clip = (s) => (s.length > 12 ? `${s.slice(0, 11)}…` : s);
    const mode = percent || (series.length === 1 ? "series" : "group");
    const pctOf = (v, i, si) => {
        const base = mode === "group" ? totals[i] : seriesTotals[si];
        return base ? Math.round((v / base) * 100) : 0;
    };
    const colorOf = (si, i) => (barColors && series.length === 1 ? barColors[i % barColors.length] : series[si].color || SERIES[si]);
    const clearHover = useCallback(() => setHover(null), []);
    useAutoClear(hover !== null, clearHover, wrapRef);
    const showPct = !stacked && bw >= 14;
    const pctSize = bw >= 26 ? 12 : 10;

    return (
        <div ref={wrapRef} className="relative w-full">
            <div ref={ref} data-in={inView} className="kc-stage">
                <svg width={width} height={height} role="img" aria-label={ariaLabel || "Bar chart"} onMouseLeave={() => setHover(null)} className="kc-flat">
                    <defs>
                        {labels.map((_, i) =>
                            series.map((s, si) => {
                                const c = colorOf(si, i);
                                return (
                                    <linearGradient key={`${i}-${si}`} id={`${uid}-g${i}-${si}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" style={{ stopColor: c }} />
                                        <stop offset="100%" style={{ stopColor: `color-mix(in srgb, ${c} 68%, var(--k-surface))` }} />
                                    </linearGradient>
                                );
                            })
                        )}
                    </defs>
                    {ticks.map((t, ki) => (
                        <g key={`${t}-${ki}`}>
                            <line className="kc-grid kc-grid-soft" x1={m.l} x2={m.l + w} y1={Y(t)} y2={Y(t)} strokeDasharray={t === 0 ? "" : "3 5"} />
                            <text className="kc-axis" x={m.l - 8} y={Y(t) + 4} textAnchor="end">
                                {fmtNum(t)}
                            </text>
                        </g>
                    ))}
                    {labels.map((l, i) => {
                        const x0 = m.l + band * i + (band - inner) / 2;
                        let acc = 0;
                        return (
                            <g key={`${l}-${i}`} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                                <rect x={m.l + band * i} y={m.t} width={band} height={h} rx="8" fill={hover === i ? "var(--k-subtle)" : "transparent"} opacity=".7" />
                                {series.map((s, si) => {
                                    const v = Number(s.values[i]) || 0;
                                    const bh = (v / top) * h;
                                    const x = stacked ? x0 : x0 + si * (bw + 4);
                                    const y = stacked ? m.t + h - ((acc + v) / top) * h : m.t + h - bh;
                                    acc += v;
                                    if (bh <= 0) return null;
                                    const rad = Math.min(stacked ? 6 : 12, bw / 2, bh);
                                    const d = `M${x},${y + bh}V${y + rad}Q${x},${y} ${x + rad},${y}H${x + bw - rad}Q${x + bw},${y} ${x + bw},${y + rad}V${y + bh}Z`;
                                    const c = colorOf(si, i);
                                    const delay = `${i * 80 + si * 60}ms`;
                                    return (
                                        <g key={s.name + si}>
                                            {!stacked && <rect className="kc-ghost" x={x} y={m.t} width={bw} height={h} rx={Math.min(12, bw / 2)} />}
                                            <g className="kc-barwrap" style={{ opacity: hover === null || hover === i ? 1 : 0.45 }}>
                                                <g className="kc-bar" style={{ "--d": delay, transformBox: "fill-box" }}>
                                                    <path d={d} fill={`url(#${uid}-g${i}-${si})`} />
                                                </g>
                                            </g>
                                            {showPct && v > 0 && (
                                                <text className="kc-pct" x={x + bw / 2} y={y - 7} textAnchor="middle" style={{ fill: `color-mix(in srgb, ${c} 75%, var(--k-ink))`, fontSize: pctSize, "--d": `${500 + i * 80 + si * 60}ms` }}>
                                                    {pctOf(v, i, si)}%
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                                <text className="kc-axis" x={m.l + band * i + band / 2} y={height - 10} textAnchor="middle">
                                    <title>{l}</title>
                                    {clip(l)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
            {hover !== null && (
                <Tip
                    x={m.l + band * hover + band / 2}
                    width={width}
                    title={labels[hover]}
                    rows={(() => {
                        const all = series.map((s, si) => {
                            const v = Number(s.values[hover]) || 0;
                            return { name: stacked ? s.name : `${s.name} · ${pctOf(v, hover, si)}%`, value: v, color: colorOf(si, hover) };
                        });
                        const nz = stacked ? all.filter((r) => r.value > 0) : all;
                        return nz.length ? nz : all.slice(0, 1);
                    })()}
                />
            )}
        </div>
    );
}

export function HBars({ rows, suffix = "", max, showValue = true }) {
    const [ref, inView] = useInView();
    const [bind, renderTip, tipPos] = useFloatTip();
    const [activeRaw, setActive] = useState(null);
    const active = tipPos ? activeRaw : null;
    const top = max ?? Math.max(1, ...rows.map((r) => Number(r.value) || 0));
    const sum = rows.reduce((s, r) => s + (Number(r.value) || 0), 0);
    const ar = active !== null ? rows[active] : null;
    const tipContent = ar && {
        title: ar.label,
        rows: [
            { name: suffix === "%" || String(ar.display || "").endsWith("%") ? "Rate" : "Count", value: ar.value, display: ar.display ?? `${fmtNum(ar.value)}${suffix}`, color: ar.color || SERIES[active % SERIES.length] },
            ...(ar.note ? [{ name: ar.note, value: 0, display: "", color: "transparent" }] : !suffix && sum > 0 && !ar.display ? [{ name: "Share of total", value: 0, display: `${Math.round(((Number(ar.value) || 0) / sum) * 100)}%`, color: "var(--k-faint)" }] : []),
        ],
    };
    return (
        <ul
            ref={ref}
            data-in={inView}
            className="space-y-3.5"
            {...bind}
            onMouseLeave={(e) => {
                setActive(null);
                bind.onMouseLeave(e);
            }}
        >
            {rows.map((r, i) => {
                const pct = top > 0 ? (Number(r.value) / top) * 100 : 0;
                return (
                    <li key={`${r.label}-${i}`} className="kc-hrow" data-active={active === i || undefined} onMouseEnter={() => setActive(i)} onTouchStart={() => setActive(i)} onMouseLeave={() => setActive(null)}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-ink-2" title={r.label}>
                                {r.label}
                            </span>
                            {showValue && (
                                <span className="shrink-0 font-bold tabular-nums text-ink" style={{ color: `color-mix(in srgb, ${r.color || SERIES[i % SERIES.length]} 80%, var(--k-ink))` }}>
                                    {r.display ?? `${fmtNum(r.value)}${suffix}`}
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{ background: C.track }}>
                            <div className="kc-hbar h-full rounded-full" style={{ width: `${Math.max(pct, r.value > 0 ? 2 : 0)}%`, background: r.color || SERIES[i % SERIES.length], "--d": `${i * 90}ms` }} />
                        </div>
                        {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
                    </li>
                );
            })}
            {renderTip(tipContent)}
        </ul>
    );
}

export function Progress({ value, color = C.brand, height = 10, delay = 0, name, valueName = "Done" }) {
    const [ref, inView] = useInView();
    const [bind, renderTip] = useFloatTip();
    const v = clamp(value);
    return (
        <div ref={ref} data-in={inView} className="kc-hov w-full overflow-hidden rounded-full" style={{ height, background: C.track }} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={name} {...bind}>
            <div className="kc-hbar h-full rounded-full" style={{ width: `${v}%`, background: color, "--d": `${delay}ms` }} />
            {renderTip({ title: name, rows: [{ name: valueName, value: v, display: `${fmtNum(v)}%`, color }] })}
        </div>
    );
}

export function Sparkline({ values, color = C.brand, width = 96, height = 32, labels, name = "Value" }) {
    const [ref, inView] = useInView();
    const [bind, renderTip, tipPos] = useFloatTip();
    const [idxRaw, setIdx] = useState(null);
    const idx = tipPos ? idxRaw : null;
    if (!values || values.length < 2) return null;
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => ({ x: 2 + (i / (values.length - 1)) * (width - 4), y: height - 3 - (v / max) * (height - 6) }));
    const onMove = (e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        const i = Math.round(((cx - box.left) / box.width) * (values.length - 1));
        setIdx(Math.max(0, Math.min(values.length - 1, i)));
        if (e.touches) bind.onTouchMove(e);
        else bind.onMouseMove(e);
    };
    return (
        <svg
            ref={ref}
            data-in={inView}
            width={width}
            height={height}
            aria-hidden="true"
            className="kc-hov"
            onMouseMove={onMove}
            onTouchStart={onMove}
            onTouchMove={onMove}
            onTouchCancel={bind.onTouchCancel}
            onMouseLeave={(e) => {
                setIdx(null);
                bind.onMouseLeave(e);
            }}
        >
            <path className="kc-line" d={curve(pts)} fill="none" style={{ stroke: color }} strokeWidth="2" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={inView ? 0 : 1} />
            {idx !== null && <circle cx={pts[idx].x} cy={pts[idx].y} r="3" style={{ fill: "var(--k-surface)", stroke: color }} strokeWidth="2" />}
            {idx !== null && renderTip({ title: labels?.[idx], rows: [{ name, value: values[idx], color }] })}
        </svg>
    );
}

export function Legend({ items }) {
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-3">
            {items.map((it, ki) => (
                <span key={`${it.label}-${ki}`} className="inline-flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
                    {it.label}
                    {it.value !== undefined && <b className="tabular-nums text-ink">{fmtNum(it.value)}</b>}
                </span>
            ))}
        </div>
    );
}

export function ChartTable({ head, rows, summary = "Show data as table" }) {
    return (
        <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-brand-ink">{summary}</summary>
            <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[280px] text-left">
                    <thead>
                        <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                            {head.map((h) => (
                                <th key={h} className="py-2 pr-4 font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className="border-b border-line last:border-0">
                                {r.map((c, j) => (
                                    <td key={j} className={`py-2 pr-4 ${j ? "tabular-nums text-ink" : "text-ink-2"}`}>
                                        {typeof c === "number" ? fmtNum(c) : c}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}
