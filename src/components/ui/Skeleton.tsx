import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
}) => {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse rounded bg-[#E2E8F0] ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-8 w-44" />
      <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  );
};
