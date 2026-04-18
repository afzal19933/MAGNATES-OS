export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <span
          className="h-3 w-3 animate-pulse rounded-full bg-slate-900"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-700">
          Loading chapter workspace...
        </p>
      </div>
    </main>
  );
}
