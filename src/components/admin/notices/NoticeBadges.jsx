import { NOTICE_STATUS, REVIEW, translatedLangs } from "../../../utils/notices.js";

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

const STATUS_TONE = {
    [NOTICE_STATUS.draft]: "bg-subtle text-ink-2 ring-line-strong",
    [NOTICE_STATUS.published]: "bg-ok/10 text-ok-ink ring-ok/25",
    [NOTICE_STATUS.archived]: "bg-warn/10 text-warn-ink ring-warn/25",
};

const REVIEW_TONE = {
    none: "bg-subtle text-ink-3 ring-line-strong",
    pending: "bg-warn/10 text-warn-ink ring-warn/25",
    approved: "bg-ok/10 text-ok-ink ring-ok/25",
};

export function StatusPill({ status }) {
    return (
        <span className={`${base} ${STATUS_TONE[status] || STATUS_TONE[NOTICE_STATUS.draft]}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}

export function ReviewPill({ review }) {
    return (
        <span className={`${base} ${REVIEW_TONE[review] || REVIEW_TONE.none}`}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            {REVIEW[review] || REVIEW.none}
        </span>
    );
}

export function LangChips({ translations }) {
    const done = translatedLangs(translations);
    if (done.length === 0) return <span className="text-[11px] text-muted">None</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {done.map((l, ki) => (
                <span key={`${l.code}-${ki}`} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-info-ink ring-1 ring-info-ink/25">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {l.native}
                </span>
            ))}
        </div>
    );
}
