export default function AdminHeader({ active }: { active: "orders" | "haulers" }) {
  const tabClass = (isActive: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold ${
      isActive ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt="Midwest Waste"
              className="h-7 w-7 rounded ring-1 ring-white/25"
            />
            <span className="font-display text-sm font-extrabold uppercase tracking-widest text-yellow">
              Midwest Waste · Admin
            </span>
          </span>
          <nav className="flex gap-1">
            <a href="/admin" className={tabClass(active === "orders")}>
              Orders
            </a>
            <a href="/admin/haulers" className={tabClass(active === "haulers")}>
              Haulers
            </a>
          </nav>
        </div>
        <form method="POST" action="/api/admin/logout">
          <button className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
