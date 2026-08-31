import { DISTRICTS_DATA, getDistrictForConstituency } from "@/data/taxonomy";

export interface ResolvedAddress {
  readonly landmark?: string | undefined;
  readonly road?: string | undefined;
  readonly villageOrHamlet?: string | undefined;
  readonly colonyOrSuburb?: string | undefined;
  readonly mandal?: string | undefined;
  readonly townOrCity?: string | undefined;
  readonly district: string;
  readonly pincode?: string | undefined;
  readonly state: string;
  readonly primaryTitle: string;
  readonly secondaryTitle: string;
  readonly fullAddress: string;
}

function findNearestDistrict(lat: number, lng: number): string {
  let minDistance = Number.POSITIVE_INFINITY;
  let nearest = "Andhra Pradesh";
  for (const d of DISTRICTS_DATA) {
    const dLat = d.lat - lat;
    const dLng = d.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = d.name;
    }
  }
  return nearest;
}

function toTitleCase(str: string): string {
  if (!str) return "";
  const trimmed = str.trim();
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return trimmed.toLowerCase().replace(/(?:^|\s|-)\S/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

/**
 * Universal Multi-Strategy Reverse Geocoder & Proximity Landmark Engine
 * Resolves exact Street, Landmark, Colony, Village, Mandal, District & Pincode across Andhra Pradesh.
 */
export async function resolveComprehensiveAddress(
  lat: number,
  lng: number,
  fallbackDistrict?: string,
  fallbackConstituency?: string,
): Promise<ResolvedAddress> {
  let landmark = "";
  let street = "";
  let colony = "";
  let village = "";
  let mandal = "";
  let city = "";
  let district = fallbackDistrict || findNearestDistrict(lat, lng);
  let pincode = "";
  const state = "Andhra Pradesh";

  // Strategy 1 & 2: Parallel query to Photon (Komoot OSM) and Nominatim zoom 18
  const [photonResult, nominatimResult] = await Promise.allSettled([
    (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&radius=0.5`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        return data.features?.[0]?.properties;
      }
      return null;
    })(),
    (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "ProblemsAP-CivicApp/2.0",
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        return data.address;
      }
      return null;
    })(),
  ]);

  if (photonResult.status === "fulfilled" && photonResult.value) {
    const p = photonResult.value;
    if (p.street) street = p.street;
    if (p.name && p.name !== p.street && p.name !== p.city) landmark = p.name;
    if (p.locality) colony = p.locality;
    if (p.district && !colony) colony = p.district;
    if (p.city) city = p.city;
    if (p.county) mandal = p.county;
    if (p.postcode) pincode = p.postcode;
  }

  if (nominatimResult.status === "fulfilled" && nominatimResult.value) {
    const a = nominatimResult.value;
    if (!landmark) {
      landmark =
        a.amenity ||
        a.building ||
        a.landmark ||
        a.place_of_worship ||
        a.shop ||
        a.office ||
        a.tourism ||
        a.leisure ||
        a.historic ||
        a.commercial ||
        "";
    }
    if (!street) {
      street = a.road || a.street || a.pedestrian || a.highway || a.path || a.lane || "";
    }
    if (!village) {
      village = a.village || a.hamlet || a.isolated_dwelling || "";
    }
    if (!colony) {
      colony =
        a.neighbourhood ||
        a.suburb ||
        a.residential ||
        a.quarter ||
        a.block ||
        a.sector ||
        a.housing_estate ||
        "";
    }
    if (!mandal) {
      mandal = a.subdistrict || a.county || a.tehsil || a.taluk || a.mandal || "";
    }
    if (!city) {
      city = a.town || a.city || a.municipality || a.city_district || "";
    }
    if (a.state_district || a.district) {
      district = (a.state_district || a.district || "").replace(/district/i, "").trim();
    }
    if (!pincode && a.postcode) {
      pincode = a.postcode;
    }
  }

  // Strategy 3: Multi-level Zoom fallback if street, colony and village are still unmapped
  if (!street && !colony && !village && !landmark) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=15&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "ProblemsAP-CivicApp/2.0",
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};
        if (a.suburb || a.neighbourhood) colony = a.suburb || a.neighbourhood;
        if (a.village || a.hamlet) village = a.village || a.hamlet;
        if (!mandal) mandal = a.subdistrict || a.county || a.mandal || "";
        if (!pincode && a.postcode) pincode = a.postcode;
      }
    } catch {
      // Fallback
    }
  }

  // Strategy 4: Proximity Landmark Search (overpass / nearest named amenities within 250m)
  if (!landmark) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const q = `[out:json][timeout:2];(node(around:250,${lat},${lng})[amenity][name];node(around:250,${lat},${lng})[place][name];);out center 4;`;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;
      const res = await fetch(overpassUrl, {
        headers: { "User-Agent": "ProblemsAP-CivicApp/2.0" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const firstPoi = data.elements?.[0];
        if (firstPoi?.tags?.name) {
          landmark = `Near ${firstPoi.tags.name}`;
        }
      }
    } catch {
      // Proximity search fallback
    }
  }

  // Strategy 5: BigDataCloud Administrative Fallback for rural mandals
  if (!village && !mandal) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal },
      );
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const admin =
          (data.localityInfo?.administrative as Array<{
            name?: string;
            description?: string;
          }>) || [];
        for (const item of admin) {
          const desc = (item.description || "").toLowerCase();
          const name = item.name || "";
          if ((desc.includes("mandal") || name.toLowerCase().includes("mandal")) && !mandal) {
            mandal = name;
          } else if (desc.includes("village") && !village) {
            village = name;
          } else if (
            (desc.includes("district") || name.toLowerCase().includes("district")) &&
            (!district || district === "Andhra Pradesh")
          ) {
            district = name.replace(/district/i, "").trim();
          }
        }
        if (!colony && data.locality) colony = data.locality;
        if (!city && data.city) city = data.city;
        if (!pincode && data.postcode) pincode = data.postcode;
      }
    } catch {
      // Fallback
    }
  }

  // Clean and format strings
  const cleanLandmark = toTitleCase(landmark);
  let cleanStreet = toTitleCase(street);
  const cleanColony = toTitleCase(colony);
  const cleanVillage = toTitleCase(village);
  const cleanCity = toTitleCase(city);

  // If street name is a raw OSM duplicate of colony with numbering (e.g. "Lalitha Nagar 21st Street" vs "Lalitha Nagar"),
  // de-duplicate and preserve the authentic colony name.
  if (cleanStreet && cleanColony) {
    const sNorm = cleanStreet.toLowerCase().replace(/[^a-z]/g, "");
    const cNorm = cleanColony.toLowerCase().replace(/[^a-z]/g, "");
    if (sNorm.includes(cNorm) || cNorm.includes(sNorm)) {
      cleanStreet = "";
    }
  }

  // Clean and format mandal
  let formattedMandal = toTitleCase(mandal);
  if (
    formattedMandal &&
    !formattedMandal.toLowerCase().includes("mandal") &&
    !formattedMandal.toLowerCase().includes("urban") &&
    !formattedMandal.toLowerCase().includes("rural")
  ) {
    formattedMandal = `${formattedMandal} Mandal`;
  }

  // Build Primary Physical Spot Line
  const primaryParts: string[] = [];
  if (cleanLandmark) primaryParts.push(cleanLandmark);
  if (cleanStreet && !primaryParts.includes(cleanStreet)) primaryParts.push(cleanStreet);
  if (cleanVillage && !primaryParts.includes(cleanVillage)) primaryParts.push(cleanVillage);
  if (cleanColony && !primaryParts.includes(cleanColony) && cleanColony !== cleanVillage) {
    primaryParts.push(cleanColony);
  }
  if (formattedMandal && !primaryParts.includes(formattedMandal)) {
    primaryParts.push(formattedMandal);
  } else if (cleanCity && !primaryParts.includes(cleanCity)) {
    primaryParts.push(cleanCity);
  }

  const primaryTitle =
    primaryParts.length > 0
      ? primaryParts.join(", ")
      : `Cadastral Zone (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

  // Build Secondary Administrative Line
  const adminParts: string[] = [];
  if (fallbackConstituency) {
    const constDist = getDistrictForConstituency(fallbackConstituency);
    if (!constDist || constDist.toLowerCase() === district.toLowerCase()) {
      adminParts.push(`${fallbackConstituency} A.C.`);
    }
  }
  const cleanDistrict = district || fallbackDistrict || "Andhra Pradesh";
  const distLabel = cleanDistrict.toLowerCase().includes("district")
    ? cleanDistrict
    : `${cleanDistrict} District`;
  adminParts.push(distLabel);
  adminParts.push(state);
  if (pincode) {
    adminParts.push(`PIN: ${pincode}`);
  }

  const secondaryTitle = adminParts.join(" · ");

  // Full Combined Postal Address
  const fullAddress = `${primaryTitle}, ${distLabel}, ${state}${pincode ? ` - ${pincode}` : ""}`;

  return {
    landmark: cleanLandmark || undefined,
    road: cleanStreet || undefined,
    villageOrHamlet: cleanVillage || undefined,
    colonyOrSuburb: cleanColony || undefined,
    mandal: formattedMandal || undefined,
    townOrCity: cleanCity || undefined,
    district: cleanDistrict,
    pincode: pincode || undefined,
    state,
    primaryTitle,
    secondaryTitle,
    fullAddress,
  };
}
