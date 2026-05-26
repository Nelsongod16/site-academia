"use client";

import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import type { HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-[24px] p-4", className)} {...props} />;
}

export function StrongSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-strong rounded-[26px] p-4", className)} {...props} />;
}

export function Button({
  className,
  variant = "primary",
  ...props
}: Omit<HTMLMotionProps<"button">, "className"> & { className?: string; variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-[var(--accent)] text-black hover:brightness-105",
    secondary: "bg-white/8 text-white hover:bg-white/12",
    ghost: "bg-transparent text-[var(--muted)] hover:bg-white/6",
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn("inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 text-sm font-medium transition", styles, className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[16px] bg-white/6 px-4 text-sm text-white placeholder:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-[18px] bg-white/6 px-4 py-3 text-sm text-white placeholder:text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  active,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition",
        active
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "bg-white/6 text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Surface className={cn("space-y-2", className)}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className="metric-number text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </Surface>
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
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[18px] bg-white/5", className)} />;
}

export function LoadingInline({ label = "salvando" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
      <LoaderCircle className="size-3 animate-spin" />
      {label}
    </div>
  );
}
