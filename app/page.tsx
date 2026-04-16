"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { useUser } from "@clerk/nextjs";

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🔗",
    title: "Shorten URL",
    desc: "Paste any long URL and get a clean short link instantly — no account required.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: "📱",
    title: "QR Code",
    desc: "Every short link gets an auto-generated QR code ready to share, embed, or print.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: "✏️",
    title: "Custom Alias",
    desc: "Choose your own memorable short code instead of a random auto-generated string.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: "📁",
    title: "Folders",
    desc: "Organize links into named folders for campaigns, projects, or clients.",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: "🔀",
    title: "Alias Groups",
    desc: "Route one short link to multiple destinations with random round-robin rotation.",
    gradient: "from-red-500/20 to-rose-500/20",
  },
  {
    icon: "🛠️",
    title: "Edit Links",
    desc: "Update the destination URL of any existing link at any time — no broken links.",
    gradient: "from-sky-500/20 to-blue-500/20",
  },
  {
    icon: "📊",
    title: "Analytics",
    desc: "Track every click with timestamp, IP address, and user agent details.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: "🗂️",
    title: "Dashboard",
    desc: "Search, filter by date, view stats, and manage all your links in one place.",
    gradient: "from-teal-500/20 to-cyan-500/20",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Paste your URL",
    desc: "Drop any long URL — blog post, product page, social profile, or document.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    n: "02",
    title: "Customize",
    desc: "Set a custom alias, prefix, or folder. Or let Snapshort auto-generate a clean code.",
    color: "from-purple-500 to-pink-500",
  },
  {
    n: "03",
    title: "Share it",
    desc: "Copy the short link or download the QR code. Share anywhere — social, print, email.",
    color: "from-green-500 to-emerald-500",
  },
  {
    n: "04",
    title: "Track & Analyze",
    desc: "Watch clicks roll in. See timestamps, IPs, and device data in the analytics dashboard.",
    color: "from-orange-500 to-red-500",
  },
];

const GUEST_FEATURES = [
  "Shorten any URL",
  "Instant QR code",
  "Custom alias",
  "Custom prefix",
];

