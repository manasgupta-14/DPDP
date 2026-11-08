import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPrivacyRequestDetail, resolvePrivacyRequest } from "../../api/privacyRequest.js";
import Alert from "../../components/shared/Alert.jsx";
import NotInApi from "../../components/shared/NotInApi.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { REPLY_TEMPLATES, STATUSES, dateText, dateTimeText, dueInfo, isClosed, shortId, statusLabel, typeLabel } from "../../utils/privacyRequest.js";

const allTemplates = Object.values(REPLY_TEMPLATES).flat();

function Card({ title, subtitle, children }) {
    return (
        <section className={panel}>
            <header className="border-b border-[#E2E8F0] px-5 py-4">
                <h2 className="font-semibold text-[#0F172A]">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-[#64748B]">{subtitle}</p>}
            </header>
            <div className="px-5 py-4">{children}</div>
        </section>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[130px_1fr] gap-3 py-1.5 text-sm">
            <dt className="text-[#64748B]">{label}</dt>
            <dd className="min-w-0 break-words font-medium text-[#0F172A]">{children}</dd>
        </div>
    );
}

function buildTimeline(r) {
    const events = [{ title: "Submitted", text: r.details ? `Request received: ${r.details}` : "Request received", at: r.created, by: "Principal", tone: "bg-[#3B82F6]" }];
    if (r.resolved && r.status !== "Submitted") {
        events.push({ title: `Status: ${statusLabel(r.status)}`, text: r.remarks || "No response note recorded.", at: r.resolved, by: "Staff", tone: isClosed(r.status) ? (r.status === "Fulfilled" ? "bg-[#16A34A]" : "bg-[#DC2626]") : "bg-[#3B82F6]" });
    }
    return events;
}

export default function PrivacyRequestDetail() {
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [status, setStatus] = useState("InProgress");
    const [remarks, setRemarks] = useState("");
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState("");

    const apply = useCallback((res, resetForm) => {
        if (!res.ok) {
            setError(res.error);
            setLoading(false);
            return;
        }
        const found = res.data;
        setRequest(found);
        setError("");
        if (resetForm) {
            const next = found.status === "Submitted" ? "InProgress" : found.status;
            setStatus(next);
            setRemarks(found.remarks || REPLY_TEMPLATES[next]?.[0] || "");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getPrivacyRequestDetail(id).then((res) => {
            if (active) apply(res, true);
        });
        return () => {
            active = false;
        };
    }, [id, apply]);

    const changeStatus = (value) => {
        setStatus(value);
        if (!remarks.trim() || allTemplates.includes(remarks)) setRemarks(REPLY_TEMPLATES[value]?.[0] || "");
    };

    const submit = async (nextStatus) => {
        if (!remarks.trim()) {
            setFormError("Add a short note for the user explaining this update.");
            return;
        }
        if (nextStatus === "Fulfilled" && request.type === "Erasure" && !window.confirm("Fulfilling an erasure request permanently anonymises this data principal's record. This cannot be undone. Continue?")) return;
        setBusy(true);
        setFormError("");
        const res = await resolvePrivacyRequest(request.id, { status: nextStatus, resolutionRemarks: remarks });
        if (!res.ok) {
            setBusy(false);
            setFormError(res.error);
            return;
        }
        setNotice(`Status updated to ${statusLabel(nextStatus)}.`);
        apply(await getPrivacyRequestDetail(request.id), false);
        setStatus(nextStatus);
        setBusy(false);
    };

    if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-[#E2E8F0]/70" aria-busy="true" />;

    if (!request) {
        return (
            <div className="space-y-4">
                <Link to="/dashboard/rights-requests" className="text-sm font-semibold text-[#0F766E] hover:underline">← Back to Rights Requests</Link>
                <Alert>{error || "Request not found."}</Alert>
            </div>
        );
    }

    const due = dueInfo(request);
    const closed = isClosed(request.status);
    const daysLeft = request.target ? Math.ceil((request.target.getTime() - Date.now()) / 86400000) : null;
    const timeline = buildTimeline(request);

    return (
        <div className="mx-auto max-w-6xl space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{typeLabel(request.type)}</h1>
                    <p className="mt-1 text-sm text-[#475569]">
                        <Link to="/dashboard/rights-requests" className="font-semibold text-[#0F766E] hover:underline">← Back to Rights Requests</Link>
                        <span className="mx-1.5">·</span>
                        <span className="font-mono text-xs" title={request.id}>{request.referenceId || shortId(request.id)}</span>
                    </p>
                </div>
                <StatusBadge status={request.status} />
            </div>

            {error && <Alert>{error}</Alert>}
            {notice && <Alert tone="success">{notice}</Alert>}

            {due?.overdue && (
                <div role="alert" className="rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 px-5 py-4 text-sm text-[#0F172A]">
                    <p className="font-semibold text-[#991B1B]">This request is past its statutory deadline</p>
                    <p className="mt-0.5 text-[#475569]">It was due {dateText(request.target)} — {due.text.toLowerCase()}. Complete it now and record the reason for the delay in the response notes.</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                <div className="space-y-6">
                    <Card title="Request">
                        <dl className="divide-y divide-[#F1F5F9]">
                            <Row label="Reference"><span className="font-mono text-xs">{request.referenceId || "-"}</span></Row>
                            <Row label="Right exercised">{typeLabel(request.type)}</Row>
                            <Row label="Status"><StatusBadge status={request.status} /></Row>
                            <Row label="Data principal">
                                {request.principalName || "-"} <span className="ml-1 font-mono text-xs font-normal text-[#64748B]" title={request.principalId}>{shortId(request.principalId)}</span>
                            </Row>
                            <Row label="Email">{request.principalEmail || "-"}</Row>
                            <Row label="Mobile">{request.principalMobile || "-"}</Row>
                            <Row label="Raised via"><NotInApi /></Row>
                            <Row label="Raised">{dateTimeText(request.created)}</Row>
                            <Row label="Deadline">
                                <span className="flex flex-wrap items-center gap-2">
                                    {due && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${due.overdue ? "bg-[#DC2626]/10 text-[#B91C1C]" : "bg-[#D97706]/10 text-[#B45309]"}`}>{due.text}</span>}
                                    <span className="text-xs font-normal text-[#64748B]">{dateTimeText(request.target)}</span>
                                </span>
                            </Row>
                            <Row label="Assigned to"><NotInApi /></Row>
                            <Row label="Details"><span className="whitespace-pre-wrap font-normal">{request.details || "-"}</span></Row>
                            {closed && <Row label="Closed">{dateTimeText(request.resolved)}</Row>}
                        </dl>
                    </Card>

                    <Card title="Identity verification" subtitle="Nothing is disclosed until we know who is asking.">
                        <NotInApi />
                    </Card>

                    <Card title="Fulfilment tasks" subtitle="One per system that holds this person's data.">
                        <p className="text-sm text-[#475569]">Task list and "Mark complete": <NotInApi /></p>
                    </Card>

                    <Card title="Move this request on">
                        <div className="space-y-4">
                            <Alert>{formError}</Alert>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium text-[#0F172A]">
                                    Status
                                    <select value={status} onChange={(e) => changeStatus(e.target.value)} className={field}>
                                        {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                    </select>
                                    <span className="mt-1 block text-xs font-normal text-[#64748B]">Shown to the user in their History.</span>
                                </label>
                                <label className="block text-sm font-medium text-[#0F172A]">
                                    Assign to
                                    <select disabled className={field}><option>Not in API</option></select>
                                    <span className="mt-1 block text-xs font-normal text-[#64748B]">The analyst who owns it.</span>
                                </label>
                            </div>
                            <label className="block text-sm font-medium text-[#0F172A]">
                                Response notes
                                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} placeholder="What was done, and where the data came from. Included in the response to the Data Principal." className={field} />
                            </label>
                            {(REPLY_TEMPLATES[status] || []).length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-medium text-[#64748B]">Quick note:</span>
                                    {REPLY_TEMPLATES[status].map((t) => (
                                        <button key={t} type="button" onClick={() => setRemarks(t)} className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-left text-[#334155] transition hover:border-[#0F766E] hover:text-[#0F766E]">
                                            {t.length > 52 ? `${t.slice(0, 50)}...` : t}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <button type="button" disabled={busy} onClick={() => submit("Fulfilled")} className={primaryBtn}>{busy ? "Saving..." : "Fulfil request"}</button>
                                <button type="button" disabled={busy} onClick={() => submit("Rejected")} className={ghostBtn}>Refuse request</button>
                                <button type="button" disabled={busy} onClick={() => submit(status)} className={ghostBtn}>Save as {statusLabel(status)}</button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card title="Progress">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[#E2E8F0] p-4">
                                <p className="text-xs text-[#64748B]">Tasks complete</p>
                                <p className="mt-2">{request.totalTasks == null ? <NotInApi /> : <span className="text-2xl font-bold text-[#0F172A]">{request.completedTasks ?? 0} of {request.totalTasks}</span>}</p>
                            </div>
                            <div className="rounded-xl border border-[#E2E8F0] p-4">
                                <p className="text-xs text-[#64748B]">Days remaining</p>
                                <p className={`mt-1 text-2xl font-bold ${closed ? "text-[#16A34A]" : daysLeft !== null && daysLeft < 0 ? "text-[#DC2626]" : "text-[#0F172A]"}`}>{closed ? "Closed" : daysLeft ?? "-"}</p>
                                <p className="mt-0.5 text-xs text-[#64748B]">Due {dateText(request.target)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card title="Timeline" subtitle="Actions the API has recorded on this request.">
                        <ol className="space-y-4">
                            {timeline.map((e) => (
                                <li key={e.title} className="flex gap-3">
                                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${e.tone}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#0F172A]">{e.title}</p>
                                        <p className="whitespace-pre-wrap break-words text-sm text-[#475569]">{e.text}</p>
                                        <p className="mt-0.5 text-xs text-[#94A3B8]">{dateTimeText(e.at)} · {e.by}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <p className="mt-4 border-t border-[#F1F5F9] pt-3 text-xs text-[#64748B]">Identity, task dispatch and assignment events: <NotInApi /></p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
