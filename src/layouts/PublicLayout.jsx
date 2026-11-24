import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader.jsx";
import Navbar from "../components/public/Navbar.jsx";

export default function PublicLayout() {
    const { pathname } = useLocation();
    return (
        <>
            {pathname === "/" && <Navbar />}
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </>
    );
}
