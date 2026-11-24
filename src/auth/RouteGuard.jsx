import { Link, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { permissionForPath } from "../config/navigation.js";
import Icon from "../components/shared/Icon.jsx";
import { useAccess } from "./access.js";

export default function RouteGuard() {
    const { pathname } = useLocation();
    const outletContext = useOutletContext();
    const { can } = useAccess();
    const needed = permissionForPath(pathname);

    if (needed && !can(needed)) {
        return (
            <div className="mx-auto max-w-lg py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warn-soft text-warn-ink">
                    <Icon name="lock" className="h-7 w-7" />
                </span>
                <h1 className="mt-4 text-xl font-bold text-ink">You don&rsquo;t have access to this page</h1>
                <p className="mt-2 text-sm text-ink-3">
                    Your role does not include the <span className="font-mono text-xs">{[].concat(needed).join(" / ")}</span> permission. Ask an administrator to add it in Roles &amp; permissions.
                </p>
                <Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-inverse px-4 py-2.5 text-sm font-semibold text-white">Back to dashboard</Link>
            </div>
        );
    }
    return <Outlet context={outletContext} />;
}
