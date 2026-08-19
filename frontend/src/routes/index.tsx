import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PlusCircle, Search, AlertCircle, Building2, MapPin } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemCard } from "@/components/problem-card";
import { ButtonLink, Section } from "@/components/ui-kit";
import { PROBLEMS, SNAPSHOT, departmentStats, districtStats } from "@/data/problems";
import { CATEGORIES, MINISTRIES_DATA, DISTRICTS_DATA } from "@/data/taxonomy";

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
  return (
    <section className="border-b border-line bg-canvas">
      <div className="container-ap py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-3.5" />
          Independent Citizen Initiative · Not an Official Government Portal
        </div>

        <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
          Report citizen problems and view reported problems across Andhra Pradesh.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
          A platform created by normal citizens to share problems affecting the general public. No
          registration, login, or authentication required.
        </p>

        {/* Snapshot Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-3">
              Total Reported
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {SNAPSHOT.reported.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-3">
              Under Review
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {SNAPSHOT.underReview.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-3">
              Resolved
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {SNAPSHOT.resolved.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-3">
              This Month
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {SNAPSHOT.thisMonth.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Prominent 2 Core Features Callout */
function TwoCoreFeatures() {
  return (
    <section className="border-b border-line bg-surface py-8">
      <div className="container-ap">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Feature 1: Report a Problem */}
          <div className="flex flex-col justify-between rounded-xl border-2 border-accent/40 bg-accent/5 p-5 transition-all hover:border-accent">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-ink">Report a Problem</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">
                Facing issues with roads, drinking water, drainage, electricity, or sanitation?
                Submit your grievance anonymously in less than 1 minute.
              </p>
            </div>
            <div className="mt-5">
              <ButtonLink to="/report" size="md" className="w-full sm:w-auto">
                <PlusCircle className="mr-2 size-4" />
                Report a Problem Now
              </ButtonLink>
            </div>
          </div>

          {/* Feature 2: See Reported Problems */}
          <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-2/60 p-5 transition-all hover:border-line-strong">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-surface-3 text-xs font-bold text-ink">
                  2
                </span>
                <h2 className="text-lg font-bold text-ink">See Reported Problems</h2>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">
                Explore all problems submitted across 175 assembly constituencies, 57 ministries,
                and 28 districts. Filter by ministry or location.
              </p>
            </div>
            <div className="mt-5">
              <ButtonLink to="/explore" variant="secondary" size="md" className="w-full sm:w-auto">
                <Search className="mr-2 size-4" />
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

  const deptMap = departmentStats();
  const distMap = districtStats();

  // Ranked ministries
  const rankedMinistries = MINISTRIES_DATA.map((min) => {
    const s = deptMap.get(min.name) ?? { total: 0, open: 0 };
    return {
      ...min,
      total: s.total,
      open: s.open,
    };
  }).sort((a, b) => b.total - a.total);

  // Ranked districts
  const rankedDistricts = DISTRICTS_DATA.map((dist) => {
    const s = distMap.get(dist.name) ?? { total: 0, open: 0 };
    return {
      ...dist,
      total: s.total,
      open: s.open,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <Section
      title="Problem Statistics"
      description="View where citizen problems are concentrated across Andhra Pradesh — sorted by Ministries or by Districts."
      action={
        <div className="flex items-center rounded-lg border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setActiveTab("ministries")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "ministries"
                ? "bg-accent text-white shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <Building2 className="size-3.5" />
            By Ministries ({MINISTRIES_DATA.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("districts")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "districts"
                ? "bg-accent text-white shadow-sm"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <MapPin className="size-3.5" />
            By Districts ({DISTRICTS_DATA.length})
          </button>
        </div>
      }
    >
      {activeTab === "ministries" ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {rankedMinistries.slice(0, 12).map((m, idx) => (
            <Link
              key={m.id}
              to="/explore"
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-surface-2 text-[0.6875rem] font-bold text-ink-2">
                    #{idx + 1}
                  </span>
                  <p className="truncate text-xs font-bold text-ink">{m.name}</p>
                </div>
                <p className="mt-1 truncate text-[0.6875rem] text-ink-3">Minister: {m.minister}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold tabular-nums text-ink">
                  {m.total} {m.total === 1 ? "problem" : "problems"}
                </span>
                <span className="block text-[0.6875rem] tabular-nums text-ink-3">
                  {m.open} open
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {rankedDistricts.slice(0, 12).map((d, idx) => (
            <Link
              key={d.id}
              to="/explore"
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-surface-2 text-[0.6875rem] font-bold text-ink-2">
                    #{idx + 1}
                  </span>
                  <p className="truncate text-xs font-bold text-ink">{d.name}</p>
                </div>
                <p className="mt-1 truncate text-[0.6875rem] text-ink-3">
                  Headquarters: {d.headquarters}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xs font-bold tabular-nums text-ink">
                  {d.total} {d.total === 1 ? "problem" : "problems"}
                </span>
                <span className="block text-[0.6875rem] tabular-nums text-ink-3">
                  {d.open} open
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
        >
          View all reported problems in Explore
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Section>
  );
}

function CategoriesSection() {
  return (
    <Section
      className="border-t border-line bg-surface"
      title="Browse by Problem Category"
      description="Select an issue category to view problems reported by citizens."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to="/explore"
            className="rounded-lg border border-line bg-canvas p-3 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <span className="block text-xs font-semibold text-ink">{c.label}</span>
            <span className="mt-0.5 block truncate text-[0.6875rem] text-ink-2">
              {c.department}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function RecentReports() {
  const recent = [...PROBLEMS]
    .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt))
    .slice(0, 6);

  return (
    <Section
      className="border-t border-line bg-surface"
      title="Recent Reported Problems"
      description="The latest citizen grievances reported across Andhra Pradesh."
      action={
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          See all reported problems
          <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </Section>
  );
}
