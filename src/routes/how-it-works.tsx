import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui-kit";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Problems@AP Works — Anonymous Citizen Reporting" },
      {
        name: "description",
        content:
          "How reporting works on Problems@AP: no account, GPS location, photo evidence, an anonymous report reference and a public status timeline.",
      },
      { property: "og:title", content: "How Problems@AP Works" },
      {
        property: "og:description",
        content:
          "Report a problem in Andhra Pradesh without an account. Here is exactly what happens with your report and your data.",
      },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    n: "01",
    t: "Pick what the problem is",
    d: "Choose a plain-language category like Roads or Drinking Water. You never need to know which department handles it — we map it for you.",
  },
  {
    n: "02",
    t: "Describe what happened",
    d: "A few sentences in your own words. What is wrong, how long it has been happening, and who it affects.",
  },
  {
    n: "03",
    t: "Share the location",
    d: "Use your device location or type the area. Only an approximate area is ever shown publicly.",
  },
  {
    n: "04",
    t: "Attach evidence",
    d: "A photo makes a report far harder to ignore. Optional, but strongly recommended.",
  },
  {
    n: "05",
    t: "Get a reference",
    d: "You receive an anonymous reference such as AP-7F92K4. Keep it to revisit your report later.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-line">
          <div className="container-ap py-14 sm:py-20">
            <h1 className="max-w-2xl text-3xl font-semibold sm:text-4xl">
              How Problems@AP works
            </h1>
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-2">
              Reporting takes about a minute and requires no account, no phone number
              and no identity. Every report is public, factual and traceable through a
              reference only you hold.
            </p>
          </div>
        </div>

        <div className="container-ap py-14 sm:py-20">
          <ol className="divide-y divide-line border-y border-line">
            {steps.map((s) => (
              <li
                key={s.n}
                className="grid gap-2 py-6 sm:grid-cols-[80px_minmax(0,1fr)] sm:gap-8"
              >
                <span className="text-sm tabular-nums text-ink-3">{s.n}</span>
                <div className="max-w-2xl">
                  <h2 className="text-base font-medium">{s.t}</h2>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">
                    {s.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <section id="privacy" className="scroll-mt-24">
              <h2 className="text-lg font-semibold">Privacy</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                We do not collect names, emails, phone numbers or accounts. Precise
                coordinates are stored only to place a report in the right area and are
                never displayed publicly — problem pages show an approximate area such
                as a locality and district. Photographs you attach are shown publicly,
                so avoid including faces, number plates or documents.
              </p>
            </section>
            <section id="terms" className="scroll-mt-24">
              <h2 className="text-lg font-semibold">Terms</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                Problems@AP is an independent citizen platform. It is not affiliated
                with, endorsed by or operated by any government body, and a report here
                is not an official grievance filing. Department names are used only to
                indicate which area of administration a problem relates to. Reports must
                describe real problems; abusive or deliberately false submissions are
                removed.
              </p>
            </section>
          </div>

          <div className="mt-14 rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Ready to report something?</h2>
            <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-2">
              It takes about a minute and stays anonymous.
            </p>
            <ButtonLink to="/report" className="mt-5">
              Report a Problem
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
