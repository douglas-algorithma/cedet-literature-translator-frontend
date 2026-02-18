import type { ReactNode } from "react";

import { ICONS } from "@/config/icons";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon = "spark",
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: keyof typeof ICONS;
  className?: string;
}) {
  const Icon = ICONS[icon];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <h3
        className="text-lg font-semibold text-text break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
        title={title}
      >
        {title}
      </h3>
      <p
        className="mt-2 max-w-md text-sm text-text-muted break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden"
        title={description}
      >
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
