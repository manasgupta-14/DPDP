import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getMyReports } from "../../api/breach.js";
import { getMyPendingCampaigns } from "../../api/campaign.js";
import { getUserSummary } from "../../api/dashboard.js";
import { isDataPrincipal, roleInfo } from "../../auth/authStore.js";
import { C, CountUp, Ring } from "../../components/charts/kit.jsx";
import Icon from "../../components/shared/Icon.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { formatDay, typeLabel } from "../../utils/campaign.js";
import { band } from "../../utils/executive.js";
import { dateText, typeLabel as requestTypeLabel } from "../../utils/privacyRequest.js";

// User (customer ya employee) ka overview: pehle "aapka kaam", phir privacy health, phir haal ki gatividhi.
const rise = (i) => ({ animation: `pg-rise .55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` });
const TONE_BG = { info: "bg-brand-soft text-brand-ink", ok: "bg-ok-soft text-ok-ink", warn: "bg-warn-soft text-warn-ink", violet: "bg-violet/12 text-violet-ink" };

function Stat({ icon, tone, label, value, to, hint, i }) {
    return (
        <Link to={to} className="kd-card pg-card block p-5" style={rise(i)}>
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-ink-3">{label}</p>
                <span className={`kd-ico ${TONE_BG[tone]}`}>
                    <Icon name={icon} />
                </span>
            </div>
            <p className="kd-big mt-3 text-[34px]">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
            <p className="mt-2 text-xs text-muted">{hint}</p>
        </Link>
    );
}

const toDate = (v) => new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(String(v)) ? v : `${v}Z`);

