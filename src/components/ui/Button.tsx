"use client";

import { cn } from "@/lib/format";
import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
  secondary: "bg-navy-800 text-white hover:bg-navy-700",
  ghost: "bg-transparent text-text hover:bg-border/50 border border-border",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
