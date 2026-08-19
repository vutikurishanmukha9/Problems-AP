import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Users, Repeat, FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemStatus } from "@/components/problem-status";
import { ProblemMap } from "@/components/problem-map";
import { ProblemRow } from "@/components/problem-card";
import { ButtonLink } from "@/components/ui-kit";
import { getProblem, PROBLEMS, formatDateTime, timeAgo } from "@/data/problems";
import { categoryLabel } from "@/data/taxonomy";

export const Route = createFileRoute("/problems/$id")({
  loader: ({ params }) => {
    const problem = getProblem(params.id);
    if (!problem) throw notFound();
    return { problem };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Problem not found — Problems@AP" }, { name: "robots", content: "noindex" }],
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
  const related = PROBLEMS.filter(
    (x) => x.id !== p.id && (x.category === p.category || x.district === p.district),
  ).slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-8 sm:py-12">
            <nav aria-label="Breadcrumb" className="text-sm text-ink-2">
              <Link to="/explore" className="hover:text-ink">
                Explore
              </Link>
              <span aria-hidden className="mx-2 text-line-strong">
                /
              </span>
              <span>{categoryLabel(p.category)}</span>
            </nav>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <h1 className="max-w-3xl text-2xl font-semibold sm:text-[2rem] sm:leading-tight">
                  {p.title}
                </h1>
                <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <dt className="text-ink-2">Category</dt>
                    <dd>{categoryLabel(p.category)}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <dt className="text-ink-2">Department</dt>
                    <dd className="truncate">{p.department}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-ink-2">Reference</dt>
                    <dd className="font-mono text-[0.8125rem]">{p.id}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-2">
                  <ProblemStatus status={p.status} />
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden className="size-4" />
                    {p.area}, {p.district} · approximate area
                  </span>
                  <span>Reported {formatDateTime(p.reportedAt)}</span>
                </div>
              </div>
              <ButtonLink to="/report" className="shrink-0">
                Report a similar problem
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="container-ap grid gap-12 py-12 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <section>
              <h2 className="text-lg font-semibold">What was reported</h2>
              <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-ink">
                {p.description}
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold">Evidence</h2>
              {p.evidence.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {p.evidence.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt={`Citizen-submitted evidence ${i + 1} for: ${p.title}`}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="w-full rounded-xl border border-line object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[0.9375rem] text-ink-2">
                  No photographic evidence was attached to this report.
                </p>
              )}
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold">Location</h2>
              <p className="mt-2 text-sm text-ink-2">
                Shown as an approximate area. Exact reported coordinates are not public.
              </p>
              <div className="mt-4">
                <ProblemMap problems={[p]} selectedId={p.id} height="320px" />
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <ol className="mt-4 border-l border-line pl-5">
                {p.timeline.map((t, i) => (
                  <li key={i} className="relative pb-6 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[23px] top-1.5 size-2 rounded-full border border-line bg-surface"
                    />
                    <p className="text-[0.9375rem] font-medium">{t.label}</p>
                    {t.detail && (
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">
                        {t.detail}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink-3">{formatDateTime(t.at)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="min-w-0 space-y-6">
            <div className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold">Community signal</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <Users aria-hidden className="mt-0.5 size-4 text-ink-3" />
                  <span>
                    Reported by <span className="font-medium">{p.reports} citizens</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileText aria-hidden className="mt-0.5 size-4 text-ink-3" />
                  <span>
                    Confirmed by{" "}
                    <span className="font-medium">{p.confirmations} local reports</span>
                  </span>
                </li>
                {p.recurring && (
                  <li className="flex items-start gap-2.5">
                    <Repeat aria-hidden className="mt-0.5 size-4 text-ink-3" />
                    <span>Appears to recur in this area</span>
                  </li>
                )}
              </ul>
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-3">
                Citizen confirmation is not government verification. It only means other
                people in the area reported the same thing.
              </p>
            </div>

            {p.officialResponse ? (
              <div className="rounded-xl border border-line bg-surface p-5">
                <h2 className="text-sm font-semibold">Official response</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  {p.officialResponse.body}
                </p>
                <p className="mt-3 text-xs text-ink-3">
                  {p.officialResponse.from} · {formatDateTime(p.officialResponse.at)}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-surface p-5">
                <h2 className="text-sm font-semibold">Official response</h2>
                <p className="mt-3 text-sm text-ink-2">
                  No official response has been recorded for this problem.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-line bg-surface">
              <h2 className="px-5 pt-5 text-sm font-semibold">Related problems</h2>
              <div className="mt-2 divide-y divide-line">
                {related.map((r) => (
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
