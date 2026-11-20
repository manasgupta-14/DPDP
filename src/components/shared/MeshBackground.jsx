import { useEffect, useRef, useState } from "react";
import { THEME_EVENT, getTheme } from "../../utils/theme.js";

/*
 * Kavach background: WebGL "silk" mesh (Premium Mesh UI se), rang halke kiye gaye taaki cards ka text saaf dikhe.
 * WebGL 3D fluid gradient (neat.rebase.pro jaisa "silk" look).
 * - Ek hi full-screen canvas, sab UI ke peeche (fixed, z-index -1).
 * - Height-field se folds, uske normal se halki lighting aur chamak, upar film grain.
 * - Scroll par parallax (pattern upar khiskta hai) aur jis section par ho uske rang (data-bg) me dheere badalta hai.
 * - Performance: aadhi resolution par render, tab chhupa ho to ruk jata hai,
 *   reduced-motion par sirf ek frame. WebGL na ho to CSS gradient dikhta hai.
 */

// Rang psychology ke hisaab se palette (5 rang: halka → gehra → garm)
const PALETTES = {
    // Bharosa aur shanti: neela + violet, upar halka peach (screenshot jaisa)
    // Order: neeche-left, upar-left, upar-beech glow, upar-right, neeche-right
    trust: ["#BFF0E6", "#CFE3FF", "#DDB8FF", "#F7C6E6", "#FFE2C2"],
    // Suraksha aur care: pink/magenta shield ke saath
    care: ["#FFE0F1", "#F28CCB", "#C77DFF", "#FF9FB8", "#FFE6C7"],
    // Naya aur premium: violet-indigo
    innovate: ["#D6DCFF", "#8E9BFF", "#A87CFF", "#E8A6FF", "#FFE4CC"],
    // Sthirta aur proof: aqua-teal + neela
    proof: ["#C6F4EC", "#7FD4F5", "#8FA2FF", "#D2B2FF", "#FFE9C9"],
    // Action aur garmi: peach-orange + pink (CTA)
    action: ["#FFE1C7", "#FF9E7D", "#F57AB8", "#A98BFF", "#FFF2DA"],
};

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uDark;
uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;

// Simplex noise 3D (Ashima Arts, MIT)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// Ribbon ke rang (screenshot jaisa): neela → violet → magenta → coral → orange
vec3 ribbonRamp(float g){
  g = clamp(g, 0.0, 1.0) * 4.0;
  // Aurora: teal → aasmani → violet → pink → peach
  vec3 c = mix(vec3(0.180, 0.780, 0.700), vec3(0.250, 0.650, 0.970), smoothstep(0.0, 1.0, g));
  c = mix(c, vec3(0.560, 0.400, 0.980), smoothstep(1.0, 2.0, g));
  c = mix(c, vec3(0.930, 0.420, 0.780), smoothstep(2.0, 3.0, g));
  return mix(c, vec3(0.990, 0.640, 0.420), smoothstep(3.0, 4.0, g));
}
// Har rang ka gehra roop (saaye ke liye; bhoora nahi, saturated)
vec3 ribbonDeep(float g){
  g = clamp(g, 0.0, 1.0) * 4.0;
  vec3 c = mix(vec3(0.050, 0.560, 0.520), vec3(0.100, 0.420, 0.850), smoothstep(0.0, 1.0, g));
  c = mix(c, vec3(0.400, 0.220, 0.860), smoothstep(1.0, 2.0, g));
  c = mix(c, vec3(0.780, 0.200, 0.600), smoothstep(2.0, 3.0, g));
  return mix(c, vec3(0.920, 0.440, 0.200), smoothstep(3.0, 4.0, g));
}

// Ek silk sheet: upar aur neeche ke kinare alag-alag lehrate hain (mudne par patla, khulne par chauda)
// Return: x = alpha, y = across (0 neeche .. 1 upar), z = fold light (0..1), w = upar ke kinare se doori
vec4 sheet(vec2 p, float t, float yo, float seed, float lift, float thick){
  float x = p.x;
  float mid = lift
            + 0.10 * sin(x * 1.30 + t * 0.70 + yo * 0.50 + seed)
            + 0.05 * sin(x * 2.90 - t * 0.90 + yo * 0.80 + seed * 1.7)
            + 0.03 * snoise(vec3(x * 0.7, seed, t * 0.30 + yo * 0.20));
  // Twist: kahin chauda kahin patla (screenshot jaise mod)
  float tw = sin(x * 1.60 + t * 0.45 + yo * 0.35 + seed * 2.3);
  float half_ = thick * (0.30 + 0.70 * (0.5 + 0.5 * tw));
  // Upar ka kinara lehrata hua (hump), neeche ka naram
  float top = mid + half_ + 0.05 * sin(x * 3.6 + t * 1.10 + seed * 3.0);
  float bot = mid - half_ * 0.85;
  float dTop = top - p.y;
  float dBot = p.y - bot;
  float a = smoothstep(0.0, 0.008, dTop) * smoothstep(0.0, 0.05, dBot);
  float v = clamp(dBot / max(top - bot, 1e-3), 0.0, 1.0);
  // Andar ki silwatein (folds): roshni aur saaya
  float fold = 0.5 + 0.5 * sin(v * 5.0 + x * 2.2 - t * 1.10 + seed * 1.3 + 2.0 * tw);
  fold = mix(fold, 0.5 + 0.5 * sin(x * 5.5 + v * 2.0 + t * 0.80 + seed), 0.35);
  return vec4(a, v, fold, dTop);
}

