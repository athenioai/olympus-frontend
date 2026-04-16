/**
 * Settings loading skeleton — matches the sidebar + content layout.
 */
export default function SettingsLoading() {
  return (
    <div className="-m-6 -mt-16 flex p-6 pt-6 lg:-m-8 lg:p-8" style={{ height: "100vh" }}>
      {/* Left nav skeleton */}
      <div className="flex w-56 shrink-0 flex-col rounded-xl bg-surface px-4 pt-8">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="skeleton h-9 w-9 rounded-xl" />
          <div className="skeleton h-5 w-28 rounded-lg" />
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              className="skeleton h-11 w-full rounded-xl"
              key={i}
              style={{ opacity: 1 - (i - 1) * 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="min-w-0 flex-1 rounded-xl bg-surface-container-lowest">
        <div className="mx-auto max-w-5xl space-y-8 p-8 lg:p-12">
          {/* Hero */}
          <div className="space-y-2">
            <div className="skeleton h-7 w-56 rounded-lg" />
            <div className="skeleton h-4 w-96 rounded-lg" />
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="skeleton h-36 rounded-xl lg:col-span-8" />
            <div className="skeleton h-36 rounded-xl lg:col-span-4" />
          </div>

          {/* Section */}
          <div className="space-y-3">
            <div className="skeleton h-5 w-44 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <div
                className="skeleton h-14 w-full rounded-xl"
                key={i}
                style={{ opacity: 1 - (i - 1) * 0.15 }}
              />
            ))}
          </div>

          {/* Section */}
          <div className="skeleton h-48 w-full rounded-xl" />

          {/* Footer */}
          <div className="flex justify-end gap-4 pt-4">
            <div className="skeleton h-11 w-28 rounded-xl" />
            <div className="skeleton h-11 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
