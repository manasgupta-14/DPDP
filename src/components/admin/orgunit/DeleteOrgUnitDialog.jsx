import { useState } from "react";
import { deleteOrgUnit } from "../../../api/orgUnit.js";
import Alert from "../../shared/Alert.jsx";
import { ghostBtn, panel } from "../../shared/ui.js";

export default function DeleteOrgUnitDialog({ unit, onDone, onClose }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const confirm = async () => {
        setBusy(true);
        setError("");
        const res = await deleteOrgUnit(unit.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDone(`${unit.name} was deleted.`);
    };

    return (
        <div className={`${panel} p-5 sm:p-6`}>
            <h2 className="pr-8 text-lg font-semibold">Delete {unit.name}?</h2>
            <p className="mt-2 text-sm text-ink-3">
                <span className="font-mono text-ink">{unit.code}</span> will be removed permanently. A unit that still has child units cannot be deleted. If you only want to stop using it, deactivate it instead.
            </p>
            <div className="mt-4"><Alert>{error}</Alert></div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className={ghostBtn}>Cancel</button>
                <button type="button" onClick={confirm} disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-bad-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60">
                    {busy ? "Deleting..." : "Delete unit"}
                </button>
            </div>
        </div>
    );
}
