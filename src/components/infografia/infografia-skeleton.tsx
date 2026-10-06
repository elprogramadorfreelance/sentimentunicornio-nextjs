import { Skeleton } from "@/components/ui";

export function InfografiaSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Skeleton className="col-span-1 h-28 rounded-lg lg:col-span-12" />
      <Skeleton className="col-span-1 h-64 rounded-lg lg:col-span-4" />
      <Skeleton className="col-span-1 h-64 rounded-lg lg:col-span-4" />
      <Skeleton className="col-span-1 h-64 rounded-lg lg:col-span-4" />
      <Skeleton className="col-span-1 h-80 rounded-lg lg:col-span-6" />
      <Skeleton className="col-span-1 h-80 rounded-lg lg:col-span-6" />
    </div>
  );
}
