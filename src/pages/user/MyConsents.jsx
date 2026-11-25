import { useCallback, useEffect, useMemo, useState } from "react";
import { getConsentHistory, getPurposes, recordConsent, withdrawConsent } from "../../api/consent.js";
import { getProfile, isDataPrincipal } from "../../auth/authStore.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import RowDetail, { RowLink } from "../../components/shared/RowDetail.jsx";
import { useRowDetail } from "../../components/shared/useRowDetail.js";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate, timeOf } from "../../utils/breach.js";
import { CONSENT_STATUS, PURPOSE_STATE, questionFor, STATUS_LABEL, allowedPurposes } from "../../utils/consent.js";

const PILL = {
    [PURPOSE_STATE.allowed]: "bg-ok/10 text-ok-ink ring-ok/25",
    [PURPOSE_STATE.denied]: "bg-bad/10 text-bad-ink ring-bad/25",
    [PURPOSE_STATE.withdrawn]: "bg-warn/10 text-warn-ink ring-warn/25",
    [PURPOSE_STATE.expired]: "bg-warn/10 text-warn-ink ring-warn/25",
    Required: "bg-brand-soft text-brand-ink ring-brand/25",
    "Not answered": "bg-subtle text-ink-3 ring-line-strong",
};

const HISTORY_PAGE = 10;

function Pill({ label }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${PILL[label] || PILL["Not answered"]}`}>{label}</span>;
}

function stateOf(purpose, entry) {
    if (purpose.mandatory) return "Required";
    return entry ? entry.state : "Not answered";
}

const goToChoices = () => document.getElementById("my-choices")?.scrollIntoView({ behavior: "smooth", block: "start" });

const changeText = (change) => {
    if (change.kind === "withdrawn") return "Withdrew all consent";
    if (change.kind === "first") return "First choices saved";
    if (change.on.length === 0 && change.off.length === 0) return "No change (saved again)";
    return [change.on.length ? `Allowed: ${change.on.join(", ")}` : "", change.off.length ? `Stopped: ${change.off.join(", ")}` : ""].filter(Boolean).join("\n");
};

function Summary({ allowed, blocked }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${panel} p-5`}>
                <p className="text-sm font-semibold text-ok-ink">You allowed ({allowed.length})</p>
                {allowed.length === 0 ? (
                    <p className="mt-1.5 text-sm text-ink-3">Nothing yet. Your details are not being used.</p>
                ) : (
                    <ul className="mt-2 flex flex-wrap gap-1.5">{allowed.map((p) => <li key={p.id} className="rounded-md bg-ok/10 px-2 py-1 text-xs font-medium text-ok-ink ring-1 ring-ok/25">{p.name}</li>)}</ul>
                )}
                <button type="button" onClick={goToChoices} className={`${ghostBtn} mt-4 px-3 py-1.5 text-xs`}>{allowed.length === 0 ? "Choose what to allow" : "Review my choices"}</button>
            </div>
            <div className={`${panel} p-5`}>
                <p className="text-sm font-semibold text-bad-ink">You did not allow ({blocked.length})</p>
                {blocked.length === 0 ? (
                    <p className="mt-1.5 text-sm text-ink-3">You have allowed everything.</p>
                ) : (
                    <ul className="mt-2 flex flex-wrap gap-1.5">{blocked.map((p) => <li key={p.id} className="rounded-md bg-bad/10 px-2 py-1 text-xs font-medium text-bad-ink ring-1 ring-bad/25">{p.name}</li>)}</ul>
                )}
                {blocked.length > 0 && <p className="mt-2 text-xs text-muted">These details are not used or shared.</p>}
                {blocked.length > 0 && <button type="button" onClick={goToChoices} className={`${ghostBtn} mt-4 px-3 py-1.5 text-xs`}>Allow again</button>}
            </div>
        </div>
    );
}

