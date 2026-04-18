"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Application Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Something went wrong while loading this page.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Try the request again. If the problem keeps happening, inspect the
          server logs and verify database connectivity for this environment.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Try Again
          </button>
          <a
            href="/admin/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Go to Dashboard
          </a>
        </div>
        {process.env.NODE_ENV !== "production" ? (
          <pre className="mt-6 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
            {error.message}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
