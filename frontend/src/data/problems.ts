import { departmentForCategory, type StatusId } from "./taxonomy";

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

type Seed = Omit<Problem, "department" | "timeline"> & {
  timeline?: TimelineEntry[];
};

const seeds: Seed[] = [
  {
    id: "AP-7F92K4",
    title: "Drinking water unavailable for 5 days",
    description:
      "The public tap serving around forty households has had no supply since Monday. Families are walking close to a kilometre to a borewell near the school. The overhead tank appears full but nothing reaches the street line. Elderly residents in the lane are the worst affected.",
    category: "water",
    constituency: "Gajuwaka",
    area: "Gajuwaka",
    district: "Visakhapatnam",
    lat: 17.6868,
    lng: 83.2185,
    reportedAt: "2026-08-13T07:20:00Z",
    status: "reported",
    reports: 18,
    confirmations: 11,
    recurring: true,
    distanceKm: 2.4,
    evidence: [],
  },
  {
    id: "AP-3M18QX",
    title: "Large potholes near main road junction",
    description:
      "Two deep potholes have opened at the junction after the last spell of rain. Two-wheelers swerve into oncoming traffic to avoid them and there have been at least three minor falls this week.",
    category: "roads",
    constituency: "Rajahmundry City",
    area: "Danavaipeta",
    district: "Rajahmundry",
    lat: 16.9891,
    lng: 81.7837,
    reportedAt: "2026-08-11T11:05:00Z",
    status: "under-review",
    reports: 12,
    confirmations: 7,
    recurring: false,
    distanceKm: 5.1,
    evidence: [],
  },
  {
    id: "AP-5T64BW",
    title: "Drainage overflow after rainfall",
    description:
      "Storm water and sewage mix and stand in the street for two to three days after every rainfall. Shops on the stretch keep shutters down and children walk through the water on the way to school.",
    category: "drainage",
    constituency: "Vijayawada East",
    area: "Patamata",
    district: "Vijayawada",
    lat: 16.5062,
    lng: 80.648,
    reportedAt: "2026-08-09T05:40:00Z",
    status: "action-initiated",
    reports: 24,
    confirmations: 16,
    recurring: true,
    distanceKm: 8.7,
    evidence: [],
    officialResponse: {
      from: "Municipal Administration & Urban Development",
      at: "2026-08-14T09:00:00Z",
      body: "Desilting of the connected drain line has been scheduled for this ward.",
    },
  },
  {
    id: "AP-9K27LD",
    title: "Garbage uncollected for over a week",
    description:
      "The corner bin has not been cleared since last Tuesday and waste is now spilling onto the footpath. Stray animals scatter it further every night.",
    category: "garbage",
    constituency: "Guntur East",
    area: "Kothapeta",
    district: "Guntur",
    lat: 16.3067,
    lng: 80.4365,
    reportedAt: "2026-08-14T13:15:00Z",
    status: "under-review",
    reports: 9,
    confirmations: 5,
    recurring: true,
    distanceKm: 3.3,
    evidence: [],
  },
  {
    id: "AP-2C81HV",
    title: "Street lights out on the entire lane",
    description:
      "Six poles on the lane have been dark for close to three weeks. Women returning from the evening shift avoid the stretch entirely.",
    category: "street-lights",
    constituency: "Chandragiri",
    area: "Tirupati Rural",
    district: "Tirupati",
    lat: 13.6288,
    lng: 79.4192,
    reportedAt: "2026-08-12T17:55:00Z",
    status: "forwarded",
    reports: 14,
    confirmations: 9,
    recurring: false,
    distanceKm: 11.2,
    evidence: [],
  },
  {
    id: "AP-6R45ZP",
    title: "Long waits and no doctor at the health centre",
    description:
      "The primary health centre regularly opens late and patients wait three to four hours. On two visits this month no doctor was present until midday.",
    category: "health",
    constituency: "Peddapuram",
    area: "Samalkot",
    district: "Kakinada",
    lat: 17.0522,
    lng: 82.1729,
    reportedAt: "2026-08-08T04:30:00Z",
    status: "under-review",
    reports: 21,
    confirmations: 13,
    recurring: true,
    distanceKm: 14.6,
    evidence: [],
  },
  {
    id: "AP-4B93NN",
    title: "Land record correction pending for months",
    description:
      "A survey number correction filed at the mandal office in April has had no movement. Repeated visits get the same response that the file is under process.",
    category: "land",
    constituency: "Kavali",
    area: "Kavali",
    district: "Nellore",
    lat: 14.9128,
    lng: 79.9927,
    reportedAt: "2026-08-06T09:10:00Z",
    status: "reported",
    reports: 6,
    confirmations: 2,
    recurring: false,
    distanceKm: 22.4,
    evidence: [],
  },
  {
    id: "AP-8W36YT",
    title: "Frequent power cuts through the afternoon",
    description:
      "Supply drops for twenty to forty minutes several times each afternoon. Small workshops on the street lose a working day whenever it happens during peak hours.",
    category: "electricity",
    constituency: "Kurnool",
    area: "Nandyal Road",
    district: "Kurnool",
    lat: 15.8281,
    lng: 78.0373,
    reportedAt: "2026-08-15T08:45:00Z",
    status: "reported",
    reports: 15,
    confirmations: 8,
    recurring: true,
    distanceKm: 30.1,
    evidence: [],
  },
  {
    id: "AP-1D57GM",
    title: "Bus stop shelter collapsed, no replacement",
    description:
      "The shelter roof came down during a storm three weeks back. Passengers, including school children, wait in the open sun and rain.",
    category: "transport",
    constituency: "Anantapur Urban",
    area: "Anantapur Town",
    district: "Anantapur",
    lat: 14.6819,
    lng: 77.6006,
    reportedAt: "2026-08-04T12:00:00Z",
    status: "resolved",
    reports: 11,
    confirmations: 6,
    recurring: false,
    distanceKm: 44.8,
    evidence: [],
    officialResponse: {
      from: "Roads & Buildings",
      at: "2026-08-12T06:30:00Z",
      body: "A replacement shelter was installed at the same location on 12 August.",
    },
  },
  {
    id: "AP-0X72FE",
    title: "School building has no usable toilet",
    description:
      "The girls' toilet block at the government school has been locked for two months due to a broken water connection.",
    category: "education",
    constituency: "Proddatur",
    area: "Proddatur",
    district: "Kadapa",
    lat: 14.7502,
    lng: 78.5481,
    reportedAt: "2026-08-10T06:15:00Z",
    status: "forwarded",
    reports: 8,
    confirmations: 4,
    recurring: false,
    distanceKm: 51.3,
    evidence: [],
  },
  {
    id: "AP-3H14SR",
    title: "Canal bund dumping contaminating water",
    description:
      "Construction debris and household waste are being dumped along the canal bund. The water downstream is used by farmers for irrigation.",
    category: "environment",
    constituency: "Eluru",
    area: "Eluru Canal",
    district: "Eluru",
    lat: 16.7107,
    lng: 81.0952,
    reportedAt: "2026-08-07T15:20:00Z",
    status: "under-review",
    reports: 13,
    confirmations: 7,
    recurring: true,
    distanceKm: 33.9,
    evidence: [],
  },
  {
    id: "AP-7Q60JU",
    title: "Sachivalayam certificate application stuck",
    description:
      "Income certificate applications submitted at the village secretariat in June are still showing as pending with no reason recorded.",
    category: "gov-services",
    constituency: "Amadalavalasa",
    area: "Amadalavalasa",
    district: "Srikakulam",
    lat: 18.4142,
    lng: 83.9008,
    reportedAt: "2026-08-05T10:35:00Z",
    status: "closed",
    reports: 5,
    confirmations: 2,
    recurring: false,
    distanceKm: 68.2,
    evidence: [],
  },
];

