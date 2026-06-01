import { isAdmin } from "@/lib/admin-auth";
import { createHauler } from "@/lib/haulers-actions";
import AdminLogin from "../../admin-login";
import AdminHeader from "../../admin-header";
import HaulerForm from "../hauler-form";

export const dynamic = "force-dynamic";

export default async function NewHaulerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) return <AdminLogin />;
  const { error } = await searchParams;

  return (
    <main className="flex-1">
      <AdminHeader active="haulers" />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-1 font-display text-2xl font-extrabold text-navy">Add a hauler</h1>
        <p className="mb-5 text-sm text-foreground/60">
          Coordinates auto-fill from the ZIP code, so you can usually leave them blank.
        </p>
        <HaulerForm action={createHauler} submitLabel="Add hauler" error={error} />
      </div>
    </main>
  );
}
