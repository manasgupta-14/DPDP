import { useCallback, useEffect, useMemo, useState } from "react";
import { getConsentHistory, grantConsent, withdrawConsent } from "../../api/consent.js";
import { getDataInventory } from "../../api/dataInventory.js";
import { getProfile } from "../../auth/authStore.js";
import Alert from "../../components/shared/Alert.jsx";
import Icon from "../../components/shared/Icon.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate, timeOf } from "../../utils/breach.js";
import { NOTICE_VERSION } from "../../config/consentNotice.js";
import { CONSENT_TONE, isGranted, shortId } from "../../utils/consent.js";

function Pill({ status }) {
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${CONSENT_TONE[status]}`}>{status}</span>;
}

function GrantDialog({ item, principalId, onClose, onDone }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const agree = async () => {
        setBusy(true);
        setError("");
        const res = await grantConsent({ dataPrincipalId: principalId, dataInventoryId: item.id });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        onDone(`You gave consent for "${item.name}".`);
        onClose();
    };

    return (
        <div className={`${panel} space-y-4 p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Give consent</h2>
            <Alert>{error}</Alert>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="font-semibold text-[#0F172A]">{item.name}</p>
                {item.category && <p className="text-xs text-[#64748B]">{item.category}</p>}
                {item.purpose && <p className="mt-2 text-sm text-[#334155]">{item.purpose}</p>}
                {item.retentionDays && <p className="mt-2 text-xs text-[#64748B]">Kept for {item.retentionDays} days.</p>}
            </div>
            <p className="text-sm text-[#475569]">By continuing you agree that your organisation may process this data for the purpose above, under privacy notice v{NOTICE_VERSION}. You can withdraw this consent any time.</p>
            <div className="flex gap-2.5">
                <button type="button" onClick={agree} disabled={busy} className={`${primaryBtn} flex-1`}>{busy ? "Saving..." : "I agree"}</button>
                <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
            </div>
        </div>
    );
}

function WithdrawButton({ record, onDone, name }) {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const run = async () => {
        setBusy(true);
        setError("");
        const res = await withdrawConsent({ recordId: record.recordId, inventoryId: record.inventoryId });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            setConfirming(false);
            return;
        }
        onDone(`You withdrew consent for "${name}".`);
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <button type="button" onClick={run} disabled={busy} className="font-semibold text-[#B91C1C] hover:underline disabled:opacity-60">{busy ? "Withdrawing..." : "Yes, withdraw"}</button>
                <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="font-semibold text-[#475569] hover:underline">Cancel</button>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-end gap-1">
            <button type="button" onClick={() => { setError(""); setConfirming(true); }} className={`${ghostBtn} px-3 py-1.5 text-[#B91C1C]`}>Withdraw</button>
            {error && <span role="alert" className="max-w-[200px] text-right text-xs text-[#DC2626]">{error}</span>}
        </div>
    );
}

