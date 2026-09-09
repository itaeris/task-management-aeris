"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteProject } from "@/lib/actions/projects";
import { btnGhost, btnPrimary, field, surface } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { easeOutSoft } from "@/components/motion";

export function DeleteProjectDialog({
  project,
  onClose,
}: {
  project: { id: string; name: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project ? (
        <DeleteProjectForm key={project.id} project={project} onClose={onClose} />
      ) : null}
    </AnimatePresence>
  );
}

function DeleteProjectForm({
  project,
  onClose,
}: {
  project: { id: string; name: string };
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const ready = typed === "DELETE";

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        className={cn(surface, "w-full max-w-md rounded-3xl p-6")}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: easeOutSoft }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-project-title" className="font-serif text-2xl">
          Delete project
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This permanently removes <span className="font-semibold text-ink">{project.name}</span>, including
          tasks, comments, files, and members. This cannot be undone.
        </p>
        <label className="mt-4 grid gap-1.5">
          <span className="text-sm text-muted">
            Type <span className="font-semibold text-ink">DELETE</span> to confirm
          </span>
          <input
            ref={inputRef}
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setError(null);
            }}
            className={cn(field, "font-semibold tracking-wide")}
            placeholder="DELETE"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
          />
        </label>
        {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={cn(btnPrimary, "bg-red-600 hover:bg-red-700")}
            disabled={!ready || pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  await deleteProject(project.id, typed);
                  onClose();
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Could not delete the project.");
                }
              });
            }}
          >
            {pending ? "Deleting…" : "Delete project"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
