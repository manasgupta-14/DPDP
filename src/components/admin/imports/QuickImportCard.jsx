import { useEffect, useMemo, useState } from "react";
import { bulkImportDataPrincipals } from "../../../api/dataPrincipal.js";
import { getRoleOptions } from "../../../api/roles.js";
import { downloadText } from "../../../utils/bulkImport.js";
import Alert from "../../shared/Alert.jsx";
import { panel, primaryBtn } from "../../shared/ui.js";

const input = "mt-1.5 h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40 disabled:bg-[#F8FAFC]";
const label = "block text-sm font-medium text-[#334155]";
const MAX_BYTES = 5 * 1024 * 1024;
const TEMPLATE = "full_name,mobile,email,consumer_no,class,preferred_locale,date_of_birth\nRavi Kumar,9876543210,ravi@example.com,CN1001,adult,hi-IN,1990-05-14\n";
const PLACEHOLDER = "full_name,mobile,email,consumer_no,class,preferred_locale\nRavi Kumar,9876543210,ravi@example.com,CN1001,adult,hi-IN";

// CSV ke column naam alag-alag ho sakte hain, sabko ek naam par le aate hain.
const HEADERS = {
    fullName: ["full_name", "fullname", "name", "display_name", "displayname"],
    mobile: ["mobile", "phone", "mobile_number", "phone_number"],
    email: ["email", "email_address"],
    consumerNo: ["consumer_no", "consumerno", "consumer_number", "consumer"],
    class: ["class", "category"],
    preferredLocale: ["preferred_locale", "locale", "language"],
    dateOfBirth: ["date_of_birth", "dob", "birth_date"],
    password: ["password"],
};
const CLASSES = new Set(["adult", "child", "person_with_disability"]);
const LOCALES = { en: "en-IN", english: "en-IN", "en-in": "en-IN", hi: "hi-IN", hindi: "hi-IN", "hi-in": "hi-IN", mr: "mr-IN", marathi: "mr-IN", "mr-in": "mr-IN" };

function splitCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ",") { row.push(cell); cell = ""; }
        else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n") i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parsePrincipals(text) {
    const table = splitCsv(text.replace(/^\uFEFF/, ""));
    if (table.length < 2) return { rows: [], errors: [], missing: "Add a header row and at least one data row." };
    const head = table[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const col = Object.fromEntries(Object.entries(HEADERS).map(([k, names]) => [k, head.findIndex((h) => names.includes(h))]));
    if (col.mobile < 0 && col.email < 0) return { rows: [], errors: [], missing: "The CSV needs a mobile or email column." };

    const rows = [];
    const errors = [];
    const seen = new Set();
    table.slice(1).forEach((cells, i) => {
        const line = i + 2;
        const get = (k) => (col[k] >= 0 ? String(cells[col[k]] ?? "").trim() : "");
        const r = Object.fromEntries(Object.keys(HEADERS).map((k) => [k, get(k)]));
        r.mobile = r.mobile.replace(/[\s-]/g, "").replace(/^(\+91|91)(?=\d{10}$)/, "");
        r.class = (r.class || "adult").toLowerCase().replace(/\s+/g, "_");
        r.preferredLocale = LOCALES[(r.preferredLocale || "en").toLowerCase()] || "en-IN";
        const problems = [];
        if (!r.mobile && !r.email) problems.push("needs a mobile or email");
        if (r.mobile && !/^\d{10}$/.test(r.mobile)) problems.push("mobile must be 10 digits");
        if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) problems.push("email is not valid");
        if (!CLASSES.has(r.class)) problems.push("class must be adult, child or person_with_disability");
        if (r.dateOfBirth && Number.isNaN(new Date(r.dateOfBirth).getTime())) problems.push("date of birth is not a date (use yyyy-mm-dd)");
        if (r.password && r.password.length < 8) problems.push("password needs at least 8 characters");
        const keys = [r.mobile && `m:${r.mobile}`, r.email && `e:${r.email.toLowerCase()}`].filter(Boolean);
        if (!problems.length && keys.some((k) => seen.has(k))) problems.push("same mobile or email as an earlier row");
        if (problems.length) errors.push({ line, text: problems.join(", ") });
        else {
            keys.forEach((k) => seen.add(k));
            rows.push(r);
        }
    });
    return { rows, errors, missing: "" };
}

