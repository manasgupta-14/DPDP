
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getSession, isAdmin, logout } from "../../auth/authStore.js";

const LINKS_BEFORE = [{ label: "Home", href: "/" }];

const COMMON_LINKS = [
    { label: "Consent", href: "/consent" },
    { label: "User Rights", href: "/rights" },
    { label: "Breach", href: "/breach" },
    { label: "Audit Trail", href: "/audit" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [bar, setBar] = useState({
        left: 0,
        width: 0,
        ready: false,
    });

    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const itemRefs = useRef({});
    const location = useLocation();
    const navigate = useNavigate();

    const session = getSession();
    const initial = (session?.email || "?").charAt(0).toUpperCase();
    const admin = isAdmin(session);
    const LINKS = session
        ? (admin ? [...LINKS_BEFORE, ...COMMON_LINKS] : [...LINKS_BEFORE, { label: "My Dashboard", href: "/user" }, { label: "My Tasks", href: "/user/tasks" }, { label: "My Security Reports", href: "/user/reports" }])
        : [...LINKS_BEFORE, ...COMMON_LINKS];

    const onLogout = async () => {
        setOpen(false);
        await logout();
        navigate("/login", { replace: true });
    };

    const active = location.pathname;

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 8);
        };

        onScroll();

        window.addEventListener("scroll", onScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, []);

    const moveTo = (href) => {
        const el = itemRefs.current[href];

        if (!el) {
            setBar((current) => ({ ...current, ready: false }));
            return;
        }

        setBar({
            left: el.offsetLeft,
            width: el.offsetWidth,
            ready: true,
        });
    };

    useEffect(() => {
        moveTo(active);

        const onResize = () => moveTo(active);

        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, [active]);

    const [lastPath, setLastPath] = useState(location.pathname);
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname);
        setOpen(false);
        setProfileOpen(false);
    }

    useEffect(() => {
        if (!profileOpen) return;
        const onDown = (e) => profileRef.current && !profileRef.current.contains(e.target) && setProfileOpen(false);
        const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileOpen]);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled || open
                ? "border-[#263449] bg-[#0B1220]/90 backdrop-blur-lg"
                : "border-transparent bg-[#0B1220]"
                }`}
        >
            <nav
                className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
                aria-label="Primary"
            >

                <Link
                    to="/"
                    className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0F766E]">
                        <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </span>

                    <span className="text-[17px] font-semibold tracking-tight text-white">
                        Privy<span className="text-[#22D3EE]">Guard</span>
                    </span>
                </Link>

                <ul
                    onMouseLeave={() => moveTo(active)}
                    className="relative hidden h-16 items-center lg:flex"
                >
                    {LINKS.map((link) => (
                        <li
                            key={link.href}
                            ref={(el) => {
                                itemRefs.current[link.href] = el;
                            }}
                            onMouseEnter={() => moveTo(link.href)}
                        >
                            <NavLink
                                to={link.href}
                                end={link.href === "/"}
                                aria-current={
                                    active === link.href ? "page" : undefined
                                }
                                className={({ isActive }) =>
                                    `block px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${isActive
                                        ? "text-white"
                                        : "text-[#CBD5E1] hover:text-white"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}

                    <span
                        aria-hidden="true"
                        className={`absolute -bottom-px h-0.5 bg-[#22D3EE] transition-all duration-300 ease-out ${bar.ready ? "opacity-100" : "opacity-0"
                            }`}
                        style={{
                            left: bar.left + 16,
                            width: Math.max(bar.width - 32, 0),
                        }}
                    />
                </ul>

                <div className="hidden items-center gap-2 lg:flex">
                    {session ? (
                        <>
                            <div ref={profileRef} className="relative">
                                {(() => {
                                    const body = (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className="grid h-9 w-9 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white"
                                            >
                                                {initial}
                                            </span>
                                            <div className="text-left leading-tight">
                                                <p className="max-w-[170px] truncate text-sm font-medium text-white">{session.email}</p>
                                                <p className="flex items-center gap-1.5 text-xs text-[#CBD5E1]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                                    Signed in{session.role ? ` · ${session.role}` : ""}
                                                </p>
                                            </div>
                                        </>
                                    );
                                    return admin ? (
                                        <button
                                            type="button"
                                            onClick={() => setProfileOpen((v) => !v)}
                                            aria-haspopup="menu"
                                            aria-expanded={profileOpen}
                                            className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-[#111C2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                                        >
                                            {body}
                                            <svg viewBox="0 0 24 24" className={`h-4 w-4 text-[#CBD5E1] transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2.5 pr-2">{body}</div>
                                    );
                                })()}

                                {admin && profileOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#263449] bg-[#111C2E] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                                    >
                                        <Link
                                            role="menuitem"
                                            to="/dashboard"
                                            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0F766E]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                                        >
                                            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#22D3EE]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {!admin && <Link to="/user/tasks" className="rounded-xl border border-[#263449] px-3.5 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-[#111C2E]">My Tasks</Link>}
                            {!admin && <Link to="/user/reports" className="rounded-xl border border-[#263449] px-3.5 py-2 text-sm font-semibold text-cyan-200 transition-colors hover:bg-[#111C2E]">My Reports</Link>}
                            <button
                                type="button"
                                onClick={onLogout}
                                className="rounded-xl border border-[#263449] px-4 py-2 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-[#22D3EE]/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-xl bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#115E59] hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                            >
                                Login
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((previous) => !previous)}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    className="relative grid h-10 w-10 place-items-center rounded-lg border border-[#263449] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] lg:hidden"
                >
                    <span
                        className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "rotate-45" : "-translate-y-1.5"
                            }`}
                    />

                    <span
                        className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "opacity-0" : "opacity-100"
                            }`}
                    />

                    <span
                        className={`absolute h-0.5 w-5 rounded bg-[#CBD5E1] transition-all duration-300 ${open ? "-rotate-45" : "translate-y-1.5"
                            }`}
                    />
                </button>
            </nav>

            <div
                className={`grid transition-all duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                <div className="min-h-0 overflow-hidden">
                    <ul className="space-y-1 border-t border-[#263449] px-4 py-3">
                        {LINKS.map((link) => (
                            <li key={link.href}>
                                <NavLink
                                    to={link.href}
                                    end={link.href === "/"}
                                    className={({ isActive }) =>
                                        `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                            ? "bg-[#111C2E] text-white"
                                            : "text-[#CBD5E1] hover:bg-[#111C2E] hover:text-white"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}

                        {session ? (
                            <li className="space-y-3 pt-2">
                                <p className="flex items-center gap-2 px-1 text-xs text-[#CBD5E1]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                    <span className="truncate">Signed in as {session.email}</span>
                                </p>
                                {!admin && <Link to="/user/reports" className="block rounded-lg bg-[#111C2E] py-2.5 text-center text-sm font-semibold text-cyan-200">My Security Reports</Link>}
                                {admin && (
                                    <Link
                                        to="/dashboard"
                                        className="block rounded-lg bg-[#0F766E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#115E59]"
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="w-full rounded-lg border border-[#263449] py-2.5 text-center text-sm font-medium text-[#CBD5E1] transition-colors hover:text-white"
                                >
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <li className="pt-2">
                                <Link
                                    to="/login"
                                    className="block rounded-xl bg-[#0F766E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#115E59]"
                                >
                                    Login
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </header>
    );
}
