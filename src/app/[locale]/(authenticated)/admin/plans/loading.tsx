import {
  AdminPageHeaderSkeleton,
  AdminTableSkeleton,
} from "../_components/admin-skeletons";

export default function AdminPlansLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <AdminTableSkeleton rows={5} />
    </div>
  );
}
