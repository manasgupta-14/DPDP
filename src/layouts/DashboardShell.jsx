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
        <div className="relative flex h-full flex-col overflow-hidden border-r border-white/[0.06] bg-[#0B1220] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[#0F766E]/30 blur-[90px]" />
                <div className="absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[#22D3EE]/10 blur-[90px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]" />
            </div>

            <Link to="/" onClick={onNavigate} className="group relative flex items-center gap-3 px-5 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] shadow-[0_8px_20px_-6px_rgba(34,211,238,0.45)] ring-1 ring-white/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                    <Icon name="shield" className="h-5 w-5 text-[#CCFBF1]" />
                </span>
                <span className="min-w-0 leading-tight">
                    <span className="block text-[17px] font-bold tracking-tight">Privy<span className="text-[#22D3EE]">Guard</span></span>
                    <span className="block truncate text-[11px] font-medium text-[#94A3B8]">{subtitle}</span>
                </span>
            </Link>
            <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-[#263449] to-transparent" />

            <nav aria-label="Primary" className="pg-scroll relative flex-1 overflow-y-auto px-3 py-4">
                {sections.map((section) => (
                    <div key={section.label} className="mb-5 last:mb-0">
                        <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#64748B]">{section.label}</p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={onNavigate}
                                    className={({ isActive }) =>
                                        `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                                            isActive
                                                ? "bg-gradient-to-r from-[#0F766E] to-[#0F766E]/70 text-white shadow-[0_8px_22px_-10px_rgba(34,211,238,0.6)] ring-1 ring-white/10 before:absolute before:-left-3 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-[#22D3EE] before:shadow-[0_0_12px_#22D3EE]"
                                                : "text-[#CBD5E1] hover:translate-x-0.5 hover:bg-white/[0.05] hover:text-white"
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {item.icon && (
                                                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${isActive ? "bg-white/15 text-white" : "bg-white/[0.04] text-[#94A3B8] group-hover:bg-[#0F766E]/30 group-hover:text-[#22D3EE]"}`}>
                                                    <Icon name={item.icon} className="h-4 w-4" />
                                                </span>
                                            )}
                                            <span className="truncate">{item.label}</span>
                                            {item.badge > 0 && (
                                                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#DC2626]/90 px-1.5 text-[11px] font-bold text-white">{item.badge}</span>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="relative m-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs leading-relaxed text-[#94A3B8]">
                <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#22D3EE]/70 text-[11px] font-bold text-white">{profile?.initials || "?"}</span>
                    <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-white">{profile?.name || "Admin"}</span>
                        <span className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]"><span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A]" />Signed in</span>
                    </span>
                </div>
                <p className="mt-2.5 text-[11px] text-[#64748B]">{footer}</p>
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
        <div className="pg-app min-h-screen bg-[#F8FAFC] text-[#0F172A]">
            <style>{`
        @keyframes pg-rise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: none; } }
        @keyframes pg-fill { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes pg-glow { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
        @keyframes pg-badge-pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
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

                <header className="pg-topbar sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[#E2E8F0]/80 bg-white/70 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6">
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


                    <div ref={bellRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setBellOpen((v) => !v)}
                            aria-label={bell.title}
                            aria-expanded={bellOpen}
                            className="relative grid h-10 w-10 place-items-center rounded-lg text-[#334155] transition hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        >
                            <Icon name="bell" className="h-5 w-5" />
                            {bell.count > 0 && <span className="absolute right-1.5 top-1.5 grid animate-[pg-badge-pop_.4s_ease-out_both] h-4 min-w-4 place-items-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white ring-2 ring-white">{bell.count}</span>}
                        </button>
                        {bellOpen && (
                            <div className="pg-pop-menu absolute right-0 mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
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
                                        <Link key={n.key || n.title} to={n.to} onClick={() => setBellOpen(false)} className="block rounded-lg px-3 py-2 transition hover:bg-[#F1F5F9] hover:pl-4">{inner}</Link>
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
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0F766E] text-sm font-semibold text-white ring-2 ring-white shadow-[0_0_0_3px_rgba(34,211,238,0.25)]">{profile?.initials || "?"}</span>
                            <span className="hidden text-left leading-tight sm:block">
                                <span className="block max-w-[140px] truncate text-sm font-semibold">{profile?.name}</span>
                                <span className="block text-xs text-[#64748B]">{roleLabel}</span>
                            </span>
                            <Icon name="chevron" className={`hidden h-4 w-4 text-[#64748B] transition-transform sm:block ${menu ? "rotate-180" : ""}`} />
                        </button>
                        {menu && (
                            <div role="menu" className="pg-pop-menu absolute right-0 mt-2 w-60 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
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
