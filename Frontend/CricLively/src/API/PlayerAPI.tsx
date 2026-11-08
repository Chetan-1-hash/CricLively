import type { LoginRequest } from "../components/data/DTO";
import { api } from "./client";

export const playerLogin = (request: LoginRequest) =>
  api("/profile/login", { method: "POST", body: request, redirectOn401: false });


export interface AdminLoginResponse {
  playerId: string;
  firstName: string;
  role: "ADMIN";
  message: string;
}

export const adminLogin = (request: LoginRequest) =>
  api<AdminLoginResponse>("/admin/login", { method: "POST", body: request, redirectOn401: false });

export const adminMe = () =>
  api("/admin/me", { redirectOn401: false })
    .then(() => true)
    .catch(() => false);

export const adminLogout = () => api("/admin/logout", { method: "POST" });