import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getSession, homePath, logout, roleInfo } from "../../auth/authStore.js";
import { Logo } from "../shared/Brand.jsx";
import ThemeToggle from "../shared/ThemeToggle.jsx";
import { SECTION_LINKS } from "./home/data.js";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [solid, setSolid] = useState(false);
    const session = getSession();
    const info = session ? roleInfo(session) : null;

    useEffect(() => {
        const onScroll = () => setSolid(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname, location.hash]);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const isOn = (href) => location.pathname === "/" && location.hash === href.slice(href.indexOf("#"));

    return (
        <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] ${solid || open ? "border-b border-line bg-surface/90 shadow-[var(--k-shadow-sm)] backdrop-blur-md" : "border-b border-transparent bg-transparent"}`}>
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                <Link to="/" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    <Logo />
                </Link>

                <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
                    {SECTION_LINKS.map((l) => (
                        <a key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-subtle hover:text-ink ${isOn(l.href) ? "text-brand-ink" : "text-ink-3"}`}>
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    {session ? (
                        <>
                            <Link to={homePath(session)} className="kv-nav-dash hidden items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                                </svg>
                                Open {info.label} dashboard
                            </Link>
                            <button type="button" onClick={onLogout} className="kv-nav-out hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex">
                                Logout
                            </button>
                        </>
                    ) : (
                        location.pathname !== "/login" && (
                            <Link to="/login" className="kv-nav-dash hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex">
                                Sign in
                            </Link>
                        )
                    )}
                    <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="kv-icon-btn lg:hidden">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                            <path d={open ? "M18 6L6 18M6 6l12 12" : "M4 7h16M4 12h16M4 17h16"} />
                        </svg>
                    </button>
                </div>
            </div>

            {open && (
                <div className="pg-alert border-t border-line bg-surface px-4 pb-4 pt-2 lg:hidden">
                    <ul className="space-y-1">
                        {SECTION_LINKS.map((l) => (
                            <li key={l.href}>
                                <a href={l.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-subtle">
                                    {l.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 grid gap-2">
                        {session ? (
                            <>
                                <NavLink to={homePath(session)} className="kv-nav-dash rounded-full py-2.5 text-center text-sm font-semibold">
                                    Open {info.label} dashboard
                                </NavLink>
                                <button type="button" onClick={onLogout} className="kv-nav-out rounded-full py-2.5 text-sm font-semibold">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="kv-nav-dash rounded-full py-2.5 text-center text-sm font-semibold">
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
