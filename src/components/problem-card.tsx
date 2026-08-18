import { Link } from "@tanstack/react-router";
import { ImageIcon, MapPin, Users } from "lucide-react";
import { categoryLabel } from "@/data/taxonomy";
import { timeAgo, type Problem } from "@/data/problems";
import { ProblemStatus } from "./problem-status";
import { cn } from "@/lib/utils";

/** Evidence-led card used on the home page and explore grid. */
export function ProblemCard({ problem }: { problem: Problem }) {
  const cover = problem.evidence[0];
  return (
    <article className="group">
      <Link
        to="/problems/$id"
        params={{ id: problem.id }}
        className="block rounded-xl border border-line bg-surface transition-transform duration-150 hover:-translate-y-0.5"
      >
        {cover ? (
          <div className="aspect-[4/3] overflow-hidden rounded-t-xl border-b border-line bg-surface-2">
            <img
              src={cover}
              alt={`Citizen evidence: ${problem.title}`}
              loading="lazy"
              width={1024}
              height={768}
              className="size-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-t-xl border-b border-line bg-surface-2 text-xs text-ink-3">
            No evidence attached
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-ink-2">
            <span>{categoryLabel(problem.category)}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(problem.reportedAt)}</span>
          </div>
          <h3 className="mt-1.5 text-[0.9375rem] font-medium leading-snug text-ink">
            {problem.title}
          </h3>
          <p className="mt-1 truncate text-sm text-ink-2">{problem.department}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-2">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5" />
              {problem.area}, {problem.district}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden className="size-3.5" />
              {problem.reports} reports
            </span>
            {problem.evidence.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon aria-hidden className="size-3.5" />
                Evidence
              </span>
            )}
          </div>
          <div className="mt-3">
            <ProblemStatus status={problem.status} />
          </div>
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
            {problem.area}, {problem.district}
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
