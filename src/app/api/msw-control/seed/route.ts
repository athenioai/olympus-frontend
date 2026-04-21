import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAGS } from "@/lib/cache-config";
import type { PlanPublic } from "@/lib/services";
import { resetMswState, state } from "@/test/msw/state";

/**
 * Test-only control endpoint: seed the MSW in-memory state. Disabled unless
 * `MSW_ENABLED=1`; responds 404 in any other environment so it never leaks
 * into production. Safe because the bundle still contains the code — the
 * rotation is at runtime.
 */
export async function POST(request: Request): Promise<Response> {
  if (process.env.MSW_ENABLED !== "1") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    plans?: readonly PlanPublic[];
    reset?: boolean;
  };

  if (body.reset) {
    resetMswState();
  }

  if (body.plans !== undefined) {
    state.plans = [...body.plans];
  }

  revalidateTag(CACHE_TAGS.adminPlans, "default");

  return NextResponse.json({ ok: true, planCount: state.plans.length });
}
