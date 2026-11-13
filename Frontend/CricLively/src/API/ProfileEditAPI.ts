import { api } from "./client";
import type { MyProfile, Role } from "../lib/auth";

export interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string; // yyyy-MM-dd or ""
  email: string;
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

// ---- "I want to be an organizer"
export const requestOrganizer = (reason: string) =>
  api<MyProfile>("/profile/me/organizer-request", { method: "POST", body: { reason } });

export const cancelOrganizerRequest = () =>
  api<MyProfile>("/profile/me/organizer-request", { method: "DELETE" });

export const adminOrganizerRequests = () => api<MyProfile[]>("/admin/organizer-requests");

export const adminApproveOrganizer = (profileId: string) =>
  api<MyProfile>(`/admin/organizer-requests/${profileId}/approve`, { method: "POST" });

export const adminRejectOrganizer = (profileId: string) =>
  api<MyProfile>(`/admin/organizer-requests/${profileId}/reject`, { method: "POST" });

// ---- email verification
export interface SendVerificationResponse {
  alreadyVerified: boolean;
  sentViaSmtp?: boolean;
  email: string;
  expiresInMinutes?: number;
  message: string;
}

export const sendVerificationEmail = () =>
  api<SendVerificationResponse>("/profile/me/send-verification", { method: "POST" });

export const verifyMyEmail = (code: string) =>
  api<MyProfile>("/profile/me/verify-email", { method: "POST", body: { code } });

export const verifyEmailPublic = (email: string, code: string) =>
  api<{ verified: boolean; email: string; message: string }>("/profile/verify-email", {
    method: "POST",
    body: { email, code },
  });
