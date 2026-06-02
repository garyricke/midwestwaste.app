"use client";

import { useState } from "react";
import type { DumpsterSize } from "@/lib/types";
import OrderForm from "./order-form";

// Hero photos hosted on Cloudinary (auto format/quality, CDN, responsive).
// Two crops per size: "wide" (3:2, desktop) and "tall" (9:16, mobile).
const CLD = "https://res.cloudinary.com/dsbllwpbh/image/upload";
const HERO_SIZES = ["10yd", "15yd", "20yd", "30yd"];
const heroUrl = (size: string, variant: "wide" | "tall", w: number) =>
  `${CLD}/f_auto,q_auto,w_${w}/midwest-waste/hero/${size}-${variant}`;

// Approx pickup-truck loads each size holds (from the roll-off size guide).
const TRUCK_LOADS: Record<string, number> = {
  "10yd": 4,
  "15yd": 6,
  "20yd": 8,
  "30yd": 10,
};

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

export default function OrderFlow({ sizes }: { sizes: DumpsterSize[] }) {
  const [selected, setSelected] = useState<string>(sizes[0]?.size ?? "10yd");
  const heroSize = HERO_SIZES.includes(selected) ? selected : "10yd";

  return (
    <>
      {/* Hero: dumpster photo background + scrim + frosted size selector */}
      <section className="relative isolate overflow-hidden">
        {/* Responsive background: 9:16 portrait on mobile, 3:2 on desktop */}
        <picture key={heroSize} className="absolute inset-0 -z-20 block h-full w-full">
          <source media="(max-width: 640px)" srcSet={heroUrl(heroSize, "tall", 800)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroUrl(heroSize, "wide", 1280)}
            alt={`Midwest Waste ${selected} roll-off dumpster`}
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-deep/80 via-navy-deep/25 to-navy-deep/60" />

        <div className="mx-auto max-w-3xl px-5 py-16 text-white sm:py-24">
          <h1 className="font-display text-3xl font-extrabold leading-tight drop-shadow-sm sm:text-4xl">
            Order a dumpster in two minutes.
          </h1>
          <p className="mt-3 max-w-xl text-white/85 drop-shadow-sm">
            Pick your size, tell us where it&apos;s going, and we&apos;ll match
            you with a trusted local hauler. No phone tag, no quotes to chase.
          </p>

          <div className="mt-7">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h2 className="font-display text-lg font-bold drop-shadow-sm">
                1 · Choose your size
              </h2>
              <div
                className="flex items-center gap-2"
                aria-label={`Holds about ${TRUCK_LOADS[selected] ?? 4} pickup-truck loads`}
              >
                <div className="flex flex-wrap gap-1 text-yellow">
                  {Array.from({ length: TRUCK_LOADS[selected] ?? 4 }).map((_, i) => (
                    <TruckIcon key={i} />
                  ))}
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-white/85">
                  ≈ {TRUCK_LOADS[selected] ?? 4} truck loads
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {sizes.map((s) => {
                const active = selected === s.size;
                return (
                  <button
                    type="button"
                    key={s.size}
                    onClick={() => setSelected(s.size)}
                    aria-pressed={active}
                    className={`cursor-pointer rounded-xl border p-4 text-left backdrop-blur-md transition ${
                      active
                        ? "border-orange bg-navy-deep/65 ring-2 ring-orange"
                        : "border-white/25 bg-navy-deep/35 hover:bg-navy-deep/50"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-bold text-white">{s.label}</span>
                      <span className="font-display text-lg font-extrabold text-yellow">
                        {dollars(s.price_cents)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/75">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preload the other sizes (both crops) so the background swap is instant */}
        {HERO_SIZES.filter((s) => s !== heroSize).flatMap((s) =>
          (["wide", "tall"] as const).map((v) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${s}-${v}`}
              src={heroUrl(s, v, v === "tall" ? 800 : 1280)}
              alt=""
              width={1}
              height={1}
              className="hidden"
              aria-hidden="true"
            />
          ))
        )}
      </section>

      {/* Delivery + contact + checkout */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        <OrderForm selected={selected} />
      </section>
    </>
  );
}
