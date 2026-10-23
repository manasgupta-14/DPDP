import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSession, isAdmin } from "../auth/authStore.js";

const ICONS = {
    consent: "M9 12l2 2 4-4M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
    rights: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    breach: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    audit: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 13h6M9 17h4",
    arrow: "M5 12h14M13 6l6 6-6 6",
    check: "M5 13l4 4L19 7",
};

const MODULES = [
    { icon: "consent", title: "Consent management", text: "Record purposes, capture consent and track withdrawals in one register." },
    { icon: "rights", title: "User rights portal", text: "Log access, correction and erasure requests with clear status tracking." },
    { icon: "breach", title: "Breach management", text: "Keep incident details, timelines and notification tasks organised." },
    { icon: "audit", title: "Audit trail", text: "Every action recorded in a reviewable, exportable activity history." },
];

const PHASES = [
    { label: "Phase 1", date: "13 Nov 2025" },
    { label: "Phase 2", date: "13 Nov 2026" },
    { label: "Phase 3", date: "13 May 2027" },
];

const PROGRESS = [
    { label: "Consent management", value: 72 },
    { label: "Privacy rights requests completed", value: 58 },
    { label: "Breach response checklist", value: 85 },
];

function Icon({ name, className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICONS[name]} />
        </svg>
    );
}

function useCountUp(target, delay = 700, duration = 1500) {
    const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (reduced) return undefined;
        let raf;
        let start;
        const timer = setTimeout(() => {
            const step = (ts) => {
                if (!start) start = ts;
                const p = Math.min((ts - start) / duration, 1);
                setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, delay);
        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(raf);
        };
    }, [target, delay, duration, reduced]);
    return reduced ? target : value;
}

function ProgressRow({ label, value, delay }) {
    const v = useCountUp(value, delay);
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#CBD5E1]">{label}</span>
                <span className="font-semibold tabular-nums text-white">{v}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#263449]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#22D3EE]" style={{ width: `${v}%` }} />
            </div>
        </div>
    );
}

function OrbitNode({ icon, position, reverse }) {
    return (
        <span className={`absolute ${position}`}>
            <span
                className={`grid h-11 w-11 place-items-center rounded-xl border border-[#263449] bg-[#111C2E] text-[#22D3EE] shadow-lg shadow-black/40 ${reverse ? "animate-[pg-orbit-rev_40s_linear_infinite]" : "animate-[pg-orbit_40s_linear_infinite]"
                    }`}
            >
                <Icon name={icon} />
            </span>
        </span>
    );
}

