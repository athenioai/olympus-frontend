import {
  AdminPageHeaderSkeleton,
  AdminTableSkeleton,
} from "../_components/admin-skeletons";

export default function AdminInvoicesLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="skeleton h-24 rounded-xl"
            key={i}
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            className="skeleton h-9 w-24 rounded-full"
            key={i}
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
