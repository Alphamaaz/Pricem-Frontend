/* Small shared UI primitives — keep these dumb and dependency-free. */

import { forwardRef } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  loading,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-7 text-base",
  };
  const variants = {
    primary:
      "bg-primary text-white shadow-soft hover:bg-primary-dark hover:shadow-glow",
    outline:
      "border-[1.5px] border-line-strong text-ink bg-surface hover:border-primary hover:text-primary",
    ghost: "text-ink hover:bg-sunken bg-transparent",
    dark: "bg-ink text-white hover:bg-ink-900 shadow-soft",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-muted transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary ${className}`}
      {...props}
    />
  );
});

export function Label({
  children,
  htmlFor,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-ink mb-1.5 ${className}`}>
      {children}
    </label>
  );
}

export function Alert({
  kind,
  children,
  className = "",
}: {
  kind: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const styles =
    kind === "error"
      ? "bg-danger-soft text-danger border-danger/20"
      : "bg-success-soft text-success border-success/20";
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${styles} ${className}`}
      role="alert"
    >
      <Icon className="h-4.5 w-4.5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl bg-surface border border-line shadow-soft ${hover ? "transition-shadow hover:shadow-lifted" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-sunken text-body",
    primary: "bg-primary-soft text-primary-darker",
    accent: "bg-accent/20 text-ink",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
