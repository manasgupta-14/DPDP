export default function PageLoader() {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[45vh] flex-col items-center justify-center gap-5 text-sm text-ink-3">
            <span className="kx-scan" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 5l15 6v11c0 10-6.4 17.6-15 21-8.6-3.4-15-11-15-21V11l15-6z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M17 24.5l5 5 9-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="kx-scan-tick" />
                </svg>
                <i />
            </span>
            <span className="font-medium">Loading workspace…</span>
            <span aria-hidden className="block h-[3px] w-44 overflow-hidden rounded-full bg-[var(--k-track)]">
                <span className="kx-bar block h-full w-1/3 rounded-full" />
            </span>
        </div>
    );
}
