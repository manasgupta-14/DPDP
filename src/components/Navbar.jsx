
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getSession, isAdmin, logout } from "../auth/authStore.js";

const LINKS_BEFORE = [{ label: "Home", href: "/" }];

// Sirf admin ko dikhe
const ADMIN_LINKS = [{ label: "Dashboard", href: "/dashboard" }];

// Sabko dikhe
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

    const itemRefs = useRef({});
    const location = useLocation();
    const navigate = useNavigate();

    // Route change pe Navbar re-render hota hai, to session har baar fresh read hota hai.
    const session = getSession();
    const initial = (session?.email || "?").charAt(0).toUpperCase();
    const admin = isAdmin(session);
    const LINKS = [...LINKS_BEFORE, ...(admin ? ADMIN_LINKS : []), ...COMMON_LINKS];

    const onLogout = async () => {
        setOpen(false);
        await logout();
        navigate("/login", { replace: true });
    };

    // Current route
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

    // Position the animated active indicator
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

    // Close mobile menu after navigation
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

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
                {/* Logo */}
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

                {/* Desktop navigation */}
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

                    {/* Animated underline */}
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

                {/* Desktop auth buttons */}
                <div className="hidden items-center gap-2 lg:flex">
                    {session ? (
                        <>
                            <div className="flex items-center gap-2.5 pr-2">
                                <span
                                    aria-hidden="true"
                                    className="grid h-9 w-9 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white"
                                >
                                    {initial}
                                </span>
                                <div className="leading-tight">
                                    <p className="max-w-[170px] truncate text-sm font-medium text-white">{session.email}</p>
                                    <p className="flex items-center gap-1.5 text-xs text-[#CBD5E1]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                                        Signed in{session.role ? ` · ${session.role}` : ""}
                                    </p>
                                </div>
                            </div>

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

                {/* Mobile menu toggle */}
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

            {/* Mobile dropdown */}
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
