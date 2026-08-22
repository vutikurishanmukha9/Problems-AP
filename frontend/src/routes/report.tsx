import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode, type ChangeEvent } from "react";
import { Camera, Check, Clock, Copy, Loader2, MapPin, X } from "lucide-react";
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
} from "@/data/taxonomy";
import { getMLAForConstituency } from "@/data/constituencies";
import { formatDateTime } from "@/data/problems";
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
  const [photos, setPhotos] = useState<{ url: string; name: string; file?: File }[]>([]);
  const [submitted, setSubmitted] = useState<{ ref: string; token?: string; at: string } | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setLoc({ kind: "error", message: "Location is not available on this device." });
      return;
    }
    setLoc({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({
          kind: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          area: "Approximate area detected near your position",
        });
      },
      () =>
        setLoc({
          kind: "error",
          message: "We couldn't get your location. You can type the area instead.",
        }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .slice(0, 4 - photos.length)
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name, file: f }));
    setPhotos((p) => [...p, ...next]);
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
      const areaVal =
        manualArea.trim() ||
        (loc.kind === "ok" ? loc.area : constituency || district || "Andhra Pradesh Area");

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

      const result = await apiClient.submitProblem({
        title: titleVal,
        description: description.trim(),
        category,
        constituency: constituency || undefined,
        district: district || "Visakhapatnam",
        area: areaVal,
        latitude: loc.kind === "ok" ? loc.lat : undefined,
        longitude: loc.kind === "ok" ? loc.lng : undefined,
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
                  {loc.kind === "ok" ? (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5">
                      <MapPin aria-hidden className="mt-0.5 size-4 text-accent" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">Device location obtained</p>
                        <p className="mt-0.5 text-xs text-ink-2">{loc.area}</p>
                        <p className="mt-0.5 text-[0.6875rem] text-ink-3">
                          Accuracy ±{loc.accuracy} m · stored privately
                        </p>
                        <button
                          type="button"
                          onClick={requestLocation}
                          className="mt-2 text-xs text-ink underline underline-offset-2"
                        >
                          Retry location
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold">Or use device GPS location</p>
                      <p className="mt-0.5 text-xs text-ink-2">
                        Automatically locates your approximate area.
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
                          <MapPin aria-hidden className="size-3.5" />
                        )}
                        {loc.kind === "loading" ? "Locating…" : "Use my location"}
                      </Button>
                      {loc.kind === "error" && (
                        <p role="alert" className="mt-2 text-xs text-accent">
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
                <h2 className="text-xl font-bold text-ink">Add photos (optional)</h2>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Photos help verify problems faster. Up to 4 images.
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    addPhotos(e.target.files);
                    if (e.target) e.target.value = "";
                  }}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((p, i) => (
                    <div
                      key={p.url}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface"
                    >
                      <img
                        src={p.url}
                        alt={`Evidence ${i + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label={`Remove photo ${i + 1}`}
                        onClick={() =>
                          setPhotos((prev: { url: string; name: string }[]) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface p-4 text-center transition-colors hover:border-line-strong hover:bg-surface-2"
                    >
                      <Camera aria-hidden className="size-6 text-ink-3" />
                      <span className="mt-1.5 text-xs font-semibold text-ink">Add Photo</span>
                      <span className="text-[0.6875rem] text-ink-3">JPG, PNG</span>
                    </button>
                  )}
                </div>
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
                  {constituency && <Row label="Constituency">{constituency}</Row>}
                  <Row label="District">{district}</Row>
                  <Row label="Location">
                    {manualArea
                      ? `${manualArea}${constituency ? ` (${constituency})` : ""}`
                      : constituency
                        ? constituency
                        : loc.kind === "ok"
                          ? `Device location · accuracy ±${loc.accuracy} m`
                          : district}
                  </Row>
                  <Row label="Evidence">
                    {photos.length ? `${photos.length} photo(s)` : "None attached"}
                  </Row>
                  <Row label="Timestamp">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden className="size-3.5 text-ink-3" />
                      {formatDateTime(new Date().toISOString())}
                    </span>
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
