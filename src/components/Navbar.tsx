"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

export default function Navbar() {
  const { user } = useUser(); // logged-in user info

  // Clerk v6+: profile image URL is user.imageUrl
  const profileImageUrl = user?.imageUrl;

  return (
    <div className="sticky top-4 z-50 flex justify-center">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl px-6 py-3 w-[90%] max-w-5xl flex justify-between items-center"
      >
        {/* Logo */}
        <Link href="/" className="font-bold text-lg text-white">
          Snap<span className="text-blue-400">short</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-gray-200">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition"
          >
            Create Link
          </Link>

          {/* ===== Logged-in vs Guest view ===== */}
          {user ? (
            <div className="flex items-center gap-3">
              {profileImageUrl && (
                <img
                  src={profileImageUrl}
                  alt="profile"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>{user.firstName || user.fullName || "User"}</span>
              <SignOutButton>
                <button className="px-3 py-1 bg-red-500 rounded text-white hover:bg-red-600 transition">
                  Logout
                </button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton>
              <button className="px-3 py-1 bg-green-500 rounded text-white hover:bg-green-600 transition">
                Login
              </button>
            </SignInButton>
          )}
        </div>
      </motion.nav>
    </div>
  );
}