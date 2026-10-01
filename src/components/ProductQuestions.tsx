"use client";

import { useEffect, useState } from "react";
import {
  HelpCircle,
  MessageCircleQuestion,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { ProductQuestion } from "@/lib/questions";
import { answerProductQuestion, askProductQuestion } from "@/lib/questions";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { getMe } from "@/lib/auth";
import type { User } from "@/lib/types";
import { Alert, Button } from "@/components/ui";

interface ProductQuestionsProps {
  productId: string;
  sellerId: string;
  storeName: string;
  initialQuestions?: ProductQuestion[];
}

export function ProductQuestions({
  productId,
  sellerId,
  storeName,
  initialQuestions = [],
}: ProductQuestionsProps) {
  const [questions, setQuestions] = useState<ProductQuestion[]>(initialQuestions);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [busy, setBusy] = useState<"ask" | "answer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (tokenStore.get()) {
      getMe()
        .then((res) => setCurrentUser(res.user))
        .catch(() => {});
    }
  }, []);

  const isSeller = currentUser?._id === sellerId;
  const isLoggedIn = Boolean(tokenStore.get());

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    setError(null);
    setSuccess(null);
    setBusy("ask");

    try {
      const res = await askProductQuestion(productId, questionText.trim());
      setQuestions((prev) => [res.question, ...prev]);
      setQuestionText("");
      setSuccess("Your question has been posted publicly! The seller will be notified.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not post your question.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAnswerQuestion(e: React.FormEvent, questionId: string) {
    e.preventDefault();
    if (!answerText.trim()) return;
    setError(null);
    setSuccess(null);
    setBusy("answer");

    try {
      const res = await answerProductQuestion(questionId, answerText.trim());
      setQuestions((prev) => prev.map((q) => (q._id === questionId ? res.question : q)));
      setAnsweringId(null);
      setAnswerText("");
      setSuccess("Your answer has been published publicly.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not submit your answer.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <MessageCircleQuestion className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              Questions & Answers
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Public community Q&A for this item. All visitors can see questions and seller answers.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3.5 py-1 text-xs font-bold text-muted border border-line">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          {questions.length} Question{questions.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && <div className="mt-4"><Alert kind="error">{error}</Alert></div>}
      {success && <div className="mt-4"><Alert kind="success">{success}</Alert></div>}

      {/* Ask Question Form (For buyers / visitors) */}
      {!isSeller && (
        <div className="mt-6 rounded-2xl bg-sunken/60 border border-line p-5">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2 mb-1.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            Have a question about this item?
          </h3>
          <p className="text-xs text-muted mb-4">
            Ask about specifications, condition, warranty, or availability.
          </p>

          {isLoggedIn ? (
            <form onSubmit={handleAskQuestion} className="space-y-3">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="e.g. Does this include the original charger and box?"
                maxLength={500}
                rows={2}
                required
                className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="md"
                  disabled={busy === "ask" || !questionText.trim()}
                  loading={busy === "ask"}
                  className="rounded-xl px-5 text-xs font-bold"
                >
                  <Send className="h-3.5 w-3.5" />
                  Ask Question
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl bg-surface border border-line p-3 text-xs text-muted text-center">
              <a href="/login" className="font-bold text-primary hover:underline">
                Sign in
              </a>{" "}
              to post a public question on this listing.
            </div>
          )}
        </div>
      )}

      {/* Question List */}
      <div className="mt-6 space-y-4">
        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <MessageCircleQuestion className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-ink">No questions asked yet</p>
            <p className="text-xs text-muted mt-1">
              Be the first to ask the seller a question about this product!
            </p>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q._id}
              className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-soft"
            >
              {/* Question Row */}
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sunken text-body font-extrabold text-xs">
                  Q
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink leading-relaxed">
                    {q.question}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                    <span className="font-medium text-body">{q.author?.fullName ?? "Buyer"}</span>
                    <span>·</span>
                    <time>{new Date(q.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</time>
                  </div>
                </div>
              </div>

              {/* Answer Row (if answered) */}
              {q.answer ? (
                <div className="mt-4 pt-3.5 border-t border-line/60 flex items-start gap-3 bg-cream/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-extrabold text-xs shadow-xs">
                    A
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                      {q.answer}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1 font-bold text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        {storeName} (Seller)
                      </span>
                      <span>·</span>
                      <time>
                        {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
                      </time>
                    </div>
                  </div>
                </div>
              ) : isSeller ? (
                /* Seller Answer Input Form */
                <div className="mt-4 pt-3.5 border-t border-line/60">
                  {answeringId === q._id ? (
                    <form onSubmit={(e) => handleAnswerQuestion(e, q._id)} className="space-y-2">
                      <textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your official seller answer to this question..."
                        rows={2}
                        required
                        autoFocus
                        className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-3 focus:ring-primary/20"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerText("");
                          }}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={busy === "answer" || !answerText.trim()}
                          loading={busy === "answer"}
                          className="h-8 text-xs font-bold"
                        >
                          Publish Answer
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAnsweringId(q._id);
                        setAnswerText("");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Answer this question →
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-3 pt-2 text-[11px] text-muted italic">
                  Waiting for seller response…
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
