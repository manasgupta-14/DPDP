import { getNotice, getNotices } from "./notice.js";
import { toTime } from "../utils/audit.js";

// Consent records in the backend do not store which notice was shown
// (ConsentService only returns a fixed placeholder string). Until the backend
// links a notice to each consent, the admin screens show the real notice that was
// in force when the consent was given, using the existing Notice APIs:
//   GET /api/Notice/all   -> list (code, title, version, status, createdAt)
//   GET /api/Notice/{id}  -> detail (translations, purposes, hash)

const isLive = (n) => String(n.status || "").toLowerCase() !== "draft";

const prettyCode = (code) =>
    String(code || "")
        .replace(/[_-]v\d+$/i, "")
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

// /api/Notice/all returns the first translation it finds (can be Hindi), so the
// English title is read from each notice's detail instead.
const englishTitle = (detail, code) => {
    const en = (detail?.translations || []).find((t) => t.languageCode.toLowerCase().startsWith("en") && t.title);
    return en?.title || prettyCode(code);
};

// Notices that can have been shown to a person (everything except drafts), each with its detail.
export async function getConsentNotices() {
    const res = await getNotices();
    if (!res.ok) return res;
    const live = res.data.filter(isLive);
    const data = await Promise.all(
        live.map(async (n) => {
            const d = await getNotice(n.id);
            const detail = d.ok ? d.data : null;
            return { ...n, detail, title: englishTitle(detail, n.code) };
        }),
    );
    return { ...res, data };
}

// The notice in force at the time of the consent: the newest live notice created
// on or before the consent. If the consent is older than every notice, use the
// oldest live notice rather than showing nothing.
export function pickNoticeForConsent(notices, record) {
    if (!Array.isArray(notices) || notices.length === 0) return null;
    const given = toTime(record?.submittedAt);
    const sorted = [...notices].sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
    if (!given) return sorted[sorted.length - 1];
    const before = sorted.filter((n) => toTime(n.createdAt) <= given);
    return before.length ? before[before.length - 1] : sorted[0];
}

export async function getConsentNoticeDetail(id) {
    return getNotice(id);
}

// "en-IN" -> "en", "hi-IN" -> "hi"
export const noticeLangOf = (language) => String(language || "en").toLowerCase().split("-")[0] || "en";

// Title + summary of a notice detail in the consent's language (falls back to any translation).
export function noticeTextFor(detail, language) {
    const list = detail?.translations || [];
    const lang = noticeLangOf(language);
    const t = list.find((x) => x.languageCode.toLowerCase() === lang && x.title) || list.find((x) => x.title) || null;
    return { title: t?.title || "", summary: t?.summary || "", languageCode: t?.languageCode || "", matchedLanguage: !!t && t.languageCode.toLowerCase() === lang };
}
