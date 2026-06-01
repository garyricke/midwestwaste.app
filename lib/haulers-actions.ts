"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { geocodeZip } from "@/lib/geocode";
import { isAdmin } from "@/lib/admin-auth";
import { haversineMiles } from "@/lib/matcher";
import { sendHaulerAssignment } from "@/lib/email";
import type { Hauler, Order } from "@/lib/types";

type HaulerInput = {
  name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string;
  latitude: number;
  longitude: number;
  service_radius_miles: number;
  active: boolean;
};

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

/** Resolve coordinates: explicit lat/long if valid, else geocode the zip. */
function resolveCoords(
  zip: string,
  latRaw?: string,
  lngRaw?: string
): { latitude: number; longitude: number } | null {
  const lat = parseFloat(latRaw ?? "");
  const lng = parseFloat(lngRaw ?? "");
  if (isFinite(lat) && isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return { latitude: lat, longitude: lng };
  }
  const geo = geocodeZip(zip);
  return geo ? { latitude: geo.latitude, longitude: geo.longitude } : null;
}

function buildInput(fd: FormData): HaulerInput | { error: string } {
  const name = String(fd.get("name") || "").trim();
  const contact_email = String(fd.get("contact_email") || "").trim();
  const zip = String(fd.get("zip") || "").trim().slice(0, 5);
  if (!name || !contact_email || !zip) {
    return { error: "missing" };
  }
  const coords = resolveCoords(
    zip,
    String(fd.get("latitude") || ""),
    String(fd.get("longitude") || "")
  );
  if (!coords) return { error: "geocode" };

  const radius = parseInt(String(fd.get("service_radius_miles") || "40"), 10);
  return {
    name,
    contact_email,
    contact_phone: String(fd.get("contact_phone") || "").trim() || null,
    address: String(fd.get("address") || "").trim() || null,
    city: String(fd.get("city") || "").trim() || null,
    state: String(fd.get("state") || "").trim().slice(0, 2).toUpperCase() || null,
    zip,
    latitude: coords.latitude,
    longitude: coords.longitude,
    service_radius_miles: isFinite(radius) ? radius : 40,
    active: fd.get("active") === "on",
  };
}

export async function createHauler(fd: FormData) {
  await requireAdmin();
  const input = buildInput(fd);
  if ("error" in input) redirect(`/admin/haulers/new?error=${input.error}`);

  const { error } = await supabaseAdmin.from("haulers").insert(input);
  if (error) redirect(`/admin/haulers/new?error=db`);

  revalidatePath("/admin/haulers");
  redirect("/admin/haulers?added=1");
}

export async function updateHauler(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) redirect("/admin/haulers");

  const input = buildInput(fd);
  if ("error" in input) redirect(`/admin/haulers/${id}/edit?error=${input.error}`);

  const { error } = await supabaseAdmin.from("haulers").update(input).eq("id", id);
  if (error) redirect(`/admin/haulers/${id}/edit?error=db`);

  revalidatePath("/admin/haulers");
  redirect("/admin/haulers?updated=1");
}

export async function deleteHauler(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) {
    await supabaseAdmin.from("haulers").delete().eq("id", id);
    revalidatePath("/admin/haulers");
  }
  redirect("/admin/haulers?deleted=1");
}

