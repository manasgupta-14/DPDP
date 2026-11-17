import { useEffect, useState } from "react";
import { NOTICE_LANGUAGES, getPublishedNotice, getPublishedNotices, getPurposeOptions } from "../../api/notice.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel } from "../../components/shared/ui.js";

function NoticeReader({ code, lang, purposeNames, onClose }) {
    const [state, setState] = useState({ loading: true, data: null, error: "" });

    useEffect(() => {
        let active = true;
        getPublishedNotice(code, lang).then((res) => {
            if (active) setState({ loading: false, data: res.ok ? res.data : null, error: res.ok ? "" : res.error });
        });
        return () => {
            active = false;
        };
    }, [code, lang]);

    const n = state.data;
    const color = n?.primaryColor || "#2B59C3";

    return (
        <Modal title="Privacy notice" onClose={onClose}>
            <div className="max-h-[88vh] overflow-y-auto rounded-2xl border border-line bg-surface text-ink shadow-xl">
                {state.loading ? (
                    <div className="space-y-2 p-6" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-10 pg-shimmer rounded" />)}</div>
                ) : state.error ? (
                    <div className="p-6"><Alert>{state.error}</Alert></div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 rounded-t-2xl px-6 py-4 pr-14 text-white" style={{ background: color }}>
                            {n.logoUrl && <img src={n.logoUrl} alt="" className="h-8 w-8 rounded bg-surface object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold">{n.title}</h2>
                                <p className="text-xs opacity-80">Version {n.version}</p>
                            </div>
                        </div>
                        <div className="space-y-5 p-6">
                            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{n.summary}</p>
                            {n.purposes.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold">We use your data for</p>
                                    <ul className="mt-2 space-y-1.5">
                                        {n.purposes.map((c) => (
                                            <li key={c} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                                                {purposeNames.get(c) ?? c}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {n.hash && <p className="break-all font-mono text-[11px] text-muted">Integrity hash: {n.hash}</p>}
                            <div className="flex justify-end"><button type="button" onClick={onClose} className={ghostBtn}>Close</button></div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default function PrivacyNotices() {
    const [lang, setLang] = useState("en");
    const [state, setState] = useState({ loading: true, rows: [], error: "" });
    const [purposeNames, setPurposeNames] = useState(() => new Map());
    const [open, setOpen] = useState(null);

    useEffect(() => {
        let active = true;
        getPublishedNotices(lang).then((res) => {
            if (active) setState(res.ok ? { loading: false, rows: res.data, error: "" } : { loading: false, rows: [], error: res.error });
        });
        return () => {
            active = false;
        };
    }, [lang]);

    useEffect(() => {
        let active = true;
        getPurposeOptions().then((res) => {
            if (active && res.ok) setPurposeNames(new Map(res.data.map((p) => [p.code, p.name])));
        });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">Privacy notices</h1>
                    <p className="mt-1 text-sm text-ink-3">Read how the organisation collects and uses your personal data.</p>
                </div>
                <label className="text-xs font-medium text-ink-3">
                    Language
                    <select value={lang} onChange={(e) => { setLang(e.target.value); setState((s) => ({ ...s, loading: true })); }} className={`${field} min-w-[150px] py-2`}>
                        {NOTICE_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                </label>
            </div>

            {state.error && <Alert>{state.error}</Alert>}

            {state.loading ? (
                <div className="grid gap-4 md:grid-cols-2" aria-busy="true">{[0, 1].map((i) => <div key={i} className={`${panel} h-36 animate-pulse`} />)}</div>
            ) : state.rows.length === 0 && !state.error ? (
                <div className={`${panel} px-5 py-12 text-center text-sm text-ink-3`}>No privacy notices have been published yet.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {state.rows.map((n) => (
                        <article key={n.code} className={`${panel} flex flex-col overflow-hidden`}>
                            <div className="h-1.5" style={{ background: n.primaryColor || "#2B59C3" }} />
                            <div className="flex flex-1 flex-col p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="font-semibold">{n.title}</h2>
                                    <span className="shrink-0 rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-line-strong">v{n.version}</span>
                                </div>
                                <p className="mt-2 line-clamp-3 text-sm text-ink-3">{n.summary}</p>
                                <div className="mt-auto pt-4">
                                    <button type="button" onClick={() => setOpen(n.code)} className="text-sm font-semibold text-brand-ink hover:underline">Read full notice</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {open && <NoticeReader key={`${open}-${lang}`} code={open} lang={lang} purposeNames={purposeNames} onClose={() => setOpen(null)} />}
        </div>
    );
}
