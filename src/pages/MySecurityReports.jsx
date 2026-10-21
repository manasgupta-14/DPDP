import { useCallback, useEffect, useState } from "react";
import { getMyReports } from "../api/breach.js";
import IncidentForm from "../components/breach/IncidentForm.jsx";
import MyReportsList from "../components/breach/MyReportsList.jsx";
import { timeOf } from "../utils/breach.js";

export default function MySecurityReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async (quiet = false) => {
        if (quiet) setRefreshing(true);
        setError("");
        const res = await getMyReports();
        if (res.ok) setReports([...res.data].sort((a, b) => timeOf(b.reportedAt) - timeOf(a.reportedAt)));
        else setError(res.error);
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        let active = true;
        getMyReports().then((res) => {
            if (!active) return;
            if (res.ok) setReports([...res.data].sort((a, b) => timeOf(b.reportedAt) - timeOf(a.reportedAt)));
            else setError(res.error);
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-7">
                <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111C2E] to-[#0B1220] p-6 text-white sm:p-8">
                    <div aria-hidden className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 rounded-full bg-[#22D3EE]/15 blur-[70px]" />
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#22D3EE]">Reporter portal</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">My Security Reports</h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#CBD5E1]">Report suspicious activity and follow how the security team responds.</p>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <IncidentForm onSubmitted={() => load(true)} />
                    <MyReportsList reports={reports} loading={loading} refreshing={refreshing} error={error} onRefresh={() => load(true)} />
                </div>
            </div>
        </main>
    );
}
