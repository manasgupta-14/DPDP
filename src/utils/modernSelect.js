
const SEARCH_AFTER = 8;
const HOVER_OPEN_MS = 160;
const HOVER_CLOSE_MS = 280;
let state = null;
let hoverTimer = 0;
let leaveTimer = 0;

const isEnhanceable = (el) =>
    el instanceof HTMLSelectElement &&
    !el.multiple &&
    !(el.size > 1) &&
    !el.disabled &&
    !el.closest("[data-native-select]");

function optionList(select) {
    const out = [];
    for (const child of select.children) {
        if (child instanceof HTMLOptGroupElement) {
            out.push({ group: child.label });
            for (const o of child.children) if (o instanceof HTMLOptionElement && !o.hidden) out.push({ option: o });
        } else if (child instanceof HTMLOptionElement && !child.hidden) {
            out.push({ option: child });
        }
    }
    return out;
}

function choose(select, value) {
    if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    close(true);
}

function position() {
    if (!state) return;
    const { select, pop } = state;
    const r = select.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return close(false);
    const width = Math.max(r.width, 200);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    pop.style.width = `${width}px`;
    pop.style.left = `${left}px`;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const wanted = Math.min(pop.scrollHeight, 320);
    const flip = below < Math.min(wanted, 220) && above > below;
    pop.dataset.side = flip ? "top" : "bottom";
    pop.style.maxHeight = `${Math.max(140, Math.min(320, flip ? above : below))}px`;
    if (flip) {
        pop.style.top = "";
        pop.style.bottom = `${window.innerHeight - r.top + 6}px`;
    } else {
        pop.style.bottom = "";
        pop.style.top = `${r.bottom + 6}px`;
    }
}

function setActive(index, scroll = true) {
    if (!state) return;
    const enabled = state.items.filter((it) => !it.disabled && !it.el.hidden);
    if (!enabled.length) return;
    const clamped = Math.max(0, Math.min(index, enabled.length - 1));
    state.items.forEach((it) => it.el.classList.remove("is-active"));
    const item = enabled[clamped];
    item.el.classList.add("is-active");
    state.active = clamped;
    if (scroll) item.el.scrollIntoView({ block: "nearest" });
}

function filter(q) {
    if (!state) return;
    const term = q.trim().toLowerCase();
    let shown = 0;
    state.items.forEach((it) => {
        const hit = !term || it.text.toLowerCase().includes(term);
        it.el.hidden = !hit;
        if (hit) shown += 1;
    });
    state.empty.hidden = shown > 0;
    state.pop.querySelectorAll(".pg-select-group").forEach((g) => { g.hidden = !!term; });
    setActive(0, false);
}

function open(select, viaHover = false) {
    clearTimeout(leaveTimer);
    close(false);
    const entries = optionList(select);
    if (!entries.some((e) => e.option)) return;

    const pop = document.createElement("div");
    pop.className = "pg-select-pop";
    pop.setAttribute("role", "listbox");
    const labelText = select.getAttribute("aria-label") || select.closest("label")?.childNodes[0]?.textContent?.trim();
    if (labelText) pop.setAttribute("aria-label", labelText);

    let search = null;
    if (entries.filter((e) => e.option).length > SEARCH_AFTER) {
        search = document.createElement("input");
        search.type = "text";
        search.className = "pg-select-search";
        search.placeholder = "Search…";
        search.setAttribute("aria-label", "Search options");
        pop.appendChild(search);
    }

    const list = document.createElement("div");
    list.className = "pg-select-list";
    pop.appendChild(list);

    const items = [];
    entries.forEach((e) => {
        if (e.group) {
            const g = document.createElement("div");
            g.className = "pg-select-group";
            g.textContent = e.group;
            list.appendChild(g);
            return;
        }
        const o = e.option;
        const el = document.createElement("div");
        el.className = "pg-select-item";
        el.setAttribute("role", "option");
        const selected = o.value === select.value && o.selected;
        el.setAttribute("aria-selected", String(selected));
        if (o.disabled) el.setAttribute("aria-disabled", "true");
        const text = document.createElement("span");
        text.className = "pg-select-text";
        text.textContent = o.textContent;
        el.appendChild(text);
        const tick = document.createElement("span");
        tick.className = "pg-select-tick";
        tick.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
        el.appendChild(tick);
        el.addEventListener("mousedown", (ev) => ev.preventDefault());
        el.addEventListener("click", () => { if (!o.disabled) choose(select, o.value); });
        el.addEventListener("mousemove", () => {
            const enabled = items.filter((it) => !it.disabled && !it.el.hidden);
            const idx = enabled.findIndex((it) => it.el === el);
            if (idx >= 0 && idx !== state?.active) setActive(idx, false);
        });
        list.appendChild(el);
        items.push({ el, value: o.value, text: o.textContent || "", disabled: o.disabled });
    });

    const empty = document.createElement("div");
    empty.className = "pg-select-empty";
    empty.textContent = "No match";
    empty.hidden = true;
    list.appendChild(empty);

    document.body.appendChild(pop);
    select.classList.add("pg-select-open");
    select.setAttribute("aria-expanded", "true");

    const onScroll = (ev) => { if (!pop.contains(ev.target)) position(); };
    const onResize = () => position();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    pop.addEventListener("mouseenter", () => clearTimeout(leaveTimer));
    pop.addEventListener("mouseleave", () => scheduleHoverClose());

    state = {
        select,
        pop,
        items,
        empty,
        viaHover,
        active: 0,
        cleanup: () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        },
    };

    position();
    const enabled = items.filter((it) => !it.disabled);
    const current = enabled.findIndex((it) => it.value === select.value);
    setActive(current >= 0 ? current : 0);

    if (search) {
        search.addEventListener("input", () => { if (state) state.viaHover = false; filter(search.value); });
        if (!viaHover) requestAnimationFrame(() => search.focus());
    }
}

