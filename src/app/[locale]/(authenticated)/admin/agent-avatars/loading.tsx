import { AdminPageHeaderSkeleton } from "../_components/admin-skeletons";

export default function AdminAvatarsLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            className="skeleton aspect-square rounded-2xl"
            key={i}
            style={{ opacity: 1 - i * 0.07 }}
          />
        ))}
      </div>
    </div>
  );
}
