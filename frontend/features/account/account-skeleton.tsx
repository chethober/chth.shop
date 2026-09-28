export function AccountSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-6" aria-busy="true" aria-label="Loading account">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-7 w-44 rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-8">
        <div className="hidden w-60 space-y-2 lg:block">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