/** Manually assign (or reassign) a hauler to an order, then email them. */
export async function assignHauler(fd: FormData) {
  await requireAdmin();
  const orderId = String(fd.get("order_id") || "");
  const haulerId = String(fd.get("hauler_id") || "");
  if (!orderId || !haulerId) redirect("/admin");

  const [orderRes, haulerRes] = await Promise.all([
    supabaseAdmin.from("orders").select("*").eq("id", orderId).maybeSingle(),
    supabaseAdmin.from("haulers").select("*").eq("id", haulerId).maybeSingle(),
  ]);
  const order = orderRes.data as Order | null;
  const hauler = haulerRes.data as Hauler | null;
  if (!order || !hauler) redirect("/admin?error=assign");

  const distance =
    order.delivery_latitude != null && order.delivery_longitude != null
      ? haversineMiles(order.delivery_latitude, order.delivery_longitude, hauler.latitude, hauler.longitude)
      : null;

  await supabaseAdmin
    .from("orders")
    .update({ assigned_hauler_id: hauler.id, distance_miles: distance, status: "notified" })
    .eq("id", order.id);

  try {
    await sendHaulerAssignment(
      { ...order, assigned_hauler_id: hauler.id, distance_miles: distance, status: "notified" },
      hauler,
      distance ?? 0
    );
  } catch {
    // Email failed — leave assigned, admin can retry.
    await supabaseAdmin.from("orders").update({ status: "assigned" }).eq("id", order.id);
  }

  revalidatePath("/admin");
  redirect("/admin?assigned=1");
}

// ---- CSV bulk import --------------------------------------------------------

export type ImportResult = {
  ok: boolean;
  inserted: number;
  errors: string[];
};

/** Minimal RFC-4180-ish CSV parser (handles quoted fields w/ commas + newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function truthy(v: string): boolean {
  return ["1", "true", "yes", "y", "active"].includes(v.trim().toLowerCase());
}

export async function importHaulersAction(
  _prev: ImportResult | null,
  fd: FormData
): Promise<ImportResult> {
  if (!(await isAdmin())) return { ok: false, inserted: 0, errors: ["Unauthorized"] };

  let text = String(fd.get("csv") || "").trim();
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) text = (await file.text()).trim();
  if (!text) return { ok: false, inserted: 0, errors: ["No CSV provided."] };

  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { ok: false, inserted: 0, errors: ["CSV needs a header row plus at least one data row."] };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col("name"),
    email: col("contact_email"),
    phone: col("contact_phone"),
    address: col("address"),
    city: col("city"),
    state: col("state"),
    zip: col("zip"),
    radius: col("service_radius_miles"),
    active: col("active"),
    lat: col("latitude"),
    lng: col("longitude"),
  };
  if (idx.name < 0 || idx.email < 0 || idx.zip < 0) {
    return {
      ok: false,
      inserted: 0,
      errors: ["CSV must include at least these columns: name, contact_email, zip."],
    };
  }

  const valid: HaulerInput[] = [];
  const errors: string[] = [];
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = get(r, idx.name);
    const email = get(r, idx.email);
    const zip = get(r, idx.zip).slice(0, 5);
    if (!name || !email || !zip) {
      errors.push(`Row ${i + 1}: missing name, contact_email, or zip — skipped.`);
      continue;
    }
    const coords = resolveCoords(zip, get(r, idx.lat), get(r, idx.lng));
    if (!coords) {
      errors.push(`Row ${i + 1} (${name}): zip ${zip} not recognized and no lat/long — skipped.`);
      continue;
    }
    const radius = parseInt(get(r, idx.radius) || "40", 10);
    const activeRaw = get(r, idx.active);
    valid.push({
      name,
      contact_email: email,
      contact_phone: get(r, idx.phone) || null,
      address: get(r, idx.address) || null,
      city: get(r, idx.city) || null,
      state: get(r, idx.state).slice(0, 2).toUpperCase() || null,
      zip,
      latitude: coords.latitude,
      longitude: coords.longitude,
      service_radius_miles: isFinite(radius) ? radius : 40,
      active: activeRaw === "" ? true : truthy(activeRaw),
    });
  }

  let inserted = 0;
  if (valid.length) {
    const { error, count } = await supabaseAdmin
      .from("haulers")
      .insert(valid, { count: "exact" });
    if (error) {
      errors.push(`Database error inserting ${valid.length} rows: ${error.message}`);
    } else {
      inserted = count ?? valid.length;
      revalidatePath("/admin/haulers");
    }
  }

  return { ok: inserted > 0, inserted, errors };
}
