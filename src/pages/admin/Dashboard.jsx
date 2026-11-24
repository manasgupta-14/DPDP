import { startTransition, useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { loadExecutiveData, takeExecutive } from "../../api/executive.js";
import { getProfile, roleInfo } from "../../auth/authStore.js";
import { AreaChart, BAR3D, C, ColumnChart, CountUp, Donut, HBars, Legend, Progress, Ring, fmtNum } from "../../components/charts/kit.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import WelcomeHero from "../../components/shared/WelcomeHero.jsx";
import Defer from "../../components/shared/Defer.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { buildExecutive, executiveToCsv } from "../../utils/executive.js";


const TONE_TEXT = { ok: "text-ok-ink", warn: "text-warn-ink", bad: "text-bad-ink", info: "text-brand-ink", muted: "text-muted" };
const TONE_ICON_BG = { ok: "bg-ok-soft text-ok-ink", warn: "bg-warn-soft text-warn-ink", bad: "bg-bad-soft text-bad-ink", info: "bg-brand-soft text-brand-ink", muted: "bg-subtle text-muted", violet: "bg-violet/12 text-violet-ink" };

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function rise(i) {
    return { animation: `pg-rise .55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` };
}

function download(model) {
    const blob = new Blob([executiveToCsv(model)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kavach-executive-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

const CARD_TINTS = [C.brand, C.violet, C.teal, C.amber, C.pink, C.sky, C.lime, C.orange, C.indigo];
const TONE_TINT = { ok: C.ok, warn: C.amber, bad: C.red, info: C.brand, violet: C.violet, muted: C.sky };
const tint = (i, extra) => ({ ...extra, "--kv-tint": CARD_TINTS[i % CARD_TINTS.length] });

function Card({ title, sub, action, children, className = "", i = 0, ...rest }) {
    return (
        <section className={`kd-card kv-glow-border min-w-0 p-5 ${className}`} style={tint(i, rise(i))} {...rest}>
            {(title || action) && (
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {title && <h2 className="kd-title">{title}</h2>}
                        {sub && <p className="kd-sub">{sub}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

const HEALTH_COLORS = [C.brand, C.teal, C.violet, C.orange, C.pink, C.lime];

function NoAccess({ text = "You do not have access to this data." }) {
    return (
        <p className="flex items-center gap-2 rounded-lg bg-soft px-3 py-3 text-sm text-muted">
            <Icon name="lock" className="h-4 w-4" />
            {text}
        </p>
    );
}

function Kpi({ label, value, icon, tone = "info", note, noteTone = "muted", to, i }) {
    const body = (
        <>
            <div className="flex items-center justify-between gap-3">
                <p className="kv-cap text-[13px] font-medium text-ink-3">{label}</p>
                <span className={`kd-ico kd-ico-glow ${TONE_ICON_BG[tone]}`}>
                    <Icon name={icon} />
                </span>
            </div>
            <p className={`kd-big kd-num kd-num-${tone} mt-3 text-[34px]`}>{value === null || value === undefined ? <span className="text-faint">—</span> : <CountUp value={value} />}</p>
            {note && (
                <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${TONE_TEXT[noteTone]}`}>
                    {noteTone === "ok" && <Icon name="trendUp" className="h-3.5 w-3.5" />}
                    {noteTone === "bad" && <Icon name="alert" className="h-3.5 w-3.5" />}
                    {note}
                </p>
            )}
        </>
    );
    return to ? (
        <Link to={to} className={`kd-card kv-glow-border kd-kpi kd-kpi-${tone} pg-card block p-5`} style={{ ...rise(i), "--kv-tint": TONE_TINT[tone] }} aria-label={`${label}: ${value ?? "no data"}. Open`}>
            {body}
        </Link>
    ) : (
        <div className={`kd-card kv-glow-border kd-kpi kd-kpi-${tone} p-5`} style={{ ...rise(i), "--kv-tint": TONE_TINT[tone] }}>
            {body}
        </div>
    );
}

function ModuleModal({ mod, onClose }) {
    return (
        <Modal title={mod.title} onClose={onClose}>
            <div className="rounded-[16px] border border-line bg-surface p-6 shadow-[var(--k-shadow-lg)]">
                <h2 className="pr-10 text-xl font-bold text-ink">{mod.title}</h2>
                <p className="mt-0.5 font-mono text-xs text-muted">
                    {mod.codes} · Max ₹{mod.max} Cr
                </p>

                <div className={`mt-5 flex items-center gap-4 rounded-xl border p-4 ${mod.band.tone === "ok" ? "border-ok/25 bg-ok-soft" : mod.band.tone === "warn" ? "border-warn/25 bg-warn-soft" : mod.band.tone === "bad" ? "border-bad/25 bg-bad-soft" : "border-line bg-soft"}`}>
                    <p className={`kd-big text-[40px] ${TONE_TEXT[mod.band.tone]}`}>{mod.score ?? "—"}</p>
                    <div className="min-w-0 flex-1">
                        <Progress value={mod.score ?? 0} color={mod.band.color} name={mod.title} valueName={mod.band.label || "Score"} />
                        <p className={`mt-1.5 text-sm font-semibold ${TONE_TEXT[mod.band.tone]}`}>{mod.band.label}</p>
                    </div>
                </div>

                <h3 className="mt-6 text-sm font-bold text-ink">How this score is worked out</h3>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {mod.sections.map((x) => (
                        <li key={x.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <span className="min-w-0">
                                <span className="font-mono text-xs text-muted">{x.code}</span> <span className="font-medium text-ink-2">{x.name}</span>
                            </span>
                            <span className="shrink-0 text-xs text-muted">{x.detail}</span>
                        </li>
                    ))}
                </ul>

                <h3 className="mt-6 text-sm font-bold text-ink">Identified gaps</h3>
                {mod.gaps.length ? (
                    <ul className="mt-2 space-y-1.5">
                        {mod.gaps.map((g) => (
                            <li key={g} className="flex items-start gap-2 text-sm text-ink-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bad" />
                                {g}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-ok-ink">No gaps found in your current records.</p>
                )}

                <h3 className="mt-6 text-sm font-bold text-ink">Recommendations</h3>
                <ul className="mt-2 space-y-1.5">
                    {mod.recs.map((r) => (
                        <li key={r} className="flex items-start gap-2 text-sm text-ink-2">
                            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-ok-ink" />
                            {r}
                        </li>
                    ))}
                </ul>

                <div className="mt-7 flex flex-wrap gap-2">
                    <Link to={mod.to} className="kd-btn is-primary flex-1 justify-center py-2.5">
                        Open {mod.title.toLowerCase()}
                        <Icon name="arrowRight" className="h-4 w-4" />
                    </Link>
                    <button type="button" onClick={onClose} className="kd-btn py-2.5">
                        Close
                    </button>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-faint">Calculated live from your Kavach records.</p>
            </div>
        </Modal>
    );
}

function Skeleton() {
    return (
        <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="pg-shimmer h-[132px] rounded-[14px]" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="pg-shimmer h-56 rounded-[14px]" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="pg-shimmer h-72 rounded-[14px]" />
                <div className="pg-shimmer h-72 rounded-[14px]" />
            </div>
        </div>
    );
}

function consentNote(m) {
    const base = m.kpi.consentBase;
    const share = base ? Math.round(((m.kpi.activeConsents || 0) / base) * 100) : null;
    if (share !== null && share <= 100) return `${share}% of users`;
    if (m.consent) return `${m.consent.rate}% of records active`;
    return "Across all purposes";
}

export default function Dashboard() {
    const location = useLocation();
    const profile = getProfile();
    const info = roleInfo(profile);
    const firstName = String(profile?.name || "").trim().split(/\s+/)[0] || "";
    const [banner, setBanner] = useState(!!location.state?.justLoggedIn);
    const [state, setState] = useState({ loading: true, model: null, error: "" });
    const [refreshing, setRefreshing] = useState(false);
    const [round, setRound] = useState(0);
    const [openMod, setOpenMod] = useState(null);

    const load = useCallback(async () => {
        const data = await loadExecutiveData();
        const model = buildExecutive(data);
        setState({ loading: false, model, error: model.error });
    }, []);

    useEffect(() => {
        let active = true;
        takeExecutive().then((data) => {
            if (!active) return;
            const model = buildExecutive(data);
            startTransition(() => setState({ loading: false, model, error: model.error }));
        });
        return () => {
            active = false;
        };
    }, []);

    const refresh = async () => {
        setRefreshing(true);
        await load();
        setRound((r) => r + 1);
        setRefreshing(false);
    };

    const m = state.model;
    const updated = m?.loadedAt ? m.loadedAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

    return (
        <div className="space-y-5">
            {banner && (
                <Alert tone="success" action={<button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="rounded-md px-2 text-lg leading-none text-ok-ink hover:bg-ok/10">&times;</button>}>
                    <b>Login successful.</b> You are signed in to your Kavach {info.label} workspace.
                </Alert>
            )}

            <WelcomeHero
                style={rise(0)}
                greeting={greeting()}
                name={firstName}
                sub="Your privacy work at a glance."
                meta={
                    <>
                        {m?.org && <span className="font-medium">{m.org}</span>}
                        {m?.org && <span aria-hidden>·</span>}
                        <span className="inline-flex items-center gap-1.5">
                            <span className="kv-live-dot" /> Live
                        </span>
                        {updated && <span>· Last updated {updated}</span>}
                    </>
                }
                actions={
                    <>
                        <button type="button" onClick={refresh} disabled={state.loading || refreshing} className="kd-btn">
                            <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            {refreshing ? "Refreshing" : "Refresh"}
                        </button>
                        <Link to="/dashboard/reports" className="kd-btn">
                            <Icon name="barChart" className="h-4 w-4" />
                            Reports
                        </Link>
                        <button type="button" onClick={() => m && download(m)} disabled={!m} className="kd-btn is-primary">
                            <Icon name="download" className="h-4 w-4" />
                            Export summary
                        </button>
                    </>
                }
            />

            {state.loading && <Skeleton />}
            {m?.error && <Alert action={<button type="button" onClick={refresh} className="shrink-0 font-semibold underline">Retry</button>}>{m.error}</Alert>}

            {m && (
                <div key={round} className="space-y-5">
                    {m.attention && (
                        <div className={`pg-alert flex flex-wrap items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-sm ${m.attention.tone === "bad" ? "border-bad/25 bg-bad-soft" : "border-warn/30 bg-warn-soft"}`}>
                            <span className={`flex items-center gap-2.5 font-medium ${m.attention.tone === "bad" ? "text-bad-ink" : "text-warn-ink"}`}>
                                <Icon name="alert" className="h-4 w-4 shrink-0" />
                                <span className="text-ink">{m.attention.text}</span>
                            </span>
                            <Link to={m.attention.to} className="kd-btn py-1.5 text-xs">
                                {m.attention.action}
                                <Icon name="arrowRight" className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}


                    <Card i={12} title="Health at a glance" sub="Six quick checks">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                            {m.health.map((h, hi) => (
                                <Link key={h.key} to={h.to} className="kd-tile-tint group flex flex-col items-center rounded-xl border border-line px-2 py-4 text-center" style={{ "--kv-tint": HEALTH_COLORS[hi % HEALTH_COLORS.length] }}>
                                    <Ring value={h.value ?? 0} size={92} stroke={9} color={HEALTH_COLORS[hi % HEALTH_COLORS.length]} label={`${h.label}: ${h.value ?? "no data"}`} tip={{ title: h.label, rows: [{ name: h.band.label || "Score", value: h.value, display: h.value === null ? "No data" : `${Math.round(h.value)}%`, color: HEALTH_COLORS[hi % HEALTH_COLORS.length] }] }}>
                                        <span className="kd-big text-[19px]" style={{ color: `color-mix(in srgb, ${HEALTH_COLORS[hi % HEALTH_COLORS.length]} 80%, var(--k-ink))` }}>{h.value === null ? "—" : <CountUp value={Math.round(h.value)} suffix="%" />}</span>
                                    </Ring>
                                    <p className="kv-cap mt-2.5 text-[13px] font-semibold text-ink">{h.label}</p>
                                    <p className={`text-[11px] font-medium ${TONE_TEXT[h.band.tone]}`}>{h.band.label}</p>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    <Defer height={560}>
                        <div className="grid gap-4 lg:grid-cols-3">
                            {[
                                {
                                    i: 15,
                                    title: "Grievances",
                                    sub: "Complaints by status",
                                    to: "/dashboard/grievances",
                                    data: m.grievanceMix,
                                    parts: m.grievanceMix ? [
                                        { label: "Open", value: m.grievanceMix.open, color: C.amber },
                                        { label: "In progress", value: m.grievanceMix.progress, color: C.brand },
                                        { label: "Resolved", value: m.grievanceMix.resolved, color: C.ok },
                                        { label: "Escalated", value: m.grievanceMix.escalated, color: C.red },
                                    ] : [],
                                    center: m.grievanceMix?.total,
                                    caption: "grievances",
                                },
                                {
                                    i: 16,
                                    title: "DPIA reviews",
                                    sub: "Assessments by decision",
                                    to: "/dashboard/dpia",
                                    data: m.dpiaMix,
                                    parts: m.dpiaMix ? [
                                        { label: "Approved", value: m.dpiaMix.approved, color: C.ok },
                                        { label: "Waiting", value: m.dpiaMix.pending, color: C.amber },
                                        { label: "Needs changes", value: m.dpiaMix.changes, color: C.brand },
                                    ] : [],
                                    center: m.dpiaMix?.total,
                                    caption: "DPIAs",
                                },
                                {
                                    i: 17,
                                    title: "Data by category",
                                    sub: "Data points in your inventory",
                                    to: "/dashboard/inventory",
                                    data: m.categories,
                                    parts: (m.categories || []).map((c, k) => ({ label: c.label, value: c.value, color: [C.brand, C.teal, C.violet, C.amber, C.sky][k % 5] })),
                                    center: m.inventory?.total,
                                    caption: "data points",
                                },
                            ].map((d) => (
                                <Card key={d.title} i={d.i} title={d.title} sub={d.sub} action={<Link to={d.to} className="kd-link">Open</Link>}>
                                    {d.data ? (
                                        d.center ? (
                                            <div className="flex items-center gap-4">
                                                <Donut parts={d.parts} size={132} stroke={18} name={d.title}>
                                                    <div>
                                                        <p className="kd-big kd-num kd-num-info text-[24px]">
                                                            <CountUp value={d.center} />
                                                        </p>
                                                        <p className="text-[10px] text-muted">{d.caption}</p>
                                                    </div>
                                                </Donut>
                                                <ul className="min-w-0 flex-1 space-y-1.5">
                                                    {d.parts.map((p, ki) => (
                                                        <li key={`${p.label}-${ki}`} className="flex items-center justify-between gap-2 text-[13px]">
                                                            <span className="inline-flex min-w-0 items-center gap-2 text-ink-2">
                                                                <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                                                                <span className="truncate">{p.label}</span>
                                                            </span>
                                                            <b className="tabular-nums" style={{ color: `color-mix(in srgb, ${p.color} 78%, var(--k-ink))` }}>{fmtNum(p.value)}</b>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="py-10 text-center text-sm text-muted">Nothing recorded yet.</p>
                                        )
                                    ) : (
                                        <NoAccess />
                                    )}
                                </Card>
                            ))}
                        </div>
                    </Defer>

                    <Defer height={700}>
                        <div className="grid gap-4 lg:grid-cols-3">
                            <Card i={5} title="Compliance score" sub="Worked out live from your records">
                                <div className="flex items-center gap-5">
                                    <Ring value={m.score ?? 0} color={m.scoreBand.color} size={128} stroke={12} label={`Compliance score ${m.score ?? "no data"}`} tip={{ title: "Compliance score", rows: [{ name: m.scoreBand.label || "Score", value: m.score, display: m.score === null || m.score === undefined ? "No data" : `${m.score} / 100`, color: m.scoreBand.color }] }}>
                                        <div>
                                            <p className={`kd-big kd-num kd-num-${m.scoreBand.tone} text-[30px]`}>{m.score === null || m.score === undefined ? "—" : <CountUp value={m.score} suffix="%" />}</p>
                                            <p className="text-[11px] text-muted">score</p>
                                        </div>
                                    </Ring>
                                    <div className="min-w-0 space-y-2">
                                        <span className={`kd-pill is-${m.scoreBand.tone === "muted" ? "muted" : m.scoreBand.tone}`}>{m.scoreBand.label}</span>
                                        <p className="text-sm text-ink-3">
                                            <b className="text-ok-ink">{m.sections.filter((x) => x.score !== null && x.score >= 80).length}</b> of {m.sections.length} DPDP areas in good standing.
                                        </p>
                                        {m.atRisk.length > 0 && (
                                            <p className="text-xs text-bad-ink">
                                                {m.atRisk.length} area{m.atRisk.length === 1 ? "" : "s"} at risk
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Card i={6} title="Penalty exposure" sub="Highest fine if gaps stay open">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 ${m.exposure ? "border-bad/30 bg-bad-soft text-bad-ink" : "border-ok/30 bg-ok-soft text-ok-ink"}`}>
                                        <Icon name="shield" className="h-4 w-4" />
                                        <span className="kd-big text-[28px] text-current">
                                            ₹<CountUp value={m.exposure} /> Cr
                                        </span>
                                    </span>
                                </div>
                                <p className={`mt-3 text-xs font-medium ${m.exposure ? "text-bad-ink" : "text-ok-ink"}`}>{m.exposure ? `${m.atRisk.length} area${m.atRisk.length === 1 ? "" : "s"} below 60% · ${m.watch.length} to watch` : "No area is below 60% right now"}</p>
                                <ul className="mt-3 space-y-1.5">
                                    {[...m.atRisk, ...m.watch].slice(0, 3).map((x) => (
                                        <li key={x.key} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="truncate text-ink-2">
                                                <span className="font-mono text-muted">{x.code}</span> {x.name}
                                            </span>
                                            <span className={`shrink-0 font-semibold ${TONE_TEXT[x.band.tone]}`}>₹{x.max} Cr</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            <Card i={7} title="Active incidents" sub="Open breaches by severity" action={<Link to="/dashboard/breach" className="kd-link">Breach desk</Link>}>
                                {m.severity ? (
                                    <ul className="space-y-2.5">
                                        {[
                                            ["Critical", m.severity.critical, "text-bad-ink", "bg-bad"],
                                            ["High", m.severity.high, "text-warn-ink", "bg-warn"],
                                            ["Medium / Low", m.severity.medium + m.severity.low, "text-brand-ink", "bg-brand"],
                                            ["Not triaged", m.severity.unset, "text-muted", "bg-faint"],
                                        ].map(([l, v, ink, dot]) => (
                                            <li key={l} className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
                                                <span className="inline-flex items-center gap-2 text-sm text-ink-2">
                                                    <i className={`h-2 w-2 rounded-full ${dot}`} />
                                                    {l}
                                                </span>
                                                <span className={`kd-big text-[26px] ${v ? ink : "text-faint"}`}>
                                                    <CountUp value={v} />
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>
                        </div>
                    </Defer>

                    <Defer height={360}>
                        <Card i={11} title="Module health" sub="Score and highest fine for each area">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {m.modules.map((mod, idx) => (
                                    <button key={mod.key} type="button" onClick={() => setOpenMod(mod)} className="kd-tile-tint group rounded-xl border border-line p-4 text-left hover:shadow-[var(--k-shadow)]" style={{ "--kv-tint": mod.band.color || CARD_TINTS[idx % CARD_TINTS.length] }}>
                                        <div className="flex items-center gap-2">
                                            <span className={`grid h-6 w-6 place-items-center rounded-full ${TONE_ICON_BG[mod.band.tone]}`}>
                                                <Icon name={mod.band.tone === "ok" ? "check" : mod.band.tone === "muted" ? "info" : "alert"} className="h-3.5 w-3.5" strokeWidth={2.2} />
                                            </span>
                                            <span className={`kd-big text-[28px] ${TONE_TEXT[mod.band.tone]}`}>{mod.score === null ? "—" : <CountUp value={mod.score} suffix="%" />}</span>
                                        </div>
                                        <div className="mt-3">
                                            <Progress value={mod.score ?? 0} color={mod.band.color} height={6} delay={idx * 90} name={mod.title} valueName={mod.band.label || "Score"} />
                                        </div>
                                        <p className="mt-3 text-sm font-semibold leading-snug text-ink">{mod.title}</p>
                                        <p className="mt-1 font-mono text-[11px] text-muted">
                                            {mod.codes} · Max ₹{mod.max} Cr
                                        </p>
                                        <span className="kd-link mt-2">
                                            Details <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </Defer>

                    <Defer height={700}>
                        <div className="grid gap-4 lg:grid-cols-5">
                            <Card i={8} className="lg:col-span-2" title="Rights request deadlines" sub="Open requests vs. the 30-day limit" action={<Link to="/dashboard/rights-requests" className="kd-link">View all</Link>}>
                                {m.requests ? (
                                    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
                                        <Donut
                                            size={164}
                                            stroke={20}
                                            parts={[
                                                { label: "On time", value: m.requests.onTrack, color: C.ok },
                                                { label: "Overdue", value: m.requests.overdue, color: C.bad },
                                                { label: "Closed", value: m.requests.done, color: C.brand },
                                            ]}
                                        >
                                            <div>
                                                <p className={`kd-big kd-num kd-num-${m.requests.overdue ? "warn" : "ok"} text-[28px]`}>{m.requests.open ? <CountUp value={Math.round((m.requests.onTrack / m.requests.open) * 100)} suffix="%" /> : "100%"}</p>
                                                <p className="text-[11px] text-muted">on time</p>
                                            </div>
                                        </Donut>
                                        <div className="w-full min-w-0 flex-1 space-y-2">
                                            {[
                                                ["On time", m.requests.onTrack, C.ok],
                                                ["Overdue", m.requests.overdue, C.bad],
                                                ["Closed", m.requests.done, C.brand],
                                            ].map(([l, v, c]) => (
                                                <div key={l} className="kd-tile-tint flex items-center justify-between rounded-lg px-3 py-2 text-sm" style={{ "--kv-tint": c }}>
                                                    <span className="inline-flex items-center gap-2 text-ink-2">
                                                        <i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                                                        {l}
                                                    </span>
                                                    <b className="tabular-nums" style={{ color: `color-mix(in srgb, ${c} 80%, var(--k-ink))` }}>{fmtNum(v)}</b>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>

                            <Card i={9} className="lg:col-span-3" title="Consent over time" sub="New and still-active consents per month" action={m.consent ? <Legend items={[{ label: "Recorded", color: C.brand }, { label: "Still active", color: C.teal }]} /> : null}>
                                {m.consent ? (
                                    m.consent.total ? (
                                        <AreaChart
                                            labels={m.consent.trend.labels}
                                            series={[
                                                { name: "Recorded", values: m.consent.trend.recorded, color: C.brand },
                                                { name: "Still active", values: m.consent.trend.stillActive, color: C.teal, dashed: true },
                                            ]}
                                            height={230}
                                            ariaLabel="Consent records per month"
                                        />
                                    ) : (
                                        <p className="py-10 text-center text-sm text-muted">No consent recorded yet. Publish a notice and send a campaign to start.</p>
                                    )
                                ) : m.campaigns.length ? (
                                    <ColumnChart labels={m.campaigns.slice(0, 6).map((c) => c.title)} series={[{ name: "Accepted", values: m.campaigns.slice(0, 6).map((c) => c.accepted), color: C.ok }, { name: "Rejected", values: m.campaigns.slice(0, 6).map((c) => c.rejected), color: C.red }]} />
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>
                        </div>
                    </Defer>

                    <Defer height={600}>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card i={12} title="Consent by purpose" sub="Share of people who allowed each purpose" action={<Link to="/dashboard/purposes" className="kd-link">Purposes</Link>}>
                                {m.consent ? (
                                    m.consent.purposes.length ? (
                                        <HBars rows={m.consent.purposes.map((p, i) => ({ label: p.label, value: p.rate, display: `${p.rate}%`, note: `${fmtNum(p.allowed)} of ${fmtNum(p.total)} allowed`, color: [C.brand, C.teal, C.violet, C.amber, C.sky, C.red][i % 6] }))} max={100} />
                                    ) : (
                                        <p className="py-8 text-center text-sm text-muted">No purpose decisions recorded yet.</p>
                                    )
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>

                            <Card
                                i={13}
                                title="Campaign performance"
                                sub={m.campaignTotals ? `${m.campaigns.length} campaign${m.campaigns.length === 1 ? "" : "s"} · ${fmtNum(m.campaignTotals.total)} responses` : "Responses by campaign"}
                                action={<Link to="/dashboard/campaigns" className="kd-link">View all</Link>}
                            >
                                {m.campaigns.length ? (
                                    <>
                                        <ColumnChart
                                            labels={m.campaigns.slice(0, 6).map((c) => c.title)}
                                            series={[
                                                { name: "Accepted", values: m.campaigns.slice(0, 6).map((c) => c.accepted), color: C.ok },
                                                { name: "Rejected", values: m.campaigns.slice(0, 6).map((c) => c.rejected), color: C.red },
                                                { name: "Completed", values: m.campaigns.slice(0, 6).map((c) => c.completed), color: C.sky },
                                            ]}
                                            height={220}
                                            ariaLabel="Accepted, rejected and completed responses per campaign"
                                        />
                                        <div className="mt-3">
                                            <Legend items={[{ label: "Accepted", color: C.ok, value: m.campaignTotals.accepted }, { label: "Rejected", color: C.red, value: m.campaignTotals.rejected }, { label: "Completed", color: C.sky, value: m.campaignTotals.completed }]} />
                                        </div>
                                    </>
                                ) : (
                                    <p className="py-8 text-center text-sm text-muted">No campaign responses yet. Create a campaign to start collecting consent.</p>
                                )}
                            </Card>
                        </div>
                    </Defer>

                    <Defer height={480}>
                        <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            <Kpi i={1} label="Staff users" icon="users" tone="info" value={m.kpi.users} note="Accounts in your organisation" to="/dashboard/add-users" />
                            <Kpi i={2} label="Data principals" icon="adduser" tone="violet" value={m.kpi.principals} note="Customers on record" to="/dashboard/data-principals" />
                            <Kpi
                                i={3}
                                label="Consents granted"
                                icon="consent"
                                tone="ok"
                                value={m.kpi.activeConsents}
                                note={consentNote(m)}
                                noteTone="ok"
                                to="/dashboard/consent"
                            />
                            <Kpi i={4} label="Open rights requests" icon="rights" tone="warn" value={m.kpi.pending} note={m.kpi.slaRisk ? `${m.kpi.slaRisk} past 30-day deadline` : "All within deadline"} noteTone={m.kpi.slaRisk ? "bad" : "ok"} to="/dashboard/rights-requests" />
                            <Kpi i={5} label="Data breaches" icon="alert" tone="bad" value={m.kpi.breaches} note={m.kpi.openBreaches ? `${m.kpi.openBreaches} still open` : m.kpi.openBreaches === 0 ? "None open" : "Recorded in total"} noteTone={m.kpi.openBreaches ? "bad" : "ok"} to="/dashboard/breach" />
                        </section>
                    </Defer>

                    <Defer height={300}>
                        <Card i={10} title="Data inventory coverage" sub="Data with purpose, lawful basis, storage and retention recorded" action={<Link to="/dashboard/inventory" className="kd-link">Open inventory <Icon name="arrowRight" className="h-3.5 w-3.5" /></Link>}>
                            {m.inventory ? (
                                <div>
                                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                        <span className="text-ink-3">
                                            <b className="text-ink">{m.inventory.documented}</b> of <b className="text-ink">{m.inventory.total}</b> data points documented
                                        </span>
                                        <span className={`kd-big kd-num kd-num-${m.inventory.coverage >= 80 ? "ok" : m.inventory.coverage >= 60 ? "warn" : "bad"} text-[22px]`}>
                                            <CountUp value={m.inventory.coverage} suffix="%" />
                                        </span>
                                    </div>
                                    <div className="mt-2.5">
                                        <Progress value={m.inventory.coverage} color={m.inventory.coverage >= 80 ? C.ok : m.inventory.coverage >= 60 ? C.warn : C.bad} height={12} name="Data points fully described" valueName="Covered" />
                                    </div>
                                    {m.inventory.missing.length > 0 && <p className="mt-2 text-xs font-medium text-warn-ink">{m.inventory.missing.length} data point{m.inventory.missing.length === 1 ? " is" : "s are"} missing a purpose, lawful basis, whose data, storage place or retention period.</p>}
                                </div>
                            ) : (
                                <NoAccess />
                            )}
                        </Card>
                    </Defer>

                    <Defer height={420}>
                        {m.checklist && (
                            <Card
                                i={13}
                                title="Compliance checklist"
                                sub="Each DPDP duty, checked against your records"
                                action={
                                    <Link to="/dashboard/checklist" className="kd-link">
                                        View checklist <Icon name="arrowRight" className="h-3.5 w-3.5" />
                                    </Link>
                                }
                            >
                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                                    <div>
                                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                            <span className="text-ink-3">
                                                <b className="text-ink">{m.checklist.complete}</b> of <b className="text-ink">{m.checklist.tracked}</b> tracked items complete
                                            </span>
                                            <span className={`kd-big kd-num kd-num-${m.checklist.progress >= 80 ? "ok" : m.checklist.progress >= 50 ? "warn" : "bad"} text-[22px]`}>
                                                <CountUp value={m.checklist.progress} suffix="%" />
                                            </span>
                                        </div>
                                        <div className="mt-3">
                                            <Progress value={m.checklist.progress} color={m.checklist.progress >= 80 ? C.ok : m.checklist.progress >= 50 ? C.amber : C.red} name={`${m.checklist.complete} of ${m.checklist.tracked} items complete`} valueName="Complete" />
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                            <div className="kd-tile-tint rounded-lg border px-2 py-2.5" style={{ "--kv-tint": C.ok }}>
                                                <p className="text-lg font-bold text-ok-ink">{m.checklist.complete}</p>
                                                <p className="text-[11px] font-medium text-ink-3">Complete</p>
                                            </div>
                                            <div className="kd-tile-tint rounded-lg border px-2 py-2.5" style={{ "--kv-tint": C.amber }}>
                                                <p className="text-lg font-bold text-warn-ink">{m.checklist.attention}</p>
                                                <p className="text-[11px] font-medium text-ink-3">Needs attention</p>
                                            </div>
                                            <div className="kd-tile-tint rounded-lg border px-2 py-2.5" style={{ "--kv-tint": C.muted }}>
                                                <p className="text-lg font-bold text-ink-2">{m.checklist.untracked}</p>
                                                <p className="text-[11px] font-medium text-ink-3">Tracked outside</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {m.checklist.items.filter((it) => it.status.key === "attention").slice(0, 4).map((it) => (
                                            <li key={it.id}>
                                                <Link to={it.to || "/dashboard/checklist"} className="kd-tile-tint flex items-start gap-3 rounded-lg border px-3 py-2.5" style={{ "--kv-tint": C.amber }}>
                                                    <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-warn-ink" />
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-semibold text-ink">{it.requirement}</span>
                                                        <span className="block text-xs text-ink-3">{it.evidence}</span>
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                        {m.checklist.attention === 0 && (
                                            <li className="flex items-center gap-2 rounded-lg border border-ok/25 bg-ok-soft px-3 py-3 text-sm text-ok-ink">
                                                <Icon name="check" className="h-4 w-4" /> Every tracked item is complete.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </Card>
                        )}
                    </Defer>

                    <Defer height={520}>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card i={13} title="Rights requests by type" sub="Access, correction, erasure and more" action={<Link to="/dashboard/rights-requests" className="kd-link">View all</Link>}>
                                {m.requests ? (
                                    m.requestTypes.length ? (
                                        <ColumnChart labels={m.requestTypes.map((r) => r.label)} series={[{ name: "Requests", values: m.requestTypes.map((r) => r.value) }]} barColors={BAR3D} height={250} ariaLabel="Rights requests by type" />
                                    ) : (
                                        <p className="py-10 text-center text-sm text-muted">No rights request yet.</p>
                                    )
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>
                            <Card i={14} title="Breaches over time" sub="Reported and closed each month" action={<Legend items={[{ label: "Closed", color: C.teal }, { label: "Still open", color: C.pink }]} />}>
                                {m.incidentTrend ? (
                                    <ColumnChart labels={m.incidentTrend.labels} series={[{ name: "Closed", values: m.incidentTrend.closed, color: C.teal }, { name: "Still open", values: m.incidentTrend.reported.map((v, k) => Math.max(0, v - (m.incidentTrend.closed[k] || 0))), color: C.pink }]} stacked height={230} ariaLabel="Breaches per month: closed and still open" />
                                ) : (
                                    <NoAccess />
                                )}
                            </Card>
                        </div>
                    </Defer>

                    <Defer height={640}>
                        <div className="grid gap-4 xl:grid-cols-5">
                            <Card i={14} className="xl:col-span-3" title="DPDP Act 2023 — section by section" sub="Each legal duty and its highest fine">
                                <ul className="-mx-1 divide-y divide-line">
                                    {m.sections.map((x) => (
                                        <li key={x.key} className="flex items-center gap-3 px-1 py-2.5">
                                            <span className="w-[68px] shrink-0 font-mono text-xs text-muted">{x.code}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-ink">{x.name}</span>
                                                <span className="block truncate text-xs text-muted">{x.detail}</span>
                                            </span>
                                            <Ring value={x.score ?? 0} size={38} stroke={4} color={x.band.color} label={`${x.name}: ${x.score ?? "no data"}`} tip={{ title: x.name, rows: [{ name: "Score", value: x.score, display: x.score === null || x.score === undefined ? "No data" : `${x.score}%`, color: x.band.color }] }}>
                                                <span className="text-[10px] font-bold tabular-nums text-ink">{x.score ?? "–"}</span>
                                            </Ring>
                                            <span className="hidden w-[88px] shrink-0 rounded-md border border-bad/25 px-2 py-0.5 text-center text-[11px] font-semibold text-bad-ink sm:inline-block">₹{x.max} Cr</span>
                                            <span className={`kd-pill hidden w-[110px] justify-center sm:inline-flex is-${x.band.tone === "muted" ? "muted" : x.band.tone}`}>{x.band.tone === "ok" ? "Compliant" : x.band.tone === "warn" ? "Minor gap" : x.band.tone === "bad" ? "At risk" : x.access ? "No data" : "No access"}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            <Card i={15} className="xl:col-span-2" title="Upcoming deadlines & tasks" sub="Most urgent first" action={<Link to="/dashboard/my-tasks" className="kd-link">My tasks</Link>}>
                                {m.deadlines.length ? (
                                    <ul className="space-y-2">
                                        {m.deadlines.map((d) => (
                                            <li key={d.key}>
                                                <Link to={d.to} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:border-line-strong hover:bg-soft">
                                                    <span className={`kd-ico ${TONE_ICON_BG[d.tone]}`}>
                                                        <Icon name={d.icon} />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-semibold text-ink">{d.title}</span>
                                                        <span className={`mt-0.5 block text-xs ${TONE_TEXT[d.tone]}`}>{d.meta}</span>
                                                    </span>
                                                    <Icon name="chevron" className="mt-1 h-4 w-4 shrink-0 -rotate-90 text-faint" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-3 text-sm text-ok-ink">
                                        <Icon name="check" className="h-4 w-4" /> Nothing due. You are all caught up.
                                    </p>
                                )}
                            </Card>
                        </div>
                    </Defer>
                </div>
            )}

            {openMod && <ModuleModal mod={openMod} onClose={() => setOpenMod(null)} />}
        </div>
    );
}
