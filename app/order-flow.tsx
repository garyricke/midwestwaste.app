"use client";

import { useState } from "react";
import type { DumpsterSize } from "@/lib/types";
import OrderForm from "./order-form";

// Hero photo per dumpster size — becomes the background of the top section.
const HERO: Record<string, string> = {
  "10yd": "/hero/hero-10yd.jpg",
  "15yd": "/hero/hero-15yd.jpg",
  "20yd": "/hero/hero-20yd.jpg",
  "30yd": "/hero/hero-30yd.jpg",
};

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderFlow({ sizes }: { sizes: DumpsterSize[] }) {
  const [selected, setSelected] = useState<string>(sizes[0]?.size ?? "10yd");
  const heroSrc = HERO[selected] ?? HERO["10yd"];

  return (
    <>
      {/* Hero: dumpster photo background + scrim + frosted size selector */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={selected}
          src={heroSrc}
          alt={`Midwest Waste ${selected} roll-off dumpster`}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-deep/80 via-navy-deep/25 to-navy-deep/60" />

        <div className="mx-auto max-w-3xl px-5 py-16 text-white sm:py-24">
          <h1 className="font-display text-3xl font-extrabold leading-tight drop-shadow-sm sm:text-4xl">
            Order a dumpster in two minutes.
          </h1>
          <p className="mt-3 max-w-xl text-white/85 drop-shadow-sm">
            Pick your size, tell us where it&apos;s going, and we&apos;ll match
            you with a trusted local hauler. No phone tag, no quotes to chase.
          </p>

          <fieldset className="mt-7">
            <legend className="mb-3 font-display text-lg font-bold drop-shadow-sm">
              1 · Choose your size
            </legend>
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
          </fieldset>
        </div>

        {/* Preload the other sizes so the background swap is instant */}
        {Object.values(HERO)
          .filter((src) => src !== heroSrc)
          .map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" width={1} height={1} className="hidden" aria-hidden="true" />
          ))}
      </section>

      {/* Delivery + contact + checkout */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        <OrderForm selected={selected} />
      </section>
    </>
  );
}
