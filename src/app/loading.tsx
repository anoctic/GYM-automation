export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse py-1" aria-busy="true" aria-label="Loading section">
      {/* Header / Title Skeleton */}
      <div className="bg-surface border border-theme rounded-[20px] p-5 space-y-3">
        <div className="h-5 w-44 rounded-lg bg-slate-200 dark:bg-[#1E2128]" />
        <div className="h-3.5 w-72 max-w-full rounded-md bg-slate-200/80 dark:bg-[#1E2128]/80" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-[#1E2128]" />
          <div className="h-7 w-24 rounded-full bg-slate-200/80 dark:bg-[#1E2128]/80" />
          <div className="h-7 w-24 rounded-full bg-slate-200/70 dark:bg-[#1E2128]/70 hidden sm:block" />
        </div>
      </div>

      {/* KPI Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-theme rounded-2xl p-3.5 space-y-2"
          >
            <div className="h-6 w-14 rounded-md bg-slate-200 dark:bg-[#1E2128]" />
            <div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-[#1E2128]/70" />
          </div>
        ))}
      </div>

      {/* Main List / Card Skeleton */}
      <div className="bg-surface border border-theme rounded-[20px] divide-y divide-theme overflow-hidden">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#1E2128] shrink-0" />
              <div className="space-y-2 flex-1 max-w-xs">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-[#1E2128]" />
                <div className="h-3 w-1/2 rounded bg-slate-200/70 dark:bg-[#1E2128]/70" />
              </div>
            </div>
            <div className="h-7 w-16 rounded-lg bg-slate-200 dark:bg-[#1E2128] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
