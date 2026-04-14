/**
 * Catalog loading skeleton — displayed while the Server Component
 * fetches services and products data.
 */
export default function CatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Title */}
      <div className="skeleton h-9 w-40 rounded-lg" />

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="skeleton h-10 w-52 rounded-xl" />
        <div className="skeleton h-10 w-64 rounded-xl" />
      </div>

      {/* Table header */}
      <div className="skeleton h-12 w-full rounded-t-xl" />

      {/* Table rows */}
      {Array.from({ length: 5 }, (_, i) => (
        <div
          className="skeleton h-16 w-full"
          key={i}
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
