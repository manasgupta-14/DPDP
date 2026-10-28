import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsentHistory, submitConsent } from "../../api/consent.js";
import { getDataInventory } from "../../api/dataInventory.js";
import { getProfile } from "../../auth/authStore.js";
import Alert from "../shared/Alert.jsx";
import Modal from "../shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../shared/ui.js";
import { NOTICE_TEXT, NOTICE_VERSION } from "../../config/consentNotice.js";
import { CONSENT_STATUS } from "../../utils/consent.js";

function Choice({ active, tone, onClick, children }) {
    const on = tone === "allow" ? "border-[#0F766E] bg-[#0F766E] text-white" : "border-[#B91C1C] bg-[#B91C1C] text-white";
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${active ? on : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#94A3B8]"}`}
        >
            {children}
        </button>
    );
}

export default function ConsentGate() {
    const userId = getProfile()?.userId;
    const [pending, setPending] = useState([]);
    const [open, setOpen] = useState(false);
    const [lang, setLang] = useState("en");
    const [choices, setChoices] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const t = NOTICE_TEXT[lang];

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;
        Promise.all([getConsentHistory(userId), getDataInventory()]).then(([hist, inv]) => {
            if (!active || !hist.ok || !inv.ok) return;
            const answered = new Set(hist.data.map((c) => c.inventoryId));
            const items = inv.data.filter((i) => !answered.has(String(i.id)));
            if (items.length) {
                setPending(items);
                setOpen(true);
            }
        });
        return () => {
            active = false;
        };
    }, [userId]);

    if (!open || pending.length === 0) return null;

    const choose = (id, value) => {
        setError("");
        setChoices((c) => ({ ...c, [id]: value }));
    };

    const save = async () => {
        const decided = pending.filter((i) => choices[i.id]);
        if (!decided.length) {
            setError(t.pickOne);
            return;
        }
        setBusy(true);
        setError("");
        const res = await submitConsent({
            dataPrincipalId: userId,
            preferences: decided.map((item) => ({
                dataInventoryId: item.id,
                status: choices[item.id] === "allow" ? CONSENT_STATUS.granted : CONSENT_STATUS.denied,
            })),
        });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        const done = new Set(decided.map((i) => i.id));
        setPending((p) => p.filter((i) => !done.has(i.id)));
        setChoices({});
        setOpen(false);
    };

    return (
        <Modal title={t.title} onClose={() => !busy && setOpen(false)}>
            <div className={`${panel} space-y-5 p-5 sm:p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
                    <div>
                        <h2 className="text-xl font-semibold">{t.title}</h2>
                        <p className="mt-0.5 text-xs text-[#64748B]">{t.version(NOTICE_VERSION)}</p>
                    </div>
                    <div className="flex gap-1.5" role="group" aria-label="Language">
                        {Object.entries(NOTICE_TEXT).map(([code, v]) => (
                            <button
                                key={code}
                                type="button"
                                aria-pressed={lang === code}
                                onClick={() => setLang(code)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] ${lang === code ? "bg-[#CCFBF1] text-[#0F766E]" : "text-[#475569] hover:bg-[#F1F5F9]"}`}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-sm text-[#334155]">{t.intro}</p>

                <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">{t.purposes}</h3>
                    <ul className="mt-2 space-y-3">
                        {pending.map((item) => (
                            <li key={item.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                                <p className="font-semibold text-[#0F172A]">{item.name}</p>
                                {item.category && <p className="text-xs text-[#64748B]">{item.category}</p>}
                                {item.purpose && <p className="mt-1.5 break-words text-sm text-[#334155]">{item.purpose}</p>}
                                {item.retentionDays && <p className="mt-1.5 text-xs text-[#64748B]">{t.retention(item.retentionDays)}</p>}
                                <div className="mt-3 flex gap-2" role="group" aria-label={item.name}>
                                    <Choice tone="allow" active={choices[item.id] === "allow"} onClick={() => choose(item.id, "allow")}>{t.allow}</Choice>
                                    <Choice tone="deny" active={choices[item.id] === "deny"} onClick={() => choose(item.id, "deny")}>{t.deny}</Choice>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-2 text-xs text-[#475569]">
                    <p>{t.how}</p>
                    <p>{t.rights}</p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-[#0F766E]">
                        <Link to="/user/consent" onClick={() => setOpen(false)} className="hover:underline">{t.links.consents}</Link>
                        <Link to="/user/privacy" onClick={() => setOpen(false)} className="hover:underline">{t.links.privacy}</Link>
                    </p>
                </div>

                <Alert>{error}</Alert>

                <div className="flex gap-2.5">
                    <button type="button" onClick={save} disabled={busy} className={`${primaryBtn} flex-1`}>{busy ? t.saving : t.save}</button>
                    <button type="button" onClick={() => setOpen(false)} disabled={busy} className={ghostBtn}>{t.later}</button>
                </div>
            </div>
        </Modal>
    );
}
