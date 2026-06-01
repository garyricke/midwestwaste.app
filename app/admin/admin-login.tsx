export default function AdminLogin({ error }: { error?: boolean }) {
  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm rounded-2xl border-2 border-black/10 bg-white p-7">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-orange-deep">
          Midwest Waste · Admin
        </span>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy">
          Orders dashboard
        </h1>
        <form method="POST" action="/api/admin/login" className="mt-5 space-y-3">
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Admin password"
            className="w-full rounded-lg border-2 border-black/10 px-3 py-2 focus:border-navy outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-orange px-4 py-3 font-display font-bold text-white hover:bg-orange-deep"
          >
            Sign in
          </button>
          {error && (
            <p className="text-sm text-red-600">Wrong password. Try again.</p>
          )}
        </form>
      </div>
    </main>
  );
}
