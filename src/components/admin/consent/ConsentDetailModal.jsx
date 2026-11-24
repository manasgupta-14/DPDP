import { useState } from "react";
import Icon from "../../shared/Icon.jsx";
import Modal from "../../shared/Modal.jsx";
import { noticeTextFor, pickNoticeForConsent } from "../../../api/consentNotice.js";
import { languageLabel } from "../../../config/consentNotice.js";
import { allowedPurposes, artifactHistory, expiryText, formatStamp, MISSING, notAllowedPurposes } from "../../../utils/consent.js";
import { NotInApi } from "../purposes/NotInApi.jsx";
import ConsentStatusBadge from "./StatusBadge.jsx";
import { dkModal, dkTh } from "./styles.js";

const missing = <span className="text-muted">{MISSING}</span>;

function Fact({ icon, label, children }) {
    return (
        <div className="rounded-xl border border-line bg-soft p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <Icon name={icon} className="h-3.5 w-3.5" />{label}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{children}</p>
        </div>
    );
}

function Card({ title, aside, children }) {
    return (
        <section className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                {aside}
            </div>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Row({ label, children, mono }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-3 py-1.5 text-xs">
            <dt className="text-ink-3">{label}</dt>
            <dd className={`min-w-0 break-all text-ink ${mono ? "font-mono text-[11px]" : ""}`}>{children}</dd>
        </div>
    );
}

const stateTone = (allowed) => (allowed ? "bg-ok/10 text-ok-ink ring-ok/25" : "bg-line text-ink-2 ring-line-strong");

export default function ConsentDetailModal({ record, notices = [], noticesLoading = false, loading = false, error = "", onClose }) {
    const [fullNotice, setFullNotice] = useState(false);
    const history = artifactHistory(record);
    const yes = allowedPurposes(record);
    const no = notAllowedPurposes(record);
    const match = pickNoticeForConsent(notices, record);
    const detail = match?.detail || null;
    const noticeLoading = noticesLoading;
    const text = noticeTextFor(detail, record.language);
    const noticeTitle = (text.matchedLanguage && text.title) || match?.title || match?.code || "";

    return (
        <Modal title="Consent artifact" onClose={onClose}>
            <div className={dkModal}>
                <header className="pr-10">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink"><Icon name="consent" className="h-5 w-5" /></span>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold leading-tight">Consent artifact</h2>
                            <p className="break-all font-mono text-[11px] text-muted">{record.reference}</p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-2">
                            <span className="rounded-md bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-2 ring-1 ring-line-strong">v{record.version}</span>
                            <ConsentStatusBadge status={record.status} />
                        </span>
                    </div>
                    {loading && <p className="mt-2 text-[11px] text-muted" aria-live="polite">Loading latest details...</p>}
                    {error && <p role="alert" className="mt-2 text-[11px] text-bad-ink">{error} Showing the data from the records list instead.</p>}
                </header>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Fact icon="calendar" label="Given">{formatStamp(record.submittedAt) || missing}</Fact>
                    <Fact icon="clock" label="Expires">{record.lapses ? expiryText(record.expiresAt) : "Does not lapse"}</Fact>
                    <Fact icon="share" label="Channel">{record.channel || <NotInApi />}</Fact>
                    <Fact icon="notice" label="Language">{languageLabel(record.language) || <NotInApi />}</Fact>
                </div>

                <Card
                    title="Privacy notice"
                    aside={match && <span className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-ink ring-1 ring-brand/20">{match.code} · v{match.version}</span>}
                >
                    {noticeLoading ? (
                        <div className="space-y-2" aria-busy="true"><div className="h-4 w-1/3 pg-shimmer rounded" /><div className="h-10 pg-shimmer rounded" /></div>
                    ) : !match ? (
                        <p className="text-xs text-muted">No notice has been created for this organisation yet.</p>
                    ) : (
                        <div className="rounded-lg bg-soft p-3 ring-1 ring-line">
                            <p className="text-sm font-semibold text-ink">{noticeTitle}</p>
                            {text.summary && <p className={`mt-1.5 text-xs leading-5 text-ink-2 ${fullNotice ? "" : "line-clamp-3"}`}>{text.summary}</p>}
                            {!text.matchedLanguage && text.title && <p className="mt-1.5 text-[11px] text-ink-3">No {languageLabel(record.language) || "matching"} translation, showing {text.languageCode || "available"} text.</p>}
                            {fullNotice && detail && (
                                <dl className="mt-2 divide-y divide-line border-t border-line pt-1">
                                    <Row label="Status">{detail.status}</Row>
                                    <Row label="Purposes covered">{detail.purposes.length ? detail.purposes.join(", ") : missing}</Row>
                                    <Row label="Notice hash" mono>{detail.hash || missing}</Row>
                                </dl>
                            )}
                            {detail && (
                                <button type="button" onClick={() => setFullNotice((v) => !v)} aria-expanded={fullNotice} className="mt-2 text-xs font-semibold text-brand-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                                    {fullNotice ? "Show less" : "Show full notice details"}
                                </button>
                            )}
                        </div>
                    )}
                    <p className="mt-2 text-[11px] text-ink-3">The consent record does not store which notice was shown, so this is the notice that was in force when consent was given.</p>
                    {record.notice && <p className="mt-1 text-[11px] text-ink-3">Notice reference: <span className="font-mono text-ink-2">{record.notice}</span></p>}
                </Card>

                <Card
                    title="Purposes"
                    aside={
                        <span className="flex gap-1.5 text-[11px] font-semibold">
                            <span className="rounded-md bg-ok/10 px-2 py-0.5 text-ok-ink ring-1 ring-ok/25">{yes.length} allowed</span>
                            <span className="rounded-md bg-line px-2 py-0.5 text-ink-2 ring-1 ring-line-strong">{no.length} not allowed</span>
                        </span>
                    }
                >
                    <div className="overflow-x-auto rounded-lg border border-line">
                        <table className="w-full min-w-[360px] text-xs">
                            <thead className="bg-soft">
                                <tr>{["Purpose", "Decision", "Status"].map((h) => <th key={h} className={dkTh}>{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {record.purposes.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-2.5 text-ink">{p.name}{p.mandatory && <span className="ml-1.5 text-[10px] text-ink-3">(required)</span>}</td>
                                        <td className="px-4 py-2.5 text-ink-2">{p.decision === "Yes" ? "Agreed" : "Declined"}</td>
                                        <td className="px-4 py-2.5"><span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${stateTone(p.allowed)}`}>{p.state}</span></td>
                                    </tr>
                                ))}
                                {record.purposes.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-muted">No purposes were recorded for this consent.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card title="History">
                    {history.length === 0 ? (
                        <p className="text-xs text-muted">No history recorded.</p>
                    ) : (
                        <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[4px] before:top-2 before:w-px before:bg-line">
                            {history.map((e) => (
                                <li key={e.id} className="relative flex items-start gap-3 pl-5 text-xs">
                                    <span aria-hidden="true" className="absolute left-0 top-1.5 h-[9px] w-[9px] rounded-full bg-brand ring-2 ring-surface" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-ink">{e.title} <span className="font-normal text-ink-3">(v{e.version})</span></p>
                                        <p className="text-ink-3">{e.detail}</p>
                                        {e.changes.map((c) => <p key={c} className="text-ink-2">{c}</p>)}
                                    </div>
                                    <time className="shrink-0 text-ink-3">{formatStamp(e.at)}</time>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>

                <details className="group rounded-xl border border-line px-4 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
                        Record details
                        <Icon name="chevron" className="h-4 w-4 text-ink-3 transition group-open:rotate-180" />
                    </summary>
                    <dl className="mt-2 divide-y divide-line">
                        <Row label="Receipt" mono>{record.receiptId || missing}</Row>
                        <Row label="Data principal" mono>{record.principalId || missing}</Row>
                        <Row label="Tamper check (hash)" mono>{record.hash || missing}</Row>
                        <Row label="Signature" mono>{record.signature || <NotInApi />}{record.keyId ? ` (key ${record.keyId})` : ""}</Row>
                    </dl>
                </details>

                <div className="flex justify-end">
                    <button type="button" onClick={onClose} className="inline-flex h-9 items-center rounded-[10px] border border-line bg-surface px-4 text-xs font-semibold text-ink-2 transition hover:border-line-strong hover:bg-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Close</button>
                </div>
            </div>
        </Modal>
    );
}