export default function QuickImportCard({ onImported }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [fileName, setFileName] = useState("");
    const [inputKey, setInputKey] = useState(0);
    const [roles, setRoles] = useState({ loading: true, items: [] });
    const [roleId, setRoleId] = useState("");
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !roles.loading) return undefined;
        let active = true;
        getRoleOptions().then((res) => {
            if (!active) return;
            const items = res.ok ? res.data.filter((r) => !/admin|^dpo$/i.test(r.name)) : [];
            setRoles({ loading: false, items });
            const def = items.find((r) => /^data\s*principal$/i.test(r.name));
            if (def) setRoleId((v) => v || def.id);
        });
        return () => {
            active = false;
        };
    }, [open, roles.loading]);

    const parsed = useMemo(() => (text.trim() ? parsePrincipals(text) : null), [text]);

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError("");
        if (file.size > MAX_BYTES) {
            setInputKey((k) => k + 1);
            setError("This file is larger than 5 MB. Split it into smaller files.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setText(String(reader.result || ""));
            setFileName(file.name);
        };
        reader.onerror = () => setError("Could not read this file.");
        reader.readAsText(file);
    };

    const clear = () => {
        setText("");
        setFileName("");
        setInputKey((k) => k + 1);
        setError("");
        setProgress(0);
    };

    const run = async () => {
        if (!parsed?.rows.length) return;
        setBusy(true);
        setError("");
        setProgress(0);
        const res = await bulkImportDataPrincipals(parsed.rows, { roleId, onProgress: setProgress });
        setBusy(false);
        if (!res.ok) {
            setError(res.error);
            if (res.data?.imported) onImported?.(res.data.imported);
            return;
        }
        clear();
        onImported?.(res.data.imported);
    };

    return (
        <section className={`${panel} p-5 sm:p-6`} aria-labelledby="quick-import-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 id="quick-import-title" className="text-lg font-semibold text-[#0F172A]">Quick import data principals</h2>
                    <p className="mt-1 max-w-2xl text-sm text-[#475569]">Adds people straight to Data principals in one step, without staging or review. Use the batch upload below when you want to check rows before saving.</p>
                </div>
                <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition hover:border-[#0F766E] hover:text-[#0F766E]">
                    {open ? "Hide" : "Open quick import"}
                </button>
            </div>

            {open && (
                <div className="mt-5 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className={label}>
                            CSV file
                            <input key={inputKey} type="file" accept=".csv,text/csv" onChange={onFile} disabled={busy} className={`${input} py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E6F4F1] file:px-3 file:py-1 file:text-sm file:font-semibold file:text-[#0F766E]`} />
                            {fileName && <span className="mt-1 block truncate text-xs text-[#64748B]">{fileName}</span>}
                        </label>
                        <label className={label}>
                            Role for everyone in this file
                            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} disabled={busy || roles.loading} className={input}>
                                <option value="">{roles.loading ? "Loading roles..." : "No role"}</option>
                                {roles.items.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </label>
                    </div>

                    <label className={label}>
                        Or paste CSV
                        <textarea value={text} onChange={(e) => { setText(e.target.value); setFileName(""); }} disabled={busy} rows={5} placeholder={PLACEHOLDER} className={`${input} h-auto py-2.5 font-mono text-xs`} />
                    </label>

                    <p className="text-xs text-[#64748B]">
                        Columns: full_name, mobile, email, consumer_no, class, preferred_locale, date_of_birth, password (optional). Each row needs a mobile or an email.{" "}
                        <button type="button" onClick={() => downloadText("data-principals-template.csv", TEMPLATE)} className="font-semibold text-[#0F766E] hover:underline">Download template</button>
                    </p>

                    {parsed?.missing && <Alert>{parsed.missing}</Alert>}
                    {parsed && !parsed.missing && (
                        <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm ring-1 ring-[#E2E8F0]">
                            <p className="text-[#0F172A]">
                                <span className="font-semibold text-[#15803D]">{parsed.rows.length}</span> ready to import
                                {parsed.errors.length > 0 && <> · <span className="font-semibold text-[#DC2626]">{parsed.errors.length}</span> skipped</>}
                            </p>
                            {parsed.errors.length > 0 && (
                                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[#B91C1C]">
                                    {parsed.errors.slice(0, 50).map((e) => <li key={e.line}>Row {e.line}: {e.text}</li>)}
                                    {parsed.errors.length > 50 && <li>…and {parsed.errors.length - 50} more</li>}
                                </ul>
                            )}
                        </div>
                    )}

                    {error && <Alert>{error}</Alert>}

                    <div className="flex flex-wrap items-center justify-end gap-2.5">
                        {busy && <span className="text-sm text-[#475569]">Imported {progress} of {parsed?.rows.length ?? 0}...</span>}
                        <button type="button" onClick={clear} disabled={busy || !text} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50">Clear</button>
                        <button type="button" onClick={run} disabled={busy || !parsed?.rows.length} className={primaryBtn}>
                            {busy ? "Importing..." : `Import ${parsed?.rows.length || ""} data principal${parsed?.rows.length === 1 ? "" : "s"}`.replace("  ", " ")}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
