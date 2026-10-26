import { useLocation } from "react-router-dom";

export function useDpiaBase() {
    return useLocation().pathname.startsWith("/dpo") ? "/dpo/dpia" : "/dashboard/dpia";
}
