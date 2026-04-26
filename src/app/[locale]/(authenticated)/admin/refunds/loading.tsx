export default function RefundsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="skeleton h-9 w-36 rounded-xl" />
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          className="skeleton h-24 w-full rounded-xl"
          key={i}
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
