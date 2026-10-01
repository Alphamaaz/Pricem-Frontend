/* Mirrors Backend/src/modules/users/user.model.js */

export type Role = "buyer" | "seller" | "admin";

export interface SellerProfile {
  storeName?: string;
  storeSlug?: string;
  description?: string;
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  approvalStatus: "pending" | "approved" | "rejected";
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  roles: Role[];
  activeRole: Role;
  sellerProfile: SellerProfile | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: { field: string; message: string }[];
}
