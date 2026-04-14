/**
 * Settings loading skeleton — displayed while the Server Component
 * fetches calendar and agent configuration data.
 */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Title */}
      <div className="skeleton h-9 w-48 rounded-lg" />

      {/* Tabs */}
      <div className="skeleton h-10 w-52 rounded-xl" />

      {/* Content card */}
      <div className="space-y-6 rounded-xl bg-surface-container-lowest p-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="space-y-1.5" key={i}>
            <div
              className="skeleton h-4 w-32 rounded"
              style={{ opacity: 1 - i * 0.1 }}
            />
            <div
              className="skeleton h-10 w-full rounded-xl sm:w-48"
              style={{ opacity: 0.9 - i * 0.1 }}
            />
          </div>
        ))}
        <div className="skeleton h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}
