"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();

  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchLinks = async () => {
    setLoading(true);

    const query = new URLSearchParams({
      search,
      startDate,
      endDate,
    });

    const res = await fetch(`/api/links?${query}`);
    const data = await res.json();

    setLinks(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchLinks();
    }
  }, [isSignedIn]);

  // 🔄 Loading Clerk state
  if (!isLoaded) {
    return <p className="text-white text-center mt-20">Loading...</p>;
  }

  // 🚫 Not logged in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6">
        <h1 className="text-3xl font-bold mb-4">Please login</h1>

        <p className="text-gray-400 mb-6">
          You need to login to access your dashboard.
        </p>

        <SignInButton>
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-lg font-medium hover:scale-105 transition">
            Login
          </button>
        </SignInButton>
      </div>
    );
  }

  // 🔐 Logged-in dashboard
  return (
    <main className="min-h-screen text-white relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-black to-blue-700 opacity-80"></div>

      <div className="absolute w-[600px] h-[600px] bg-purple-500 rounded-full blur-[200px] opacity-30 animate-pulse top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[200px] opacity-30 animate-pulse bottom-[-100px] right-[-100px]"></div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10">

        <h1 className="text-4xl font-bold mb-6">Dashboard</h1>
        

        {/* 🔍 Search + Filters */}
        <div className="backdrop-blur-lg bg-white border border-white/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Search by URL or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 rounded-lg text-black outline-none"
          />

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 rounded-lg text-black"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 rounded-lg text-black"
          />

          <button
            onClick={fetchLinks}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-lg font-medium hover:scale-105 transition"
          >
            Apply
          </button>
        </div>

        {/* Loading */}
        {loading && <p className="text-gray-300">Loading links...</p>}

        {/* Empty */}
        {!loading && links.length === 0 && (
          <p className="text-gray-400">No links found.</p>
        )}

        {/* Links */}
        <div className="grid gap-4">
          {links.map((link) => (
            <motion.div
              key={link._id}
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-5 flex justify-between items-center"
            >
              <div className="flex flex-col gap-1">

                <span className="text-gray-300 text-sm truncate max-w-md">
                  {link.originalUrl}
                </span>

                <a
                  href={`${window.location.origin}/${link.shortCode}`}
                  target="_blank"
                  className="text-blue-400 font-medium"
                >
                  {window.location.origin}/{link.shortCode}
                </a>

                <a
                    href={`/dashboard/${link.shortCode}`}
                    className="text-sm text-purple-400 mt-2"
                    >
                    View Analytics →
                </a>

              </div>

              <div className="text-right text-sm text-gray-400">
                <p>Clicks: {link.clicks || 0}</p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}