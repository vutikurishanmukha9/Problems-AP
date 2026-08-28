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

/** Safely parses ISO timestamp string, ensuring UTC interpretation if no timezone offset is present */
export function parseDate(iso?: string): Date {
  if (!iso) return new Date();
  const trimmed = iso.trim();
  if (!trimmed) return new Date();
  // If string lacks timezone specifier (Z, +HH:MM, -HH:MM), treat as UTC ISO
  const hasTimezone = trimmed.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date(trimmed) : d;
}

export function timeAgo(iso?: string): string {
  if (!iso) return "just now";
  const date = parseDate(iso);
  const diffMs = Date.now() - date.getTime();

  // If clock skew or future timestamp
  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "";
  const date = parseDate(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
