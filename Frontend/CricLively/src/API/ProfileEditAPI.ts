import { api } from "./client";
import type { MyProfile, Role } from "../lib/auth";

export interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string; // yyyy-MM-dd or ""
  mobileNumber: string;
}

const body = (info: PersonalInfo) => ({ ...info, dob: info.dob || null });

// ---- every logged-in person: ONLY their own profile (the server decides who "me" is)
export const updateMyInfo = (info: PersonalInfo) =>
  api<MyProfile>("/profile/me", { method: "PUT", body: body(info) });

// ---- admin only (the server rejects everybody else with 403)
export const adminListProfiles = () => api<MyProfile[]>("/admin/profiles");

export const adminGetProfile = (profileId: string) =>
  api<MyProfile>(`/admin/profiles/${profileId}`);

export const adminUpdateInfo = (profileId: string, info: PersonalInfo) =>
  api<MyProfile>(`/admin/profiles/${profileId}`, { method: "PUT", body: body(info) });

export const adminUpdateRoles = (profileId: string, roles: Role[]) =>
  api(`/admin/profiles/${profileId}/roles`, { method: "PUT", body: { roles } });
