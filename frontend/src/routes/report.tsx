import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode, type ChangeEvent } from "react";
import { Camera, Check, Copy, Loader2, MapPin, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button, ButtonLink } from "@/components/ui-kit";
import {
  CATEGORIES,
  CONSTITUENCY_DATA,
  DISTRICTS_DATA,
  departmentForCategory,
  getDistrictForConstituency,
  getConstituenciesByDistrict,
  getCoordinatesForDistrict,
} from "@/data/taxonomy";
import { getMLAForConstituency } from "@/data/constituencies";
import { formatDateTime } from "@/data/problems";
import { ProblemMap } from "@/components/problem-map";
import { GpsCameraModal, type GpsCapturedPhoto } from "@/components/gps-camera-modal";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Problem Anonymously — Problems@AP" },
      {
        name: "description",
        content:
          "Report a problem in Andhra Pradesh in about a minute. No account, no phone number. Add location and photo evidence, and get an anonymous reference.",
      },
      { property: "og:title", content: "Report a Problem — Problems@AP" },
      {
        property: "og:description",
        content:
          "Report a problem affecting your area in Andhra Pradesh. Anonymous, no account needed.",
      },
    ],
  }),
  component: ReportPage,
});

type LocState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; area: string; accuracy: number; lat: number; lng: number }
  | { kind: "error"; message: string };

const STEPS = ["Problem", "Details", "Location", "Evidence", "Review"];

