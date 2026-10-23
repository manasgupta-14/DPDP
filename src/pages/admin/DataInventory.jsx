import { useCallback, useEffect, useState } from "react";
import { createDataInventory, getDataInventory } from "../../api/dataInventory.js";
import Alert from "../../components/shared/Alert.jsx";
import Modal from "../../components/shared/Modal.jsx";
import { field, ghostBtn, panel, primaryBtn } from "../../components/shared/ui.js";
import { formatDate } from "../../utils/breach.js";

const EMPTY = { name: "", dataCategory: "", purpose: "", dataSource: "", storageLocation: "", retentionPeriodDays: "" };

function validate(f) {
    const e = {};
    if (!f.name.trim()) e.name = "Enter the data point name.";
    if (!f.dataCategory.trim()) e.dataCategory = "Enter a category.";
    if (!f.purpose.trim()) e.purpose = "Explain why this data is collected.";
    if (f.retentionPeriodDays !== "") {
        const n = Number(f.retentionPeriodDays);
        if (!Number.isInteger(n) || n < 1 || n > 36500) e.retentionPeriodDays = "Use a whole number between 1 and 36500.";
    }
    return e;
}

function AddForm({ onCreated, onDone }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const [success, setSuccess] = useState("");

    const set = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        setErrors((er) => ({ ...er, [k]: undefined }));
        setSuccess("");
    };

    const submit = async (e) => {
        e.preventDefault();
        setApiError("");
        setSuccess("");
        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length) return;

        setBusy(true);
        const res = await createDataInventory({
            name: form.name.trim(),
            dataCategory: form.dataCategory.trim(),
            purpose: form.purpose.trim(),
            dataSource: form.dataSource.trim() || null,
            storageLocation: form.storageLocation.trim() || null,
            retentionPeriodDays: form.retentionPeriodDays === "" ? null : Number(form.retentionPeriodDays),
        });
        setBusy(false);

        if (!res.ok) return setApiError(res.error);
        setForm(EMPTY);
        setSuccess("Data inventory item added. You can now use it in a consent campaign.");
        onCreated?.();
        onDone?.();
    };

    const text = (k, label, props = {}) => (
        <label className="block text-sm font-medium text-[#334155]">
            {label}
            <input value={form[k]} onChange={set(k)} className={field} aria-invalid={!!errors[k]} {...props} />
            <span className="mt-1 block text-xs text-[#DC2626]">{errors[k]}</span>
        </label>
    );

    return (
        <form onSubmit={submit} noValidate className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Add data point</h2>
            <p className="mt-1 text-sm text-[#475569]">Record what personal data you hold and why. Consent campaigns link to these.</p>
            <div className="mt-5 space-y-4">
                {text("name", "Name", { maxLength: 150, placeholder: "e.g. Email address" })}
                {text("dataCategory", "Category", { maxLength: 100, placeholder: "e.g. Contact info" })}
                <label className="block text-sm font-medium text-[#334155]">
                    Purpose
                    <textarea value={form.purpose} onChange={set("purpose")} rows={3} maxLength={300} placeholder="Why do you collect this data?" className={`${field} resize-y`} aria-invalid={!!errors.purpose} />
                    <span className="mt-1 block text-xs text-[#DC2626]">{errors.purpose}</span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                    {text("dataSource", "Source (optional)", { maxLength: 150, placeholder: "e.g. Signup form" })}
                    {text("storageLocation", "Storage (optional)", { maxLength: 200, placeholder: "e.g. India region database" })}
                </div>
                {text("retentionPeriodDays", "Retention in days (optional)", { type: "number", min: 1, max: 36500, placeholder: "e.g. 365" })}
                <Alert>{apiError}</Alert>
                <Alert tone="success">{success}</Alert>
                <button type="submit" disabled={busy} className={`${primaryBtn} w-full`}>{busy ? "Adding..." : "Add data point"}</button>
            </div>
        </form>
    );
}

export default function DataInventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [adding, setAdding] = useState(false);

    const load = useCallback(async () => {
        setError("");
        const res = await getDataInventory();
        if (res.ok) setItems(res.data);
        else setError(res.error);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        getDataInventory().then((res) => {
            if (!active) return;
            if (res.ok) setItems(res.data);
            else setError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data inventory</h1>
                    <p className="mt-1 text-sm text-[#475569]">Where personal data lives and why it is processed.</p>
                </div>
                <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>+ Add data point</button>
            </div>
            <div>
                <div className={`${panel} overflow-hidden`}>
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
                        <h2 className="text-lg font-semibold">Recorded data ({items.length})</h2>
                        <button type="button" onClick={load} className={ghostBtn}>Refresh</button>
                    </div>
                    {error && <div className="p-4"><Alert>{error}</Alert></div>}
                    {loading ? (
                        <p className="px-5 py-6 text-sm text-[#475569]">Loading data inventory...</p>
                    ) : items.length === 0 && !error ? (
                        <p className="px-5 py-6 text-sm text-[#475569]">Nothing recorded yet. Use "Add data point" to add the first one.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] text-left text-sm">
                                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wider text-[#64748B]">
                                    <tr><th className="px-5 py-3">Data</th><th className="px-3 py-3">Purpose</th><th className="px-3 py-3">Retention</th><th className="px-3 py-3">Added</th></tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                    {items.map((i) => (
                                        <tr key={i.id}>
                                            <td className="px-5 py-3"><p className="font-medium">{i.name}</p><p className="text-xs text-[#64748B]">{i.category}</p></td>
                                            <td className="max-w-[260px] px-3 py-3 text-[#334155]">{i.purpose}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-[#334155]">{i.retentionDays ? `${i.retentionDays} days` : "-"}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-[#334155]">{formatDate(i.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {adding && (
                <Modal title="Add data point" onClose={() => setAdding(false)}>
                    <AddForm onCreated={load} onDone={() => setAdding(false)} />
                </Modal>
            )}
        </div>
    );
}
