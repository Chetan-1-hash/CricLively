import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchMe } from "../API/PlayerAPI";
import { toast } from "../hooks/use-toast";
import { clearSession, getSession, hasAnyRole, saveSession, type MyProfile, type Role } from "../lib/auth";

/**
 * A gate placed around pages in App.tsx.
 *   <RequireRole />                      -> any logged-in person may enter
 *   <RequireRole roles={["ORGANIZER","ADMIN"]} />  -> only these roles may enter
 * Not logged in -> sent to /login.  Wrong role -> sent back with a message.
 */
export default function RequireRole({ roles }: { roles?: Role[] }) {
  const location = useLocation();
  const isOuterGate = roles === undefined; // the outer gate also checks the server

  const [session, setSession] = useState<MyProfile | null>(getSession);
  const [checking, setChecking] = useState(isOuterGate);

  useEffect(() => {
    if (!isOuterGate) return;
    let cancelled = false;

    fetchMe()
      .then((me) => {
        if (cancelled) return;
        saveSession(me);
        setSession(me);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession(); // server says we are not logged in (e.g. session expired)
        setSession(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOuterGate]);

  const current = isOuterGate ? session : getSession();
  const denied = !!current && !!roles && !hasAnyRole(current, roles);

  useEffect(() => {
    if (denied) {
      toast({
        title: "No access",
        description: "Only organizers and admins can open that page.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [denied]);

  if (!current) {
    if (checking) {
      return (
        <div className="min-h-[100vh] flex items-center justify-center text-foreground/70">
          Loading…
        </div>
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (denied) return <Navigate to="/showTournaments" replace />;

  return <Outlet />;
}
