import {
  AdminPageHeaderSkeleton,
  AdminTableSkeleton,
} from "./_components/admin-skeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <AdminTableSkeleton />
    </div>
  );
}
