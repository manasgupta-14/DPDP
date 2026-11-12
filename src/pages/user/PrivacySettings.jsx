import { useCallback, useEffect, useState } from "react";
import { getMyPrivacyRequests, raisePrivacyRequest } from "../../api/privacyRequest.js";
import { getProfile, isDataPrincipal } from "../../auth/authStore.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { REQUEST_TYPES, dateText, dateTimeText, dueInfo, isClosed, typeLabel } from "../../utils/privacyRequest.js";

const MIN_DETAILS = 10;

function RaiseForm({ principalId, onSubmitted }) {
    const [type, setType] = useState(REQUEST_TYPES[0].value);
    const [details, setDetails] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const hint = REQUEST_TYPES.find((t) => t.value === type)?.hint;

    const submit = async (e) => {
        e.preventDefault();
        if (details.trim().length < MIN_DETAILS) {
            setError(`Please describe your request in at least ${MIN_DETAILS} characters.`);
            return;
        }
        setBusy(true);
        setError("");
        const res = await raisePrivacyRequest({ dataPrincipalId: principalId, requestType: type, requestDetails: details });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setDetails("");
        onSubmitted(res.data?.requestId);
    };

    return (
        <form onSubmit={submit} className={`${panel} space-y-5 p-5 sm:p-6`} noValidate>
            <div>
                <h2 className="text-lg font-semibold">Raise a privacy request</h2>
                <p className="mt-1 text-sm text-[#475569]">Your organisation has 30 days to respond. You can follow the status under History.</p>
            </div>
            <Alert>{error}</Alert>
            <label className="block text-sm font-medium text-[#0F172A]">
                Request type
                <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
                    {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="mt-1.5 block text-xs font-normal text-[#64748B]">{hint}</span>
            </label>
            <label className="block text-sm font-medium text-[#0F172A]">
                Details
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={6} placeholder="Tell us what you need, for example which data or which record this is about." className={field} />
            </label>
            <button type="submit" disabled={busy} className={primaryBtn}>{busy ? "Submitting..." : "Submit request"}</button>
        </form>
    );
}

function HistoryItem({ r }) {
    const due = dueInfo(r);
    return (
        <li className={`${panel} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#0F172A]">{typeLabel(r.type)}{r.referenceId && <span className="ml-2 font-mono text-xs font-normal text-[#64748B]">{r.referenceId}</span>}</p>
                <StatusBadge status={r.status} />
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#334155]">{r.details}</p>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#64748B]">
                <div className="flex gap-1.5"><dt>Raised</dt><dd className="font-medium text-[#334155]">{dateTimeText(r.created)}</dd></div>
                <div className="flex gap-1.5"><dt>Respond by</dt><dd className="font-medium text-[#334155]">{dateText(r.target)}</dd></div>
                {due && <div className={`font-semibold ${due.overdue ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>{due.text}</div>}
                {isClosed(r.status) && r.resolved && <div className="flex gap-1.5"><dt>Closed</dt><dd className="font-medium text-[#334155]">{dateTimeText(r.resolved)}</dd></div>}
            </dl>
            {r.remarks && (
                <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
                    <p className="text-xs font-semibold text-[#475569]">Response from your organisation</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[#0F172A]">{r.remarks}</p>
                </div>
            )}
        </li>
    );
}

export default function PrivacySettings() {
    const principalId = getProfile()?.userId;
    const [view, setView] = useState("raise");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(!!principalId);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const apply = (res) => {
        if (res.ok) {
            setItems([...res.data].sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0)));
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await getMyPrivacyRequests(principalId));
    }, [principalId]);

    useEffect(() => {
        if (!principalId) return undefined;
        let active = true;
        getMyPrivacyRequests(principalId).then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [principalId]);

    const submitted = () => {
        setNotice("Request submitted. You can follow its status under History.");
        setView("history");
        load();
    };

    const tab = (id, label, count) => (
        <button
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => { setView(id); if (id === "raise") setNotice(""); }}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${view === id ? "bg-[#0F766E] text-white shadow" : "border border-[#E2E8F0] bg-white text-[#334155] hover:border-[#0F766E] hover:text-[#0F766E]"}`}
        >
            {label}
            {count > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] ${view === id ? "bg-white/20" : "bg-[#F1F5F9]"}`}>{count}</span>}
        </button>
    );

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F766E]">Help center</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Privacy settings</h1>
                <p className="mt-1 text-sm text-[#475569]">Use your rights under the DPDP Act: ask to access, correct, update, erase or export your data.</p>
            </div>

            {!isDataPrincipal(getProfile()) && (
                <Alert tone="info">This page is meant for customer (data principal) logins. You are signed in with a staff account, so privacy requests may not be saved. Sign in as a customer to test it.</Alert>
            )}
            {!principalId && <Alert>Your session has no user ID, so requests cannot be linked to you. Please sign in again.</Alert>}

            <div role="tablist" aria-label="Privacy settings" className="flex flex-wrap gap-3">
                {tab("raise", "Raise a request", 0)}
                {tab("history", "History", items.length)}
            </div>

            {view === "raise" && principalId && (
                <div className="max-w-2xl"><RaiseForm principalId={principalId} onSubmitted={submitted} /></div>
            )}

            {view === "history" && (
                <section aria-label="Request history" className="max-w-3xl space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-[#475569]">{items.length} request{items.length === 1 ? "" : "s"}, newest first</p>
                        <button type="button" onClick={load} disabled={refreshing || !principalId} className={`${ghostBtn} px-3 py-1.5`}>
                            <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                    {notice && <Alert tone="success">{notice}</Alert>}
                    {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}
                    {loading ? (
                        <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-28 pg-shimmer rounded-2xl" />)}</div>
                    ) : items.length === 0 && !error ? (
                        <div className={`${panel} px-5 py-12 text-center`}>
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="rights" className="h-6 w-6" /></span>
                            <p className="mt-3 font-semibold">No requests yet</p>
                            <p className="mt-1 text-sm text-[#475569]">Requests you raise will show up here with their status.</p>
                            <button type="button" onClick={() => setView("raise")} className={`${primaryBtn} mt-4`}>Raise a request</button>
                        </div>
                    ) : (
                        <ul className="space-y-3">{items.map((r) => <HistoryItem key={r.id} r={r} />)}</ul>
                    )}
                </section>
            )}
        </div>
    );
}
