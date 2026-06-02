"use client";

import { useState } from "react";
import type { DumpsterSize } from "@/lib/types";

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderForm({
  sizes,
  selected,
  onSelect,
}: {
  sizes: DumpsterSize[];
  selected: string;
  onSelect: (size: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.url; // Stripe Checkout
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Size picker */}
      <fieldset>
        <legend className="font-display font-bold text-lg text-navy mb-3">
          1 · Choose your size
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {sizes.map((s) => {
            const active = selected === s.size;
            return (
              <label
                key={s.size}
                className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                  active
                    ? "border-orange bg-orange/5"
                    : "border-black/10 hover:border-navy/40"
                }`}
              >
                <input
                  type="radio"
                  name="size"
                  value={s.size}
                  checked={active}
                  onChange={() => onSelect(s.size)}
                  className="sr-only"
                />
                <div className="flex items-baseline justify-between">
                  <span className="font-display font-bold text-navy">
                    {s.label}
                  </span>
                  <span className="font-display font-extrabold text-orange-deep">
                    {dollars(s.price_cents)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  {s.description}
                </p>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Delivery */}
      <fieldset>
        <legend className="font-display font-bold text-lg text-navy mb-3">
          2 · Where should we deliver it?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="delivery_address" label="Street address" required className="sm:col-span-2" />
          <Field name="delivery_city" label="City" />
          <div className="grid grid-cols-2 gap-3">
            <Field name="delivery_state" label="State" maxLength={2} placeholder="WI" />
            <Field name="delivery_zip" label="ZIP" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} />
          </div>
          <Field name="requested_delivery_date" label="Requested delivery date" type="date" className="sm:col-span-2" />
        </div>
      </fieldset>

      {/* Contact */}
      <fieldset>
        <legend className="font-display font-bold text-lg text-navy mb-3">
          3 · How do we reach you?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field name="customer_name" label="Full name" required className="sm:col-span-2" />
          <Field name="customer_email" label="Email" type="email" required />
          <Field name="customer_phone" label="Phone" type="tel" inputMode="tel" />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-navy mb-1">
              Anything we should know? (optional)
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-lg border-2 border-black/10 px-3 py-2 focus:border-navy outline-none"
            />
          </div>
        </div>
      </fieldset>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-orange px-6 py-4 font-display font-extrabold text-lg text-white shadow-sm transition hover:bg-orange-deep disabled:opacity-60"
      >
        {submitting ? "Taking you to checkout…" : "Continue to secure payment →"}
      </button>
      <p className="text-center text-xs text-foreground/50">
        Payments are processed securely by Stripe. We never see your card
        number.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  className = "",
  ...rest
}: {
  name: string;
  label: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-navy mb-1">
        {label}
        {rest.required && <span className="text-orange-deep"> *</span>}
      </label>
      <input
        name={name}
        className="w-full rounded-lg border-2 border-black/10 px-3 py-2 focus:border-navy outline-none"
        {...rest}
      />
    </div>
  );
}
