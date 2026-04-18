import {
  AdminCardsSkeleton,
  AdminPageHeaderSkeleton,
} from "../_components/admin-skeletons";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <AdminPageHeaderSkeleton withActions={false} />
      <AdminCardsSkeleton columns={3} count={6} />
    </div>
  );
}
