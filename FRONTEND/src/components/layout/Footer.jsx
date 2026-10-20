export default function Footer() {
  return (
    <footer className="border-t border-line px-8 py-4 text-center text-sm text-muted">
      © {new Date().getFullYear()} 5 Minute Security Check
    </footer>
  );
}