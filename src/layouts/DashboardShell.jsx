import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getProfile, logout } from "../auth/authStore.js";
import { Logo } from "../components/shared/Brand.jsx";
import Icon from "../components/shared/Icon.jsx";
import PageLoader from "../components/shared/PageLoader.jsx";
import ThemeToggle from "../components/shared/ThemeToggle.jsx";

// Admin, DPO aur User teeno panels ka ek hi frame: bayen sidebar, upar header, beech me page.
// Design: saaf aur seedha (simple). Rang theme tokens se, isliye dark mode me bhi sab padhne layak.

function useClickAway(ref, onAway) {
    useEffect(() => {
        const onDown = (e) => ref.current && !ref.current.contains(e.target) && onAway();
        const onKey = (e) => e.key === "Escape" && onAway();
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [ref, onAway]);
}

function Sidebar({ sections, footer, subtitle, onNavigate }) {
    return (
        <div className="kv-side">
            <Link to="/" onClick={onNavigate} className="flex h-16 shrink-0 items-center border-b border-white/50 px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <Logo sub={subtitle} className="min-w-0" />
            </Link>

            <nav aria-label="Primary" className="pg-scroll flex-1 overflow-y-auto py-4">
                {sections.map((section) => (
                    <div key={section.label} className="mb-5 last:mb-0">
                        <p className="kv-side-section">{section.label}</p>
                        {section.items.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `kv-side-link ${isActive ? "is-active" : ""}`}>
                                {item.icon && (
                                    <span className="kv-side-ico" data-tone={item.tone || "indigo"}>
                                        <Icon name={item.icon} className="h-[18px] w-[18px]" />
                                    </span>
                                )}
                                <span className="truncate">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="kv-side-badge" aria-label={`${item.badge} new`} title={`${item.badge} new`}>
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="kv-side-note m-3 rounded-xl border p-3 text-[11.5px] leading-relaxed text-muted">
                <p className="flex items-center gap-1.5 font-semibold text-ink-2">
                    <Icon name="shield" className="h-3.5 w-3.5 text-brand-ink" />
                    DPDP Act, 2023
                </p>
                <p className="mt-1">{footer}</p>
            </div>
        </div>
    );
}

export default function DashboardShell({
    sections,
    subtitle = "DPDP Act, 2023",
    roleLabel = "User",
    profileLink,
    profileLabel = "Profile",
    search = true,
    bell = { title: "Notifications", items: [], count: 0 },
    footer = "Kavach workspace for the DPDP Act, 2023 and DPDP Rules, 2025.",
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const profile = getProfile();

    const [query, setQuery] = useState("");
    const [drawer, setDrawer] = useState(false);
    const [menu, setMenu] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const [showTop, setShowTop] = useState(false);
    const menuRef = useRef(null);
    const bellRef = useRef(null);
    const searchRef = useRef(null);
    const pageLabel = sections
        .flatMap((x) => x.items)
        .filter((i) => (i.end ? location.pathname === i.to : location.pathname === i.to || location.pathname.startsWith(`${i.to}/`)))
        .sort((a, b) => b.to.length - a.to.length)[0]?.label;

    useClickAway(menuRef, () => setMenu(false));
    useClickAway(bellRef, () => setBellOpen(false));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && searchRef.current) {
                e.preventDefault();
                searchRef.current.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="pg-app min-h-screen text-ink">
            <aside className="kv-sidebar fixed inset-y-3 left-3 z-30 hidden w-64 lg:block">
                <Sidebar sections={sections} footer={footer} subtitle={subtitle} />
            </aside>

            {drawer && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="pg-modal-backdrop absolute inset-0" />
                    <aside className="pg-pop absolute inset-y-2 left-2 w-72 max-w-[85%]">
                        <Sidebar sections={sections} footer={footer} subtitle={subtitle} onNavigate={() => setDrawer(false)} />
                    </aside>
                </div>
            )}

            <div className="pg-dash lg:pl-[17.25rem]">
                <header className="kv-topbar sticky top-3 z-20 mx-3 mt-3 flex h-16 items-center gap-2 rounded-[20px] px-3 sm:mx-5 sm:gap-3 sm:px-4 lg:ml-0">
                    <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="kv-icon-btn lg:hidden">
                        <Icon name="menu" className="h-5 w-5" />
                    </button>

                    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] text-muted md:flex">
                        <span className="kv-role-chip">{roleLabel}</span>
                        <Icon name="chevron" className="h-3.5 w-3.5 -rotate-90 text-faint" />
                        <span className="truncate font-semibold text-ink">{pageLabel || "Dashboard"}</span>
                    </nav>

                    <div className={search ? "hidden flex-1 sm:block" : "flex-1"} />

                    {search && (
                        <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none xl:w-72">
                            <span className="sr-only">Search records</span>
                            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                                ref={searchRef}
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={typeof window !== "undefined" && window.innerWidth < 640 ? "Search" : "Search records"}
                                className="h-10 w-full min-w-0 rounded-[10px] border border-line bg-soft pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-brand focus:bg-surface focus:outline-none sm:pr-14"
                            />
                            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">Ctrl K</kbd>
                        </label>
                    )}

                    <ThemeToggle />

                    <div ref={bellRef} className="relative">
                        <button type="button" onClick={() => setBellOpen((v) => !v)} aria-label={bell.title} aria-expanded={bellOpen} className="kv-icon-btn">
                            <Icon name="bell" className="h-5 w-5" />
                            {bell.count > 0 && (
                                <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] animate-[pg-badge-pop_.4s_ease-out_both] place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                                    {bell.count > 99 ? "99+" : bell.count}
                                </span>
                            )}
                        </button>
                        {bellOpen && (
                            <div className="kv-menu pg-alert absolute right-0 mt-2 w-80 p-2">
                                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{bell.title}</p>
                                {bell.items.length === 0 && (
                                    <p className="flex items-center gap-2 px-3 py-3 text-sm text-ink-3">
                                        <Icon name="check" className="h-4 w-4 text-ok-ink" />
                                        {bell.emptyText || "Nothing new."}
                                    </p>
                                )}
                                <div className="max-h-80 overflow-y-auto">
                                    {bell.items.map((n, ki) => {
                                        const inner = (
                                            <>
                                                <p className="truncate text-sm font-semibold text-ink">{n.title}</p>
                                                <p className="mt-0.5 text-xs text-muted">{n.meta}</p>
                                            </>
                                        );
                                        return n.to ? (
                                            <Link key={`${n.key || n.title}-${ki}`} to={n.to} onClick={() => setBellOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-subtle">
                                                {inner}
                                            </Link>
                                        ) : (
                                            <div key={`${n.key || n.title}-${ki}`} className="rounded-lg px-3 py-2">
                                                {inner}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setMenu((v) => !v)}
                            aria-expanded={menu}
                            aria-haspopup="menu"
                            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:pr-2"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">{profile?.initials || "?"}</span>
                            <span className="hidden text-left leading-tight sm:block">
                                <span className="block max-w-[140px] truncate text-sm font-semibold text-ink">{profile?.name || roleLabel}</span>
                                <span className="block text-xs text-muted">{roleLabel}</span>
                            </span>
                            <Icon name="chevron" className={`hidden h-4 w-4 text-muted transition-transform sm:block ${menu ? "rotate-180" : ""}`} />
                        </button>
                        {menu && (
                            <div role="menu" className="kv-menu pg-alert absolute right-0 mt-2 w-64 p-1.5">
                                <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{profile?.initials || "?"}</span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{profile?.name}</p>
                                        <p className="truncate text-xs text-muted">{profile?.email}</p>
                                        <span className="kv-role-chip mt-1">{roleLabel}</span>
                                    </div>
                                </div>
                                <div className="pt-1">
                                    {profileLink && (
                                        <Link role="menuitem" to={profileLink} onClick={() => setMenu(false)} className="kv-menu-item">
                                            <Icon name="gear" className="h-4 w-4" /> {profileLabel}
                                        </Link>
                                    )}
                                    <Link role="menuitem" to="/" onClick={() => setMenu(false)} className="kv-menu-item">
                                        <Icon name="home" className="h-4 w-4" /> Back to website
                                    </Link>
                                    <button role="menuitem" type="button" onClick={onLogout} className="kv-menu-item is-danger">
                                        <Icon name="logout" className="h-4 w-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet context={{ query: query.trim().toLowerCase(), profile }} />
                    </Suspense>
                </main>
            </div>

            {showTop && (
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className="ap-fab">
                    <Icon name="chevron" className="h-5 w-5 rotate-180" />
                </button>
            )}
        </div>
    );
}
