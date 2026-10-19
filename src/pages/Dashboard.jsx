import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ADMIN_REGISTER_ENABLED, getSession, logout } from "../auth/authStore.js";

/* ---------- helpers ---------- */
const ICONS = {
    shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M9 12l2 2 4-4",
    consent: "M9 12l2 2 4-4M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z",
    rights: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    breach: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    audit: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 13h6M9 17h4",
    clock: "M12 6v6l4 2M12 21a9 9 0 100-18 9 9 0 000 18z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    building: "M3 21h18M6 21V5a1 1 0 011-1h7a1 1 0 011 1v16M15 9h3a1 1 0 011 1v11M9 8h2M9 12h2M9 16h2",
    key: "M21 2l-2 2m-7.6 7.6a5 5 0 11-7 7 5 5 0 017-7zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    copy: "M8 8h11a1 1 0 011 1v11a1 1 0 01-1 1H8a1 1 0 01-1-1V9a1 1 0 011-1zM4 16V4a1 1 0 011-1h11",
    check: "M5 13l4 4L19 7",
    plus: "M12 5v14M5 12h14M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

function Icon({ name, className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICONS[name]} />
        </svg>
    );
}

const DAY = 86400000;
const PHASES = [
    { label: "Phase 1", date: new Date(2025, 10, 13), text: "13 Nov 2025" },
    { label: "Phase 2", date: new Date(2026, 10, 13), text: "13 Nov 2026" },
    { label: "Phase 3", date: new Date(2027, 4, 13), text: "13 May 2027" },
];

const MODULES = [
    { icon: "consent", title: "Consent management", text: "Purposes, consent records and withdrawals." },
    { icon: "rights", title: "User rights portal", text: "Access, correction and erasure requests." },
    { icon: "breach", title: "Breach management", text: "Incident details, timelines and tasks." },
    { icon: "audit", title: "Audit trail", text: "Reviewable history of admin actions." },
];

