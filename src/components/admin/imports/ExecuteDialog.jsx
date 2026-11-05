import Modal from "../../shared/Modal.jsx";
import { ghostBtn, primaryBtn } from "../../shared/ui.js";

export default function ExecuteDialog({ batch, busy, error, onConfirm, onClose }) {
    return (
        <Modal title="Execute batch" onClose={busy ? () => {} : onClose}>
            <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
                {busy ? (
                    <>
                        <h2 className="text-lg font-semibold">Executing batch...</h2>
                        <p className="text-sm text-[#475569]">Creating consumers from {batch.processed.toLocaleString()} valid rows. Please keep this window open.</p>
                        <div role="progressbar" aria-label="Executing batch" className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div className="h-full w-full animate-pulse rounded-full bg-[#0F766E]" />
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="pr-8 text-lg font-semibold">Execute this batch?</h2>
                        <p className="text-sm text-[#475569]">
                            <span className="font-semibold text-[#166534]">{batch.processed.toLocaleString()} valid rows</span> will be created as consumers.
                            {batch.failed > 0 && <> The other <span className="font-semibold text-[#92400E]">{batch.failed.toLocaleString()} invalid rows</span> will be skipped.</>}
                        </p>
                        <p className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748B]">A batch can be executed only once. This cannot be undone from here.</p>
                        {error && <p role="alert" className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">{error}</p>}
                        <div className="flex gap-2.5">
                            <button type="button" onClick={onClose} className={`${ghostBtn} flex-1`}>Cancel</button>
                            <button type="button" onClick={onConfirm} className={`${primaryBtn} flex-[2]`}>Confirm and execute</button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
