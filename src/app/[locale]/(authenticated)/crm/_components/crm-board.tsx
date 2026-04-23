"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type Announcements,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Plus, Sparkles, Phone, MessageSquare, Trophy, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { counter } from "@/lib/observability/sentry-metrics";
import { Button } from "@/components/ui/button";
import type {
  BoardColumnCount,
  LeadBoardItem,
  LeadStatus,
} from "@/lib/services/interfaces/lead-service";
import type { CrmFilters, InitialColumns } from "../page";
import { LeadCard } from "./lead-card";
import { CreateLeadDialog } from "./create-lead-dialog";
import { FilterBar } from "./filter-bar";
import { updateLeadStatus, fetchColumnLeads } from "../actions";

interface ColumnConfig {
  readonly id: LeadStatus;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: "new", icon: Sparkles, dotColor: "bg-teal" },
  { id: "contacted", icon: Phone, dotColor: "bg-primary" },
  { id: "qualified", icon: MessageSquare, dotColor: "bg-[#8b5cf6]" },
  { id: "converted", icon: Trophy, dotColor: "bg-success" },
  { id: "lost", icon: XCircle, dotColor: "bg-danger" },
];

// Pipeline flow: a lead can only advance to the immediate next stage.
// No backwards moves, no skipping stages. `lost` is the exception: a lead
// can be marked lost from any stage (abandonment can happen anytime).
function canAdvance(from: LeadStatus, to: LeadStatus): boolean {
  if (to === "lost") return from !== "lost";
  const fromIdx = COLUMNS.findIndex((c) => c.id === from);
  const toIdx = COLUMNS.findIndex((c) => c.id === to);
  return fromIdx >= 0 && toIdx === fromIdx + 1;
}

const PAGE_SIZE = 20;

interface ColumnState {
  leads: LeadBoardItem[];
  total: number;
  page: number;
  loading: boolean;
}

type BoardState = Record<LeadStatus, ColumnState>;

function buildInitialBoardState(
  counters: BoardColumnCount[],
  initialColumns: InitialColumns,
): BoardState {
  const state: Partial<BoardState> = {};
  for (const col of COLUMNS) {
    const counter = counters.find((c) => c.status === col.id);
    const column = initialColumns[col.id];
    state[col.id] = {
      leads: column?.items ?? [],
      total: column?.total ?? counter?.count ?? 0,
      page: column?.page ?? 1,
      loading: false,
    };
  }
  return state as BoardState;
}

interface CrmBoardProps {
  readonly initialCounters: BoardColumnCount[];
  readonly initialColumns: InitialColumns;
  readonly filters: CrmFilters;
}

/**
 * CRM Kanban board with drag-and-drop, optimistic updates, and lazy column loading.
 * First page of every column is fetched server-side in parallel and received as initial state.
 */
