import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#071a14] text-white">
      {/* Hero — one composition */}
      <section className="relative min-h-screen">
        <div className="auth-brand-bg absolute inset-0" aria-hidden />
        <div className="auth-brand-grain absolute inset-0" aria-hidden />
        <div className="auth-brand-sweep absolute inset-0" aria-hidden />

        {/* Soft workshop silhouette as visual anchor */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-3xl opacity-[0.18] md:opacity-[0.28]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 45% 35% at 72% 58%, rgba(232,163,23,0.35) 0%, transparent 70%), linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.04) 55%, transparent 75%)",
          }}
        />
        <svg
          className="pointer-events-none absolute bottom-0 right-0 h-[55vh] w-auto max-w-[70vw] translate-x-[8%] opacity-[0.12] md:opacity-[0.18]"
          viewBox="0 0 640 480"
          fill="none"
          aria-hidden
        >
          <path
            d="M40 400 V180 H120 V120 H280 V180 H360 V100 H520 V180 H600 V400"
            stroke="white"
            strokeWidth="3"
          />
          <path d="M160 400 V240 H240 V400 M400 400 V220 H480 V400" stroke="white" strokeWidth="2.5" />
          <circle cx="200" cy="400" r="36" stroke="white" strokeWidth="3" />
          <circle cx="440" cy="400" r="36" stroke="white" strokeWidth="3" />
          <path d="M80 180 H200 M360 180 H500" stroke="#e8a317" strokeWidth="2" opacity="0.8" />
        </svg>

        <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 md:px-12">
          <div className="font-display text-2xl font-bold tracking-tight md:text-3xl">ServC</div>
          <Link
            href="/login"
            className="rounded-lg border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-accent hover:bg-accent hover:text-ink"
          >
            Sign in
          </Link>
        </header>

        <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center px-5 pb-24 pt-8 sm:px-8 md:px-12 lg:max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-accent animate-fade-up">
            Auto India
          </p>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl animate-fade-up">
            ServC
          </h1>
          <p
            className="mt-5 max-w-lg text-lg leading-relaxed text-white/75 md:text-xl animate-fade-up"
            style={{ animationDelay: "70ms" }}
          >
            The workshop operating system built for Indian multi-brand service centres —
            from bay to GST invoice.
          </p>
          <div
            className="mt-9 flex flex-wrap gap-3 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <Link
              href="/login"
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-ink transition hover:bg-accent-dark"
            >
              Sign in to ServC
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="relative border-t border-white/10 bg-[#0a2219] px-5 py-20 sm:px-8 md:px-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Built for how Indian workshops actually run
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/65 md:text-lg">
            ServC connects front desk, technicians, inventory, and accounts in one place.
            Customers get WhatsApp updates, digital estimate approvals, and UPI payment —
            while your team works on GST-ready job cards and invoices.
          </p>
        </div>
      </section>

      {/* Capabilities — one purpose */}
      <section className="relative border-t border-white/10 px-5 py-20 sm:px-8 md:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            What ServC covers
          </h2>
          <p className="mt-3 max-w-xl text-white/60">
            One system from booking to delivery — not a pile of spreadsheets and chat threads.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Workshop floor",
                body: "Bookings, digital check-in, inspection checklists, and job cards with bay and technician assignment.",
              },
              {
                title: "Estimates & approvals",
                body: "Line-item quotes sent on WhatsApp. Customers approve before work starts — with version history.",
              },
              {
                title: "GST & payments",
                body: "HSN/SAC tax invoices, CGST/SGST/IGST, customer GSTIN for ITC, and UPI-first collections.",
              },
            ].map((item) => (
              <div key={item.title} className="border-t border-white/15 pt-5">
                <h3 className="font-display text-xl font-semibold text-accent">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative border-t border-white/10 bg-[#06281e] px-5 py-16 sm:px-8 md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              Ready to run your workshop on ServC?
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Staff and customers sign in from the same secure portal.
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-ink transition hover:bg-accent-dark"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-6 text-xs text-white/35 sm:px-8 md:px-12">
        © {new Date().getFullYear()} ServC Auto India
      </footer>
    </div>
  );
}
