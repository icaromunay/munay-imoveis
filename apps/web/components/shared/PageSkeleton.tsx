export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="container-base py-20 animate-pulse">
      <div className="h-4 w-40 rounded-full bg-white/10" />
      <div className="mt-6 h-12 w-full max-w-2xl rounded-2xl bg-white/10" />
      <div className="mt-4 h-6 w-full max-w-3xl rounded-2xl bg-white/10" />
      <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="h-72 bg-white/10" />
            <div className="space-y-4 p-6">
              <div className="h-3 w-32 rounded-full bg-white/10" />
              <div className="h-8 rounded-2xl bg-white/10" />
              <div className="h-5 w-2/3 rounded-2xl bg-white/10" />
              <div className="h-4 rounded-2xl bg-white/10" />
              <div className="h-4 w-4/5 rounded-2xl bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
