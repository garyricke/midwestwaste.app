import { isAdmin } from "@/lib/admin-auth";
import AdminLogin from "../../admin-login";
import AdminHeader from "../../admin-header";
import ImportForm from "./import-form";

export const dynamic = "force-dynamic";

export default async function ImportHaulersPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <main className="flex-1">
      <AdminHeader active="haulers" />
      <div className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-1 font-display text-2xl font-extrabold text-navy">
          Import haulers from CSV
        </h1>
        <p className="mb-5 text-sm text-foreground/60">
          Upload a spreadsheet exported as CSV. Each row is geocoded from its ZIP
          and added to the haulers database.
        </p>
        <ImportForm />
      </div>
    </main>
  );
}
