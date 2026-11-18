import { useCallback, useEffect, useState } from "react";
import { getMyReports } from "../../api/breach.js";
import IncidentForm from "../../components/user/IncidentForm.jsx";
import MyReportsList from "../../components/user/MyReportsList.jsx";
import { timeOf } from "../../utils/breach.js";

const FALLBACK_NOTICE =
    "This list shows the reports you submitted from this device.";

export default function MySecurityReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const apply = (res) => {
        if (res.ok) {
            setReports([...res.data].sort((a, b) => timeOf(b.reportedAt) - timeOf(a.reportedAt)));
            setNotice(res.fallback ? FALLBACK_NOTICE : "");
            setError("");
        } else {
            setError(res.error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const load = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true);
        apply(await getMyReports());
    }, []);

    useEffect(() => {
        let active = true;
        getMyReports().then((res) => {
            if (active) apply(res);
        });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="space-y-6" style={{ animation: "pg-rise .6s ease-out both" }}>
            <div>
                <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">My Security Reports</h1>
                <p className="mt-1 text-sm text-ink-3">Report suspicious activity and follow how the security team responds.</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <IncidentForm onSubmitted={() => load(true)} />
                <MyReportsList reports={reports} loading={loading} refreshing={refreshing} error={error} notice={notice} onRefresh={() => load(true)} />
            </div>
        </div>
    );
}
