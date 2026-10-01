/* Users API calls — mirrors Backend/src/modules/users */

import { api } from "./api";
import type { Role, SellerProfile, User } from "./types";

export async function switchRole(role: Exclude<Role, "admin">) {
  return api<{ message: string; activeRole: Role }>("/users/switch-role", {
    method: "POST",
    body: { role },
  });
}

export async function applyToSell(input: {
  storeName: string;
  storeSlug?: string;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}) {
  return api<{ message: string; sellerProfile: SellerProfile; user?: User }>(
    "/users/seller/apply",
    { method: "POST", body: input },
  );
}

export async function updateProfile(input: {
  fullName?: string;
  contactNumber?: string;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}) {
  return api<{ message?: string; user: User }>("/users/me", {
    method: "PATCH",
    body: input,
  });
}
