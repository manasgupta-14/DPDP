import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDpia, reviewDpia } from "../../api/dpia.js";
import { getSession } from "../../auth/authStore.js";
import { usePermissions } from "../../auth/usePermissions.js";
import { DPIA_CHANGED, PERM, REJECT_SUPPORTED } from "../../config/dpia.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import AssessmentView from "../../components/dpia/AssessmentView.jsx";
import { DpiaStatusBadge } from "../../components/dpia/Badges.jsx";
import { formatDate } from "../../utils/breach.js";
import { formatDay } from "../../utils/campaign.js";
import { STATUS, decodeDetails, displayStatus } from "../../utils/dpia.js";
import { useDpiaBase } from "./useDpiaBase.js";

const ACTIONS = {
    Approve: {
        title: "Approve this DPIA?",
        text: "The DPIA is marked Approved and the decision is recorded against your name.",
        done: "DPIA approved.",
        button: "bg-[#16A34A] hover:bg-[#15803D]",
        confirm: "Approve",
        notesRequired: false,
    },
    SendBack: {
        title: "Request changes?",
        text: "The DPIA goes back to the Admin with your note. They revise it and submit a new version.",
        done: "Changes requested. The Admin has been asked to revise this DPIA.",
        button: "bg-[#D97706] hover:bg-[#B45309]",
        confirm: "Request changes",
        notesRequired: true,
    },
    Reject: {
        title: "Reject this DPIA?",
        text: "Use this when the processing cannot comply with the DPDP Act, 2023.",
        done: "DPIA rejected.",
        button: "bg-[#DC2626] hover:bg-[#B91C1C]",
        confirm: "Reject",
        notesRequired: true,
    },
};

function Meta({ label, children }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-sm">
            <dt className="text-[#64748B]">{label}</dt>
            <dd className="text-right font-medium text-[#0F172A]">{children}</dd>
        </div>
    );
}

