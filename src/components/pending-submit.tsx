"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { btnGhost, btnPrimary } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PendingSubmit({
  idle,
  busy,
  className,
  variant = "primary",
  progress = false,
}: {
  idle: string;
  busy: string;
  className?: string;
  variant?: "primary" | "ghost";
  progress?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={cn(
        variant === "primary" ? btnPrimary : btnGhost,
        progress && "relative overflow-hidden",
        className,
      )}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {pending ? busy : idle}
      {progress && pending ? (
        <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/25">
          <span className="block h-full w-1/2 animate-[create-progress_1.1s_ease-in-out_infinite] rounded-full bg-white" />
        </span>
      ) : null}
    </button>
  );
}

export function FormBusy({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} className={className}>
      {children}
    </fieldset>
  );
}
