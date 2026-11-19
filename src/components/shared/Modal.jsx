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
        <div className="pg-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-deep/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label={title} className="pg-modal-dialog relative my-auto w-full max-w-2xl">
                <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-xl leading-none text-muted transition hover:rotate-90 hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    &times;
                </button>
                {children}
            </div>
        </div>,
        document.body,
    );
}
