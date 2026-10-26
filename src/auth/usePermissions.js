import { useCallback, useEffect, useState } from "react";
import { getMyPermissions } from "../api/permissions.js";

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
            const want = permission.toLowerCase();
            const group = `${want.split(".")[0]}.*`;
            return list.some((p) => {
                const have = p.toLowerCase();
                return have === want || have === group || have === "*";
            });
        },
        [list],
    );

    return { loading: list === null, can };
}
