interface AdminPageHeaderSkeletonProps {
  readonly withActions?: boolean;
}

export function AdminPageHeaderSkeleton({
  withActions = true,
}: AdminPageHeaderSkeletonProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded-md" />
      </div>
      {withActions && <div className="skeleton h-10 w-36 rounded-xl" />}
    </div>
  );
}

interface AdminCardsSkeletonProps {
  readonly count?: number;
  readonly columns?: number;
}

export function AdminCardsSkeleton({
  count = 6,
  columns = 3,
}: AdminCardsSkeletonProps) {
  const colsClass = COLUMN_CLASSES[columns] ?? COLUMN_CLASSES[3];
  return (
    <div className={`grid grid-cols-1 gap-4 ${colsClass}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          className="skeleton h-28 rounded-xl"
          key={i}
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

const COLUMN_CLASSES: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

interface AdminTableSkeletonProps {
  readonly rows?: number;
}

export function AdminTableSkeleton({ rows = 6 }: AdminTableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
      <div className="border-b border-surface-container-high px-5 py-3">
        <div className="skeleton h-4 w-full rounded-md" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          className="border-b border-surface-container-high/60 px-5 py-4"
          key={i}
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="skeleton h-5 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
