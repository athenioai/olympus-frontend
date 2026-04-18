export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="skeleton h-4 w-32 rounded-md" />
      </div>

      <div className="flex gap-3">
        <div className="skeleton h-9 flex-1 rounded-md" />
        <div className="skeleton h-9 w-40 rounded-md" />
        <div className="skeleton h-9 w-40 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest">
        <div className="border-b border-surface-container-high p-3">
          <div className="skeleton h-4 w-full rounded-md" />
        </div>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            className="border-b border-surface-container-high/50 p-4"
            key={i}
            style={{ opacity: 1 - i * 0.07 }}
          >
            <div className="skeleton h-5 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
