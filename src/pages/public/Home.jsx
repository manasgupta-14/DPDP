import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ADMIN_REGISTER_ENABLED, getSession, homePath, isAdmin, roleInfo } from "../../auth/authStore.js";
import { CountUp, useInView } from "../../components/charts/kit.jsx";
import { Logo } from "../../components/shared/Brand.jsx";
import { CAPABILITIES, CLOCKS, COMPARE_PAIRS, ECOSYSTEM, FAQ, FEATURES, ICONS, MILESTONES, ROTATING_WORDS, STATS, STEPS } from "../../components/public/home/data.js";


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

const TONES = ["blue", "pink", "mint", "orange", "purple", "emerald"];

function SectionHead({ eyebrow, title, text, id, center = true }) {
    return (
        <div className={`kv-focus ${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
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
        <span key={i} className="kv-grad-b inline-block font-bold" style={{ animation: "pg-rise .45s ease-out both" }}>
            {ROTATING_WORDS[i]}
        </span>
    );
}

function cta() {
    const s = getSession();
    if (!s) return { to: "/login", label: "Sign in to Kavach" };
    return { to: homePath(s), label: `Open ${roleInfo(s).label} dashboard` };
}


function hubLink(item) {
    const s = getSession();
    return s && isAdmin(s) ? item.to : "/#features";
}

const HUB_NAMES = [
    { text: "Kavach", lang: "en" },
    { text: "कवच", lang: "hi" },
];

function HubName() {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
        const id = setInterval(() => setI((n) => (n + 1) % HUB_NAMES.length), 3200);
        return () => clearInterval(id);
    }, []);
    const cur = HUB_NAMES[i];
    return (
        <span className="kv-hub-name kv-hub-name-anim block" aria-label="Kavach">
            <span key={i} lang={cur.lang} aria-hidden="true" className="kv-name-word">
                {Array.from(cur.text).map((ch, k) => (
                    <span key={k} className="kv-name-ch" style={{ "--k": k }}>
                        {ch}
                    </span>
                ))}
            </span>
        </span>
    );
}

function useTilt(max = 7) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
        const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (!fine || calm) return undefined;
        let raf = 0;
        const move = (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
                el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
                el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
                el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
                el.dataset.tilt = "on";
            });
        };
        const leave = () => {
            cancelAnimationFrame(raf);
            el.style.setProperty("--ry", "0deg");
            el.style.setProperty("--rx", "0deg");
            delete el.dataset.tilt;
        };
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseleave", leave);
        };
    }, [max]);
    return ref;
}

function HubCard() {
    const tiltRef = useTilt();
    return (
        <div className="kv-hub-float">
        <div ref={tiltRef} className="kv-hub kv-hub-tilt">
            <span className="kv-hub-glare" aria-hidden="true" />
            <div className="kv-hub-head">
                <span className="flex min-w-0 items-center gap-3">
                    <span className="kv-hub-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 2.8l7.2 2.9v5.6c0 4.7-3 8.3-7.2 10-4.2-1.7-7.2-5.3-7.2-10V5.7L12 2.8z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8.6 12.1l2.3 2.3 4.6-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="min-w-0">
                        <HubName />
                        <span className="kv-hub-tag block">All your privacy work in one place.</span>
                    </span>
                </span>
                <span className="kv-hub-live">{ECOSYSTEM.length} modules</span>
            </div>
            <ul className="kv-hub-grid">
                {ECOSYSTEM.map((e, i) => (
                    <li key={e.key} style={{ animation: `pg-rise .5s ease-out ${380 + i * 80}ms both` }}>
                        <Link to={hubLink(e)} className="kv-hub-card" data-tone={e.tone} aria-label={`${e.title}: ${e.text} ${e.status}`}>
                            <span className="kv-hub-ico">
                                <Glyph name={e.icon} />
                            </span>
                            <span className="min-w-0">
                                <span className="kv-hub-title">{e.title}</span>
                                <span className="kv-hub-text">{e.text}</span>
                                <span className="kv-hub-status" data-tone={e.statusTone}>
                                    <i aria-hidden="true" />
                                    {e.status}
                                </span>
                            </span>
                            <span className="kv-hub-go" aria-hidden="true">
                                <Glyph name="arrow" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            <div className="kv-clocks">
                <div className="kv-clocks-head">
                    <span>
                        <b>DPDP clocks Kavach keeps</b>
                        <small>Time limits Kavach tracks under the DPDP Act and Rules</small>
                    </span>
                    <span className="kv-clocks-live">
                        <i aria-hidden="true" />
                        ALWAYS ON
                    </span>
                </div>
                <ul className="kv-clocks-grid">
                    {CLOCKS.map((c) => (
                        <li key={c.key} className="kv-clock" data-tone={c.tone}>
                            <span className="kv-clock-ring" aria-hidden="true">
                                <svg viewBox="0 0 48 48">
                                    <circle className="trk" cx="24" cy="24" r="20" />
                                    <circle className="bar" cx="24" cy="24" r="20" pathLength="100" style={{ "--fill": c.fill * 100 }} />
                                </svg>
                                <Glyph name={c.icon} className="h-4 w-4" />
                            </span>
                            <span className="kv-clock-val">
                                {c.value} <small>{c.unit}</small>
                            </span>
                            <span className="kv-clock-text">{c.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        </div>
    );
}

function useFitScreen(ref) {
    useEffect(() => {
        const root = ref.current;
        if (!root) return undefined;
        const fit = () => {
            const kids = Array.from(root.querySelectorAll(":scope > .kv-fit"));
            const setZoom = (z) => kids.forEach((k) => { k.style.zoom = z >= 1 ? "" : z.toFixed(3); });
            const tallest = () => Math.max(...kids.map((k) => k.getBoundingClientRect().height));
            setZoom(1);
            if (!window.matchMedia("(min-width: 1024px)").matches) return;
            const avail = window.innerHeight - 76 - 12;
            if (tallest() <= avail) return;
            let lo = 0.5;
            let hi = 1;
            for (let i = 0; i < 8; i += 1) {
                const mid = (lo + hi) / 2;
                setZoom(mid);
                if (tallest() <= avail) lo = mid;
                else hi = mid;
            }
            setZoom(lo);
        };
        fit();
        window.addEventListener("resize", fit);
        document.fonts?.ready.then(fit);
        return () => window.removeEventListener("resize", fit);
    }, [ref]);
}

function Hero() {
    const c = cta();
    const gridRef = useRef(null);
    useFitScreen(gridRef);
    return (
        <section data-bg="trust" aria-labelledby="home-title" className="relative overflow-hidden border-b border-line lg:flex lg:min-h-[100svh] lg:items-center">
            <div ref={gridRef} className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10 lg:pb-3 lg:pt-[4.75rem] xl:gap-12">
                <div className="kv-hero-copy kv-fit kv-focus min-w-0">
                    <span className="kv-new-chip inline-flex max-w-full items-center gap-2 rounded-full px-1.5 py-1 pr-3 text-xs font-semibold text-ink-2" style={{ animation: "pg-rise .5s ease-out both" }}>
                        <span className="tag shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white">DPDP</span>
                        <span className="min-w-0">Built for the DPDP Act, 2023 and DPDP Rules, 2025</span>
                    </span>
                    <h1 id="home-title" className="mt-6 text-[34px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[46px]" style={{ animation: "pg-rise .6s ease-out 80ms both" }}>
                        Digital Personal Data <span className="kv-grad-a">Protection Compliance,</span> Organised As <span className="kv-grad-b">One Workspace</span>
                    </h1>
                    <p className="mt-5 text-lg font-semibold text-ink-2" style={{ animation: "pg-rise .6s ease-out 160ms both" }}>
                        Keep <RotatingWord /> in one place.
                    </p>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-3" style={{ animation: "pg-rise .6s ease-out 220ms both" }}>
                        Kavach helps teams manage consent, privacy notices, rights requests, grievances, breaches and DPIA reviews, with an audit trail behind every change.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3" style={{ animation: "pg-rise .6s ease-out 300ms both" }}>
                        <Link to={c.to} className="kv-cta-main inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                            {c.label}
                            <Glyph name="arrow" className="h-4 w-4" />
                        </Link>
                        {ADMIN_REGISTER_ENABLED && (
                            <Link to="/admin/register" className="kv-cta-soft inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
                                Get started
                                <Glyph name="arrow" className="h-4 w-4" />
                            </Link>
                        )}
                        <a href="/#how" className="kv-cta-soft inline-flex items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-5 text-sm font-semibold">
                            <span className="play" aria-hidden="true">
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                                    <path d={ICONS.play} />
                                </svg>
                            </span>
                            See how it works
                        </a>
                    </div>
                </div>

                <div id="ecosystem" className="kv-fit relative min-w-0 scroll-mt-24" style={{ animation: "pg-rise .7s ease-out 200ms both" }}>
                    <HubCard />
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
                <SectionHead id="feat-title" eyebrow="Capabilities" title="Core modules" text="Each module covers one DPDP duty, and every change is recorded in a single audit trail." />
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.key} delay={i * 70} className="kd-card p-6">
                            <span className="kv-ico3d" data-tone={TONES[i % TONES.length]}>
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
                <SectionHead id="how-title" eyebrow="Implementation" title="How teams roll out Kavach" />
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
                        <span className="kv-ico3d float-right" data-tone={TONES[(i + 2) % TONES.length]}>
                            <Glyph name={s.icon} />
                        </span>
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
    return (
        <section data-bg="care" aria-labelledby="cmp-title" className="border-y border-line bg-surface/35 py-20 sm:py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <SectionHead id="cmp-title" eyebrow="Comparison" title="Kavach compared with spreadsheets" text="What an auditor asks for, and whether each approach can show it." />
                <div className="kv-vs mt-10">
                    <Reveal className="kv-vs-card is-no">
                        <div className="kv-vs-head">
                            <span className="kv-vs-badge" aria-hidden="true">
                                <Glyph name="x" className="h-4 w-4" />
                            </span>
                            <h3>Spreadsheets &amp; Email</h3>
                        </div>
                        <dl>
                            {COMPARE_PAIRS.map(([label, a]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{a}</dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>

                    <span className="kv-vs-arrow" aria-hidden="true">
                        <Glyph name="arrow" className="h-5 w-5" />
                    </span>

                    <Reveal delay={120} className="kv-vs-card is-yes">
                        <div className="kv-vs-head">
                            <span className="kv-vs-badge" aria-hidden="true">
                                <Glyph name="check" className="h-4 w-4" />
                            </span>
                            <h3>With Kavach</h3>
                        </div>
                        <dl>
                            {COMPARE_PAIRS.map(([label, , b]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{b}</dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function Milestones() {
    const today = new Date();
    return (
        <section aria-labelledby="ms-title" className="py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <SectionHead id="ms-title" eyebrow="DPDP timeline" title="Commencement dates" text="The DPDP Rules, 2025 apply in three phases. Confirm dates against official MeitY notifications." />
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
                <SectionHead id="faq-title" eyebrow="FAQ" title="Frequently asked questions" />
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

function CtaRibbon() {
    const stop = (o, v, op) => <stop offset={o} style={{ stopColor: `var(${v})` }} stopOpacity={op} />;
    return (
        <svg className="kv-cta2-ribbon" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="kvc-rb" x1="0" y1="0" x2="1" y2="0">
                    {stop("0%", "--k-c6", 0.12)}
                    {stop("35%", "--k-c1", 0.5)}
                    {stop("70%", "--k-c5", 0.5)}
                    {stop("100%", "--k-c3", 0.35)}
                </linearGradient>
                <linearGradient id="kvc-rb2" x1="0" y1="0" x2="1" y2="0">
                    {stop("0%", "--k-c2", 0.35)}
                    {stop("55%", "--k-c5", 0.35)}
                    {stop("100%", "--k-c1", 0.12)}
                </linearGradient>
            </defs>
            <path fill="url(#kvc-rb)" d="M560,360 C690,300 800,330 900,262 C950,228 980,214 1000,206 L1000,268 C960,286 920,316 860,338 C800,360 720,352 640,360 Z" />
            <path fill="url(#kvc-rb2)" d="M0,118 C60,96 110,70 170,52 C240,30 300,24 380,0 L300,0 C240,14 180,22 120,34 C70,44 30,60 0,70 Z" />
        </svg>
    );
}

function FinalCta() {
    const c = cta();
    return (
        <section data-bg="action" aria-labelledby="cta-title" className="py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <Reveal className="kv-cta2 px-6 py-14 text-center sm:px-12">
                    <CtaRibbon />
                    <span className="kv-cta2-focus" aria-hidden="true" />
                    <span className="kv-cta2-bubble is-a" aria-hidden="true" />
                    <span className="kv-cta2-bubble is-b" aria-hidden="true" />
                    <span className="kv-cta2-bubble is-c" aria-hidden="true" />
                    <span className="kv-cta2-mark relative mx-auto mb-5" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M12 2.8l7.2 2.9v5.6c0 4.7-3 8.3-7.2 10-4.2-1.7-7.2-5.3-7.2-10V5.7L12 2.8z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8.6 12.1l2.3 2.3 4.6-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <h2 id="cta-title" className="relative text-3xl font-bold tracking-tight sm:text-4xl">
                        Manage your DPDP obligations in one workspace
                    </h2>
                    <p className="relative mx-auto mt-4 max-w-xl">Sign in to set up purposes, publish your first notice and start recording consent.</p>
                    <Link to={c.to} className="kv-cta-main relative mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
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
