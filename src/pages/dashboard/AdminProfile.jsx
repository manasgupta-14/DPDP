import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ADMIN_REGISTER_ENABLED, logout } from "../../auth/authStore.js";
import Icon from "../../components/dashboard/Icon.jsx";

const fmt = (d) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");

function Row({ icon, label, value, mono, copy = true }) {
    const [done, setDone] = useState(false);
    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(value));
            setDone(true);
            setTimeout(() => setDone(false), 1500);
        } catch {
        return;
    }
    };
    return (
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] py-3.5 last:border-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]">
                <Icon name={icon} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-[#64748B]">{label}</p>
                <p className={`break-all text-sm text-[#0F172A] ${mono ? "font-mono text-[13px]" : "font-medium"}`}>{value || "-"}</p>
            </div>
            {copy && value && (
                <button type="button" onClick={onCopy} aria-label={`Copy ${label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#E2E8F0] text-[#475569] transition hover:border-[#0F766E] hover:text-[#0F766E]">
                    <Icon name={done ? "check" : "copy"} className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

const show = (v) => (v !== null && typeof v === "object" ? JSON.stringify(v) : String(v));
const shortKey = (k) => k.split("/").pop();

export default function AdminProfile() {
    const { profile } = useOutletContext();
    const navigate = useNavigate();
    const [nowMs] = useState(() => Date.now());
    if (!profile) return null;

    const roles = [].concat(profile.role ?? []).join(", ");
    const claims = Object.entries(profile.claims);
    const mins = profile.expiresAt ? Math.max(0, Math.floor((profile.expiresAt.getTime() - nowMs) / 60000)) : null;

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <h1 className="text-3xl font-bold tracking-tight">Admin</h1>

            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111C2E] to-[#0B1220] p-6 text-white sm:p-8">
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-[70px]" style={{ animation: "pg-glow 18s ease-in-out infinite" }} />
                <div className="relative flex flex-wrap items-center gap-5">
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-[#0F766E] text-2xl font-bold ring-4 ring-white/10">{profile.initials}</span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-2xl font-semibold">{profile.name}</p>
                        <p className="truncate text-sm text-[#CBD5E1]">{profile.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#22D3EE]/15 px-3 py-1 text-xs font-semibold text-[#67E8F9] ring-1 ring-[#22D3EE]/30">{roles || "Admin"}</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A]/15 px-3 py-1 text-xs font-semibold text-[#4ADE80] ring-1 ring-[#16A34A]/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" /> Authenticated
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ADMIN_REGISTER_ENABLED && (
                            <Link to="/admin/register" className="rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold transition hover:bg-[#115E59]">
                                Register new admin
                            </Link>
                        )}
                        <button type="button" onClick={onLogout} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-[#E2E8F0] transition hover:border-[#DC2626]/60 hover:text-white">
                            Logout
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                    <h2 className="text-lg font-semibold">Profile details</h2>
                    <div className="mt-2">
                        <Row icon="adduser" label="Full name" value={profile.name} copy={false} />
                        <Row icon="mail" label="Email" value={profile.email} />
                        <Row icon="key" label="Role" value={roles} copy={false} />
                        <Row icon="adduser" label="User ID" value={profile.userId} mono />
                        <Row icon="building" label="Organisation ID" value={profile.organizationId} mono />
                    </div>
                </section>

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                    <h2 className="text-lg font-semibold">Session</h2>
                    <div className="mt-2">
                        <Row icon="clock" label="Signed in at" value={fmt(profile.issuedAt)} copy={false} />
                        <Row icon="calendar" label="Session expires" value={fmt(profile.expiresAt)} />
                        <Row icon="clock" label="Time remaining" value={mins === null ? "-" : `${Math.floor(mins / 60)}h ${mins % 60}m`} copy={false} />
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                <h2 className="text-lg font-semibold">All account details from your session</h2>
                <p className="mt-1 text-xs text-[#64748B]">Everything the server sent about your account at login. The token itself is never shown.</p>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-[#64748B]">
                                <th className="py-2 pr-4 font-semibold">Field</th>
                                <th className="py-2 font-semibold">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(([k, v]) => (
                                <tr key={k} className="border-b border-[#E2E8F0] last:border-0">
                                    <td className="py-2.5 pr-4 font-medium text-[#334155]">{shortKey(k)}</td>
                                    <td className="break-all py-2.5 font-mono text-[13px] text-[#0F172A]">
                                        {k === "exp" || k === "iat" || k === "nbf" ? `${show(v)} (${fmt(new Date(v * 1000))})` : show(v)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
