export default function ConversationsLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex shrink-0 items-center gap-3 bg-surface-container-lowest px-6 py-4">
        <div className="skeleton h-8 w-8 rounded-full" />
        <div className="skeleton h-5 w-32 rounded-lg" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-6">
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
          <div className="skeleton h-16 w-64 rounded-2xl rounded-tl-none" />
        </div>
        <div className="flex justify-end">
          <div className="skeleton h-12 w-48 rounded-2xl rounded-tr-none" />
        </div>
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
          <div className="skeleton h-20 w-72 rounded-2xl rounded-tl-none" />
        </div>
        <div className="flex justify-end">
          <div className="skeleton h-10 w-40 rounded-2xl rounded-tr-none" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="shrink-0 p-4">
        <div className="skeleton h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
