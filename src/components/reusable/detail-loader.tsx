"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DetailLoader() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 py-12">
      {/* Header Skeleton */}
      <div className="space-y-4 text-center sm:text-left">
        <Skeleton className="h-10 w-3/4 sm:w-1/2 mx-auto sm:mx-0" />
        <Skeleton className="h-6 w-full sm:w-2/3 mx-auto sm:mx-0" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
