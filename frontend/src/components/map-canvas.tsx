import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "@tanstack/react-router";
import { categoryLabel } from "@/data/taxonomy";
import { timeAgo } from "@/data/problems";
import type { ProblemMapProps } from "./problem-map";

const AP_DEFAULT_CENTER: [number, number] = [16.5, 80.6];
const AP_DEFAULT_ZOOM = 7;

function MapViewportManager({
  problems,
  selectedId,
}: {
  problems: ProblemMapProps["problems"];
  selectedId?: string | undefined;
}) {
  const map = useMap();
  const prevSelectedRef = useRef<string | undefined>(undefined);

  // Invalidate size on mount and container resize so tiles never render gray
  useEffect(() => {
    if (!map) return;

    // Initial resize calls
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (Boolean(globalThis.ResizeObserver) && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [map]);

  // Adjust viewport based on selected problem or problem list
  useEffect(() => {
    if (!map) return;

    if (selectedId) {
      const selected = problems.find((p) => p.id === selectedId);
      if (selected && Number.isFinite(selected.lat) && Number.isFinite(selected.lng)) {
        map.flyTo([selected.lat, selected.lng], 13, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
        prevSelectedRef.current = selectedId;
        return;
      }
    }

    if (problems.length === 1 && problems[0]) {
      const p = problems[0];
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
        map.flyTo([p.lat, p.lng], 13, { duration: 0.8 });
        return;
      }
    }

    if (problems.length > 1) {
      const validPoints = problems
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat > 0 && p.lng > 0)
        .map((p): [number, number] => [p.lat, p.lng]);

      if (validPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(validPoints.map(([lat, lng]) => [lat, lng]));
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              padding: [40, 40],
              maxZoom: 12,
              animate: true,
              duration: 0.6,
            });
          }
        } catch {
          map.setView(AP_DEFAULT_CENTER, AP_DEFAULT_ZOOM);
        }
      }
    } else if (!selectedId) {
      map.setView(AP_DEFAULT_CENTER, AP_DEFAULT_ZOOM);
    }
  }, [map, selectedId, problems]);

  return null;
}

export default function MapCanvas({
  problems,
  height = "420px",
  interactive = true,
  selectedId,
  className,
}: ProblemMapProps) {
  const selected = problems.find((p) => p.id === selectedId);
  const initialCenter: [number, number] =
    selected && selected.lat && selected.lng
      ? [selected.lat, selected.lng]
      : AP_DEFAULT_CENTER;
  const initialZoom = selected ? 13 : AP_DEFAULT_ZOOM;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-line bg-surface shadow-xs ${className || ""}`}
      style={{ height }}
      role="region"
      aria-label="Interactive OpenStreetMap problem map of Andhra Pradesh"
    >
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        style={{ height: "100%", width: "100%" }}
      >
        <MapViewportManager problems={problems} selectedId={selectedId} />

        {/* Resilient multi-subdomain OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={["a", "b", "c"]}
          maxZoom={19}
        />

        {/* Problem markers across Andhra Pradesh */}
        {problems.map((p) => {
          if (!p.lat || !p.lng) return null;
          const isSelected = p.id === selectedId;
          const radius = isSelected ? 11 : Math.min(6 + p.reports / 5, 12);

          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={radius}
              pathOptions={{
                color: isSelected ? "#8E2800" : "#C65A3A",
                weight: isSelected ? 3 : 2,
                fillColor: isSelected ? "#C65A3A" : "#C65A3A",
                fillOpacity: isSelected ? 0.85 : 0.55,
              }}
            >
              <Popup className="ap-map-popup" autoPanPadding={[20, 20]}>
                <div className="min-w-[200px] max-w-[260px]">
                  <div className="flex items-center justify-between gap-1 text-[0.6875rem] font-semibold text-ink-3">
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-ink-2">
                      {categoryLabel(p.category)}
                    </span>
                    <span className="text-accent font-semibold">
                      {p.reports} {p.reports === 1 ? "voice" : "voices"}
                    </span>
                  </div>

                  <Link
                    to="/problems/$id"
                    params={{ id: p.id }}
                    className="mt-1.5 block text-xs font-bold leading-snug text-ink hover:text-accent hover:underline"
                  >
                    {p.title}
                  </Link>

                  <p className="mt-1 text-[0.6875rem] text-ink-2 truncate">
                    📍 {p.area}
                    {p.constituency ? ` (${p.constituency})` : ""}, {p.district}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 text-[0.6875rem] text-ink-3">
                    <span>{timeAgo(p.reportedAt)}</span>
                    <span className="text-ink-2 font-medium">{p.department}</span>
                  </div>

                  <Link
                    to="/problems/$id"
                    params={{ id: p.id }}
                    className="mt-2 block w-full rounded-md bg-ink py-1 text-center text-[0.6875rem] font-semibold text-canvas hover:bg-accent transition-colors"
                  >
                    View Problem Details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
