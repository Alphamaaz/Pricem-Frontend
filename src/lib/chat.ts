import { api } from "./api";

export interface ConversationProduct {
  _id: string;
  title: string;
  coverImage?: { url: string; alt?: string };
  status?: string;
}

export interface Conversation {
  _id: string;
  buyer: string;
  seller: string;
  product: ConversationProduct | string;
  order?: { _id: string; orderStatus: string; paymentStatus: string; total: number } | string;
  scope: "listing" | "order";
  status: "open" | "closed" | "read_only";
  lastMessagePreview: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCount?: number;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender?: string;
  type: "text" | "system" | "offer";
  text?: string;
  event?: { action?: string; offer?: string; price?: number };
  createdAt: string;
}

export async function openListingConversation(productId: string) {
  return api<{ message: string; conversation: Conversation }>(
    `/chat/products/${productId}/conversation`,
    { method: "POST" },
  );
}

export async function listConversations() {
  return api<{ conversations: Conversation[]; total: number; page: number; pages: number }>("/chat/conversations");
}

export async function getUnreadConversationCount() {
  return api<{ count: number }>("/chat/conversations/unread-count");
}

export async function getConversation(id: string) {
  return api<{ conversation: Conversation }>(`/chat/conversations/${id}`);
}

export async function getOrderConversation(orderId: string) {
  return api<{ conversation: Conversation }>(`/chat/orders/${orderId}/conversation`);
}

export async function getMessages(id: string, before?: string) {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  return api<{ messages: ChatMessage[]; nextCursor: string | null }>(
    `/chat/conversations/${id}/messages${query}`,
  );
}

export async function sendMessage(id: string, text: string) {
  return api<{ message: string; chatMessage: ChatMessage }>(
    `/chat/conversations/${id}/messages`,
    { method: "POST", body: { text } },
  );
}

export async function markConversationRead(id: string) {
  return api<{ message: string }>(`/chat/conversations/${id}/read`, { method: "PATCH" });
}
