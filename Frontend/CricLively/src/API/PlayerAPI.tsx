import type { LoginRequest } from "../components/data/DTO";
import type { MyProfile } from "../lib/auth";
import { api } from "./client";

// One login for everybody. The server answers with the person's roles.
export const login = (request: LoginRequest) =>
  api<MyProfile>("/profile/login", { method: "POST", body: request, redirectOn401: false });

// Who is logged in right now? (uses the session cookie)
export const fetchMe = () => api<MyProfile>("/profile/me", { redirectOn401: false });

export const logout = () => api("/profile/logout", { method: "POST", redirectOn401: false });
