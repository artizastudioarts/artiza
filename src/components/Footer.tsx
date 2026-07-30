export default function Footer() {
  return (
    <footer className="border-t border-line py-8 mt-10">
      <div className="max-w-6xl mx-auto px-6 placard-label text-ink-soft">
        © {new Date().getFullYear()} Artiza Studio. All items shipped with care.
      </div>
    </footer>
  );
}
