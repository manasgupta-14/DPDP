import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyNotice, getMyNotices, getPurposeLookup } from "../../api/userNotices.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate, LANGUAGES } from "../../utils/noticeApi.js";

function LangSelect({ value, onChange, label = "Language" }) {
    return (
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#475569]">
            {label}
            <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
        </label>
    );
}

function NoticeModal({ code, initialLang, purposeMap, onClose }) {
    const [lang, setLang] = useState(initialLang);
    const [res, setRes] = useState(null);
    const key = `${code}|${lang}`;

    useEffect(() => {
        let active = true;
        getMyNotice(code, lang).then((r) => {
            if (active) setRes({ key, ...r });
        });
        return () => {
            active = false;
        };
    }, [code, lang, key]);

    const loading = !res || res.key !== key;
    const notice = !loading && res.ok ? res.data : null;

    return (
        <Modal title="Privacy notice" onClose={onClose}>
            <div className={`${panel} overflow-hidden`}>
                <div className="h-1.5" style={{ background: notice?.color || "#0F766E" }} />
                <div className="space-y-5 p-6 sm:p-7">
                    {loading ? (
                        <div className="space-y-3" aria-busy="true">
                            <div className="h-7 w-2/3 pg-shimmer rounded-lg" />
                            <div className="h-24 pg-shimmer rounded-xl" />
                            <div className="h-16 pg-shimmer rounded-xl" />
                        </div>
                    ) : !res.ok ? (
                        <Alert>{res.error}</Alert>
                    ) : (
                        <>
                            <div className="pr-8">
                                <div className="flex items-center gap-3">
                                    {notice.logoUrl && <img src={notice.logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                                    <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">{notice.title}</h2>
                                </div>
                                <p className="mt-1 text-xs text-[#64748B]">Version {notice.version}{notice.updatedAt ? ` · Updated ${formatDate(notice.updatedAt)}` : ""}</p>
                            </div>

                            <LangSelect value={lang} onChange={setLang} />

                            <p className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">{notice.summary || "No details have been added to this notice yet."}</p>

                            <section aria-label="Purposes" className="space-y-2.5">
                                <h3 className="text-sm font-semibold text-[#0F172A]">Why your details are used ({notice.purposeCodes.length})</h3>
                                {notice.purposeCodes.length === 0 ? (
                                    <p className="text-sm text-[#475569]">This notice does not list any purposes.</p>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {notice.purposeCodes.map((c) => {
                                            const p = purposeMap.get(c);
                                            return (
                                                <li key={c} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold text-[#0F172A]">{p?.name || c}</p>
                                                        {p?.mandatory && <span className="rounded-full bg-[#CCFBF1] px-2 py-0.5 text-xs font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/25">Required</span>}
                                                    </div>
                                                    {p?.description && <p className="mt-1 text-sm text-[#475569]">{p.description}</p>}
                                                    {(p?.legalBasis || p?.retention) && (
                                                        <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-[#64748B] sm:grid-cols-2">
                                                            {p.legalBasis && <div><dt className="inline font-semibold">Legal basis: </dt><dd className="inline">{p.legalBasis}</dd></div>}
                                                            {p.retention && <div><dt className="inline font-semibold">Kept for: </dt><dd className="inline">{p.retention}</dd></div>}
                                                        </dl>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </section>

                            {notice.hash && (
                                <p className="break-all rounded-lg bg-[#F1F5F9] px-3 py-2 font-mono text-[11px] text-[#64748B]">
                                    <span className="font-sans font-semibold">Notice fingerprint (SHA-256): </span>{notice.hash}
                                </p>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-1">
                        <button type="button" onClick={onClose} className={ghostBtn}>Close</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default function MyNotices() {
    const [lang, setLang] = useState("en");
    const [notices, setNotices] = useState([]);
    const [purposeMap, setPurposeMap] = useState(() => new Map());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [openCode, setOpenCode] = useState("");

    const apply = useCallback((res) => {
        if (res.ok) {
            setNotices(res.data);
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const reload = useCallback(async () => {
        setRefreshing(true);
        apply(await getMyNotices(lang));
    }, [apply, lang]);

    useEffect(() => {
        let active = true;
        getPurposeLookup().then((map) => {
            if (active) setPurposeMap(map);
        });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        getMyNotices(lang).then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply, lang]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? notices.filter((n) => n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)) : notices;
    }, [notices, query]);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Privacy notices</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[#475569]">These notices explain what details your organisation collects, why, and for how long. You can read them in the language you prefer.</p>
                </div>
                <button type="button" onClick={reload} disabled={loading || refreshing} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"><Icon name="search" className="h-4 w-4" /></span>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notices" aria-label="Search notices" className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3.5 text-sm placeholder:text-[#475569]/60 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40" />
                </div>
                <LangSelect value={lang} onChange={setLang} label="Notice language" />
            </div>

            {error && <Alert action={<button type="button" onClick={reload} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}

            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 pg-shimmer rounded-2xl" />)}</div>
            ) : shown.length === 0 && !error ? (
                <div className={`${panel} px-5 py-12 text-center`}>
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="notice" className="h-6 w-6" /></span>
                    <p className="mt-3 font-semibold">{query ? "No notices match your search" : "No notices yet"}</p>
                    <p className="mt-1 text-sm text-[#475569]">{query ? "Try a different word." : "Your organisation has not published any privacy notice yet. When it does, you will find it here."}</p>
                </div>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                    {shown.map((n) => (
                        <li key={n.code} className={`${panel} flex flex-col overflow-hidden`}>
                            <div className="h-1.5" style={{ background: n.color }} />
                            <div className="flex flex-1 flex-col gap-3 p-5">
                                <div className="flex items-start gap-3">
                                    {n.logoUrl ? <img src={n.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#0F766E]"><Icon name="notice" className="h-5 w-5" /></span>}
                                    <div className="min-w-0">
                                        <h2 className="font-semibold leading-snug text-[#0F172A]">{n.title}</h2>
                                        <p className="mt-0.5 text-xs text-[#64748B]">Version {n.version}{n.updatedAt ? ` · Updated ${formatDate(n.updatedAt)}` : ""}</p>
                                    </div>
                                </div>
                                <p className="line-clamp-3 text-sm text-[#475569]">{n.summary}</p>
                                <div className="mt-auto flex justify-end pt-1">
                                    <button type="button" onClick={() => setOpenCode(n.code)} className={`${primaryBtn} px-3.5 py-2`}>Read notice</button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {openCode && <NoticeModal code={openCode} initialLang={lang} purposeMap={purposeMap} onClose={() => setOpenCode("")} />}
        </div>
    );
}
