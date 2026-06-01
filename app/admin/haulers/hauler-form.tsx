import type { Hauler } from "@/lib/types";

const ERRORS: Record<string, string> = {
  missing: "Name, contact email, and ZIP are required.",
  geocode: "That ZIP wasn't recognized. Enter latitude/longitude manually below.",
  db: "Couldn't save — please try again.",
};

export default function HaulerForm({
  action,
  hauler,
  submitLabel,
  error,
}: {
  action: (fd: FormData) => void;
  hauler?: Hauler;
  submitLabel: string;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {hauler && <input type="hidden" name="id" value={hauler.id} />}

      {error && ERRORS[error] && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORS[error]}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Company name" required defaultValue={hauler?.name} className="sm:col-span-2" />
        <Field name="contact_email" label="Contact email" type="email" required defaultValue={hauler?.contact_email} />
        <Field name="contact_phone" label="Contact phone" defaultValue={hauler?.contact_phone ?? ""} />
        <Field name="address" label="Street address" defaultValue={hauler?.address ?? ""} className="sm:col-span-2" />
        <Field name="city" label="City" defaultValue={hauler?.city ?? ""} />
        <div className="grid grid-cols-2 gap-4">
          <Field name="state" label="State" maxLength={2} placeholder="WI" defaultValue={hauler?.state ?? ""} />
          <Field name="zip" label="ZIP" required inputMode="numeric" maxLength={5} defaultValue={hauler?.zip ?? ""} />
        </div>
        <Field
          name="service_radius_miles"
          label="Service radius (miles)"
          type="number"
          inputMode="numeric"
          defaultValue={hauler ? String(hauler.service_radius_miles) : "40"}
        />
        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" name="active" defaultChecked={hauler ? hauler.active : true} className="h-4 w-4" />
          <span className="text-sm font-semibold text-navy">Active (included in matching)</span>
        </label>
      </div>

      <details className="rounded-lg border border-black/10 bg-background p-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy">
          Coordinates (optional — auto-filled from ZIP if left blank)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Field name="latitude" label="Latitude" defaultValue={hauler ? String(hauler.latitude) : ""} />
          <Field name="longitude" label="Longitude" defaultValue={hauler ? String(hauler.longitude) : ""} />
        </div>
        <p className="mt-2 text-xs text-foreground/50">
          Leave blank to use the ZIP centroid. Override here for exact yard
          location.
        </p>
      </details>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-orange px-5 py-3 font-display font-bold text-white hover:bg-orange-deep"
        >
          {submitLabel}
        </button>
        <a
          href="/admin/haulers"
          className="rounded-lg border border-black/15 px-5 py-3 font-display font-bold text-navy hover:bg-black/5"
        >
          Cancel
        </a>
      </div>
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
      <label className="mb-1 block text-sm font-semibold text-navy">
        {label}
        {rest.required && <span className="text-orange-deep"> *</span>}
      </label>
      <input
        name={name}
        className="w-full rounded-lg border-2 border-black/10 px-3 py-2 outline-none focus:border-navy"
        {...rest}
      />
    </div>
  );
}
