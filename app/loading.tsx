export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-black/40 backdrop-blur-sm">
      <div role="status" aria-live="polite" className="rounded-2xl border bg-card p-6 shadow-lg text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    </div>
  );
}