export default function DpiaDetail() {
    const { id } = useParams();
    const base = useDpiaBase();
    const { can } = usePermissions();
    const me = getSession();

    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notes, setNotes] = useState("");
    const [notesError, setNotesError] = useState("");
    const [pending, setPending] = useState(null); // action key awaiting confirmation
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [done, setDone] = useState("");

    const reload = useCallback(async () => {
        const res = await getDpia(id);
        if (res.ok) setRecord(res.data);
        else setError(res.error);
        return res.ok;
    }, [id]);

    useEffect(() => {
        let active = true;
        getDpia(id).then((res) => {
            if (!active) return;
            if (res.ok) setRecord(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [id]);

    if (loading) return <p className="text-sm text-[#475569]">Loading DPIA...</p>;
    if (error || !record) {
        return (
            <div className="mx-auto max-w-xl space-y-4">
                <Alert>{error || "DPIA not found."}</Alert>
                <Link to={base} className={ghostBtn}>Back to DPIA list</Link>
            </div>
        );
    }

    const status = displayStatus(record.status);
    const decoded = decodeDetails(record.assessmentDetails);
    const isPending = status === STATUS.PENDING;
    const isMaker = !!me?.userId && String(record.createdByUserId) === String(me.userId);
    const canReview = isPending && can(PERM.approve);
    const canRevise = status === STATUS.CHANGES && can(PERM.create);

    const choose = (action) => {
        setActionError("");
        setDone("");
        if (ACTIONS[action].notesRequired && notes.trim().length < 10) {
            setNotesError("Write what needs to change or why (at least 10 characters).");
            return;
        }
        setNotesError("");
        setPending(action);
    };

    const confirm = async () => {
        setBusy(true);
        const res = await reviewDpia(record.id, { action: pending, reviewNotes: notes });
        if (!res.ok) {
            setBusy(false);
            setPending(null);
            setActionError(res.error);
            return;
        }
        const message = ACTIONS[pending].done;
        await reload();
        setBusy(false);
        setPending(null);
        setNotes("");
        setDone(message);
        window.dispatchEvent(new Event(DPIA_CHANGED));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <Link to={base} className="text-sm font-semibold text-[#0F766E] hover:underline">&larr; All DPIAs</Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{record.title}</h1>
                    <DpiaStatusBadge status={record.status} />
                </div>
                <p className="mt-1 font-mono text-sm text-[#64748B]">{record.referenceId}</p>
            </div>

            <Alert tone="success">{done}</Alert>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                <AssessmentView title={record.title} details={decoded.structured ? decoded.details : null} legacyText={decoded.text} />

                <aside className="space-y-5 lg:sticky lg:top-24">
                    <section className={`${panel} px-5 py-4`}>
                        <h2 className="text-base font-semibold">Record</h2>
                        <dl className="mt-1 divide-y divide-[#E2E8F0]">
                            <Meta label="Created">{formatDate(record.createdAt)}</Meta>
                            <Meta label="Reviewed">{record.reviewedAt ? formatDate(record.reviewedAt) : "Not yet"}</Meta>
                            <Meta label="Next review due">{formatDay(record.nextReviewDate)}</Meta>
                        </dl>
                    </section>

                    {record.reviewNotes && (
                        <section className={`${panel} px-5 py-4`}>
                            <h2 className="text-base font-semibold">DPO's notes</h2>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#334155]">{record.reviewNotes}</p>
                        </section>
                    )}

                    {canRevise && (
                        <section className={`${panel} space-y-3 px-5 py-4`}>
                            <h2 className="text-base font-semibold">Changes requested</h2>
                            <p className="text-sm text-[#475569]">Revise the answers and submit a new version. This one stays on record.</p>
                            <Link to={`${base}/new?revise=${record.id}`} className={`${primaryBtn} w-full`}>Revise &amp; resubmit</Link>
                        </section>
                    )}

                    {canReview && (
                        <section className={`${panel} space-y-4 px-5 py-4`} aria-labelledby="dpia-review-title">
                            <div>
                                <h2 id="dpia-review-title" className="text-base font-semibold">Your decision</h2>
                                <p className="mt-1 text-sm text-[#475569]">The form is read-only. Approve it, or send it back with a note.</p>
                            </div>
                            {isMaker ? (
                                <Alert tone="info">You prepared this DPIA, so someone else must review it. This keeps the maker and the checker separate.</Alert>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-[#334155]">
                                        Review notes
                                        <textarea
                                            value={notes}
                                            onChange={(e) => { setNotes(e.target.value); setNotesError(""); }}
                                            rows={4}
                                            placeholder="e.g. Add more detail on how the risk is reduced."
                                            className={`${field} resize-y`}
                                            aria-invalid={!!notesError}
                                        />
                                        <span role="alert" className="mt-1 block text-xs text-[#DC2626]">{notesError}</span>
                                        <span className="mt-1 block text-xs text-[#64748B]">Required to request changes{REJECT_SUPPORTED ? " or reject" : ""}. Optional for approval.</span>
                                    </label>
                                    <Alert>{actionError}</Alert>
                                    <div className="grid gap-2.5">
                                        <button type="button" onClick={() => choose("Approve")} className="rounded-xl bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15803D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">✅ Approve</button>
                                        <button type="button" onClick={() => choose("SendBack")} className="rounded-xl bg-[#D97706] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B45309] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">📝 Request Changes</button>
                                        {REJECT_SUPPORTED && (
                                            <button type="button" onClick={() => choose("Reject")} className="rounded-xl bg-[#DC2626] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#B91C1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">❌ Reject</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {!canReview && !canRevise && (
                        <p className="px-1 text-xs text-[#64748B]">
                            {isPending ? "This DPIA is waiting for the Data Protection Officer's review." : "This DPIA is read-only."}
                        </p>
                    )}
                </aside>
            </div>

            {pending && (
                <Modal title={ACTIONS[pending].title} onClose={() => !busy && setPending(null)}>
                    <div className={`${panel} p-5 sm:p-6`}>
                        <h2 className="pr-8 text-lg font-semibold">{ACTIONS[pending].title}</h2>
                        <p className="mt-2 text-sm text-[#475569]">{ACTIONS[pending].text}</p>
                        {notes.trim() && <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[#F8FAFC] p-3 text-sm text-[#334155] ring-1 ring-[#E2E8F0]">{notes.trim()}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" className={ghostBtn} disabled={busy} onClick={() => setPending(null)}>Cancel</button>
                            <button type="button" disabled={busy} onClick={confirm} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:opacity-60 ${ACTIONS[pending].button}`}>
                                {busy ? "Saving..." : ACTIONS[pending].confirm}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