export function CrmBoard({ initialCounters, initialColumns, filters }: CrmBoardProps) {
  const t = useTranslations("crm");
  const [board, setBoard] = useState<BoardState>(() =>
    buildInitialBoardState(initialCounters, initialColumns),
  );
  const [activeLead, setActiveLead] = useState<LeadBoardItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // @dnd-kit gera aria-describedby incrementais (DndDescribedBy-N) que
  // divergem entre SSR e CSR — o hydration mismatch resultante impede o
  // React de anexar os event listeners do drag. Montar só depois da
  // hidratação elimina o mismatch sem perder o fetch inicial do server.
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // closestCorners was picking cards in adjacent columns when the drag
  // crossed column boundaries — the kanban needs the drop to follow the
  // cursor, not the nearest corner. Prefer the column droppable when the
  // pointer is within it; fall back to rect intersection when the cursor
  // is outside every droppable.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const columnHit = pointerCollisions.find(({ id }) =>
        COLUMNS.some((c) => c.id === id),
      );
      return columnHit ? [columnHit] : pointerCollisions;
    }
    return rectIntersection(args);
  }, []);

  const totalLeads = useMemo(
    () => COLUMNS.reduce((sum, col) => sum + board[col.id].total, 0),
    [board],
  );

  // Translated dnd-kit screen reader text. The upstream defaults are English
  // only; QA flagged the raw "To pick up a draggable item..." leaking into pt-BR.
  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(
    () => ({ draggable: t("dnd.instructions") }),
    [t],
  );

  const announcements = useMemo<Announcements>(() => {
    const findLeadName = (id: string | number): string => {
      for (const col of COLUMNS) {
        const hit = board[col.id].leads.find((l) => l.id === id);
        if (hit) return hit.name;
      }
      return String(id);
    };

    const findColumnLabel = (
      id: string | number | null | undefined,
    ): string | null => {
      if (id === null || id === undefined) return null;
      const col = COLUMNS.find((c) => c.id === id);
      return col ? t(`stages.${col.id}`) : null;
    };

    return {
      onDragStart({ active }) {
        return t("dnd.pickup", { name: findLeadName(active.id) });
      },
      onDragOver({ active, over }) {
        const name = findLeadName(active.id);
        const column = findColumnLabel(over?.id);
        return column
          ? t("dnd.overColumn", { name, column })
          : t("dnd.overNothing", { name });
      },
      onDragEnd({ active, over }) {
        const name = findLeadName(active.id);
        const column = findColumnLabel(over?.id);
        return column
          ? t("dnd.dropped", { name, column })
          : t("dnd.droppedNowhere", { name });
      },
      onDragCancel({ active }) {
        return t("dnd.cancelled", { name: findLeadName(active.id) });
      },
    };
  }, [t, board]);

  const loadColumn = useCallback(
    async (status: LeadStatus, page: number) => {
      setBoard((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: true },
      }));

      const result = await fetchColumnLeads(status, page, PAGE_SIZE, {
        search: filters.search,
        temperature: filters.temperature,
      });

      if (result.success && result.data) {
        setBoard((prev) => ({
          ...prev,
          [status]: {
            leads:
              page === 1
                ? result.data!.items
                : [...prev[status].leads, ...result.data!.items],
            total: result.data!.total,
            page,
            loading: false,
          },
        }));
      } else {
        setBoard((prev) => ({
          ...prev,
          [status]: { ...prev[status], loading: false },
        }));
      }
    },
    [filters.search, filters.temperature],
  );

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as LeadBoardItem | undefined;
    if (lead) setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const lead = active.data.current?.lead as LeadBoardItem | undefined;
    if (!lead) return;

    const overId = String(over.id);
    // `over.id` can be a column id (when the user drops on empty column
    // space) OR a lead id (when the drop lands on top of another card).
    // Resolve to the owning column in either case.
    const targetColumn: LeadStatus | null = COLUMNS.some(
      (c) => c.id === overId,
    )
      ? (overId as LeadStatus)
      : (COLUMNS.find((c) =>
          board[c.id].leads.some((l) => l.id === overId),
        )?.id ?? null);
    if (!targetColumn) return;
    if (lead.status === targetColumn) return;

    if (!canAdvance(lead.status, targetColumn)) {
      const currentIdx = COLUMNS.findIndex((c) => c.id === lead.status);
      const nextColumn = COLUMNS[currentIdx + 1];
      // When `next` is "lost" (i.e. current stage is "converted"), the only
      // remaining option is "lost" — which is already always available. Use
      // the terminal message to avoid the redundant "advance to Lost".
      const showTerminal = !nextColumn || nextColumn.id === "lost";
      toast.error(
        showTerminal
          ? t("dnd.invalidMoveTerminal")
          : t("dnd.invalidMove", { next: t(`stages.${nextColumn.id}`) }),
      );
      return;
    }

    const oldStatus = lead.status;

    // Optimistic update
    setBoard((prev) => {
      const updatedLead = { ...lead, status: targetColumn, updatedAt: new Date().toISOString() };
      return {
        ...prev,
        [oldStatus]: {
          ...prev[oldStatus],
          leads: prev[oldStatus].leads.filter((l) => l.id !== lead.id),
          total: prev[oldStatus].total - 1,
        },
        [targetColumn]: {
          ...prev[targetColumn],
          leads: [updatedLead, ...prev[targetColumn].leads],
          total: prev[targetColumn].total + 1,
        },
      };
    });

    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, targetColumn);
      if (!result.success) {
        // Revert
        setBoard((prev) => ({
          ...prev,
          [targetColumn]: {
            ...prev[targetColumn],
            leads: prev[targetColumn].leads.filter((l) => l.id !== lead.id),
            total: prev[targetColumn].total - 1,
          },
          [oldStatus]: {
            ...prev[oldStatus],
            leads: [lead, ...prev[oldStatus].leads],
            total: prev[oldStatus].total + 1,
          },
        }));
        toast.error(result.error ?? "Erro ao mover lead.");
        return;
      }
      counter("lead.status_changed", 1, {
        attributes: { from: oldStatus, to: targetColumn },
      });
    });
  }

  return (
    <div className="-m-6 -mt-16 flex flex-col p-4 pt-6 lg:-m-8 lg:p-5 lg:pt-6" style={{ height: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight text-on-surface">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            {t("leadsInPipeline", { count: totalLeads })}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("newLead")}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="pb-4">
        <FilterBar filters={filters} />
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {!mounted ? (
          <StaticBoard board={board} t={t} />
        ) : (
        <DndContext
          accessibility={{ announcements, screenReaderInstructions }}
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex h-full min-w-[1200px] gap-4"
          >
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                label={t(`stages.${col.id}`)}
                state={board[col.id]}
                onLoadMore={() => loadColumn(col.id, board[col.id].page + 1)}
              />
            ))}
          </motion.div>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {activeLead ? (
              <div className="w-[260px] rotate-[3deg] scale-[1.03]">
                <LeadCard lead={activeLead} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        )}
      </div>

      <CreateLeadDialog
        onClose={() => setDialogOpen(false)}
        onCreated={(lead) => {
          // New leads are created in the "new" column by the backend. Insert
          // into local board state so the card appears without a reload.
          const boardItem: LeadBoardItem = {
            ...lead,
            avatarUrl: null,
            lastMessage: null,
            tags: [],
            customFields: [],
          };
          setBoard((prev) => ({
            ...prev,
            new: {
              ...prev.new,
              leads: [boardItem, ...prev.new.leads],
              total: prev.new.total + 1,
            },
          }));
        }}
        open={dialogOpen}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  label,
  state,
  onLoadMore,
}: {
  readonly column: ColumnConfig;
  readonly label: string;
  readonly state: ColumnState;
  readonly onLoadMore: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const hasMore = state.page * PAGE_SIZE < state.total;

  return (
    <motion.div
      variants={fadeInUp}
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col rounded-2xl bg-surface-container-low/50 transition-colors duration-200",
        isOver && "bg-primary/[0.03]",
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span className={cn("h-2 w-2 rounded-full", column.dotColor)} />
        <span className="text-xs font-extrabold uppercase tracking-widest text-on-surface">
          {label}
        </span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-surface-container-high px-1.5 text-[11px] font-extrabold tabular-nums text-on-surface-variant">
          {state.total}
        </span>
      </div>

      {/* Cards */}
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
        <SortableContext
          items={state.leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {state.loading && state.leads.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant/40" />
            </div>
          ) : state.leads.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl px-4 py-8 text-center">
              <div className={cn(
                "mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high",
              )}>
                <column.icon className="h-4 w-4 text-on-surface-variant/50" />
              </div>
              <p className="text-[12px] font-semibold text-on-surface-variant">
                Nenhum {label.toLowerCase()}
              </p>
              <p className="mt-1 text-[11px] text-on-surface-variant/70">
                Arraste leads pra esta etapa
              </p>
            </div>
          ) : (
            <>
              {state.leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
              {hasMore && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary/5"
                  disabled={state.loading}
                  onClick={onLoadMore}
                  type="button"
                >
                  {state.loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Carregar mais"
                  )}
                </button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}

/**
 * SSR placeholder while the DnD context hasn't mounted yet. Renders a
 * visual clone of the board (column headers + basic card info) so the
 * server-rendered HTML matches what the user will see milliseconds later.
 * Omits the DnD wiring so @dnd-kit's id counters never get touched on
 * the server pass — that's what was breaking hydration.
 */
function StaticBoard({
  board,
  t,
}: {
  readonly board: BoardState;
  readonly t: (key: string) => string;
}) {
  return (
    <div className="flex h-full min-w-[1200px] gap-4">
      {COLUMNS.map((col) => (
        <div
          className="flex h-full w-[280px] shrink-0 flex-col rounded-2xl bg-surface-container-low p-3"
          key={col.id}
        >
          <div className="mb-3 flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <span>{t(`stages.${col.id}`)}</span>
            <span>{board[col.id].total}</span>
          </div>
          <div className="space-y-2 overflow-hidden opacity-60">
            {board[col.id].leads.slice(0, 8).map((lead) => (
              <div
                className="rounded-xl bg-surface-container-lowest p-3.5"
                key={lead.id}
              >
                <p className="truncate text-sm font-semibold text-on-surface">
                  {lead.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
