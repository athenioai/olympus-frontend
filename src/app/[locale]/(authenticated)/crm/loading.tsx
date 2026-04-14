/**
 * Loading skeleton for the CRM Kanban board.
 * Displays 5 columns with placeholder cards while data loads.
 */
export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <div className="skeleton h-7 w-20 rounded-lg" />
          <div className="skeleton mt-2 h-4 w-40 rounded-md" />
        </div>
        <div className="skeleton h-9 w-28 rounded-md" />
      </div>

      {/* Columns skeleton */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {Array.from({ length: 5 }, (_, colIdx) => (
          <div
            key={colIdx}
            className="flex min-w-[260px] flex-1 flex-col rounded-2xl bg-surface-container-low/50"
          >
            {/* Column header */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-3 w-20 rounded-md" />
              <div className="skeleton ml-auto h-5 w-5 rounded-md" />
            </div>

            {/* Card skeletons */}
            <div className="space-y-2.5 px-3 pb-3">
              {Array.from(
                { length: Math.max(1, 3 - colIdx) },
                (_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="skeleton h-20 rounded-xl"
                    style={{ opacity: 1 - cardIdx * 0.2 }}
                  />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