export default function UserDashboard() {
    const { profile } = useOutletContext();
    const [tasks, setTasks] = useState({ loading: true, items: [], error: "" });
    const [reports, setReports] = useState({ loading: true, items: [] });
    const [summary, setSummary] = useState({ loading: true, data: null, error: "" });

    useEffect(() => {
        let active = true;
        getMyPendingCampaigns().then((res) => {
            if (active) setTasks({ loading: false, items: res.ok ? res.data : [], error: res.ok ? "" : res.error });
        });
        (isDataPrincipal() ? Promise.resolve({ ok: true, data: [] }) : getMyReports()).then((res) => {
            if (active) setReports({ loading: false, items: res.ok ? res.data : [] });
        });
        getUserSummary().then((res) => {
            if (active) setSummary({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, []);

    const firstName = (profile?.name || "there").split(/[\s@]/)[0];
    const customer = isDataPrincipal(profile);
    const info = roleInfo(profile);
    const open = reports.items.filter((r) => !/closed|resolved/i.test(r.status)).length;
    const score = summary.data ? summary.data.healthScore : null;
    const b = band(score);

    return (
        <div className="space-y-5">
            <header className="kv-hero flex flex-wrap items-end justify-between gap-4" style={rise(0)}>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">{customer ? "Customer portal" : `${info.label} portal`}</p>
                    <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Welcome, {firstName}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted">
                        {customer ? "See how your data is used, change your consent any time, and ask for a copy, correction or erasure of your data." : "Respond to consent requests from your organisation and report anything suspicious to the security team."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {customer ? (
                        <Link to="/user/privacy" className="kd-btn">
                            <Icon name="rights" className="h-4 w-4" />
                            Raise a privacy request
                        </Link>
                    ) : (
                        <Link to="/user/reports" className="kd-btn">
                            <Icon name="alert" className="h-4 w-4" />
                            Report an incident
                        </Link>
                    )}
                    <Link to="/user/tasks" className="kd-btn is-primary">
                        <Icon name="tasks" className="h-4 w-4" />
                        Review my tasks
                        {tasks.items.length > 0 && <span className="rounded-full bg-white/25 px-1.5 text-[11px] font-bold">{tasks.items.length}</span>}
                    </Link>
                </div>
            </header>

            {tasks.items.length > 0 && (
                <div className="pg-alert flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-warn/30 bg-warn-soft px-4 py-3 text-sm">
                    <span className="flex items-center gap-2.5 text-ink">
                        <Icon name="bell" className="h-4 w-4 text-warn-ink" />
                        {tasks.items.length} consent request{tasks.items.length === 1 ? " is" : "s are"} waiting for your answer.
                    </span>
                    <Link to="/user/tasks" className="kd-btn py-1.5 text-xs">
                        Respond now <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <section className="kd-card p-5" style={rise(1)} aria-label="Privacy health">
                    <h2 className="kd-title">Privacy health</h2>
                    <p className="kd-sub">Drops while consent tasks are pending</p>
                    <div className="mt-4 flex items-center gap-5">
                        <Ring value={score ?? 0} size={124} stroke={12} color={b.color} label={`Privacy health ${score ?? "no data"}`}>
                            <div>
                                <p className="kd-big text-[28px]">{score === null ? "—" : <CountUp value={score} suffix="%" />}</p>
                                <p className="text-[11px] text-muted">health</p>
                            </div>
                        </Ring>
                        <div className="space-y-2">
                            <span className={`kd-pill is-${b.tone === "muted" ? "muted" : b.tone}`}>{summary.loading ? "Loading" : b.label}</span>
                            <p className="text-sm text-ink-3">{tasks.items.length ? "Answer your pending tasks to raise it." : "You are up to date."}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                    <Stat i={2} to="/user/tasks" icon="tasks" tone="info" label="Pending tasks" value={tasks.loading ? "—" : tasks.items.length} hint={tasks.items.length ? "Waiting for your response" : "You are all caught up"} />
                    <Stat i={3} to="/user/consent" icon="consent" tone="ok" label="Active consents" value={summary.loading || !summary.data ? "—" : summary.data.activeConsents} hint="Permissions you have granted" />
                    <Stat i={4} to="/user/privacy" icon="rights" tone="violet" label="Privacy requests raised" value={summary.loading || !summary.data ? "—" : summary.data.requestsRaised} hint="Access, correction, erasure and more" />
                    {customer ? (
                        <Stat i={5} to="/user/grievance" icon="chat" tone="warn" label="Need help?" value="Grievance" hint="Raise a complaint and track the reply" />
                    ) : (
                        <Stat i={5} to="/user/reports" icon="shield" tone="warn" label="Open security reports" value={reports.loading ? "—" : open} hint="Reports you submitted that are not closed" />
                    )}
                </div>
            </div>

            {summary.error && <p className="text-sm text-bad-ink">{summary.error}</p>}

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="kd-card p-5" style={rise(6)}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="kd-title">Waiting for you</h2>
                            <p className="kd-sub">Consent and awareness requests</p>
                        </div>
                        <Link to="/user/tasks" className="kd-link">
                            View all
                        </Link>
                    </div>
                    {tasks.error && <p className="mt-3 text-sm text-bad-ink">{tasks.error}</p>}
                    {!tasks.loading && !tasks.error && tasks.items.length === 0 && (
                        <p className="mt-4 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-3 text-sm text-ok-ink">
                            <Icon name="check" className="h-4 w-4" /> Nothing pending right now.
                        </p>
                    )}
                    <ul className="mt-3 space-y-2">
                        {tasks.items.slice(0, 5).map((c) => (
                            <li key={c.id}>
                                <Link to="/user/tasks" className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-line-strong hover:bg-soft">
                                    <span className="kd-ico bg-brand-soft text-brand-ink">
                                        <Icon name="consent" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-ink">{c.title}</span>
                                        <span className="block text-xs text-muted">
                                            {typeLabel(c.type)}
                                            {c.endDate ? ` · respond by ${formatDay(c.endDate)}` : ""}
                                        </span>
                                    </span>
                                    <span className="kd-link">Respond</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="kd-card p-5" style={rise(7)}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="kd-title">Recent privacy requests</h2>
                            <p className="kd-sub">Your latest requests and their status</p>
                        </div>
                        <Link to="/user/privacy" className="kd-link">
                            View all
                        </Link>
                    </div>
                    {summary.data && summary.data.requests.length > 0 ? (
                        <ul className="mt-3 divide-y divide-line">
                            {summary.data.requests.map((r, i) => (
                                <li key={i} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{requestTypeLabel(r.type)}</p>
                                        <p className="text-xs text-muted">{r.createdAt ? dateText(toDate(r.createdAt)) : "-"}</p>
                                    </div>
                                    <StatusBadge status={r.status} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-line-strong p-5 text-center">
                            <p className="text-sm text-ink-3">You have not raised a privacy request yet.</p>
                            <Link to="/user/privacy" className="kd-link mt-2">
                                Ask for a copy, correction or erasure <Icon name="arrowRight" className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    )}
                    {summary.data?.activity?.length > 0 && (
                        <>
                            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Recent activity</h3>
                            <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
                                {summary.data.activity.slice(0, 4).map((a, i) => (
                                    <li key={i} className="relative text-sm text-ink-2">
                                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full" style={{ background: C.brand }} />
                                        {a.action}
                                        {a.date && <span className="ml-1 text-xs text-muted">· {dateText(toDate(a.date))}</span>}
                                    </li>
                                ))}
                            </ol>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
