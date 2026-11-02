import Modal from "../../shared/Modal.jsx";
import { allowedPurposes, artifactHistory, expiryText, formatStamp, MISSING, notAllowedPurposes } from "../../../utils/consent.js";
import { NotInApi } from "../purposes/NotInApi.jsx";
import ConsentStatusBadge from "./StatusBadge.jsx";
import { dkModal, dkTh } from "./styles.js";

const missing = <span className="text-[#64748B]">{MISSING}</span>;

function Row({ label, children, mono }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-3 py-1.5 text-xs">
            <dt className="text-[#475569]">{label}</dt>
            <dd className={`min-w-0 break-all text-[#0F172A] ${mono ? "font-mono text-[11px]" : ""}`}>{children}</dd>
        </div>
    );
}

function Chips({ items, tone }) {
    if (items.length === 0) return <span className="text-[#64748B]">None</span>;
    return (
        <span className="flex flex-wrap gap-1">
            {items.map((p) => <span key={p.id} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ${tone}`}>{p.name}</span>)}
        </span>
    );
}

const stateTone = (allowed) => (allowed ? "bg-[#16A34A]/10 text-[#15803D] ring-[#16A34A]/25" : "bg-[#E2E8F0] text-[#334155] ring-[#CBD5E1]");

export default function ConsentDetailModal({ record, onClose }) {
    const history = artifactHistory(record);
    const yes = allowedPurposes(record);
    const no = notAllowedPurposes(record);

    return (
        <Modal title="Consent artifact" onClose={onClose}>
            <div className={dkModal}>
                <h2 className="pr-10 text-base font-semibold">Consent artifact</h2>

                <dl className="divide-y divide-[#E2E8F0]">
                    <Row label="Reference" mono>{record.reference}</Row>
                    <Row label="Receipt" mono>{record.receiptId || missing}</Row>
                    <Row label="Version">v{record.version}</Row>
                    <Row label="Status"><ConsentStatusBadge status={record.status} /></Row>
                    <Row label="Data principal" mono>{record.principalId || missing}</Row>
                    <Row label="Notice" mono>{record.notice || <NotInApi />}</Row>
                    <Row label="Channel">{record.channel || <NotInApi />}</Row>
                    <Row label="Language">{record.language || <NotInApi />}</Row>
                    <Row label="Given">{formatStamp(record.submittedAt) || missing}</Row>
                    <Row label="Expires">{record.lapses ? expiryText(record.expiresAt) : "Does not lapse"}</Row>
                    <Row label="Integrity / hash" mono>{record.hash || missing}</Row>
                    <Row label="Signature" mono>{record.signature || <NotInApi />}{record.keyId ? ` (key ${record.keyId})` : ""}</Row>
                </dl>

                <h3 className="text-sm font-semibold">Summary</h3>
                <dl className="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs">
                    <div className="grid grid-cols-[110px_1fr] gap-3"><dt className="font-semibold text-[#15803D]">Allowed</dt><dd><Chips items={yes} tone={stateTone(true)} /></dd></div>
                    <div className="grid grid-cols-[110px_1fr] gap-3"><dt className="font-semibold text-[#334155]">Not allowed</dt><dd><Chips items={no} tone={stateTone(false)} /></dd></div>
                </dl>

                <h3 className="text-sm font-semibold">Purposes</h3>
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                    <table className="w-full min-w-[360px] text-xs">
                        <thead className="bg-[#F8FAFC]">
                            <tr>{["Purpose", "Decision", "Status"].map((h) => <th key={h} className={dkTh}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                            {record.purposes.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2.5 text-[#0F172A]">{p.name}{p.mandatory && <span className="ml-1.5 text-[10px] text-[#475569]">(required)</span>}</td>
                                    <td className="px-4 py-2.5 text-[#334155]">{p.decision === "Yes" ? "Agreed" : "Declined"}</td>
                                    <td className="px-4 py-2.5"><span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ${stateTone(p.allowed)}`}>{p.state}</span></td>
                                </tr>
                            ))}
                            {record.purposes.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-[#64748B]">No purposes were recorded for this consent.</td></tr>}
                        </tbody>
                    </table>
                </div>

                <h3 className="text-sm font-semibold">History</h3>
                <ol className="space-y-2">
                    {history.map((e) => (
                        <li key={e.id} className="flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs">
                            <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#22D3EE]" />
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-[#0F172A]">{e.title} <span className="font-normal text-[#475569]">(v{e.version})</span></p>
                                <p className="text-[#475569]">{e.detail}</p>
                                {e.changes.map((c) => <p key={c} className="text-[#334155]">{c}</p>)}
                            </div>
                            <time className="shrink-0 text-[#475569]">{formatStamp(e.at)}</time>
                        </li>
                    ))}
                </ol>
            </div>
        </Modal>
    );
}
