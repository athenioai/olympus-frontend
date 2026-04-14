"use client";

import { useState, useMemo, useTransition } from "react";
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
import { Plus, Sparkles, Phone, MessageSquare, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, DURATION, EASING } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import type {
  LeadBoard,
  LeadPublic,
  LeadStatus,
} from "@/lib/services/interfaces/lead-service";
import { LeadCard } from "./lead-card";
import { CreateLeadDialog } from "./create-lead-dialog";
import { updateLeadStatus } from "../actions";

interface ColumnConfig {
  readonly id: LeadStatus;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly dotColor: string;
  readonly bgAccent: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: "new",
    icon: Sparkles,
    dotColor: "bg-teal",
    bgAccent: "bg-teal/[0.08]",
  },
  {
    id: "contacted",
    icon: Phone,
    dotColor: "bg-primary",
    bgAccent: "bg-primary/[0.08]",
  },
  {
    id: "qualified",
    icon: MessageSquare,
    dotColor: "bg-[#8b5cf6]",
    bgAccent: "bg-[#8b5cf6]/[0.08]",
  },
  {
    id: "converted",
    icon: Trophy,
    dotColor: "bg-success",
    bgAccent: "bg-success/[0.08]",
  },
  {
    id: "lost",
    icon: XCircle,
    dotColor: "bg-danger",
    bgAccent: "bg-danger/[0.06]",
  },
];

interface CrmBoardProps {
  readonly initialBoard: LeadBoard;
}

/**
 * CRM Kanban board with drag-and-drop and optimistic updates.
 */
export function CrmBoard({ initialBoard }: CrmBoardProps) {
  const t = useTranslations("crm");
  const [board, setBoard] = useState<LeadBoard>(initialBoard);
  const [activeLead, setActiveLead] = useState<LeadPublic | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const totalLeads = useMemo(
    () =>
      board.new.length +
      board.contacted.length +
      board.qualified.length +
      board.converted.length +
      board.lost.length,
    [board],
  );

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
      const next = { ...prev };
      next[oldStatus] = prev[oldStatus].filter((l) => l.id !== lead.id);
      const updatedLead = {
        ...lead,
        status: targetColumn,
        updated_at: new Date().toISOString(),
      };
      next[targetColumn] = [updatedLead, ...prev[targetColumn]];
      return next;
    });

    // Server call in background
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, targetColumn);
      if (!result.success) {
        // Revert on failure
        setBoard((prev) => {
          const next = { ...prev };
          next[targetColumn] = prev[targetColumn].filter(
            (l) => l.id !== lead.id,
          );
          next[oldStatus] = [lead, ...prev[oldStatus]];
          return next;
        });
        toast.error(result.error ?? t("stages.new"));
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
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
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
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
            className="flex h-full gap-4"
            style={{ minWidth: COLUMNS.length * 272 }}
          >
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                label={t(`stages.${col.id}`)}
                leads={board[col.id]}
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
  leads,
}: {
  readonly column: ColumnConfig;
  readonly label: string;
  readonly leads: readonly LeadPublic[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const t = useTranslations("common");

  return (
    <motion.div
      variants={fadeInUp}
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[260px] flex-1 flex-col rounded-2xl bg-surface-container-low/50 transition-colors duration-200",
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
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-3">
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-xl bg-surface-container-high/30">
              <p className="text-[12px] text-on-surface-variant">
                {t("noResults")}
              </p>
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}
