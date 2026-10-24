"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { getConversation, getMessages, markConversationRead, sendMessage } from "@/lib/chat";
import type { ChatMessage, Conversation } from "@/lib/chat";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { getRealtimeSocket } from "@/lib/realtime";
import { getMe } from "@/lib/auth";
import { getProduct } from "@/lib/products";

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
  const [showSafety, setShowSafety] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const safetyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (safetyRef.current && !safetyRef.current.contains(event.target as Node)) {
        setShowSafety(false);
      }
    }
    if (showSafety) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSafety]);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }

    Promise.all([getConversation(params.id), getMessages(params.id), getMe()])
      .then(async ([conversationResponse, messagesResponse, userResponse]) => {
        let loadedConversation = conversationResponse.conversation;
        if (typeof loadedConversation.product === "string") {
          try {
            const productResponse = await getProduct(loadedConversation.product);
            loadedConversation = { ...loadedConversation, product: productResponse.product };
          } catch {
            // Keep the conversation usable if the listing is no longer public.
          }
        }
        setConversation(loadedConversation);
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
    if (messages.length > 0) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages.length]);

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

  async function handleSendMessage() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setSending(true);
    try {
      const response = await sendMessage(params.id, trimmed);
      setMessages((current) => [...current, response.chatMessage]);
      setText("");
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSendMessage();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
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
    <div className="chat-thread-page mx-auto max-w-3xl">
      <header className="chat-mobile-header md:hidden"><button type="button" onClick={() => router.back()} aria-label="Back to messages"><ArrowLeft /></button><span>{(isBuyer ? "Seller" : "Buyer").charAt(0)}</span><div><strong>{isBuyer ? "Seller" : "Buyer"}</strong><small>PriceAm conversation</small></div></header>
      <div className="chat-desktop-back flex items-center justify-between mb-3">
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

      <section className="chat-workspace flex flex-col h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-10.5rem)] min-h-[480px] max-h-[780px] overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
        {/* Workspace Banner */}
        <header className="chat-desktop-banner shrink-0 border-b border-line bg-gradient-to-r from-surface via-cream/50 to-primary-soft/30 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {product?.coverImage?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(product.coverImage.url)}
                  alt={product.title}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-line object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
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
                <h1 className="mt-1 text-sm sm:text-base font-bold text-ink truncate max-w-md">
                  {product?.title ?? "Order Workspace"}
                </h1>
                {product && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {typeof product.price === "number" && (
                      <span className="font-extrabold text-primary">₦{product.price.toLocaleString()}</span>
                    )}
                    {(product.location?.city || product.location?.state) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {[product.location.city, product.location.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Safety Advisory Popover / Tooltip */}
            <div className="relative shrink-0" ref={safetyRef}>
              <button
                type="button"
                onClick={() => setShowSafety((v) => !v)}
                onMouseEnter={() => setShowSafety(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-3 py-1.5 text-xs font-bold text-ink hover:bg-warning/25 transition-all shadow-xs cursor-pointer"
                title="Safety Warning & Guidelines"
              >
                <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                <span className="hidden sm:inline">Safety Advice</span>
              </button>

              {showSafety && (
                <div
                  onMouseLeave={() => setShowSafety(false)}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-84 rounded-2xl bg-surface border border-line p-4 shadow-lifted z-30 text-xs space-y-3 animate-fade-in-up"
                >
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-bold text-ink flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-warning" />
                      Platform Safety Advisory
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSafety(false)}
                      className="text-muted hover:text-ink text-sm px-1 leading-none"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="rounded-xl bg-warning/10 border border-warning/30 p-2.5 text-body leading-relaxed">
                    <strong className="text-ink font-bold block mb-0.5">⚠️ Never Pay In Advance</strong>
                    Inspect the item thoroughly before making payment directly to the seller upon delivery or meetup. Report fraudulent users immediately.
                  </div>

                  <div className="rounded-xl bg-sunken/70 border border-line p-2.5 text-body leading-relaxed flex items-start gap-2">
                    {isOrderWorkspace ? (
                      <>
                        <Truck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-ink font-semibold block mb-0.5">Order Workspace Guide</strong>
                          Use this chat to exchange meetup or delivery address, coordinate timing, and settle upon in-person inspection.
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-muted shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-ink font-semibold block mb-0.5">Listing Chat Guide</strong>
                          Ask questions about condition and specs. To negotiate price, use &quot;Price Am&quot; on the listing page.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {product && <Link href={`/products/${product._id}`} className="chat-mobile-product md:hidden">{product.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(product.coverImage.url)} alt={product.title} />
        ) : <span><Package /></span>}<div><strong>{product.title}</strong><small><MapPin /> {[product.location?.city, product.location?.state].filter(Boolean).join(", ") || "Product listing"}{typeof product.price === "number" ? ` · ₦${product.price.toLocaleString()}` : ""}</small></div><ArrowRight /></Link>}

        {/* Message Thread */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 bg-sunken/40 px-4 py-4 sm:px-6">
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Chips */}
        <div className="shrink-0 border-t border-line bg-surface p-3 sm:p-4">
          {error && <div className="mb-2"><Alert kind="error">{error}</Alert></div>}

          {/* Quick logistics prompt chips in order workspace */}
          {isOpen && isOrderWorkspace && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
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
            </div>
          )}

          {isOpen ? (
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={onKeyDown}
                maxLength={1500}
                rows={1}
                placeholder={
                  isOrderWorkspace
                    ? "Arrange courier delivery, meetup location... (Enter to send)"
                    : "Ask about item condition, warranty... (Enter to send)"
                }
                className="min-h-[48px] max-h-32 flex-1 resize-none rounded-2xl border border-line bg-sunken/60 px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow leading-normal"
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
