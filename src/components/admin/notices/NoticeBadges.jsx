import { NOTICE_STATUS, REVIEW, translatedLangs } from "../../../utils/notices.js";

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1";

const STATUS_TONE = {
    [NOTICE_STATUS.draft]: "bg-[#F1F5F9] text-[#334155] ring-[#CBD5E1]",
    [NOTICE_STATUS.published]: "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25",
    [NOTICE_STATUS.archived]: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
};

const REVIEW_TONE = {
    none: "bg-[#F1F5F9] text-[#475569] ring-[#CBD5E1]",
    pending: "bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/25",
    approved: "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25",
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
    if (done.length === 0) return <span className="text-[11px] text-[#64748B]">None</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {done.map((l) => (
                <span key={l.code} className="inline-flex items-center gap-1 rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[11px] font-semibold text-[#0E7490] ring-1 ring-[#0E7490]/25">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                    {l.native}
                </span>
            ))}
        </div>
    );
}
