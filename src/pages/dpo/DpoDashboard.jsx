import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllDpia } from "../../api/dpia.js";
import { getProfile, roleInfo } from "../../auth/authStore.js";
import { C, ColumnChart, CountUp, Donut, HBars, Legend, fmtNum } from "../../components/charts/kit.jsx";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import WelcomeHero from "../../components/shared/WelcomeHero.jsx";
import { DPIA_CHANGED } from "../../config/dpia.js";
import { RISKS, STATUS, displayStatus } from "../../utils/dpia.js";
import { PHASES } from "../../utils/executive.js";
import { toDate, toTime } from "../../utils/audit.js";

const DAY = 86400000;
const rise = (i) => ({ animation: `pg-rise .55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` });
const dateText = (d) => {
    const t = toDate(d);
    return t ? t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
};

function Kpi({ label, value, icon, tone, note, i }) {
    const bg = { info: "bg-brand-soft text-brand-ink", warn: "bg-warn-soft text-warn-ink", ok: "bg-ok-soft text-ok-ink", bad: "bg-bad-soft text-bad-ink" }[tone];
    return (
        <div className="kd-card p-5" style={rise(i)}>
            <div className="flex items-center justify-between">
                <p className="kv-cap text-[13px] font-medium text-ink-3">{label}</p>
                <span className={`kd-ico kd-ico-glow ${bg}`}>
                    <Icon name={icon} />
                </span>
            </div>
            <p className="kd-big mt-3 text-[34px]">
                <CountUp value={value} />
            </p>
            {note && <p className="mt-2 text-xs text-muted">{note}</p>}
        </div>
    );
}

