import { cn } from "@/lib/utils";
import { statusLabel, type StatusId } from "@/data/taxonomy";

const dot: Record<StatusId, string> = {
  reported: "bg-ink-3",
  "under-review": "bg-warn",
  forwarded: "bg-info",
  "action-initiated": "bg-accent",
  resolved: "bg-ok",
  closed: "bg-line-strong",
};

/** Status is communicated by text first; the dot is a secondary cue only. */
export function ProblemStatus({
  status,
  className,
}: {
  status: StatusId;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-xs font-medium text-ink",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dot[status])} />
      {statusLabel(status)}
    </span>
  );
}
