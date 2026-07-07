import { AlertTriangle, PackageX, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/format";
import { DashboardSummary } from "@/domain/entities/Dashboard";

const iconMap = {
  falta: PackageX,
  baixo: AlertTriangle,
  info: Info,
};

const toneMap = {
  falta: "text-danger bg-danger-bg",
  baixo: "text-warning bg-warning-bg",
  info: "text-navy-700 dark:text-blue-500 bg-navy-700/10",
};

export function AlertsPanel({ alertas }: { alertas: DashboardSummary["alertas"] }) {
  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Alertas importantes</h3>
      <div className="flex flex-col gap-3">
        {alertas.map((a, i) => {
          const Icon = iconMap[a.tipo];
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", toneMap[a.tipo])}>
                <Icon size={14} />
              </div>
              <p className="text-sm text-text leading-snug pt-1">{a.mensagem}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
