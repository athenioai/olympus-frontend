/**
 * Services loading skeleton — displayed while the Server Component
 * fetches services data.
 */
export default function ServicesLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-32 rounded-lg" />
        <div className="skeleton h-9 w-32 rounded-xl" />
      </div>

      {/* Table rows */}
      {Array.from({ length: 5 }, (_, i) => (
        <div
          className="skeleton h-16 w-full rounded-xl"
          key={i}
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
