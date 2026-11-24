
function Ribbon() {
    return (
        <svg className="kv-welcome-ribbon" viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="kvw-rb" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                    <stop offset="30%" stopColor="#6366F1" />
                    <stop offset="55%" stopColor="#A855F7" />
                    <stop offset="78%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
                <linearGradient id="kvw-rb2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
                    <stop offset="45%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#FB923C" />
                </linearGradient>
            </defs>
            <path className="rb-a" fill="url(#kvw-rb)" d="M520,250 C680,170 800,240 940,170 C1040,120 1120,130 1200,90 L1200,135 C1120,175 1050,165 950,215 C810,285 690,215 540,272 Z" />
            <path className="rb-b" fill="url(#kvw-rb2)" d="M600,268 C760,205 860,250 990,205 C1080,175 1150,185 1200,165 L1200,182 C1150,202 1080,195 1000,222 C870,268 770,228 620,276 Z" />
        </svg>
    );
}

function ShieldArt() {
    return (
        <svg className="kv-welcome-art" viewBox="0 0 300 200" aria-hidden="true">
            <defs>
                <linearGradient id="kvw-s" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style={{ stopColor: "color-mix(in srgb, var(--k-brand) 20%, var(--k-surface))" }} />
                    <stop offset="100%" style={{ stopColor: "color-mix(in srgb, var(--k-brand) 7%, var(--k-surface))" }} />
                </linearGradient>
            </defs>

            <ellipse cx="150" cy="188" rx="108" ry="11" style={{ fill: "var(--k-brand)", opacity: 0.1 }} />
            <ellipse cx="150" cy="186" rx="66" ry="6" fill="none" style={{ stroke: "var(--k-brand)", opacity: 0.28 }} strokeWidth="1.2" />

            <g className="sh-float">
                <path d="M150 20 L216 46 V98 C216 140 188 166 150 182 C112 166 84 140 84 98 V46 Z" fill="url(#kvw-s)" style={{ stroke: "color-mix(in srgb, var(--k-brand) 60%, transparent)" }} strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M150 34 L203 55 V98 C203 131 181 152 150 166 C119 152 97 131 97 98 V55 Z" fill="none" style={{ stroke: "var(--k-brand)", opacity: 0.22 }} strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M123 101 L143 121 L180 83" fill="none" style={{ stroke: "var(--k-brand)" }} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </svg>
    );
}

export default function WelcomeHero({ eyebrow, greeting, name, sub, meta, status, actions, style }) {
    return (
        <header className="kv-welcome" style={style}>
            <Ribbon />
            <ShieldArt />
            <div className="flex flex-wrap items-start justify-between gap-3">
                {eyebrow ? <p className="kv-welcome-eyebrow uppercase">{eyebrow}</p> : <span />}
                {status && (
                    <span className="kv-welcome-status" data-tone={status.tone} role="status">
                        <span className="dot" aria-hidden="true" />
                        {status.label}
                    </span>
                )}
            </div>
            <div className="kv-welcome-body">
                <h1 className="kv-welcome-title">
                    {greeting}
                    {name ? (
                        <>
                            , <span className="kv-welcome-name">{name}</span>
                        </>
                    ) : null}
                </h1>
                {sub && <p className="kv-welcome-sub">{sub}</p>}
                {meta && <div className="kv-welcome-meta">{meta}</div>}
                {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
            </div>
        </header>
    );
}
