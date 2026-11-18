import { Link } from "react-router-dom";
import { useState } from "react";
import { inputClass } from "./authStyles.js";
import { Logo } from "../shared/Brand.jsx";

const ICONS = {
    shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z M9 12l2 2 4-4",
    check: "M5 13l4 4L19 7",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z",
    eyeOff: "M17.9 17.9A10 10 0 0112 19c-6.5 0-10-7-10-7a17.6 17.6 0 014.1-4.9M9.9 5.2A9.7 9.7 0 0112 5c6.5 0 10 7 10 7a17.7 17.7 0 01-2.2 3.2M1 1l22 22M9.9 9.9a3 3 0 004.2 4.2",
    arrowLeft: "M19 12H5M11 18l-6-6 6-6",
};

export function Icon({ name, className = "h-5 w-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICONS[name]} />
        </svg>
    );
}

export function Field({ id, label, error, hint, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-2">
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-bad-ink">
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-ink-3">{hint}</p>
            ) : null}
        </div>
    );
}

export function PasswordInput({ id, value, onChange, error, placeholder, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete={autoComplete}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`${inputClass(error)} pr-11`}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-ink-3 transition hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
                <Icon name={show ? "eyeOff" : "eye"} className="h-[18px] w-[18px]" />
            </button>
        </div>
    );
}

export function SubmitButton({ loading, children }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] hover:bg-brand-strong focus:outline-none focus-visible:ring-3 focus-visible:ring-focus/40 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
            )}
            {children}
        </button>
    );
}

const POINTS = [
    "Consent records and withdrawals in one register",
    "Rights Requests handling with clear status tracking",
    "Breach handling and a reviewable audit trail",
];

// Login / register ka frame: bayen Kavach ki pehchaan (gehra neela, bharosa), dayen saaf form.
export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="ap-auth min-h-screen">
            <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="relative m-3 hidden overflow-hidden kv-auth-panel rounded-[28px] border border-[#D6E4FF] lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-10 xl:px-16">
                    <Link to="/" className="relative w-fit rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                        <Logo sub="DPDP compliance workspace" />
                    </Link>

                    <div className="relative max-w-lg">
                        <h2 className="text-[30px] font-bold leading-tight tracking-tight text-[#14213D]">Keep your DPDP obligations organised and easy to review</h2>
                        <ul className="mt-8 space-y-4">
                            {POINTS.map((p, i) => (
                                <li key={p} className="flex items-start gap-3 text-[15px] text-[#33415C]" style={{ animation: `pg-rise .6s ease-out ${200 + i * 110}ms both` }}>
                                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#3A4CC8] ring-1 ring-[#C9D8FF]">
                                        <Icon name="check" className="h-3 w-3" />
                                    </span>
                                    {p}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10 grid grid-cols-3 gap-3">
                            {[
                                ["3", "panels", "Admin · User · DPO"],
                                ["30", "days", "rights request deadline"],
                                ["13", "reports", "PDF or CSV"],
                            ].map(([n, u, t], i) => (
                                <div key={u} className="rounded-xl border border-[#D6E4FF] bg-white/80 p-3.5" style={{ animation: `pg-rise .6s ease-out ${500 + i * 100}ms both` }}>
                                    <p className="text-2xl font-extrabold text-[#14213D]">
                                        {n}
                                        <span className="ml-1 text-xs font-semibold text-[#556070]">{u}</span>
                                    </p>
                                    <p className="mt-1 text-[11px] leading-snug text-[#556070]">{t}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative max-w-md text-xs leading-relaxed text-[#556070]">
                        Accounts and records are stored securely on your organisation's Kavach server.
                    </p>
                </aside>

                <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-6 flex items-center justify-between">
                            <Link to="/" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
                                <Logo />
                            </Link>
                            <Link to="/" className="ml-auto inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-3 hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                                <Icon name="arrowLeft" className="h-4 w-4" />
                                Back to home
                            </Link>
                        </div>

                        <div className="rounded-[16px] border border-line bg-surface p-7 shadow-[var(--k-shadow)] sm:p-9" style={{ animation: "pg-rise .5s cubic-bezier(.22,1,.36,1) both" }}>
                            <h1 className="text-[24px] font-bold tracking-tight text-ink">{title}</h1>
                            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
                            <div className="mt-7">{children}</div>
                        </div>

                        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
                    </div>
                </main>
            </div>
        </div>
    );
}
