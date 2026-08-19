import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type ReactNode, type ChangeEvent } from "react";
import { Camera, Check, Clock, Copy, Loader2, MapPin, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button, ButtonLink } from "@/components/ui-kit";
import { CATEGORIES, CONSTITUENCY_DATA, departmentForCategory } from "@/data/taxonomy";
import { formatDateTime } from "@/data/problems";
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

function makeReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `AP-${out}`;
}

function ReportPage() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [constituency, setConstituency] = useState("");
  const [manualArea, setManualArea] = useState("");
  const [loc, setLoc] = useState<LocState>({ kind: "idle" });
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState<{ ref: string; at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPhotos((p: { url: string; name: string }[]) => [...p, ...next]);
  };

  const canContinue = () => {
    if (step === 0) return Boolean(category);
    if (step === 1) return description.trim().length >= 20;
    if (step === 2)
      return loc.kind === "ok" || manualArea.trim().length > 2 || Boolean(constituency);
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

  const submit = () => setSubmitted({ ref: makeReference(), at: new Date().toISOString() });

  if (submitted) {
    return (
      <>
        <SiteHeader />
        <main className="container-ap py-16 sm:py-24">
          <div className="mx-auto max-w-xl">
            <div className="flex size-10 items-center justify-center rounded-full border border-line bg-surface">
              <Check aria-hidden className="size-5 text-ok" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">
              Your problem has been reported.
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
              It will appear publicly with an approximate location only. Keep the reference below to
              revisit your report — it is the only way back to it, since no account was created.
            </p>

            <div className="mt-6 rounded-xl border border-line bg-surface p-5">
              <p className="text-xs text-ink-2">Anonymous report reference</p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <p className="truncate font-mono text-2xl tracking-tight">{submitted.ref}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigator.clipboard?.writeText(submitted.ref)}
                >
                  <Copy aria-hidden className="size-4" />
                  Copy
                </Button>
              </div>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Category</dt>
                  <dd className="text-right">{CATEGORIES.find((c) => c.id === category)?.label}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Routed to</dt>
                  <dd className="text-right">{departmentForCategory(category)}</dd>
                </div>
                {constituency && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-2">Constituency</dt>
                    <dd className="text-right font-medium">{constituency}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Reported at</dt>
                  <dd className="text-right">{formatDateTime(submitted.at)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">Status</dt>
                  <dd className="text-right">Reported</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/explore" variant="secondary">
                Explore other problems
              </ButtonLink>
              <ButtonLink to="/report" variant="quiet" onClick={() => location.reload()}>
                Report another problem
              </ButtonLink>
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
          <p className="text-xs text-ink-2">
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
                className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-line")}
              />
            ))}
          </div>

          <div className="mt-5">
            {step === 0 && (
              <fieldset>
                <legend className="text-xl font-semibold">What is the problem?</legend>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Pick the closest option. We'll route it to the right department.
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
                      aria-pressed={category === c.id}
                      className={cn(
                        "rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                        category === c.id
                          ? "border-ink bg-surface shadow-sm"
                          : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <span className="block text-sm font-medium">{c.label}</span>
                      <span className="mt-0.5 block truncate text-[0.6875rem] text-ink-2">
                        {c.department}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <div>
                <h1 className="text-xl font-semibold">Tell us what happened</h1>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  What is wrong, how long it has been happening and who it affects.
                </p>
                <label
                  htmlFor="desc"
                  className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-2"
                >
                  Description
                </label>
                <textarea
                  id="desc"
                  rows={5}
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="The public tap on our street has had no water since Monday…"
                  className="mt-1.5 w-full rounded-lg border border-line bg-surface p-3 text-sm leading-relaxed placeholder:text-ink-3"
                />
                <p className="mt-1.5 text-xs text-ink-3">
                  Avoid names, phone numbers or anything identifying a person.
                </p>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-xl font-semibold">Where is it happening?</h1>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Pick your Assembly Constituency or use device location. Exact coordinates are
                  never published.
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="constituency"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-2"
                  >
                    Assembly Constituency
                  </label>
                  <select
                    id="constituency"
                    value={constituency}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setConstituency(e.target.value)
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                  >
                    <option value="">
                      Select Assembly Constituency (All 175 AP Constituencies)
                    </option>
                    {CONSTITUENCY_DATA.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} — MLA: {c.mla}
                      </option>
                    ))}
                  </select>
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
                        <p className="mt-2 text-xs text-accent">{loc.message}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-xl font-semibold">Add evidence</h1>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  A photo makes a report much harder to ignore. Optional.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => addPhotos(e.target.files)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => fileRef.current?.click()}
                  disabled={photos.length >= 4}
                >
                  <Camera aria-hidden className="size-3.5" />
                  Add photo
                </Button>
                {photos.length > 0 && (
                  <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {photos.map((p: { url: string; name: string }, i: number) => (
                      <li key={p.url} className="relative">
                        <img
                          src={p.url}
                          alt={`Attached evidence ${i + 1}: ${p.name}`}
                          className="aspect-square w-full rounded-lg border border-line object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove ${p.name}`}
                          onClick={() =>
                            setPhotos((cur: { url: string; name: string }[]) =>
                              cur.filter((x: { url: string; name: string }) => x.url !== p.url),
                            )
                          }
                          className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full border border-line bg-surface"
                        >
                          <X aria-hidden className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-xl font-semibold">Review and submit</h1>
                <p className="mt-1 text-xs sm:text-sm text-ink-2">
                  Timestamp, accuracy and the anonymous reference are added automatically.
                </p>
                <dl className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface text-xs sm:text-sm">
                  <Row label="Category">{CATEGORIES.find((c) => c.id === category)?.label}</Row>
                  <Row label="Department">{departmentForCategory(category)}</Row>
                  <Row label="Description">
                    <span className="whitespace-pre-wrap">{description}</span>
                  </Row>
                  {constituency && <Row label="Constituency">{constituency}</Row>}
                  <Row label="Location">
                    {manualArea
                      ? `${manualArea}${constituency ? ` (${constituency})` : ""}`
                      : constituency
                        ? constituency
                        : loc.kind === "ok"
                          ? `Device location · accuracy ±${loc.accuracy} m`
                          : "Location provided"}
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
                  independent citizen platform and this is not an official grievance filing.
                </p>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-xs font-medium text-accent">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            {step > 0 ? (
              <Button variant="quiet" size="sm" onClick={() => setStep((s: number) => s - 1)}>
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
              <Button size="sm" onClick={submit}>
                Submit report
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
      <dt className="text-ink-2">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
