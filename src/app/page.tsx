import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
      <h1 className="text-5xl font-bold tracking-tight">LogiCal</h1>
      <p className="mt-3 text-lg text-slate-600">
        Storage slot holds — pick your side.
      </p>

      <div className="mt-12 grid w-full gap-6 sm:grid-cols-2">
        <Link
          href="/customer/signin"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-2xl font-semibold">I'm a customer</h2>
          <p className="mt-2 text-slate-600">
            Browse open dates, place a hold on a storage slot, and chat with the clerk.
          </p>
          <div className="mt-6 flex gap-3 text-sm">
            <span className="rounded-full bg-brand-500 px-4 py-1.5 font-medium text-white">
              Sign in
            </span>
            <Link
              href="/customer/signup"
              className="rounded-full border border-slate-300 px-4 py-1.5 font-medium text-slate-700"
            >
              Sign up
            </Link>
          </div>
        </Link>

        <Link
          href="/clerk/signin"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-2xl font-semibold">I'm a clerk</h2>
          <p className="mt-2 text-slate-600">
            Manage your org's calendar. Accept, decline, reschedule, and reply to customers.
          </p>
          <div className="mt-6 flex gap-3 text-sm">
            <span className="rounded-full bg-slate-900 px-4 py-1.5 font-medium text-white">
              Sign in
            </span>
            <Link
              href="/clerk/signup"
              className="rounded-full border border-slate-300 px-4 py-1.5 font-medium text-slate-700"
            >
              Sign up
            </Link>
          </div>
        </Link>
      </div>
    </main>
  );
}
