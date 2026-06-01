import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { updateHauler, deleteHauler } from "@/lib/haulers-actions";
import type { Hauler } from "@/lib/types";
import AdminLogin from "../../../admin-login";
import AdminHeader from "../../../admin-header";
import HaulerForm from "../../hauler-form";

export const dynamic = "force-dynamic";

export default async function EditHaulerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAdmin())) return <AdminLogin />;
  const { id } = await params;
  const { error } = await searchParams;

  const { data } = await supabaseAdmin.from("haulers").select("*").eq("id", id).maybeSingle();
  const hauler = data as Hauler | null;

  return (
    <main className="flex-1">
      <AdminHeader active="haulers" />
      <div className="mx-auto max-w-2xl px-5 py-6">
        {!hauler ? (
          <p className="text-foreground/60">Hauler not found.</p>
        ) : (
          <>
            <h1 className="mb-1 font-display text-2xl font-extrabold text-navy">
              Edit {hauler.name}
            </h1>
            <p className="mb-5 text-sm text-foreground/60">
              Change the ZIP to re-geocode, or set exact coordinates below.
            </p>
            <HaulerForm
              action={updateHauler}
              hauler={hauler}
              submitLabel="Save changes"
              error={error}
            />

            <form
              action={deleteHauler}
              className="mt-8 border-t border-black/10 pt-5"
            >
              <input type="hidden" name="id" value={hauler.id} />
              <button
                type="submit"
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Delete this hauler permanently
              </button>
              <p className="mt-1 text-xs text-foreground/50">
                Prefer to keep the record? Uncheck “Active” above to remove them
                from matching instead.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
