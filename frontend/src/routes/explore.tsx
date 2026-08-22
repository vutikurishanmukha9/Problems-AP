import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Search, SlidersHorizontal, LayoutGrid, Rows3, X, PlusCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemCard, ProblemRow } from "@/components/problem-card";
import { Button, ButtonLink } from "@/components/ui-kit";
import { PROBLEMS, type Problem } from "@/data/problems";
import {
  CATEGORIES,
  CONSTITUENCY_DATA,
  MINISTRIES_DATA,
  DISTRICTS_DATA,
} from "@/data/taxonomy";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Problems Reported Across Andhra Pradesh" },
      {
        name: "description",
        content:
          "Search and filter citizen-reported problems in Andhra Pradesh by category, ministry, constituency, and district.",
      },
      { property: "og:title", content: "Explore Problems — Problems@AP" },
      {
        property: "og:description",
        content:
          "Search and filter citizen-reported problems across Andhra Pradesh by category, ministry, constituency, and district.",
      },
    ],
  }),
  component: Explore,
});

type Sort = "recent" | "nearby" | "most-reported";

function Explore() {
  const [allProblems, setAllProblems] = useState<Problem[]>(PROBLEMS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");
  const [constituency, setConstituency] = useState("all");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Load live problems from backend
  useEffect(() => {
    let active = true;
    async function loadProblems() {
      try {
        const res = await apiClient.getProblems({ pageSize: 100 });
        if (active && res?.items) {
          setAllProblems(res.items);
        }
      } catch {
        // Fallback to initial
      }
    }
    loadProblems();
    return () => {
      active = false;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allProblems.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (department !== "all" && p.department !== department) return false;
      if (constituency !== "all" && p.constituency !== constituency) return false;
      if (district !== "all" && p.district !== district) return false;
      if (
        q &&
        !`${p.title} ${p.description} ${p.area} ${p.constituency || ""} ${p.district} ${p.department}`
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
  }, [allProblems, query, category, department, constituency, district, sort]);

  const reset = () => {
    setCategory("all");
    setDepartment("all");
    setConstituency("all");
    setDistrict("all");
    setQuery("");
  };

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-5 sm:py-7">
            <h1 className="text-xl font-bold sm:text-2xl">See Reported Problems</h1>
            <p className="mt-1 max-w-2xl text-xs text-ink-2 sm:text-sm">
              Browse public issues reported by citizens across 175 assembly constituencies, 57
              ministries, and 28 districts.
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder="Search by keywords, constituency, area, district, or ministry..."
                  className="h-10 w-full rounded-full border border-line bg-canvas pl-10 pr-10 text-xs sm:text-sm placeholder:text-ink-3 focus:bg-surface"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant={filtersOpen ? "primary" : "secondary"}
                size="sm"
                className="h-10 sm:hidden"
                onClick={() => setFiltersOpen((o) => !o)}
              >
                <SlidersHorizontal aria-hidden className="size-3.5" />
                Filters
              </Button>
            </div>

            <div
              className={cn(
                "mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
                !filtersOpen && "hidden sm:grid",
              )}
            >
              <div>
                <label htmlFor="f-cat" className="sr-only">
                  Category
                </label>
                <select
                  id="f-cat"
                  className="select-ap h-9.5 w-full min-w-0 px-3 text-xs text-ink shadow-2xs font-medium"
                  value={category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                >
                  <option value="all">All Categories (10)</option>
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
                  className="select-ap h-9.5 w-full min-w-0 px-3 text-xs text-ink shadow-2xs font-medium"
                  value={department}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setDepartment(e.target.value)}
                >
                  <option value="all">All 57 Ministries</option>
                  {MINISTRIES_DATA.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} — Minister: {d.minister}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-const" className="sr-only">
                  Constituency
                </label>
                <select
                  id="f-const"
                  className="select-ap h-9.5 w-full min-w-0 px-3 text-xs text-ink shadow-2xs font-medium"
                  value={constituency}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setConstituency(e.target.value)}
                >
                  <option value="all">All 175 Constituencies</option>
                  {CONSTITUENCY_DATA.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} — MLA: {c.mla}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-loc" className="sr-only">
                  District
                </label>
                <select
                  id="f-loc"
                  className="select-ap h-9.5 w-full min-w-0 px-3 text-xs text-ink shadow-2xs font-medium"
                  value={district}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setDistrict(e.target.value)}
                >
                  <option value="all">All 28 Districts</option>
                  {DISTRICTS_DATA.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} (HQ: {d.headquarters})
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
                  className="select-ap h-9.5 w-full min-w-0 px-3 text-xs text-ink shadow-2xs font-medium"
                  value={sort}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    // SAFETY: The select dropdown only offers options defined in the Sort union
                    setSort(e.target.value as Sort);
                  }}
                >
                  <option value="recent">Most recent</option>
                  <option value="nearby">Nearby first</option>
                  <option value="most-reported">Most citizen voices</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="container-ap py-5 sm:py-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="min-w-0 text-xs sm:text-sm text-ink-2">
              <span className="font-semibold text-ink">{results.length}</span>{" "}
              {results.length === 1 ? "problem" : "problems"}
              {query && <span> matching “{query}”</span>}
              {(category !== "all" ||
                department !== "all" ||
                constituency !== "all" ||
                district !== "all") && (
                <button onClick={reset} className="ml-3 text-ink underline underline-offset-2">
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
                  "grid size-8 place-items-center rounded",
                  view === "grid" ? "bg-surface-2 text-ink" : "text-ink-3",
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={cn(
                  "grid size-8 place-items-center rounded",
                  view === "list" ? "bg-surface-2 text-ink" : "text-ink-3",
                )}
              >
                <Rows3 className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {results.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center shadow-xs">
                <p className="text-base font-bold text-ink">No problems found</p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-ink-2">
                  {query || category !== "all" || department !== "all" || constituency !== "all" || district !== "all"
                    ? "No reported issues match your active search and filters. Be the first citizen to report this problem."
                    : "No public problems have been submitted yet. Be the first citizen to voice an issue in your area."}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {(query || category !== "all" || department !== "all" || constituency !== "all" || district !== "all") && (
                    <Button variant="secondary" size="sm" onClick={reset}>
                      Reset filters
                    </Button>
                  )}
                  <ButtonLink to="/report" size="sm">
                    <PlusCircle className="mr-1.5 size-4" />
                    Report this problem
                  </ButtonLink>
                </div>
              </div>
            ) : view === "grid" ? (
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((p: Problem) => (
                  <ProblemCard key={p.id} problem={p} />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {results.map((p: Problem) => (
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
