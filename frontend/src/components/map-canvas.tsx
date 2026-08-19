import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
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

  useEffect(() => {
    if (!map) return;

    if (selectedId) {
      const selected = problems.find((p) => p.id === selectedId);
      if (selected && selected.lat && selected.lng) {
        map.flyTo([selected.lat, selected.lng], 13, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
        return;
      }
    }

    if (problems.length === 1 && problems[0]) {
      const p = problems[0];
      if (p.lat && p.lng) {
        map.flyTo([p.lat, p.lng], 13, { duration: 0.8 });
        return;
      }
    }

    if (problems.length > 1) {
      const validPoints = problems
        .filter((p) => p.lat && p.lng)
        .map((p): [number, number] => [p.lat, p.lng]);

      if (validPoints.length > 0) {
        map.fitBounds(validPoints, {
          padding: [40, 40],
          maxZoom: 12,
          animate: true,
          duration: 0.6,
        });
      }
    } else {
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

        {/* Direct Clean OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                fillOpacity: isSelected ? 0.75 : 0.45,
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
