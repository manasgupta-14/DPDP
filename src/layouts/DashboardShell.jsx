import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getProfile, logout } from "../auth/authStore.js";
import Icon from "../components/shared/Icon.jsx";
import PageLoader from "../components/shared/PageLoader.jsx";

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

function Sidebar({ sections, footer, profile, subtitle, onNavigate }) {
    return (
        <div className="flex h-full flex-col border-r border-[#263449] bg-[#0B1220] text-white">
            <Link to="/" onClick={onNavigate} className="flex items-center gap-3 border-b border-[#263449] px-5 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                <Icon name="shield" className="h-7 w-7 shrink-0 text-[#22D3EE]" />
                <span className="min-w-0 leading-tight">
                    <span className="block text-lg font-semibold tracking-tight">PrivyGuard</span>
                    <span className="block truncate text-xs text-[#94A3B8]">{subtitle}</span>
                </span>
            </Link>

            <nav aria-label="Primary" className="pg-scroll flex-1 overflow-y-auto px-3 py-4">
                {sections.map((section) => (
                    <div key={section.label} className="mb-5 last:mb-0">
                        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">{section.label}</p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={onNavigate}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3 py-2 text-[14.5px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                                            isActive
                                                ? "bg-[#0F766E] text-white"
                                                : "text-[#CBD5E1] hover:bg-[#111C2E] hover:text-white"
                                        }`
                                    }
                                >
                                    <span className="truncate">{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#DC2626]/90 px-1.5 text-[11px] font-bold text-white">{item.badge}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="border-t border-[#263449] px-5 py-4 text-xs leading-relaxed text-[#94A3B8]">
                <p className="truncate text-[#CBD5E1]">Signed in as {profile?.name || "Admin"}</p>
                <p className="mt-1.5">{footer}</p>
            </div>
        </div>
    );
}

export default function DashboardShell({
    sections,
    subtitle = "DPDP Act, 2023",
    roleLabel,
    profileLink,
    profileLabel = "Profile",
    search = true,
    mockBadge = false,
    bell = { title: "Notifications", items: [], count: 0 },
    footer = "Demo app for the DPDP Act, 2023 and DPDP Rules, 2025. Not legal advice.",
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const profile = getProfile();

    const [query, setQuery] = useState("");
    const [drawer, setDrawer] = useState(false);
    const [menu, setMenu] = useState(false);
    const [bellOpen, setBellOpen] = useState(false);
    const menuRef = useRef(null);
    const bellRef = useRef(null);
    const searchRef = useRef(null);
    const pageLabel = sections.flatMap((x) => x.items).find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)))?.label;

    useClickAway(menuRef, () => setMenu(false));
    useClickAway(bellRef, () => setBellOpen(false));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

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
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
            <style>{`
        @keyframes pg-rise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pg-fill { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes pg-glow { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
        @media (prefers-reduced-motion: reduce) { .pg-dash, .pg-dash * { animation: none !important; transition: none !important; } }
      `}</style>

            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
                <Sidebar sections={sections} footer={footer} profile={profile} subtitle={subtitle} />
            </aside>

            {drawer && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="absolute inset-0 bg-[#0B1220]/60" />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">
                        <Sidebar sections={sections} footer={footer} profile={profile} subtitle={subtitle} onNavigate={() => setDrawer(false)} />
                    </aside>
                </div>
            )}

            <div className="pg-dash lg:pl-64">

                <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[#E2E8F0] bg-white/85 px-4 backdrop-blur-lg sm:px-6">
                    <button
                        type="button"
                        onClick={() => setDrawer(true)}
                        aria-label="Open menu"
                        className="grid h-10 w-10 place-items-center rounded-lg border border-[#E2E8F0] text-[#334155] lg:hidden"
                    >
                        <Icon name="menu" className="h-5 w-5" />
                    </button>

                    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs text-[#64748B] md:flex">
                        <span className="truncate">{roleLabel}</span>
                        <span aria-hidden="true">/</span>
                        <span className="truncate font-semibold text-[#0F172A]">{pageLabel || "Dashboard"}</span>
                    </nav>

                    <div className="flex-1" />

                    {search && (
                        <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
                            <span className="sr-only">Search records</span>
                            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748B]" />
                            <input
                                ref={searchRef}
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search records"
                                className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-12 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0F766E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40"
                            />
                            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B] sm:block">Ctrl K</kbd>
                        </label>
                    )}

                    {mockBadge && <span className="hidden rounded-full bg-[#D97706]/15 px-3 py-1 text-[11px] font-bold tracking-wide text-[#B45309] sm:inline">MOCK DATA</span>}

                    <div ref={bellRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setBellOpen((v) => !v)}
                            aria-label={bell.title}
                            aria-expanded={bellOpen}
                            className="relative grid h-10 w-10 place-items-center rounded-lg text-[#334155] transition hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        >
                            <Icon name="bell" className="h-5 w-5" />
                            {bell.count > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white ring-2 ring-white">{bell.count}</span>}
                        </button>
                        {bellOpen && (
                            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
                                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">{bell.title}</p>
                                {bell.items.length === 0 && <p className="px-3 py-3 text-sm text-[#64748B]">{bell.emptyText || "Nothing new."}</p>}
                                {bell.items.map((n) => {
                                    const inner = (
                                        <>
                                            <p className="truncate text-sm font-medium text-[#0F172A]">{n.title}</p>
                                            <p className="text-xs text-[#64748B]">{n.meta}</p>
                                        </>
                                    );
                                    return n.to ? (
                                        <Link key={n.key || n.title} to={n.to} onClick={() => setBellOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-[#F1F5F9]">{inner}</Link>
                                    ) : (
                                        <div key={n.key || n.title} className="rounded-lg px-3 py-2 hover:bg-[#F1F5F9]">{inner}</div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setMenu((v) => !v)}
                            aria-expanded={menu}
                            aria-haspopup="menu"
                            className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        >
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white">{profile?.initials || "?"}</span>
                            <span className="hidden text-left leading-tight sm:block">
                                <span className="block max-w-[140px] truncate text-sm font-semibold">{profile?.name}</span>
                                <span className="block text-xs text-[#64748B]">{roleLabel}</span>
                            </span>
                            <Icon name="chevron" className={`hidden h-4 w-4 text-[#64748B] transition-transform sm:block ${menu ? "rotate-180" : ""}`} />
                        </button>
                        {menu && (
                            <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
                                <div className="border-b border-[#E2E8F0] px-3 pb-2.5 pt-2">
                                    <p className="truncate text-sm font-semibold">{profile?.name}</p>
                                    <p className="truncate text-xs text-[#64748B]">{profile?.email}</p>
                                </div>
                                {profileLink && (
                                    <Link role="menuitem" to={profileLink} onClick={() => setMenu(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#334155] hover:bg-[#F1F5F9]">
                                        <Icon name="gear" className="h-4 w-4" /> {profileLabel}
                                    </Link>
                                )}
                                <Link role="menuitem" to="/" onClick={() => setMenu(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#334155] hover:bg-[#F1F5F9]">
                                    <Icon name="home" className="h-4 w-4" /> Back to website
                                </Link>
                                <button role="menuitem" type="button" onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#B91C1C] hover:bg-[#FEF2F2]">
                                    <Icon name="logout" className="h-4 w-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet context={{ query: query.trim().toLowerCase(), profile }} />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
