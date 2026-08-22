export type StatusId =
  "reported" | "under-review" | "forwarded" | "action-initiated" | "resolved" | "closed";

export const STATUSES: { id: StatusId; label: string }[] = [
  { id: "reported", label: "Reported" },
  { id: "under-review", label: "Under Review" },
  { id: "forwarded", label: "Forwarded" },
  { id: "action-initiated", label: "Action Initiated" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export const statusLabel = (id: StatusId) => STATUSES.find((s) => s.id === id)?.label ?? "Reported";

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
    department: "Environment",
  },
  { id: "other", label: "Other", department: "General Administration" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? "Other";

export const departmentForCategory = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.department ?? "General Administration";

export interface MinistryInfo {
  readonly id: number;
  readonly name: string;
  readonly minister: string;
}

/** Complete directory of 57 Andhra Pradesh Ministries and Portfolios with Responsible Ministers */
export const MINISTRIES_DATA: readonly MinistryInfo[] = [
  { id: 1, name: "General Administration", minister: "N. Chandrababu Naidu Garu" },
  { id: 2, name: "Law & Order", minister: "N. Chandrababu Naidu Garu" },
  { id: 3, name: "Public Enterprises", minister: "N. Chandrababu Naidu Garu" },
  { id: 4, name: "Panchayati Raj", minister: "K. Pawan Kalyan Garu" },
  { id: 5, name: "Rural Development & Rural Water Supply", minister: "K. Pawan Kalyan Garu" },
  { id: 6, name: "Environment", minister: "K. Pawan Kalyan Garu" },
  { id: 7, name: "Forest", minister: "K. Pawan Kalyan Garu" },
  { id: 8, name: "Science & Technology", minister: "K. Pawan Kalyan Garu" },
  { id: 9, name: "Human Resources Development", minister: "Nara Lokesh Garu" },
  { id: 10, name: "IT, Electronics & Communication", minister: "Nara Lokesh Garu" },
  { id: 11, name: "Real-Time Governance (RTG)", minister: "Nara Lokesh Garu" },
  { id: 12, name: "Agriculture", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 13, name: "Co-operation", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 14, name: "Marketing", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 15, name: "Animal Husbandry", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 16, name: "Dairy Development", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 17, name: "Fisheries", minister: "Kinjarapu Atchannaidu Garu" },
  { id: 18, name: "Mines & Geology", minister: "Kollu Ravindra Garu" },
  { id: 19, name: "Excise", minister: "Kollu Ravindra Garu" },
  { id: 20, name: "Food & Civil Supplies", minister: "Nadendla Manohar Garu" },
  { id: 21, name: "Consumer Affairs", minister: "Nadendla Manohar Garu" },
  { id: 22, name: "Municipal Administration & Urban Development", minister: "Ponguru Narayana Garu" },
  { id: 23, name: "Home Affairs & Disaster Management", minister: "Vangalapudi Anitha Garu" },
  { id: 24, name: "Health", minister: "Satya Kumar Yadav Garu" },
  { id: 25, name: "Family Welfare & Medical Education", minister: "Satya Kumar Yadav Garu" },
  { id: 26, name: "Water Resources Development", minister: "Dr. Nimmala Ramanaidu Garu" },
  { id: 27, name: "Law & Justice", minister: "Nasyam Mohammed Farook Garu" },
  { id: 28, name: "Minority Welfare", minister: "Nasyam Mohammed Farook Garu" },
  { id: 29, name: "Endowments", minister: "Anam Ramanarayana Reddy Garu" },
  { id: 30, name: "Finance & Planning", minister: "Payyavula Keshav Garu" },
  { id: 31, name: "Commercial Taxes", minister: "Payyavula Keshav Garu" },
  { id: 32, name: "Legislative Affairs", minister: "Payyavula Keshav Garu" },
  { id: 33, name: "Revenue", minister: "Anagani Satya Prasad Garu" },
  { id: 34, name: "Housing", minister: "Kolusu Parthasarathy Garu" },
  { id: 35, name: "Information & Public Relations (I&PR)", minister: "Kolusu Parthasarathy Garu" },
  { id: 36, name: "Social Welfare", minister: "Dola Sree Bala Veeranjaneya Swamy Garu" },
  {
    id: 37,
    name: "Disabled & Senior Citizen Welfare",
    minister: "Dola Sree Bala Veeranjaneya Swamy Garu",
  },
  {
    id: 38,
    name: "Sachivalayam & Village Volunteer",
    minister: "Dola Sree Bala Veeranjaneya Swamy Garu",
  },
  { id: 39, name: "Energy", minister: "Gottipati Ravi Kumar Garu" },
  { id: 40, name: "Tourism", minister: "Kandula Durgesh Garu" },
  { id: 41, name: "Culture & Cinematography", minister: "Kandula Durgesh Garu" },
  { id: 42, name: "Women & Child Welfare", minister: "Gummidi Sandhya Rani Garu" },
  { id: 43, name: "Tribal Welfare", minister: "Gummidi Sandhya Rani Garu" },
  { id: 44, name: "Roads & Buildings", minister: "B.C. Janardhan Reddy Garu" },
  { id: 45, name: "Infrastructure & Investments", minister: "B.C. Janardhan Reddy Garu" },
  { id: 46, name: "Industries & Commerce", minister: "T.G. Bharath Garu" },
  { id: 47, name: "Food Processing", minister: "T.G. Bharath Garu" },
  { id: 48, name: "BC Welfare", minister: "S. Savitha Garu" },
  { id: 49, name: "Economically Weaker Sections Welfare", minister: "S. Savitha Garu" },
  { id: 50, name: "Handlooms & Textiles", minister: "S. Savitha Garu" },
  { id: 51, name: "Labour", minister: "Vasamsetti Subhash Garu" },
  { id: 52, name: "Factories", minister: "Vasamsetti Subhash Garu" },
  { id: 53, name: "Boilers", minister: "Vasamsetti Subhash Garu" },
  { id: 54, name: "Insurance Medical Services", minister: "Vasamsetti Subhash Garu" },
  { id: 55, name: "MSME", minister: "Kondapalli Srinivas Garu" },
  { id: 56, name: "NRI Empowerment & Relations", minister: "Kondapalli Srinivas Garu" },
  {
    id: 57,
    name: "Society for Elimination of Rural Poverty (SERP)",
    minister: "Kondapalli Srinivas Garu",
  },
] as const;

/** Full list of Andhra Pradesh department names. */
export const DEPARTMENTS: string[] = MINISTRIES_DATA.map((m) => m.name);

/** Lookup minister for a given department name */
export function getMinisterForDepartment(departmentName: string): MinistryInfo | undefined {
  const normalized = departmentName.trim().toLowerCase();
  return MINISTRIES_DATA.find((m) => m.name.toLowerCase() === normalized);
}

export interface DistrictInfo {
  readonly id: number;
  readonly name: string;
  readonly headquarters: string;
}

/** Complete directory of 28 Andhra Pradesh Districts with Headquarters */
export const DISTRICTS_DATA: readonly DistrictInfo[] = [
  { id: 1, name: "Alluri Sitharama Raju", headquarters: "Paderu" },
  { id: 2, name: "Anakapalli", headquarters: "Anakapalli" },
  { id: 3, name: "Ananthapuramu", headquarters: "Anantapur" },
  { id: 4, name: "Annamayya", headquarters: "Rayachoti" },
  { id: 5, name: "Bapatla", headquarters: "Bapatla" },
  { id: 6, name: "Chittoor", headquarters: "Chittoor" },
  { id: 7, name: "Dr. B. R. Ambedkar Konaseema", headquarters: "Amalapuram" },
  { id: 8, name: "East Godavari", headquarters: "Rajamahendravaram" },
  { id: 9, name: "Eluru", headquarters: "Eluru" },
  { id: 10, name: "Guntur", headquarters: "Guntur" },
  { id: 11, name: "Kakinada", headquarters: "Kakinada" },
  { id: 12, name: "Krishna", headquarters: "Machilipatnam" },
  { id: 13, name: "Kurnool", headquarters: "Kurnool" },
  { id: 14, name: "Markapuram", headquarters: "Markapuram" },
  { id: 15, name: "Nandyal", headquarters: "Nandyal" },
  { id: 16, name: "NTR", headquarters: "Vijayawada" },
  { id: 17, name: "Palnadu", headquarters: "Narasaraopet" },
  { id: 18, name: "Parvathipuram Manyam", headquarters: "Parvathipuram" },
  { id: 19, name: "Polavaram", headquarters: "Rampachodavaram" },
  { id: 20, name: "Prakasam", headquarters: "Ongole" },
  { id: 21, name: "Sri Potti Sriramulu Nellore", headquarters: "Nellore" },
  { id: 22, name: "Sri Sathya Sai", headquarters: "Puttaparthi" },
  { id: 23, name: "Srikakulam", headquarters: "Srikakulam" },
  { id: 24, name: "Tirupati", headquarters: "Tirupati" },
  { id: 25, name: "Visakhapatnam", headquarters: "Visakhapatnam" },
  { id: 26, name: "Vizianagaram", headquarters: "Vizianagaram" },
  { id: 27, name: "West Godavari", headquarters: "Bhimavaram" },
  { id: 28, name: "Y.S.R. Kadapa", headquarters: "Kadapa" },
] as const;

export const DISTRICTS: string[] = DISTRICTS_DATA.map((d) => d.name);

export type District = (typeof DISTRICTS_DATA)[number]["name"];

export function getHeadquartersForDistrict(districtName: string): string | undefined {
  const match = DISTRICTS_DATA.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase(),
  );
  return match?.headquarters;
}

export {
  CONSTITUENCIES,
  CONSTITUENCY_DATA,
  getMLAForConstituency,
  getDistrictForConstituency,
  getConstituenciesByDistrict,
  type Constituency,
  type ConstituencyInfo,
} from "./constituencies";
