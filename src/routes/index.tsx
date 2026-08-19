import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemCard, ProblemRow } from "@/components/problem-card";
import { ProblemMap } from "@/components/problem-map";
import { Button, ButtonLink, Section } from "@/components/ui-kit";
import { PROBLEMS, SNAPSHOT, departmentStats } from "@/data/problems";
import { CATEGORIES } from "@/data/taxonomy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Problems@AP — Report and Discover Problems in Andhra Pradesh" },
      {
        name: "description",
        content:
          "Report problems affecting your area in Andhra Pradesh without an account, and see what citizens are experiencing across the state.",
      },
      {
        property: "og:title",
        content: "Problems@AP — Citizen Problem Reporting for Andhra Pradesh",
      },
      {
        property: "og:description",
        content:
          "A problem doesn't stop being a problem because nobody reported it. Report anonymously and explore problems across Andhra Pradesh.",
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
        <Snapshot />
        <Categories />
        <NearYou />
        <Departments />
        <Recent />
        <MapPreview />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className="container-ap py-16 sm:py-24 lg:py-28">
        <h1 className="max-w-3xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] lg:text-[3.25rem]">
          A problem doesn't stop being a problem because nobody reported it.
        </h1>
        <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2 sm:text-lg">
          Report problems affecting your area. See what citizens are experiencing across
          Andhra Pradesh.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/report" size="lg">
            Report a Problem
          </ButtonLink>
          <ButtonLink to="/explore" variant="secondary" size="lg">
            Explore Problems
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-ink-2">
          No account needed. Reports stay anonymous.
        </p>
      </div>
    </section>
  );
}

function Snapshot() {
  const items = [
    { label: "Problems reported", value: SNAPSHOT.reported },
    { label: "Under review", value: SNAPSHOT.underReview },
    { label: "Resolved", value: SNAPSHOT.resolved },
    { label: "Reports this month", value: SNAPSHOT.thisMonth },
  ];
  return (
    <section className="border-b border-line bg-surface">
      <div className="container-ap py-10">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.label}>
              <dt className="text-sm text-ink-2">{i.label}</dt>
              <dd className="mt-1 text-[1.75rem] font-medium tabular-nums tracking-tight">
                {i.value.toLocaleString("en-IN")}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-ink-3">
          Demonstration figures. Problems@AP is an independent citizen platform and does
          not publish official government statistics.
        </p>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <Section
      title="Explore by problem"
      description="Start from what you're experiencing. We map it to the department that handles it."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to="/explore"
            className="min-h-16 rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
          >
            <span className="block text-[0.9375rem] font-medium">{c.label}</span>
            <span className="mt-0.5 block truncate text-xs text-ink-2">
              {c.department}
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function NearYou() {
  const [located, setLocated] = useState(false);
  const [loading, setLoading] = useState(false);

  const nearby = useMemo(
    () => [...PROBLEMS].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5),
    [],
  );

  const locate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocated(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLoading(false);
        setLocated(true);
      },
      () => {
        setLoading(false);
        setLocated(true);
      },
      { timeout: 8000 },
    );
  };

  return (
    <Section
      className="border-t border-line bg-surface"
      title="Problems near you"
      description={
        located
          ? "Sorted by distance from your approximate location."
          : "Share your location to see what is being reported around you."
      }
      action={
        !located && (
          <Button variant="secondary" onClick={locate} disabled={loading}>
            {loading ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <MapPin aria-hidden className="size-4" />
            )}
            {loading ? "Locating…" : "Use my location"}
          </Button>
        )
      }
    >
      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {nearby.map((p) => (
          <ProblemRow key={p.id} problem={p} showDistance={located} />
        ))}
      </div>
    </Section>
  );
}

function Departments() {
  const stats = departmentStats();
  const top = [...stats.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);

  return (
    <Section
      title="Department view"
      description="Where reported problems are concentrated across state departments."
      action={
        <Link
          to="/departments"
          className="inline-flex items-center gap-1.5 text-sm text-ink hover:text-accent"
        >
          Full directory
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {top.map(([name, s]) => (
          <Link
            key={name}
            to="/departments"
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0 truncate text-[0.9375rem]">{name}</span>
            <span className="shrink-0 text-xs tabular-nums text-ink-2">
              <span className="text-ink">{s.total}</span> reported ·{" "}
              {s.open} unresolved
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function Recent() {
  const recent = [...PROBLEMS]
    .sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt))
    .slice(0, 6);

  return (
    <Section
      className="border-t border-line bg-surface"
      title="Recent problems"
      description="The latest reports from citizens across the state."
      action={
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-ink hover:text-accent"
        >
          See all
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((p) => (
          <ProblemCard key={p.id} problem={p} />
        ))}
      </div>
    </Section>
  );
}

function MapPreview() {
  return (
    <Section
      title="Where problems are being reported"
      description="Clusters across Andhra Pradesh, shown as approximate areas."
      action={
        <ButtonLink to="/map" variant="secondary">
          Explore the Map
        </ButtonLink>
      }
    >
      <ProblemMap problems={PROBLEMS} height="min(60vh, 480px)" interactive={false} />
    </Section>
  );
}
