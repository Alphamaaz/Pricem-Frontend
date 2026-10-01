/* Wishlist API — mirrors Backend/src/modules/wishlist */

import { api } from "./api";
import type { Product } from "./products";

export interface WishlistItem {
  /** Populated product — null if the product was hard-deleted */
  product: Product | null;
  addedAt?: string;
}

export interface Wishlist {
  _id: string;
  user: string;
  items: WishlistItem[];
}

export async function getWishlist() {
  return api<{ wishlist: Wishlist }>("/wishlist");
}

export async function addWishlistItem(productId: string) {
  return api<{ message: string; wishlist: Wishlist }>("/wishlist/items", {
    method: "POST",
    body: { productId },
  });
}

export async function removeWishlistItem(productId: string) {
  return api<{ message: string; wishlist: Wishlist }>(
    `/wishlist/items/${productId}`,
    { method: "DELETE" },
  );
}

export async function clearWishlist() {
  return api<{ message: string; wishlist: Wishlist }>("/wishlist", {
    method: "DELETE",
  });
}
