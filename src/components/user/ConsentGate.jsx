import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getMyConsent, getPurposes, recordConsent } from "../../api/consent.js";
import { getProfile } from "../../auth/authStore.js";
import Alert from "../shared/Alert.jsx";
import Modal from "../shared/Modal.jsx";
import { ghostBtn, panel, primaryBtn } from "../shared/ui.js";
import { NOTICE_LOCALE, NOTICE_TEXT, NOTICE_VERSION } from "../../config/consentNotice.js";
import { CONSENT_STATUS, questionFor } from "../../utils/consent.js";

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

const norm = (s) => String(s || "").trim().toLowerCase();

// Purpose tab "answered" mana jayega jab pichle consent record me uski id ya uska naam mil jaye.
const answeredIn = (latest) => {
    const list = latest?.purposes ?? [];
    return { ids: new Set(list.map((p) => p.purposeId)), names: new Set(list.map((p) => norm(p.name))) };
};
const isAnswered = (purpose, sets) => sets.ids.has(purpose.id) || sets.names.has(norm(purpose.name));

// Login ke baad: agar user ne abhi tak consent nahi diya (ya naya purpose add hua hai) toh yeh popup aata hai.
// User har purpose par Allow / Don't allow chunta hai. Allow = data use ho sakta hai, Don't allow = nahi.
export default function ConsentGate() {
    const userId = getProfile()?.userId;
    const [purposes, setPurposes] = useState([]); // sabhi purposes
    const [previous, setPrevious] = useState(null); // user ka pichla consent (agar hai)
    const [open, setOpen] = useState(false);
    const [lang, setLang] = useState("en");
    const [choices, setChoices] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const saving = useRef(false); // double click par dobara save na ho
    const t = NOTICE_TEXT[lang];

    useEffect(() => {
        if (!userId) return undefined;
        let active = true;
        getPurposes().then(async (list) => {
            if (!list.ok || list.data.length === 0) return;
            const mine = await getMyConsent(userId, list.data);
            if (!active || !mine.ok) return;
            const latest = mine.data;
            // User ne pehle consent wapas le liya hai: dobara pareshan nahi karna, My Consents se wo khud de sakta hai.
            if (latest && latest.status === CONSENT_STATUS.withdrawn) return;
            const answered = answeredIn(latest);
            const pending = list.data.filter((p) => !isAnswered(p, answered));
            if (pending.length === 0) return;
            setPurposes(list.data);
            setPrevious(latest);
            setOpen(true);
        });
        return () => {
            active = false;
        };
    }, [userId]);

    if (!open || purposes.length === 0) return null;

    const answered = answeredIn(previous);
    const pending = purposes.filter((p) => !isAnswered(p, answered));
    const needAnswer = pending.filter((p) => !p.mandatory);

    const choose = (id, value) => {
        setError("");
        setChoices((c) => ({ ...c, [id]: value }));
    };

    const save = async () => {
        if (saving.current) return;
        if (needAnswer.some((p) => !choices[p.id])) {
            setError(t.pickOne);
            return;
        }
        // Naya record sab purposes ka hota hai: purane faisle jaise the waise, naye purposes par abhi ka choice.
        const beforeOf = (p) => (previous?.purposes ?? []).find((x) => x.purposeId === p.id || norm(x.name) === norm(p.name))?.allowed;
        const decisions = purposes.map((p) => ({
            purposeId: p.id,
            allow: p.mandatory ? true : isAnswered(p, answered) ? !!beforeOf(p) : choices[p.id] === "allow",
        }));

        saving.current = true;
        setBusy(true);
        setError("");
        const res = await recordConsent({ dataPrincipalId: userId, decisions, language: NOTICE_LOCALE[lang] });
        saving.current = false;
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setChoices({});
        setOpen(false);
    };

    return (
        <Modal title={t.title} onClose={() => !busy && setOpen(false)}>
            <div className={`${panel} max-h-[88vh] space-y-5 overflow-y-auto p-5 sm:p-6`}>
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
                                <p className="font-semibold text-[#0F172A]">{questionFor(item, lang)}</p>
                                {item.description && <p className="mt-1 text-xs leading-5 text-[#475569]">{item.description}</p>}
                                {(item.categories.length > 0 || item.processors.length > 0 || item.retention) && (
                                    <dl className="mt-2 space-y-0.5 text-xs text-[#475569]">
                                        {item.categories.length > 0 && <div><dt className="inline font-semibold text-[#334155]">{t.dataUsed}: </dt><dd className="inline">{item.categories.map((c) => c.name).join(", ")}</dd></div>}
                                        {item.retention && <div><dt className="inline font-semibold text-[#334155]">{t.keptFor}: </dt><dd className="inline">{item.retention}</dd></div>}
                                        {item.processors.length > 0 && <div><dt className="inline font-semibold text-[#334155]">{t.sharedWith}: </dt><dd className="inline">{item.processors.map((p) => p.name).join(", ")}</dd></div>}
                                    </dl>
                                )}
                                {item.mandatory ? (
                                    <p className="mt-1.5 text-xs text-[#64748B]">
                                        <span className="mr-2 inline-flex rounded-full bg-[#CCFBF1] px-2 py-0.5 text-[11px] font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/25">{t.required}</span>
                                        {t.requiredNote}
                                    </p>
                                ) : (
                                    <div className="mt-3 flex gap-2" role="group" aria-label={item.name}>
                                        <Choice tone="allow" active={choices[item.id] === "allow"} onClick={() => choose(item.id, "allow")}>{t.allow}</Choice>
                                        <Choice tone="deny" active={choices[item.id] === "deny"} onClick={() => choose(item.id, "deny")}>{t.deny}</Choice>
                                    </div>
                                )}
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
