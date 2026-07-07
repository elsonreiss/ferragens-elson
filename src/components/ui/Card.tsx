import { cn } from "@/lib/format";

export function Card({
  children,
  className,
  tag = false,
}: {
  children: React.ReactNode;
  className?: string;
  tag?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-xl shadow-sm",
        tag && "tag-card",
        className
      )}
    >
      {children}
    </div>
  );
}
