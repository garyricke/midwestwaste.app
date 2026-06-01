import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { Hauler } from "@/lib/types";
import AdminLogin from "../admin-login";
import AdminHeader from "../admin-header";

export const dynamic = "force-dynamic";

export default async function HaulersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  if (!(await isAdmin())) {
    return <AdminLogin error={error === "1"} />;
  }

  const { data: haulerRows } = await supabaseAdmin
    .from("haulers")
    .select("*")
    .order("state", { ascending: true })
    .order("city", { ascending: true })
    .order("name", { ascending: true });
  const haulers = (haulerRows ?? []) as Hauler[];

  // Count assigned orders per hauler.
  const { data: assigned } = await supabaseAdmin
    .from("orders")
    .select("assigned_hauler_id")
    .not("assigned_hauler_id", "is", null);
  const orderCounts: Record<string, number> = {};
  for (const r of assigned ?? []) {
    const id = (r as { assigned_hauler_id: string }).assigned_hauler_id;
    orderCounts[id] = (orderCounts[id] ?? 0) + 1;
  }

  const activeCount = haulers.filter((h) => h.active).length;

  return (
    <main className="flex-1">
      <AdminHeader active="haulers" />

      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Haulers" value={String(haulers.length)} />
          <Stat label="Active" value={String(activeCount)} />
          <Stat label="Inactive" value={String(haulers.length - activeCount)} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-background text-left text-foreground/60">
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Location</Th>
                <Th>Coordinates</Th>
                <Th>Radius</Th>
                <Th>Orders</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {haulers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-foreground/50">
                    No haulers yet. Add rows to the <code>haulers</code> table.
                  </td>
                </tr>
              )}
              {haulers.map((h) => (
                <tr key={h.id} className="border-t border-black/5 align-top">
                  <Td className="font-semibold">{h.name}</Td>
                  <Td>
                    <div className="text-foreground/70">{h.contact_email}</div>
                    {h.contact_phone && (
                      <div className="text-foreground/60">{h.contact_phone}</div>
                    )}
                  </Td>
                  <Td>
                    {h.address && <div>{h.address}</div>}
                    <div className="text-foreground/60">
                      {h.city ? `${h.city}, ` : ""}
                      {h.state} {h.zip}
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap text-foreground/60">
                    {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                  </Td>
                  <Td className="whitespace-nowrap">{h.service_radius_miles} mi</Td>
                  <Td>{orderCounts[h.id] ?? 0}</Td>
                  <Td>
                    {h.active ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        inactive
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-foreground/50">
          Add or edit haulers in the Supabase table editor (<code>haulers</code>).
          Each needs a name, contact email, latitude/longitude, and service
          radius. Set <code>active</code> off to pull a hauler out of matching
          without deleting their record.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-foreground/50">{label}</div>
      <div className="font-display text-2xl font-extrabold text-navy">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
