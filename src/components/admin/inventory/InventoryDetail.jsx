import { useCallback, useEffect, useState } from "react";
import { deleteDataInventory, getDataInventoryItem, updateDataInventory } from "../../../api/dataInventory.js";
import Alert from "../../shared/Alert.jsx";
import { ghostBtn, panel, primaryBtn } from "../../shared/ui.js";
import { formatDate } from "../../../utils/breach.js";
import { retentionText } from "../../../utils/inventory.js";
import InventoryForm from "./InventoryForm.jsx";

function Row({ label, children, wide }) {
    return (
        <div className={wide ? "sm:col-span-2" : ""}>
            <dt className="text-xs font-medium uppercase tracking-wider text-[#64748B]">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-[#0F172A]">{children || <span className="text-[#94A3B8]">Not set</span>}</dd>
        </div>
    );
}

export default function InventoryDetail({ listItem, startEditing = false, onClose, onChanged }) {
    const [item, setItem] = useState(listItem);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [editing, setEditing] = useState(startEditing);
    const [notice, setNotice] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const remove = async () => {
        setDeleting(true);
        setDeleteError("");
        const res = await deleteDataInventory(item.id);
        setDeleting(false);
        if (!res.ok) return setDeleteError(res.error);
        onChanged?.(`Deleted "${item.name}".`);
        onClose?.();
    };

    const fetchFresh = useCallback(async () => {
        const res = await getDataInventoryItem(listItem.id);
        if (res.ok) {
            setItem(res.data);
            setLoadError("");
        } else {
            setLoadError(res.error);
        }
        setLoading(false);
        return res;
    }, [listItem.id]);

    useEffect(() => {
        let active = true;
        getDataInventoryItem(listItem.id).then((res) => {
            if (!active) return;
            if (res.ok) setItem(res.data);
            else setLoadError(res.error);
            setLoading(false);
        });
        return () => { active = false; };
    }, [listItem.id]);

    if (editing) {
        return (
            <InventoryForm
                item={item}
                onSubmit={(payload) => updateDataInventory(item.id, payload)}
                onSaved={async () => {
                    setLoading(true);
                    await fetchFresh();
                    setEditing(false);
                    setNotice("Changes saved.");
                    onChanged?.(`Updated "${item.name}".`);
                }}
                onCancel={() => setEditing(false)}
            />
        );
    }

    return (
        <div className={`${panel} space-y-5 p-5 sm:p-6`} aria-busy={loading}>
            <div className="pr-8">
                <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <span className="inline-flex rounded-full bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-semibold text-[#0F766E] ring-1 ring-[#0F766E]/25">{item.status}</span>
                </div>
                {item.category && <p className="mt-0.5 text-sm text-[#64748B]">{item.category}</p>}
            </div>

            {notice && <Alert tone="success">{notice}</Alert>}
            {loadError && (
                <Alert tone="info" action={<button type="button" onClick={() => { setLoading(true); fetchFresh(); }} className="shrink-0 font-semibold underline">Retry</button>}>
                    Could not load the latest copy ({loadError}) Showing the data from the list.
                </Alert>
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
                <Row label="Purpose" wide>{item.purpose}</Row>
                <Row label="Source">{item.source}</Row>
                <Row label="Storage">{item.storage}</Row>
                <Row label="Retention">{item.retentionDays ? retentionText(item.retentionDays) : ""}</Row>
                <Row label="Added">{item.createdAt ? formatDate(item.createdAt) : ""}</Row>
                {item.updatedAt && <Row label="Last updated">{formatDate(item.updatedAt)}</Row>}
            </dl>

            {deleteError && <Alert>{deleteError}</Alert>}

            {confirming ? (
                <div className="space-y-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
                    <p className="text-sm text-[#7F1D1D]">Delete <span className="font-semibold">{item.name}</span>? This cannot be undone.</p>
                    <div className="flex gap-2.5">
                        <button type="button" onClick={remove} disabled={deleting} className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] disabled:opacity-60">{deleting ? "Deleting..." : "Yes, delete"}</button>
                        <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className={ghostBtn}>Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2.5">
                    <button type="button" onClick={() => { setNotice(""); setEditing(true); }} disabled={loading} className={`${primaryBtn} flex-1`}>Edit</button>
                    <button type="button" onClick={() => { setNotice(""); setDeleteError(""); setConfirming(true); }} disabled={loading} className="inline-flex items-center justify-center rounded-xl border border-[#FECACA] px-4 py-2.5 text-sm font-semibold text-[#B91C1C] transition hover:bg-[#FEF2F2] disabled:opacity-60">Delete</button>
                    <button type="button" onClick={onClose} className={ghostBtn}>Close</button>
                </div>
            )}
        </div>
    );
}
