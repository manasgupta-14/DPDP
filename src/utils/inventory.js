const pick = (obj, keys) => {
    for (const k of keys) {
        const v = obj?.[k] ?? obj?.[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
};

export function normalizeInventory(i) {
    return {
        id: pick(i, ["dataInventoryId", "id"]),
        name: pick(i, ["name"]) || "Untitled data point",
        category: pick(i, ["dataCategory"]) || "",
        purpose: pick(i, ["purpose"]) || "",
        source: pick(i, ["dataSource"]) || "",
        storage: pick(i, ["storageLocation"]) || "",
        retentionDays: pick(i, ["retentionPeriodDays"]),
        status: pick(i, ["status"]) || "Active",
        createdAt: pick(i, ["createdAt"]),
    };
}
