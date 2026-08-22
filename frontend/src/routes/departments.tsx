import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Search, ArrowUpDown, Building2, MapPin, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  DEPARTMENTS,
  DISTRICTS_DATA,
  getMinisterForDepartment,
  getHeadquartersForDistrict,
} from "@/data/taxonomy";
import { departmentStats, districtStats } from "@/data/problems";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Problem Statistics (Ministries & Districts) — Problems@AP" },
      {
        name: "description",
        content:
          "Public statistics on citizen-reported problems across 57 Andhra Pradesh Ministries and 28 Districts. See which departments or districts have the highest reported problems.",
      },
    ],
  }),
  component: StatisticsPage,
});

type StatView = "ministries" | "districts";
type SortMode = "most-reported" | "name";

interface StatRow {
  name: string;
  subtext: string;
  total: number;
}

function StatisticsPage() {
  const [view, setView] = useState<StatView>("ministries");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("most-reported");

  // Local fallback maps
  const initialDeptMap = useMemo(() => departmentStats(), []);
  const initialDistMap = useMemo(() => districtStats(), []);

  const [deptCounts, setDeptCounts] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    initialDeptMap.forEach((v, k) => map.set(k, v.total));
    return map;
  });

  const [distCounts, setDistCounts] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    initialDistMap.forEach((v, k) => map.set(k, v.total));
    return map;
  });

  // Fetch live statistics from backend on mount
  useEffect(() => {
    let active = true;

    async function loadLiveStats() {
      try {
        const [liveDepts, liveDists] = await Promise.all([
          apiClient.getDepartmentStatistics(),
          apiClient.getDistrictStatistics(),
        ]);

        if (active) {
          if (liveDepts && liveDepts.length > 0) {
            const nextDeptMap = new Map<string, number>();
            for (const d of liveDepts) {
              nextDeptMap.set(d.department, d.total_problems);
            }
            setDeptCounts(nextDeptMap);
          }

          if (liveDists && liveDists.length > 0) {
            const nextDistMap = new Map<string, number>();
            for (const d of liveDists) {
              nextDistMap.set(d.district, d.total_problems);
            }
            setDistCounts(nextDistMap);
          }
        }
      } catch {
        // Retain initial counts
      }
    }

    loadLiveStats();
    return () => {
      active = false;
    };
  }, []);

  // Total state-wide statistics
  const totalStats = useMemo(() => {
    let totalReported = 0;
    deptCounts.forEach((count) => {
      totalReported += count;
    });
    return { totalReported };
  }, [deptCounts]);

  // Ranked list depending on view (Ministries vs Districts)
  const rankedList = useMemo<StatRow[]>(() => {
    const query = q.trim().toLowerCase();

    if (view === "ministries") {
      const list: StatRow[] = DEPARTMENTS.filter((d: string) =>
        query ? d.toLowerCase().includes(query) : true,
      ).map((name: string) => {
        const total = deptCounts.get(name) ?? 0;
        const ministerInfo = getMinisterForDepartment(name);
        return {
          name,
          subtext: ministerInfo?.minister
            ? `Minister: ${ministerInfo.minister}`
            : "Responsible Minister",
          total,
        };
      });

      if (sort === "most-reported") {
        return list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      }
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const list: StatRow[] = DISTRICTS_DATA.filter((dist) =>
        query
          ? dist.name.toLowerCase().includes(query) ||
            dist.headquarters.toLowerCase().includes(query)
          : true,
      ).map((dist) => {
        const total = distCounts.get(dist.name) ?? 0;
        const hq = getHeadquartersForDistrict(dist.name) || dist.headquarters;
        return {
          name: dist.name,
          subtext: `Headquarters: ${hq}`,
          total,
        };
      });

      if (sort === "most-reported") {
        return list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      }
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [view, q, sort, deptCounts, distCounts]);

  const maxTotal = useMemo(() => {
    return Math.max(...rankedList.map((d) => d.total), 1);
  }, [rankedList]);

  const topItems = useMemo(() => {
    return [...rankedList]
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [rankedList]);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Header banner */}
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-6 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-ink sm:text-2xl">Problem Statistics</h1>
                <p className="mt-1 max-w-2xl text-xs text-ink-2 sm:text-sm">
                  See where citizen problems are concentrated across Andhra Pradesh — by Ministries
                  or by Districts.
                </p>
              </div>

              {/* View toggle button group */}
              <div className="grid grid-cols-2 w-full sm:w-auto sm:flex items-center rounded-lg border border-line bg-canvas p-1">
                <button
                  type="button"
                  onClick={() => {
                    setView("ministries");
                    setQ("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all",
                    view === "ministries"
                      ? "bg-accent text-white shadow-sm"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  <Building2 className="size-3.5" />
                  <span className="truncate">By Ministries ({DEPARTMENTS.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("districts");
                    setQ("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all",
                    view === "districts"
                      ? "bg-accent text-white shadow-sm"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  <MapPin className="size-3.5" />
                  <span className="truncate">By Districts ({DISTRICTS_DATA.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Aggregate Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3.5 max-w-xl">
              <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">
                  {view === "ministries" ? "State Ministries" : "State Districts"}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-ink">
                  {view === "ministries" ? DEPARTMENTS.length : DISTRICTS_DATA.length}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">Total Problems Shared</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-accent">
                  {totalStats.totalReported.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Search and Sort controls */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-md">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
                />
                <label htmlFor="dq" className="sr-only">
                  Search statistics
                </label>
                <input
                  id="dq"
                  value={q}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                  placeholder={
                    view === "ministries"
                      ? "Search among 57 ministries..."
                      : "Search among 28 districts..."
                  }
                  className="h-10.5 w-full rounded-full border border-line bg-surface pl-10 pr-10 text-sm font-medium placeholder:text-ink-3 focus:border-accent"
                />
                {q && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown aria-hidden className="size-3.5 text-ink-3" />
                <label htmlFor="sort" className="text-xs font-bold text-ink-2">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    // SAFETY: The select dropdown only offers options defined in the SortMode union
                    setSort(e.target.value as SortMode);
                  }}
                  className="h-9.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-xs"
                >
                  <option value="most-reported">Most Problems Shared</option>
                  <option value="name">Alphabetical (A–Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Top Highlights */}
        {!q && topItems.length > 0 && (
          <section className="border-b border-line bg-surface-2/40 py-7">
            <div className="container-ap">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink-2">
                {view === "ministries"
                  ? "Ministries With Highest Citizen Problems"
                  : "Districts With Highest Citizen Problems"}
              </h2>
              <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {topItems.map((item, idx) => (
                  <Link
                    key={item.name}
                    to="/explore"
                    className="rounded-xl border border-line bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-line-strong"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-surface-2 border border-line px-2 py-0.5 text-[0.6875rem] font-extrabold text-ink">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
                        {item.total} {item.total === 1 ? "voice" : "voices"}
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs font-bold text-ink line-clamp-1">{item.name}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-ink-3 font-medium line-clamp-1">
                      {item.subtext}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comprehensive Directory Table / List */}
        <section className="container-ap py-7 sm:py-9">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-ink">
              {view === "ministries" ? "All 57 Ministries & Portfolios" : "All 28 State Districts"}
            </h2>
            <span className="text-xs font-semibold text-ink-2">
              Showing {rankedList.length} {view === "ministries" ? "ministries" : "districts"}
            </span>
          </div>

          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
            {rankedList.map((item, idx) => {
              const barPercent = Math.max(4, Math.round((item.total / maxTotal) * 100));

              return (
                <div
                  key={item.name}
                  className="grid grid-cols-1 gap-3 p-4.5 transition-colors hover:bg-surface-2/60 sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  {/* Rank */}
                  <span className="hidden size-8 items-center justify-center rounded-lg bg-surface-2 border border-line text-xs font-extrabold text-ink sm:flex">
                    {idx + 1}
                  </span>

                  {/* Name and responsible minister / HQ */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink-2">{item.subtext}</p>
                  </div>

                  {/* Problem Volume Bar */}
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center justify-between text-[0.6875rem] text-ink-3">
                      <span className="font-semibold">Problem volume</span>
                      <span className="tabular-nums font-bold text-accent">
                        {item.total} {item.total === 1 ? "voice" : "voices"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-accent transition-all duration-300"
                        style={{ width: `${item.total > 0 ? barPercent : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Explore button */}
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <Link
                      to="/explore"
                      className="inline-flex h-8.5 items-center justify-center rounded-lg border border-line-strong bg-surface px-3.5 text-xs font-bold text-ink hover:bg-surface-2 hover:border-ink/40 transition-all shadow-2xs"
                    >
                      View Problems →
                    </Link>
                  </div>
                </div>
              );
            })}

            {rankedList.length === 0 && (
              <div className="py-12 text-center text-xs text-ink-2">
                No matching {view === "ministries" ? "ministries" : "districts"} found.
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
