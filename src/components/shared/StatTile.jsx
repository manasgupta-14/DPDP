import { Link } from "react-router-dom";
import { CountUp, fmtNum, useFloatTip, useInView } from "../charts/kit.jsx";
import Icon from "./Icon.jsx";


const TONES = {
    info: { ink: "text-brand-ink", ico: "bg-brand-soft text-brand-ink", bar: "var(--k-brand)", tint: "kd-tint-info" },
    ok: { ink: "text-ok-ink", ico: "bg-ok-soft text-ok-ink", bar: "var(--k-ok)", tint: "kd-tint-ok" },
    warn: { ink: "text-warn-ink", ico: "bg-warn-soft text-warn-ink", bar: "var(--k-warn)", tint: "kd-tint-warn" },
    bad: { ink: "text-bad-ink", ico: "bg-bad-soft text-bad-ink", bar: "var(--k-bad)", tint: "kd-tint-bad" },
    violet: { ink: "text-violet-ink", ico: "bg-violet/12 text-violet-ink", bar: "var(--k-violet)", tint: "kd-tint-violet" },
    muted: { ink: "text-ink", ico: "bg-subtle text-ink-3", bar: "var(--k-faint)", tint: "kd-tint-muted" },
};

export default function StatTile({ label, value, hint, tone = "info", icon, total, colorValue = false, onClick, pressed, to, className = "" }) {
    const t = TONES[tone] || TONES.info;
    const [ref, inView] = useInView();
    const isNum = typeof value === "number" && Number.isFinite(value);
    const share = isNum && total > 0 ? Math.min(100, (value / total) * 100) : null;
    const [bind, renderTip] = useFloatTip();
    const showTip = share !== null && value !== total;
    const hover = showTip ? bind : {};

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <p className="kv-cap text-[13px] font-medium text-ink-3">{label}</p>
                {icon && (
                    <span className={`kd-ico kd-ico-glow ${t.ico}`}>
                        <Icon name={icon} />
                    </span>
                )}
            </div>
            <p className={`kd-big mt-2 text-[32px] ${colorValue ? t.ink : ""}`}>{isNum ? <CountUp value={value} /> : value ?? "—"}</p>
            {share !== null && (
                <div ref={ref} data-in={inView} className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--k-track)" }} aria-hidden>
                    <div className="kc-hbar h-full rounded-full" style={{ width: `${Math.max(share, value > 0 ? 3 : 0)}%`, background: t.bar }} />
                </div>
            )}
            {showTip && renderTip({ title: label, rows: [{ name: `${fmtNum(value)} of ${fmtNum(total)}`, value: share, display: `${Math.round(share)}%`, color: t.bar }] })}
            {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
        </>
    );

    const cls = `kd-card kd-tile ${t.tint} block p-5 text-left ${pressed ? "is-pressed" : ""} ${className}`;
    if (to)
        return (
            <Link to={to} className={cls} {...hover}>
                {body}
            </Link>
        );
    if (onClick)
        return (
            <button type="button" onClick={onClick} aria-pressed={pressed} className={`${cls} focus:outline-none focus-visible:ring-2 focus-visible:ring-focus`} {...hover}>
                {body}
            </button>
        );
    return (
        <div className={cls} {...hover}>
            {body}
        </div>
    );
}
