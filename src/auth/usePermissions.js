import { useCallback, useEffect, useState } from "react";
import { getMyPermissions } from "../api/permissions.js";
import { hasPermission } from "./access.js";

export function usePermissions() {
    const [list, setList] = useState(null);

    useEffect(() => {
        let active = true;
        getMyPermissions().then((names) => {
            if (active) setList(names);
        });
        return () => {
            active = false;
        };
    }, []);

    const can = useCallback(
        (permission) => {
            if (!list) return false;
            return hasPermission(list, permission);
        },
        [list],
    );

    return { loading: list === null, can };
}