function formatDate(date) {
    if (!date) return "Unknown";
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function timeLeft(date, now) {
    if (!date) return "Unknown";
    const mins = Math.max(0, Math.floor((date.getTime() - now) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}

/* ---------- small UI pieces ---------- */
const card =
    "rounded-2xl border border-[#263449] bg-[#111C2E] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)]";

function Stat({ icon, label, value, sub, delay }) {
    return (
        <div className={`${card} p-5`} style={{ animation: `pg-rise .7s cubic-bezier(.22,1,.36,1) ${delay}ms both` }}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-[#CBD5E1]/60">{label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0F766E]/20 text-[#22D3EE] ring-1 ring-[#22D3EE]/20">
                    <Icon name={icon} className="h-[18px] w-[18px]" />
                </span>
            </div>
            <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-1 truncate text-xs text-[#CBD5E1]/60">{sub}</p>
        </div>
    );
}

function CopyRow({ label, value, mono }) {
    const [copied, setCopied] = useState(false);
    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked - ignore */
        }
    };
    return (
        <div className="flex items-center justify-between gap-3 border-b border-[#263449] py-3 last:border-0">
            <div className="min-w-0">
                <dt className="text-xs text-[#CBD5E1]/60">{label}</dt>
                <dd className={`mt-0.5 break-all text-sm text-white ${mono ? "font-mono text-xs" : "font-medium"}`}>{value || "-"}</dd>
            </div>
            {value && (
                <button
                    type="button"
                    onClick={onCopy}
                    aria-label={`Copy ${label}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#263449] text-[#CBD5E1] transition hover:border-[#22D3EE]/50 hover:text-[#22D3EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                >
                    <Icon name={copied ? "check" : "copy"} className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

/* ---------- page ---------- */
export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [session] = useState(() => getSession());
    const [showBanner, setShowBanner] = useState(!!location.state?.justLoggedIn);
    const now = useNow();

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const name = (session?.email || "Admin").split("@")[0];
    const next = PHASES.find((p) => p.date.getTime() > now);
    const daysToNext = next ? Math.ceil((next.date.getTime() - now) / DAY) : null;

    return (
        <main className="relative isolate min-h-screen overflow-hidden bg-[#0B1220] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
            <style>{`
        @keyframes pg-rise { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pg-glow-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px,30px); } }
        @keyframes pg-glow-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-60px,-20px); } }
        @keyframes pg-fill { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .pg-dash, .pg-dash * { animation: none !important; transition: none !important; } }
      `}</style>

            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div
                    className="absolute inset-0 opacity-[0.25]"
                    style={{
                        backgroundImage: "linear-gradient(to right, #263449 1px, transparent 1px), linear-gradient(to bottom, #263449 1px, transparent 1px)",
                        backgroundSize: "56px 56px",
                        WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 20%, transparent 80%)",
                        maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, #000 20%, transparent 80%)",
                    }}
                />
                <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-[#0F766E]/25 blur-[120px] animate-[pg-glow-a_22s_ease-in-out_infinite]" />
                <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[130px] animate-[pg-glow-b_26s_ease-in-out_infinite]" />
            </div>

            <div className="pg-dash mx-auto max-w-6xl space-y-8">
                {showBanner && (
                    <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3" style={{ animation: "pg-rise .6s ease-out both" }}>
                        <div>
                            <p className="text-sm font-semibold text-[#4ADE80]">Login successful</p>
                            <p className="mt-0.5 text-sm text-[#CBD5E1]">You are signed in to your PrivyGuard admin workspace.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowBanner(false)}
                            aria-label="Dismiss"
                            className="rounded-md px-2 text-lg leading-none text-[#CBD5E1] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        >
                            &times;
                        </button>
                    </div>
                )}

                {/* Header */}
                <header className="flex flex-wrap items-end justify-between gap-5" style={{ animation: "pg-rise .7s cubic-bezier(.22,1,.36,1) both" }}>
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#263449] bg-[#111C2E]/80 px-3 py-1 text-xs font-medium text-[#CBD5E1]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
                            Admin console
                        </span>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                            Welcome back, <span className="text-[#22D3EE]">{name}</span>
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#CBD5E1]">
                            Manage your organisation&apos;s DPDP workspace from one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {ADMIN_REGISTER_ENABLED && (
                            <Link
                                to="/admin/register"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#115E59] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                            >
                                <Icon name="plus" className="h-4 w-4" />
                                Register new admin
                            </Link>
                        )}
                    <button
                        type="button"
                            onClick={onLogout}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#263449] bg-[#111C2E] px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition hover:border-[#DC2626]/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                    >
                        <Icon name="logout" className="h-4 w-4" />
                        Sign out
                        </button>
                    </div>
                </header>

                {/* Stats (sab real values - session / calendar se) */}
                <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat icon="key" label="Your role" value={session?.role || "-"} sub="From your signed-in session" delay={80} />
                    <Stat icon="clock" label="Session ends in" value={timeLeft(session?.expiresAt, now)} sub={formatDate(session?.expiresAt)} delay={160} />
                    <Stat
                        icon="calendar"
                        label="Next DPDP milestone"
                        value={next ? `${daysToNext} days` : "All phases live"}
                        sub={next ? `${next.label} · ${next.text}` : "Phase 3 · 13 May 2027 passed"}
                        delay={240}
                    />
                    <Stat icon="building" label="Organisation ID" value={session?.organizationId ? String(session.organizationId).slice(0, 8) : "-"} sub="Your workspace" delay={320} />
                </section>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    {/* Modules */}
                    <section aria-labelledby="modules-h" style={{ animation: "pg-rise .7s cubic-bezier(.22,1,.36,1) 380ms both" }}>
                        <h2 id="modules-h" className="mb-4 text-lg font-semibold text-white">Compliance modules</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {MODULES.map((m) => (
                                <div key={m.title} className={`${card} p-5`}>
                                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0F766E]/20 text-[#22D3EE] ring-1 ring-[#22D3EE]/25">
                                        <Icon name={m.icon} className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 text-base font-semibold text-white">{m.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-[#CBD5E1]/80">{m.text}</p>
                                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#D97706]/10 px-2.5 py-1 text-xs font-medium text-[#FBBF24] ring-1 ring-[#D97706]/30">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                                        Not connected yet
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Session panel */}
                    <section aria-labelledby="session-h" style={{ animation: "pg-rise .7s cubic-bezier(.22,1,.36,1) 460ms both" }}>
                        <h2 id="session-h" className="mb-4 text-lg font-semibold text-white">Session details</h2>
                        <div className="rounded-2xl border border-[#263449] bg-[#111C2E] p-5">
                            <div className="mb-2 flex items-center gap-3 border-b border-[#263449] pb-4">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0F766E] text-base font-semibold text-white">
                                    {(session?.email || "?").charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{session?.email}</p>
                                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-[#4ADE80]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                                        Authenticated
                                    </p>
                                </div>
                            </div>
                            <dl>
                                <CopyRow label="Organisation ID" value={session?.organizationId} mono />
                                <CopyRow label="User ID" value={session?.userId} mono />
                                <CopyRow label="Session expires" value={formatDate(session?.expiresAt)} />
                            </dl>
                        </div>
                    </section>
                </div>

                {/* Phased commencement */}
                <section aria-labelledby="phases-h" className="rounded-2xl border border-[#263449] bg-[#111C2E] p-6" style={{ animation: "pg-rise .7s cubic-bezier(.22,1,.36,1) 540ms both" }}>
                    <h2 id="phases-h" className="text-lg font-semibold text-white">Phased commencement</h2>
                    <p className="mt-1 text-sm text-[#CBD5E1]/70">Dates are calendar-based; status updates automatically.</p>
                    <ol className="mt-6 grid gap-6 sm:grid-cols-3">
                        {PHASES.map((p) => {
                            const passed = p.date.getTime() <= now;
                            const isNext = next?.label === p.label;
                            return (
                                <li key={p.label}>
                                    <div className="relative h-1.5 overflow-hidden rounded-full bg-[#263449]">
                                        <span
                                            className={`absolute inset-0 origin-left rounded-full ${passed ? "bg-[#16A34A]" : isNext ? "bg-gradient-to-r from-[#22D3EE] to-[#0F766E]" : "bg-transparent"}`}
                                            style={{ animation: "pg-fill 1.2s ease-out .8s both", transform: passed || isNext ? undefined : "scaleX(0)", width: isNext ? "45%" : "100%" }}
                                        />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{p.label}</p>
                                    <p className="text-sm text-[#CBD5E1]">{p.text}</p>
                                    <p className={`mt-1 text-xs font-medium ${passed ? "text-[#4ADE80]" : isNext ? "text-[#22D3EE]" : "text-[#CBD5E1]/50"}`}>
                                        {passed ? "In effect" : isNext ? "Upcoming" : "Later"}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                </section>

                <p className="text-center text-xs leading-relaxed text-[#CBD5E1]/50">
                    Demo environment. Not legal advice; completing tasks does not by itself mean legal compliance.
                </p>
            </div>
        </main>
    );
}
