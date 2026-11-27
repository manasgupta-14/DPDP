import { useEffect, useRef, useState } from "react";
import { LANGUAGES, SOURCE_LANG, langByCode } from "./languages.js";
import { useLanguage } from "./useLanguage.js";

export default function LanguageSwitcher({ className = "", align = "right" }) {
    const { lang, busy, error, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    const current = langByCode(lang);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (!box.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={box} translate="no" data-native-select className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Change language"
                title="Language / भाषा"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-ink-2 transition hover:border-brand hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.6 2.8 3.9 5.8 3.9 9S14.6 18.2 12 21c-2.6-2.8-3.9-5.8-3.9-9S9.4 5.8 12 3z" />
                </svg>
                <span className="max-w-[6rem] truncate">{current.native}</span>
                {busy && <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Translating" />}
            </button>

            {open && (
                <div className={`absolute z-[70] mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>
                    <ul role="listbox" aria-label="Languages" className="max-h-72 overflow-y-auto py-1">
                        {LANGUAGES.map((l) => (
                            <li key={l.code} role="option" aria-selected={l.code === lang}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLanguage(l.code);
                                        setOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm transition hover:bg-soft ${l.code === lang ? "font-semibold text-brand-ink" : "text-ink-2"}`}
                                >
                                    <span>{l.native}</span>
                                    <span className="flex items-center gap-2 text-xs text-muted">
                                        {l.code !== SOURCE_LANG && l.label}
                                        {l.code === lang && <span aria-hidden="true">&#10003;</span>}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="border-t border-line px-3.5 py-2 text-[11px] leading-4 text-muted">
                        Machine translation by Sarvam AI. English text is the official version.
                    </p>
                    {error && <p role="alert" className="border-t border-line bg-bad-soft px-3.5 py-2 text-xs text-bad-ink">{error}</p>}
                </div>
            )}
        </div>
    );
}
