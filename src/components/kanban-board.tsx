"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
import { easeOutSoft } from "@/components/motion";

function SortableCard({ task, onOpen }: { task: TaskDTO; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskChip task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
  onOpen,
  index,
}: {
  id: string;
  title: string;
  tasks: TaskDTO[];
  onOpen: (id: string) => void;
  index: number;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <motion.section
      className="flex h-full min-h-0 min-w-[260px] flex-1 flex-col rounded-3xl bg-paper-2/70 p-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: easeOutSoft }}
    >
      <header className="mb-3 flex shrink-0 items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className={cn(chip, "bg-paper text-muted")}>{tasks.length}</span>
      </header>
      <div ref={setNodeRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>
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
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setItems(tasks);
  }
  const [sprintFilter, setSprintFilter] = useState(
    sprints.find((sprint) => sprint.status === "active")?.id ?? "all",
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
    return map;
  }, [visible]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = items.find((task) => task.id === activeId);
    if (!activeTask) return;

    const overTask = items.find((task) => task.id === overId);
    const nextStatus = overTask?.status ?? (KANBAN_COLUMNS.some((column) => column.id === overId) ? overId : activeTask.status);
    if (!nextStatus) return;

    const columnTasks = items
      .filter((task) => task.status === nextStatus && task.id !== activeId)
      .sort((a, b) => a.rank - b.rank);
    let nextIndex = columnTasks.findIndex((task) => task.id === overId);
    if (nextIndex < 0) nextIndex = columnTasks.length;
    const rank = (nextIndex + 1) * 1000;
    setItems((current) =>
      current.map((task) =>
        task.id === activeId ? { ...task, status: nextStatus, rank } : task,
      ),
    );
    await moveTask(activeId, nextStatus, rank);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Kanban check</h1>
          <p className="text-sm text-muted">Drag cards between columns. Click for attachments, comments, and dates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-48"
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
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="flex h-full min-h-0 flex-1 items-stretch gap-3 overflow-x-auto">
          {KANBAN_COLUMNS.map((column, index) => (
            <Column
              key={column.id}
              id={column.id}
              title={column.label}
              tasks={grouped[column.id] ?? []}
              onOpen={setOpenId}
              index={index}
            />
          ))}
        </div>
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
