import { useEffect, useRef, useState } from "react";

const LINKS = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Consent", href: "/consent" },
    { label: "User Rights", href: "/rights" },
    { label: "Breach", href: "/breach" },
    { label: "Audit Trail", href: "/audit" },
];

export default function Navbar({ active = "/" }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [bar, setBar] = useState({ left: 0, width: 0, ready: false });
    const itemRefs = useRef({});

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const moveTo = (href) => {
        const el = itemRefs.current[href];
        if (!el) return;
        setBar({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };

    useEffect(() => {
        moveTo(active);
        const onResize = () => moveTo(active);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [active]);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled || open
                    ? "border-[#263449] bg-[#0B1220]/90 backdrop-blur-lg"
                    : "border-transparent bg-[#0B1220]"
                }`}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Primary">
                <a href="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0F766E]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </span>
                    <span className="text-[17px] font-semibold tracking-tight text-white">
                        Privy<span className="text-[#22D3EE]">Guard</span>
                    </span>
                </a>

                <ul onMouseLeave={() => moveTo(active)} className="relative hidden h-16 items-center lg:flex">
                    {LINKS.map((l) => (
                        <li key={l.href} ref={(el) => (itemRefs.current[l.href] = el)} onMouseEnter={() => moveTo(l.href)}>
                            <a
                                href={l.href}
                                aria-current={active === l.href ? "page" : undefined}
                                className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${active === l.href ? "text-white" : "text-[#CBD5E1] hover:text-white"
                                    }`}
                            >
                                {l.label}
                            </a>
                        </li>
                    ))}
                    <span
                        aria-hidden
                        className={`absolute -bottom-px h-0.5 bg-[#22D3EE] transition-all duration-300 ease-out ${bar.ready ? "opacity-100" : "opacity-0"}`}
                        style={{ left: bar.left + 16, width: Math.max(bar.width - 32, 0) }}
                    />
                </ul>

                <div className="hidden items-center gap-2 lg:flex">
                    <a href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-[#CBD5E1] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                        Login
                    </a>
                    <a
                        href="/register"
                        className="rounded-lg bg-[#0F766E] px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#115E59] hover:shadow-lg hover:shadow-[#0F766E]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220]"
                    >
                        Register
                    </a>
                </div>

                <button
                    onClick={() => setOpen((o) => !o)}
                    aria-label="Toggle menu"
                    aria-expanded={open}
                    className="relative grid h-10 w-10 place-items-center rounded-lg border border-[#263449] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] lg:hidden"
                >
                    <span className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
                    <span className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
                    <span className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`} />
                </button>
            </nav>

            <div className={`grid transition-all duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="min-h-0 overflow-hidden">
                    <ul className="space-y-1 border-t border-[#263449] px-4 py-3">
                        {LINKS.map((l) => (
                            <li key={l.href}>
                                <a
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active === l.href ? "bg-[#111C2E] text-white" : "text-[#CBD5E1] hover:bg-[#111C2E] hover:text-white"
                                        }`}
                                >
                                    {l.label}
                                </a>
                            </li>
                        ))}
                        <li className="grid grid-cols-2 gap-3 pt-2">
                            <a href="/login" className="rounded-lg border border-[#263449] py-2.5 text-center text-sm font-medium text-[#CBD5E1]">Login</a>
                            <a href="/register" className="rounded-lg bg-[#0F766E] py-2.5 text-center text-sm font-semibold text-white hover:bg-[#115E59]">Register</a>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}