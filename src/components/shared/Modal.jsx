import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#0B1220]/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label={title} className="relative my-auto w-full max-w-2xl" style={{ animation: "pg-rise .3s ease-out both" }}>
                <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-xl leading-none text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]">
                    &times;
                </button>
                {children}
            </div>
        </div>,
        document.body,
    );
}
