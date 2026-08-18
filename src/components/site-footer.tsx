import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-ap grid gap-10 py-12 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
        <div className="max-w-sm">
          <p className="text-[0.9375rem] font-semibold">
            Problems<span className="text-accent">@</span>AP
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            A citizen-run platform for reporting and discovering problems across Andhra
            Pradesh. Not affiliated with, endorsed by, or operated by any government
            body. All data shown is demonstration data.
          </p>
        </div>

        <nav aria-label="Footer" className="text-sm">
          <p className="font-medium">Browse</p>
          <ul className="mt-3 space-y-2 text-ink-2">
            <li>
              <Link to="/explore" className="hover:text-ink">
                Explore Problems
              </Link>
            </li>
            <li>
              <Link to="/departments" className="hover:text-ink">
                Departments
              </Link>
            </li>
            <li>
              <Link to="/map" className="hover:text-ink">
                Map
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-ink">
                How It Works
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="font-medium">Take action</p>
          <ul className="mt-3 space-y-2 text-ink-2">
            <li>
              <Link to="/report" className="text-accent hover:text-accent-hover">
                Report a Problem
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" hash="privacy" className="hover:text-ink">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" hash="terms" className="hover:text-ink">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-ap py-5 text-xs text-ink-3">
          Reports are anonymous. Exact coordinates are never shown publicly.
        </div>
      </div>
    </footer>
  );
}
