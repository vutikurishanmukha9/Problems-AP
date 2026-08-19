import { Link } from "@tanstack/react-router";
import { Menu, X, PlusCircle, Search, BarChart3, Map } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "./ui-kit";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Citizen Platform Notice Bar */}
      <div className="border-b border-line bg-amber-500/10 px-3 py-1.5 text-center text-[0.6875rem] font-medium text-amber-950 sm:px-4 sm:text-xs dark:text-amber-200">
        📢 <span className="font-semibold">Citizen-Built Platform:</span> Problems@AP is an
        independent, unofficial platform created by citizens to report and view public problems. Not
        affiliated with the government.
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="container-ap flex h-14 sm:h-16 items-center justify-between gap-3">
          <Link to="/" className="shrink-0 text-base sm:text-[1.05rem] font-bold tracking-tight text-ink">
            Problems<span className="text-accent">@</span>AP
            <span className="ml-1.5 sm:ml-2 rounded border border-line bg-surface px-1.5 py-0.5 text-[0.6rem] sm:text-[0.65rem] font-medium text-ink-2">
              Citizen Platform
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-1.5 lg:gap-2 md:flex">
            <Link
              to="/explore"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              activeProps={{ className: "bg-surface text-ink font-semibold border border-line" }}
            >
              <Search className="size-4" />
              See Reported Problems
            </Link>

            <Link
              to="/departments"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              activeProps={{ className: "bg-surface text-ink font-semibold border border-line" }}
            >
              <BarChart3 className="size-4" />
              Statistics
            </Link>

            <Link
              to="/map"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              activeProps={{ className: "bg-surface text-ink font-semibold border border-line" }}
            >
              <Map className="size-4" />
              Map
            </Link>

            <ButtonLink to="/report" size="sm" className="h-9 px-3.5 sm:px-4 text-xs sm:text-sm">
              <PlusCircle className="mr-1.5 size-4" />
              Report a Problem
            </ButtonLink>
          </nav>

          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ButtonLink to="/report" size="sm" className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-semibold">
              <PlusCircle className="mr-1 size-3.5" />
              Report
            </ButtonLink>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid size-9 sm:size-10 place-items-center rounded-md border border-line bg-surface text-ink hover:bg-surface-2"
            >
              {open ? <X className="size-4 sm:size-5" /> : <Menu className="size-4 sm:size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <nav aria-label="Mobile" className="border-t border-line bg-surface divide-y divide-line md:hidden shadow-lg">
            <div className="container-ap flex flex-col py-1">
              <Link
                to="/explore"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2.5 text-xs sm:text-sm font-medium text-ink hover:text-accent"
              >
                <Search className="size-4 text-accent" />
                See Reported Problems
              </Link>
              <Link
                to="/report"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2.5 text-xs sm:text-sm font-semibold text-accent"
              >
                <PlusCircle className="size-4 text-accent" />
                Report a Problem
              </Link>
              <Link
                to="/departments"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2.5 text-xs sm:text-sm font-medium text-ink hover:text-accent"
              >
                <BarChart3 className="size-4 text-ink-3" />
                Ministry & District Statistics
              </Link>
              <Link
                to="/map"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-2.5 text-xs sm:text-sm font-medium text-ink hover:text-accent"
              >
                <Map className="size-4 text-ink-3" />
                OpenStreetMap View
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
