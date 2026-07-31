import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 placard-label text-ink-soft">
        <span>© {new Date().getFullYear()} Artiza Studio. All items shipped with care.</span>
        <Link href="/terms" className="hover:text-ink">
          Terms &amp; Conditions
        </Link>
      </div>
    </footer>
  );
}
