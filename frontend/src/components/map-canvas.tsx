import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import { categoryLabel } from "@/data/taxonomy";
import type { ProblemMapProps } from "./problem-map";

const AP_CENTER: [number, number] = [16.3, 80.6];

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapCanvas({
  problems,
  height = "420px",
  interactive = true,
  selectedId,
}: ProblemMapProps) {
  const selected = problems.find((p) => p.id === selectedId);
  const center: [number, number] = selected ? [selected.lat, selected.lng] : AP_CENTER;
  const zoom = selected ? 12 : 7;

  return (
    <div
      className="overflow-hidden rounded-xl border border-line"
      style={{ height }}
      role="region"
      aria-label="Map of reported problems across Andhra Pradesh"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={interactive}
        zoomControl={interactive}
        doubleClickZoom={interactive}
        style={{ height: "100%", width: "100%" }}
      >
        <Recenter center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {problems.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.id === selectedId ? 9 : Math.min(6 + p.reports / 6, 11)}
            pathOptions={{
              color: "#C65A3A",
              weight: 1.5,
              fillColor: "#C65A3A",
              fillOpacity: 0.28,
            }}
          >
            <Popup>
              <span className="block text-xs text-[#65635F]">
                {categoryLabel(p.category)} · {p.area}
              </span>
              <Link
                to="/problems/$id"
                params={{ id: p.id }}
                className="mt-1 block text-sm font-medium text-[#171717] underline-offset-2 hover:underline"
              >
                {p.title}
              </Link>
              <span className="mt-1 block text-xs text-[#65635F]">
                {p.reports} reports · approximate area only
              </span>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
