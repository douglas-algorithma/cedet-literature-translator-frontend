"use client";

import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";

type ConnectionBadgeProps = {
  status: "connected" | "reconnecting" | "offline" | "disabled";
  reconnectAttempts?: number;
  className?: string;
};

const STATUS_LABELS: Record<ConnectionBadgeProps["status"], string> = {
  connected: "Online",
  reconnecting: "Reconectando",
  offline: "Offline",
  disabled: "Desabilitado",
};

const STATUS_VARIANTS: Record<
  ConnectionBadgeProps["status"],
  "success" | "warning" | "neutral"
> = {
  connected: "success",
  reconnecting: "warning",
  offline: "neutral",
  disabled: "neutral",
};

export function ConnectionBadge({ status, reconnectAttempts, className }: ConnectionBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-text-muted", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "connected" && "bg-success",
          status === "reconnecting" && "bg-warning",
          status === "offline" && "bg-text-muted",
          status === "disabled" && "bg-border",
        )}
      />
      <Badge variant={STATUS_VARIANTS[status]}>
        {STATUS_LABELS[status]}
        {status === "reconnecting" && reconnectAttempts ? ` (${reconnectAttempts})` : ""}
      </Badge>
    </div>
  );
}
