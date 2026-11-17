import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSession, homePath, roleInfo } from "../../auth/authStore.js";
import { CountUp, useInView } from "../../components/charts/kit.jsx";
import { KavachMark, Logo } from "../../components/shared/Brand.jsx";
import { CAPABILITIES, COMPARE_ROWS, ECOSYSTEM, FAQ, FEATURES, ICONS, MILESTONES, ROTATING_WORDS, STATS, STEPS } from "../../components/public/home/data.js";

// Kavach website: content Kavach ka hi hai, design saaf aur seedha (koi 3D / mesh nahi).

function Glyph({ name, className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICONS[name]} />
        </svg>
    );
}

function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
    const [ref, inView] = useInView({ replay: false, threshold: 0.15 });
    return (
        <Tag ref={ref} className={className} style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(16px)", transition: `opacity .6s ease ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
            {children}
        </Tag>
    );
}

function SectionHead({ eyebrow, title, text, id, center = true }) {
    return (
        <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-ink">{eyebrow}</p>
            <h2 id={id} className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-[36px]">
                {title}
            </h2>
            {text && <p className="mt-4 text-base leading-relaxed text-ink-3">{text}</p>}
        </div>
    );
}

function RotatingWord() {
    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((v) => (v + 1) % ROTATING_WORDS.length), 2400);
        return () => clearInterval(t);
    }, []);
    return (
        <span key={i} className="inline-block font-semibold text-brand-ink" style={{ animation: "pg-rise .45s ease-out both" }}>
            {ROTATING_WORDS[i]}
        </span>
    );
}

function cta() {
    const s = getSession();
    if (!s) return { to: "/login", label: "Sign in to Kavach" };
    return { to: homePath(s), label: `Open ${roleInfo(s).label} dashboard` };
}

