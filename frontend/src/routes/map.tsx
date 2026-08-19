import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProblemMap } from "@/components/problem-map";
import { ProblemRow } from "@/components/problem-card";
import { PROBLEMS } from "@/data/problems";
import { CATEGORIES } from "@/data/taxonomy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Problem Map of Andhra Pradesh — Problems@AP" },
      {
        name: "description",
        content:
          "See where problems are being reported across Andhra Pradesh. Filter the map by category and open any problem for detail.",
      },
      { property: "og:title", content: "Problem Map of Andhra Pradesh" },
      {
        property: "og:description",
        content:
          "See where citizens are reporting problems across Andhra Pradesh, filtered by category.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState<"map" | "list">("map");

  const problems = useMemo(
    () => (category === "all" ? PROBLEMS : PROBLEMS.filter((p) => p.category === category)),
    [category],
  );

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-5 sm:py-7">
            <h1 className="text-xl font-semibold sm:text-2xl">Problem Map</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-ink-2">
              Markers show approximate areas, never exact reported coordinates.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <FilterChip
                active={category === "all"}
                onClick={() => setCategory("all")}
                label="All"
              />
              {CATEGORIES.slice(0, 8).map((c) => (
                <FilterChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                  label={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="container-ap py-5 sm:py-6">
          <div
            className="mb-3 flex rounded-md border border-line bg-surface p-0.5 sm:hidden"
            role="group"
            aria-label="Map or list"
          >
            {(["map", "list"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cn(
                  "h-8 flex-1 rounded text-xs capitalize",
                  tab === t ? "bg-surface-2 font-medium text-ink" : "text-ink-2",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className={cn(tab === "list" && "hidden sm:block")}>
              <ProblemMap problems={problems} height="min(70vh, 560px)" />
            </div>
            <div className={cn(tab === "map" && "hidden sm:block")}>
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {problems.map((p) => (
                  <ProblemRow key={p.id} problem={p} showDistance />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 rounded-full border px-3.5 text-sm transition-colors",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-surface text-ink-2 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
