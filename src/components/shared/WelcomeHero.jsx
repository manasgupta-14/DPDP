// Dashboard ka upar wala welcome hero (Admin, DPO aur User teeno me ek jaisa).
// Light: halka pastel; Dark: halka kaala + rangeen ribbon. Right side me 3D dhaal (SVG, koi image nahi).
// Status pill hamesha asli data se aata hai (jo page bhejta hai), koi nakli "online" nahi.

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
                <linearGradient id="kvw-l" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9DB0FF" />
                    <stop offset="100%" stopColor="#5B5BEA" />
                </linearGradient>
                <linearGradient id="kvw-r" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFC" />
                    <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
                <linearGradient id="kvw-rim" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E0E7FF" />
                    <stop offset="100%" stopColor="#C4B5FD" />
                </linearGradient>
                <linearGradient id="kvw-ring" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#F472B6" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id="kvw-plat" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#818CF8" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="kvw-orb" cx="0.35" cy="0.3" r="0.7">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="45%" stopColor="#C4B5FD" />
                    <stop offset="100%" stopColor="#7C3AED" />
                </radialGradient>
                <filter id="kvw-soft" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#4338CA" floodOpacity="0.35" />
                </filter>
            </defs>

            {/* Platform (dhaal ke neeche roshni) */}
            <ellipse cx="150" cy="186" rx="118" ry="16" fill="url(#kvw-plat)" />
            <ellipse cx="150" cy="184" rx="74" ry="8" fill="none" stroke="#A78BFA" strokeOpacity="0.45" strokeWidth="1.5" />

            {/* Orbit ring (peeche) */}
            <g className="sh-orbit">
                <ellipse cx="150" cy="112" rx="138" ry="34" fill="none" stroke="url(#kvw-ring)" strokeWidth="2" />
                <circle cx="22" cy="104" r="4" fill="#A78BFA" />
            </g>

            {/* Dhaal: do rang ki sataah (3D jaisa) + safed tick */}
            <g className="sh-float" filter="url(#kvw-soft)">
                <path d="M150 18 L84 44 V98 C84 140 112 166 150 182 Z" fill="url(#kvw-l)" />
                <path d="M150 18 L216 44 V98 C216 140 188 166 150 182 Z" fill="url(#kvw-r)" />
                <path d="M150 18 L216 44 V98 C216 140 188 166 150 182 C112 166 84 140 84 98 V44 Z" fill="none" stroke="url(#kvw-rim)" strokeWidth="3" strokeLinejoin="round" />
                <path d="M150 34 L200 54 V98 C200 130 180 151 150 165 C120 151 100 130 100 98 V54 Z" fill="none" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.5" />
                <path d="M96 52 L150 30 V60 C126 66 108 78 96 96 Z" fill="#FFFFFF" fillOpacity="0.18" />
                <path d="M122 100 L143 121 L181 82" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Chhote tairte orbs */}
            <circle cx="44" cy="58" r="7" fill="url(#kvw-orb)" opacity="0.9" />
            <circle cx="262" cy="46" r="5" fill="url(#kvw-orb)" opacity="0.8" />
            <circle cx="270" cy="140" r="9" fill="url(#kvw-orb)" opacity="0.85" />
        </svg>
    );
}

/**
 * eyebrow  : chhota upar ka label (role / page)
 * greeting : "Good afternoon" jaisa
 * name     : pehla naam (gradient me dikhta hai)
 * sub      : ek line me kaam ki baat
 * meta     : Live · Last updated jaisi line (optional)
 * status   : { tone: "ok"|"warn"|"bad"|"muted", label } — asli data se
 * actions  : buttons (jo pehle the wahi)
 */
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
