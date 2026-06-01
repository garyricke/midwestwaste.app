"use client";

import { useActionState } from "react";
import { importHaulersAction, type ImportResult } from "@/lib/haulers-actions";

const TEMPLATE =
  "name,contact_email,contact_phone,address,city,state,zip,service_radius_miles,active\n" +
  "Acme Roll-Off,dispatch@acme.com,555-123-4567,12 Depot St,Madison,WI,53703,45,true";

export default function ImportForm() {
  const [result, formAction, pending] = useActionState<ImportResult | null, FormData>(
    importHaulersAction,
    null
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-black/10 bg-background p-4 text-sm">
        <p className="font-semibold text-navy">Expected columns</p>
        <p className="mt-1 text-foreground/70">
          Header row required. <code>name</code>, <code>contact_email</code>, and{" "}
          <code>zip</code> are mandatory; the rest are optional:{" "}
          <code>contact_phone</code>, <code>address</code>, <code>city</code>,{" "}
          <code>state</code>, <code>service_radius_miles</code> (default 40),{" "}
          <code>active</code> (default true), <code>latitude</code>,{" "}
          <code>longitude</code>. Coordinates auto-fill from ZIP when omitted.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs text-foreground/80">
{TEMPLATE}
        </pre>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-navy">
            Upload a .csv file
          </label>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white"
          />
        </div>

        <div className="text-center text-xs uppercase tracking-wide text-foreground/40">
          — or paste CSV —
        </div>

        <textarea
          name="csv"
          rows={8}
          placeholder={TEMPLATE}
          className="w-full rounded-lg border-2 border-black/10 px-3 py-2 font-mono text-xs outline-none focus:border-navy"
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-orange px-5 py-3 font-display font-bold text-white hover:bg-orange-deep disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import haulers"}
        </button>
      </form>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.inserted > 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
          }`}
        >
          <p className="font-display font-bold text-navy">
            {result.inserted > 0
              ? `✓ Imported ${result.inserted} hauler${result.inserted === 1 ? "" : "s"}.`
              : "No haulers imported."}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-red-700">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          {result.inserted > 0 && (
            <a href="/admin/haulers" className="mt-3 inline-block text-sm font-semibold text-navy underline">
              View haulers →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
