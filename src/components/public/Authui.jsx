import { Link } from "react-router-dom";
import { useState } from "react";
import { inputClass } from "./authStyles.js";

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
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#334155]">
                {label}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-[#DC2626]">
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-[#475569]">{hint}</p>
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
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-[#475569] transition hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
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
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0F766E] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,118,110,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#115E59] hover:shadow-[0_10px_28px_rgba(34,211,238,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
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

export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-16">
            <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[0.9fr_1.1fr]">
            <style>{`
        @keyframes pg-rise { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pg-glow-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(50px,30px); } }
        @keyframes pg-glow-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-60px,-20px); } }
        @keyframes pg-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pg-pulse-ring { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .pg-auth, .pg-auth * { animation: none !important; transition: none !important; }
        }
      `}</style>

            <aside className="pg-auth relative hidden overflow-hidden bg-[#0B1220] lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-10 xl:px-16">
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div
                        className="absolute inset-0 opacity-[0.3]"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, #263449 1px, transparent 1px), linear-gradient(to bottom, #263449 1px, transparent 1px)",
                            backgroundSize: "56px 56px",
                            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 30% 40%, #000 20%, transparent 80%)",
                            maskImage: "radial-gradient(ellipse 80% 70% at 30% 40%, #000 20%, transparent 80%)",
                        }}
                    />
                    <div className="absolute -left-20 top-20 h-96 w-96 rounded-full bg-[#0F766E]/30 blur-[120px] animate-[pg-glow-a_22s_ease-in-out_infinite]" />
                    <div className="absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[120px] animate-[pg-glow-b_26s_ease-in-out_infinite]" />
                </div>

                <Link to="/" className="relative flex w-fit items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0F766E]">
                        <Icon name="shield" className="h-5 w-5 text-white" />
                    </span>
                    <span className="text-[17px] font-semibold tracking-tight text-white">
                        Privy<span className="text-[#22D3EE]">Guard</span>
                    </span>
                </Link>

                <div className="relative max-w-xl">
                    <div className="relative mb-10 h-24 w-24 animate-[pg-float_7s_ease-in-out_infinite]">
                        <span className="absolute inset-0 rounded-3xl border border-[#22D3EE]/50 animate-[pg-pulse-ring_3.2s_ease-out_infinite]" />
                        <span className="absolute inset-0 rounded-3xl border border-[#22D3EE]/30 animate-[pg-pulse-ring_3.2s_ease-out_1.6s_infinite]" />
                        <div className="relative grid h-full w-full place-items-center rounded-3xl bg-gradient-to-br from-[#0F766E] to-[#115E59] shadow-[0_0_50px_rgba(34,211,238,0.25)] ring-1 ring-[#22D3EE]/50">
                            <Icon name="shield" className="h-11 w-11 text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
                        Keep your DPDP obligations organised and easy to review
                    </h2>
                    <ul className="mt-8 space-y-4">
                        {POINTS.map((p, i) => (
                            <li key={p} className="flex items-start gap-3 text-sm text-[#CBD5E1]" style={{ animation: `pg-rise .7s ease-out ${300 + i * 120}ms both` }}>
                                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0F766E]/30 text-[#22D3EE] ring-1 ring-[#22D3EE]/30">
                                    <Icon name="check" className="h-3 w-3" />
                                </span>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative max-w-md text-xs leading-relaxed text-[#CBD5E1]/60">
                    Demo environment. Accounts and data stay in this browser only. Not legal advice; completing tasks does not by itself mean legal compliance.
                </p>
            </aside>

            <main className="pg-auth flex flex-col justify-center px-4 py-10 sm:px-8">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] lg:hidden">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#0F766E]">
                                <Icon name="shield" className="h-5 w-5 text-white" />
                            </span>
                            <span className="text-[17px] font-semibold tracking-tight text-[#0F172A]">
                                Privy<span className="text-[#0F766E]">Guard</span>
                            </span>
                        </Link>
                        <Link to="/" className="ml-auto inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[#475569] transition hover:text-[#0F766E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                            <Icon name="arrowLeft" className="h-4 w-4" />
                            Back to home
                        </Link>
                    </div>

                    <div
                        className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9"
                        style={{ animation: "pg-rise .7s cubic-bezier(.22,1,.36,1) both" }}
                    >
                        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">{title}</h1>
                        <p className="mt-1.5 text-sm text-[#475569]">{subtitle}</p>
                        <div className="mt-7">{children}</div>
                    </div>

                    <p className="mt-6 text-center text-sm text-[#475569]">{footer}</p>
                </div>
            </main>
            </div>
        </div>
    );
}