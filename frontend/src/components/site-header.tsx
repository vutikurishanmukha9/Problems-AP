import { Link } from "@tanstack/react-router";
import { Menu, X, PlusCircle, Search } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "./ui-kit";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Citizen Platform Notice Bar */}
      <div className="border-b border-line bg-amber-500/10 px-4 py-1.5 text-center text-xs font-medium text-amber-950 dark:text-amber-200">
        📢 <span className="font-semibold">Citizen-Built Platform:</span> Problems@AP is an
        independent, unofficial platform created by citizens to report and view public problems. Not
        affiliated with the government.
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-sm">
        <div className="container-ap flex h-16 items-center justify-between gap-4">
          <Link to="/" className="shrink-0 text-[1.05rem] font-bold tracking-tight text-ink">
            Problems<span className="text-accent">@</span>AP
            <span className="ml-2 rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-medium text-ink-2">
              Citizen Initiative
            </span>
          </Link>

          {/* Strictly the 2 core features in navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
            <Link
              to="/explore"
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              activeProps={{ className: "bg-surface text-ink font-semibold border border-line" }}
            >
              <Search className="size-4" />
              See Reported Problems
            </Link>

            <ButtonLink to="/report" size="sm" className="h-9 px-4">
              <PlusCircle className="mr-1.5 size-4" />
              Report a Problem
            </ButtonLink>
          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ButtonLink to="/report" size="sm" className="h-9 px-3 text-xs">
              Report Problem
            </ButtonLink>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-md border border-line text-ink"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Mobile" className="border-t border-line bg-surface md:hidden">
            <div className="container-ap flex flex-col py-2">
              <Link
                to="/explore"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-2 border-b border-line/70 text-sm font-medium text-ink"
              >
                <Search className="size-4 text-accent" />
                See Reported Problems
              </Link>
              <Link
                to="/report"
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center gap-2 text-sm font-medium text-accent"
              >
                <PlusCircle className="size-4 text-accent" />
                Report a Problem
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
