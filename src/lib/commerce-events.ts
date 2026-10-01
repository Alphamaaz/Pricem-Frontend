export const COMMERCE_CHANGED_EVENT = "pricem:commerce-changed";

/** Notify navbar badges after a cart, wishlist, payment, or order mutation. */
export function notifyCommerceChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COMMERCE_CHANGED_EVENT));
  }
}
