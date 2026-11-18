import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ADMIN_REGISTER_ENABLED, logout, roleInfo } from "../../auth/authStore.js";
import Icon from "../../components/shared/Icon.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";

// Profile page: Admin, DPO aur User teeno ke liye ek hi page. Title aur label login ke role se aate hain.
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
        <div className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink">
                <Icon name={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{label}</p>
                <p className={`break-all text-sm text-ink ${mono ? "font-mono text-[13px]" : "font-medium"}`}>{value || "-"}</p>
            </div>
            {copy && value && (
                <button type="button" onClick={onCopy} aria-label={`Copy ${label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-ink-3 hover:border-brand hover:text-brand-ink">
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

    const info = roleInfo(profile);
    const roles = [].concat(profile.role ?? []).join(", ");
    const claims = Object.entries(profile.claims);
    const mins = profile.expiresAt ? Math.max(0, Math.floor((profile.expiresAt.getTime() - nowMs) / 60000)) : null;
    const left = mins === null ? null : mins / 60;

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="space-y-6">
            <header>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">Account</p>
                <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">{info.profileLabel}</h1>
                <p className="mt-1 text-sm text-muted">Your details and the current sign-in session.</p>
            </header>

            <section className={`${panel} p-6`}>
                <div className="flex flex-wrap items-center gap-5">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-white">{profile.initials}</span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-bold text-ink">{profile.name}</p>
                        <p className="truncate text-sm text-muted">{profile.email}</p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                            <span className="kv-role-chip">
                                <Icon name="key" className="h-3 w-3" />
                                {info.long}
                            </span>
                            <span className="kd-pill is-ok">
                                <span className="kv-live-dot" /> Signed in
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ADMIN_REGISTER_ENABLED && info.key === "admin" && (
                            <Link to="/admin/register" className={primaryBtn}>
                                <Icon name="plus" className="h-4 w-4" />
                                Register new admin
                            </Link>
                        )}
                        <button type="button" onClick={onLogout} className={`${ghostBtn} hover:border-bad/50 hover:text-bad-ink`}>
                            <Icon name="logout" className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className={`${panel} p-6`}>
                    <h2 className="text-base font-bold text-ink">Profile details</h2>
                    <p className="mt-0.5 text-xs text-muted">Your name, email, role and IDs.</p>
                    <div className="mt-2">
                        <Row icon="adduser" label="Full name" value={profile.name} copy={false} />
                        <Row icon="mail" label="Email" value={profile.email} />
                        <Row icon="key" label="Role" value={roles || info.label} copy={false} />
                        <Row icon="adduser" label="User ID" value={profile.userId} mono />
                        <Row icon="building" label="Organisation ID" value={profile.organizationId} mono />
                    </div>
                </section>

                <section className={`${panel} p-6`}>
                    <h2 className="text-base font-bold text-ink">Session</h2>
                    <p className="mt-0.5 text-xs text-muted">When you signed in and when the session ends.</p>
                    <div className="mt-2">
                        <Row icon="clock" label="Signed in at" value={fmt(profile.issuedAt)} copy={false} />
                        <Row icon="calendar" label="Session expires" value={fmt(profile.expiresAt)} />
                        <Row icon="clock" label="Time remaining" value={mins === null ? "-" : `${Math.floor(mins / 60)}h ${mins % 60}m`} copy={false} />
                    </div>
                    {left !== null && (
                        <div className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-subtle">
                                <div className={`pg-fill h-full rounded-full ${left < 0.5 ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.min(100, (left / 24) * 100)}%` }} />
                            </div>
                            <p className="mt-1.5 text-xs text-muted">{left < 0.5 ? "Your session ends soon. Save your work." : "Session is active."}</p>
                        </div>
                    )}
                </section>
            </div>

            <details className={`${panel} group p-6`}>
                <summary className="flex list-none items-center justify-between gap-3">
                    <span>
                        <span className="block text-base font-bold text-ink">All account details from your session</span>
                        <span className="mt-1 block text-xs text-muted">Everything the server sent about your account at login. The token itself is never shown.</span>
                    </span>
                    <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[420px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                                <th className="py-2 pr-4 font-semibold">Field</th>
                                <th className="py-2 font-semibold">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(([k, v]) => (
                                <tr key={k} className="border-b border-line last:border-0">
                                    <td className="py-2.5 pr-4 font-medium text-ink-2">{shortKey(k)}</td>
                                    <td className="break-all py-2.5 font-mono text-[13px] text-ink">
                                        {k === "exp" || k === "iat" || k === "nbf" ? `${show(v)} (${fmt(new Date(v * 1000))})` : show(v)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}
