import { lazy, Suspense, useEffect, useState } from "react";
import type { Problem } from "@/data/problems";

const MapCanvas = lazy(() => import("./map-canvas"));

export type ProblemMapProps = {
  problems: Problem[];
  height?: string | undefined;
  interactive?: boolean | undefined;
  selectedId?: string | undefined;
  className?: string | undefined;
};

/**
 * Client-only wrapper. Leaflet touches `window` at import time, so the real
 * map module is only imported after hydration.
 */
export function ProblemMap(props: ProblemMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const placeholder = (
    <div
      className="w-full animate-pulse rounded-xl border border-line bg-surface-2"
      style={{ height: props.height ?? "420px" }}
      aria-hidden
    />
  );

  if (!mounted) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <MapCanvas {...props} />
    </Suspense>
  );
}