export default function MyConsents() {
    const principalId = getProfile()?.userId;
    const [history, setHistory] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(!!principalId);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [inventoryError, setInventoryError] = useState("");
    const [notice, setNotice] = useState("");
    const [granting, setGranting] = useState(null);

    const apply = useCallback(([hist, inv]) => {
        if (hist.ok) {
            setHistory([...hist.data].sort((a, b) => timeOf(b.submittedAt) - timeOf(a.submittedAt)));
            setError("");
        } else {
            setError(hist.error);
        }
        if (inv.ok) {
            setInventory(inv.data);
            setInventoryError("");
        } else {
            setInventoryError(inv.error);
        }
        setLoading(false);
        setRefreshing(false);
    }, []);

    const load = useCallback(async () => {
        setRefreshing(true);
        apply(await Promise.all([getConsentHistory(principalId), getDataInventory()]));
    }, [apply, principalId]);

    useEffect(() => {
        if (!principalId) return undefined;
        let active = true;
        Promise.all([getConsentHistory(principalId), getDataInventory()]).then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, [apply, principalId]);

    const nameOf = useMemo(() => new Map(inventory.map((i) => [String(i.id), i])), [inventory]);

    const latestByData = useMemo(() => {
        const map = new Map();
        history.forEach((c) => {
            if (!map.has(c.inventoryId)) map.set(c.inventoryId, c);
        });
        return map;
    }, [history]);

    const saved = (message) => {
        setNotice(message);
        load();
    };

    if (!principalId) {
        return <Alert>We could not identify your account. Please sign out and sign in again.</Alert>;
    }

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My consents</h1>
                    <p className="mt-1 text-sm text-[#475569]">See what personal data your organisation processes, give your consent, or withdraw it whenever you want. Withdrawing is one click and takes effect straight away.</p>
                </div>
                <button type="button" onClick={load} disabled={loading || refreshing} className={ghostBtn}>
                    <Icon name="refresh" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {notice && <Alert tone="success">{notice}</Alert>}
            {error && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{error}</Alert>}
            {inventoryError && <Alert action={<button type="button" onClick={load} className="shrink-0 font-semibold underline">Retry</button>}>{`Could not load the list of data points. ${inventoryError}`}</Alert>}

            <section aria-label="Data points" className="space-y-3">
                <h2 className="text-lg font-semibold">Data your organisation processes</h2>
                {loading ? (
                    <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E2E8F0]/70" />)}</div>
                ) : inventory.length === 0 ? (
                    <div className={`${panel} px-5 py-12 text-center`}>
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#CCFBF1] text-[#0F766E]"><Icon name="consent" className="h-6 w-6" /></span>
                        <p className="mt-3 font-semibold">Nothing to consent to yet</p>
                        <p className="mt-1 text-sm text-[#475569]">When your organisation adds data points, they will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {inventory.map((item) => {
                            const latest = latestByData.get(String(item.id));
                            const active = latest && isGranted(latest);
                            return (
                                <li key={item.id} className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <p className="font-semibold text-[#0F172A]">{item.name}</p>
                                            {latest ? <Pill status={latest.status} /> : <span className="inline-flex rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#475569] ring-1 ring-[#CBD5E1]">Not given</span>}
                                        </div>
                                        {item.category && <p className="text-xs text-[#64748B]">{item.category}</p>}
                                        {item.purpose && <p className="mt-1.5 break-words text-sm text-[#334155]">{item.purpose}</p>}
                                    </div>
                                    {active ? (
                                        <WithdrawButton record={latest} name={item.name} onDone={saved} />
                                    ) : (
                                        <button type="button" onClick={() => { setNotice(""); setGranting(item); }} className={primaryBtn}>{latest ? "Give consent again" : "Give consent"}</button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {!loading && history.length > 0 && (
                <section aria-label="Consent history" className="space-y-3">
                    <h2 className="text-lg font-semibold">My consent history</h2>
                    <div className={`${panel} overflow-x-auto`}>
                        <table className="w-full min-w-[640px] text-sm">
                            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                                <tr>
                                    {["Data point", "Status", "Notice", "Recorded", "Withdrawn"].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {history.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-5 py-3.5 font-medium text-[#0F172A]">{nameOf.get(c.inventoryId)?.name || `Data point ${shortId(c.inventoryId)}`}</td>
                                        <td className="px-5 py-3.5"><Pill status={c.status} /></td>
                                        <td className="px-5 py-3.5 text-[#334155]">v{c.noticeVersion}</td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-[#334155]">{formatDate(c.submittedAt)}</td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-[#334155]">{formatDate(c.withdrawnAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {granting && (
                <Modal title="Give consent" onClose={() => setGranting(null)}>
                    <GrantDialog item={granting} principalId={principalId} onClose={() => setGranting(null)} onDone={saved} />
                </Modal>
            )}
        </div>
    );
}