vec3 fieldColor(vec2 uv, float t){
  vec3 bl = uC0;               // neeche-left: halka cyan
  vec3 tl = uC1;               // upar-left: lavender
  vec3 tr = uC3;               // upar-right: peach-pink
  vec3 br = uC4;               // neeche-right: halka peela
  vec3 top = mix(tl, tr, smoothstep(0.0, 1.0, uv.x));
  vec3 bot = mix(bl, br, smoothstep(0.1, 0.9, uv.x));
  vec3 col = mix(bot, top, smoothstep(0.15, 0.95, uv.y));
  col = mix(col, vec3(1.0), 0.68);   // field bahut halka (50% aur halka kiya)
  // Upar beech me gulabi-magenta chamak (screenshot ka top glow)
  vec2 g = uv - vec2(0.58 + 0.04 * sin(t * 0.3), 1.0);
  col = mix(col, uC2, 0.30 * exp(-dot(g * vec2(1.3, 1.6), g * vec2(1.3, 1.6)) * 4.0));
  // Neeche-right garm peela glow
  vec2 y2 = uv - vec2(0.90, 0.0);
  col = mix(col, br, 0.22 * exp(-dot(y2, y2) * 7.0));
  return col;
}

vec3 shadeSheet(vec4 r, float xg){
  vec3 lite = mix(ribbonRamp(xg), vec3(1.0), 0.60);   // roshni wala hissa: halka pastel
  vec3 deep = mix(ribbonDeep(xg), ribbonRamp(xg), 0.55); // saaya: naram (bahut gehra nahi)
  vec3 col = mix(deep, lite, smoothstep(0.08, 0.92, r.z));
  col = mix(col, ribbonRamp(xg), 0.25);
  // Upar ke kinare par patli chamakti line (silk edge)
  col += vec3(1.0) * 0.30 * exp(-r.w * 90.0);
  return col;
}

