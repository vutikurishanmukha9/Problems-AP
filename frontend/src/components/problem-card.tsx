import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { categoryLabel } from "@/data/taxonomy";
import { timeAgo, type Problem } from "@/data/problems";
import { cn } from "@/lib/utils";

/** Clean, compact citizen problem card. */
export function ProblemCard({ problem }: { problem: Problem }) {
  const hasCover = problem.evidence && problem.evidence.length > 0;
  return (
    <article className="group h-full">
      <Link
        to="/problems/$id"
        params={{ id: problem.id }}
        className="flex h-full flex-col justify-between rounded-xl border border-line bg-surface p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
      >
        <div>
          {hasCover && (
            <div className="mb-3.5 aspect-video overflow-hidden rounded-lg border border-line bg-surface-2">
              <img
                src={problem.evidence[0]}
                alt={`Citizen evidence: ${problem.title}`}
                loading="lazy"
                width={600}
                height={338}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-bold text-ink-2">
              {categoryLabel(problem.category)}
            </span>
            <span className="text-[0.6875rem] font-medium text-ink-3">
              {timeAgo(problem.reportedAt)}
            </span>
          </div>

          <h3 className="mt-2.5 text-[0.9375rem] font-bold leading-snug tracking-tight text-ink group-hover:text-accent transition-colors">
            {problem.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-2 font-normal">
            {problem.description}
          </p>

          <p className="mt-2 truncate text-xs font-semibold text-ink-3">{problem.department}</p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1.5 truncate text-ink font-medium">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-accent" />
            <span className="truncate">
              {problem.area}
              {problem.constituency && problem.constituency !== problem.area
                ? ` (${problem.constituency})`
                : ""}
            </span>
          </span>
          <span className="shrink-0 font-bold tabular-nums text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
            {problem.reports} {problem.reports === 1 ? "voice" : "voices"}
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
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4.5 py-4 transition-colors hover:bg-surface-2/80 sm:px-5.5",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-ink-2">
          <span className="font-bold text-ink">{categoryLabel(problem.category)}</span>
          <span aria-hidden className="text-line-strong">·</span>
          <span className="truncate font-medium text-ink-3">{problem.department}</span>
        </div>
        <h3 className="mt-1 truncate text-[0.9375rem] font-bold tracking-tight text-ink">{problem.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1 font-medium">
            <MapPin aria-hidden className="size-3.5 text-accent" />
            {problem.area}
            {problem.constituency && problem.constituency !== problem.area
              ? ` (${problem.constituency})`
              : ""}
            , {problem.district}
          </span>
          {showDistance && <span>{problem.distanceKm.toFixed(1)} km away</span>}
          <span className="text-ink-3">{timeAgo(problem.reportedAt)}</span>
          {problem.evidence.length > 0 && <span className="font-medium text-ok">📸 Evidence attached</span>}
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-bold text-accent tabular-nums">
        {problem.reports} {problem.reports === 1 ? "voice" : "voices"}
      </span>
    </Link>
  );
}
