import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { categoryLabel } from "@/data/taxonomy";
import { timeAgo, type Problem } from "@/data/problems";
import { ProblemStatus } from "./problem-status";
import { cn } from "@/lib/utils";

/** Clean, compact citizen problem card. */
export function ProblemCard({ problem }: { problem: Problem }) {
  const hasCover = problem.evidence && problem.evidence.length > 0;
  return (
    <article className="group h-full">
      <Link
        to="/problems/$id"
        params={{ id: problem.id }}
        className="flex h-full flex-col justify-between rounded-xl border border-line bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm"
      >
        <div>
          {hasCover && (
            <div className="mb-3 aspect-video overflow-hidden rounded-lg border border-line bg-surface-2">
              <img
                src={problem.evidence[0]}
                alt={`Citizen evidence: ${problem.title}`}
                loading="lazy"
                width={600}
                height={338}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-ink-2">
              {categoryLabel(problem.category)}
            </span>
            <ProblemStatus status={problem.status} />
          </div>

          <h3 className="mt-2.5 text-[0.9375rem] font-semibold leading-snug text-ink group-hover:text-accent">
            {problem.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-2">
            {problem.description}
          </p>

          <p className="mt-2 truncate text-xs font-medium text-ink-3">{problem.department}</p>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1 truncate text-ink">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-ink-3" />
            <span className="truncate">
              {problem.area}
              {problem.constituency && problem.constituency !== problem.area
                ? ` (${problem.constituency})`
                : ""}
            </span>
          </span>
          <span className="shrink-0 font-medium tabular-nums text-ink-2">
            {problem.reports} {problem.reports === 1 ? "report" : "reports"}
          </span>
        </div>
      </Link>
    </article>
  );
}

/** Compact row used in dense lists (explore list view, nearby section). */
export function ProblemRow({
  problem,
  showDistance,
  className,
}: {
  problem: Problem;
  showDistance?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/problems/$id"
      params={{ id: problem.id }}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-2">
          <span>{categoryLabel(problem.category)}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{problem.department}</span>
        </div>
        <h3 className="mt-1 truncate text-[0.9375rem] font-medium">{problem.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden className="size-3.5" />
            {problem.area}
            {problem.constituency && problem.constituency !== problem.area
              ? ` (${problem.constituency})`
              : ""}
            , {problem.district}
          </span>
          {showDistance && <span>{problem.distanceKm.toFixed(1)} km away</span>}
          <span>{timeAgo(problem.reportedAt)}</span>
          <span>{problem.reports} reports</span>
          {problem.evidence.length > 0 && <span>Evidence attached</span>}
        </div>
      </div>
      <ProblemStatus status={problem.status} className="shrink-0" />
    </Link>
  );
}
