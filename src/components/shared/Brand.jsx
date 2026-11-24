export const BRAND = "Kavach";

export function KavachMark({ className = "" }) {
    return (
        <span className={`kv-logo-mark ${className}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2.8l7.2 2.9v5.6c0 4.7-3 8.3-7.2 10-4.2-1.7-7.2-5.3-7.2-10V5.7L12 2.8z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8.6 12.1l2.3 2.3 4.6-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}

export function Logo({ sub, tone = "default", className = "" }) {
    return (
        <span className={`kv-logo ${tone === "light" ? "is-light" : ""} ${className}`}>
            <KavachMark />
            <span className="min-w-0">
                <span className="kv-logo-word">{BRAND}</span>
                {sub && <span className="kv-logo-sub truncate">{sub}</span>}
            </span>
        </span>
    );
}

export default function Brand({ className = "" }) {
    return <span className={`kv-brand ${className}`}>{BRAND}</span>;
}
