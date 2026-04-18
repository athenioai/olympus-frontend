import { AdminCardsSkeleton } from "../../_components/admin-skeletons";

export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded-md" />
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded-md" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            className="skeleton h-10 w-28 rounded-xl"
            key={i}
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>

      <AdminCardsSkeleton columns={3} count={3} />

      <div className="skeleton h-32 w-full rounded-xl" />
    </div>
  );
}
