import { type StatusId } from "./taxonomy";

export type TimelineEntry = {
  label: string;
  detail?: string;
  at: string;
  kind: "reported" | "related" | "status" | "response" | "resolved";
};

export type Problem = {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  constituency: string;
  area: string;
  district: string;
  lat: number;
  lng: number;
  reportedAt: string;
  status: StatusId;
  reports: number;
  confirmations: number;
  recurring: boolean;
  distanceKm: number;
  evidence: string[];
  officialResponse?: { body: string; at: string; from: string };
  timeline: TimelineEntry[];
};

/** Real citizen problems populated dynamically from backend / submission */
export const PROBLEMS: Problem[] = [];

export const getProblem = (id: string): Problem | undefined =>
  PROBLEMS.find((p) => p.id.toLowerCase() === id.toLowerCase());

export const SNAPSHOT = {
  totalShared: 0,
  constituenciesCovered: 175,
  ministriesMapped: 57,
  districtsActive: 28,
};

export function departmentStats(problems: Problem[] = PROBLEMS) {
  const map = new Map<string, { total: number }>();
  for (const p of problems) {
    const cur = map.get(p.department) ?? { total: 0 };
    cur.total += p.reports;
    map.set(p.department, cur);
  }
  return map;
}

export function districtStats(problems: Problem[] = PROBLEMS) {
  const map = new Map<string, { total: number }>();
  for (const p of problems) {
    const cur = map.get(p.district) ?? { total: 0 };
    cur.total += p.reports;
    map.set(p.district, cur);
  }
  return map;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
