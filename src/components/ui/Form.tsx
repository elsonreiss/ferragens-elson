"use client";

import { cn } from "@/lib/format";
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

const baseInputClasses =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cn(baseInputClasses, className)} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cn(baseInputClasses, "min-h-24 resize-y", className)} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={cn(baseInputClasses, className)} {...rest} />;
}
