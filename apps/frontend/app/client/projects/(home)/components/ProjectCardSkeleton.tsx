import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-9 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array(8).fill(0).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}