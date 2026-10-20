/* Users API calls — mirrors Backend/src/modules/users */

import { api, apiForm } from "./api";
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
  storeImage?: File | string | null;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
} | FormData) {
  if (input instanceof FormData) {
    return apiForm<{ message: string; sellerProfile: SellerProfile; user?: User }>(
      "/users/seller/apply",
      input,
      "POST",
    );
  }

  if (input.storeImage instanceof File) {
    const form = new FormData();
    Object.entries(input).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (val instanceof File) {
          form.append(key, val);
        } else {
          form.append(key, String(val));
        }
      }
    });
    return apiForm<{ message: string; sellerProfile: SellerProfile; user?: User }>(
      "/users/seller/apply",
      form,
      "POST",
    );
  }

  return api<{ message: string; sellerProfile: SellerProfile; user?: User }>(
    "/users/seller/apply",
    { method: "POST", body: input },
  );
}

export async function updateProfile(input: {
  fullName?: string;
  contactNumber?: string;
  profileImage?: File | string | null;
  storeImage?: File | string | null;
  description?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
} | FormData) {
  if (input instanceof FormData) {
    return apiForm<{ message?: string; user: User }>("/users/me", input, "PATCH");
  }

  const hasFiles = input.profileImage instanceof File || input.storeImage instanceof File;
  if (hasFiles) {
    const form = new FormData();
    Object.entries(input).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        if (val instanceof File) {
          form.append(key, val);
        } else {
          form.append(key, String(val));
        }
      } else if (val === null) {
        form.append(key, "");
      }
    });
    return apiForm<{ message?: string; user: User }>("/users/me", form, "PATCH");
  }

  return api<{ message?: string; user: User }>("/users/me", {
    method: "PATCH",
    body: input,
  });
}