export default function Hero() {
    const session = getSession();
    const admin = isAdmin(session);
    const rise = (i) => ({ animation: `pg-rise .8s cubic-bezier(.22,1,.36,1) ${i * 110}ms both` });

    return (
        <section className="relative isolate overflow-hidden bg-[#0B1220] pb-20 pt-28 lg:pb-28 lg:pt-36">
            <style>{`
        @keyframes pg-rise { 0% { opacity: 0; transform: translateY(22px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pg-orbit { to { transform: rotate(360deg); } }
        @keyframes pg-orbit-rev { to { transform: rotate(-360deg); } }
        @keyframes pg-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pg-glow-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(60px,30px); } }
        @keyframes pg-glow-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-70px,-20px); } }
        @keyframes pg-pulse-ring { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes pg-draw { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes pg-sweep { 0% { transform: translateY(-20%); opacity: 0; } 15% { opacity: .8; } 85% { opacity: .8; } 100% { transform: translateY(420%); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .pg-hero, .pg-hero * { animation: none !important; transition: none !important; }
        }
      `}</style>

            <div className="pg-hero">
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                    <div
                        className="absolute inset-0 opacity-[0.35]"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, #263449 1px, transparent 1px), linear-gradient(to bottom, #263449 1px, transparent 1px)",
                            backgroundSize: "56px 56px",
                            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 65% 35%, #000 20%, transparent 75%)",
                            maskImage: "radial-gradient(ellipse 70% 60% at 65% 35%, #000 20%, transparent 75%)",
                        }}
                    />
                    <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-[#0F766E]/25 blur-[120px] animate-[pg-glow-a_22s_ease-in-out_infinite]" />
                    <div className="absolute right-0 top-24 h-[28rem] w-[28rem] rounded-full bg-[#22D3EE]/10 blur-[130px] animate-[pg-glow-b_26s_ease-in-out_infinite]" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B1220] to-transparent" />
                </div>

                <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8">
                    <div>
                        <span style={rise(0)} className="inline-flex items-center gap-2 rounded-full border border-[#263449] bg-[#111C2E]/80 px-3.5 py-1.5 text-xs font-medium text-[#CBD5E1]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
                            Built around the DPDP Act, 2023 and DPDP Rules, 2025
                        </span>

                        <h1 style={rise(1)} className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                            Data privacy compliance, organised in one workspace
                        </h1>

                        <p style={rise(2)} className="mt-6 max-w-xl text-base leading-relaxed text-[#CBD5E1] sm:text-lg">
                            PrivyGuard helps organisations manage privacy obligations, consent records, user rights requests, breach reporting and audit history, all in one place.
                        </p>

                        <div style={rise(3)} className="mt-9 flex flex-wrap items-center gap-3">
                            {admin ? (
                                <Link
                                    to="/dashboard"
                                    className="group inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0F766E]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#115E59] hover:shadow-[#22D3EE]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
                                >
                                    Open privacy dashboard
                                    <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </Link>
                            ) : (
                                <Link
                                    to={session ? "/" : "/login"}
                                    className="group inline-flex items-center gap-2 rounded-lg bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0F766E]/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#115E59] hover:shadow-[#22D3EE]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
                                >
                                    {session ? "You are signed in" : "Sign in"}
                                    {!session && <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
                                </Link>
                            )}
                        </div>

                        <div style={rise(4)} className="mt-12 max-w-md">
                            <p className="text-xs font-medium text-[#CBD5E1]/70">DPDP compliance milestones</p>
                            <div className="relative mt-4">
                                <div className="absolute left-0 right-0 top-[5px] h-px origin-left bg-gradient-to-r from-[#22D3EE] via-[#0F766E] to-[#263449] animate-[pg-draw_1.6s_ease-out_.9s_both]" />
                                <ul className="relative flex justify-between">
                                    {PHASES.map((p) => (
                                        <li key={p.date} className="flex flex-col items-start">
                                            <span className="h-[11px] w-[11px] rounded-full border-2 border-[#22D3EE] bg-[#0B1220]" />
                                            <span className="mt-3 text-sm font-semibold text-white">{p.date}</span>
                                            <span className="text-xs text-[#CBD5E1]/70">{p.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div style={rise(2)} className="relative mx-auto h-[380px] w-full max-w-[480px] sm:h-[480px]">
                        <div className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 scale-[.74] sm:scale-100">
                            <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#22D3EE]/40 animate-[pg-orbit_40s_linear_infinite]">
                                <OrbitNode icon="consent" position="-top-[22px] left-1/2 -translate-x-1/2" />
                            </div>
                            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#263449] animate-[pg-orbit-rev_40s_linear_infinite]">
                                <OrbitNode icon="rights" position="-bottom-[22px] left-1/2 -translate-x-1/2" reverse />
                                <OrbitNode icon="breach" position="top-1/2 -left-[22px] -translate-y-1/2" reverse />
                            </div>
                            <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#263449]/80 animate-[pg-orbit_40s_linear_infinite]">
                                <OrbitNode icon="audit" position="top-[14%] right-[6%]" />
                            </div>

                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                <span className="absolute inset-0 rounded-3xl border border-[#22D3EE]/50 animate-[pg-pulse-ring_3.2s_ease-out_infinite]" />
                                <span className="absolute inset-0 rounded-3xl border border-[#22D3EE]/30 animate-[pg-pulse-ring_3.2s_ease-out_1.6s_infinite]" />
                                <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-[#0F766E] to-[#115E59] shadow-[0_0_50px_rgba(34,211,238,0.3)] ring-1 ring-[#22D3EE]/50">
                                    <svg viewBox="0 0 24 24" className="h-11 w-11 text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <path d={ICONS.consent} />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-0 right-0 w-[268px] animate-[pg-float_7s_ease-in-out_infinite] sm:-right-2 sm:w-[286px]">
                            <div className="rounded-xl border border-[#263449] bg-[#111C2E]/90 p-4 shadow-2xl shadow-black/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]">
                                <div className="mb-3.5 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-white">Compliance progress</span>
                                    <span className="rounded-md border border-[#D97706]/40 bg-[#D97706]/10 px-2 py-0.5 text-[10px] font-medium text-[#D97706]">Sample data</span>
                                </div>
                                <div className="space-y-3.5">
                                    {PROGRESS.map((r, i) => (
                                        <ProgressRow key={r.label} label={r.label} value={r.value} delay={900 + i * 180} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="absolute left-0 top-4 hidden animate-[pg-float_9s_ease-in-out_1s_infinite] sm:block">
                            <div className="flex items-center gap-3 rounded-xl border border-[#263449] bg-[#111C2E]/90 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur-md">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#16A34A]/15 text-[#16A34A]">
                                    <Icon name="check" className="h-4 w-4" />
                                </span>
                                <span className="text-xs leading-tight">
                                    <span className="block font-semibold text-white">Privacy activity recorded</span>
                                    <span className="text-[#CBD5E1]/70">Sample event</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-20 lg:px-8">
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {MODULES.map((m, i) => (
                            <li key={m.title} style={rise(5 + i)}>
                                <div className="h-full rounded-xl border border-[#263449] bg-[#111C2E] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E] hover:shadow-xl hover:shadow-[#0F766E]/15">
                                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0F766E]/20 text-[#22D3EE] ring-1 ring-[#0F766E]/40">
                                        <Icon name={m.icon} />
                                    </span>
                                    <h3 className="mt-4 text-sm font-semibold text-white">{m.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#CBD5E1]/80">{m.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 text-xs leading-relaxed text-[#CBD5E1]/60">
                        Demo with sample data. PrivyGuard helps track tasks and records; completing tasks does not by itself mean legal compliance, and this is not legal advice. Check dates and obligations against official MeitY sources.
                    </p>
                </div>
            </div>
        </section>
    );
}