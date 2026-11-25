import { useMemo, useState } from "react";
import { addPurpose } from "../../../api/consent.js";
import Modal from "../../shared/Modal.jsx";
import { dkBtn, dkInput } from "./styles.js";

const PRESETS = [
    { key: "name", code: "NAME", name: "Use of my name", question: "Can we use your name?" },
    { key: "email", code: "EMAIL", name: "Use of my email address", question: "Can we use your email address?" },
    { key: "phone", code: "PHONE", name: "Use of my phone number", question: "Can we use your phone number?" },
];

const norm = (v) => String(v || "").trim().toLowerCase();
const toCode = (v) => String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
let customId = 0;

export default function CreateConsentModal({ existing, onClose, onCreated }) {
    const isTaken = (name, code) => existing.some((p) => norm(p.name) === norm(name) || (code && norm(p.code) === norm(code)));
    const [picked, setPicked] = useState(() => Object.fromEntries(PRESETS.map((p) => [p.key, !isTaken(p.name, p.code)])));
    const [customs, setCustoms] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const items = useMemo(() => {
        const base = PRESETS.filter((p) => picked[p.key] && !isTaken(p.name, p.code)).map((p) => ({ id: p.key, name: p.name, code: p.code, question: p.question }));
        const extra = customs.filter((c) => c.name.trim()).map((c) => ({ id: c.id, name: c.name.trim(), code: toCode(c.name), question: `Can we use: ${c.name.trim()}?` }));
        return [...base, ...extra];
    }, [picked, customs, existing]);

    const submit = async () => {
        setError("");
        if (items.length === 0) {
            setError("Select at least one detail.");
            return;
        }
        const seen = new Set();
        for (const it of items) {
            if (isTaken(it.name, it.code) || seen.has(norm(it.name))) {
                setError(`"${it.name}" already exists.`);
                return;
            }
            seen.add(norm(it.name));
        }
        setBusy(true);
        const failed = [];
        let saved = 0;
        for (const it of items) {
            const res = await addPurpose({ code: it.code, shortName: it.name, isMandatory: false });
            if (res.ok) saved += 1;
            else failed.push(`${it.name}: ${res.error}`);
        }
        setBusy(false);
        if (saved > 0) onCreated?.(saved);
        if (failed.length) {
            setError(`${saved} saved, ${failed.length} failed. ${failed.join(" | ")}`);
            return;
        }
        onClose();
    };

    return (
        <Modal title="Create consent" onClose={() => !busy && onClose()}>
            <div className="max-h-[88vh] space-y-5 overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-xl sm:p-6">
                <div className="pr-8">
                    <h2 className="text-lg font-semibold">Create consent</h2>
                    <p className="mt-1 text-sm text-ink-3">Select the details you need permission for. The user will be asked about each one separately and will choose Allow or Don't allow.</p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold">Ask the user for permission to use</h3>
                    <ul className="mt-2 space-y-2">
                        {PRESETS.map((p) => {
                            const taken = isTaken(p.name, p.code);
                            return (
                                <li key={p.key}>
                                    <label className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${taken ? "border-line bg-soft text-muted" : "cursor-pointer border-line hover:border-brand"}`}>
                                        <input type="checkbox" disabled={taken || busy} checked={taken ? true : !!picked[p.key]} onChange={(e) => setPicked((s) => ({ ...s, [p.key]: e.target.checked }))} />
                                        <span className="flex-1 font-medium">{p.name.replace("Use of my ", "").replace(/^./, (c) => c.toUpperCase())}</span>
                                        {taken && <span className="text-xs">Already created</span>}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold">Other details (optional)</h3>
                        <button type="button" disabled={busy} onClick={() => setCustoms((c) => [...c, { id: `c${++customId}`, name: "" }])} className={dkBtn}>+ Add</button>
                    </div>
                    <ul className="mt-2 space-y-2">
                        {customs.map((c) => (
                            <li key={c.id} className="flex items-center gap-2">
                                <input value={c.name} onChange={(e) => setCustoms((l) => l.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} placeholder="e.g. Use of my address" className={`${dkInput} mt-0`} />
                                <button type="button" onClick={() => setCustoms((l) => l.filter((x) => x.id !== c.id))} className="shrink-0 px-2 text-xs font-semibold text-bad-ink hover:underline">Remove</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-sm font-semibold">The user will be asked</h3>
                    {items.length === 0 ? (
                        <p className="mt-2 text-xs text-muted">Nothing selected.</p>
                    ) : (
                        <ol className="mt-2 list-decimal space-y-1 rounded-xl bg-soft py-3 pl-8 pr-3 text-sm text-ink-2">
                            {items.map((it) => <li key={it.id}>{it.question}</li>)}
                        </ol>
                    )}
                </div>

                {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad-ink">{error}</p>}

                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={dkBtn}>Cancel</button>
                    <button type="button" onClick={submit} disabled={busy || items.length === 0} className="inline-flex h-9 items-center justify-center rounded-xl bg-brand px-4 text-xs font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">
                        {busy ? "Creating..." : "Create consent"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