function Hero() {
    const c = cta();
    return (
        <section data-bg="trust" aria-labelledby="home-title" className="relative overflow-hidden border-b border-line">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: "radial-gradient(var(--k-line) 1px, transparent 1.3px)", backgroundSize: "24px 24px", WebkitMaskImage: "linear-gradient(180deg, #000, transparent 85%)", maskImage: "linear-gradient(180deg, #000, transparent 85%)" }}
            />
            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-36">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-3 py-1 text-xs font-semibold text-ink-2" style={{ animation: "pg-rise .5s ease-out both" }}>
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>
                        Built for the DPDP Act, 2023 and DPDP Rules, 2025
                    </span>
                    <h1 id="home-title" className="mt-6 text-[40px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[54px]" style={{ animation: "pg-rise .6s ease-out 80ms both" }}>
                        Data privacy,
                        <br />
                        organised as <span className="text-brand-ink">one workspace</span>
                    </h1>
                    <p className="mt-5 text-lg text-ink-3" style={{ animation: "pg-rise .6s ease-out 160ms both" }}>
                        Keep <RotatingWord /> in one place.
                    </p>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-3" style={{ animation: "pg-rise .6s ease-out 220ms both" }}>
                        Kavach helps teams manage consent, privacy notices, rights requests, grievances, breaches and DPIA reviews, with an audit trail behind every change.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3" style={{ animation: "pg-rise .6s ease-out 300ms both" }}>
                        <Link to={c.to} className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[var(--k-shadow)] hover:bg-brand-strong">
                            {c.label}
                            <Glyph name="arrow" className="h-4 w-4" />
                        </Link>
                        <a href="/#how" className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink-2 hover:bg-soft">
                            See how it works
                        </a>
                    </div>
                </div>

                {/* Hub: beech me Kavach, chaaron taraf modules */}
                <div id="ecosystem" className="relative scroll-mt-24" style={{ animation: "pg-rise .7s ease-out 200ms both" }}>
                    <div className="rounded-[20px] border border-line bg-surface p-5 shadow-[var(--k-shadow-lg)]">
                        <div className="flex items-center justify-between border-b border-line pb-4">
                            <Logo sub="Every privacy duty, connected to one core" />
                            <span className="kd-pill is-ok">
                                <span className="kv-live-dot" /> Live
                            </span>
                        </div>
                        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                            {ECOSYSTEM.map((e, i) => (
                                <li key={e.key} className="flex items-start gap-3 rounded-xl border border-line bg-soft p-3" style={{ animation: `pg-rise .5s ease-out ${380 + i * 80}ms both` }}>
                                    <span className="kd-ico bg-brand-soft text-brand-ink">
                                        <Glyph name={e.icon} />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-ink">{e.title}</span>
                                        <span className="mt-0.5 block text-xs leading-snug text-muted">{e.text}</span>
                                        <span className="mt-1.5 inline-block text-[11px] font-semibold text-ok-ink">● {e.status}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Capabilities() {
    return (
        <section aria-label="Capabilities" className="border-b border-line py-6">
            <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4 sm:px-6">
                {CAPABILITIES.map((c) => (
                    <span key={c} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-3">
                        {c}
                    </span>
                ))}
            </div>
        </section>
    );
}

function Features() {
    return (
        <section data-bg="innovate" id="features" aria-labelledby="feat-title" className="scroll-mt-20 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead id="feat-title" eyebrow="Features" title="Built for the work, not the brochure" text="Each module does one job well, and they all write to the same audit trail." />
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.key} delay={i * 70} className="kd-card p-6">
                            <span className="kd-ico h-10 w-10 bg-brand-soft text-brand-ink">
                                <Glyph name={f.icon} />
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-ink-3">{f.text}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section data-bg="proof" id="how" aria-labelledby="how-title" className="scroll-mt-20 border-y border-line bg-surface/35 py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead id="how-title" eyebrow="How it works" title="Four steps from setup to proof" />
                <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STEPS.map((s, i) => (
                        <Reveal as="li" key={s.title} delay={i * 90} className="relative rounded-[14px] border border-line bg-soft p-6">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                            <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{s.text}</p>
                        </Reveal>
                    ))}
                </ol>
            </div>
        </section>
    );
}

function Stats() {
    return (
        <section aria-labelledby="stats-title" className="py-16">
            <h2 id="stats-title" className="sr-only">
                Kavach at a glance
            </h2>
            <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                {STATS.map((s, i) => (
                    <Reveal key={s.label} delay={i * 80} className="kd-card p-6">
                        <p className="kd-big text-[44px] text-brand-ink">
                            <CountUp value={s.value} suffix={s.suffix} />
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink">{s.label}</p>
                        <p className="mt-1 text-xs text-muted">{s.sub}</p>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

function Compare() {
    const Mark = ({ ok }) => (
        <span className={`inline-grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-ok-soft text-ok-ink" : "bg-bad-soft text-bad-ink"}`}>
            <Glyph name={ok ? "check" : "x"} className="h-3.5 w-3.5" />
        </span>
    );
    return (
        <section data-bg="care" aria-labelledby="cmp-title" className="border-y border-line bg-surface/35 py-20 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <SectionHead id="cmp-title" eyebrow="Why Kavach" title="Spreadsheets forget. Records remember." text="Email threads and sheets lose the who, when and why that an auditor asks for." />
                <Reveal className="mt-10 overflow-hidden rounded-[14px] border border-line">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-soft text-xs uppercase tracking-wide text-muted">
                            <tr>
                                <th scope="col" className="px-5 py-3 font-semibold">
                                    What you need
                                </th>
                                <th scope="col" className="px-5 py-3 text-center font-semibold">
                                    Spreadsheets
                                </th>
                                <th scope="col" className="px-5 py-3 text-center font-semibold text-brand-ink">
                                    Kavach
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARE_ROWS.map(([label, a, b]) => (
                                <tr key={label} className="border-t border-line">
                                    <td className="px-5 py-3.5 font-medium text-ink-2">{label}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <Mark ok={a} />
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <Mark ok={b} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Reveal>
            </div>
        </section>
    );
}

function Milestones() {
    const today = new Date();
    return (
        <section aria-labelledby="ms-title" className="py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead id="ms-title" eyebrow="DPDP timeline" title="The dates that matter" text="The DPDP Rules, 2025 apply in three phases. Check official MeitY sources before you plan." />
                <ol className="mt-12 grid gap-4 md:grid-cols-3">
                    {MILESTONES.map((m, i) => {
                        const done = new Date(m.date) <= today;
                        return (
                            <Reveal as="li" key={m.label} delay={i * 100} className={`kd-card p-6 ${done ? "" : "border-brand/40"}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-ink">{m.label}</span>
                                    <span className={`kd-pill ${done ? "is-ok" : "is-warn"}`}>{done ? "In force" : "Upcoming"}</span>
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-ink">{m.date}</p>
                                <p className="mt-2 text-sm leading-relaxed text-ink-3">{m.text}</p>
                            </Reveal>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

function Faq() {
    return (
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-line bg-surface/35 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                <SectionHead id="faq-title" eyebrow="FAQ" title="Questions people ask" />
                <div className="mt-10 space-y-3">
                    {FAQ.map((f) => (
                        <details key={f.q} className="group rounded-[14px] border border-line bg-soft p-5 open:bg-surface open:shadow-[var(--k-shadow)]">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">
                                {f.q}
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                                    <Glyph name="plus" className="h-3.5 w-3.5" />
                                </span>
                            </summary>
                            <p className="mt-3 text-sm leading-relaxed text-ink-3">{f.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FinalCta() {
    const c = cta();
    return (
        <section data-bg="action" aria-labelledby="cta-title" className="py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <Reveal className="relative overflow-hidden rounded-[20px] bg-deep px-6 py-14 text-center sm:px-12">
                    <span className="mx-auto mb-5 grid w-fit place-items-center text-white">
                        <KavachMark className="h-12 w-12" />
                    </span>
                    <h2 id="cta-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Put your DPDP work in one place
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-white/70">Sign in to set up purposes, publish your first notice and start recording consent.</p>
                    <Link to={c.to} className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-semibold text-[#1F449E] hover:bg-white/90">
                        {c.label}
                        <Glyph name="arrow" className="h-4 w-4" />
                    </Link>
                </Reveal>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t border-line bg-surface/70">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <Logo sub="DPDP compliance workspace" />
                <p className="max-w-md text-xs leading-relaxed">Consent, notices, rights requests, breaches and DPIA reviews for the DPDP Act, 2023, in one workspace.</p>
                <p className="text-xs">© {new Date().getFullYear()} Kavach</p>
            </div>
        </footer>
    );
}

export default function Home() {
    const { hash } = useLocation();

    useEffect(() => {
        if (!hash) return undefined;
        const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        return () => clearTimeout(t);
    }, [hash]);

    return (
        <div className="kv-public min-h-screen text-ink">
            <main>
                <Hero />
                <Capabilities />
                <Features />
                <HowItWorks />
                <Stats />
                <Compare />
                <Milestones />
                <Faq />
                <FinalCta />
            </main>
            <Footer />
        </div>
    );
}
