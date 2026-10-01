/* Cart API — mirrors Backend/src/modules/cart */

import { api } from "./api";
import type { VariantSelection } from "./offers";

export interface CartItem {
  _id: string;
  product: string;
  seller: string;
  storeName: string;
  storeSlug: string;
  title: string;
  coverImage: { url: string; alt?: string };
  variantSelections: VariantSelection[];
  variantKey: string;
  priceSnapshot: number;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
}

export interface CartTotals {
  subtotal: number;
  totalItems: number;
}

export interface CartResponse {
  message?: string;
  cart: Cart;
  totals: CartTotals;
}

export async function getCart() {
  return api<CartResponse>("/cart");
}

export async function addCartItem(input: {
  productId: string;
  quantity?: number;
  variantSelections?: VariantSelection[];
}) {
  return api<CartResponse>("/cart/items", { method: "POST", body: input });
}

export async function updateCartItem(itemId: string, quantity: number) {
  return api<CartResponse>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export async function removeCartItem(itemId: string) {
  return api<CartResponse>(`/cart/items/${itemId}`, { method: "DELETE" });
}

export async function clearCart() {
  return api<CartResponse>("/cart", { method: "DELETE" });
}
