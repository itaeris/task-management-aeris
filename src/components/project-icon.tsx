import { parseProjectMark } from "@/lib/project-icon";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "h-9 w-9 text-lg",
  md: "h-10 w-10 text-xl",
  lg: "h-12 w-12 text-2xl",
} as const;

export function ProjectIcon({
  value,
  size = "md",
  className,
}: {
  value: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const mark = parseProjectMark(value);
  const box = cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
    SIZE[size],
    className,
  );

  if (mark.type === "flaticon") {
    return (
      <span className={cn(box, "bg-paper-2 text-terracotta")}>
        <i className={cn("fi leading-none", mark.id)} aria-hidden />
      </span>
    );
  }

  if (mark.type === "url") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mark.src} alt="" className={cn(box, "bg-paper object-contain p-1")} />
    );
  }

  return <span className={box} style={{ background: mark.color }} />;
}