function buildTimeline(s: Seed): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { kind: "reported", label: "Reported by a citizen", at: s.reportedAt },
    {
      kind: "related",
      label: `${s.reports - 1} related reports from the same area`,
      at: s.reportedAt,
      detail: `${s.confirmations} citizens confirmed the same problem`,
    },
  ];
  if (s.status !== "reported") {
    entries.push({
      kind: "status",
      label: "Marked under review",
      at: "2026-08-14T06:00:00Z",
    });
  }
  if (s.officialResponse) {
    entries.push({
      kind: "response",
      label: `Official response — ${s.officialResponse.from}`,
      detail: s.officialResponse.body,
      at: s.officialResponse.at,
    });
  }
  if (s.status === "resolved" || s.status === "closed") {
    entries.push({
      kind: "resolved",
      label: s.status === "resolved" ? "Marked resolved" : "Closed",
      at: "2026-08-16T07:00:00Z",
    });
  }
  return entries;
}

export const PROBLEMS: Problem[] = seeds.map((s) => ({
  ...s,
  department: departmentForCategory(s.category),
  timeline: s.timeline ?? buildTimeline(s),
}));

export const getProblem = (id: string) =>
  PROBLEMS.find((p) => p.id.toLowerCase() === id.toLowerCase());

export const SNAPSHOT = {
  totalShared: 1748,
  constituenciesCovered: 175,
  ministriesMapped: 57,
  districtsActive: 28,
};

export function departmentStats() {
  const map = new Map<string, { total: number }>();
  for (const p of PROBLEMS) {
    const cur = map.get(p.department) ?? { total: 0 };
    cur.total += p.reports;
    map.set(p.department, cur);
  }
  return map;
}

export function districtStats() {
  const map = new Map<string, { total: number }>();
  for (const p of PROBLEMS) {
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
