import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/format";

type Tone = "orange" | "navy" | "success" | "danger" | "warning";

const toneIconBg: Record<Tone, string> = {
  orange: "bg-orange-500/10 text-orange-600",
  navy: "bg-navy-700/10 text-navy-700 dark:text-blue-500",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <Card tag className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", toneIconBg[tone])}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="font-display font-semibold text-2xl leading-none">{value}</p>
        {hint && <p className="text-xs text-text-muted mt-1.5">{hint}</p>}
      </div>
    </Card>
  );
}
