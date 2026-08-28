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
  readonly lat: number;
  readonly lng: number;
}

/** Complete directory of 28 Andhra Pradesh Districts with Headquarters and Geographic Coordinates */
export const DISTRICTS_DATA: readonly DistrictInfo[] = [
  { id: 1, name: "Alluri Sitharama Raju", headquarters: "Paderu", lat: 18.0833, lng: 82.6667 },
  { id: 2, name: "Anakapalli", headquarters: "Anakapalli", lat: 17.6913, lng: 83.0039 },
  { id: 3, name: "Ananthapuramu", headquarters: "Anantapur", lat: 14.6819, lng: 77.6006 },
  { id: 4, name: "Annamayya", headquarters: "Rayachoti", lat: 14.0560, lng: 78.7521 },
  { id: 5, name: "Bapatla", headquarters: "Bapatla", lat: 15.9056, lng: 80.4674 },
  { id: 6, name: "Chittoor", headquarters: "Chittoor", lat: 13.2172, lng: 79.1003 },
  { id: 7, name: "Dr. B. R. Ambedkar Konaseema", headquarters: "Amalapuram", lat: 16.5787, lng: 82.0061 },
  { id: 8, name: "East Godavari", headquarters: "Rajamahendravaram", lat: 17.0005, lng: 81.8040 },
  { id: 9, name: "Eluru", headquarters: "Eluru", lat: 16.7107, lng: 81.0952 },
  { id: 10, name: "Guntur", headquarters: "Guntur", lat: 16.3067, lng: 80.4365 },
  { id: 11, name: "Kakinada", headquarters: "Kakinada", lat: 16.9891, lng: 82.2475 },
  { id: 12, name: "Krishna", headquarters: "Machilipatnam", lat: 16.1875, lng: 81.1389 },
  { id: 13, name: "Kurnool", headquarters: "Kurnool", lat: 15.8281, lng: 78.0373 },
  { id: 14, name: "Markapuram", headquarters: "Markapuram", lat: 15.7350, lng: 79.2700 },
  { id: 15, name: "Nandyal", headquarters: "Nandyal", lat: 15.4881, lng: 78.4836 },
  { id: 16, name: "NTR", headquarters: "Vijayawada", lat: 16.5062, lng: 80.6480 },
  { id: 17, name: "Palnadu", headquarters: "Narasaraopet", lat: 16.2359, lng: 80.0494 },
  { id: 18, name: "Parvathipuram Manyam", headquarters: "Parvathipuram", lat: 18.7797, lng: 83.4287 },
  { id: 19, name: "Polavaram", headquarters: "Rampachodavaram", lat: 17.4475, lng: 81.7767 },
  { id: 20, name: "Prakasam", headquarters: "Ongole", lat: 15.5057, lng: 80.0499 },
  { id: 21, name: "Sri Potti Sriramulu Nellore", headquarters: "Nellore", lat: 14.4426, lng: 79.9865 },
  { id: 22, name: "Sri Sathya Sai", headquarters: "Puttaparthi", lat: 14.1652, lng: 77.8105 },
  { id: 23, name: "Srikakulam", headquarters: "Srikakulam", lat: 18.2969, lng: 83.8968 },
  { id: 24, name: "Tirupati", headquarters: "Tirupati", lat: 13.6288, lng: 79.4192 },
  { id: 25, name: "Visakhapatnam", headquarters: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { id: 26, name: "Vizianagaram", headquarters: "Vizianagaram", lat: 18.1124, lng: 83.3956 },
  { id: 27, name: "West Godavari", headquarters: "Bhimavaram", lat: 16.5449, lng: 81.5212 },
  { id: 28, name: "Y.S.R. Kadapa", headquarters: "Kadapa", lat: 14.4673, lng: 78.8242 },
] as const;

export const DISTRICTS: string[] = DISTRICTS_DATA.map((d) => d.name);

export type District = (typeof DISTRICTS_DATA)[number]["name"];

export function getHeadquartersForDistrict(districtName: string): string | undefined {
  const match = DISTRICTS_DATA.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase(),
  );
  return match?.headquarters;
}

export interface GeoCoordinates {
  readonly lat: number;
  readonly lng: number;
}

export function getCoordinatesForDistrict(districtName?: string): GeoCoordinates {
  if (!districtName) return { lat: 16.5, lng: 80.6 };
  const match = DISTRICTS_DATA.find(
    (d) => d.name.toLowerCase() === districtName.trim().toLowerCase(),
  );
  return match ? { lat: match.lat, lng: match.lng } : { lat: 16.5, lng: 80.6 };
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