const AUTH_FEATURES = [
  "Everything in Guest",
  "Dashboard & link management",
  "Folder organization",
  "Click analytics & charts",
  "Edit destination URLs anytime",
  "Alias groups (round-robin)",
  "IP & device tracking",
  "Date-range filtering",
];

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUpProps = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" } as const,
  transition: { duration: 0.5, delay },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { isSignedIn } = useUser();
  const heroRef = useRef<HTMLElement>(null);

  const [url, setUrl] = useState("");
  const [prefix, setPrefix] = useState("");
  const [alias, setAlias] = useState("");
  const [folder, setFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/folders")
        .then((r) => r.json())
        .then((d) => setFolders(d.data || []));
    }
  }, [isSignedIn]);

  const shortenUrl = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        body: JSON.stringify({
          originalUrl: url,
          prefix,
          alias,
          folder: showNewFolder ? newFolderName.trim() : folder,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to shorten URL");
        setLoading(false);
        return;
      }
      if (data?.data?.shortCode) {
        setShortUrl(`${window.location.origin}/${data.data.shortCode}`);
        if (isSignedIn) {
          fetch("/api/folders")
            .then((r) => r.json())
            .then((d) => setFolders(d.data || []));
        }
      }
    } catch {
      setError("Request failed");
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToHero = () =>
    heroRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="text-white relative">
      {/* ── Fixed full-page background ── */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0d0020] via-black to-[#000d20] -z-10" />

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — Hero + Shortener Form
      ══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        id="hero"
        className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      >
        {/* Blobs */}
        <div className="absolute w-[600px] h-[600px] bg-purple-600 rounded-full blur-[200px] opacity-25 animate-pulse top-[-150px] left-[-150px] pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-blue-600 rounded-full blur-[200px] opacity-25 animate-pulse bottom-[-100px] right-[-100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl w-full">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-gray-300 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Free to use · No account required to start
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight"
          >
            Shorten Links
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}Instantly
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg mb-10 max-w-xl mx-auto"
          >
            Short links · QR codes · Custom aliases · Analytics dashboard.
            Everything you need, in one place.
          </motion.p>

          {/* ── Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 flex flex-col gap-4"
          >
            <input
              type="text"
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && shortenUrl()}
              className="bg-white/90 text-black p-4 rounded-xl outline-none placeholder:text-gray-500"
            />
            <input
              type="text"
              placeholder="Custom alias (optional)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="bg-white/90 text-black p-4 rounded-xl outline-none placeholder:text-gray-500"
            />
            <input
              type="text"
              placeholder="Prefix (optional)"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="bg-white/90 text-black p-4 rounded-xl outline-none placeholder:text-gray-500"
            />
            {isSignedIn && (
              <div className="flex gap-2">
                <select
                  value={showNewFolder ? "__new__" : folder}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewFolder(true);
                      setFolder("");
                    } else {
                      setShowNewFolder(false);
                      setFolder(e.target.value);
                    }
                  }}
                  className="flex-1 bg-white/90 text-black p-4 rounded-xl outline-none"
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f} value={f}>📁 {f}</option>
                  ))}
                  <option value="__new__">+ New folder...</option>
                </select>
                {showNewFolder && (
                  <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1 bg-white/90 text-black p-4 rounded-xl outline-none"
                  />
                )}
              </div>
            )}
            {error && <p className="text-red-400 text-sm text-left">{error}</p>}
            <button
              onClick={shortenUrl}
              className="py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold text-lg"
            >
              {loading ? "Shortening..." : "Shorten →"}
            </button>
          </motion.div>

          {/* ── Result + QR ── */}
          {shortUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 flex flex-col items-center gap-6"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-5 flex gap-4 items-center w-full">
                <span className="text-lg break-all flex-1 text-left">{shortUrl}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={copyLink}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition shrink-0"
                >
                  {copied ? "Copied ✅" : "Copy"}
                </motion.button>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <QRCodeCanvas value={shortUrl} size={160} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll-down chevron */}
        <motion.button
          onClick={() =>
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
          }
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 text-gray-500 hover:text-white transition flex flex-col items-center gap-1 text-xs"
        >
          <span>Explore features</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — Features
      ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute w-[800px] h-[400px] bg-purple-700 rounded-full blur-[250px] opacity-10 top-0 left-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section header */}
          <motion.div
            {...fadeUpProps()}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              From a quick short link to full analytics — Snapshort handles it all.
            </p>
          </motion.div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUpProps(i * 0.07)}
                whileHover={{ scale: 1.03, y: -4 }}
                className="group backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — How It Works
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-blue-700 rounded-full blur-[250px] opacity-10 bottom-0 right-0 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            {...fadeUpProps()}
            className="text-center mb-16"
          >
            <span className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Up and running in seconds
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              No sign-up needed to get started. Four steps and you're sharing.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/0 via-white/10 to-blue-500/0" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...fadeUpProps(i * 0.1)}
                className="flex flex-col items-center text-center"
              >
                {/* Number circle */}
                <div
                  className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl font-black mb-5 shadow-lg`}
                >
                  <span className="relative z-10">{step.n}</span>
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} blur-md opacity-50`} />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — Guest vs Signed In
      ══════════════════════════════════════════════════════ */}
      <section id="comparison" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute w-[700px] h-[400px] bg-purple-600 rounded-full blur-[300px] opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            {...fadeUpProps()}
            className="text-center mb-16"
          >
            <span className="inline-block bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              Access levels
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Start free, unlock more
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              No account? No problem. Sign in to unlock analytics, folders, and more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest card */}
            <motion.div
              {...fadeUpProps(0)}
              className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-lg">Guest</h3>
                  <p className="text-gray-500 text-sm">No sign-in required</p>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {GUEST_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 text-gray-300 text-sm">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs shrink-0">
                      ✓
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Signed-in card */}
            <motion.div
              {...fadeUpProps(0.12)}
              className="relative backdrop-blur-lg bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-purple-500/30 rounded-2xl p-8 overflow-hidden"
            >
              {/* "Most popular" badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Full access
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-xl">
                  🔐
                </div>
                <div>
                  <h3 className="font-bold text-lg">Signed In</h3>
                  <p className="text-gray-400 text-sm">Free with a Clerk account</p>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {AUTH_FEATURES.map((feat, i) => (
                  <li key={feat} className="flex items-center gap-3 text-sm">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        i === 0
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-300"
                      }`}
                    >
                      ✓
                    </span>
                    <span className={i === 0 ? "text-green-400 font-medium" : "text-gray-200"}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 5 — Live Demo CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-purple-600 rounded-full blur-[250px] opacity-15 top-0 left-1/2 -translate-x-1/2 pointer-events-none" />

        <motion.div
          {...fadeUpProps()}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Ready to shorten
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}your first link?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            No account needed. Paste your URL and go.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToHero}
              className="relative px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-lg shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
            >
              <span className="relative z-10">Try it now →</span>
              {/* pulse ring */}
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-40 animate-ping" />
            </motion.button>

            {!isSignedIn && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                href="/dashboard"
                className="px-10 py-4 rounded-2xl border border-white/20 bg-white/5 font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                View Dashboard
              </motion.a>
            )}
          </div>

          {/* Social proof pill */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-gray-600 text-sm"
          >
            Free forever · No credit card · No rate limits
          </motion.p>
        </motion.div>
      </section>

      {/* Footer is rendered globally by app/layout.tsx */}
    </main>
  );
}
