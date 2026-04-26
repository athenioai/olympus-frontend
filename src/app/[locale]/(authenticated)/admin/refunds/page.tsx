import { getTranslations } from "next-intl/server";
import { captureUnexpected } from "@/lib/observability/capture";
import { adminRefundsService } from "@/lib/services";
import type {
  RefundRequestPublic,
  RefundRequestStatus,
} from "@/lib/services";
import { RefundsTable } from "./_components/refunds-table";

interface RefundsPageProps {
  readonly searchParams: Promise<{ status?: RefundRequestStatus }>;
}

export default async function RefundsPage({
  searchParams,
}: RefundsPageProps) {
  const params = await searchParams;
  const status: RefundRequestStatus = params.status ?? "pending";
  const t = await getTranslations("admin.refunds");

  let items: readonly RefundRequestPublic[] = [];
  try {
    items = await adminRefundsService.list({ status });
  } catch (err) {
    captureUnexpected(err);
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">{t("loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <RefundsTable currentFilter={status} requests={items} />
    </div>
  );
}
