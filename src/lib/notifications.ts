import { api } from "./api";

export type NavigationSummary = {
  cart: number;
  wishlist: number;
  orders: number;
  messages: number;
  offers: number;
  offersBuyer: number;
  offersSeller: number;
};

export function getNavigationSummary() {
  return api<NavigationSummary>("/notifications/navigation-summary");
}
