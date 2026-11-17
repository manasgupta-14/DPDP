const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
};

export const DEFAULT_COLOR = "#2B59C3";
export const DEFAULT_LAYOUT = "Standard";

export const toCode = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const norm = (v) => String(v || "").trim().toLowerCase();
export const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim());

export function normalizeTemplate(t) {
    const purposes = pick(t, ["purposes"]);
    const logoUrl = pick(t, ["logoUrl"]);
    const primaryColor = pick(t, ["primaryColor"]);
    const layout = pick(t, ["layout"]);
    return {
        id: String(pick(t, ["id", "templateId"]) ?? ""),
        code: String(pick(t, ["code"]) ?? ""),
        name: String(pick(t, ["name"]) ?? "Template"),
        description: String(pick(t, ["description"]) ?? ""),
        purposes: Array.isArray(purposes) ? purposes.map(String) : [],
        layout: layout === undefined ? undefined : String(layout ?? ""),
        createdAt: pick(t, ["createdAt"]) ?? null,
        logoUrl: logoUrl === undefined ? undefined : String(logoUrl ?? ""),
        primaryColor: primaryColor === undefined ? undefined : String(primaryColor ?? ""),
    };
}

export function normalizePurposeOption(p) {
    return { code: String(pick(p, ["code"]) ?? ""), name: String(pick(p, ["name"]) ?? pick(p, ["code"]) ?? "Purpose") };
}

export const formatDate = (value) => {
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not recorded";
};
