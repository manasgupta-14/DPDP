import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PageLoader from "../components/shared/PageLoader.jsx";
import Navbar from "../components/public/Navbar.jsx";
import LanguageSwitcher from "../i18n/LanguageSwitcher.jsx";

export default function PublicLayout() {
    const { pathname } = useLocation();
    return (
        <>
            {pathname === "/" ? <Navbar /> : <LanguageSwitcher className="fixed right-4 top-4 z-50" />}
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </>
    );
}
