import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          This page does not exist.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The route may have moved, or the link may be outdated. Use one of the
          quick links below to get back into the application.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Open Dashboard
          </Link>
          <Link
            href="/asks"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open Asks
          </Link>
        </div>
      </div>
    </main>
  );
}
