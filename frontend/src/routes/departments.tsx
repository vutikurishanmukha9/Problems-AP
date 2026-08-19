import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ChangeEvent } from "react";
import { Search, ArrowUpDown, Building2, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  DEPARTMENTS,
  DISTRICTS_DATA,
  getMinisterForDepartment,
  getHeadquartersForDistrict,
} from "@/data/taxonomy";
import { departmentStats, districtStats } from "@/data/problems";
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
type SortMode = "most-reported" | "most-unresolved" | "name";

interface StatRow {
  name: string;
  subtext: string;
  total: number;
  open: number;
  resolved: number;
  resolutionRate: number;
}

function StatisticsPage() {
  const [view, setView] = useState<StatView>("ministries");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("most-reported");

  const deptMap = useMemo(() => departmentStats(), []);
  const distMap = useMemo(() => districtStats(), []);

  // Total state-wide statistics
  const totalStats = useMemo(() => {
    let totalReported = 0;
    let totalUnresolved = 0;
    deptMap.forEach((s: { total: number; open: number }) => {
      totalReported += s.total;
      totalUnresolved += s.open;
    });
    return { totalReported, totalUnresolved };
  }, [deptMap]);

  // Ranked list depending on view (Ministries vs Districts)
  const rankedList = useMemo<StatRow[]>(() => {
    const query = q.trim().toLowerCase();

    if (view === "ministries") {
      const list: StatRow[] = DEPARTMENTS.filter((d: string) =>
        query ? d.toLowerCase().includes(query) : true,
      ).map((name: string) => {
        const s = deptMap.get(name) ?? { total: 0, open: 0 };
        const resolved = Math.max(0, s.total - s.open);
        const resolutionRate = s.total > 0 ? Math.round((resolved / s.total) * 100) : 100;
        const ministerInfo = getMinisterForDepartment(name);
        return {
          name,
          subtext: ministerInfo?.minister
            ? `Minister: ${ministerInfo.minister}`
            : "Responsible Minister",
          total: s.total,
          open: s.open,
          resolved,
          resolutionRate,
        };
      });

      if (sort === "most-reported") {
        return list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      }
      if (sort === "most-unresolved") {
        return list.sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
      }
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const list: StatRow[] = DISTRICTS_DATA.filter((dist) =>
        query
          ? dist.name.toLowerCase().includes(query) ||
            dist.headquarters.toLowerCase().includes(query)
          : true,
      ).map((dist) => {
        const s = distMap.get(dist.name) ?? { total: 0, open: 0 };
        const resolved = Math.max(0, s.total - s.open);
        const resolutionRate = s.total > 0 ? Math.round((resolved / s.total) * 100) : 100;
        const hq = getHeadquartersForDistrict(dist.name) || dist.headquarters;
        return {
          name: dist.name,
          subtext: `Headquarters: ${hq}`,
          total: s.total,
          open: s.open,
          resolved,
          resolutionRate,
        };
      });

      if (sort === "most-reported") {
        return list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
      }
      if (sort === "most-unresolved") {
        return list.sort((a, b) => b.open - a.open || a.name.localeCompare(b.name));
      }
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [view, q, sort, deptMap, distMap]);

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
                  See where problems are concentrated across Andhra Pradesh — by Ministries or by
                  Districts.
                </p>
              </div>

              {/* View toggle button group */}
              <div className="flex items-center rounded-lg border border-line bg-canvas p-1">
                <button
                  type="button"
                  onClick={() => {
                    setView("ministries");
                    setQ("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all",
                    view === "ministries"
                      ? "bg-accent text-white shadow-sm"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  <Building2 className="size-3.5" />
                  By Ministries ({DEPARTMENTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("districts");
                    setQ("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all",
                    view === "districts"
                      ? "bg-accent text-white shadow-sm"
                      : "text-ink-2 hover:text-ink",
                  )}
                >
                  <MapPin className="size-3.5" />
                  By Districts ({DISTRICTS_DATA.length})
                </button>
              </div>
            </div>

            {/* Quick Aggregate Cards */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-2xl">
              <div className="rounded-lg border border-line bg-canvas p-3">
                <p className="text-[0.6875rem] font-medium text-ink-3">
                  {view === "ministries" ? "State Ministries" : "State Districts"}
                </p>
                <p className="mt-0.5 text-xl font-bold text-ink">
                  {view === "ministries" ? DEPARTMENTS.length : DISTRICTS_DATA.length}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-canvas p-3">
                <p className="text-[0.6875rem] font-medium text-ink-3">Total Reported Problems</p>
                <p className="mt-0.5 text-xl font-bold text-ink">{totalStats.totalReported}</p>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border border-line bg-canvas p-3">
                <p className="text-[0.6875rem] font-medium text-ink-3">Unresolved Backlog</p>
                <p className="mt-0.5 text-xl font-bold text-accent">{totalStats.totalUnresolved}</p>
              </div>
            </div>

            {/* Search and Sort controls */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm placeholder:text-ink-3"
                />
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown aria-hidden className="size-3.5 text-ink-3" />
                <label htmlFor="sort" className="text-xs text-ink-2">
                  Sort:
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    // SAFETY: The select dropdown values strictly match the SortMode union
                    setSort(e.target.value as SortMode);
                  }}
                  className="h-9 rounded-md border border-line bg-surface px-3 text-xs font-medium text-ink"
                >
                  <option value="most-reported">Most Problems Reported</option>
                  <option value="most-unresolved">Most Unresolved Backlog</option>
                  <option value="name">Alphabetical (A–Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Top Highlights */}
        {!q && topItems.length > 0 && (
          <section className="border-b border-line bg-surface-2/40 py-6">
            <div className="container-ap">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-2">
                {view === "ministries"
                  ? "Ministries With Highest Citizen Problems"
                  : "Districts With Highest Citizen Problems"}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {topItems.map((item, idx) => (
                  <Link
                    key={item.name}
                    to="/explore"
                    className="rounded-lg border border-line bg-surface p-3.5 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] font-bold text-ink-2">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-accent">{item.total} reported</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-ink line-clamp-1">{item.name}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-ink-3 line-clamp-1">
                      {item.subtext}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[0.6875rem] text-ink-2">
                      <span>{item.open} open backlog</span>
                      <span>{item.resolutionRate}% resolved</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comprehensive Directory Table / List */}
        <section className="container-ap py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">
              {view === "ministries" ? "All 57 Ministries & Portfolios" : "All 28 State Districts"}
            </h2>
            <span className="text-xs text-ink-2">
              Showing {rankedList.length} {view === "ministries" ? "ministries" : "districts"}
            </span>
          </div>

          <div className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {rankedList.map((item, idx) => {
              const barPercent = Math.max(4, Math.round((item.total / maxTotal) * 100));

              return (
                <div
                  key={item.name}
                  className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-surface-2/60 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:items-center"
                >
                  {/* Rank */}
                  <span className="hidden size-7 items-center justify-center rounded bg-surface-2 text-xs font-bold text-ink-2 sm:flex">
                    {idx + 1}
                  </span>

                  {/* Name and responsible minister / HQ */}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-ink-2">{item.subtext}</p>
                  </div>

                  {/* Proportional Problem Volume Bar */}
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center justify-between text-[0.6875rem] text-ink-3">
                      <span>Volume load</span>
                      <span className="tabular-nums font-semibold text-ink">
                        {item.total} reported ({item.open} open)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-3">
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
                      className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-surface px-3 text-xs font-semibold text-ink hover:bg-surface-2"
                    >
                      View Problems
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
