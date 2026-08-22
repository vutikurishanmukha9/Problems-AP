import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  Repeat,
  FileText,
  ThumbsUp,
  Check,
  Clock,
  Copy,
  X,
  Maximize2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemMap } from "@/components/problem-map";
import { ProblemRow } from "@/components/problem-card";
import { Button, ButtonLink } from "@/components/ui-kit";
import {
  getProblem,
  formatDateTime,
  timeAgo,
  type Problem,
  type TimelineEntry,
} from "@/data/problems";
import { categoryLabel, getMinisterForDepartment } from "@/data/taxonomy";
import { getMLAForConstituency } from "@/data/constituencies";
import { apiClient } from "@/lib/api-client";

export const Route = createFileRoute("/problems/$id")({
  loader: async ({ params }: { params: { id: string } }) => {
    try {
      const live = await apiClient.getProblemById(params.id);
      if (live) return { problem: live };
    } catch {
      // Fallback
    }
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
    const description = `${categoryLabel(p.category)} problem shared in ${p.area}, ${p.district}. ${p.reports} citizen voices. Handled by ${p.department}.`;
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
  const [reportsCount, setReportsCount] = useState<number>(p.reports);
  const [signaled, setSignaled] = useState(false);
  const [signaling, setSignaling] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [related, setRelated] = useState<Problem[]>([]);

  useEffect(() => {
    let active = true;
    async function loadRelated() {
      try {
        const res = await apiClient.getProblems({ pageSize: 10 });
        if (active && res?.items) {
          const others = res.items.filter((x) => x.id !== p.id);
          const matched = [
            ...others.filter((x) => x.category === p.category || x.district === p.district),
            ...others.filter((x) => x.category !== p.category && x.district !== p.district),
          ].slice(0, 4);
          setRelated(matched);
        }
      } catch {
        // Fallback
      }
    }
    loadRelated();
    return () => {
      active = false;
    };
  }, [p.id, p.category, p.district]);

  const handleSignal = async () => {
    if (signaled || signaling) return;
    setSignaling(true);
    setReportsCount((prev) => prev + 1);
    setSignaled(true);

    try {
      const res = await apiClient.signalProblem(p.id);
      if (res.upvotesCount) {
        setReportsCount(res.upvotesCount);
      }
    } catch {
      // Retain optimistic count on failure
    } finally {
      setSignaling(false);
    }
  };

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

            <div className="mt-3.5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <h1 className="max-w-3xl text-xl sm:text-2xl lg:text-3xl font-extrabold sm:leading-snug tracking-tight text-ink">
                  {p.title}
                </h1>
                <dl className="mt-3.5 flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ink-3 font-medium">Category:</dt>
                    <dd className="font-bold text-ink">{categoryLabel(p.category)}</dd>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <dt className="text-ink-3 font-medium">Department:</dt>
                    <dd className="font-semibold text-ink">
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
                      <dt className="text-ink-3 font-medium">Constituency:</dt>
                      <dd className="font-bold text-accent">
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
                    <dt className="text-ink-3 font-medium">District:</dt>
                    <dd className="font-bold text-ink">{p.district}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ink-3 font-medium">Ref ID:</dt>
                    <dd className="inline-flex items-center gap-1 font-mono text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent/20">
                      <span>{p.id}</span>
                      <button
                        type="button"
                        aria-label="Copy reference ID"
                        onClick={async () => {
                          try {
                            await navigator.clipboard?.writeText(p.id);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          } catch {
                            // Fallback
                          }
                        }}
                        className="ml-1 inline-flex items-center text-accent hover:text-accent-hover transition-colors"
                        title="Copy Reference ID"
                      >
                        {copiedRef ? (
                          <Check className="size-3 text-ok" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </dd>
                  </div>
                </dl>
                <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPin aria-hidden className="size-3.5 text-accent" />
                    {p.area}
                    {p.constituency && p.constituency !== p.area
                      ? ` (${p.constituency})`
                      : ""}, {p.district}
                  </span>
                  <span className="inline-flex items-center gap-1 text-ink-3 font-medium">
                    <Clock aria-hidden className="size-3.5" />
                    Shared {formatDateTime(p.reportedAt)}
                  </span>
                </div>
              </div>
              <ButtonLink to="/report" size="sm" className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                Share a similar problem
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="container-ap grid gap-6 py-7 sm:py-9 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-line bg-surface p-6 shadow-xs">
              <h2 className="text-base font-bold tracking-tight text-ink">What was reported</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink font-normal">{p.description}</p>
            </section>

            {p.evidence && p.evidence.length > 0 && (
              <section className="rounded-xl border border-line bg-surface p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight text-ink">Citizen Evidence Photos</h2>
                  <span className="text-xs text-ink-3 font-medium">Click to enlarge</span>
                </div>
                <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
                  {p.evidence.map((src: string, i: number) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActivePhoto(src)}
                      className="group relative block w-full overflow-hidden rounded-lg border border-line bg-surface-2 text-left shadow-2xs transition-transform duration-200 hover:scale-[1.01]"
                    >
                      <img
                        src={src}
                        alt={`Citizen-submitted evidence ${i + 1} for: ${p.title}`}
                        loading="lazy"
                        width={600}
                        height={400}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                          <Maximize2 className="size-3.5" />
                          View Photo
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-line bg-surface p-6 shadow-xs">
              <h2 className="text-base font-bold tracking-tight text-ink">Location Area</h2>
              <p className="mt-1 text-xs text-ink-2 font-medium">
                Approximate vicinity map. Exact coordinates remain private.
              </p>
              <div className="mt-3.5">
                <ProblemMap problems={[p]} selectedId={p.id} height="280px" />
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-6 shadow-xs">
              <h2 className="text-base font-bold tracking-tight text-ink">Activity Log</h2>
              <ol className="mt-3.5 border-l-2 border-line-strong pl-4">
                {p.timeline.map((t: TimelineEntry, i: number) => (
                  <li key={i} className="relative pb-4.5 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-accent bg-surface"
                    />
                    <p className="text-xs font-bold text-ink">{t.label}</p>
                    {t.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{t.detail}</p>
                    )}
                    <p className="mt-0.5 text-[0.6875rem] text-ink-3 font-medium">{formatDateTime(t.at)}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="min-w-0 space-y-4.5">
            {/* Community Signal Card with Live Action */}
            <div className="rounded-xl border border-line bg-surface p-6 shadow-xs">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-2">
                Community voices
              </h2>
              <ul className="mt-3.5 space-y-3 text-xs">
                <li className="flex items-start gap-2.5">
                  <Users aria-hidden className="mt-0.5 size-4 text-accent shrink-0" />
                  <span className="text-ink">
                    Shared by <span className="font-extrabold text-accent">{reportsCount} citizens</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FileText aria-hidden className="mt-0.5 size-4 text-ink-3 shrink-0" />
                  <span className="text-ink">
                    Supported by{" "}
                    <span className="font-bold text-ink">{p.confirmations} local citizens</span>
                  </span>
                </li>
                {p.recurring && (
                  <li className="flex items-start gap-2.5">
                    <Repeat aria-hidden className="mt-0.5 size-4 text-warn shrink-0" />
                    <span className="font-medium text-ink-2">Frequently recurring issue in this locality</span>
                  </li>
                )}
              </ul>

              <div className="mt-4 border-t border-line pt-3.5">
                {signaled ? (
                  <div className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-xs font-medium text-ok">
                    <Check className="size-4 shrink-0" />
                    <span>Your signal has been recorded. Thank you!</span>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={handleSignal}
                    disabled={signaling}
                  >
                    <ThumbsUp className="size-3.5" />
                    I also face this problem (+1)
                  </Button>
                )}
              </div>
            </div>

            {related.length > 0 && (
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
            )}

            <p className="text-xs text-ink-3">Last activity {timeAgo(p.reportedAt)}.</p>
          </aside>
        </div>

        {/* Full-Screen Evidence Photo Viewer Modal */}
        {activePhoto && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setActivePhoto(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl bg-surface p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                aria-label="Close photo preview"
                className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full bg-black/75 text-white shadow-md transition-colors hover:bg-black"
              >
                <X className="size-4" />
              </button>
              <img
                src={activePhoto}
                alt="Evidence Fullscreen View"
                className="max-h-[82vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
