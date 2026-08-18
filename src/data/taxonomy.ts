export type StatusId =
  | "reported"
  | "under-review"
  | "forwarded"
  | "action-initiated"
  | "resolved"
  | "closed";

export const STATUSES: { id: StatusId; label: string }[] = [
  { id: "reported", label: "Reported" },
  { id: "under-review", label: "Under Review" },
  { id: "forwarded", label: "Forwarded" },
  { id: "action-initiated", label: "Action Initiated" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export const statusLabel = (id: StatusId) =>
  STATUSES.find((s) => s.id === id)?.label ?? "Reported";

/** Citizen-facing categories, each mapped to the department that owns it. */
export const CATEGORIES = [
  { id: "roads", label: "Roads", department: "Roads & Buildings" },
  {
    id: "water",
    label: "Drinking Water",
    department: "Rural Development & Rural Water Supply",
  },
  {
    id: "drainage",
    label: "Drainage",
    department: "Municipal Administration & Urban Development",
  },
  {
    id: "garbage",
    label: "Garbage & Cleanliness",
    department: "Municipal Administration & Urban Development",
  },
  { id: "electricity", label: "Electricity", department: "Energy" },
  {
    id: "street-lights",
    label: "Street Lights",
    department: "Municipal Administration & Urban Development",
  },
  { id: "transport", label: "Public Transport", department: "Roads & Buildings" },
  { id: "health", label: "Health", department: "Health" },
  {
    id: "gov-services",
    label: "Government Services",
    department: "Sachivalayam & Village Volunteer",
  },
  { id: "land", label: "Land & Revenue", department: "Revenue" },
  { id: "education", label: "Education", department: "Human Resources Development" },
  {
    id: "environment",
    label: "Environment",
    department: "Environment, Forest, Science & Technology",
  },
  { id: "other", label: "Other", department: "General Administration" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryLabel = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? "Other";

export const departmentForCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.department ?? "General Administration";

/** Full Andhra Pradesh department directory. */
export const DEPARTMENTS: string[] = [
  "General Administration",
  "Law & Order",
  "Public Enterprises",
  "Panchayati Raj",
  "Rural Development & Rural Water Supply",
  "Environment, Forest, Science & Technology",
  "Human Resources Development",
  "IT Electronics & Communication",
  "Real-Time Governance",
  "Agriculture",
  "Co-operation",
  "Marketing",
  "Animal Husbandry",
  "Dairy Development",
  "Fisheries",
  "Mines & Geology",
  "Excise",
  "Food & Civil Supplies",
  "Consumer Affairs",
  "Municipal Administration & Urban Development",
  "Home Affairs & Disaster Management",
  "Health",
  "Family Welfare & Medical Education",
  "Water Resources Development",
  "Law & Justice",
  "Minority Welfare",
  "Endowments",
  "Finance & Planning",
  "Commercial Taxes",
  "Legislative Affairs",
  "Revenue",
  "Housing",
  "Information & Public Relations",
  "Social Welfare",
  "Disabled & Senior Citizen Welfare",
  "Sachivalayam & Village Volunteer",
  "Energy",
  "Tourism",
  "Culture & Cinematography",
  "Women & Child Welfare",
  "Tribal Welfare",
  "Roads & Buildings",
  "Infrastructure & Investments",
  "Industries & Commerce",
  "Food Processing",
  "BC Welfare",
  "Economically Weaker Sections Welfare",
  "Handlooms & Textiles",
  "Labour",
  "Factories, Boilers & Insurance Medical Services",
  "MSME",
  "NRI Empowerment & Society for Elimination of Rural Poverty",
];

export const DISTRICTS = [
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Rajahmundry",
  "Tirupati",
  "Kakinada",
  "Nellore",
  "Kurnool",
  "Anantapur",
  "Kadapa",
  "Eluru",
  "Srikakulam",
];
