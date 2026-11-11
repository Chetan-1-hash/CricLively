// Who is logged in, kept in this browser tab (sessionStorage).
// The REAL login lives in the server's session cookie - this is only so screens can
// show/hide things quickly. The server always re-checks every request.

export type Role = "ADMIN" | "ORGANIZER" | "PLAYER";

export interface MyProfile {
  profileId: string;
  playerId: string | null; // null for an admin who is not also a player
  email: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dob: string | null;
  mobileNumber: string | null;
  roles: Role[];
  isCricketDetailsCompleted: boolean | null;
  battingStyle: string | null;
  bowlingStyle: string | null;
  playingRole: string | null;
  image: string | null;
  organizerRequestStatus?: "PENDING" | "REJECTED" | null;
  organizerRequestReason?: string | null;
  organizerRequestAt?: string | null;
  message?: string | null;
}

const KEY = "me";

export function saveSession(me: MyProfile) {
  sessionStorage.setItem(KEY, JSON.stringify(me));
  // other screens already read "playerId" from sessionStorage
  if (me.playerId) sessionStorage.setItem("playerId", me.playerId);
  else sessionStorage.removeItem("playerId");
}

export function getSession(): MyProfile | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MyProfile) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem("playerId");
}

export function hasAnyRole(me: MyProfile | null, roles: Role[]): boolean {
  return !!me && me.roles.some((r) => roles.includes(r));
}

/** Organizers and admins can create tournaments, teams, matches and score. */
export const canOrganize = () => hasAnyRole(getSession(), ["ORGANIZER", "ADMIN"]);

export const isAdmin = () => hasAnyRole(getSession(), ["ADMIN"]);
