import { http, HttpResponse } from "msw";
import type { PlanPublic } from "@/lib/services";
import { ADMIN_USER, state } from "./state";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface EnvelopeOk<T> {
  readonly success: true;
  readonly data: T;
  readonly error: null;
  readonly meta: { readonly requestId: string };
}

function envelope<T>(data: T): EnvelopeOk<T> {
  return {
    success: true,
    data,
    error: null,
    meta: { requestId: "msw" },
  };
}

function uuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0");
}

function makePlan(name: string, cost: number): PlanPublic {
  return {
    id: uuid(),
    name,
    cost,
    createdAt: new Date().toISOString(),
  };
}

export const handlers = [
  http.get(`${API_URL}/auth/me`, () => {
    return HttpResponse.json(envelope(ADMIN_USER));
  }),

  http.get(`${API_URL}/dashboard`, () => {
    return HttpResponse.json(
      envelope({
        revenueThisMonth: 12_500,
        revenueGrowth: 0.18,
        conversionRate: 0.22,
        averageTicket: 187,
        hotLeadsWaiting: 3,
        overdueInvoices: 1,
        overdueAmount: 450,
        leadsGoneCold: 2,
        todayAppointments: [],
        leadsToFollowUp: [],
        pendingInvoicesDueSoon: [],
        revenueProjection: 14_200,
        bestService: null,
        leadFunnel: {
          new: 12,
          contacted: 7,
          qualified: 4,
          converted: 3,
          lost: 2,
        },
        totalLeads: 28,
        newLeadsThisMonth: 8,
        appointmentsThisMonth: 14,
        upcomingAppointments: 3,
        invoiceCount: 9,
        totalRevenue: 42_300,
        totalPending: 1_200,
        collectionRate: 0.94,
        roi: 3.2,
        charts: {
          dailyRevenue: Array.from({ length: 14 }, (_, i) => ({
            date: new Date(Date.now() - (13 - i) * 86_400_000)
              .toISOString()
              .slice(0, 10),
            value: Math.round(300 + Math.random() * 800),
          })),
          dailyNewLeads: Array.from({ length: 14 }, (_, i) => ({
            date: new Date(Date.now() - (13 - i) * 86_400_000)
              .toISOString()
              .slice(0, 10),
            value: Math.floor(Math.random() * 6),
          })),
          dailyAppointments: Array.from({ length: 14 }, (_, i) => ({
            date: new Date(Date.now() - (13 - i) * 86_400_000)
              .toISOString()
              .slice(0, 10),
            value: Math.floor(Math.random() * 4),
          })),
        },
      }),
    );
  }),

  http.get(`${API_URL}/admin/plans`, () => {
    return HttpResponse.json(envelope(state.plans));
  }),

  http.post(`${API_URL}/admin/plans`, async ({ request }) => {
    const body = (await request.json()) as { name: string; cost: number };
    const plan = makePlan(body.name, body.cost);
    state.plans = [plan, ...state.plans];
    return HttpResponse.json(envelope(plan), { status: 201 });
  }),

  http.patch(
    `${API_URL}/admin/plans/:id`,
    async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as { name?: string; cost?: number };
      const idx = state.plans.findIndex((p) => p.id === id);
      if (idx === -1) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { code: "NOT_FOUND", message: "Plan not found" },
            meta: { requestId: "msw" },
          },
          { status: 404 },
        );
      }
      const updated: PlanPublic = {
        ...state.plans[idx],
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.cost !== undefined ? { cost: body.cost } : {}),
      };
      state.plans[idx] = updated;
      return HttpResponse.json(envelope(updated));
    },
  ),

  http.delete(`${API_URL}/admin/plans/:id`, ({ params }) => {
    const id = params.id as string;
    const before = state.plans.length;
    state.plans = state.plans.filter((p) => p.id !== id);
    if (state.plans.length === before) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: { code: "NOT_FOUND", message: "Plan not found" },
          meta: { requestId: "msw" },
        },
        { status: 404 },
      );
    }
    // Mirror the real backend's soft-delete shape: confirmation envelope
    // with `data: null`. This used to blow up `unwrapEnvelope`.
    return HttpResponse.json({
      success: true,
      data: null,
      error: null,
      meta: { requestId: "msw" },
    });
  }),
];
