/**
 * Loading skeleton for the lead detail page.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back link skeleton */}
      <div className="skeleton h-4 w-24 rounded-md" />

      {/* Lead header card skeleton */}
      <div className="rounded-xl bg-surface-container-low p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-48 rounded-lg" />
            <div className="skeleton h-4 w-64 rounded-md" />
            <div className="skeleton h-4 w-40 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-8 w-8 rounded-md" />
            <div className="skeleton h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="mt-4 flex gap-3 pt-4">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-32 rounded-md" />
          <div className="skeleton h-6 w-32 rounded-md" />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div>
        <div className="skeleton mb-4 h-5 w-32 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-[30px] w-[30px] rounded-full" />
              <div
                className="skeleton h-16 flex-1 rounded-xl"
                style={{ opacity: 1 - i * 0.15 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
