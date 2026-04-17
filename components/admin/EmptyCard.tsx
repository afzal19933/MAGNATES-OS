export default function EmptyCard() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">
          Content Placeholder
        </h2>
        <p className="text-sm text-slate-500">
          This section is ready for the next admin feature.
        </p>
      </div>
    </div>
  );
}
