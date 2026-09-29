"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  defaultAnimateLayoutChanges,
  useSortable,
  verticalListSortingStrategy,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { moveTask } from "@/lib/actions/tasks";
import type { MemberDTO, SprintDTO, TaskDTO } from "@/lib/types";
import { TaskChip, TaskDrawer } from "@/components/task-drawer";
import { CreateTaskButton } from "@/components/create-task-button";
import { Select } from "@/components/fields";
import { chip } from "@/components/ui";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { notifyChange } from "@/components/toast";

const collisionDetection: CollisionDetection = (args) => {
  const pointer = args.pointerCoordinates;
  if (pointer) {
    const columns = args.droppableContainers.filter((container) => container.data.current?.type === "column");
    const column = columns.find((container) => {
      const rect = args.droppableRects.get(container.id);
      return Boolean(rect && pointer.x >= rect.left && pointer.x <= rect.right);
    });
    if (column) {
      const columnId = String(column.data.current?.status ?? column.id);
      const cards = args.droppableContainers.filter(
        (container) =>
          container.id !== args.active.id &&
          container.data.current?.type === "task" &&
          container.data.current?.status === columnId,
      );
      const cardHits = pointerWithin({ ...args, droppableContainers: cards });
      if (cardHits.length) return cardHits;
      const nearest = closestCorners({ ...args, droppableContainers: cards });
      if (nearest.length) return nearest;
      return [{ id: column.id }];
    }
  }
  const pointerHits = pointerWithin(args);
  if (pointerHits.length) return pointerHits;
  return closestCorners(args);
};

const dropAnimation: DropAnimation = {
  duration: 180,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

function statusOf(id: string, list: TaskDTO[]) {
  if (KANBAN_COLUMNS.some((column) => column.id === id)) return id;
  return list.find((task) => task.id === id)?.status ?? null;
}

function SortableCard({
  task,
  onOpen,
  isDropTarget,
}: {
  task: TaskDTO;
  onOpen: (id: string) => void;
  isDropTarget: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
    animateLayoutChanges,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-2xl cursor-grab active:cursor-grabbing",
        isDragging &&
          "border border-dashed border-line bg-paper/70 shadow-[0_10px_24px_rgba(15,23,42,0.12)] [&>*]:invisible",
        !isDragging && isDropTarget && "z-10 ring-2 ring-terracotta/30",
      )}
      {...attributes}
      {...listeners}
    >
      <TaskChip task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
  onOpen,
  isDropTarget,
  overId,
}: {
  id: string;
  title: string;
  tasks: TaskDTO[];
  onOpen: (id: string) => void;
  isDropTarget: boolean;
  overId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id, data: { type: "column", status: id } });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timer = 0;
    const onScroll = () => {
      el.classList.add("is-scrolling");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove("is-scrolling"), 700);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <motion.section
      className={cn(
        "flex h-full min-h-0 min-w-[260px] flex-1 flex-col rounded-3xl bg-paper-2/70 p-3 transition-[box-shadow,background-color,transform] duration-200",
        isDropTarget && "ring-1 ring-terracotta/25",
      )}
      initial={false}
    >
      <div ref={setNodeRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="mb-3 flex shrink-0 items-center justify-between px-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className={cn(chip, "bg-paper text-muted")}>{tasks.length}</span>
        </header>
        <div ref={scrollRef} className="kanban-scroll flex min-h-[8rem] min-w-0 flex-1 flex-col gap-2 overflow-y-auto">
          <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableCard
                key={task.id}
                task={task}
                onOpen={onOpen}
                isDropTarget={overId === task.id}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </motion.section>
  );
}

