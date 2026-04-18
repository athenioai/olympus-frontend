import {
  AdminPageHeaderSkeleton,
  AdminTableSkeleton,
} from "../_components/admin-skeletons";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56 rounded-lg" />
          <div className="skeleton h-4 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-10 w-44 rounded-xl" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