function scheduleHoverClose() {
    if (!state || !state.viaHover) return;
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
        if (state?.viaHover && !state.pop.matches(":hover") && !state.select.matches(":hover")) close(false);
    }, HOVER_CLOSE_MS);
}

function onMouseOver(e) {
    const t = e.target;
    if (!isEnhanceable(t)) return;
    clearTimeout(leaveTimer);
    if (state?.select === t) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
        if (t.matches(":hover") && document.contains(t) && !t.disabled) open(t, true);
    }, HOVER_OPEN_MS);
}

function onMouseOut(e) {
    const t = e.target;
    if (!(t instanceof HTMLSelectElement)) return;
    clearTimeout(hoverTimer);
    if (state?.select === t) scheduleHoverClose();
}

function close(refocus) {
    if (!state) return;
    const { select, pop, cleanup } = state;
    cleanup();
    state = null;
    select.classList.remove("pg-select-open");
    select.setAttribute("aria-expanded", "false");
    pop.classList.add("is-leaving");
    setTimeout(() => pop.remove(), 140);
    if (refocus) select.focus({ preventScroll: true });
}

function onMouseDown(e) {
    const target = e.target;
    if (state && state.pop.contains(target)) return;
    if (isEnhanceable(target) && e.button === 0) {
        e.preventDefault();
        clearTimeout(hoverTimer);
        if (state?.select === target) {
            if (state.viaHover) { state.viaHover = false; return; }
            return close(true);
        }
        target.focus({ preventScroll: true });
        open(target);
        return;
    }
    if (state) close(false);
}

function onKeyDown(e) {
    if (state) {
        const focusInside = state.select === document.activeElement || state.pop.contains(document.activeElement);
        if (state.viaHover && !focusInside && e.key !== "Escape") return;
        const enabled = state.items.filter((it) => !it.disabled && !it.el.hidden);
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            close(true);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            state.viaHover = false;
            setActive(state.active + 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(state.active - 1);
        } else if (e.key === "Home") {
            e.preventDefault();
            setActive(0);
        } else if (e.key === "End") {
            e.preventDefault();
            setActive(enabled.length - 1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = enabled[state.active];
            if (item) choose(state.select, item.value);
        } else if (e.key === "Tab") {
            close(false);
        }
        return;
    }
    const t = e.target;
    if (isEnhanceable(t) && (e.key === "Enter" || e.key === " " || (e.altKey && e.key === "ArrowDown"))) {
        e.preventDefault();
        open(t);
    }
}

export function installModernSelect() {
    if (typeof window === "undefined" || window.__pgModernSelect) return;
    window.__pgModernSelect = true;
    if (window.matchMedia?.("(hover: none), (pointer: coarse)").matches) return;
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("blur", () => close(false));
}