export default function DpoDashboard() {
    const profile = getProfile();
    const info = roleInfo(profile);
    const first = String(profile?.name || "").split(/\s+/)[0];
    const [state, setState] = useState({ loading: true, error: "", items: [] });
    const [round, setRound] = useState(0);

    const load = useCallback(async () => {
        const res = await getAllDpia();
        setState(res.ok ? { loading: false, error: "", items: res.data } : { loading: false, error: res.error, items: [] });
    }, []);

    useEffect(() => {
        let active = true;
        getAllDpia().then((res) => active && setState(res.ok ? { loading: false, error: "", items: res.data } : { loading: false, error: res.error, items: [] }));
        const onChange = () => load();
        window.addEventListener(DPIA_CHANGED, onChange);
        return () => {
            active = false;
            window.removeEventListener(DPIA_CHANGED, onChange);
        };
    }, [load]);

    const m = useMemo(() => {
        const items = state.items;
        const by = (s) => items.filter((d) => displayStatus(d.status) === s);
        const pending = by(STATUS.PENDING).sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
        const now = Date.now();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
            months.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), start: d.getTime(), submitted: 0, decided: 0 });
        }
        items.forEach((d) => {
            const t = toTime(d.createdAt) || NaN;
            const r = toTime(d.reviewedAt) || NaN;
            for (let i = months.length - 1; i >= 0; i--) {
                if (t >= months[i].start) {
                    months[i].submitted += 1;
                    break;
                }
            }
            if (!Number.isNaN(r))
                for (let i = months.length - 1; i >= 0; i--) {
                    if (r >= months[i].start) {
                        months[i].decided += 1;
                        break;
                    }
                }
        });
        const risk = RISKS.map((r) => ({ label: `${r} risk`, value: items.filter((d) => String(d.residualRisk).toLowerCase() === r.toLowerCase()).length }));
        const waitingDays = pending.map((d) => toTime(d.createdAt)).filter(Boolean).map((t) => Math.max(0, Math.floor((now - t) / DAY)));
        const reviewDue = items.filter((d) => toTime(d.nextReviewDate) && toTime(d.nextReviewDate) - now < 30 * DAY);
        return {
            total: items.length,
            pending,
            approved: by(STATUS.APPROVED).length,
            changes: by(STATUS.CHANGES).length,
            draft: by(STATUS.DRAFT).length,
            months,
            risk,
            oldest: waitingDays.length ? Math.max(...waitingDays) : null,
            reviewDue,
        };
    }, [state.items]);

    const next = PHASES.find((p) => new Date(p.date).getTime() >= Date.now() - DAY);

    return (
        <div className="space-y-5">
            <WelcomeHero
                style={rise(0)}
                eyebrow={info.long}
                greeting="Welcome"
                name={first}
                sub="Review risky data use before it starts."
                actions={
                    <>
                        <button
                            type="button"
                            className="kd-btn"
                            onClick={async () => {
                                await load();
                                setRound((r) => r + 1);
                            }}
                        >
                            <Icon name="refresh" className="h-4 w-4" />
                            Refresh
                        </button>
                        <Link to="/dpo/dpia" className="kd-btn is-primary">
                            <Icon name="fileSearch" className="h-4 w-4" />
                            Open DPIA reviews
                        </Link>
                    </>
                }
            />

            {state.error && <Alert>{state.error}</Alert>}
            {state.loading && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="pg-shimmer h-[132px] rounded-[14px]" />
                    ))}
                </div>
            )}

            {!state.loading && (
                <div key={round} className="space-y-5">
                    {m.pending.length > 0 && (
                        <div className="pg-alert flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
                            <span className="flex items-center gap-2.5 text-ink">
                                <Icon name="alert" className="h-4 w-4 text-warn-ink" />
                                {m.pending.length} DPIA{m.pending.length === 1 ? " is" : "s are"} waiting for your review.{m.oldest !== null ? ` The oldest has waited ${m.oldest} day${m.oldest === 1 ? "" : "s"}.` : ""}
                            </span>
                            <Link to={`/dpo/dpia/${encodeURIComponent(m.pending[0].id)}`} className="kd-btn py-1.5 text-xs">
                                Review oldest <Icon name="arrowRight" className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key numbers">
                        <Kpi i={1} label="Waiting for review" value={m.pending.length} icon="clock" tone="warn" note={m.pending.length ? (m.oldest !== null ? `Oldest: ${m.oldest} day${m.oldest === 1 ? "" : "s"}` : "Waiting for review") : "Queue is clear"} />
                        <Kpi i={2} label="Approved" value={m.approved} icon="check" tone="ok" note="Processing can start" />
                        <Kpi i={3} label="Needs changes" value={m.changes} icon="refresh" tone="info" note="Sent back to the team" />
                        <Kpi i={4} label="Due for re-review" value={m.reviewDue.length} icon="calendar" tone="bad" note={`${fmtNum(m.total)} DPIAs in total`} />
                    </section>

                    <div className="grid gap-4 lg:grid-cols-5">
                        <section className="kd-card p-5 lg:col-span-2" style={rise(5)}>
                            <h2 className="kd-title">Decisions so far</h2>
                            <p className="kd-sub">All DPIAs by current status</p>
                            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
                                <Donut
                                    name="DPIA reviews"
                                    parts={[
                                        { label: "Approved", value: m.approved, color: C.ok },
                                        { label: "Waiting", value: m.pending.length, color: C.amber },
                                        { label: "Needs changes", value: m.changes, color: C.brand },
                                    ]}
                                >
                                    <div>
                                        <p className="kd-big text-[28px]">
                                            <CountUp value={m.total} />
                                        </p>
                                        <p className="text-[11px] text-muted">DPIAs</p>
                                    </div>
                                </Donut>
                                <div className="w-full flex-1 space-y-2">
                                    {[
                                        ["Approved", m.approved, C.ok],
                                        ["Waiting", m.pending.length, C.amber],
                                        ["Needs changes", m.changes, C.brand],
                                    ].map(([l, v, c]) => (
                                        <div key={l} className="flex items-center justify-between rounded-lg bg-soft px-3 py-2 text-sm">
                                            <span className="inline-flex items-center gap-2 text-ink-2">
                                                <i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                                                {l}
                                            </span>
                                            <b className="tabular-nums text-ink">{v}</b>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="kd-card p-5 lg:col-span-3" style={rise(6)}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="kd-title">Review activity</h2>
                                    <p className="kd-sub">DPIAs submitted and decided per month</p>
                                </div>
                                <Legend items={[{ label: "Submitted", color: C.brand }, { label: "Decided", color: C.teal }]} />
                            </div>
                            <div className="mt-4">
                                <ColumnChart labels={m.months.map((x) => x.label)} series={[{ name: "Submitted", values: m.months.map((x) => x.submitted), color: C.brand }, { name: "Decided", values: m.months.map((x) => x.decided), color: C.teal }]} height={230} />
                            </div>
                        </section>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <section className="kd-card p-5" style={rise(7)}>
                            <h2 className="kd-title">Your review queue</h2>
                            <p className="kd-sub">Oldest first</p>
                            {m.pending.length ? (
                                <ul className="mt-4 space-y-2">
                                    {m.pending.slice(0, 6).map((d) => {
                                        const created = toTime(d.createdAt);
                                        const days = created ? Math.max(0, Math.floor((Date.now() - created) / DAY)) : null;
                                        return (
                                            <li key={d.id}>
                                                <Link to={`/dpo/dpia/${encodeURIComponent(d.id)}`} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-line-strong hover:bg-soft">
                                                    <span className="kd-ico bg-warn-soft text-warn-ink">
                                                        <Icon name="scale" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-semibold text-ink">{d.title}</span>
                                                        <span className="block text-xs text-muted">
                                                            {d.referenceId} · {d.residualRisk || "Risk not set"} · submitted {dateText(d.createdAt)}
                                                        </span>
                                                    </span>
                                                    {days !== null && <span className={`kd-pill ${days > 14 ? "is-bad" : days > 7 ? "is-warn" : "is-muted"}`}>{days}d</span>}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="mt-4 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-3 text-sm text-ok-ink">
                                    <Icon name="check" className="h-4 w-4" /> Nothing is waiting for you.
                                </p>
                            )}
                        </section>

                        <section className="kd-card p-5" style={rise(8)}>
                            <h2 className="kd-title">Residual risk</h2>
                            <p className="kd-sub">Risk left after the planned safeguards</p>
                            <div className="mt-5">
                                <HBars rows={m.risk.map((r, i) => ({ ...r, color: [C.ok, C.amber, C.red][i] }))} />
                            </div>
                            {m.reviewDue.length > 0 && <p className="mt-4 text-xs font-medium text-warn-ink">{m.reviewDue.length} approved DPIA(s) are due for periodic review within 30 days.</p>}
                            {next && (
                                <div className="mt-5 flex items-start gap-3 rounded-xl border border-line bg-soft p-3">
                                    <span className="kd-ico bg-brand-soft text-brand-ink">
                                        <Icon name="calendar" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink">
                                            DPDP Rules {next.label} · {dateText(next.date)}
                                        </p>
                                        <p className="text-xs text-muted">{next.text}</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
