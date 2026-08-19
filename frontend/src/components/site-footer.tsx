import { Link } from "@tanstack/react-router";
import { PlusCircle, Search } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-ap grid gap-8 py-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="max-w-md">
          <p className="text-base font-bold text-ink">
            Problems<span className="text-accent">@</span>AP
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">
            An independent, open public platform built by citizens for citizens. This is{" "}
            <strong>not an official government portal</strong>. It exists purely to enable citizens
            across Andhra Pradesh to report public issues and view reported problems transparently.
          </p>
        </div>

        <nav aria-label="Footer" className="text-xs">
          <p className="font-semibold text-ink">Core Features</p>
          <ul className="mt-3 space-y-2 text-ink-2">
            <li>
              <Link
                to="/report"
                className="flex items-center gap-1.5 font-medium text-accent hover:underline"
              >
                <PlusCircle className="size-3.5" />
                1. Report a Problem
              </Link>
            </li>
            <li>
              <Link to="/explore" className="flex items-center gap-1.5 hover:text-ink">
                <Search className="size-3.5" />
                2. See Reported Problems
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line bg-canvas/40">
        <div className="container-ap flex flex-col items-center justify-between gap-2 py-3 text-[0.6875rem] text-ink-3 sm:flex-row">
          <span>100% Anonymous Citizen Platform · No Authentication Needed</span>
          <span>175 Constituencies · 57 Ministries · 28 Districts</span>
        </div>
      </div>
    </footer>
  );
}
