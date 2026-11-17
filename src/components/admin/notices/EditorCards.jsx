import { LANGS, LAYOUTS, basisLabel, formatDateTime, translationState } from "../../../utils/notices.js";
import { DEFAULT_COLOR, isHex } from "../../../utils/noticeTemplate.js";
import { field, panel } from "../../shared/ui.js";
import { LangChips, StatusPill } from "./NoticeBadges.jsx";

const lbl = "block text-sm font-medium text-ink-2";
const err = "mt-1 block text-xs text-bad-ink";
const hint = "mt-1 block text-xs font-normal text-ink-3";
const names = (list) => (Array.isArray(list) && list.length ? list.join(", ") : "");

function Card({ title, subtitle, children }) {
    return (
        <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-line px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3 py-2 text-sm">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="min-w-0 break-words text-ink">{children}</dd>
        </div>
    );
}

export function ContentCard({ form, set, errors, readOnly, isNew, busy }) {
    if (readOnly) {
        return (
            <Card title="Notice content">
                <h3 className="text-sm font-semibold text-ink">{form.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{form.summary}</p>
                {form.body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2">{form.body}</p>}
            </Card>
        );
    }
    return (
        <Card title="Notice content">
            <div className="space-y-4">
                <label className={lbl}>
                    Title <span className="text-bad-ink">*</span>
                    <input value={form.title} onChange={set("title")} maxLength={150} disabled={busy} placeholder="How we use your information" className={field} aria-invalid={!!errors.title} />
                    <span className={err}>{errors.title}</span>
                </label>
                {isNew && (
                    <label className={lbl}>
                        Code <span className="text-bad-ink">*</span>
                        <input value={form.code} onChange={set("code")} maxLength={100} disabled={busy} placeholder="general_service_notice" className={`${field} font-mono`} aria-invalid={!!errors.code} />
                        <span className={hint}>Stable machine name. New versions of the same notice share this code.</span>
                        <span className={err}>{errors.code}</span>
                    </label>
                )}
                <label className={lbl}>
                    Summary <span className="text-bad-ink">*</span>
                    <textarea value={form.summary} onChange={set("summary")} rows={4} disabled={busy} placeholder="What we collect, why we use it, who else sees it, and what you can switch off." className={`${field} resize-y`} aria-invalid={!!errors.summary} />
                    <span className={hint}>Shown above the purpose list. Keep it to what the consumer needs to decide.</span>
                    <span className={err}>{errors.summary}</span>
                </label>
                <label className={lbl}>
                    Body
                    <textarea value={form.body} onChange={set("body")} rows={6} disabled={busy} className={`${field} resize-y`} />
                    <span className={hint}>Optional extra detail: how to contact the DPO, how to complain to the Board, how to withdraw.</span>
                </label>
            </div>
        </Card>
    );
}

export function DesignCard({ form, set, errors, readOnly, busy }) {
    if (readOnly) {
        return (
            <Card title="Capture page design" subtitle="Applied to the public consent capture page for this notice. Frozen at publish time, like everything else here.">
                <dl className="divide-y divide-line">
                    <Row label="Logo">{form.logoUrl || "—"}</Row>
                    <Row label="Primary color">
                        {form.primaryColor ? <span className="inline-flex items-center gap-2"><span aria-hidden className="h-4 w-4 rounded border border-line-strong" style={{ background: form.primaryColor }} />{form.primaryColor}</span> : "—"}
                    </Row>
                    <Row label="Layout">{form.layout}</Row>
                </dl>
            </Card>
        );
    }
    const swatch = isHex(form.primaryColor) ? form.primaryColor : DEFAULT_COLOR;
    return (
        <Card title="Capture page design" subtitle="Applied to the public consent capture page for this notice. Frozen into the evidence snapshot at publish time.">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className={lbl}>
                    Logo URL
                    <input value={form.logoUrl} onChange={set("logoUrl")} disabled={busy} placeholder="https://.../logo.svg" className={field} />
                    <span className={hint}>Shown at the top of the capture page.</span>
                </label>
                <label className={lbl}>
                    Primary color
                    <div className="mt-1.5 flex items-center gap-2">
                        <input type="color" value={swatch} onChange={set("primaryColor")} disabled={busy} aria-label="Pick a colour" className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-line bg-surface p-1" />
                        <input value={form.primaryColor} onChange={set("primaryColor")} disabled={busy} placeholder="#2B59C3" className={`${field} mt-0 font-mono`} aria-invalid={!!errors.primaryColor} />
                    </div>
                    <span className={err}>{errors.primaryColor}</span>
                </label>
                <label className={lbl}>
                    Layout
                    <select value={form.layout} onChange={set("layout")} disabled={busy} className={field}>
                        {LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </label>
            </div>
        </Card>
    );
}

export function PurposesCard({ form, toggle, options, optionsError, errors, readOnly, busy }) {
    const known = new Set(options.map((p) => p.code));
    const all = [...options, ...form.purposes.filter((c) => !known.has(c)).map((c) => ({ code: c, name: c }))];
    const shown = readOnly ? all.filter((p) => form.purposes.includes(p.code)) : all;

    return (
        <Card title="Purposes covered" subtitle="Sec 5(1) requires each purpose to be itemised, with the data it needs and who receives it.">
            {optionsError && all.length === 0 ? (
                <p className="text-xs text-bad-ink">Could not load purposes: {optionsError}</p>
            ) : shown.length === 0 ? (
                <p className="text-xs text-ink-3">{readOnly ? "No purposes in this notice." : "No purposes yet. Add them on the Purposes page first."}</p>
            ) : (
                <ul className="space-y-3">
                    {shown.map((p) => {
                        const on = form.purposes.includes(p.code);
                        const body = (
                            <>
                                <span className="block text-sm font-semibold text-ink">{p.name}{readOnly && <span className="ml-2 font-mono text-[11px] font-normal text-muted">{p.code}</span>}</span>
                                {p.description && <span className="mt-1 block text-xs leading-relaxed text-ink-3">{p.description}</span>}
                                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                                    {basisLabel(p.legalBasis) && <span>{basisLabel(p.legalBasis)}</span>}
                                    {p.retention && <span>Kept for {p.retention}</span>}
                                    {names(p.categories) && <span>{names(p.categories)}</span>}
                                </span>
                                {p.prohibitedForChildren && <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-bad/10 px-2 py-0.5 text-[11px] font-semibold text-bad-ink ring-1 ring-bad/25"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />Barred for children</span>}
                            </>
                        );
                        return readOnly ? (
                            <li key={p.code} className="rounded-xl border border-line bg-soft p-4">{body}</li>
                        ) : (
                            <li key={p.code}>
                                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${on ? "border-brand/50 bg-brand/5" : "border-line bg-surface hover:border-brand/40"}`}>
                                    <input type="checkbox" checked={on} onChange={() => toggle(p.code)} disabled={busy} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
                                    <span className="min-w-0">{body}</span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            )}
            <span className={err}>{errors.purposes}</span>
        </Card>
    );
}

export function TranslationsCard({ form, setTr, readOnly, busy }) {
    return (
        <Card title="Translations" subtitle="Sec 5(3): the notice must be available in English and the Eighth Schedule languages.">
            <div className="space-y-4">
                {LANGS.map((l) => {
                    const tr = form.translations?.[l.code] ?? { title: "", summary: "" };
                    const state = translationState(tr);
                    return (
                        <div key={l.code} className="rounded-xl border border-line bg-soft p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-ink">{l.label}{l.native !== l.label && <span className="ml-1.5">· {l.native}</span>}</h3>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${state === "Translated" ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-warn/10 text-warn-ink ring-warn/25"}`}>
                                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{state}
                                </span>
                            </div>
                            {readOnly ? (
                                state === "Translated" ? (
                                    <div className="mt-3">
                                        <p className="text-sm font-semibold text-ink">{tr.title}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-ink-2">{tr.summary}</p>
                                    </div>
                                ) : <p className="mt-3 text-xs text-ink-3">Not translated.</p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    <label className={lbl}>Title ({l.label})<input value={tr.title} onChange={setTr(l.code, "title")} disabled={busy} className={field} /></label>
                                    <label className={lbl}>Summary ({l.label})<textarea value={tr.summary} onChange={setTr(l.code, "summary")} rows={4} disabled={busy} className={`${field} resize-y`} /></label>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export function RecordCard({ form, meta, status }) {
    return (
        <Card title="Record">
            <dl className="divide-y divide-line">
                <Row label="Code"><span className="font-mono text-xs">{form.code || "—"}</span></Row>
                <Row label="Version">{meta.version}</Row>
                <Row label="Status"><StatusPill status={status} /></Row>
                <Row label="Content hash">{meta.hash ? <span className="break-all font-mono text-[11px]" title="SHA-256 calculated in this browser when the notice was published">{meta.hash}</span> : "—"}</Row>
                <Row label="Published">{meta.publishedAt ? formatDateTime(meta.publishedAt) : "Not published"}</Row>
                <Row label="Languages"><LangChips translations={form.translations} /></Row>
            </dl>
        </Card>
    );
}
