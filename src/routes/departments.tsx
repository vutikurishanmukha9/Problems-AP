import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DEPARTMENTS, CATEGORIES } from "@/data/taxonomy";
import { departmentStats } from "@/data/problems";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Department Directory — Problems by Ministry in Andhra Pradesh" },
      {
        name: "description",
        content:
          "Browse citizen-reported problems by Andhra Pradesh government department, with report counts and how many remain unresolved.",
      },
      { property: "og:title", content: "Department Directory — Problems@AP" },
      {
        property: "og:description",
        content:
          "Browse citizen-reported problems by Andhra Pradesh government department and see what remains unresolved.",
      },
    ],
  }),
  component: Departments,
});

function Departments() {
  const [q, setQ] = useState("");
  const stats = useMemo(() => departmentStats(), []);
  const list = useMemo(
    () => DEPARTMENTS.filter((d) => d.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line bg-surface">
          <div className="container-ap py-10 sm:py-14">
            <h1 className="text-2xl font-semibold sm:text-3xl">Departments</h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-2">
              You never need to know which department handles a problem before reporting
              it — we map every category for you. This directory is for people who want
              to look at it from the administrative side.
            </p>

            <div className="relative mt-6 max-w-md">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              />
              <label htmlFor="dq" className="sr-only">
                Search departments
              </label>
              <input
                id="dq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search departments"
                className="h-12 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[0.9375rem] placeholder:text-ink-3"
              />
            </div>
          </div>
        </div>

        <section className="container-ap py-12">
          <h2 className="text-lg font-semibold">Common problems and who handles them</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to="/explore"
                className="rounded-lg border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <p className="text-[0.9375rem] font-medium">{c.label}</p>
                <p className="mt-1 text-sm text-ink-2">→ {c.department}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container-ap pb-16">
          <h2 className="text-lg font-semibold">Full directory</h2>
          <p className="mt-1 text-sm text-ink-2">
            {list.length} departments · demonstration figures
          </p>
          <div className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {list.map((d) => {
              const s = stats.get(d);
              return (
                <Link
                  key={d}
                  to="/explore"
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5"
                >
                  <span className="min-w-0 truncate text-[0.9375rem]">{d}</span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-ink-2">
                    <span className="text-ink">{s ? s.total : 0}</span> reported
                    <span aria-hidden className="mx-2 text-line-strong">
                      |
                    </span>
                    {s ? s.open : 0} unresolved
                  </span>
                </Link>
              );
            })}
            {list.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-ink-2">
                No department matches “{q}”.
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
