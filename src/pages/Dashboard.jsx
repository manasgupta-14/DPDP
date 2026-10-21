import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import Icon from "../components/dashboard/Icon.jsx";
import { ACTIVITY, DEADLINES, PHASES, READINESS, SUMMARY, TASKS } from "../data/dashboardMock.js";

const DAY = 86400000;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function useNow(ms = 60000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), ms);
        return () => clearInterval(id);
    }, [ms]);
    return now;
}

const rise = (delay = 0) => ({ animation: `pg-rise .65s cubic-bezier(.22,1,.36,1) ${delay}ms both` });
const card = "rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0F766E]/40 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]";

function Stat({ icon, tint, label, value, sub, delay }) {
    return (
        <div className={`${card} p-6`} style={rise(delay)}>
            <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
                <Icon name={icon} className="h-5 w-5" />
            </span>
            <p className="mt-5 text-[15px] text-[#475569]">{label}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-[#0F172A]">{value}</p>
            <p className="mt-2 text-sm leading-snug text-[#64748B]">{sub}</p>
        </div>
    );
}

function Empty({ children }) {
    return <p className="py-6 text-center text-sm text-[#64748B]">{children}</p>;
}

export default function Dashboard() {
    const { query, profile } = useOutletContext();
    const location = useLocation();
    const [banner, setBanner] = useState(!!location.state?.justLoggedIn);
    const now = useNow();

    const match = (text) => !query || text.toLowerCase().includes(query);
    const firstName = (profile?.name || "Admin").split(" ")[0];
    const next = PHASES.find((p) => p.date.getTime() > now);

    const deadlines = DEADLINES.filter((d) => d.date.getTime() > now && match(`${d.title} ${d.note} ${d.kind}`));
    const tasks = TASKS.filter((t) => match(`${t.title} ${t.owner} ${t.status}`));
    const activity = ACTIVITY.filter((a) => match(`${a.title} ${a.meta}`));

    return (
        <div className="space-y-7">
            {banner && (
                <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3" style={rise()}>
                    <div>
                        <p className="text-sm font-semibold text-[#166534]">Login successful</p>
                        <p className="text-sm text-[#166534]/80">You are signed in to your PrivyGuard admin workspace.</p>
                    </div>
                    <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss" className="rounded-md px-2 text-lg leading-none text-[#166534] hover:bg-white/60">
                        &times;
                    </button>
                </div>
            )}

            <header className="flex flex-wrap items-start justify-between gap-3" style={rise()}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="mt-1.5 text-[15px] text-[#475569]">
                        Welcome back, {firstName}. Here is your DPDP readiness overview, calculated from the mock records in this demo.
                    </p>
                </div>
                <span className="rounded-full bg-[#D97706]/15 px-3 py-1 text-[11px] font-bold tracking-wide text-[#B45309]">MOCK DATA</span>
            </header>

            <div role="note" className="flex gap-3 rounded-2xl border border-[#D97706]/40 bg-[#D97706]/10 p-5" style={rise(60)}>
                <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" />
                <div>
                    <p className="font-semibold text-[#92400E]">Readiness is not legal compliance</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#92400E]/90">
                        Task completion shows internal progress only. Whether an obligation is met is a legal judgement that needs evidence review. As of today,{" "}
                        {SUMMARY.inForce} in-scope items map to provisions in force and {SUMMARY.upcoming} to provisions that are not yet in force.
                    </p>
                </div>
            </div>

            <section aria-label="Overview" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon="checklist" tint="bg-[#CCFBF1] text-[#0F766E]" label="Total requirements in scope" value={SUMMARY.totalInScope} sub={`${SUMMARY.notApplicable} not applicable, ${SUMMARY.needReview} need review`} delay={100} />
                <Stat icon="scale" tint="bg-[#CCFBF1] text-[#0F766E]" label="Effective (provision in force)" value={SUMMARY.inForce} sub={`${SUMMARY.cataloguedInForce} of ${SUMMARY.catalogued} catalogued provisions are in force (mostly Board set-up)`} delay={160} />
                <Stat icon="calendar" tint="bg-[#22D3EE]/15 text-[#0F766E]" label="Upcoming (not yet in force)" value={SUMMARY.upcoming} sub={`${SUMMARY.upcomingNoDate} internal tasks have no commencement date`} delay={220} />
                <Stat icon="tasks" tint="bg-[#16A34A]/10 text-[#16A34A]" label="Tasks completed" value={SUMMARY.tasksDone} sub={`${SUMMARY.tasksDonePct}% of in-scope tasks`} delay={280} />
            </section>

            <div className="grid gap-5 lg:grid-cols-3">

                <section className={`${card} p-6`} style={rise(340)} aria-labelledby="ready-h">
                    <h2 id="ready-h" className="text-lg font-semibold">Internal progress by area</h2>
                    <p className="mt-1 text-xs text-[#64748B]">Mock task progress. Not a legal compliance score.</p>
                    <ul className="mt-5 space-y-4">
                        {READINESS.filter((r) => match(r.label)).map((r, i) => (
                            <li key={r.label}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#334155]">{r.label}</span>
                                    <span className="font-semibold">{r.value}%</span>
                                </div>
                                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                                    <div className="h-full origin-left rounded-full bg-gradient-to-r from-[#0F766E] to-[#22D3EE]" style={{ width: `${r.value}%`, animation: `pg-fill 1.1s ease-out ${500 + i * 90}ms both` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    {!READINESS.some((r) => match(r.label)) && <Empty>No matching areas.</Empty>}
                </section>

                <section className={`${card} p-6`} style={rise(400)} aria-labelledby="dead-h">
                    <h2 id="dead-h" className="text-lg font-semibold">Upcoming dates</h2>
                    <p className="mt-1 text-xs text-[#64748B]">
                        {next ? `Next milestone: ${next.label}, ${next.text}` : "All three phases have commenced"}
                    </p>
                    <ul className="mt-5 space-y-4">
                        {deadlines.map((d) => {
                            const days = Math.ceil((d.date.getTime() - now) / DAY);
                            return (
                                <li key={d.title} className="flex gap-3.5">
                                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#CCFBF1] text-center leading-none">
                                        <div>
                                            <p className="text-[11px] font-bold text-[#0F766E]">{MONTHS[d.date.getMonth()]}</p>
                                            <p className="mt-1 text-xl font-bold text-[#0F172A]">{d.date.getDate()}</p>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-medium leading-snug">{d.title}</p>
                                        <p className="mt-0.5 text-xs text-[#64748B]">
                                            {d.note} · in {days} days{" "}
                                            <span className={`ml-1 font-semibold ${d.kind === "Legal" ? "text-[#0F766E]" : "text-[#475569]"}`}>{d.kind}</span>
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {deadlines.length === 0 && <Empty>No upcoming dates match.</Empty>}
                </section>

                <section className={`${card} flex flex-col p-6`} style={rise(460)} aria-labelledby="task-h">
                    <h2 id="task-h" className="text-lg font-semibold">Priority tasks</h2>
                    <p className="mt-1 text-xs text-[#64748B]">Internal tasks (mock).</p>
                    <ul className="mt-5 flex-1 space-y-4">
                        {tasks.map((t) => (
                            <li key={t.title} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[15px] font-medium leading-snug">{t.title}</p>
                                    <p className="mt-0.5 text-xs text-[#64748B]">{t.owner} · due {t.due}</p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "In progress" ? "bg-[#D97706]/15 text-[#B45309]" : "bg-[#E2E8F0] text-[#475569]"}`}>
                                    {t.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {tasks.length === 0 && <Empty>No tasks match.</Empty>}
                    <Link to="/dashboard/checklist" className="mt-5 text-sm font-semibold text-[#0F766E] hover:text-[#115E59]">
                        Open checklist
                    </Link>
                </section>
            </div>

            <section className={`${card} p-6`} style={rise(520)} aria-labelledby="phase-h">
                <h2 id="phase-h" className="text-lg font-semibold">Phased commencement</h2>
                <p className="mt-1 text-xs text-[#64748B]">Dates are calendar-based; status updates automatically.</p>
                <ol className="mt-5 grid gap-6 sm:grid-cols-3">
                    {PHASES.map((p) => {
                        const passed = p.date.getTime() <= now;
                        const isNext = next?.label === p.label;
                        return (
                            <li key={p.label}>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                                    <div
                                        className={`h-full origin-left rounded-full ${passed ? "bg-[#16A34A]" : "bg-gradient-to-r from-[#22D3EE] to-[#0F766E]"}`}
                                        style={{ width: passed ? "100%" : isNext ? "45%" : "0%", animation: "pg-fill 1.2s ease-out .7s both" }}
                                    />
                                </div>
                                <p className="mt-3 text-sm font-semibold">{p.label}</p>
                                <p className="text-sm text-[#475569]">{p.text}</p>
                                <p className={`mt-1 text-xs font-semibold ${passed ? "text-[#16A34A]" : isNext ? "text-[#0F766E]" : "text-[#94A3B8]"}`}>
                                    {passed ? "In effect" : isNext ? "Upcoming" : "Later"}
                                </p>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className={`${card} p-6`} style={rise(580)} aria-labelledby="act-h">
                <h2 id="act-h" className="text-lg font-semibold">Recent activity</h2>
                <ul className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
                    {activity.map((a) => (
                        <li key={a.title} className="flex gap-3">
                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0F766E]" />
                            <div className="min-w-0">
                                <p className="text-[15px] font-medium leading-snug">{a.title}</p>
                                <p className="mt-0.5 text-xs text-[#64748B]">{a.meta}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                {activity.length === 0 && <Empty>No activity matches your search.</Empty>}
            </section>

            <p className="pb-2 text-center text-xs text-[#64748B]">
                Demo environment. Not legal advice; completing tasks does not by itself mean legal compliance.
            </p>
        </div>
    );
}
