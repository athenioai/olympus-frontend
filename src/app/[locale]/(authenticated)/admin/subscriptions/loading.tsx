import {
  AdminPageHeaderSkeleton,
  AdminTableSkeleton,
} from "../_components/admin-skeletons";

export default function AdminSubscriptionsLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
