import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader.jsx";
import Navbar from "../components/public/Navbar.jsx";

// Website ka navbar sirf home par; login / register ka apna logo aur "Back to home" hai.
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
