"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <div className="sticky top-3 z-50 flex justify-center px-3 sm:px-4">
      <div className="w-full max-w-5xl">
        {/* ── Main bar ── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl px-4 sm:px-6 py-3 flex justify-between items-center"
        >
          <Link href="/" className="font-bold text-lg text-white shrink-0">
            Snap<span className="text-blue-400">short</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-5 text-gray-200">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition text-sm">
                {l.label}
              </Link>
            ))}

            <Link
              href="/"
              className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-lg text-white text-sm font-medium hover:scale-105 transition"
            >
              Create Link
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {user.imageUrl && (
                  <img src={user.imageUrl} alt="profile" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm">{user.firstName || user.fullName || "User"}</span>
                <SignOutButton>
                  <button className="min-h-[36px] px-3 py-1.5 bg-red-500 rounded-lg text-white text-sm hover:bg-red-600 transition">
                    Logout
                  </button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton>
                <button className="min-h-[36px] px-3 py-1.5 bg-green-500 rounded-lg text-white text-sm hover:bg-green-600 transition">
                  Login
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-white/10 transition gap-1.5"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 ${
                mobileOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-white transition-all duration-300 origin-center ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </motion.nav>

        {/* ── Mobile dropdown ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="mt-2 backdrop-blur-xl bg-black/80 border border-white/15 rounded-2xl p-4 flex flex-col gap-2 shadow-2xl"
            >
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="text-gray-200 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 transition text-sm font-medium min-h-[44px] flex items-center"
                >
                  {l.label}
                </Link>
              ))}

              <Link
                href="/"
                onClick={close}
                className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 rounded-xl text-white font-semibold text-sm text-center min-h-[44px] flex items-center justify-center"
              >
                Create Link
              </Link>

              <div className="border-t border-white/10 pt-3 mt-1">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.imageUrl && (
                        <img src={user.imageUrl} alt="profile" className="w-8 h-8 rounded-full" />
                      )}
                      <span className="text-gray-200 text-sm">
                        {user.firstName || user.fullName || "User"}
                      </span>
                    </div>
                    <SignOutButton>
                      <button className="min-h-[44px] px-4 py-2 bg-red-500 rounded-xl text-white text-sm hover:bg-red-600 transition">
                        Logout
                      </button>
                    </SignOutButton>
                  </div>
                ) : (
                  <SignInButton>
                    <button className="w-full min-h-[44px] py-3 bg-green-500 rounded-xl text-white hover:bg-green-600 transition font-semibold text-sm">
                      Login
                    </button>
                  </SignInButton>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
