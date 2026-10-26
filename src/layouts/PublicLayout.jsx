import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader.jsx";
import Navbar from "../components/public/Navbar.jsx";

export default function PublicLayout() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </>
    );
}
