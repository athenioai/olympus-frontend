/**
 * Dashboard loading skeleton — displayed while the Server Component
 * fetches finance data. Mirrors the DashboardView layout:
 * 4 metric cards + 3 operational cards + chart area.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Greeting skeleton */}
      <div className="skeleton h-9 w-56 rounded-lg" />

      {/* Financial metric cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="skeleton min-h-[160px] rounded-xl"
            key={i}
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>

      {/* Operational cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            className="skeleton h-[88px] rounded-xl"
            key={i}
            style={{ opacity: 0.9 - i * 0.1 }}
          />
        ))}
      </div>

      {/* Chart + ROI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="skeleton h-[360px] rounded-xl lg:col-span-3" />
        <div className="skeleton h-[360px] rounded-xl" />
      </div>
    </div>
  );
}
