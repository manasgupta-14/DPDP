import { useLocation } from "react-router-dom";

// The same DPIA screens are mounted for Admins (/dashboard/dpia) and DPOs (/dpo/dpia).
export function useDpiaBase() {
    return useLocation().pathname.startsWith("/dpo") ? "/dpo/dpia" : "/dashboard/dpia";
}
