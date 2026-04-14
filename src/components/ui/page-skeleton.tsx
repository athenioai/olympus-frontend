interface PageSkeletonProps {
  /** Number of skeleton rows to render */
  readonly rows?: number;
}

export function PageSkeleton({ rows = 4 }: PageSkeletonProps) {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Title skeleton */}
      <div className="skeleton h-8 w-48 rounded-lg" />

      {/* Content skeletons */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="skeleton h-20 w-full rounded-lg"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
