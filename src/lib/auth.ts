/* Auth API calls — mirrors Backend/src/modules/auth */

import { api, tokenStore } from "./api";
import type { AuthResponse, User } from "./types";
import { disconnectRealtime } from "./realtime";

export async function register(input: {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
}) {
  return api<{ message: string; user?: User; emailVerified?: boolean }>(
    "/auth/register",
    { method: "POST", body: input, skipRefresh: true },
  );
}

export async function verifyEmail(input: { email: string; otp: string }) {
  return api<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: input,
    skipRefresh: true,
  });
}

export async function resendVerification(email: string) {
  return api<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: { email },
    skipRefresh: true,
  });
}

export async function login(input: { email: string; password: string }) {
  const data = await api<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    skipRefresh: true,
  });
  tokenStore.set(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await api<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    disconnectRealtime();
    tokenStore.clear();
  }
}

export async function forgotPassword(email: string) {
  return api<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    skipRefresh: true,
  });
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  password: string;
}) {
  return api<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: input,
    skipRefresh: true,
  });
}

export async function getMe() {
  return api<{ user: User }>("/auth/me");
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return api<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: input,
  });
}