export function KanbanBoard({
  projectId,
  tasks,
  members,
  sprints,
}: {
  projectId: string;
  tasks: TaskDTO[];
  members: MemberDTO[];
  sprints: SprintDTO[];
}) {
  const router = useRouter();
  const dndId = useId();
  const [items, setItems] = useState(tasks);
  const [prevTasks, setPrevTasks] = useState(tasks);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sprintFilter, setSprintFilter] = useState(
    sprints.find((sprint) => sprint.status === "active")?.id ?? "all",
  );
  const dragOrigin = useRef<TaskDTO[] | null>(null);
  const pendingMoves = useRef(new Map<string, { status: string; rank: number }>());
  const [dragging, setDragging] = useState<TaskDTO | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function mergeIncoming(next: TaskDTO[]) {
    return next.map((task) => {
      const pending = pendingMoves.current.get(task.id);
      if (!pending) return task;
      if (task.status === pending.status) {
        pendingMoves.current.delete(task.id);
        return task;
      }
      return { ...task, status: pending.status, rank: pending.rank };
    });
  }

  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setItems(mergeIncoming(tasks));
  }

  const visible = useMemo(
    () =>
      items.filter((task) => {
        if (task.status === "backlog") return false;
        if (sprintFilter === "all") return true;
        return task.sprintId === sprintFilter;
      }),
    [items, sprintFilter],
  );

  const grouped = useMemo(() => {
    const map: Record<string, TaskDTO[]> = {};
    for (const column of KANBAN_COLUMNS) map[column.id] = [];
    for (const task of visible) {
      if (!map[task.status]) map[task.status] = [];
      map[task.status].push(task);
    }
    for (const column of KANBAN_COLUMNS) {
      map[column.id].sort((a, b) => a.rank - b.rank);
    }
    return map;
  }, [visible]);

  function onDragStart(event: DragStartEvent) {
    dragOrigin.current = items;
    setOverId(String(event.active.id));
    setDragging(items.find((task) => task.id === String(event.active.id)) ?? null);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overIdValue = String(over.id);
    setOverId(overIdValue);
    if (activeId === overIdValue) return;
    setItems((current) => {
      const from = statusOf(activeId, current);
      const overStatus =
        (over.data.current as { status?: string } | undefined)?.status ?? statusOf(overIdValue, current);
      if (!from || !overStatus || from === overStatus) return current;
      return current.map((task) => (task.id === activeId ? { ...task, status: overStatus } : task));
    });
  }

  function clearDrag() {
    setDragging(null);
    setOverId(null);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const activeTask = items.find((task) => task.id === activeId);
    if (!activeTask || !over) {
      setItems(dragOrigin.current ?? tasks);
      clearDrag();
      return;
    }

    const droppedId = String(over.id);
    const original = dragOrigin.current?.find((task) => task.id === activeId) ?? activeTask;
    const liveStatus = items.find((task) => task.id === activeId)?.status ?? activeTask.status;
    const droppedStatus =
      (over.data.current as { status?: string } | undefined)?.status ?? statusOf(droppedId, items);
    const nextStatus =
      (droppedStatus && droppedStatus !== original.status ? droppedStatus : null) ??
      (liveStatus !== original.status ? liveStatus : null) ??
      droppedStatus ??
      liveStatus;
    const columnTasks = items
      .filter((task) => task.id !== activeId && task.status === nextStatus)
      .sort((a, b) => a.rank - b.rank);
    let nextIndex = columnTasks.findIndex((task) => task.id === droppedId);
    if (nextIndex < 0) nextIndex = columnTasks.length;
    const rank = (nextIndex + 1) * 1000;
    const previous = dragOrigin.current ?? items;
    setItems((current) =>
      current.map((task) => (task.id === activeId ? { ...task, status: nextStatus, rank } : task)),
    );
    pendingMoves.current.set(activeId, { status: nextStatus, rank });
    clearDrag();
    if (original.status === nextStatus && original.rank === rank) return;
    try {
      if (original.status === nextStatus) {
        await moveTask(activeId, nextStatus, rank);
      } else {
        await notifyChange(moveTask(activeId, nextStatus, rank), "Task moved");
      }
    } catch {
      pendingMoves.current.delete(activeId);
      setItems(previous);
    }
  }

  const overStatus = overId ? statusOf(overId, items) : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl sm:text-3xl">Kanban check</h1>
          <p className="text-sm text-muted">Drag cards between columns. Click for attachments, comments, and dates.</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            className="w-full sm:w-48"
            value={sprintFilter}
            onChange={setSprintFilter}
            options={[
              { value: "all", label: "All sprints" },
              ...sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
            ]}
          />
          <CreateTaskButton
            projectId={projectId}
            members={members}
            sprints={sprints}
            defaultStatus="todo"
            defaultSprintId={sprintFilter === "all" ? sprints.find((s) => s.status === "active")?.id : sprintFilter}
          />
        </div>
      </div>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setItems(dragOrigin.current ?? tasks);
          clearDrag();
        }}
      >
        <div className="flex h-full min-h-0 flex-1 items-stretch gap-3 overflow-x-auto">
          {KANBAN_COLUMNS.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.label}
              tasks={grouped[column.id] ?? []}
              onOpen={setOpenId}
              isDropTarget={Boolean(dragging) && overStatus === column.id}
              overId={dragging ? overId : null}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {dragging ? (
            <div className="w-[260px]">
              <TaskChip task={dragging} onOpen={() => {}} variant="overlay" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <TaskDrawer
        taskId={openId}
        members={members}
        sprints={sprints}
        onClose={() => setOpenId(null)}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}
