export const MAX_DEPTH = 6;

export const KINDS = ["Zone", "Circle", "Division", "Subdivision", "Branch", "Other"];

const KIND_RANK = { Zone: 1, Circle: 2, Division: 3, Subdivision: 4, Branch: 5 };

export function allowedKinds(parent) {
    if (!parent) return KINDS;
    const rank = KIND_RANK[parent.kind];
    if (!rank) return ["Other"];
    return KINDS.filter((k) => k === "Other" || KIND_RANK[k] > rank);
}

export function kindRuleMessage(parent) {
    const allowed = allowedKinds(parent).filter((k) => k !== "Other");
    const lower = allowed.length ? allowed.join(", ") : "no further level";
    return `A ${parent.kind} can only contain: ${lower}${allowed.length ? " or Other" : ", only Other"}.`;
}

const KIND_TONES = {
    Zone: "bg-brand/10 text-brand-ink ring-brand/25",
    Circle: "bg-brand/15 text-info-ink ring-focus/45",
    Division: "bg-ink-2/10 text-ink-2 ring-ink-2/20",
    Subdivision: "bg-warn/10 text-warn-ink ring-warn/25",
    Branch: "bg-ok/10 text-ok-ink ring-ok/25",
    Other: "bg-muted/10 text-ink-3 ring-muted/20",
};

export const kindTone = (kind) => KIND_TONES[kind] || KIND_TONES.Other;

const pick = (value, ...keys) => {
    for (const key of keys) {
        if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
    }
    return null;
};

export function normalizeUnit(raw) {
    const children = pick(raw, "children", "Children");
    return {
        id: String(pick(raw, "id", "Id") ?? ""),
        name: String(pick(raw, "name", "Name") ?? ""),
        kind: String(pick(raw, "unitType", "UnitType", "kind", "type", "Type") ?? "Other"),
        code: String(pick(raw, "unitCode", "UnitCode", "code", "Code") ?? ""),
        parentId: pick(raw, "parentId", "ParentId"),
        active: ![false, 0, "false", "False", "0"].includes(pick(raw, "isActive", "IsActive", "active")),
        principals: Number(pick(raw, "principalsCount", "PrincipalsCount") ?? 0) || 0,
        children: Array.isArray(children) ? children.map(normalizeUnit) : [],
    };
}

export function flatten(tree, depth = 1, parent = null, out = []) {
    for (const unit of tree) {
        out.push({ ...unit, depth, parent });
        flatten(unit.children, depth + 1, unit, out);
    }
    return out;
}

export function suggestKind(parent) {
    if (!parent) return "Zone";
    return allowedKinds(parent)[0];
}

export function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
}

export const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function summarize(flat) {
    return {
        units: flat.length,
        active: flat.filter((u) => u.active).length,
        principals: flat.reduce((sum, u) => sum + u.principals, 0),
    };
}

export function visibleRows(tree, collapsed, query) {
    const q = query.trim().toLowerCase();
    const rows = [];

    const matches = (unit) => unit.name.toLowerCase().includes(q) || unit.code.toLowerCase().includes(q) || unit.kind.toLowerCase().includes(q);
    const hasMatch = (unit) => matches(unit) || unit.children.some(hasMatch);

    const walk = (nodes, depth) => {
        for (const unit of nodes) {
            if (q && !hasMatch(unit)) continue;
            rows.push({ unit, depth });
            if (q || !collapsed.has(unit.id)) walk(unit.children, depth + 1);
        }
    };

    walk(tree, 1);
    return rows;
}
