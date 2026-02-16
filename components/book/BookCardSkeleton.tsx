import { Skeleton } from "@/components/common/Skeleton";
import { Card } from "@/components/common/Card";

export function BookCardSkeleton() {
  return (
    <Card className="flex h-full min-h-[260px] flex-col md:min-h-[320px]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex-1 space-y-4">
        <Skeleton className="h-2 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </Card>
  );
}
