import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, Rows3 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemCard, ProblemRow } from "@/components/problem-card";
import { Button } from "@/components/ui-kit";
import { PROBLEMS } from "@/data/problems";
import { CATEGORIES, DEPARTMENTS, DISTRICTS, STATUSES } from "@/data/taxonomy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Problems Reported Across Andhra Pradesh" },
      {
        name: "description",
        content:
          "Search and filter citizen-reported problems in Andhra Pradesh by category, department, location and status.",
      },
      { property: "og:title", content: "Explore Problems — Problems@AP" },
      {
        property: "og:description",
        content:
          "Search and filter citizen-reported problems across Andhra Pradesh by category, department, location and status.",
      },
    ],
  }),
  component: Explore,
});

type Sort = "recent" | "nearby" | "most-reported";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-line bg-surface px-3 text-sm text-ink";

function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = PROBLEMS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (department !== "all" && p.department !== department) return false;
      if (district !== "all" && p.district !== district) return false;
      if (status !== "all" && p.status !== status) return false;
      if (
        q &&
        !`${p.title} ${p.description} ${p.area} ${p.district} ${p.department}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "nearby") return a.distanceKm - b.distanceKm;
      if (sort === "most-reported") return b.reports - a.reports;
      return +new Date(b.reportedAt) - +new Date(a.reportedAt);
    });
  }, [query, category, department, district, status, sort]);

  const reset = () => {
    setCategory("all");
    setDepartment("all");
    setDistrict("all");
    setStatus("all");
    setQuery("");
  };

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-10 sm:py-14">
            <h1 className="text-2xl font-semibold sm:text-3xl">Explore problems</h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] text-ink-2">
              Everything reported by citizens across Andhra Pradesh. Demonstration data.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative min-w-0">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <label htmlFor="q" className="sr-only">
                  Search problems
                </label>
                <input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search problems, areas or departments"
                  className="h-12 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[0.9375rem] placeholder:text-ink-3"
                />
              </div>
              <Button
                variant="secondary"
                className="h-12 sm:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal aria-hidden className="size-4" />
                Filters
              </Button>
            </div>

            <div
              className={cn(
                "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
                !filtersOpen && "hidden sm:grid",
              )}
            >
              <div>
                <label htmlFor="f-cat" className="sr-only">
                  Category
                </label>
                <select
                  id="f-cat"
                  className={selectClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-dep" className="sr-only">
                  Department
                </label>
                <select
                  id="f-dep"
                  className={selectClass}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-loc" className="sr-only">
                  Location
                </label>
                <select
                  id="f-loc"
                  className={selectClass}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                >
                  <option value="all">All locations</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-status" className="sr-only">
                  Status
                </label>
                <select
                  id="f-status"
                  className={selectClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Any status</option>
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-sort" className="sr-only">
                  Sort
                </label>
                <select
                  id="f-sort"
                  className={selectClass}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                >
                  <option value="recent">Most recent</option>
                  <option value="nearby">Nearby first</option>
                  <option value="most-reported">Most reported</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="container-ap py-8 sm:py-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 text-sm text-ink-2">
              {results.length} {results.length === 1 ? "problem" : "problems"}
              {query && <span> matching “{query}”</span>}
              {(category !== "all" ||
                department !== "all" ||
                district !== "all" ||
                status !== "all") && (
                <button
                  onClick={reset}
                  className="ml-3 text-ink underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </p>
            <div
              className="hidden shrink-0 items-center rounded-md border border-line bg-surface p-0.5 sm:flex"
              role="group"
              aria-label="View"
            >
              <button
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={cn(
                  "grid size-9 place-items-center rounded",
                  view === "grid" ? "bg-surface-2 text-ink" : "text-ink-3",
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={cn(
                  "grid size-9 place-items-center rounded",
                  view === "list" ? "bg-surface-2 text-ink" : "text-ink-3",
                )}
              >
                <Rows3 className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            {results.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
                <p className="text-[0.9375rem] font-medium">No problems match</p>
                <p className="mt-1 text-sm text-ink-2">
                  Try clearing a filter, or report the problem yourself.
                </p>
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p) => (
                  <ProblemCard key={p.id} problem={p} />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {results.map((p) => (
                  <ProblemRow key={p.id} problem={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
