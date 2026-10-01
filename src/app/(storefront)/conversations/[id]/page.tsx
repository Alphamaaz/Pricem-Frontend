"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getConversation, getMessages, markConversationRead, sendMessage } from "@/lib/chat";
import type { ChatMessage, Conversation } from "@/lib/chat";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { getRealtimeSocket } from "@/lib/realtime";
import { getMe } from "@/lib/auth";

function eventText(message: ChatMessage) {
  const action = message.event?.action;
  const price = message.event?.price;
  if (!action || price == null) return "Offer updated";
  return `Offer ${action}: ₦${price.toLocaleString()}`;
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }

    Promise.all([getConversation(params.id), getMessages(params.id), getMe()])
      .then(([conversationResponse, messagesResponse, userResponse]) => {
        setConversation(conversationResponse.conversation);
        setMessages(messagesResponse.messages);
        setNextCursor(messagesResponse.nextCursor);
        setCurrentUserId(userResponse.user._id);
      })
      .catch((requestError) => {
        setError(requestError instanceof ApiRequestError ? requestError.message : "Could not load this conversation.");
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    if (!conversation || conversation.status !== "open") return;
    const socket = getRealtimeSocket();
    const onMessage = ({ conversationId, message }: { conversationId: string; message: ChatMessage }) => {
      if (conversationId !== params.id) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
      void markConversationRead(params.id);
    };
    socket?.on("message:new", onMessage);
    return () => { socket?.off("message:new", onMessage); };
  }, [conversation, params.id]);

  async function loadOlderMessages() {
    if (!nextCursor) return;
    setLoadingOlder(true);
    try {
      const response = await getMessages(params.id, nextCursor);
      setMessages((current) => [...response.messages, ...current]);
      setNextCursor(response.nextCursor);
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setSending(true);
    try {
      const response = await sendMessage(params.id, text.trim());
      setMessages((current) => [...current, response.chatMessage]);
      setText("");
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function insertQuickPrompt(promptText: string) {
    setText((prev) => (prev ? `${prev} ${promptText}` : promptText));
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl py-24 flex justify-center"><div className="h-10 w-56 rounded-full bg-sunken animate-pulse" /></div>;
  }

  if (!conversation) {
    return <div className="mx-auto max-w-3xl py-16">{error && <Alert kind="error">{error}</Alert>}</div>;
  }

  const product = typeof conversation.product === "string" ? null : conversation.product;
  const isOrderWorkspace = conversation.scope === "order";
  const isOpen = conversation.status === "open";
  const isBuyer = conversation.buyer === currentUserId;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <Link
          href={product ? `/products/${product._id}` : "/orders"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {product ? "Listing" : "Orders"}
        </Link>
        <span className="text-xs text-muted">
          Role: <strong className="text-ink capitalize">{isBuyer ? "Buyer" : "Seller"}</strong>
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {/* Workspace Banner */}
        <header className="border-b border-line bg-gradient-to-r from-surface via-cream/50 to-primary-soft/30 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {product?.coverImage?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(product.coverImage.url)}
                  alt={product.title}
                  className="h-14 w-14 rounded-2xl border border-line object-cover shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${
                    isOrderWorkspace
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {isOrderWorkspace ? <CheckCircle2 className="h-3 w-3" /> : null}
                    {isOrderWorkspace ? "Transaction Chat" : "Listing Inquiry"}
                  </span>
                  {typeof conversation.order === "object" && conversation.order?.total && (
                    <span className="text-xs font-bold text-ink bg-sunken px-2.5 py-0.5 rounded-full border border-line">
                      Agreed: ₦{conversation.order.total.toLocaleString()}
                    </span>
                  )}
                </div>
                <h1 className="mt-1 text-base sm:text-lg font-bold text-ink truncate max-w-md">
                  {product?.title ?? "Order Workspace"}
                </h1>
              </div>
            </div>
          </div>

          {/* Contextual instruction */}
          <div className="mt-3 rounded-2xl bg-surface/90 border border-line p-3 text-xs text-body leading-relaxed flex items-start gap-2">
            {isOrderWorkspace ? (
              <>
                <Truck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-semibold">Logistics & Direct Payment Workspace: </strong>
                  Use this chat to exchange delivery address, coordinate courier pickup, and share bank/cash settlement details safely.
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-semibold">Listing Chat: </strong>
                  Ask the seller questions about product condition, availability, and specs. To negotiate price, use the <strong className="text-primary">&quot;Price Am&quot;</strong> button on the listing page.
                </div>
              </>
            )}
          </div>
        </header>

        {/* Message Thread */}
        <div className="min-h-96 max-h-[600px] overflow-y-auto space-y-3 bg-sunken/40 px-4 py-5 sm:px-6">
          {nextCursor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={loadingOlder}
              onClick={loadOlderMessages}
              className="mx-auto flex rounded-full"
            >
              Load earlier messages
            </Button>
          )}

          {messages.length === 0 && (
            <div className="py-16 text-center text-sm text-muted">
              {isOrderWorkspace
                ? "This transaction chat is open! Say hello and arrange delivery details below."
                : "Ask a question about this item to begin."}
            </div>
          )}

          {messages.map((message) => {
            const isMine = message.type === "text" && message.sender === currentUserId;
            return message.type === "text" ? (
              <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 shadow-soft sm:max-w-[75%] ${
                    isMine
                      ? "rounded-3xl rounded-br-sm bg-primary text-white"
                      : "rounded-3xl rounded-bl-sm border border-line bg-surface text-body"
                  }`}
                >
                  <p className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${isMine ? "text-white/80" : "text-primary"}`}>
                    {isMine ? "You" : isBuyer ? "Seller" : "Buyer"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                  <time className={`mt-1.5 block text-right text-[10px] ${isMine ? "text-white/70" : "text-muted"}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              </div>
            ) : (
              <div key={message._id} className="mx-auto my-2 max-w-sm rounded-xl bg-surface border border-line p-2.5 text-center text-xs text-muted shadow-xs">
                {message.type === "offer" ? (
                  <span className="font-semibold text-primary">{eventText(message)}</span>
                ) : (
                  message.text
                )}
              </div>
            );
          })}
        </div>

        {/* Input & Quick Chips */}
        <div className="border-t border-line bg-surface p-4">
          {error && <div className="mb-3"><Alert kind="error">{error}</Alert></div>}

          {/* Quick logistics & payment prompt chips in order workspace */}
          {isOpen && isOrderWorkspace && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertQuickPrompt("Here is my delivery address: ")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-sunken px-3 py-1 text-xs font-medium text-body hover:border-primary hover:text-primary transition-colors"
              >
                <MapPin className="h-3 w-3 text-primary" /> Delivery address
              </button>
              <button
                type="button"
                onClick={() => insertQuickPrompt("You can reach me at phone number: ")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-sunken px-3 py-1 text-xs font-medium text-body hover:border-primary hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3 text-success" /> Share phone
              </button>
              <button
                type="button"
                onClick={() => insertQuickPrompt("Please send your bank account details for payment on delivery: ")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-sunken px-3 py-1 text-xs font-medium text-body hover:border-primary hover:text-primary transition-colors"
              >
                <CreditCard className="h-3 w-3 text-accent" /> Payment details
              </button>
            </div>
          )}

          {isOpen ? (
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1500}
                rows={2}
                placeholder={
                  isOrderWorkspace
                    ? "Arrange courier delivery, meetup location, or payment..."
                    : "Ask about item condition, warranty, or delivery..."
                }
                className="min-h-12 flex-1 resize-none rounded-2xl border border-line bg-sunken/60 px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white hover:bg-primary-dark disabled:opacity-40 transition-transform active:scale-95 shadow-soft"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted py-2">
              Messaging is no longer available for this conversation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
