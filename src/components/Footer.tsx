import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© 2025 Snapshort. All rights reserved.</p>
        <Link href="/privacy" className="hover:text-gray-300 transition">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
