import { useState } from "react";
import { LANGS, basisLabel, translationState } from "../../../utils/notices.js";
import { DEFAULT_COLOR, isHex } from "../../../utils/noticeTemplate.js";
import { panel } from "../../shared/ui.js";

const names = (list) => (Array.isArray(list) && list.length ? list.join(", ") : "");

export default function NoticePreviewPane({ form, purposes }) {
    const [lang, setLang] = useState("en");
    const tr = form.translations?.[lang];
    const translated = lang === "en" || translationState(tr) === "Translated";
    const title = (lang === "en" ? tr?.title?.trim() || form.title : translated ? tr.title : form.title) || "Untitled notice";
    const summary = (lang === "en" ? tr?.summary?.trim() || form.summary : translated ? tr.summary : form.summary) || "";
    const accent = isHex(form.primaryColor) ? form.primaryColor : DEFAULT_COLOR;
    const picked = form.purposes.map((code) => purposes.find((p) => p.code === code) ?? { code, name: code });

    return (
        <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-line px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">Preview</h2>
                <p className="mt-0.5 text-xs text-ink-3">Exactly what the consumer sees, in the language they chose.</p>
            </div>

            <div className="px-5 pt-3">
                <div role="tablist" className="flex gap-5 border-b border-line">
                    {LANGS.map((l, ki) => {
                        const on = lang === l.code;
                        const done = l.code === "en" ? !!(form.title || form.translations?.en?.title) : translationState(form.translations?.[l.code]) === "Translated";
                        return (
                            <button key={`${l.code}-${ki}`} type="button" role="tab" aria-selected={on} onClick={() => setLang(l.code)} className={`-mb-px flex items-center gap-1.5 border-b-2 px-0.5 pb-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${on ? "border-brand text-brand-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
                                {l.native}
                                {done && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3 p-5">
                <div className="flex items-center gap-3 border-t-4 pt-3" style={{ borderColor: accent }}>
                    {form.logoUrl && <img src={form.logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                    <h3 className="min-w-0 break-words text-sm font-semibold text-ink">{title}</h3>
                </div>
                {!translated && <p className="rounded-lg bg-warn/10 px-3 py-2 text-[11px] text-warn-ink">Not translated yet, so the English wording is shown.</p>}
                {summary && <p className="text-[13px] leading-relaxed text-ink-2">{summary}</p>}
                {form.body && <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{form.body}</p>}

                {picked.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-muted">No purposes selected yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {picked.map((p, ki) => (
                            <li key={`${p.code}-${ki}`} className="rounded-xl border border-line bg-soft p-3.5">
                                <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                                {p.description && <p className="mt-1 text-xs leading-relaxed text-ink-3">{p.description}</p>}
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                                    {basisLabel(p.legalBasis) && <span>{basisLabel(p.legalBasis)}</span>}
                                    {p.retention && <span>Kept for {p.retention}</span>}
                                </div>
                                {names(p.categories) && <p className="mt-1 text-[11px] text-muted">Data: {names(p.categories)}</p>}
                                {names(p.processors) && <p className="mt-0.5 text-[11px] text-muted">Shared with: {names(p.processors)}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
