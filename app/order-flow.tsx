"use client";

import { useState } from "react";
import type { DumpsterSize } from "@/lib/types";
import OrderForm from "./order-form";

// Hero photo per dumpster size — swaps when the customer picks a size.
const HERO: Record<string, string> = {
  "10yd": "/hero/hero-10yd.jpg",
  "15yd": "/hero/hero-15yd.jpg",
  "20yd": "/hero/hero-20yd.jpg",
  "30yd": "/hero/hero-30yd.jpg",
};

export default function OrderFlow({ sizes }: { sizes: DumpsterSize[] }) {
  const [selected, setSelected] = useState<string>(sizes[0]?.size ?? "10yd");
  const heroSrc = HERO[selected] ?? HERO["10yd"];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-deep text-white">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-6">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
            Order a dumpster in two minutes.
          </h1>
          <p className="mt-3 max-w-xl text-white/80">
            Pick your size, tell us where it&apos;s going, and we&apos;ll match
            you with a trusted local hauler. No phone tag, no quotes to chase.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={selected}
              src={heroSrc}
              alt={`Midwest Waste ${selected} roll-off dumpster`}
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
          {/* Preload the other sizes so the swap is instant */}
          {Object.values(HERO)
            .filter((src) => src !== heroSrc)
            .map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" width={1} height={1} className="hidden" aria-hidden="true" />
            ))}
        </div>
      </section>

      {/* Order form */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        <OrderForm sizes={sizes} selected={selected} onSelect={setSelected} />
      </section>
    </>
  );
}
