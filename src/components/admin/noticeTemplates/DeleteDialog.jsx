import { useState } from "react";
import { deleteTemplate } from "../../../api/noticeTemplate.js";
import Alert from "../../shared/Alert.jsx";
import Modal from "../../shared/Modal.jsx";
import { ghostBtn, panel } from "../../shared/ui.js";

export default function DeleteDialog({ template, onClose, onDeleted }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const confirm = async () => {
        setError("");
        setBusy(true);
        const res = await deleteTemplate(template.id);
        setBusy(false);
        if (!res.ok) return setError(res.error);
        onDeleted(res.data.message);
        onClose();
    };

    return (
        <Modal title="Delete notice template" onClose={() => !busy && onClose()}>
            <div className={`${panel} space-y-4 p-5 sm:p-6`}>
                <h2 className="pr-8 text-lg font-semibold">Delete notice template</h2>
                <p className="text-sm text-[#475569]">
                    <span className="font-semibold text-[#0F172A]">{template.name}</span> will be removed permanently. This cannot be undone.
                </p>
                <Alert>{error}</Alert>
                <div className="flex justify-end gap-2.5">
                    <button type="button" onClick={onClose} disabled={busy} className={ghostBtn}>Cancel</button>
                    <button type="button" onClick={confirm} disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </Modal>
    );
}