// Dark ke liye ribbon rang: neela -> violet -> magenta -> narangi (saturated, chamakdaar)
vec3 nightRamp(float g){
  g = clamp(g, 0.0, 1.0) * 3.0;
  vec3 c = mix(vec3(0.16, 0.42, 1.00), vec3(0.52, 0.30, 1.00), smoothstep(0.0, 1.0, g));
  c = mix(c, vec3(0.92, 0.26, 0.78), smoothstep(1.0, 2.0, g));
  return mix(c, vec3(1.00, 0.52, 0.18), smoothstep(2.0, 3.0, g));
}
vec3 nightSheet(vec4 r, float xg){
  vec3 lite = nightRamp(xg);
  vec3 deep = nightRamp(xg) * 0.32;
  vec3 col = mix(deep, lite, smoothstep(0.10, 0.92, r.z));
  col += vec3(1.0) * 0.32 * exp(-r.w * 90.0);   // silk ka chamakta kinara
  return col;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  p = mat2(0.985, -0.17, 0.17, 0.985) * p;   // halka tirchha (left neeche, right upar)
  float t = uTime * 0.11;
  float yo = uScroll;                         // Neat jaisa yOffset (scroll se)
  float xg = clamp(uv.x * 1.05 - 0.02, 0.0, 1.0);

  vec3 col = fieldColor(uv, t);
  col += 0.02 * snoise(vec3(p * 1.1, t * 0.4 + yo * 0.2));

  // Teen parat: peeche halki, beech mukhya, aage patli jaali (sheer)
  vec4 r3 = sheet(p, t * 0.85, yo, 4.1, 0.17, 0.12);
  col = mix(col, shadeSheet(r3, xg), r3.x * 0.16);

  vec4 r1 = sheet(p, t, yo, 0.0, 0.04, 0.22);
  // Mukhya parat ke neeche halki rangeen parchhai
  float shadow = exp(-max(-(p.y - (0.02 - 0.17)), 0.0) * 6.0) * (1.0 - r1.x) * 0.0;
  col = mix(col, shadeSheet(r1, xg), r1.x * 0.40);

  vec4 r2 = sheet(p, t * 1.1, yo, 2.3, -0.08, 0.08);
  col = mix(col, shadeSheet(r2, xg) * 1.04, r2.x * 0.18);

  // Halki safed dhundh (text padhne layak) + film grain
  col = mix(col, vec3(1.0), 0.46 + shadow);
  // ---------- Dark mode: wahi silk (aapka light wala background), bas safed ki jagah halka kaala.
  // Base #0B0B12 (pure kaala nahi, aankh ko aaram), ribbon ke rang saaf: neela -> violet -> magenta -> narangi.
  vec3 night = vec3(0.043, 0.043, 0.070);
  vec2 c1 = uv - vec2(0.05, 0.95);
  vec2 c2 = uv - vec2(0.98, 0.10);
  night += vec3(0.10, 0.12, 0.40) * 0.35 * exp(-dot(c1, c1) * 3.0);   // upar-left neeli roshni
  night += vec3(0.45, 0.18, 0.05) * 0.30 * exp(-dot(c2, c2) * 3.5);   // neeche-right garm roshni
  // Ribbon ke upar halki chamak (glow), taaki silk tairta lage
  float halo = exp(-max(-r1.w, 0.0) * 9.0) * (1.0 - r1.x);
  night += nightRamp(xg) * 0.22 * halo;
  night = mix(night, nightSheet(r3, xg) * 0.80, r3.x * 0.32);
  night = mix(night, nightSheet(r1, xg), r1.x * 0.82);
  night = mix(night, nightSheet(r2, xg), r2.x * 0.45);
  col = mix(col, night, uDark);
  // Koi grain/noise nahi: bilkul smooth (pehle har frame naya grain banta tha, wahi jhilmil tha)
  gl_FragColor = vec4(col, 1.0);
}`;

const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const msg = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error(msg || "shader compile failed");
    }
    return s;
}

// Mobile / kamzor device / Save-Data: animation nahi chalate, sirf ek static frame (GPU aur battery bachti hai)
function isLowPower() {
    if (typeof window === "undefined") return false;
    const mq = (q) => window.matchMedia?.(q).matches;
    const saveData = navigator.connection?.saveData === true;
    const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    return saveData || weak || mq("(max-width: 1023px)") || mq("(pointer: coarse)");
}

export default function MeshBackground({ scale = 0.5, calm = false }) {
    const canvasRef = useRef(null);
    // Shader compile bhaari hota hai: pehle page paint ho, phir (idle me) background shuru ho. LCP/TBT sahi rehta hai.
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const go = () => setReady(true);
        if (typeof window.requestIdleCallback === "function") {
            const id = window.requestIdleCallback(go, { timeout: 1500 });
            return () => window.cancelIdleCallback?.(id);
        }
        const t = setTimeout(go, 400);
        return () => clearTimeout(t);
    }, []);
    // GPU reset (context lost) ke baad naya canvas banane ke liye
    const [gen, setGen] = useState(0);
    // Dashboard/login par "calm": dheemi chaal aur kam resolution (kaam me dhyan na bhatke, GPU kam lage)
    const calmRef = useRef(calm);
    useEffect(() => {
        calmRef.current = calm;
        canvasRef.current?.dispatchEvent(new Event("pg-calm"));
    }, [calm]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !ready) return undefined;
        delete canvas.dataset.fallback;
        delete canvas.dataset.ready;
        const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
        if (!gl || gl.isContextLost()) {
            canvas.dataset.fallback = "1";
            return undefined;
        }

        let prog;
        try {
            prog = gl.createProgram();
            gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
            gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link failed");
        } catch {
            canvas.dataset.fallback = "1";
            return undefined;
        }
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const u = (name) => gl.getUniformLocation(prog, name);
        const uRes = u("uRes");
        const uTime = u("uTime");
        const uScroll = u("uScroll");
        const uDark = u("uDark");
        let darkNow = getTheme() === "dark" ? 1 : 0;
        const uC = [u("uC0"), u("uC1"), u("uC2"), u("uC3"), u("uC4")];

        const lowPower = isLowPower();
        // still = ek hi frame (reduced-motion ya low-power): loop nahi chalta
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || lowPower;
        let current = PALETTES.trust.map(hexToRgb);
        let target = current;
        let scrollNow = 0;
        let raf = 0;
        let running = false;
        // Auto-quality: frame dheema ho (kamzor GPU) to resolution ghatao
        let quality = 1;
        let lastNow = 0;
        let slow = 0;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            // Calm (dashboard) me bhi resolution nahi ghatate: kam resolution par stretch hokar dhabbe dikhte the
            const s = (lowPower ? Math.min(scale, 0.35) : scale) * quality;
            const w = Math.max(1, Math.round(window.innerWidth * dpr * s));
            const h = Math.max(1, Math.round(window.innerHeight * dpr * s));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
        };

        // Screen ke beech jo section hai uska data-bg palette
        const pickPalette = () => {
            const mid = window.innerHeight * 0.5;
            let key = "trust";
            for (const el of document.querySelectorAll("[data-bg]")) {
                const r = el.getBoundingClientRect();
                if (r.top <= mid && r.bottom >= mid) {
                    key = el.dataset.bg;
                    break;
                }
            }
            target = (PALETTES[key] || PALETTES.trust).map(hexToRgb);
        };

        // Chaal: calm me 45% speed, badlav naram (jhatka nahi)
        let simTime = 12;
        let speed = calmRef.current ? 0.45 : 1;
        let prevNow = 0;
        const draw = (now) => {
            const dtSec = prevNow ? Math.min((now - prevNow) / 1000, 0.1) : 0;
            prevNow = now;
            speed += ((calmRef.current ? 0.45 : 1) - speed) * 0.05;
            simTime += dtSec * speed;
            const scrollTarget = window.scrollY / Math.max(window.innerHeight, 1); // Neat: gradient.yOffset = scrollY
            scrollNow += (scrollTarget - scrollNow) * (reduced ? 1 : 0.06);
            const k = reduced ? 1 : 0.035;
            current = current.map((c, i) => c.map((v, j) => v + (target[i][j] - v) * k));
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, reduced ? 12 : simTime);
            gl.uniform1f(uScroll, scrollNow);
            const darkTarget = getTheme() === "dark" ? 1 : 0;
            darkNow += (darkTarget - darkNow) * (reduced ? 1 : 0.08);
            gl.uniform1f(uDark, darkNow);
            current.forEach((c, i) => gl.uniform3f(uC[i], c[0], c[1], c[2]));
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };

        const loop = (now) => {
            if (lastNow) {
                const dt = now - lastNow;
                slow = dt > 28 ? slow + 1 : Math.max(0, slow - 1);
                if (slow > 45 && quality > 0.8) {
                    quality = 0.75;
                    slow = 0;
                    resize();
                }
            }
            lastNow = now;
            draw(now);
            raf = requestAnimationFrame(loop);
        };
        const start = () => {
            if (running || reduced) return;
            running = true;
            raf = requestAnimationFrame(loop);
        };
        const stop = () => {
            running = false;
            lastNow = 0;
            prevNow = 0;
            cancelAnimationFrame(raf);
        };

        const onScroll = () => {
            pickPalette();
            if (reduced && !lowPower) requestAnimationFrame(draw);
        };
        const onResize = () => {
            resize();
            if (reduced) requestAnimationFrame(draw);
        };
        const onVisibility = () => (document.hidden ? stop() : start());
        const onCalm = () => {
            resize();
            pickPalette();
            if (reduced) requestAnimationFrame(draw);
        };
        canvas.addEventListener("pg-calm", onCalm);
        const onTheme = () => {
            if (reduced) requestAnimationFrame(draw);
        };
        window.addEventListener(THEME_EVENT, onTheme);

        resize();
        pickPalette();
        draw(performance.now());
        start();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onResize);
        document.addEventListener("visibilitychange", onVisibility);
        // GPU driver reset ho to rukna, wapas aaye to naya canvas (silk gayab na rahe)
        const onLost = (e) => {
            e.preventDefault();
            stop();
        };
        const onRestored = () => setGen((g) => g + 1);
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);
        canvas.dataset.ready = "1";

        return () => {
            stop();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
            canvas.removeEventListener("pg-calm", onCalm);
            window.removeEventListener(THEME_EVENT, onTheme);
            canvas.removeEventListener("webglcontextlost", onLost);
            canvas.removeEventListener("webglcontextrestored", onRestored);
            // Note: loseContext() nahi: React StrictMode (dev) effect do baar chalata hai,
            // aur lose kiya hua context usi canvas par wapas nahi milta (silk gayab ho jata tha).
            gl.deleteBuffer(buf);
            gl.deleteProgram(prog);
        };
    }, [scale, gen, ready]);

    return <canvas key={gen} ref={canvasRef} aria-hidden className="lp-fluid" />;
}
