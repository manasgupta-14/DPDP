import { useEffect, useRef, useState } from "react";

export default function Defer({ height = 320, margin = "400px", children }) {
    const ref = useRef(null);
    const [ready, setReady] = useState(typeof IntersectionObserver === "undefined");

    useEffect(() => {
        if (ready) return undefined;
        const el = ref.current;
        if (!el) return undefined;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setReady(true);
                    io.disconnect();
                }
            },
            { rootMargin: `${margin} 0px` },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [ready, margin]);

    if (children == null || children === false) return null;
    if (ready) return children;
    return <div ref={ref} aria-hidden="true" style={{ minHeight: height }} />;
}
