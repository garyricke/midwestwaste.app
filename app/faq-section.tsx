// FAQ section — helps customers choose a size and feeds SEO / AI answer engines.
// Visible accordion content mirrors the FAQPage JSON-LD exactly (Google requires
// the structured data to match what users see).

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: "What size dumpster do I need?",
    a: "A 10-yard holds about 2 tons (3–5 pickup loads) — great for small cleanouts, a single room, or a modest yard project. A 15-yard (~3 tons) suits a garage cleanout or small remodel. A 20-yard (~4 tons) handles roofing tear-offs and larger renovations. A 30-yard (~5 tons, 9–10 pickup loads) is best for full estate cleanouts and big construction or remodel jobs. If you're between sizes, size up — it's cheaper than a second haul.",
  },
  {
    q: "How much does dumpster rental cost in the Fox Valley?",
    a: "Flat, transparent pricing: 10-yard $375, 15-yard $425, 20-yard $450, and 30-yard $525. Your price includes delivery, pickup, the rental period, and a set amount of included weight — no hidden fees. You pay online when you order.",
  },
  {
    q: "What areas do you serve?",
    a: "Midwest Waste serves the Illinois Fox Valley and nearby western Chicago suburbs — including Aurora, Sugar Grove, Batavia, Geneva, St. Charles, North Aurora, Montgomery, Oswego, Yorkville, and Naperville. Enter your ZIP at checkout and we'll match you with a trusted local hauler.",
  },
  {
    q: "How does ordering online work?",
    a: "Pick your dumpster size, tell us where it's going, and pay securely online. We automatically route your order to the closest qualified local hauler, who delivers your dumpster and follows up to confirm timing — no phone tag and no quotes to chase.",
  },
  {
    q: "How quickly can a dumpster be delivered?",
    a: "Most orders are delivered next business day, and same-day delivery is often available when you order early in the day. Your matched local hauler will reach out to confirm the exact drop-off time.",
  },
  {
    q: "What can and can't go in the dumpster?",
    a: "Most household junk, furniture, renovation and construction debris, roofing, and yard waste are fine. Hazardous materials are not allowed — no paint, chemicals, oil, tires, batteries, or appliances containing refrigerant. If you're unsure about an item, just ask and we'll help.",
  },
  {
    q: "How long is the rental period?",
    a: "A standard rental runs about 7–10 days. Need it longer? Let us know and we'll arrange an extended rental for your project.",
  },
  {
    q: "Do I need a permit?",
    a: "If the dumpster sits on your driveway or private property, you typically don't need a permit. Placing it on a public street may require a local permit — we're happy to point you in the right direction for your town.",
  },
];

export default function FaqSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section className="border-t border-black/10 bg-white">
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h2 className="font-display text-2xl font-extrabold text-navy">
          Dumpster rental FAQ — Fox Valley, IL
        </h2>
        <p className="mt-2 text-foreground/70">
          Everything you need to choose the right roll-off dumpster and book with
          confidence.
        </p>

        <div className="mt-6 divide-y divide-black/10 rounded-2xl border border-black/10">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display font-bold text-navy">
                {q}
                <span className="ml-4 text-orange transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-foreground/75">{a}</p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-sm text-foreground/60">
          Still have questions? Call{" "}
          <a href="tel:+16308008549" className="font-semibold text-navy hover:text-orange-deep">
            (630) 800-8549
          </a>{" "}
          — a real person answers.
        </p>
      </div>

      {/* Structured data for search engines + AI answer engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
