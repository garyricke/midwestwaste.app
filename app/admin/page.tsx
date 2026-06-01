import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { assignHauler } from "@/lib/haulers-actions";
import type { Order } from "@/lib/types";
import AdminLogin from "./admin-login";
import AdminHeader from "./admin-header";

type HaulerOption = { id: string; name: string; city: string | null };

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-600",
  paid: "bg-blue-100 text-blue-700",
  assigned: "bg-amber-100 text-amber-800",
  notified: "bg-green-100 text-green-700",
  needs_manual_assignment: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_manual_assignment", label: "Needs assignment" },
  { key: "notified", label: "Notified" },
  { key: "assigned", label: "Assigned" },
  { key: "paid", label: "Paid" },
  { key: "pending_payment", label: "Unpaid" },
];

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string; assigned?: string }>;
}) {
  const { error, status, assigned } = await searchParams;

  if (!(await isAdmin())) {
    return <AdminLogin error={error === "1"} />;
  }

  // Fetch orders + haulers in parallel (haulers table is tiny).
  const [ordersRes, haulersRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin.from("haulers").select("id,name,contact_email,contact_phone,city,active"),
  ]);
  const orders = (ordersRes.data ?? []) as Order[];

  const haulerMap: Record<string, { name: string; email: string; phone: string | null }> = {};
  const activeHaulers: HaulerOption[] = [];
  for (const h of haulersRes.data ?? []) {
    haulerMap[h.id] = { name: h.name, email: h.contact_email, phone: h.contact_phone };
    if (h.active) activeHaulers.push({ id: h.id, name: h.name, city: h.city });
  }

  // Counts for the summary + filter badges.
  const counts: Record<string, number> = {};
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  const revenue = orders
    .filter((o) => o.status !== "pending_payment" && o.status !== "failed")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const active = status && status !== "all" ? status : "all";
  const shown = active === "all" ? orders : orders.filter((o) => o.status === active);

  return (
    <main className="flex-1">
      <AdminHeader active="orders" />

      <div className="mx-auto max-w-6xl px-5 py-6">
        {assigned && (
          <p className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
            Hauler assigned and notified by email.
          </p>
        )}
        {/* Summary */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Orders" value={String(orders.length)} />
          <Stat label="Paid revenue" value={dollars(revenue)} />
          <Stat
            label="Needs assignment"
            value={String(counts["needs_manual_assignment"] ?? 0)}
            alert={(counts["needs_manual_assignment"] ?? 0) > 0}
          />
          <Stat label="Notified" value={String(counts["notified"] ?? 0)} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isActive = active === f.key;
            const n = f.key === "all" ? orders.length : counts[f.key] ?? 0;
            return (
              <a
                key={f.key}
                href={`/admin?status=${f.key}`}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  isActive
                    ? "bg-navy text-white"
                    : "bg-white border border-black/10 text-navy hover:border-navy/40"
                }`}
              >
                {f.label} <span className="opacity-60">{n}</span>
              </a>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-foreground/60">
              <tr>
                <Th>When</Th>
                <Th>Status</Th>
                <Th>Size</Th>
                <Th>Amount</Th>
                <Th>Delivery</Th>
                <Th>Customer</Th>
                <Th>Matched hauler</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                    No orders in this view yet.
                  </td>
                </tr>
              )}
              {shown.map((o) => {
                const h = o.assigned_hauler_id ? haulerMap[o.assigned_hauler_id] : null;
                return (
                  <tr key={o.id} className="border-t border-black/5 align-top">
                    <Td className="whitespace-nowrap">{when(o.created_at)}</Td>
                    <Td>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {o.status.replace(/_/g, " ")}
                      </span>
                    </Td>
                    <Td>{o.dumpster_size}</Td>
                    <Td>{dollars(o.amount_cents)}</Td>
                    <Td>
                      <div>{o.delivery_address}</div>
                      <div className="text-foreground/60">
                        {o.delivery_city ? `${o.delivery_city}, ` : ""}
                        {o.delivery_state} {o.delivery_zip}
                      </div>
                      {o.requested_delivery_date && (
                        <div className="text-xs text-foreground/50">
                          wants: {o.requested_delivery_date}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <div>{o.customer_name}</div>
                      <div className="text-foreground/60">{o.customer_email}</div>
                      {o.customer_phone && (
                        <div className="text-foreground/60">{o.customer_phone}</div>
                      )}
                    </Td>
                    <Td>
                      {h ? (
                        <>
                          <div className="font-semibold">{h.name}</div>
                          {o.distance_miles != null && (
                            <div className="text-foreground/60">
                              {o.distance_miles.toFixed(1)} mi
                              {o.status === "needs_manual_assignment" && " (out of range)"}
                            </div>
                          )}
                          <div className="text-xs text-foreground/50">{h.email}</div>
                        </>
                      ) : (
                        <span className="text-foreground/40">—</span>
                      )}
                      {o.status !== "pending_payment" && o.status !== "failed" && (
                        <AssignControl order={o} haulers={activeHaulers} />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-foreground/50">
          Showing up to 300 most recent orders. “Needs assignment” = paid but no
          hauler within range — source a hauler for that area, then notify them
          directly.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        alert ? "border-red-300 bg-red-50" : "border-black/10 bg-white"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-foreground/50">{label}</div>
      <div className={`font-display text-2xl font-extrabold ${alert ? "text-red-700" : "text-navy"}`}>
        {value}
      </div>
    </div>
  );
}

function AssignControl({
  order,
  haulers,
}: {
  order: Order;
  haulers: HaulerOption[];
}) {
  const needsAssignment = order.status === "needs_manual_assignment";
  return (
    <form action={assignHauler} className="mt-2 flex flex-wrap items-center gap-1">
      <input type="hidden" name="order_id" value={order.id} />
      <select
        name="hauler_id"
        defaultValue={order.assigned_hauler_id ?? ""}
        required
        className="max-w-[11rem] rounded-md border border-black/15 px-2 py-1 text-xs"
      >
        <option value="" disabled>
          Choose hauler…
        </option>
        {haulers.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
            {h.city ? ` — ${h.city}` : ""}
          </option>
        ))}
      </select>
      <button
        className={`rounded-md px-2 py-1 text-xs font-semibold text-white ${
          needsAssignment ? "bg-orange hover:bg-orange-deep" : "bg-navy hover:bg-navy-deep"
        }`}
      >
        {needsAssignment ? "Assign" : "Reassign"}
      </button>
    </form>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
