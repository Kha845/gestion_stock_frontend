import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
  className?: string;
  accent?: "primary" | "success" | "warning" | "destructive" | "info";
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <Card className={cn("border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums truncate">{value}</p>
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
          </div>
          {icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-md shrink-0", accentMap[accent])}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