function ReportPage() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [constituency, setConstituency] = useState("");
  const [district, setDistrict] = useState("Visakhapatnam");
  const [manualArea, setManualArea] = useState("");
  const [loc, setLoc] = useState<LocState>({ kind: "idle" });
  const [photos, setPhotos] = useState<
    { url: string; name: string; file?: File; isGpsStamped?: boolean }[]
  >([]);
  const [isGpsCameraOpen, setIsGpsCameraOpen] = useState(false);
  const [submitted, setSubmitted] = useState<{ ref: string; token?: string; at: string } | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure every step and confirmation stage loads at the top of the page
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [step, submitted]);

  const handleCopyId = async () => {
    if (!submitted?.ref) return;
    try {
      await navigator.clipboard?.writeText(submitted.ref);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const requestLocation = () => {
    if (!globalThis.navigator?.geolocation) {
      setLoc({ kind: "error", message: "Live GPS location is not available on this browser/device." });
      return;
    }
    setLoc({ kind: "loading" });

    let bestPos: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finalizePosition = async (pos: GeolocationPosition) => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      const { latitude, longitude, accuracy } = pos.coords;
      let detectedArea = `GPS Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;

      // High-precision reverse geocoding at street / building level
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address;
          const road = addr?.road || addr?.street || addr?.pedestrian || "";
          const locality =
            addr?.suburb ||
            addr?.neighbourhood ||
            addr?.village ||
            addr?.town ||
            addr?.city_district ||
            addr?.city ||
            "";
          const county = addr?.county || addr?.state_district || "";

          const parts = [road, locality, county].filter(Boolean);
          if (parts.length > 0) {
            detectedArea = parts.join(", ");
            if (!manualArea) {
              setManualArea(parts.slice(0, 2).join(", "));
            }
          }
          if (county) {
            const matchedDistrict = DISTRICTS_DATA.find(
              (d) =>
                county.toLowerCase().includes(d.name.toLowerCase()) ||
                d.name.toLowerCase().includes(county.toLowerCase()),
            );
            if (matchedDistrict) {
              setDistrict(matchedDistrict.name);
            }
          }
        }
      } catch {
        // Fallback to high precision GPS coordinates
      }

      setLoc({
        kind: "ok",
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        area: detectedArea,
      });
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
            bestPos = pos;
          }
          // Sub-10 meter satellite lock achieved: finalize immediately
          if (pos.coords.accuracy <= 10) {
            void finalizePosition(pos);
          }
        },
        (err) => {
          if (!bestPos) {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            if (timeoutId !== null) clearTimeout(timeoutId);
            let msg = "Could not get live location. You can select your district and constituency manually.";
            if (err.code === err.PERMISSION_DENIED) {
              msg = "Location permission denied. You can select your district and constituency manually.";
            }
            setLoc({ kind: "error", message: msg });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        },
      );

      // Max sampling window of 4 seconds to lock the best satellite fix
      timeoutId = setTimeout(() => {
        if (bestPos) {
          void finalizePosition(bestPos);
        } else {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              void finalizePosition(pos);
            },
            () => {
              if (watchId !== null) navigator.geolocation.clearWatch(watchId);
              setLoc({
                kind: "error",
                message: "Location request timed out. Please select district manually.",
              });
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
          );
        }
      }, 4000);
    } catch {
      setLoc({ kind: "error", message: "Failed to access device GPS location hardware." });
    }
  };

  const handleGpsPhotoCaptured = (stamped: GpsCapturedPhoto) => {
    setPhotos((prev) => [
      ...prev.slice(0, 3),
      {
        url: stamped.previewUrl,
        name: stamped.file.name,
        file: stamped.file,
        isGpsStamped: true,
      },
    ]);

    // Authoritatively sync coordinates to report location from the GPS-stamped photo
    if (stamped.isGpsStamped && stamped.lat !== 0 && stamped.lng !== 0) {
      setLoc({
        kind: "ok",
        lat: stamped.lat,
        lng: stamped.lng,
        accuracy: stamped.accuracy,
        area: stamped.area,
      });
      if (stamped.district) {
        setDistrict(stamped.district);
      }
    }
  };

  const canContinue = () => {
    if (step === 0) return Boolean(category);
    if (step === 1) return description.trim().length >= 20;
    if (step === 2)
      return (
        loc.kind === "ok" ||
        manualArea.trim().length > 2 ||
        Boolean(constituency) ||
        Boolean(district)
      );
    return true;
  };

  const next = () => {
    if (!canContinue()) {
      setError(
        step === 0
          ? "Choose a category to continue."
          : step === 1
            ? "Please describe the problem in at least a sentence or two."
            : "Select your constituency or share your location / area.",
      );
      return;
    }
    setError(null);
    setStep((s: number) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const trimmedManual = manualArea.trim();
      const areaVal =
        trimmedManual.length >= 2
          ? trimmedManual
          : loc.kind === "ok" && loc.area
            ? loc.area
            : constituency
              ? `${constituency}, ${district}`
              : district || "Andhra Pradesh Area";

      const titleVal =
        description.trim().slice(0, 75).trim() + (description.length > 75 ? "…" : "");

      // Upload any attached photos to Cloudinary / storage
      const uploadedEvidenceUrls: string[] = [];
      for (const p of photos) {
        if (p.file) {
          try {
            const uploadedUrl = await apiClient.uploadEvidence(p.file);
            if (uploadedUrl) {
              uploadedEvidenceUrls.push(uploadedUrl);
            }
          } catch {
            // Graceful fallback
          }
        }
      }

      const districtCoords = getCoordinatesForDistrict(district);
      const result = await apiClient.submitProblem({
        title: titleVal,
        description: description.trim(),
        category,
        constituency: constituency || undefined,
        district: district || "Visakhapatnam",
        area: areaVal,
        latitude: loc.kind === "ok" ? loc.lat : districtCoords.lat,
        longitude: loc.kind === "ok" ? loc.lng : districtCoords.lng,
        evidence: uploadedEvidenceUrls.length > 0 ? uploadedEvidenceUrls : undefined,
      });

      setSubmitted({
        ref: result.problemId,
        token: result.confirmationToken,
        at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <SiteHeader />
        <main className="container-ap py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <div className="flex size-10 items-center justify-center rounded-full border border-line bg-surface">
              <Check aria-hidden className="size-5 text-ok" />
            </div>
            <h1 className="mt-5 text-2xl font-bold sm:text-3xl text-ink">
              Your problem has been reported.
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              It will appear publicly with an approximate location only. Keep the reference below to
              track your report — it is the only identifier, since no account or authentication was used.
            </p>

            <div className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Anonymous report reference
              </p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="truncate font-mono text-2xl font-bold tracking-tight text-accent">
                  {submitted.ref}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 transition-all duration-150"
                  onClick={handleCopyId}
                >
                  {copiedId ? (
                    <>
                      <Check aria-hidden className="size-4 text-ok" />
                      <span className="font-semibold text-ok">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy aria-hidden className="size-4" />
                      Copy ID
                    </>
                  )}
                </Button>
              </div>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs sm:text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Category</dt>
                  <dd className="text-right font-medium text-ink">
                    {CATEGORIES.find((c) => c.id === category)?.label}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Department</dt>
                  <dd className="text-right font-medium text-ink">
                    {departmentForCategory(category)}
                  </dd>
                </div>
                {constituency && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-2">Constituency</dt>
                    <dd className="text-right font-medium text-ink">{constituency}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">District</dt>
                  <dd className="text-right font-medium text-ink">{district}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Reported at</dt>
                  <dd className="text-right tabular-nums text-ink">
                    {formatDateTime(submitted.at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to={`/problems/${submitted.ref}`}>
                View Problem Page
              </ButtonLink>
              <ButtonLink to="/explore" variant="secondary">
                See all reported problems
              </ButtonLink>
              <Button
                variant="quiet"
                onClick={() => {
                  setSubmitted(null);
                  setStep(0);
                  setCategory("");
                  setDescription("");
                  setConstituency("");
                  setManualArea("");
                  setPhotos([]);
                }}
              >
                Report another problem
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="container-ap py-6 sm:py-9">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          <div
            className="mt-2 flex gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label="Reporting progress"
          >
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-line")}
              />
            ))}
          </div>

          <div className="mt-6">
            {step === 0 && (
              <fieldset>
                <legend className="text-xl font-bold text-ink">What is the problem?</legend>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Pick the closest category. It will be mapped directly to the responsible ministry.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategory(c.id);
                        setError(null);
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        category === c.id
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <p className="text-sm font-semibold text-ink">{c.label}</p>
                      <p className="mt-1 text-[0.6875rem] text-ink-2">{c.department}</p>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-ink">Describe the problem</h2>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  What is happening, since when, and how is it affecting people in the area?
                </p>
                <textarea
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setDescription(e.target.value);
                    if (error) setError(null);
                  }}
                  rows={6}
                  placeholder="e.g. The main drinking water pipeline on Gandhi Road has been broken for 4 days with contaminated supply. Around 100 families are affected."
                  className="mt-4 w-full rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed placeholder:text-ink-3 focus:border-accent focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-ink-3">
                  <span>Minimum 20 characters</span>
                  <span className={description.trim().length >= 20 ? "text-ok" : "text-ink-3"}>
                    {description.trim().length} chars
                  </span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-ink">Where is the problem?</h2>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Select your assembly constituency and district to ensure accurate routing.
                </p>

                {/* District Selector */}
                <div className="mt-4">
                  <label
                    htmlFor="district-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-2"
                  >
                    District
                  </label>
                  <select
                    id="district-select"
                    value={district}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const newDist = e.target.value;
                      setDistrict(newDist);
                      if (constituency) {
                        const curDist = getDistrictForConstituency(constituency);
                        if (curDist && curDist !== newDist) {
                          setConstituency("");
                        }
                      }
                    }}
                    className="select-ap mt-1.5 h-11 w-full px-3.5 text-sm text-ink shadow-2xs font-medium"
                  >
                    {DISTRICTS_DATA.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Constituency Selector (filtered to selected district) */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="constituency"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-2"
                    >
                      Assembly Constituency
                    </label>
                    <span className="text-[0.6875rem] font-semibold text-ink-3">
                      {district ? `${getConstituenciesByDistrict(district).length} in ${district}` : "175 Total"}
                    </span>
                  </div>
                  <select
                    id="constituency"
                    value={constituency}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      const chosen = e.target.value;
                      setConstituency(chosen);
                      if (chosen) {
                        const mappedDist = getDistrictForConstituency(chosen);
                        if (mappedDist) setDistrict(mappedDist);
                      }
                    }}
                    className="select-ap mt-1.5 h-11 w-full px-3.5 text-sm text-ink shadow-2xs font-medium"
                  >
                    <option value="">
                      {district
                        ? `Select Constituency (${district} — ${getConstituenciesByDistrict(district).length} seats)`
                        : "Select Assembly Constituency (175 AP Constituencies)"}
                    </option>
                    {(district ? getConstituenciesByDistrict(district) : CONSTITUENCY_DATA).map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {constituency && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-accent/20 bg-accent-soft px-3 py-2 text-xs">
                      {getDistrictForConstituency(constituency) && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-ink-2">District:</span>
                          <span className="font-bold text-ink">{getDistrictForConstituency(constituency)}</span>
                        </div>
                      )}
                      {getMLAForConstituency(constituency) && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-ink-2">Elected MLA:</span>
                          <span className="font-bold text-accent">{getMLAForConstituency(constituency)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3.5">
                  <label
                    htmlFor="area"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-2"
                  >
                    Locality / Street / Landmark
                  </label>
                  <input
                    id="area"
                    value={manualArea}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setManualArea(e.target.value)}
                    placeholder="e.g. Near Main Market, Danavaipeta"
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-ink-3"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">Live GPS Location</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-3">
                      Optional
                    </span>
                  </div>

                  {loc.kind === "ok" ? (
                    <div className="mt-3 space-y-2.5">
                      <div className="rounded-lg border border-ok/30 bg-ok/5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <MapPin aria-hidden className="mt-0.5 size-4 text-ok shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-ink">Satellite GPS Lock Confirmed</p>
                                <span className="rounded bg-ok/20 px-1.5 py-0.2 text-[0.625rem] font-extrabold text-ok">
                                  High Precision (±{loc.accuracy}m)
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-ink-2 truncate">{loc.area}</p>
                              <p className="mt-1 text-[0.6875rem] font-semibold text-ink-3">
                                Exact Coordinates: {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLoc({ kind: "idle" })}
                            className="text-xs font-semibold text-ink-3 hover:text-accent"
                            title="Clear live location"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="mt-2.5 flex items-center gap-3 border-t border-ok/20 pt-2 text-xs">
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="font-semibold text-accent hover:underline"
                          >
                            Re-scan Satellite Fix
                          </button>
                        </div>
                      </div>

                      {/* Visual Verification Map Preview */}
                      <div className="overflow-hidden rounded-lg border border-line shadow-2xs">
                        <ProblemMap
                          problems={[
                            {
                              id: "preview-live",
                              title: "Your GPS Location",
                              description: loc.area,
                              category: category || "roads",
                              department: "",
                              constituency: constituency || "",
                              district: district || "",
                              area: loc.area,
                              lat: loc.lat,
                              lng: loc.lng,
                              reportedAt: new Date().toISOString(),
                              status: "reported",
                              reports: 1,
                              confirmations: 1,
                              recurring: false,
                              distanceKm: 0,
                              evidence: [],
                              timeline: [],
                            },
                          ]}
                          selectedId="preview-live"
                          height="160px"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-ink-2">
                        You can optionally auto-detect your location using your device GPS, or manually select your district and constituency above.
                      </p>
                      <Button
                        className="mt-3"
                        variant="secondary"
                        size="sm"
                        onClick={requestLocation}
                        disabled={loc.kind === "loading"}
                      >
                        {loc.kind === "loading" ? (
                          <Loader2 aria-hidden className="size-3.5 animate-spin" />
                        ) : (
                          <MapPin aria-hidden className="size-3.5 text-accent" />
                        )}
                        {loc.kind === "loading" ? "Detecting GPS Location…" : "Auto-detect Live Location"}
                      </Button>
                      {loc.kind === "error" && (
                        <p role="alert" className="mt-2 text-xs text-warn font-medium">
                          {loc.message}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-ink">Add GPS Evidence Photos (optional)</h2>
                    <p className="mt-1 text-xs sm:text-sm text-ink-2">
                      To ensure genuine civic evidence, all photos must be captured live using the built-in GPS Camera.
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-2">
                    {photos.length}/4 photos
                  </span>
                </div>

                {/* Exclusive GPS Camera Launch Studio */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setIsGpsCameraOpen(true)}
                    disabled={photos.length >= 4}
                    className="group flex w-full flex-col sm:flex-row sm:items-center items-start justify-between gap-4 rounded-xl border-2 border-accent/40 bg-accent-soft/40 p-5 text-left transition-all hover:border-accent hover:bg-accent-soft/70 disabled:opacity-50 disabled:pointer-events-none shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-xs group-hover:scale-105 transition-transform">
                        <Camera className="size-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                            Open Civic GPS Camera
                          </p>
                          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[0.6875rem] font-bold text-accent">
                            <MapPin className="size-3" />
                            Live Geotag
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-2 leading-relaxed">
                          Captures live photo with verified coordinates, Plus Code, district, and IST timestamp stamped directly on the image.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-stretch sm:self-center">
                      <span className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-accent-hover transition-colors">
                        Launch Camera
                      </span>
                    </div>
                  </button>

                  <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                    <Camera className="size-4 text-accent shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="font-semibold">Verified Evidence Policy:</strong> Uploading pre-existing gallery photos or downloaded images is disabled. All visual evidence must be captured directly from the camera at the problem location to prevent false or outdated reports.
                    </p>
                  </div>
                </div>

                {/* Photos Thumbnail Grid */}
                {photos.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2.5">
                      Attached GPS Evidence ({photos.length})
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {photos.map((p, i) => (
                        <div
                          key={p.url}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface shadow-2xs"
                        >
                          <img
                            src={p.url}
                            alt={`GPS Evidence ${i + 1}`}
                            className="size-full object-cover"
                          />
                          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[0.625rem] font-bold text-ok backdrop-blur-xs">
                            <MapPin className="size-2.5" />
                            GPS Stamped
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove photo ${i + 1}`}
                            onClick={() =>
                              setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-ink">Review your report</h2>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Verify details before submitting. No account is required.
                </p>

                <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-surface text-sm">
                  <Row label="Category">{CATEGORIES.find((c) => c.id === category)?.label}</Row>
                  <Row label="Routed to">{departmentForCategory(category)}</Row>
                  <Row label="Description">
                    <span className="whitespace-pre-wrap">{description}</span>
                  </Row>
                  <Row label="District">{district}</Row>
                  {constituency && <Row label="Constituency">{constituency}</Row>}
                  {manualArea && <Row label="Locality / Landmark">{manualArea}</Row>}
                  <Row label="Photos">
                    {photos.length === 0 ? (
                      <span className="text-ink-3">None attached</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {photos.map((p, i) => (
                          <div key={p.url} className="relative">
                            <img
                              src={p.url}
                              alt={`Evidence ${i + 1}`}
                              className="size-12 rounded-lg border border-line object-cover"
                            />
                            {p.isGpsStamped && (
                              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-ok text-white font-bold">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Row>
                </dl>
                <p className="mt-3 text-[0.6875rem] leading-relaxed text-ink-3">
                  By submitting you confirm this describes a real problem. Problems@AP is an
                  independent citizen platform.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-xs font-semibold text-accent">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            {step > 0 ? (
              <Button
                variant="quiet"
                size="sm"
                onClick={() => setStep((s: number) => s - 1)}
                disabled={submitting}
              >
                Back
              </Button>
            ) : (
              <Link to="/" className="text-xs text-ink-2 hover:text-ink">
                Cancel
              </Link>
            )}
            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button size="sm" onClick={submit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Report Anonymously"
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      <GpsCameraModal
        isOpen={isGpsCameraOpen}
        onClose={() => setIsGpsCameraOpen(false)}
        onPhotoCaptured={handleGpsPhotoCaptured}
        defaultDistrict={district}
        defaultConstituency={constituency}
      />

      <SiteFooter />
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-ink-2 font-medium">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}
