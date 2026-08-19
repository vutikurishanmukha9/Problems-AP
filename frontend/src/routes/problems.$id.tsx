import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Users, Repeat, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemStatus } from "@/components/problem-status";
import { ProblemMap } from "@/components/problem-map";
import { ProblemRow } from "@/components/problem-card";
import { ButtonLink } from "@/components/ui-kit";
import {
  getProblem,
  PROBLEMS,
  formatDateTime,
  timeAgo,
  type Problem,
  type TimelineEntry,
} from "@/data/problems";
import { categoryLabel, getMinisterForDepartment } from "@/data/taxonomy";
import { getMLAForConstituency } from "@/data/constituencies";

export const Route = createFileRoute("/problems/$id")({
  loader: ({ params }: { params: { id: string } }) => {
    const problem = getProblem(params.id);
    if (!problem) throw notFound();
    return { problem };
  },
  head: ({ loaderData }: { loaderData?: { problem?: Problem } }) => {
    if (!loaderData || !loaderData.problem) {
      return {
        meta: [
          { title: "Problem not found — Problems@AP" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.problem;
    const title = `${p.title} — ${p.area}, ${p.district}`;
    const description = `${categoryLabel(p.category)} problem reported in ${p.area}, ${p.district}. ${p.reports} citizen reports. Handled by ${p.department}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: ProblemNotFound,
  component: ProblemDetail,
});

function ProblemNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-ap py-24 text-center">
        <h1 className="text-2xl font-semibold">We couldn't find that report</h1>
        <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-ink-2">
          Check the reference, or browse everything reported across Andhra Pradesh.
        </p>
        <ButtonLink to="/explore" variant="secondary" className="mt-6">
          Explore problems
        </ButtonLink>
      </main>
      <SiteFooter />
    </>
  );
}

function ProblemDetail() {
  const { problem: p } = Route.useLoaderData();
  const others = PROBLEMS.filter((x) => x.id !== p.id);
  const related = [
    ...others.filter((x) => x.category === p.category || x.district === p.district),
    ...others.filter((x) => x.category !== p.category && x.district !== p.district),
  ].slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-5 sm:py-7">
            <nav aria-label="Breadcrumb" className="text-xs text-ink-2">
              <Link to="/explore" className="hover:text-ink">
                Explore
              </Link>
              <span aria-hidden className="mx-2 text-line-strong">
                /
              </span>
              <span>{categoryLabel(p.category)}</span>
            </nav>

            <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <h1 className="max-w-3xl text-xl font-semibold sm:text-2xl sm:leading-snug">
                  {p.title}
                </h1>
                <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ink-2">Category:</dt>
                    <dd className="font-medium text-ink">{categoryLabel(p.category)}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <dt className="text-ink-2">Department:</dt>
                    <dd className="truncate font-medium text-ink">
                      {p.department}
                      {getMinisterForDepartment(p.department) ? (
                        <span className="ml-1 text-xs font-normal text-ink-2">
                          (Minister: {getMinisterForDepartment(p.department)?.minister})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  {p.constituency && (
                    <div className="flex items-center gap-1.5">
                      <dt className="text-ink-2">Constituency:</dt>
                      <dd className="font-semibold text-accent">
                        {p.constituency}
                        {getMLAForConstituency(p.constituency) ? (
                          <span className="ml-1 text-xs font-normal text-ink-2">
                            (MLA: {getMLAForConstituency(p.constituency)})
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ink-2">Ref:</dt>
                    <dd className="font-mono text-xs text-ink-3">{p.id}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
                  <ProblemStatus status={p.status} />
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden className="size-3.5 text-ink-3" />
                    {p.area}
                    {p.constituency && p.constituency !== p.area
                      ? ` (${p.constituency})`
                      : ""}, {p.district}
                  </span>
                  <span>Reported {formatDateTime(p.reportedAt)}</span>
                </div>
              </div>
              <ButtonLink to="/report" size="sm" className="shrink-0">
                Report a similar problem
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="container-ap grid gap-6 py-6 sm:py-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">What was reported</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink">{p.description}</p>
            </section>

            {p.evidence && p.evidence.length > 0 && (
              <section className="rounded-xl border border-line bg-surface p-5">
                <h2 className="text-sm font-semibold">Evidence</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {p.evidence.map((src: string, i: number) => (
                    <img
                      key={src}
                      src={src}
                      alt={`Citizen-submitted evidence ${i + 1} for: ${p.title}`}
                      loading="lazy"
                      width={600}
                      height={400}
                      className="w-full rounded-lg border border-line object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">Location Area</h2>
              <p className="mt-1 text-xs text-ink-2">
                Approximate vicinity map. Exact coordinates remain private.
              </p>
              <div className="mt-3">
                <ProblemMap problems={[p]} selectedId={p.id} height="260px" />
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">Timeline & Updates</h2>
              <ol className="mt-3 border-l border-line pl-4">
                {p.timeline.map((t: TimelineEntry, i: number) => (
                  <li key={i} className="relative pb-4 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[21px] top-1.5 size-2 rounded-full border border-line bg-surface"
                    />
                    <p className="text-xs font-semibold">{t.label}</p>
                    {t.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{t.detail}</p>
                    )}
                    <p className="mt-0.5 text-[0.6875rem] text-ink-3">{formatDateTime(t.at)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="rounded-xl border border-line bg-surface p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                Community signal
              </h2>
              <ul className="mt-3 space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <Users aria-hidden className="mt-0.5 size-3.5 text-ink-3" />
                  <span>
                    Reported by <span className="font-medium text-ink">{p.reports} citizens</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText aria-hidden className="mt-0.5 size-3.5 text-ink-3" />
                  <span>
                    Confirmed by{" "}
                    <span className="font-medium text-ink">{p.confirmations} local reports</span>
                  </span>
                </li>
                {p.recurring && (
                  <li className="flex items-start gap-2">
                    <Repeat aria-hidden className="mt-0.5 size-3.5 text-ink-3" />
                    <span>Frequently recurring issue in this locality</span>
                  </li>
                )}
              </ul>
            </div>

            {p.officialResponse ? (
              <div className="rounded-xl border border-line bg-surface p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                  Official response
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-ink">{p.officialResponse.body}</p>
                <p className="mt-2 text-[0.6875rem] text-ink-3">
                  {p.officialResponse.from} · {formatDateTime(p.officialResponse.at)}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2">
                  Official response
                </h2>
                <p className="mt-2 text-xs text-ink-3">
                  No official response recorded yet for this report.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-line bg-surface">
              <h2 className="px-4 pt-3.5 text-xs font-semibold uppercase tracking-wider text-ink-2">
                Related problems
              </h2>
              <div className="mt-1 divide-y divide-line">
                {related.map((r: Problem) => (
                  <ProblemRow key={r.id} problem={r} />
                ))}
              </div>
            </div>

            <p className="text-xs text-ink-3">Last activity {timeAgo(p.reportedAt)}.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