export default function MyConsents() {
    const principalId = getProfile()?.userId;
    const [purposes, setPurposes] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(!!principalId);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");
    const [confirmWithdraw, setConfirmWithdraw] = useState(false);
    const [shown, setShown] = useState(HISTORY_PAGE);
    const [historyQuery, setHistoryQuery] = useState("");
    const [detail, rowProps, closeDetail] = useRowDetail();

    const apply = useCallback(([hist, list]) => {
        if (hist.ok) {
            setHistory([...hist.data].sort((a, b) => b.version - a.version || timeOf(b.submittedAt) - timeOf(a.submittedAt)));
            setError("");
        } else {
            setError(hist.error);
        }
        if (list.ok) setPurposes(list.data);
        else setError((e) => e || list.error);
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await Promise.all([getConsentHistory(principalId), getPurposes()]));
    }, [apply, principalId]);

    useEffect(() => {
        if (!principalId) return undefined;
        let active = true;
        Promise.all([getConsentHistory(principalId), getPurposes()]).then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply, principalId]);

    const latest = history[0] || null;
    const entryOf = useMemo(() => {
        const ids = new Map((latest?.purposes ?? []).map((p) => [p.purposeId, p]));
        const names = new Map((latest?.purposes ?? []).map((p) => [p.name.trim().toLowerCase(), p]));
        return { get: (pid) => ids.get(pid) ?? names.get(String(purposes.find((x) => x.id === pid)?.name || "").trim().toLowerCase()) };
    }, [latest, purposes]);
    const withdrawn = latest?.status === CONSENT_STATUS.withdrawn;

    const rows = useMemo(() => history.map((c, i) => {
        const prev = history[i + 1];
        if (c.status === CONSENT_STATUS.withdrawn && prev) return { c, change: { kind: "withdrawn" } };
        if (!prev) return { c, change: { kind: "first" } };
        const k = (n) => n.trim().toLowerCase();
        const was = new Set(prev.status === CONSENT_STATUS.withdrawn ? [] : allowedPurposes(prev).map((p) => k(p.name)));
        const now = new Set(allowedPurposes(c).map((p) => k(p.name)));
        const names = new Map([...prev.purposes, ...c.purposes].map((p) => [k(p.name), p.name]));
        return {
            c,
            change: {
                kind: "diff",
                on: [...now].filter((n) => !was.has(n)).map((n) => names.get(n)),
                off: [...was].filter((n) => !now.has(n)).map((n) => names.get(n)),
            },
        };
    }), [history]);

    const filteredRows = useMemo(() => {
        const q = historyQuery.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(({ c, change }) => {
            const hay = [`v${c.version}`, STATUS_LABEL[c.status] || c.status, changeText(change), allowedPurposes(c).map((p) => p.name).join(" "), formatDate(c.submittedAt)].join(" ").toLowerCase();
            return hay.includes(q);
        });
    }, [rows, historyQuery]);

    const allowed = purposes.filter((p) => p.mandatory || entryOf.get(p.id)?.allowed);
    const blocked = purposes.filter((p) => !p.mandatory && latest && !entryOf.get(p.id)?.allowed);

    const setOne = async (purpose, allow) => {
        setBusyId(purpose.id);
        setNotice("");
        setError("");
        const decisions = purposes.map((p) => ({
            purposeId: p.id,
            allow: p.mandatory ? true : p.id === purpose.id ? allow : !!entryOf.get(p.id)?.allowed,
        }));
        const res = await recordConsent({ dataPrincipalId: principalId, decisions, language: latest?.language || "en-IN" });
        setBusyId("");
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setNotice(allow ? `You allowed "${purpose.name}".` : `You stopped allowing "${purpose.name}". It will not be used.`);
        load();
    };

    const withdrawAll = async () => {
        setBusyId("all");
        setNotice("");
        setError("");
        const res = await withdrawConsent(latest.id);
        setBusyId("");
        setConfirmWithdraw(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setNotice("You withdrew all your consent. None of your details will be used.");
        load();
    };

    if (!principalId) {
        return <Alert>We could not identify your account. Please sign out and sign in again.</Alert>;
    }

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">My consents</h1>
                    <p className="mt-1 text-sm text-ink-3">See which of your details your organisation may use and which you did not allow. You can change any choice whenever you want. Every change is saved with its date.</p>
                </div>
                <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {!isDataPrincipal(getProfile()) && (
                <Alert tone="info">This page is for customer accounts. You are signed in with a staff account, so your choices may not be saved.</Alert>
            )}
            {notice && <Alert tone="success">{notice}</Alert>}
            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}
            {withdrawn && <Alert tone="info">You have withdrawn your consent. Nothing is being used. You can allow individual items again below.</Alert>}

            {!loading && latest && <Summary allowed={withdrawn ? [] : allowed} blocked={withdrawn ? purposes.filter((p) => !p.mandatory) : blocked} />}

            <section id="my-choices" aria-label="Purposes" className="scroll-mt-24 space-y-3">
                <h2 className="text-lg font-semibold">Your choices</h2>
                <p className="mt-0.5 text-xs text-muted">Turn each purpose on or off. Changes are saved straight away.</p>
                {loading ? (
                    <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-20 pg-shimmer rounded-2xl" />)}</div>
                ) : purposes.length === 0 && error ? (
                    <div className={`${panel} px-5 py-12 text-center`}>
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-bad-soft text-bad-ink"><Icon name="alert" className="h-6 w-6" /></span>
                        <p className="mt-3 font-semibold">Your choices could not be loaded</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">See the message above. Once it is fixed, press Refresh.</p>
                    </div>
                ) : purposes.length === 0 ? (
                    <div className={`${panel} px-5 py-12 text-center`}>
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink"><Icon name="consent" className="h-6 w-6" /></span>
                        <p className="mt-3 font-semibold">Nothing to consent to yet</p>
                        <p className="mt-1 text-sm text-ink-3">Your organisation has not asked for any permissions yet. When it does, they will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {purposes.map((p) => {
                            const entry = entryOf.get(p.id);
                            const label = withdrawn && !p.mandatory ? PURPOSE_STATE.withdrawn : stateOf(p, entry);
                            const isOn = !withdrawn && (p.mandatory || !!entry?.allowed);
                            return (
                                <li key={p.id} className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <p className="font-semibold text-ink">{questionFor(p)}</p>
                                            <Pill label={label} />
                                        </div>
                                        {p.mandatory && <p className="mt-1 text-xs text-muted">Needed to run your account, so this is always on.</p>}
                                    </div>
                                    {!p.mandatory && (
                                        isOn ? (
                                            <button type="button" onClick={() => setOne(p, false)} disabled={!!busyId} className={`${ghostBtn} px-3 py-1.5 text-bad-ink`}>{busyId === p.id ? "Saving..." : "Stop allowing"}</button>
                                        ) : (
                                            <button type="button" onClick={() => setOne(p, true)} disabled={!!busyId} className={primaryBtn}>{busyId === p.id ? "Saving..." : "Allow"}</button>
                                        )
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {!loading && latest && !withdrawn && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        {confirmWithdraw ? (
                            <>
                                <span className="text-sm text-ink-2">Withdraw all your consent?</span>
                                <button type="button" onClick={withdrawAll} disabled={!!busyId} className="text-sm font-semibold text-bad-ink hover:underline disabled:opacity-60">{busyId === "all" ? "Withdrawing..." : "Yes, withdraw all"}</button>
                                <button type="button" onClick={() => setConfirmWithdraw(false)} disabled={!!busyId} className="text-sm font-semibold text-ink-3 hover:underline">Cancel</button>
                            </>
                        ) : (
                            <button type="button" onClick={() => setConfirmWithdraw(true)} className={`${ghostBtn} text-bad-ink`}>Withdraw all consent</button>
                        )}
                    </div>
                )}
            </section>

            {!loading && history.length > 0 && (
                <section aria-label="Consent history" className="space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold">My consent history</h2>
                            <p className="mt-0.5 text-xs text-muted">Every time you allow, stop or withdraw something, a new version is saved. Each row shows what changed in that version.</p>
                        </div>
                        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                <input
                                    type="search"
                                    value={historyQuery}
                                    onChange={(e) => { setHistoryQuery(e.target.value); setShown(HISTORY_PAGE); }}
                                    placeholder="Search history"
                                    aria-label="Search consent history"
                                    className={`${field} !mt-0 pl-9`}
                                />
                            </div>
                            <p className="whitespace-nowrap text-xs text-muted">{historyQuery.trim() ? `${filteredRows.length} of ${history.length}` : history.length} version{history.length === 1 ? "" : "s"}</p>
                        </div>
                    </div>
                    <div className={`${panel} overflow-x-auto`}>
                        <table className="w-full min-w-[760px] text-sm">
                            <thead className="border-b border-line bg-soft">
                                <tr>
                                    {["Version", "What changed", "Allowed after this change", "Recorded"].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredRows.length === 0 && (
                                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-ink-3">No history matches your search.</td></tr>
                                )}
                                {filteredRows.slice(0, shown).map(({ c, change }) => (
                                    <tr key={c.id} {...rowProps(() => ({ title: `Version ${c.version}`, subtitle: STATUS_LABEL[c.status] || c.status, items: [{ label: "Version", value: `v${c.version}` }, { label: "Status", value: STATUS_LABEL[c.status] || c.status }, { label: "What changed", value: changeText(change) }, { label: "Allowed after this change", value: c.status === CONSENT_STATUS.withdrawn ? "Nothing" : allowedPurposes(c).map((p) => p.name).join(", ") || "Nothing" }, { label: "Recorded", value: formatDate(c.submittedAt) }] }))} className="cursor-pointer align-top hover:bg-soft">
                                        <td className="px-5 py-3.5">
                                            <p><RowLink>v{c.version}</RowLink></p>
                                            <p className="mt-0.5 text-xs text-muted">{STATUS_LABEL[c.status] || c.status}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {change.kind === "withdrawn" ? (
                                                <span className="font-medium text-warn-ink">Withdrew all consent</span>
                                            ) : change.kind === "first" ? (
                                                <span className="font-medium text-ink-2">First choices saved</span>
                                            ) : change.on.length === 0 && change.off.length === 0 ? (
                                                <span className="text-ink-3">No change (saved again)</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {change.on.length > 0 && <p className="text-ok-ink"><span className="font-semibold">Allowed:</span> {change.on.join(", ")}</p>}
                                                    {change.off.length > 0 && <p className="text-bad-ink"><span className="font-semibold">Stopped:</span> {change.off.join(", ")}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-ink-2">
                                            {c.status === CONSENT_STATUS.withdrawn ? <span className="text-muted">Nothing</span> : (
                                                <div className="flex flex-wrap gap-1">
                                                    {allowedPurposes(c).length === 0 ? <span className="text-muted">Nothing</span> : allowedPurposes(c).map((p) => (
                                                        <span key={p.id} className="rounded-md bg-ok/10 px-1.5 py-0.5 text-xs font-medium text-ok-ink ring-1 ring-ok/25">{p.name}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-ink-2">{formatDate(c.submittedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredRows.length > HISTORY_PAGE && (
                        <div className="flex flex-wrap items-center gap-3">
                            {shown < filteredRows.length && (
                                <button type="button" onClick={() => setShown((n) => n + HISTORY_PAGE)} className={ghostBtn}>
                                    Show {Math.min(HISTORY_PAGE, filteredRows.length - shown)} more
                                </button>
                            )}
                            {shown > HISTORY_PAGE && (
                                <button type="button" onClick={() => setShown(HISTORY_PAGE)} className="text-sm font-semibold text-ink-3 hover:underline">Show less</button>
                            )}
                            <span className="text-xs text-muted">Showing {Math.min(shown, filteredRows.length)} of {filteredRows.length}</span>
                        </div>
                    )}
                </section>
            )}
            <RowDetail row={detail} onClose={closeDetail} />
        </div>
    );
}
