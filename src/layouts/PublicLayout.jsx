import { Outlet } from "react-router-dom";
import Navbar from "../components/public/Navbar.jsx";

// Marketing / auth pages: top navbar + page content.
export default function PublicLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}
