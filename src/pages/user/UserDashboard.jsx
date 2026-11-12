import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getMyReports } from "../../api/breach.js";
import { getMyPendingCampaigns } from "../../api/campaign.js";
import { getUserSummary } from "../../api/dashboard.js";
import Icon from "../../components/shared/Icon.jsx";
import { panel, primaryBtn, ghostBtn } from "../../components/shared/ui.js";
import { isDataPrincipal } from "../../auth/authStore.js";
import { formatDay, typeLabel } from "../../utils/campaign.js";
import { dateText, typeLabel as requestTypeLabel } from "../../utils/privacyRequest.js";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

function Stat({ icon, tint, label, value, to, hint }) {
    return (
        <Link to={to} className={`${panel} block p-6 transition hover:-translate-y-0.5 hover:border-[#0F766E]/40`}>
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon name={icon} className="h-5 w-5" /></span>
            <p className="mt-4 text-sm text-[#475569]">{label}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-sm text-[#64748B]">{hint}</p>
        </Link>
    );
}

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
        return () => { active = false; };
    }, []);

    const firstName = (profile?.name || "there").split(/[\s@]/)[0];
    const customer = isDataPrincipal(profile);
    const open = reports.items.filter((r) => !/closed|resolved/i.test(r.status)).length;

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111C2E] to-[#0B1220] p-6 text-white sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-[70px]" />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#22D3EE]">{customer ? "Customer portal" : "Employee portal"}</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Welcome, {firstName}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#CBD5E1]">{customer ? "See how your data is used, change your consent any time, and ask for a copy, correction or erasure of your data." : "Respond to consent requests from your organisation and report anything suspicious to the security team."}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link to="/user/tasks" className={`${primaryBtn} ${tasks.items.length ? "pg-attn" : ""}`}>Review my tasks{tasks.items.length > 0 && <span className="pg-attn-badge">{tasks.items.length}</span>}</Link>
                        {customer ? (
                            <Link to="/user/privacy" className={`${ghostBtn} !bg-transparent !text-white !border-[#263449] hover:!border-[#22D3EE] hover:!text-[#22D3EE]`}>Raise a privacy request</Link>
                        ) : (
                            <Link to="/user/reports" className={`${ghostBtn} !bg-transparent !text-white !border-[#263449] hover:!border-[#22D3EE] hover:!text-[#22D3EE]`}>Report an incident</Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid gap-6 sm:grid-cols-2">
                <Stat to="/user/tasks" icon="tasks" tint="bg-[#CCFBF1] text-[#0F766E]" label="Pending tasks" value={tasks.loading ? "-" : tasks.items.length} hint={tasks.items.length ? "Waiting for your response" : "You are all caught up"} />
                {customer ? (
                    <Stat to="/user/grievance" icon="rights" tint="bg-[#22D3EE]/15 text-[#0F172A]" label="Need help?" value="Grievance" hint="Raise a complaint and track the reply" />
                ) : (
                    <Stat to="/user/reports" icon="shield" tint="bg-[#22D3EE]/15 text-[#0F172A]" label="Open security reports" value={reports.loading ? "-" : open} hint="Reports you submitted that are not closed" />
                )}
            </div>

            <section aria-label="Privacy overview" className="grid gap-6 sm:grid-cols-3">
                <div className={`${panel} p-6`}>
                    <p className="text-sm text-[#475569]">Privacy health score</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight">{summary.loading ? "-" : summary.data ? `${summary.data.healthScore}%` : "-"}</p>
                    <p className="mt-2 text-sm text-[#64748B]">Drops while consent tasks are pending</p>
                </div>
                <div className={`${panel} p-6`}>
                    <p className="text-sm text-[#475569]">Active consents</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight">{summary.loading ? "-" : summary.data ? summary.data.activeConsents : "-"}</p>
                    <p className="mt-2 text-sm text-[#64748B]">Permissions you have granted</p>
                </div>
                <Link to="/user/privacy" className={`${panel} block p-6 transition hover:-translate-y-0.5 hover:border-[#0F766E]/40`}>
                    <p className="text-sm text-[#475569]">Privacy requests raised</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight">{summary.loading ? "-" : summary.data ? summary.data.requestsRaised : "-"}</p>
                    <p className="mt-2 text-sm text-[#64748B]">Access, correction, erasure and more</p>
                </Link>
            </section>

            {summary.error && <p className="text-sm text-[#DC2626]">{summary.error}</p>}

            {summary.data && summary.data.requests.length > 0 && (
                <section className={`${panel} p-5 sm:p-6`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent privacy requests</h2>
                        <Link to="/user/privacy" className="text-sm font-semibold text-[#0F766E] hover:underline">View all</Link>
                    </div>
                    <ul className="mt-3 divide-y divide-[#E2E8F0]">
                        {summary.data.requests.map((r, i) => (
                            <li key={i} className="flex items-center justify-between gap-3 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{requestTypeLabel(r.type)}</p>
                                    <p className="text-xs text-[#64748B]">{r.createdAt ? dateText(new Date(/(Z|[+-]\d{2}:?\d{2})$/i.test(String(r.createdAt)) ? r.createdAt : `${r.createdAt}Z`)) : "-"}</p>
                                </div>
                                <StatusBadge status={r.status} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className={`${panel} p-5 sm:p-6`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Waiting for you</h2>
                    <Link to="/user/tasks" className="text-sm font-semibold text-[#0F766E] hover:underline">View all</Link>
                </div>
                {tasks.error && <p className="mt-3 text-sm text-[#DC2626]">{tasks.error}</p>}
                {!tasks.loading && !tasks.error && tasks.items.length === 0 && <p className="mt-3 text-sm text-[#475569]">Nothing pending right now.</p>}
                <ul className="mt-3 divide-y divide-[#E2E8F0]">
                    {tasks.items.slice(0, 4).map((c) => (
                        <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{c.title}</p>
                                <p className="text-xs text-[#64748B]">{typeLabel(c.type)}{c.endDate ? ` · respond by ${formatDay(c.endDate)}` : ""}</p>
                            </div>
                            <Link to="/user/tasks" className="shrink-0 text-sm font-semibold text-[#0F766E] hover:underline">Respond</Link>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
