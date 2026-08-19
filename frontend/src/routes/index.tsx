import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  PlusCircle,
  Search,
  AlertCircle,
  Building2,
  MapPin,
  Map as MapIcon,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemCard } from "@/components/problem-card";
import { ButtonLink, Section } from "@/components/ui-kit";
import { type Problem, departmentStats, districtStats } from "@/data/problems";
import { CATEGORIES, MINISTRIES_DATA, DISTRICTS_DATA } from "@/data/taxonomy";
import { apiClient, type OverviewStatistics } from "@/lib/api-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Problems@AP — Citizen Problem Reporting Platform for Andhra Pradesh" },
      {
        name: "description",
        content:
          "An independent citizen platform to report public problems and view reported problems by ministries or districts across Andhra Pradesh.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TwoCoreFeatures />
        <ProblemStatisticsSection />
        <CategoriesSection />
        <RecentReports />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  const [stats, setStats] = useState<OverviewStatistics>({
    total_problems: 0,
    constituencies_covered: 175,
    ministries_mapped: 57,
    districts_active: 28,
  });

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const live = await apiClient.getOverviewStatistics();
        if (active && live) {
          setStats(live);
        }
      } catch {
        // Fallback
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="border-b border-line bg-canvas">
      <div className="container-ap py-7 sm:py-12 lg:py-16">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
          {/* Left Column: Comprehensive Civic Headline & Actions */}
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-[0.6875rem] sm:text-xs font-bold text-amber-950 dark:text-amber-200">
              <AlertCircle className="size-3.5 shrink-0 text-amber-700" />
              <span className="truncate sm:whitespace-normal">Independent Citizen Initiative · Unofficial Platform</span>
            </div>

            <h1 className="mt-4 w-full text-[1.65rem] font-extrabold leading-[1.16] tracking-tight text-ink text-left sm:text-3xl md:text-4xl lg:text-[2.75rem]">
              Report citizen problems and view reported problems across Andhra Pradesh.
            </h1>

            <p className="mt-3.5 w-full text-xs sm:text-sm md:text-base leading-relaxed text-ink-2 font-normal text-left">
              An independent, open platform built by citizens to voice public issues across 175 assembly
              constituencies, 57 ministries, and 28 districts. 100% anonymous — no registration or
              authentication required.
            </p>

            {/* Quick Hero Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <ButtonLink to="/report" size="lg" className="w-full sm:w-auto justify-center px-6 shadow-sm">
                <PlusCircle className="mr-2 size-5 shrink-0" />
                1. Report a Problem
              </ButtonLink>
              <ButtonLink to="/explore" variant="secondary" size="lg" className="w-full sm:w-auto justify-center px-6">
                <Search className="mr-2 size-5 shrink-0 text-accent" />
                2. See Reported Problems
              </ButtonLink>
            </div>

            {/* Trust Badges */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-ink-2 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 shrink-0 text-ok" />
                100% Anonymous
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="size-4 shrink-0 text-accent" />
                Live Civic Aggregations
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-info" />
                175 Assembly Seats
              </span>
            </div>
          </div>

          {/* Right Column: Live Statewide Overview Card */}
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-ink">
                  Statewide Civic Pulse
                </p>
              </div>
              <span className="text-[0.6875rem] font-semibold text-ink-3">Live Metrics</span>
            </div>

            {/* Metric 2x2 Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 sm:p-3.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">
                  Problems Shared
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-accent">
                  {stats.total_problems.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 sm:p-3.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">
                  Constituencies
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-ink">
                  {stats.constituencies_covered}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 sm:p-3.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">
                  Ministries Mapped
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-ink">
                  {stats.ministries_mapped}
                </p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/60 p-3 sm:p-3.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-ink-3">
                  Districts Active
                </p>
                <p className="mt-1 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight text-ink">
                  {stats.districts_active}
                </p>
              </div>
            </div>

            {/* Direct Map Teaser */}
            <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">OpenStreetMap Problem View</p>
                <p className="text-[0.6875rem] text-ink-2 truncate">
                  Visual geospatial distribution across Andhra Pradesh
                </p>
              </div>
              <ButtonLink to="/map" variant="secondary" size="sm" className="w-full sm:w-auto shrink-0 justify-center text-xs font-bold">
                <MapIcon className="mr-1.5 size-3.5 text-accent" />
                View Map
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Prominent 2 Core Features Callout */
function TwoCoreFeatures() {
  return (
    <section className="border-b border-line bg-surface py-10">
      <div className="container-ap">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Feature 1: Report a Problem */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-accent/40 bg-accent/5 p-6 sm:p-8 transition-all hover:border-accent shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-xs">
                  1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Report a Problem</h2>
              </div>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-2">
                Facing issues with roads, drinking water, drainage, electricity, or sanitation?
                Submit your problem anonymously in less than 1 minute with photos and GPS.
              </p>
            </div>
            <div className="mt-7">
              <ButtonLink to="/report" size="md" className="w-full sm:w-auto font-bold">
                <PlusCircle className="mr-2 size-4" />
                Report a Problem Now
              </ButtonLink>
            </div>
          </div>

          {/* Feature 2: See Reported Problems */}
          <div className="flex flex-col justify-between rounded-2xl border border-line-strong bg-surface-2/60 p-6 sm:p-8 transition-all hover:border-ink/40 shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-canvas shadow-xs">
                  2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">See Reported Problems</h2>
              </div>
              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-2">
                Explore all problems submitted across 175 assembly constituencies, 57 ministries,
                and 28 districts. Filter by ministry or location.
              </p>
            </div>
            <div className="mt-7">
              <ButtonLink to="/explore" variant="secondary" size="md" className="w-full sm:w-auto font-bold">
                <Search className="mr-2 size-4 text-accent" />
                Browse Reported Problems
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Interactive Problem Statistics: Ministry-wise OR District-wise */
function ProblemStatisticsSection() {
  const [activeTab, setActiveTab] = useState<"ministries" | "districts">("ministries");

  const [deptCounts, setDeptCounts] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    departmentStats().forEach((v, k) => map.set(k, v.total));
    return map;
  });

  const [distCounts, setDistCounts] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    districtStats().forEach((v, k) => map.set(k, v.total));
    return map;
  });

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const [liveDepts, liveDists] = await Promise.all([
          apiClient.getDepartmentStatistics(),
          apiClient.getDistrictStatistics(),
        ]);
        if (active) {
          if (liveDepts?.length) {
            const m = new Map<string, number>();
            for (const d of liveDepts) m.set(d.department, d.total_problems);
            setDeptCounts(m);
          }
          if (liveDists?.length) {
            const m = new Map<string, number>();
            for (const d of liveDists) m.set(d.district, d.total_problems);
            setDistCounts(m);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  // Ranked ministries
  const rankedMinistries = MINISTRIES_DATA.map((min) => ({
    ...min,
    total: deptCounts.get(min.name) ?? 0,
  })).sort((a, b) => b.total - a.total);

  // Ranked districts
  const rankedDistricts = DISTRICTS_DATA.map((dist) => ({
    ...dist,
    total: distCounts.get(dist.name) ?? 0,
  })).sort((a, b) => b.total - a.total);

  return (
    <Section
      title="Problem Statistics"
      description="View where citizen problems are concentrated across Andhra Pradesh — sorted by Ministries or by Districts."
      action={
        <div className="grid grid-cols-2 w-full sm:w-auto sm:flex items-center rounded-lg border border-line bg-surface p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("ministries")}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "ministries"
                ? "bg-accent text-white shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <Building2 className="size-3.5" />
            <span className="truncate">By Ministries ({MINISTRIES_DATA.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("districts")}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "districts"
                ? "bg-accent text-white shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <MapPin className="size-3.5" />
            <span className="truncate">By Districts ({DISTRICTS_DATA.length})</span>
          </button>
        </div>
      }
    >
      {activeTab === "ministries" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rankedMinistries.slice(0, 12).map((m, idx) => (
            <Link
              key={m.id}
              to="/explore"
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs transition-all hover:bg-surface-2 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-5.5 shrink-0 items-center justify-center rounded bg-surface-2 border border-line text-[0.6875rem] font-extrabold text-ink">
                    #{idx + 1}
                  </span>
                  <p className="truncate text-xs font-bold text-ink">{m.name}</p>
                </div>
                <p className="mt-1 truncate text-[0.6875rem] text-ink-3 font-medium">Minister: {m.minister}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold tabular-nums text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
                  {m.total} {m.total === 1 ? "voice" : "voices"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rankedDistricts.slice(0, 12).map((d, idx) => (
            <Link
              key={d.id}
              to="/explore"
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs transition-all hover:bg-surface-2 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-5.5 shrink-0 items-center justify-center rounded bg-surface-2 border border-line text-[0.6875rem] font-extrabold text-ink">
                    #{idx + 1}
                  </span>
                  <p className="truncate text-xs font-bold text-ink">{d.name}</p>
                </div>
                <p className="mt-1 truncate text-[0.6875rem] text-ink-3 font-medium">
                  Headquarters: {d.headquarters}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold tabular-nums text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
                  {d.total} {d.total === 1 ? "voice" : "voices"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Link
          to="/departments"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
        >
          View Full Ministry & District Rankings
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Section>
  );
}

function CategoriesSection() {
  return (
    <Section
      title="Browse by Problem Category"
      description="Quickly explore problems categorized into the 10 major civic domains."
      action={
        <Link
          to="/explore"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-accent"
        >
          See all
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to="/explore"
            className="group rounded-xl border border-line bg-surface p-4 shadow-xs transition-all hover:border-line-strong hover:bg-surface-2 hover:-translate-y-0.5"
          >
            <p className="text-xs font-bold text-ink group-hover:text-accent">{c.label}</p>
            <p className="mt-1 truncate text-[0.6875rem] text-ink-3 font-medium">{c.department}</p>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function RecentReports() {
  const [recent, setRecent] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      try {
        const res = await apiClient.getProblems({ pageSize: 6, sort: "recent" });
        if (active && res?.items) {
          setRecent(res.items);
        }
      } catch {
        // Fallback
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRecent();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Section
      title="Recently Reported Problems"
      description="Latest citizen grievance reports submitted across Andhra Pradesh."
      action={
        <ButtonLink to="/explore" variant="secondary" size="sm" className="font-bold">
          Browse All Reported Problems
        </ButtonLink>
      }
    >
      {loading ? (
        <div className="py-8 text-center text-xs text-ink-3 font-medium">Loading recent citizen reports...</div>
      ) : recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center sm:p-12">
          <AlertCircle className="mx-auto size-9 text-ink-3" />
          <h3 className="mt-3 text-base font-bold text-ink">No citizen problems reported yet</h3>
          <p className="mt-1 text-xs sm:text-sm text-ink-2 max-w-md mx-auto">
            Be the first citizen to voice an issue in your locality or explore the statewide directory.
          </p>
          <div className="mt-5">
            <ButtonLink to="/report" size="md" className="font-bold">
              <PlusCircle className="mr-2 size-4" />
              Report a Problem
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((p) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      )}
    </Section>
  );
}
