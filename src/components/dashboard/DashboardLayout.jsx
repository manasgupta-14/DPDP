import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getProfile, logout } from "../../auth/authStore.js";
import { NAV, NOTIFICATIONS } from "../../data/dashboardMock.js";
import Icon from "./Icon.jsx";

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

function Sidebar({ onNavigate }) {
    return (
        <div className="flex h-full flex-col border-r border-[#263449] bg-[#0B1220] text-white">
            <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-6 py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                <Icon name="shield" className="h-7 w-7 text-[#22D3EE]" />
                <span className="text-xl font-semibold tracking-tight">PrivyGuard</span>
            </Link>

            <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
                {NAV.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${
                                isActive
                                    ? "bg-[#0F766E] text-white shadow-[0_6px_18px_rgba(15,118,110,0.4)]"
                                    : "text-[#CBD5E1] hover:bg-[#111C2E] hover:text-white"
                            }`
                        }
                    >
                        <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.highlight && (
                            <span className="ml-auto rounded-full bg-[#22D3EE]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#67E8F9] ring-1 ring-[#22D3EE]/30">
                                New
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="m-4 rounded-xl border border-[#263449] bg-[#111C2E] p-4 text-xs leading-relaxed text-[#CBD5E1]">
                Demo app for the DPDP Act, 2023 and DPDP Rules, 2025. Mock data. Not legal advice.
            </div>
        </div>
    );
}

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const profile = getProfile();

    const [query, setQuery] = useState("");
    const [drawer, setDrawer] = useState(false);
    const [menu, setMenu] = useState(false);
    const [bell, setBell] = useState(false);
    const menuRef = useRef(null);
    const bellRef = useRef(null);

    useClickAway(menuRef, () => setMenu(false));
    useClickAway(bellRef, () => setBell(false));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

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
                <Sidebar />
            </aside>

            {drawer && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="absolute inset-0 bg-[#0B1220]/60" />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">
                        <Sidebar onNavigate={() => setDrawer(false)} />
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

                    <label className="relative min-w-0 flex-1 sm:max-w-md">
                        <span className="sr-only">Search records</span>
                        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#64748B]" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search records"
                            className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-3 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40"
                        />
                    </label>

                    <span className="hidden rounded-full bg-[#D97706]/15 px-3 py-1 text-[11px] font-bold tracking-wide text-[#B45309] sm:inline">MOCK DATA</span>

                    <div ref={bellRef} className="relative ml-auto sm:ml-0">
                        <button
                            type="button"
                            onClick={() => setBell((v) => !v)}
                            aria-label="Notifications"
                            aria-expanded={bell}
                            className="relative grid h-10 w-10 place-items-center rounded-lg text-[#334155] transition hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                        >
                            <Icon name="bell" className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
                        </button>
                        {bell && (
                            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
                                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">Notifications (mock)</p>
                                {NOTIFICATIONS.map((n) => (
                                    <div key={n.title} className="rounded-lg px-3 py-2 hover:bg-[#F1F5F9]">
                                        <p className="text-sm font-medium text-[#0F172A]">{n.title}</p>
                                        <p className="text-xs text-[#64748B]">{n.meta}</p>
                                    </div>
                                ))}
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
                                <span className="block text-xs text-[#64748B]">Admin</span>
                            </span>
                            <Icon name="chevron" className={`hidden h-4 w-4 text-[#64748B] transition-transform sm:block ${menu ? "rotate-180" : ""}`} />
                        </button>
                        {menu && (
                            <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={{ animation: "pg-rise .25s ease-out both" }}>
                                <div className="border-b border-[#E2E8F0] px-3 pb-2.5 pt-2">
                                    <p className="truncate text-sm font-semibold">{profile?.name}</p>
                                    <p className="truncate text-xs text-[#64748B]">{profile?.email}</p>
                                </div>
                                <Link role="menuitem" to="/dashboard/admin" onClick={() => setMenu(false)} className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#334155] hover:bg-[#F1F5F9]">
                                    <Icon name="gear" className="h-4 w-4" /> Admin profile
                                </Link>
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
                    <Outlet context={{ query: query.trim().toLowerCase(), profile }} />
                </main>
            </div>
        </div>
    );
}
