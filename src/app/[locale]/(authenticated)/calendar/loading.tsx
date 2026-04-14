/**
 * Calendar loading skeleton — displayed while the Server Component
 * fetches appointment data. Mirrors the CalendarView layout.
 */
export default function CalendarLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Title */}
      <div className="skeleton h-9 w-40 rounded-lg" />

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="skeleton h-8 w-48 rounded-xl" />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-9 w-9 rounded-lg" />
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>

      {/* Calendar grid */}
      <div className="skeleton h-[500px] w-full rounded-xl" />
    </div>
  );
}
