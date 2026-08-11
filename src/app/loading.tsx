export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-paper"
      role="status"
      aria-live="polite"
    >
      {/* Plain <img>, not next/image — GIF animation needs to stay intact,
          which Next's automatic image optimization isn't guaranteed to preserve. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loading.gif" alt="" width={160} height={160} />
      <span className="sr-only">Laden…</span>
    </div>
  );
}
