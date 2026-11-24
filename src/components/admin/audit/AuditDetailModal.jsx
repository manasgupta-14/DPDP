import Modal from "../../shared/Modal.jsx";
import { ACTION_DOT, ACTION_TONE, NOT_IN_API, OUTCOME_TONE, actionKind, actionVerb, humanizeAction, isSuccess } from "../../../utils/audit.js";

const notInApi = <span className="text-muted">{NOT_IN_API}</span>;

const when = (d) => (d ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : null);

function Row({ label, children, mono }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-xs">
            <dt className="text-muted">{label}</dt>
            <dd className={`min-w-0 break-all text-ink ${mono ? "font-mono text-[11px]" : ""}`}>{children}</dd>
        </div>
    );
}

export default function AuditDetailModal({ log, onClose }) {
    const actionTone = ACTION_TONE[actionKind(log.action)];
    const outcomeTone = isSuccess(log.outcome) ? OUTCOME_TONE.success : OUTCOME_TONE.other;

    return (
        <Modal title={`Audit entry ${log.seq ?? ""}`} onClose={onClose}>
            <div className="max-h-[85vh] overflow-y-auto rounded-xl border border-line bg-surface p-5 text-ink shadow-xl">
                <h2 className="pr-10 text-base font-semibold">Audit entry {log.seq ?? "-"}</h2>
                <p className="mt-0.5 text-xs text-muted">Who did what, and when, for this recorded change.</p>

                <dl className="mt-3 divide-y divide-line">
                    <Row label="Sequence" mono>{log.seq ?? notInApi}</Row>
                    <Row label="When">{when(log.time) || notInApi}</Row>
                    <Row label="Action">
                        {log.action
                            ? <span title={humanizeAction(log.action)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ${actionTone}`}><i aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${ACTION_DOT[actionKind(log.action)]}`} />{actionVerb(log.action)}</span>
                            : notInApi}
                    </Row>
                    <Row label="Entity type">{log.entityType || notInApi}</Row>
                    <Row label="Entity id" mono>
                        {log.keyPairs.length === 0 ? notInApi : log.keyPairs.map((k, i) => (
                            <span key={`${k.name}-${i}`} className="block">{k.name ? `${k.name}: ` : ""}{k.value || "-"}</span>
                        ))}
                    </Row>
                    <Row label="Actor">
                        {log.actorEmail
                            ? <>{log.actorEmail}{log.actorRole ? <span className="text-muted"> ({log.actorRole})</span> : null}</>
                            : notInApi}
                    </Row>
                    <Row label="Outcome">
                        {log.outcome
                            ? <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${outcomeTone}`}>{log.outcome}</span>
                            : notInApi}
                    </Row>
                    <Row label="Entry hash" mono>{log.hash || notInApi}</Row>
                    <Row label="Previous hash" mono>{notInApi}</Row>
                    <Row label="IP address" mono>{notInApi}</Row>
                </dl>

                <h3 className="mt-5 text-sm font-semibold">Payload</h3>
                <div className="mt-2 rounded-lg border border-line bg-soft p-3 text-xs">
                    <p className="font-medium text-ink">Old values / new values</p>
                    <p className="mt-1">{notInApi}</p>
                </div>
            </div>
        </Modal>
    );
}
