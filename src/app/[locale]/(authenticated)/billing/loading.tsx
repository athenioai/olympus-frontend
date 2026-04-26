export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="skeleton h-9 w-40 rounded-lg" />
      <div className="skeleton h-32 w-full rounded-xl" />
      <div className="skeleton h-64 w-full rounded-xl" />
    </div>
  );
}
