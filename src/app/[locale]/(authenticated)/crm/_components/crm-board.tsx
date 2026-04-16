"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
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
import { Button } from "@/components/ui/button";
import type {
  BoardColumnCount,
  LeadPublic,
  LeadStatus,
} from "@/lib/services/interfaces/lead-service";
import { LeadCard } from "./lead-card";
import { CreateLeadDialog } from "./create-lead-dialog";
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

const PAGE_SIZE = 20;

interface ColumnState {
  leads: LeadPublic[];
  total: number;
  page: number;
  loading: boolean;
}

type BoardState = Record<LeadStatus, ColumnState>;

function buildInitialBoardState(counters: BoardColumnCount[]): BoardState {
  const state: Partial<BoardState> = {};
  for (const col of COLUMNS) {
    const counter = counters.find((c) => c.status === col.id);
    state[col.id] = {
      leads: [],
      total: counter?.count ?? 0,
      page: 0,
      loading: false,
    };
  }
  return state as BoardState;
}

interface CrmBoardProps {
  readonly initialCounters: BoardColumnCount[];
}

/**
 * CRM Kanban board with drag-and-drop, optimistic updates, and lazy column loading.
 */
export function CrmBoard({ initialCounters }: CrmBoardProps) {
  const t = useTranslations("crm");
  const [board, setBoard] = useState<BoardState>(() => buildInitialBoardState(initialCounters));
  const [activeLead, setActiveLead] = useState<LeadPublic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const totalLeads = useMemo(
    () => COLUMNS.reduce((sum, col) => sum + board[col.id].total, 0),
    [board],
  );

  const loadColumn = useCallback(async (status: LeadStatus, page: number) => {
    setBoard((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));

    const result = await fetchColumnLeads(status, page, PAGE_SIZE);

    if (result.success && result.data) {
      setBoard((prev) => ({
        ...prev,
        [status]: {
          leads: page === 1
            ? result.data!.data
            : [...prev[status].leads, ...result.data!.data],
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
  }, []);

  // Load first page of each column on mount
  useEffect(() => {
    for (const col of COLUMNS) {
      loadColumn(col.id, 1);
    }
  }, [loadColumn]);

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as LeadPublic | undefined;
    if (lead) setActiveLead(lead);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const lead = active.data.current?.lead as LeadPublic | undefined;
    if (!lead) return;

    const targetColumn = over.id as LeadStatus;
    if (!COLUMNS.some((c) => c.id === targetColumn)) return;
    if (lead.status === targetColumn) return;

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
      }
    });
  }

  return (
    <div className="-m-6 -mt-16 flex flex-col p-4 pt-6 lg:-m-8 lg:p-5 lg:pt-6" style={{ height: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-on-surface">
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

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
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
      </div>

      <CreateLeadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
  const tc = useTranslations("common");

  const hasMore = state.page * PAGE_SIZE < state.total;

  return (
    <motion.div
      variants={fadeInUp}
      ref={setNodeRef}
      className={cn(
        "flex h-full flex-1 flex-col rounded-2xl bg-surface-container-low/50 transition-colors duration-200",
        isOver && "bg-primary/[0.03]",
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span className={cn("h-2 w-2 rounded-full", column.dotColor)} />
        <span className="text-xs font-extrabold uppercase tracking-widest text-on-surface">
          {label}
        </span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-md bg-surface-container-high px-1.5 text-[11px] font-extrabold text-on-surface-variant">
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
            <div className="flex h-full items-center justify-center rounded-xl bg-surface-container-high/30">
              <p className="text-[12px] text-on-surface-variant">
                {tc("noResults")}
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
