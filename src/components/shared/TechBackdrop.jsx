import { useEffect, useRef } from "react";
import { THEME_EVENT } from "../../utils/theme.js";

/*
 * App background (web-app jaisa, website jaisa nahi):
 *  1) halka tech grid (CSS), 2) dheemi aurora glow (CSS), 3) canvas par "neural network":
 *  chhote nodes tairte hain, paas wale judte hain, 
 * Performance: nodes kam, tab chhupa ho to ruk jata hai, reduced-motion par sirf ek frame.
 */
const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export default function TechBackdrop() {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        let w = 0;
        let h = 0;
        let nodes = [];
        let raf = 0;
        let running = true;
        let rgb = [79, 124, 255];
        let alpha = 0.5;

        const readTheme = () => {
            const dark = document.documentElement.dataset.theme === "dark";
            const hex = css(dark ? "--kx-node-dark" : "--kx-node-light", dark ? "#4FD1FF" : "#2F5BFF").replace("#", "");
            const n = parseInt(hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex, 16);
            rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
            alpha = dark ? 0.55 : 0.34;
        };

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.min(70, Math.max(24, Math.round((w * h) / 24000)));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.28,
                vy: (Math.random() - 0.5) * 0.28,
                r: 1 + Math.random() * 1.4,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            const [r, g, b] = rgb;
            const LINK = 150;
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                if (!reduced) {
                    a.x += a.vx;
                    a.y += a.vy;
                    if (a.x < -10) a.x = w + 10;
                    else if (a.x > w + 10) a.x = -10;
                    if (a.y < -10) a.y = h + 10;
                    else if (a.y > h + 10) a.y = -10;
                }
                for (let j = i + 1; j < nodes.length; j++) {
                    const c = nodes[j];
                    const d = Math.hypot(a.x - c.x, a.y - c.y);
                    if (d < LINK) {
                        const o = (1 - d / LINK) * alpha * 0.55;
                        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(o, 0.85)})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(c.x, c.y);
                        ctx.stroke();
                    }
                }
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const loop = () => {
            if (!running) return;
            draw();
            raf = requestAnimationFrame(loop);
        };

        const onVis = () => {
            running = !document.hidden && !reduced;
            if (running) loop();
            else cancelAnimationFrame(raf);
        };

        readTheme();
        resize();
        draw();
        if (!reduced) loop();
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", onVis);
        const onTheme = () => {
            readTheme();
            if (reduced) draw();
        };
        window.addEventListener(THEME_EVENT, onTheme);
        return () => {
            running = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener(THEME_EVENT, onTheme);
        };
    }, []);

    return (
        <div className="kx-bg" aria-hidden="true">
            <span className="kx-aurora kx-aurora-a" />
            <span className="kx-aurora kx-aurora-b" />
            <span className="kx-grid" />
            <canvas ref={ref} className="kx-net" />
        </div>
    );
}
