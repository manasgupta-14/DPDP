import { useEffect, useState } from "react";
import { getDataPrincipal360 } from "../../../api/dataPrincipals.js";
import { formatWhen } from "../../../utils/bulkImport.js";
import { PRINCIPAL_CLASSES } from "../../../utils/dataPrincipals.js";
import Modal from "../../shared/Modal.jsx";
import { ghostBtn, panel } from "../../shared/ui.js";
import { NotInApi } from "../purposes/NotInApi.jsx";

const th = "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[#475569]";
const classLabel = (v) => PRINCIPAL_CLASSES.find((c) => c.value === v)?.label || v || "-";
const day = (v) => {
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) && d.getFullYear() > 1 ? formatWhen(v) : "-";
};

function Block({ title, note, children }) {
    return (
        <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
            {note && <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#475569]">{note}</p>}
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Empty({ children }) {
    return <p className="text-xs text-[#64748B]">{children}</p>;
}

export default function DataPrincipal360Modal({ id, onClose }) {
    const [state, setState] = useState({ loading: true, error: "", data: null });

    useEffect(() => {
        let active = true;
        getDataPrincipal360(id).then((res) => {
            if (!active) return;
            setState({ loading: false, error: res.ok ? "" : res.error, data: res.ok ? res.data : null });
        });
        return () => {
            active = false;
        };
    }, [id]);

    const { loading, error, data } = state;

    return (
        <Modal title="Data principal 360 view" onClose={onClose}>
            <div className={`${panel} max-h-[90vh] space-y-4 overflow-y-auto p-5 sm:p-6`}>
                <div className="pr-8">
                    <h2 className="text-lg font-semibold text-[#0F172A]">Data principal 360 view</h2>
                    <p className="mt-1 text-sm text-[#475569]">Everything held for this person. Name, email, mobile and consumer no. are masked.</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-[#64748B]">{id}</p>
                </div>

                {loading && <div className="h-24 animate-pulse rounded-xl bg-[#E2E8F0]/70" />}
                {error && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>}

                {data && (
                    <>
                        <Block title="Record">
                            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                                {[
                                    ["Reference", data.record.referenceId || "-"],
                                    ["Name (masked)", data.record.name || "-"],
                                    ["Class", classLabel(data.record.cls)],
                                    ["Status", data.record.status || "-"],
                                    ["Preferred language", data.record.preferredLanguage || "-"],
                                    ["Registered", day(data.record.registeredDate)],
                                ].map(([k, v]) => (
                                    <div key={k}><dt className="text-[#64748B]">{k}</dt><dd className="font-medium text-[#0F172A]">{v}</dd></div>
                                ))}
                            </dl>
                        </Block>

                        <Block title="Identifiers" note={data.identifiers.length === 0 ? "No identifiers recorded." : undefined}>
                            {data.identifiers.length === 0 ? <Empty>No identifiers on record.</Empty> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[420px] text-xs text-[#334155]">
                                        <thead><tr>{["Kind", "Value (masked)", "Primary", "Verified"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                                        <tbody className="divide-y divide-[#E2E8F0]">
                                            {data.identifiers.map((i, n) => (
                                                <tr key={n}><td className="px-3 py-2">{i.kind}</td><td className="px-3 py-2 font-mono">{i.value || "-"}</td><td className="px-3 py-2">{i.isPrimary ? "Yes" : "No"}</td><td className="px-3 py-2">{i.isVerified ? "Yes" : "No"}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Block>

                        <Block title="Rights requests">
                            {data.rightsRequests.length === 0 ? <Empty>No rights requests raised.</Empty> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[520px] text-xs text-[#334155]">
                                        <thead><tr>{["Reference", "Right", "Status", "Raised", "Deadline"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                                        <tbody className="divide-y divide-[#E2E8F0]">
                                            {data.rightsRequests.map((q) => (
                                                <tr key={q.id}><td className="px-3 py-2 font-mono">{q.reference}</td><td className="px-3 py-2">{q.right}</td><td className="px-3 py-2">{q.status}</td><td className="px-3 py-2">{day(q.raisedOn)}</td><td className="px-3 py-2">{day(q.deadline)}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Block>

                        <Block title="Consents" >
                            {data.consents.length === 0 ? <Empty>No consent records.</Empty> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[420px] text-xs text-[#334155]">
                                        <thead><tr>{["Purpose", "Granted on", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                                        <tbody className="divide-y divide-[#E2E8F0]">
                                            {data.consents.map((c, n) => (
                                                <tr key={n}><td className="px-3 py-2">{c.purposeName === "Mapped Purpose" ? <NotInApi /> : c.purposeName || "-"}</td><td className="px-3 py-2">{day(c.grantedOn)}</td><td className="px-3 py-2">{c.status || "-"}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Block>
                    </>
                )}

                <div className="flex justify-end"><button type="button" onClick={onClose} className={ghostBtn}>Close</button></div>
            </div>
        </Modal>
    );
}
