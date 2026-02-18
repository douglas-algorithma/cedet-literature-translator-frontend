import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="min-w-0">
        <h1
          className="font-display text-2xl font-semibold text-text break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden md:text-3xl"
          title={title}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="mt-1 text-sm text-text-muted break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden"
            title={description}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto md:justify-end">
          {action}
        </div>
      ) : null}
    </div>
  );
}
