import { cn } from "@/lib/format";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "orange";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-border/60 text-text-muted",
  orange: "bg-orange-500/10 text-orange-600",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
